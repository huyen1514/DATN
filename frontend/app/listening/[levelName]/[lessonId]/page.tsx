"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";

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

interface ListeningItem {
  listeningId: number;
  lessonId: number;
  audioUrl?: string;
  imageUrl?: string;
  transcript?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export default function ListeningDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [listenings, setListenings] = useState<ListeningItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allListeningsData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/listenings"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter((l: Lesson) => 
          l.level?.levelName === levelName && 
          (!l.skillType || l.skillType === "Nghe hiểu" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allListeningsData)) {
        const filtered = allListeningsData.filter((l: ListeningItem) => l.lessonId === lessonId);
        setListenings(filtered);
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

  return (
    <div className="min-h-screen bg-white text-jp-ink">
      <MainNavbar />

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* TITLE SECTION */}
        <div className="mb-12 relative">
          <div className="inline-block">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-jp-indigo mb-2">
              {lessonName || "Nghe Hiểu"}
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-jp-red to-jp-sakura"></div>
          </div>
          <p className="text-jp-ink/60 mt-4 text-lg">Luyện tập nghe tiếng Nhật</p>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: LISTENING CARDS */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-jp-ink/40">
                <p className="text-lg">正在加载...</p>
              </div>
            ) : listenings.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-jp-red/10 p-12 text-center">
                <p className="text-jp-ink/60 text-lg">Chưa có bài nghe nào</p>
              </div>
            ) : (
              listenings.map((item, idx) => (
                <div 
                  key={item.listeningId} 
                  className="group bg-white rounded-2xl border-2 border-jp-red/10 hover:border-jp-red/30 p-6 md:p-8 transition-all shadow-sm hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-jp-sakura flex items-center justify-center flex-shrink-0 font-serif font-bold text-jp-red">
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-jp-indigo">
                      Câu {idx + 1}
                    </h3>
                    {item.audioUrl && (
                      <button
                        onClick={() => {
                          const audio = new Audio(item.audioUrl);
                          audio.play().catch(e => console.error("Audio play error:", e));
                        }}
                        className="ml-auto px-4 py-2 bg-jp-red hover:bg-red-700 text-white rounded-lg font-bold transition text-sm"
                        title="Phát âm thanh"
                      >
                        🔊 Nghe
                      </button>
                    )}
                  </div>

                  {item.imageUrl && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={item.imageUrl}
                        alt="Hình minh họa"
                        className="max-h-64 rounded-lg border border-jp-red/10 object-contain"
                      />
                    </div>
                  )}

                  <div className="bg-jp-washi/50 rounded-lg border border-jp-red/10 p-4 mb-4">
                    <p className="text-jp-ink font-serif font-bold leading-relaxed">{item.question}</p>
                  </div>

                  {/* OPTIONS */}
                  <div className="space-y-2 mb-4">
                    {["A", "B", "C", "D"].map((option) => {
                      const valueKey = `option${option}` as keyof ListeningItem;
                      const text = item[valueKey];
                      return (
                        <div 
                          key={option} 
                          className="flex items-start gap-3 p-3 border border-jp-red/10 rounded-lg hover:border-jp-red/30 hover:bg-jp-sakura/10 transition cursor-pointer"
                        >
                          <span className="w-8 h-8 font-bold bg-jp-sakura text-jp-red rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                            {option}
                          </span>
                          <span className="text-sm text-jp-ink leading-relaxed">{text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {item.transcript && (
                    <div className="bg-jp-sakura/20 rounded-lg p-4 border border-jp-red/10">
                      <p className="text-xs font-bold text-jp-red/70 uppercase tracking-wide mb-2">Bản ghi chép</p>
                      <p className="text-sm text-jp-ink italic">{item.transcript}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* RIGHT: SIDEBAR - LESSON NAVIGATOR */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl border-2 border-jp-red/10 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-jp-indigo uppercase tracking-widest mb-6 pb-3 border-b-2 border-jp-red/20">
                📚 {lessons.length} Bài Học
              </h3>

              {/* LESSON GRID */}
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {lessons.map((lesson, idx) => (
                  <Link
                    key={lesson.lessonId}
                    href={`/listening/${levelName}/${lesson.lessonId}`}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition ${
                      lesson.lessonId === lessonId
                        ? "bg-jp-red text-white shadow-md scale-105"
                        : "bg-jp-sakura text-jp-indigo hover:bg-jp-red hover:text-white"
                    }`}
                    title={lesson.lessonName}
                  >
                    {idx + 1}
                  </Link>
                ))}
              </div>

              {/* INFO CARD */}
              <div className="mt-8 pt-6 border-t-2 border-jp-red/10">
                <p className="text-xs text-jp-ink/60 font-medium mb-2">💡 Mẹo:</p>
                <p className="text-xs text-jp-ink/70 leading-relaxed">
                  Nghe nhiều lần để quen với độ dài âm tiếng Nhật, chú ý các chi tiết nhỏ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER DECORATION */}
      <div className="h-1 bg-gradient-to-r from-jp-red via-jp-sakura to-jp-red mt-20"></div>
    </div>
  );
}
