"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  CheckCircle2,
  Lightbulb,
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

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [grammars, setGrammars] = useState<GrammarItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number>(1);

  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allGrammarsData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/grammars"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter(
          (l: Lesson) =>
            l.level?.levelName.toLowerCase() === levelName.toLowerCase() &&
            (!l.skillType || l.skillType === "Ngữ pháp" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allGrammarsData)) {
        const filtered = allGrammarsData.filter(
          (g: GrammarItem) => g.lessonId === lessonId
        );
        setGrammars(filtered);
      }
    } catch (e) {
      console.error(e);
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
        partType: "Grammar",
        status,
        score: null
      });
    } catch (e) {
      console.error("Could not update progress", e);
    }
  };

  const handleNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < sortedLessons.length) {
      updateStatus("Completed");
      const nextLesson = sortedLessons[nextIndex];
      window.location.href = `/grammar/${levelName}/${nextLesson.lessonId}`;
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        {/* SIDEBAR */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
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

          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <BookOpen size={18} className="text-[#a71f48]" />
                <span>Danh sách ngữ pháp</span>
              </div>

              {/* Danh sách điều hướng bài học */}
              <div className="flex flex-col gap-1 text-sm">
                {sortedLessons.map((lesson) => {
                  const isActive = lesson.lessonId === lessonId;
                  return (
                    <Link
                      key={lesson.lessonId}
                      href={`/grammar/${levelName}/${lesson.lessonId}`}
                      className={`rounded-lg px-3 py-2 transition-colors ${
                        isActive
                          ? "bg-rose-50 font-semibold text-[#a71f48]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {lesson.lessonName || `Bài ${lesson.lessonId}`}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-sm">
                <Lightbulb size={16} />
                <span>Mẹo học tốt</span>
              </div>
              <p className="text-xs text-amber-700/80 leading-relaxed">
                Hãy đọc to phần ví dụ và tự đặt câu với cấu trúc tương tự để ghi nhớ lâu hơn.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex flex-col gap-6">
          {/* TITLE SECTION */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Cấu trúc Ngữ pháp
              </h1>
              <p className="mt-2 flex items-center gap-2 text-base text-slate-500">
                <span className="font-semibold text-[#a71f48]">{levelName.toUpperCase()}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                <span>{lessonName || `Bài ${lessonId}`}</span>
              </p>
            </div>
          </div>

          {/* GRAMMAR LIST */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48]"></div>
                <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
              </div>
            ) : grammars.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">
                Chưa có cấu trúc ngữ pháp nào cho bài học này.
              </div>
            ) : (
              grammars.map((g, idx) => (
                <article
                  key={g.grammarId}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-rose-300 hover:shadow-md"
                >
                  {/* Thanh highlight bên trái */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a71f48]"></div>

                  <div className="p-6 md:p-8 pl-8 md:pl-10">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                      {/* NUMBER INDICATOR */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xl font-bold text-[#a71f48] ring-4 ring-white shadow-sm">
                        {idx + 1}
                      </div>

                      <div className="flex-1 w-full space-y-4">
                        {/* TÊN NGỮ PHÁP & Ý NGHĨA */}
                        <div>
                          <h3 className="text-3xl font-serif font-bold text-[#a71f48] mb-4">
                            {g.grammarName}
                          </h3>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Ý nghĩa
                            </span>
                            <div className="text-base font-medium text-slate-700 leading-relaxed">
                              {g.meaning?.split(/(?=- )/).map((line, i) => (
                                <p key={i} className={i > 0 ? "mt-1" : ""}>
                                  {line.trim()}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* CẤU TRÚC */}
                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                          <span className="block text-xs font-semibold uppercase tracking-wider text-[#a71f48] mb-2">
                            Cấu trúc
                          </span>
                          <div className="text-lg font-semibold text-slate-800 whitespace-pre-wrap">
                            {g.structure}
                          </div>
                        </div>

                        {/* VÍ DỤ */}
                        {g.example && (
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Ví dụ
                            </span>
                            <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {g.example}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}