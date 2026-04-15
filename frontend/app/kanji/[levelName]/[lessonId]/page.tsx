"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import KanjiStroke from "@/components/KanjiStroke";
import { BookOpen, Lightbulb, Compass } from "lucide-react";

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

export default function KanjiDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kanjis, setKanjis] = useState<KanjiItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allKanjisData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/kanjis"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter((l: Lesson) =>
          l.level?.levelName.toLowerCase() === levelName.toLowerCase() &&
          (!l.skillType || l.skillType === "Kanji" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allKanjisData)) {
        const filtered = allKanjisData.filter((k: KanjiItem) => k.lessonId === lessonId);
        setKanjis(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    <div className="min-h-screen bg-white text-slate-800">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        {/* SIDEBAR */}
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-[#a71f48]">
              <Compass size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Tiến độ học tập</h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{levelName}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Đã hoàn thành</span>
              <span className="text-[#a71f48]">{progressPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#a71f48] to-rose-400 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                <BookOpen size={16} className="text-[#a71f48]" />
                <span>Danh sách học Kanji</span>
              </div>

              <div className="flex flex-col gap-1 text-sm font-medium">
                {sortedLessons.map((lesson) => {
                  const isActive = lesson.lessonId === lessonId;
                  return (
                    <Link
                      key={lesson.lessonId}
                      href={`/kanji/${levelName}/${lesson.lessonId}`}
                      className={`rounded-xl px-3 py-2.5 transition-all ${isActive
                          ? "bg-rose-100/50 text-[#a71f48] shadow-sm ring-1 ring-rose-200"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:ring-1 hover:ring-slate-200"
                        }`}
                    >
                      {lesson.lessonName || `Bài ${lesson.lessonId}`}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100/60">
              <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-sm">
                <Lightbulb size={16} />
                <span>Mẹo học tốt</span>
              </div>
              <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                Hãy dùng tính năng "Mẫu viết" để xem cách viết và kết hợp với "Tự tập viết" để não bộ ghi nhớ qua vận động nhé.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Học chữ Kanji
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#a71f48]">
                {levelName}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
              <span className="text-base text-slate-600">{lessonName || `Bài ${lessonId}`}</span>
            </div>
          </div>

          {/* Grid Kanji */}
          <div className="flex flex-col gap-10 pb-12">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-24 shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-[#a71f48]"></div>
                <p className="mt-4 text-sm font-medium text-slate-500">Đang tải chữ Hán...</p>
              </div>
            ) : kanjis.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white py-24 text-center text-slate-500 shadow-sm font-medium">
                Chưa có chữ Kanji nào cho bài học này.
              </div>
            ) : (
              kanjis.map((k, idx) => (
                <article
                  key={k.kanjiId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="p-6 md:p-8">
                     {/* Top Header */}
                     <div className="flex items-start justify-between border-b border-slate-100 pb-6">
                        <div>
                           <h2 className="text-5xl md:text-6xl font-normal text-blue-600 mb-3">{k.character}</h2>
                           <div className="flex items-center text-sm font-semibold text-slate-500 relative px-2.5 py-0.5">
                              {/* Biểu diễn dấu ngoặc vuông nhạt như trong thiết kế */}
                              <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-300"></span>
                              <span className="absolute left-0 top-0 w-1.5 h-[2px] bg-slate-300"></span>
                              <span className="absolute left-0 bottom-0 w-1.5 h-[2px] bg-slate-300"></span>
                              <span className="uppercase tracking-widest">{k.meaning}</span>
                           </div>
                        </div>
                     </div>

                     {/* Middle Body */}
                     <div className="flex flex-col lg:flex-row gap-8 py-8 border-b border-slate-100">
                        {/* Left: Info */}
                        <div className="flex-1 flex flex-col justify-between">
                           <div>
                             <h3 className="text-xl font-bold text-slate-800 mb-5">Phát âm</h3>
                             
                             <div className="space-y-6">
                                {/* Kunyomi */}
                                <div>
                                   <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                      <span className="text-sm font-semibold text-slate-700">Kunyomi</span>
                                   </div>
                                   <div className="pl-4 border-l-[2px] border-slate-100 ml-[3px]">
                                      <p className="text-blue-600 text-base leading-relaxed tracking-wider font-medium">
                                         {k.kunyomi || "Không có"}
                                      </p>
                                   </div>
                                </div>
                                
                                {/* Onyomi */}
                                <div>
                                   <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                      <span className="text-sm font-semibold text-slate-700">Onyomi</span>
                                   </div>
                                   <div className="pl-4 border-l-[2px] border-slate-100 ml-[3px]">
                                      <p className="text-red-500 text-base leading-relaxed tracking-wider font-medium">
                                         {k.onyomi || "Không có"}
                                      </p>
                                   </div>
                                </div>
                             </div>
                           </div>

                           {/* Mock Stats */}
                           <div className="flex flex-wrap gap-4 mt-8 pt-6">
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md text-slate-500 mb-1">Số nét</span>
                                 <span className="text-sm font-bold text-slate-800 ml-1">Tra cứu</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md text-slate-500 mb-1">JLPT</span>
                                 <span className="text-sm font-bold text-slate-800 ml-1 uppercase">{levelName}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md text-slate-500 mb-1">Tần suất ⓘ</span>
                                 <span className="text-sm font-bold text-slate-800 ml-1">Đang cập nhật</span>
                              </div>
                           </div>
                        </div>

                        {/* Right: Kanji Stroke */}
                        <div className="shrink-0 w-full lg:w-[280px] flex items-center justify-center">
                           <KanjiStroke character={k.character} size={200} />
                        </div>
                     </div>

                     {/* Nghĩa */}
                     <div className="pt-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Nghĩa</h3>
                        <div className="pl-5">
                           <ul className="list-disc text-base text-slate-700 font-medium space-y-2 marker:text-slate-400">
                              <li>{k.example || k.meaning}</li>
                           </ul>
                           {k.example && (
                              <button className="text-blue-600 text-sm font-semibold hover:underline mt-3">Xem thêm</button>
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