"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { BookOpen, ArrowRight, GraduationCap } from "lucide-react";

interface Lesson {
  lessonId: number;
  lessonName: string;
  createdAt: string;
}

interface Level {
  levelId: number;
  levelName: string;
}

export default function CourseLessonsPage() {
  const params = useParams();
  const levelId = params.levelId as string;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [levelId]);

  const loadData = async () => {
    try {
      const [lessonData, levelData] = await Promise.all([
        api(`/lessons/level/${levelId}`),
        api(`/levels/${levelId}`),
      ]);
      if (Array.isArray(lessonData)) setLessons(lessonData);
      if (levelData?.levelId) setLevel(levelData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Link href="/courses" className="hover:text-jp-red transition-colors">Khóa học</Link>
            <span>/</span>
            <span className="text-jp-indigo font-bold">{level?.levelName || "..."}</span>
          </div>
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <GraduationCap size={28} className="text-jp-red" />
            {level?.levelName || "Đang tải..."}
          </h1>
          <p className="text-neutral-500 font-light">Danh sách bài học trong cấp độ này. Chọn bài để học Kanji, Ngữ pháp, Từ vựng, Luyện nghe và Luyện đọc.</p>
        </div>

        {/* Lessons List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white/50 border border-black/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có bài học nào</h3>
            <p className="text-neutral-500">Nội dung đang được cập nhật cho cấp độ này.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, idx) => (
              <Link
                key={lesson.lessonId}
                href={`/courses/${levelId}/lessons/${lesson.lessonId}`}
                className="group bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-5 block"
              >
                {/* Lesson Number */}
                <div className="w-12 h-12 bg-jp-indigo rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:bg-jp-red transition-colors">
                  {idx + 1}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-jp-indigo group-hover:text-jp-red transition-colors truncate">
                    {lesson.lessonName}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Kanji • Ngữ pháp • Từ vựng • Nghe • Đọc
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-neutral-300 group-hover:text-jp-red group-hover:translate-x-1 transition-all flex-shrink-0">
                  <ArrowRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
