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
  BookOpen,
  Info,
  Lightbulb
} from "lucide-react";

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

interface GrammarItem {
  grammarId: number;
  lessonId: number;
  grammarName: string;
  structure: string;
  meaning: string;
  example: string;
}

export default function GrammarDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [levels, setLevels] = useState<Level[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [grammars, setGrammars] = useState<GrammarItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
        setGrammars([]);
        setLessonName("");
        return;
      }

      const [levelLessonsData, lessonData, allGrammarsData] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api(`/lessons/${lessonId}`),
        api(`/grammars?lessonId=${lessonId}`),
      ]);

      if (Array.isArray(levelLessonsData)) {
        const grammarLessons = (levelLessonsData as Lesson[]).filter(
          (l) => !l.skillType || l.skillType === "Ngữ pháp" || l.skillType === "Tự do"
        );
        setLessons(grammarLessons);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allGrammarsData)) {
        setGrammars(allGrammarsData as GrammarItem[]);
      }
    } catch (e) {
      console.error(e);
      setLessons([]);
      setGrammars([]);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, lessonId]);

  const levelLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonId - b.lessonId),
    [lessons]
  );

  const filteredGrammars = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return grammars.filter((item) => {
      const matchesKeyword =
        keyword.length === 0 ||
        item.grammarName.toLowerCase().includes(keyword) ||
        item.meaning?.toLowerCase().includes(keyword);
      const matchesLesson = item.lessonId === lessonId;
      return matchesKeyword && matchesLesson;
    });
  }, [grammars, searchKeyword, lessonId]);

  const totalPages = Math.max(1, Math.ceil(filteredGrammars.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedGrammars = filteredGrammars.slice(
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
          <div className="shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-[#a71f48] lg:text-2xl">Tiến độ học tập</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Lộ trình {levelName.toUpperCase()}</p>

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

          <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <div className="flex shrink-0 items-center gap-2 p-4 pb-2 text-base font-semibold text-slate-800">
              <BookOpen size={16} className="text-[#a71f48]" />
              <span>Danh sách bài học</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
              {levelLessons.map((lesson) => (
                <Link
                  key={lesson.lessonId}
                  href={`/grammar/${levelName}/${lesson.lessonId}`}
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

          <div className="mt-6 shrink-0 rounded-xl bg-amber-50 p-4 border border-amber-100 hidden lg:block">
            <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-xs uppercase tracking-wider">
              <Lightbulb size={14} />
              <span>Mẹo học</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Thử đặt câu với cấu trúc mới ngay sau khi học để nhớ lâu hơn.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Cấu trúc Ngữ pháp
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
                placeholder="Tìm cấu trúc hoặc ý nghĩa..."
                className="h-10 w-full rounded-xl border-none bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#a71f48]"
              />
            </div>
            <div className="relative">
              <select
                value={levelName}
                onChange={(e) => {
                  window.location.href = `/grammar/${e.target.value}`;
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
                  window.location.href = `/grammar/${levelName}/${e.target.value}`;
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

          {/* Grammar List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48]"></div>
                <p className="mt-4 text-sm text-slate-500">Đang tải dữ liệu...</p>
              </div>
            ) : filteredGrammars.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500 shadow-sm">
                Không tìm thấy cấu trúc nào phù hợp.
              </div>
            ) : (
              pagedGrammars.map((g) => (
                <article
                  key={g.grammarId}
                  className="group relative grid grid-cols-1 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-rose-300 hover:shadow-md md:grid-cols-[minmax(0,1fr)_40px] md:p-5"
                >
                  <div className="flex flex-col justify-center gap-2 w-full">
                    {/* Header: Title + POS Tag */}
                    <div className="flex flex-wrap items-baseline gap-2 pt-2 md:pt-0">
                      <span className="text-lg font-bold tracking-tight text-[#a71f48] sm:text-xl">
                        {g.grammarName}
                      </span>
                      <span className="ml-1 self-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200 bg-slate-50">
                        Ngữ pháp
                      </span>
                    </div>

                    {/* Meaning */}
                    <div className="mt-1">
                      <h3 className="text-base font-semibold text-slate-800">
                        {g.meaning || "-"}
                      </h3>
                    </div>

                    {/* Structure Box */}
                    <div className="mt-2 rounded-lg bg-rose-50/30 p-3 ring-1 ring-rose-100/50">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#a71f48]/70">Cấu trúc</span>
                      <p className="text-sm font-medium text-slate-700 font-mono italic">
                        {g.structure}
                      </p>
                    </div>

                    {/* Example Box */}
                    {g.example ? (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-700">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ví dụ</span>
                        <div
                          className="text-sm leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: g.example }}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-xs italic text-slate-400">Chưa có ví dụ.</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute right-3 top-3 flex flex-row items-center gap-2 text-slate-400 md:relative md:right-0 md:top-0 md:flex-col md:gap-3">
                    <button className="rounded-full bg-slate-50 p-2 transition hover:bg-rose-50 hover:text-[#a71f48]" title="Lưu cấu trúc">
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
                    onClick={() => setCurrentPage(page)}
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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={safePage === totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-slate-200 pt-6 pb-10">
            {levelLessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={`/grammar/${levelName}/${lesson.lessonId}`}
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