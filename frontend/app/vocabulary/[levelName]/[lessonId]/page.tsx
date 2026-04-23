"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Volume2,
  BookOpen,
  CheckCircle2,
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

export default function VocabularyDetailPage() {
  const params = useParams();
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

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserId(u.userId);
      } catch (e) {}
    }
    void loadData();

    // Mark as accessed/in progress
    updateStatus("InProgress");

  }, [loadData, lessonId, userId]);

  const updateStatus = async (status: string) => {
    if (!userId) return;
    try {
      await api("/progress/lesson", "PUT", {
        userId,
        lessonId,
        partType: "Vocabulary",
        status,
        score: null
      });
    } catch (e) {
      console.error("Could not update progress", e);
    }
  };

  const handleNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < levelLessons.length) {
      // Mark current as completed before moving
      updateStatus("Completed");
      const nextLesson = levelLessons[nextIndex];
      window.location.href = `/vocabulary/${levelName}/${nextLesson.lessonId}`;
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">

        {/* Sidebar - Cố định (Sticky) và cuộn bên trong */}
        <aside className="sticky top-24 flex max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">

          {/* Sidebar - Cố định (Sticky) và cuộn bên trong */}
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

          {/* Phần Danh sách bài học có thanh cuộn */}
          <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <div className="flex shrink-0 items-center gap-2 p-4 pb-2 text-base font-semibold text-slate-800">
              <BookOpen size={16} className="text-[#a71f48]" />
              <span>Danh sách bài học</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
              {levelLessons.map((lesson) => (
                <Link
                  key={lesson.lessonId}
                  href={`/vocabulary/${levelName}/${lesson.lessonId}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${lesson.lessonId === lessonId
                      ? "bg-rose-100 font-semibold text-[#a71f48]"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                >
                  {lesson.lessonName || `Bài ${lesson.lessonId}`}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col gap-6">
          {/* Header Area */}
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
          </div>

          {/* Filter Bar */}
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
                  window.location.href = `/vocabulary/${levelName}/${e.target.value}`;
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

          {/* Vocabulary List */}
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
                  {/* Content container */}
                  <div className="flex flex-col justify-center gap-1.5">
                    {/* Header: Reading + Word + POS */}
                    <div className="flex flex-wrap items-baseline gap-2 pt-2 md:gap-3 md:pt-0">
                      {/* Reading First (Chữ nhỏ lại) */}
                      <span className="text-lg font-bold tracking-tight text-[#a71f48] sm:text-xl">
                        {v.reading || v.word}
                      </span>
                      {/* Word Beside Reading */}
                      {v.reading && v.word !== v.reading && (
                        <span className="text-sm font-bold text-slate-500 sm:text-base">
                          【{v.word}】
                        </span>
                      )}
                      {/* Part of Speech */}
                      {v.partOfSpeech && (
                        <span className="ml-1 self-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                          {v.partOfSpeech}
                        </span>
                      )}
                    </div>

                    {/* Meaning */}
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-800">
                        {v.meaning || "-"}
                      </h3>
                    </div>

                    {/* Example */}
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

                  {/* Actions */}
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
                    <button className="rounded-full bg-slate-50 p-2 transition hover:bg-rose-50 hover:text-[#a71f48]" title="Lưu từ">
                      <Bookmark size={16} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      if (page === totalPages) {
                        updateStatus("Completed");
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${active
                        ? "bg-[#a71f48] text-white shadow-sm"
                        : "hover:bg-slate-200"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  const nextPage = Math.min(totalPages, safePage + 1);
                  setCurrentPage(nextPage);
                  if (nextPage === totalPages) {
                    updateStatus("Completed");
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={safePage === totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <button
              onClick={() => updateStatus("Completed")}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-200"
            >
              <CheckCircle2 size={20} /> Đã thuộc hết bài này
            </button>
            
            {currentLessonIndex < levelLessons.length - 1 && (
              <button
                onClick={handleNextLesson}
                className="flex items-center gap-2 px-6 py-3 bg-[#a71f48] hover:bg-[#8e1a3d] text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200"
              >
                Bài học tiếp theo <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Bottom Quick Navigation */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-slate-200 pt-6">
            {levelLessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={`/vocabulary/${levelName}/${lesson.lessonId}`}
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