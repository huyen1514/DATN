"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { BookA, ChevronLeft, Volume2 } from "lucide-react";
import Link from "next/link";

export default function VocabularyDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string; 
  const lessonIdStr = params.lessonId as string;
  const lessonId = parseInt(lessonIdStr);

  const [vocabs, setVocabs] = useState<any[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [lessonId]);

  const loadData = async () => {
    try {
      const [lessonData, allVocabs] = await Promise.all([
        api(`/lessons/${lessonId}`),
        api("/vocabularies"),
      ]);

      if (lessonData) setLessonName(lessonData.lessonName || `Bài ${lessonId}`);
      if (Array.isArray(allVocabs)) {
        const filtered = allVocabs.filter((v: any) => v.lessonId === lessonId);
        setVocabs(filtered);
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
        <Link href={`/vocabulary/${levelName}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-jp-indigo transition-colors mb-6 uppercase tracking-widest">
            <ChevronLeft size={16} /> Quay lại danh sách bài học
        </Link>
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <BookA size={28} className="text-emerald-600" />
            {lessonName}
          </h1>
          <p className="text-neutral-500 font-light">Danh sách từ vựng thuộc {lessonName}</p>
        </div>

        {isLoading ? (
          <div className="text-center p-12 text-neutral-400">Đang tải dữ liệu...</div>
        ) : vocabs.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookA size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có Từ vựng nào</h3>
            <p className="text-neutral-500">Bài học này hiện chưa được thêm từ vựng.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vocabs.map((v, i) => (
              <div key={v.vocabularyId} className="bg-white rounded-2xl border border-black/5 p-6 md:p-8 hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 group flex flex-col md:flex-row md:items-center gap-6 md:gap-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex-shrink-0 min-w-[280px] flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center text-emerald-600/50 font-bold text-sm border border-emerald-100/50 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-3xl font-serif font-bold text-jp-indigo group-hover:text-emerald-700 transition-colors">{v.word}</span>
                      {v.audioUrl && (
                        <button onClick={() => new Audio(v.audioUrl).play()} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all cursor-pointer opacity-40 group-hover:opacity-100 shadow-sm border border-emerald-200/50">
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                    <span className="text-sm font-bold text-jp-red tracking-widest">{v.reading}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100/80 border border-black/5 px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">{v.partOfSpeech || "Từ vựng"}</span>
                     <span className="text-base font-semibold text-neutral-700 leading-relaxed">{v.meaning}</span>
                  </div>
                  
                  {v.example && (
                    <div className="mt-2 pl-4 border-l-[3px] border-emerald-100">
                      <p className="text-sm text-neutral-500 italic leading-relaxed">{v.example}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
