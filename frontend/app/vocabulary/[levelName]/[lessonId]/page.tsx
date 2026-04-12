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
          <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
            <div className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5 bg-emerald-50/30">
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-emerald-600 tracking-wider uppercase">Từ vựng</th>
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-emerald-600 tracking-wider uppercase">Cách đọc</th>
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-emerald-600 tracking-wider uppercase">Ý nghĩa</th>
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-emerald-600 tracking-wider uppercase">Loại từ</th>
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-emerald-600 tracking-wider uppercase">Ví dụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {vocabs.map(v => (
                    <tr key={v.vocabularyId} className="hover:bg-neutral-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-serif font-bold text-jp-indigo">{v.word}</span>
                          {v.audioUrl && (
                            <button onClick={() => new Audio(v.audioUrl).play()} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-emerald-500 hover:text-white transition-all">
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-jp-red font-medium">{v.reading}</td>
                      <td className="px-8 py-6 text-sm text-neutral-700">{v.meaning}</td>
                      <td className="px-8 py-6 text-xs font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded inline-block mt-4 ml-6">{v.partOfSpeech || "—"}</td>
                      <td className="px-8 py-6 text-xs text-neutral-500 max-w-[200px] leading-relaxed">{v.example || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
