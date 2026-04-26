"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Volume2,
  Bookmark,
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

interface VocabularyItem {
  vocabularyId: number;
  lessonId: number;
  word: string;
  reading?: string;
  meaning?: string;
  partOfSpeech?: string;
  example?: string;
  audioUrl?: string;
}

interface BookmarkItem {
  bookmarkId: number;
  itemId: number;
  type: string;
  itemName?: string;
}

export default function VocabularyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [levels, setLevels] = useState<Level[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [vocabs, setVocabs] = useState<VocabularyItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [userId, setUserId] = useState<number>(1);
  
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkLoadingKey, setBookmarkLoadingKey] = useState<string | null>(null);
  const [isStartingFlashcard, setIsStartingFlashcard] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const levelsData = await api("/levels");
      const allLevels = Array.isArray(levelsData) ? (levelsData as Level[]) : [];
      setLevels(allLevels);

      const targetLevel = allLevels.find(
        (level) => level.levelName.toLowerCase() === levelName.toLowerCase()
      );

      if (!targetLevel) {
        setLessons([]);
        setVocabs([]);
        setLessonName("");
        return;
      }

      const [levelLessonsData, lessonData, allVocabsData] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api(`/lessons/${lessonId}`),
        api(`/vocabularies?lessonId=${lessonId}`),
      ]);

      if (Array.isArray(levelLessonsData)) {
        const vocabLessons = (levelLessonsData as Lesson[]).filter(
          (l) => !l.skillType || l.skillType === "Từ vựng" || l.skillType === "Tự do"
        );
        setLessons(vocabLessons);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allVocabsData)) {
        setVocabs(allVocabsData as VocabularyItem[]);
      }
    } catch (e) {
      console.error(e);
      setLessons([]);
      setVocabs([]);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

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
    (itemId: number, type: "Lesson" | "Vocabulary") =>
      bookmarks.some(
        (bookmark) =>
          bookmark.itemId === itemId &&
          bookmark.type.toLowerCase() === type.toLowerCase()
      ),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (itemId: number, type: "Lesson" | "Vocabulary") => {
      if (!userId) return;

      const loadingKey = `${type}-${itemId}`;
      setBookmarkLoadingKey(loadingKey);

      try {
        await api("/bookmark", "POST", { userId, itemId, type });
        await loadBookmarks(userId);
      } catch (e) {
        console.error("Could not update bookmark", e);
      } finally {
        setBookmarkLoadingKey(null);
      }
    },
    [loadBookmarks, userId]
  );

  const fetchProgress = useCallback(async (currentUserId: number) => {
    try {
      const prog = await api(`/progress/lesson/${lessonId}/user/${currentUserId}`);
      if (prog && prog.parts) {
        const vocabPart = prog.parts.find((p: any) => p.partType === "Vocabulary");
        if (vocabPart && vocabPart.status === "Completed") return;
      }
    } catch (e) {
      // Ignore 404
    }
  }, [lessonId]);

  const updateStatus = useCallback(async (status: string, currentUserId: number = userId) => {
    if (!currentUserId) return;
    try {
      await api("/progress/upsert", "POST", {
        userId: currentUserId,
        lessonId,
        partType: "Vocabulary",
        status,
        score: null
      });
    } catch (e) {
      console.error("Could not update progress", e);
    }
  }, [lessonId, userId]);

  useEffect(() => {
    let currentUserId = 1;
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        currentUserId = u.userId;
        setUserId(currentUserId);
      } catch (e) {}
    }

    void loadData();
    void loadBookmarks(currentUserId);
    void fetchProgress(currentUserId);
    void updateStatus("InProgress", currentUserId);
  }, [lessonId, levelName, loadData, loadBookmarks, fetchProgress, updateStatus]);

  const goToLesson = useCallback(
    async (targetLessonId: number) => {
      if (!targetLessonId || targetLessonId === lessonId) return;
      await updateStatus("Completed");
      router.push(`/vocabulary/${levelName}/${targetLessonId}`);
    },
    [lessonId, levelName, router, updateStatus]
  );

  const handleStartFlashcard = async () => {
    if (isStartingFlashcard) return;

    setIsStartingFlashcard(true);
    try {
      const result = await api(`/prebuilt-flashcards/start/vocab/${lessonId}`, "POST");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, lessonId]);

  const levelLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonId - b.lessonId),
    [lessons]
  );

  const filteredVocabs = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return vocabs.filter((item) => {
      const matchesKeyword =
        keyword.length === 0 ||
        item.word.toLowerCase().includes(keyword) ||
        item.reading?.toLowerCase().includes(keyword) ||
        item.meaning?.toLowerCase().includes(keyword);
      const matchesLesson = item.lessonId === lessonId;
      return matchesKeyword && matchesLesson;
    });
  }, [vocabs, searchKeyword, lessonId]);

  const totalPages = Math.max(1, Math.ceil(filteredVocabs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedVocabs = filteredVocabs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const currentLessonIndex = useMemo(
    () => levelLessons.findIndex((l) => l.lessonId === lessonId),
    [levelLessons, lessonId]
  );

  const progressPercentage = useMemo(() => {
    if (levelLessons.length === 0) return 0;
    return Math.round(((currentLessonIndex + 1) / levelLessons.length) * 100);
  }, [currentLessonIndex, levelLessons.length]);

  // HÀM CHUYỂN TRANG MỚI: Cập nhật state + Cuộn mượt mà lên đầu trang
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (newPage === totalPages) {
      updateStatus("Completed");
    }
    // Lệnh cuộn lên đỉnh màn hình
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">

        {/* Sidebar */}
        <aside className="sticky top-24 flex max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="shrink-0 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-[#a71f48] lg:text-2xl">Lộ trình học tập</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Khóa {levelName.toUpperCase()}</p>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Hoàn thành</span>
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
        </aside>

        {/* Main Content */}
        <main className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Danh sách Từ vựng
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500 sm:text-base">
                <span className="font-bold text-[#a71f48]">{levelName.toUpperCase()}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                <span>{lessonName || `Bài ${lessonId}`}</span>
              </p>
            </div>
            
            <button
              onClick={() => void toggleBookmark(lessonId, "Lesson")}
              disabled={bookmarkLoadingKey === `Lesson-${lessonId}`}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                hasBookmark(lessonId, "Lesson")
                  ? "bg-amber-100 text-amber-600 border border-amber-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bookmark 
                size={18} 
                className={hasBookmark(lessonId, "Lesson") ? "fill-amber-500 text-amber-500" : ""} 
              />
              {hasBookmark(lessonId, "Lesson") ? "Đã lưu bài học" : `Lưu bài ${lessonName || lessonId}`}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_150px_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm từ vựng, Hiragana hoặc ý nghĩa..."
                className="h-10 w-full rounded-xl border-none bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#a71f48]"
              />
            </div>
            <div className="relative">
              <select
                value={levelName}
                onChange={(e) => {
                  window.location.href = `/vocabulary/${e.target.value}`;
                }}
                className="h-10 w-full appearance-none rounded-xl border-none bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#a71f48]"
              >
                {levels.map((level) => (
                  <option key={level.levelId} value={level.levelName}>
                    {level.levelName.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
            <div className="relative">
              <select
                value={lessonId}
                onChange={(e) => {
                  void goToLesson(Number(e.target.value));
                }}
                className="h-10 w-full appearance-none rounded-xl border-none bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#a71f48]"
              >
                {levelLessons.map((lesson) => (
                  <option key={lesson.lessonId} value={lesson.lessonId}>
                    {lesson.lessonName || `Bài học ${lesson.lessonId}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48]"></div>
                <p className="mt-4 text-sm text-slate-500">Đang tải dữ liệu...</p>
              </div>
            ) : filteredVocabs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500 shadow-sm">
                Không tìm thấy từ vựng nào phù hợp với tìm kiếm của bạn.
              </div>
            ) : (
              pagedVocabs.map((v) => (
                <article
                  key={v.vocabularyId}
                  className="group relative grid grid-cols-1 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-rose-300 hover:shadow-md md:grid-cols-[minmax(0,1fr)_40px] md:p-5"
                >
                  <div className="flex flex-col justify-center gap-1.5">
                    <div className="flex flex-wrap items-baseline gap-2 pt-2 md:gap-3 md:pt-0">
                      <span className="text-lg font-bold tracking-tight text-[#a71f48] sm:text-xl">
                        {v.reading || v.word}
                      </span>
                      {v.reading && v.word !== v.reading && (
                        <span className="text-sm font-bold text-slate-500 sm:text-base">
                          【{v.word}】
                        </span>
                      )}
                      {v.partOfSpeech && (
                        <span className="ml-1 self-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                          {v.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-800">
                        {v.meaning || "-"}
                      </h3>
                    </div>
                    {v.example ? (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-700">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ví dụ</span>
                        <p
                          className="whitespace-pre-wrap text-sm"
                          dangerouslySetInnerHTML={{ __html: v.example }}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-xs italic text-slate-400">Chưa có ví dụ.</p>
                    )}
                  </div>

                  <div className="absolute right-3 top-3 flex flex-row items-center gap-2 text-slate-400 md:relative md:right-0 md:top-0 md:flex-col md:gap-3">
                    {v.audioUrl && (
                      <button
                        onClick={() => {
                          const audio = new Audio(v.audioUrl);
                          audio.play().catch((e) => console.error(e));
                        }}
                        className="rounded-full bg-slate-50 p-2 transition hover:bg-rose-50 hover:text-[#a71f48]"
                        title="Phát âm"
                      >
                        <Volume2 size={18} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => void toggleBookmark(v.vocabularyId, "Vocabulary")}
                      disabled={bookmarkLoadingKey === `Vocabulary-${v.vocabularyId}`}
                      className="rounded-full p-2 transition hover:bg-amber-50 group/bm"
                      title={hasBookmark(v.vocabularyId, "Vocabulary") ? "Bỏ lưu từ này" : `Lưu từ ${v.word}`}
                    >
                      <Bookmark 
                        size={18} 
                        className={`transition-colors ${
                          hasBookmark(v.vocabularyId, "Vocabulary")
                            ? "fill-amber-500 text-amber-500"
                            : "text-slate-400 group-hover/bm:text-amber-500"
                        }`} 
                      />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
              {/* NÚT LÙI TRANG */}
              <button
                onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={safePage === 1}
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const active = safePage === page;

                if (totalPages > 5 && Math.abs(page - safePage) > 1 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-400">...</span>;
                  return null;
                }

                return (
                  /* NÚT CHỌN SỐ TRANG */
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${active
                        ? "bg-[#a71f48] text-white shadow-sm"
                        : "hover:bg-slate-200"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* NÚT TIẾN TRANG */}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={safePage === totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* KHỐI CHUYỂN SANG FLASHCARD */}
          {!isLoading && safePage === totalPages && filteredVocabs.length > 0 && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-8 text-center shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">
                🔥 Bạn đã xem hết từ vựng
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Nhưng nếu không luyện tập, bạn sẽ không nhớ được lâu.
              </p>
              <button
                onClick={() => void handleStartFlashcard()}
                disabled={isStartingFlashcard}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d94838] to-[#c93222] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isStartingFlashcard ? "Đang mở flashcard..." : "🚀 Bắt đầu luyện tập ngay (Flashcard)"}
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-slate-200 pt-6">
            {levelLessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={`/vocabulary/${levelName}/${lesson.lessonId}`}
                onClick={(e) => {
                  e.preventDefault();
                  void goToLesson(lesson.lessonId);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${lesson.lessonId === lessonId
                    ? "border-[#a71f48] bg-[#a71f48] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {lesson.lessonName || `Bài ${lesson.lessonId}`}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}