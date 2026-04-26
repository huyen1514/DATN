"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import BookmarkButton from "@/components/BookmarkButton";
import KanjiStroke from "@/components/KanjiStroke";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Lightbulb,
  Bookmark,
  Layers
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
}

interface KanjiItem {
  kanjiId: number;
  lessonId: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi?: string;
  example: string;
}

interface BookmarkItem {
  bookmarkId: number;
  itemId: number;
  type: string;
}

export default function KanjiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<number>(0);

  const [levels, setLevels] = useState<Level[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kanjis, setKanjis] = useState<KanjiItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkLoadingKey, setBookmarkLoadingKey] = useState<string | null>(null);
  const [isStartingFlashcard, setIsStartingFlashcard] = useState(false);

  // STATE ĐIỀU HƯỚNG KANJI (Hiển thị 1 chữ / trang)
  const [currentKanjiIndex, setCurrentKanjiIndex] = useState(0);

  // 1. KIỂM TRA ĐĂNG NHẬP (AUTH GUARD)
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(userStr);
      const uId = u.id || u.userId;
      if (!uId || uId <= 0) {
        router.push("/login");
        return;
      }
      setUserId(uId);
      setIsCheckingAuth(false);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // 2. TẢI DỮ LIỆU BÀI HỌC VÀ KANJI
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const levelsData = await api("/levels");
      const allLevels = Array.isArray(levelsData) ? (levelsData as Level[]) : [];
      setLevels(allLevels);

      const targetLevel = allLevels.find(
        (l) => l.levelName.toLowerCase() === levelName.toLowerCase()
      );

      if (!targetLevel) return;

      const [levelLessonsData, lessonData, allKanjisData] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api(`/lessons/${lessonId}`),
        api(`/kanjis?lessonId=${lessonId}`),
      ]);

      if (Array.isArray(levelLessonsData)) {
        const filtered = levelLessonsData.filter(
          (l: Lesson) => !l.skillType || l.skillType === "Hán tự" || l.skillType === "Kanji" || l.skillType === "Tự do"
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allKanjisData)) {
        setKanjis(allKanjisData.filter(k => k.lessonId === lessonId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  // 3. TẢI VÀ QUẢN LÝ BOOKMARK
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
    (itemId: number, type: "Lesson" | "Kanji") =>
      bookmarks.some(
        (b) => b.itemId === itemId && b.type.toLowerCase() === type.toLowerCase()
      ),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (itemId: number, type: "Lesson" | "Kanji") => {
      if (!userId) return;

      // Lính gác chống lỗi 400 Bad Request
      if (!itemId) {
        alert(`Lỗi hệ thống: Không tìm thấy ID của ${type} này.`);
        return;
      }

      const loadingKey = `${type}-${itemId}`;
      setBookmarkLoadingKey(loadingKey);

      try {
        if (hasBookmark(itemId, type)) {
          await api("/bookmark", "DELETE", { userId, itemId, type });
        } else {
          await api("/bookmark", "POST", { userId, itemId, type });
        }
        await loadBookmarks(userId);
      } catch (e) {
        alert("Lỗi khi lưu Bookmark!");
      } finally {
        setBookmarkLoadingKey(null);
      }
    },
    [hasBookmark, loadBookmarks, userId]
  );

  // 4. GỌI API BAN ĐẦU
  useEffect(() => {
    if (!isCheckingAuth && userId > 0) {
      void loadData();
      void loadBookmarks(userId);
      api("/progress/upsert", "POST", {
        userId,
        lessonId,
        partType: "Kanji",
        status: "InProgress",
      }).catch(() => { });
    }
  }, [isCheckingAuth, userId, lessonId, loadData, loadBookmarks]);

  // 5. CÁC HÀM ĐIỀU HƯỚNG BÀI HỌC
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonId - b.lessonId),
    [lessons]
  );

  const currentLessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.lessonId === lessonId),
    [sortedLessons, lessonId]
  );

  const progressPercentage = useMemo(() => {
    if (sortedLessons.length === 0) return 0;
    return Math.round(((currentLessonIndex + 1) / sortedLessons.length) * 100);
  }, [currentLessonIndex, sortedLessons.length]);

  const goToLesson = useCallback(
    async (targetLessonId: number) => {
      if (!targetLessonId || targetLessonId === lessonId) return;
      router.push(`/kanji/${levelName}/${targetLessonId}`);
    },
    [lessonId, levelName, router]
  );

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = sortedLessons[currentLessonIndex - 1];
      void goToLesson(prevLesson.lessonId);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < sortedLessons.length - 1) {
      const nextLesson = sortedLessons[currentLessonIndex + 1];
      void goToLesson(nextLesson.lessonId);
    }
  };

  const handleStartFlashcard = async () => {
    if (isStartingFlashcard) return;

    setIsStartingFlashcard(true);
    try {
      // Đánh dấu hoàn thành bài học khi bắt đầu Flashcard
      await api("/progress/upsert", "POST", {
        userId,
        lessonId,
        partType: "Kanji",
        status: "Completed",
      });

      const result = await api(`/prebuilt-flashcards/start/kanji/${lessonId}`, "POST");
      if (result?.deckId) {
        router.push(`/learn/${result.deckId}`);
      } else {
        alert("Không tạo được bộ thẻ cho bài này. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error("Could not start flashcard lesson", e);
      alert("Có lỗi khi mở flashcard. Vui lòng thử lại.");
    } finally {
      setIsStartingFlashcard(false);
    }
  };


  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48]"></div>
      </div>
    );
  }

  const currentKanji = kanjis[currentKanjiIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">

        {/* SIDEBAR */}
        <aside className="sticky top-24 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="shrink-0 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-[#a71f48] lg:text-2xl">Lộ trình Kanji</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{levelName.toUpperCase()}</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Tiến độ</span>
                <span className="font-bold text-[#a71f48]">{progressPercentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#a71f48] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <LessonProgressSidebar lessonId={lessonId} userId={userId} levelName={levelName} />

          <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-100 hidden lg:block">
            <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-xs uppercase tracking-wider">
              <Lightbulb size={14} /><span>Mẹo học tốt</span>
            </div>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Hãy chú ý kỹ vào thứ tự nét vẽ và tự dùng tay viết lại trên không khí (Air writing) để não bộ ghi nhớ sâu hơn nhé!
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex flex-col gap-6">

          {/* HEADER BÀI HỌC */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Học Hán Tự (Kanji)
              </h1>
              <p className="mt-2 flex items-center gap-2 text-base font-medium text-slate-500">
                <span className="font-bold text-[#a71f48]">{levelName.toUpperCase()}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                <span>{lessonName || `Bài ${lessonId}`}</span>
              </p>
            </div>
            <BookmarkButton
              active={hasBookmark(lessonId, "Lesson")}
              loading={bookmarkLoadingKey === `Lesson-${lessonId}`}
              label={`Lưu bài ${lessonName || lessonId}`}
              onClick={() => void toggleBookmark(lessonId, "Lesson")}
            />
          </div>

          {/* HIỂN THỊ KANJI (1 CHỮ / TRANG) */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-32 shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48]"></div>
                <p className="mt-4 text-slate-500 font-medium">Đang tải Hán tự...</p>
              </div>
            ) : kanjis.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white py-32 text-center text-slate-500 shadow-sm font-medium">
                Chưa có chữ Kanji nào cho bài học này.
              </div>
            ) : currentKanji ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-md relative overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Ribbon Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10 opacity-50"></div>

                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-start">

                  {/* TRÁI: Ô chữ Kanji khổng lồ */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative flex h-56 w-full items-center justify-center rounded-3xl bg-slate-50 border-2 border-slate-100 shadow-inner overflow-hidden group">
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50%_50%]"></div>
                      <div className="absolute inset-0 pointer-events-none opacity-20 border-x border-y border-dashed border-slate-400 m-auto h-full w-[1px]"></div>
                      <div className="absolute inset-0 pointer-events-none opacity-20 border-x border-y border-dashed border-slate-400 m-auto h-[1px] w-full"></div>

                      <span className="text-8xl md:text-[140px] font-medium text-[#a71f48] drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                        {currentKanji.character}
                      </span>

                      {/* FIX LỖI BOOKMARK 400 BẰNG CÁCH LẤY ID CHUẨN */}
                      {(() => {
                        const targetKanjiId = currentKanji.kanjiId || (currentKanji as any).id;
                        const isKanjiBookmarked = hasBookmark(targetKanjiId, "Kanji");

                        return (
                          <button
                            onClick={() => void toggleBookmark(targetKanjiId, "Kanji")}
                            disabled={bookmarkLoadingKey === `Kanji-${targetKanjiId}`}
                            className={`absolute top-4 right-4 rounded-full p-2.5 transition-all border shadow-sm ${isKanjiBookmarked
                              ? "bg-amber-100 border-amber-300"
                              : "bg-white border-slate-200 hover:bg-amber-50"
                              }`}
                            title={isKanjiBookmarked ? "Bỏ lưu Kanji này" : "Lưu Kanji này"}
                          >
                            <Bookmark
                              size={20}
                              fill={isKanjiBookmarked ? "currentColor" : "none"}
                              className={isKanjiBookmarked ? "text-amber-500" : "text-slate-400"}
                            />
                          </button>
                        );
                      })()}
                    </div>

                    <div className="w-full rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-center text-slate-400">Thứ tự nét vẽ</span>
                      <div className="flex justify-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                        <KanjiStroke character={currentKanji.character} size={150} />
                      </div>
                    </div>
                  </div>

                  {/* PHẢI: Thông tin chi tiết */}
                  <div className="flex flex-col gap-8 pt-2">
                    <div>
                      <span className="block text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Nghĩa Hán Việt</span>
                      <h2 className="text-4xl font-extrabold text-slate-800 uppercase tracking-wide">
                        {currentKanji.meaning}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-blue-50/70 p-5 border border-blue-100">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-blue-500">Âm Kun (Kunyomi)</span>
                        <p className="text-xl font-bold text-blue-800">{currentKanji.kunyomi || "---"}</p>
                      </div>
                      <div className="rounded-2xl bg-rose-50/70 p-5 border border-rose-100">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-rose-500">Âm On (Onyomi)</span>
                        <p className="text-xl font-bold text-[#a71f48]">{currentKanji.onyomi || "---"}</p>
                      </div>
                    </div>

                    {currentKanji.example && (
                      <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 mt-2">
                        <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-400">Ví dụ & Giải nghĩa</span>
                        <div
                          className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap font-medium space-y-2"
                          dangerouslySetInnerHTML={{ __html: currentKanji.example.replace(/\n/g, '<br/>') }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* ĐIỀU HƯỚNG TỪNG CHỮ (TRƯỚC / TIẾP THEO) */}
          {!isLoading && kanjis.length > 0 && (
            <div className="flex flex-col gap-6">

              {/* Thanh điều khiển chữ */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setCurrentKanjiIndex(prev => prev - 1)}
                  disabled={currentKanjiIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={20} /> <span className="hidden sm:inline">Chữ trước</span>
                </button>

                <div className="text-sm font-bold text-slate-500 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 tracking-widest">
                  {currentKanjiIndex + 1} / {kanjis.length}
                </div>

                <button
                  onClick={() => setCurrentKanjiIndex(prev => prev + 1)}
                  disabled={currentKanjiIndex === kanjis.length - 1}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <span className="hidden sm:inline">Chữ tiếp</span> <ChevronRight size={20} />
                </button>
              </div>

              {/* Nút Hoàn thành & Ôn tập Flashcard (Chỉ hiện khi xem đến chữ cuối cùng) */}
              {currentKanjiIndex === kanjis.length - 1 && (
                <div className="mt-4 p-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200 text-center shadow-sm animate-in zoom-in-95 duration-500">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500 mb-4 shadow-inner">
                    <Layers size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-2">Tuyệt vời! Bạn đã học xong tất cả Kanji.</h3>
                  <p className="text-amber-700 mb-6 font-medium">Bây giờ là lúc kiểm tra trí nhớ của bạn với công cụ Flashcard.</p>
                  <button
                    onClick={handleStartFlashcard}
                    disabled={isStartingFlashcard}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-orange-200 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isStartingFlashcard ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Zap size={22} fill="currentColor" />
                    )}
                    {isStartingFlashcard ? "Đang mở thẻ..." : "Ôn tập Flashcard ngay"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NÚT CHUYỂN BÀI HỌC (TRƯỚC / SAU) */}
          {!isLoading && lessons.length > 0 && (
            <div className="mt-8 flex justify-between items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex-wrap">
              <button
                onClick={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                <ChevronLeft size={20} /> Bài trước
              </button>

              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex >= sortedLessons.length - 1}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#a71f48] hover:bg-[#8e1a3d] text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-1 sm:flex-none"
              >
                Bài tiếp theo <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* MENU CÁC BÀI HỌC Ở DƯỚI CÙNG */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-slate-200 pt-8 pb-10">
            {sortedLessons.map((lesson, idx) => (
              <Link
                key={lesson.lessonId}
                href={`/kanji/${levelName}/${lesson.lessonId}`}
                onClick={(e) => {
                  e.preventDefault();
                  void goToLesson(lesson.lessonId);
                }}
                className={`rounded-full border px-4 py-1.5 text-xs sm:text-sm font-semibold transition ${lesson.lessonId === lessonId
                  ? "border-[#a71f48] bg-[#a71f48] text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                Bài {idx + 1}
              </Link>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}