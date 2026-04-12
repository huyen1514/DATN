"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { Languages, CopyPlus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function KanjiLessonsPage() {
  const params = useParams();
  const levelName = params.levelName as string; 
  const router = useRouter();

  const [lessons, setLessons] = useState<any[]>([]);
  const [kanjiCounts, setKanjiCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [levelName]);

  const loadData = async () => {
    try {
      const levels = await api("/levels");
      const targetLevel = Array.isArray(levels) ? levels.find((l: any) => l.levelName.toUpperCase() === levelName.toUpperCase()) : null;
      
      if (!targetLevel) { setIsLoading(false); return; }

      const [levelLessons, allKanjis] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api("/kanjis"),
      ]);

      if (Array.isArray(levelLessons) && Array.isArray(allKanjis)) {
        const counts: Record<number, number> = {};
        allKanjis.forEach((k: any) => {
          counts[k.lessonId] = (counts[k.lessonId] || 0) + 1;
        });
        setKanjiCounts(counts);

        const validLessons = levelLessons.filter((l: any) => 
          (l.skillType === "Kanji" || l.skillType === "Tự do" || !l.skillType) && 
          counts[l.lessonId] && counts[l.lessonId] > 0
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3 uppercase">
            <Languages size={28} className="text-rose-600" />
            KANJI (CHỮ HÁN) - {levelName}
          </h1>
          <p className="text-neutral-500 font-light">Chọn bài học để ôn tập Kanji thuộc trình độ {levelName.toUpperCase()}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/50 border border-black/5 rounded-3xl animate-pulse" />)}
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <CopyPlus size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có bài học nào</h3>
            <p className="text-neutral-500">Nội dung trình độ {levelName} đang được cập nhật thêm Kanji.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {lessons.map(lesson => (
              <Link 
                key={lesson.lessonId} 
                href={`/kanji/${levelName}/${lesson.lessonId}`}
                className="group bg-white rounded-3xl border border-black/5 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-rose-500/20 transition-all duration-300 block relative overflow-hidden"
              >
                <div className="absolute -right-4 -bottom-4 text-rose-500/5 group-hover:text-rose-500/10 transition-colors">
                  <Languages size={120} />
                </div>
                
                <div className="relative z-10">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-4 inline-block tracking-widest uppercase">
                    Bài học
                  </span>
                  <h3 className="text-xl font-bold text-jp-indigo mb-2 group-hover:text-rose-600 transition-colors">{lesson.LessonName || `Bài ${lesson.lessonId}`}</h3>
                  
                  <div className="mt-8 flex items-center justify-between text-sm">
                    <span className="font-bold text-neutral-400">{kanjiCounts[lesson.lessonId] || 0} Chữ Hán</span>
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
