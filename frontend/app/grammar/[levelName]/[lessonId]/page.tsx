"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { PenTool, ChevronLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function GrammarDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string; 
  const lessonIdStr = params.lessonId as string;
  const lessonId = parseInt(lessonIdStr);

  const [grammars, setGrammars] = useState<any[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [lessonId]);

  const loadData = async () => {
    try {
      const [lessonData, allGrammars] = await Promise.all([
        api(`/lessons/${lessonId}`),
        api("/grammars"),
      ]);

      if (lessonData) setLessonName(lessonData.lessonName || `Bài ${lessonId}`);
      if (Array.isArray(allGrammars)) {
        const filtered = allGrammars.filter((g: any) => g.lessonId === lessonId);
        setGrammars(filtered);
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
        <Link href={`/grammar/${levelName}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-jp-indigo transition-colors mb-6 uppercase tracking-widest">
            <ChevronLeft size={16} /> Quay lại danh sách bài học
        </Link>
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <PenTool size={28} className="text-amber-600" />
            {lessonName}
          </h1>
          <p className="text-neutral-500 font-light">Danh sách các cấu trúc ngữ pháp thuộc {lessonName}</p>
        </div>

        {isLoading ? (
          <div className="text-center p-12 text-neutral-400">Đang tải dữ liệu...</div>
        ) : grammars.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có Ngữ Pháp nào</h3>
            <p className="text-neutral-500">Bài học này hiện chưa được thêm ngữ pháp.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grammars.map(g => (
              <div key={g.grammarId} className="bg-white rounded-3xl border border-black/5 p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-xl font-serif">{g.grammarName}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="bg-neutral-50 rounded-xl p-5 mb-4 border border-black/5">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Cấu trúc</p>
                      <p className="text-jp-indigo font-mono font-bold text-lg">{g.structure}</p>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Ý nghĩa & Cách dùng</p>
                      <p className="text-neutral-700 leading-relaxed">{g.meaning}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Ví dụ minh hoạ</p>
                    <p className="text-blue-900 italic text-lg leading-relaxed">{g.example}</p>
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
