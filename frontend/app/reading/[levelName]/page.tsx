"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { Bookmark, Zap, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

const BACKEND_URL = API_URL.replace(/\/api$/, "");

// Cập nhật lại Interface theo đúng Model mới
interface ReadingQuestion {
  readingQuestionId: number;
  questionText: string;
}

interface ReadingPassage {
  passageId: number;
  lessonId: number;
  content: string;
  readingQuestions?: ReadingQuestion[];
}

export default function ReadingLessonsPage() {
  const params = useParams();
  const levelName = (params?.levelName as string) || "";

  const [lessons, setLessons] = useState<any[]>([]);
  // Tách riêng state đếm số đoạn văn và đếm tổng số câu hỏi
  const [passageCounts, setPassageCounts] = useState<Record<number, number>>({});
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const levels = await api("/levels");
      const targetLevel = Array.isArray(levels)
        ? levels.find((l: any) => l.levelName.toUpperCase() === levelName.toUpperCase())
        : null;

      if (!targetLevel) {
        setLessons([]);
        setIsLoading(false);
        return;
      }

      const [levelLessons, allReadings] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api("/readings"), // Lấy toàn bộ bài đọc kèm câu hỏi
      ]);

      if (Array.isArray(levelLessons) && Array.isArray(allReadings)) {
        const pCounts: Record<number, number> = {};
        const qCounts: Record<number, number> = {};

        // Đếm số đoạn văn và tổng số câu hỏi cho từng Lesson
        allReadings.forEach((r: ReadingPassage) => {
          pCounts[r.lessonId] = (pCounts[r.lessonId] || 0) + 1;

          const questionsInPassage = r.readingQuestions ? r.readingQuestions.length : 0;
          qCounts[r.lessonId] = (qCounts[r.lessonId] || 0) + questionsInPassage;
        });

        setPassageCounts(pCounts);
        setQuestionCounts(qCounts);

        const validLessons = levelLessons.filter(
          (l: any) =>
            (l.skillType === "Đọc hiểu" || !l.skillType) &&
            pCounts[l.lessonId] &&
            pCounts[l.lessonId] > 0
        );
        setLessons(validLessons);
      }
    } catch (e) {
      console.error(e);
      setError("Không thể tải dữ liệu bài học. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [levelName]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <StudentLayout>
      <div className="relative min-h-screen font-sans text-neutral-900 selection:bg-[#c62828]/20 selection:text-[#c62828]">

        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1490806678567-2410b2da3073?auto=format&fit=crop&q=80&w=2000"
            alt="Japanese Background"
            className="w-full h-full object-cover opacity-20 grayscale-[30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-[#f8f9fa]/95 to-[#f8f9fa] backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 pt-12">

          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c62828]/20 bg-white/60 backdrop-blur-sm text-[#c62828] text-xs font-semibold tracking-widest mb-4 shadow-sm">
              <Sparkles size={14} /> CHƯƠNG TRÌNH HỌC
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#c62828] uppercase tracking-wider drop-shadow-sm">
              ĐỌC HIỂU {levelName}
            </h1>
            <div className="w-20 h-[3px] bg-gradient-to-r from-transparent via-[#c62828] to-transparent mx-auto mt-6 rounded-full opacity-70" />
          </motion.header>

          {/* STATES */}
          {isLoading ? (
            /* SKELETON */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-xl p-6 shadow-sm h-56 flex flex-col justify-between">
                  <div className="w-2/3 h-6 bg-neutral-200/60 rounded animate-pulse mb-4" />
                  <div className="space-y-3 mb-6">
                    <div className="w-3/4 h-4 bg-neutral-100 rounded animate-pulse" />
                    <div className="w-1/2 h-4 bg-neutral-100 rounded animate-pulse" />
                    <div className="w-2/3 h-4 bg-neutral-100 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-10 bg-neutral-100 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* ERROR STATE */
            <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-sm px-6 max-w-2xl mx-auto">
              <Zap size={48} className="mx-auto mb-4 text-[#c62828]" />
              <p className="text-neutral-600 font-medium text-lg">{error}</p>
              <button
                onClick={() => void loadData()}
                className="mt-6 px-8 py-3 bg-[#c62828] text-white rounded-lg hover:bg-red-800 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Thử lại
              </button>
            </div>
          ) : lessons.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-24 rounded-2xl border border-neutral-200/60 bg-white/80 backdrop-blur-md text-center shadow-sm px-6 max-w-3xl mx-auto">
              <Bookmark size={56} className="mx-auto mb-4 text-neutral-300" strokeWidth={1.5} />
              <h3 className="mb-3 text-2xl font-bold text-neutral-800">Chưa có bài học nào</h3>
              <p className="text-neutral-500 text-base max-w-md mx-auto">
                Nội dung Đọc hiểu cho cấp độ {levelName.toUpperCase()} đang được hệ thống cập nhật. Vui lòng quay lại sau nhé.
              </p>
            </div>
          ) : (
            /* LESSONS GRID */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {lessons.map((lesson) => {
                const pCount = passageCounts[lesson.lessonId] || 0;
                const qCount = questionCounts[lesson.lessonId] || 0;

                return (
                  <motion.div key={lesson.lessonId} variants={itemVariants} className="h-full">
                    <div className="group relative bg-white/90 backdrop-blur-md border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-[0_12px_30px_rgb(198,40,40,0.12)] hover:border-[#c62828]/40 hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col overflow-hidden">

                      {/* Decorative watermark */}
                      <div className="absolute -bottom-6 -right-4 text-8xl font-black text-neutral-100 opacity-60 group-hover:text-[#c62828]/5 transition-colors duration-500 pointer-events-none select-none font-serif">
                        読
                      </div>

                      {/* Lesson title */}
                      <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
                        <h3 className="text-xl font-bold text-neutral-900 group-hover:text-[#c62828] transition-colors line-clamp-2">
                          {lesson.lessonName || `Bài học Đọc hiểu ${lesson.lessonId}`}
                        </h3>
                      </div>

                      {/* Key-value details */}
                      <div className="relative z-10 flex-grow space-y-3 mb-8">
                        <div className="flex items-center text-[15px]">
                          <div className="w-2 h-2 rounded-full bg-neutral-300 mr-3 group-hover:bg-[#c62828]/60 transition-colors" />
                          <span className="w-36 text-neutral-500">Số bài đọc</span>
                          <span className="font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-sm group-hover:bg-[#c62828]/10 group-hover:text-[#c62828] transition-colors">
                            {pCount} đoạn văn
                          </span>
                        </div>
                        <div className="flex items-center text-[15px]">
                          <div className="w-2 h-2 rounded-full bg-neutral-300 mr-3 group-hover:bg-[#c62828]/60 transition-colors" />
                          <span className="w-36 text-neutral-500">Số câu hỏi</span>
                          <span className="font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-sm group-hover:bg-[#c62828]/10 group-hover:text-[#c62828] transition-colors">
                            {qCount} câu hỏi
                          </span>
                        </div>
                        <div className="flex items-center text-[15px]">
                          <div className="w-2 h-2 rounded-full bg-neutral-300 mr-3 group-hover:bg-[#c62828]/60 transition-colors" />
                          <span className="w-36 text-neutral-500">Hình thức</span>
                          <span className="font-semibold text-neutral-800">Trắc nghiệm</span>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="relative z-10 mt-auto pt-2">
                        <Link
                          href={`/reading/${levelName}/${lesson.lessonId}`}
                          className="flex items-center justify-center w-full gap-2 border-2 border-[#c62828] text-[#c62828] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#c62828] hover:text-white transition-all duration-300 text-[15px] group/btn"
                        >
                          Bắt đầu học
                          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}