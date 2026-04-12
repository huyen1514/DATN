"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { Languages, ChevronLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function KanjiDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string; 
  const lessonIdStr = params.lessonId as string;
  const lessonId = parseInt(lessonIdStr);

  const [kanjis, setKanjis] = useState<any[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [lessonId]);

  const loadData = async () => {
    try {
      const [lessonData, allKanjis] = await Promise.all([
        api(`/lessons/${lessonId}`),
        api("/kanjis"),
      ]);

      if (lessonData) setLessonName(lessonData.lessonName || `Bài ${lessonId}`);
      if (Array.isArray(allKanjis)) {
        const filtered = allKanjis.filter((k: any) => k.lessonId === lessonId);
        setKanjis(filtered);
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
        <Link href={`/kanji/${levelName}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-jp-indigo transition-colors mb-6 uppercase tracking-widest">
            <ChevronLeft size={16} /> Quay lại danh sách bài học
        </Link>
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <Languages size={28} className="text-rose-600" />
            {lessonName}
          </h1>
          <p className="text-neutral-500 font-light">Danh sách chữ Hán (Kanji) thuộc {lessonName}</p>
        </div>

        {isLoading ? (
          <div className="text-center p-12 text-neutral-400">Đang tải dữ liệu...</div>
        ) : kanjis.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có Kanji nào</h3>
            <p className="text-neutral-500">Bài học này hiện chưa được thêm chữ Hán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kanjis.map(k => (
              <div key={k.kanjiId} className="bg-white rounded-3xl border border-black/5 p-8 hover:shadow-xl transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-24 h-24 bg-rose-50 group-hover:bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors border border-rose-100">
                    <span className="text-6xl font-serif text-rose-600 group-hover:scale-110 transition-transform">{k.character}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <h3 className="text-xl font-bold text-jp-indigo mb-3 border-b border-black/5 pb-2">{k.meaning}</h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="text-neutral-400 font-bold text-xs uppercase w-20">Onyomi</span> 
                        <span className="text-neutral-700 font-medium flex-1 bg-neutral-50 px-2 py-0.5 rounded">{k.onyomi}</span>
                      </p>
                      {k.kunyomi && (
                        <p className="flex justify-between">
                          <span className="text-neutral-400 font-bold text-xs uppercase w-20">Kunyomi</span> 
                          <span className="text-neutral-700 font-medium flex-1 bg-neutral-50 px-2 py-0.5 rounded">{k.kunyomi}</span>
                        </p>
                      )}
                      <div className="pt-3 mt-3 border-t border-black/5">
                        <span className="text-xs font-bold text-neutral-400 uppercase block mb-1">Ví dụ:</span>
                        <p className="text-neutral-600 text-sm leading-relaxed">{k.example}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
