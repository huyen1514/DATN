"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import BookmarkButton from "@/components/BookmarkButton";
import {
  Lightbulb,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Bookmark,
  ArrowUp,
} from "lucide-react";
import LessonProgressSidebar from "@/components/LessonProgressSidebar";

interface Level {
  levelId: number;
  levelName: string;
}

interface Lesson {
  lessonId: number;
  lessonName?: string;
  level?: Level;
  skillType?: string;
  levelId: number;
}

interface GrammarItem {
  grammarId: number;
  lessonId: number;
  grammarName: string;
  structure: string;
  meaning: string;
  example: string;
}

interface BookmarkItem {
  bookmarkId: number;
  itemId: number;
  type: string;
}

export default function GrammarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [levels, setLevels] = useState<Level[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [grammars, setGrammars] = useState<GrammarItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number>(0);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkLoadingKey, setBookmarkLoadingKey] = useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showTopBtn, setShowTopBtn] = useState(false);

  const hasInitProgress = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // 1. TẢI DỮ LIỆU & FIX LỖI LỌC BÀI HỌC
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const levelsData = await api("/levels");
      const allLevels = Array.isArray(levelsData) ? (levelsData as Level[]) : [];
      setLevels(allLevels);

      // Tìm Level ID chuẩn từ URL (không phân biệt hoa thường)
      const targetLevel = allLevels.find(
        (l) => l.levelName.toLowerCase() === levelName.toLowerCase()
      );

      if (!targetLevel) {
        console.error("Không tìm thấy Level phù hợp");
        return;
      }

      // Gọi API lấy bài học theo Level chuẩn và lấy ngữ pháp bài hiện tại
      const [levelLessonsData, lessonData, allGrammarsData] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api(`/lessons/${lessonId}`),
        api(`/grammars?lessonId=${lessonId}`),
      ]);

      if (Array.isArray(levelLessonsData)) {
        // Chỉ lấy bài học thuộc loại Ngữ pháp hoặc Tự do
        const filtered = levelLessonsData.filter(
          (l: Lesson) => !l.skillType || l.skillType === "Ngữ pháp" || l.skillType === "Tự do"
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allGrammarsData)) {
        // Có thể filter lại một lần nữa ở Client cho chắc chắn
        setGrammars(allGrammarsData.filter(g => g.lessonId === lessonId));
      }
    } catch (e) {
      console.error("Load Data Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  // 2. TẢI BOOKMARK & FIX LỖI LƯU
  const loadBookmarks = useCallback(async (targetUserId: number) => {
    if (!targetUserId) return;
    try {
      const data = await api(`/bookmark/${targetUserId}`);
      setBookmarks(Array.isArray(data) ? (data as BookmarkItem[]) : []);
    } catch (e) {
      console.error("Could not load bookmarks", e);
    }
  }, []);

  const hasBookmark = useCallback(
    (itemId: number, type: "Lesson" | "Grammar") =>
      bookmarks.some(
        (b) => b.itemId === itemId && b.type.toLowerCase() === type.toLowerCase()
      ),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (itemId: number, type: "Lesson" | "Grammar") => {
      if (!userId) {
        alert("Vui lòng đăng nhập để sử dụng tính năng lưu bài học!");
        return;
      }

      const loadingKey = `${type}-${itemId}`;
      setBookmarkLoadingKey(loadingKey);

      try {
        // Backend BookmarkController đang dùng API toggle qua POST.
        await api("/bookmark", "POST", { userId, itemId, type });
        await loadBookmarks(userId);
      } catch (e: any) {
        alert("Lỗi Bookmark: " + (e.message || "Không thể kết nối API"));
      } finally {
        setBookmarkLoadingKey(null);
      }
    },
    [hasBookmark, loadBookmarks, userId]
  );

  // 3. XỬ LÝ CHUYỂN BÀI & TIẾN ĐỘ
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonId - b.lessonId),
    [lessons]
  );

  const currentLessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.lessonId === lessonId),
    [sortedLessons, lessonId]
  );

  const getDisplayLessonName = useCallback(
    (targetLessonId: number) => {
      const idx = sortedLessons.findIndex((l) => l.lessonId === targetLessonId);
      if (idx < 0) return `Bài ${targetLessonId}`;
      return `Bài ${idx + 1}`;
    },
    [sortedLessons]
  );

  const progressPercentage = useMemo(() => {
    if (sortedLessons.length === 0) return 0;
    return Math.round(((currentLessonIndex + 1) / sortedLessons.length) * 100);
  }, [currentLessonIndex, sortedLessons.length]);

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      const prev = sortedLessons[currentLessonIndex - 1];
      void goToLesson(prev.lessonId);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < sortedLessons.length - 1) {
      const next = sortedLessons[currentLessonIndex + 1];
      void goToLesson(next.lessonId);
    }
  };

  const updateStatus = useCallback(
    async (status: string, currentUserId: number = userId) => {
      if (!currentUserId) return;
      try {
        await api("/progress/upsert", "POST", {
          userId: currentUserId,
          lessonId,
          partType: "Grammar",
          status,
          score: null,
        });
      } catch (e) {
        console.error("Could not update grammar progress", e);
      }
    },
    [lessonId, userId]
  );

  const goToLesson = useCallback(
    async (targetLessonId: number) => {
      if (!targetLessonId || targetLessonId === lessonId || isNavigating) return;
      setIsNavigating(true);
      await updateStatus("Completed");
      router.push(`/grammar/${levelName}/${targetLessonId}`);
    },
    [lessonId, levelName, router, updateStatus, isNavigating]
  );

  // 4. HIỆU ỨNG CUỘN TRANG (BACK TO TOP)
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // 5. KHỞI TẠO USER & DATA
  useEffect(() => {
    let uId = 0;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        uId = JSON.parse(userStr).userId;
        setUserId(uId);
      } catch (e) { }
    }

    void loadData();
    if (uId > 0 && !hasInitProgress.current) {
      hasInitProgress.current = true;
      void loadBookmarks(uId);
      void updateStatus("InProgress", uId);
    }
  }, [loadData, loadBookmarks, lessonId, updateStatus]);

  // 6. LỌC NGỮ PHÁP TẠI CHỖ
  const filteredGrammars = useMemo(() => {
    const kw = searchKeyword.toLowerCase().trim();
    if (!kw) return grammars;
    return grammars.filter(g =>
      g.grammarName.toLowerCase().includes(kw) ||
      g.meaning.toLowerCase().includes(kw)
    );
  }, [grammars, searchKeyword]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        {/* SIDEBAR */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24 z-10">
          <div className="shrink-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#a71f48]">Tiến độ học tập</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Lộ trình {levelName.toUpperCase()}</p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Hoàn thành</span>
                <span className="text-[#a71f48] font-bold">{progressPercentage}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#a71f48] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          <LessonProgressSidebar lessonId={lessonId} userId={userId} levelName={levelName} />
          <div className="mt-6">
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-sm">
                <Lightbulb size={16} /> <span>Mẹo học tốt</span>
              </div>
              <p className="text-xs text-amber-700/80 leading-relaxed">
                Đừng chỉ đọc, hãy thử đặt câu mới với mỗi cấu trúc bạn vừa học nhé!
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Ngữ pháp</h1>
              <p className="mt-2 flex items-center gap-2 text-base text-slate-500">
                <span className="font-semibold text-[#a71f48]">{levelName.toUpperCase()}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                <span>{getDisplayLessonName(lessonId)}</span>
              </p>
            </div>
            <BookmarkButton
              active={hasBookmark(lessonId, "Lesson")}
              loading={bookmarkLoadingKey === `Lesson-${lessonId}`}
              label={`Lưu ${getDisplayLessonName(lessonId)}`}
              onClick={() => void toggleBookmark(lessonId, "Lesson")}
            />
          </div>

          {/* BỘ LỌC TÌM KIẾM & CHỌN BÀI */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_150px_170px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm ngữ pháp hoặc ý nghĩa..."
                className="h-10 w-full rounded-xl border-none bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#a71f48]"
              />
            </div>
            <div className="relative">
              <select
                value={levels.find(l => l.levelName.toLowerCase() === levelName.toLowerCase())?.levelName || levelName}
                onChange={(e) => router.push(`/grammar/${e.target.value}`)}
                className="h-10 w-full appearance-none rounded-xl bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#a71f48] cursor-pointer"
              >
                {levels.map((l) => <option key={l.levelId} value={l.levelName}>{l.levelName.toUpperCase()}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
            <div className="relative">
              <select
                value={String(lessonId)}
                onChange={(e) => void goToLesson(Number(e.target.value))}
                className="h-10 w-full appearance-none rounded-xl bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#a71f48] cursor-pointer"
              >
                {sortedLessons.map((l) => (
                  <option key={l.lessonId} value={String(l.lessonId)}>
                    {getDisplayLessonName(l.lessonId)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>

          {/* DANH SÁCH NGỮ PHÁP */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48] mx-auto"></div></div>
            ) : filteredGrammars.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">Không tìm thấy kết quả.</div>
            ) : (
              filteredGrammars.map((g, idx) => (
                <article key={g.grammarId} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-rose-300 transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a71f48]"></div>
                  <div className="p-6 md:p-8 pl-10">
                    <div className="flex gap-6 items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xl font-bold text-[#a71f48]">{idx + 1}</div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-2xl font-serif font-bold text-[#a71f48]">{g.grammarName}</h3>
                          <button
                            onClick={() => void toggleBookmark(g.grammarId, "Grammar")}
                            disabled={bookmarkLoadingKey === `Grammar-${g.grammarId}`}
                            className={`rounded-full p-2.5 transition-all border ${hasBookmark(g.grammarId, "Grammar") ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"}`}
                          >
                            <Bookmark size={22} fill={hasBookmark(g.grammarId, "Grammar") ? "currentColor" : "none"} className={hasBookmark(g.grammarId, "Grammar") ? "text-amber-500" : "text-slate-400"} />
                          </button>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ý nghĩa</span>
                          <div className="text-base font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: g.meaning?.replace(/\n/g, '<br/>') }} />
                        </div>
                        <div className="rounded-xl bg-rose-50/50 p-4 border border-rose-100">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-[#a71f48] mb-1">Cấu trúc</span>
                          <div className="text-lg font-bold text-slate-800" dangerouslySetInnerHTML={{ __html: g.structure?.replace(/\n/g, '<br/>') }} />
                        </div>
                        {g.example && (
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ví dụ</span>
                            <div className="text-base text-slate-700" dangerouslySetInnerHTML={{ __html: g.example?.replace(/\n/g, '<br/>') }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* CHUYỂN BÀI HỌC */}
          {!isLoading && lessons.length > 0 && (
            <div className="mt-8 flex justify-between items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <button
                onClick={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold transition-all disabled:opacity-30"
              >
                <ChevronLeft size={20} /> Bài học trước
              </button>
              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex >= sortedLessons.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-[#a71f48] hover:bg-[#8e1a3d] text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-all disabled:opacity-30"
              >
                Bài tiếp theo <ChevronRight size={20} />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* BACK TO TOP */}
      {showTopBtn && (
        <button onClick={scrollToTop} className="fixed bottom-8 right-8 z-50 h-14 w-14 flex items-center justify-center rounded-full bg-slate-800 text-white shadow-2xl hover:bg-[#a71f48] transition-all animate-bounce">
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}