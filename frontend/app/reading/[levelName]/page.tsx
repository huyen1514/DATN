"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { BookOpen, CopyPlus, ArrowRight, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Derive backend base URL from API_URL (remove trailing /api)
const BACKEND_URL = API_URL.replace(/\/api$/, "");

interface ReadingData {
  readingId: number;
  lessonId: number;
  imageUrl?: string;
  question?: string;
}

export default function ReadingLessonsPage() {
  const params = useParams();
  const levelName = params.levelName as string;

  const [lessons, setLessons] = useState<any[]>([]);
  const [readingCounts, setReadingCounts] = useState<Record<number, number>>({});
  const [readingThumbs, setReadingThumbs] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [levelName]);

  const loadData = async () => {
    try {
      const levels = await api("/levels");
      const targetLevel = Array.isArray(levels)
        ? levels.find(
            (l: any) => l.levelName.toUpperCase() === levelName.toUpperCase()
          )
        : null;

      if (!targetLevel) {
        setIsLoading(false);
        return;
      }

      const [levelLessons, allReadings] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api("/readings"),
      ]);

      if (Array.isArray(levelLessons) && Array.isArray(allReadings)) {
        const counts: Record<number, number> = {};
        const thumbs: Record<number, string> = {};

        allReadings.forEach((r: ReadingData) => {
          counts[r.lessonId] = (counts[r.lessonId] || 0) + 1;
          // Lấy thumbnail đầu tiên của mỗi lesson
          if (!thumbs[r.lessonId] && r.imageUrl) {
            thumbs[r.lessonId] = r.imageUrl;
          }
        });
        setReadingCounts(counts);
        setReadingThumbs(thumbs);

        const validLessons = levelLessons.filter(
          (l: any) =>
            (l.skillType === "Đọc hiểu" ||
              l.skillType === "Tự do" ||
              !l.skillType) &&
            counts[l.lessonId] &&
            counts[l.lessonId] > 0
        );
        setLessons(validLessons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-jp-indigo flex items-center gap-3 uppercase font-bold">
                Đọc Hiểu - {levelName}
              </h1>
              <p className="text-neutral-500 font-light text-sm">
                Chọn bài học để luyện tập kỹ năng Đọc hiểu trình độ{" "}
                {levelName?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          /* Skeleton Loading */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 bg-white/50 border border-black/5 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          /* Empty State */
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <CopyPlus size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">
              Chưa có bài học nào
            </h3>
            <p className="text-neutral-500">
              Nội dung trình độ {levelName} đang được cập nhật thêm bài đọc.
            </p>
          </div>
        ) : (
          /* Lesson Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson, idx) => (
              <motion.div
                key={lesson.lessonId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
              >
                <Link
                  href={`/reading/${levelName}/${lesson.lessonId}`}
                  className="group block bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500/20 transition-all duration-300 overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
                    {readingThumbs[lesson.lessonId] ? (
                      <img
                        src={`${BACKEND_URL}${readingThumbs[lesson.lessonId]}`}
                        alt={lesson.lessonName || `Bài ${lesson.lessonId}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen
                          size={48}
                          className="text-indigo-200 group-hover:text-indigo-300 transition-colors"
                        />
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Count badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold text-indigo-600 px-3 py-1 rounded-full shadow-sm">
                      {readingCounts[lesson.lessonId] || 0} câu hỏi
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3 inline-block tracking-widest uppercase">
                      Bài {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-jp-indigo mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {lesson.lessonName || `Bài ${lesson.lessonId}`}
                    </h3>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <FileText size={12} />
                        <span>Đọc hiểu</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom tip section */}
        {!isLoading && lessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6 flex items-start gap-4"
          >
            <Sparkles size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Mẹo học đọc hiểu</p>
              <p className="text-sm text-amber-700/80 leading-relaxed">
                Hãy đọc toàn bộ đoạn văn trước, sau đó trả lời câu hỏi. Chú ý các từ khóa
                và thông tin quan trọng như thời gian, địa điểm, và số lượng.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </StudentLayout>
  );
}
