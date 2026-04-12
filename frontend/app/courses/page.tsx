"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";

interface Level {
  levelId: number;
  levelName: string;
}

const levelColors: Record<string, { gradient: string; icon: string }> = {
  N5: { gradient: "from-emerald-400 to-emerald-600", icon: "🌱" },
  N4: { gradient: "from-blue-400 to-blue-600", icon: "🌿" },
  N3: { gradient: "from-violet-400 to-violet-600", icon: "🌸" },
  N2: { gradient: "from-orange-400 to-orange-600", icon: "🔥" },
  N1: { gradient: "from-red-500 to-red-700", icon: "⭐" },
};

export default function CoursesPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadLevels(); }, []);

  const loadLevels = async () => {
    try {
      const data = await api("/levels");
      if (Array.isArray(data)) setLevels(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const getColor = (name: string) => {
    for (const key of Object.keys(levelColors)) {
      if (name.toUpperCase().includes(key)) return levelColors[key];
    }
    return { gradient: "from-neutral-400 to-neutral-600", icon: "📚" };
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <GraduationCap size={28} className="text-jp-red" />
            Khóa Học
          </h1>
          <p className="text-neutral-500 font-light">Chọn cấp độ JLPT để bắt đầu học. Mỗi cấp độ gồm nhiều bài học với đầy đủ Kanji, Ngữ pháp, Từ vựng, Luyện nghe và Luyện đọc.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/50 border border-black/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : levels.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có khóa học nào</h3>
            <p className="text-neutral-500">Hệ thống đang được cập nhật nội dung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {levels.map((level, idx) => {
              const color = getColor(level.levelName);
              return (
                <Link
                  key={level.levelId}
                  href={`/courses/${level.levelId}`}
                  className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`bg-gradient-to-br ${color.gradient} p-8 text-white min-h-[180px] flex flex-col justify-between`}>
                    {/* Decorative Circle */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-8 -translate-x-8" />

                    <div className="relative z-10">
                      <span className="text-4xl mb-3 inline-block">{color.icon}</span>
                      <h2 className="text-3xl font-bold font-serif">{level.levelName}</h2>
                      <p className="text-white/70 text-sm mt-2">
                        {level.levelName.includes("N5") ? "Trình độ sơ cấp - Nhập môn tiếng Nhật" :
                         level.levelName.includes("N4") ? "Trình độ sơ cấp - Giao tiếp cơ bản" :
                         level.levelName.includes("N3") ? "Trình độ trung cấp - Đọc hiểu nâng cao" :
                         level.levelName.includes("N2") ? "Trình độ trung cao cấp - Thành thạo" :
                         level.levelName.includes("N1") ? "Trình độ cao cấp - Chuyên gia" :
                         "Khám phá nội dung khóa học"}
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-4">
                      <span className="text-xs font-bold bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
                        Xem bài học →
                      </span>
                      <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
