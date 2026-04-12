"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { Headphones, ChevronLeft, BookOpen, Volume2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ListeningDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string; 
  const lessonIdStr = params.lessonId as string;
  const lessonId = parseInt(lessonIdStr);

  const [listenings, setListenings] = useState<any[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // States for quiz
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, string>>({});
  const [listeningChecked, setListeningChecked] = useState<Record<number, boolean>>({});

  useEffect(() => { loadData(); }, [lessonId]);

  const loadData = async () => {
    try {
      const [lessonData, allListenings] = await Promise.all([
        api(`/lessons/${lessonId}`),
        api("/listenings"),
      ]);

      if (lessonData) setLessonName(lessonData.lessonName || `Bài ${lessonId}`);
      if (Array.isArray(allListenings)) {
        const filtered = allListenings.filter((l: any) => l.lessonId === lessonId);
        setListenings(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (id: number, answer: string) => {
    if (listeningChecked[id]) return;
    setListeningAnswers(prev => ({ ...prev, [id]: answer }));
  };

  const checkAnswer = (id: number) => {
    setListeningChecked(prev => ({ ...prev, [id]: true }));
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <Link href={`/listening/${levelName}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-jp-indigo transition-colors mb-6 uppercase tracking-widest">
            <ChevronLeft size={16} /> Quay lại danh sách bài học
        </Link>
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <Headphones size={28} className="text-cyan-600" />
            {lessonName}
          </h1>
          <p className="text-neutral-500 font-light">Danh sách các bài luyện nghe thuộc {lessonName}</p>
        </div>

        {isLoading ? (
          <div className="text-center p-12 text-neutral-400">Đang tải dữ liệu...</div>
        ) : listenings.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có bài nghe nào</h3>
            <p className="text-neutral-500">Bài học này hiện chưa được thêm bài nghe hiểu.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {listenings.map((item, idx) => {
              const selected = listeningAnswers[item.listeningId];
              const checked = listeningChecked[item.listeningId];
              const isCorrect = selected === item.correctAnswer;
              
              return (
                <div key={item.listeningId} className="bg-white rounded-2xl border border-black/5 p-8 md:p-10 hover:shadow-xl hover:border-cyan-500/20 transition-all duration-300">
                  <div className="flex flex-wrap items-center gap-4 mb-8 border-b border-black/5 pb-6">
                    <span className="text-sm font-bold bg-cyan-50 text-cyan-700 px-6 py-2 rounded-full uppercase tracking-widest border border-cyan-100">
                      Câu {idx + 1}
                    </span>
                    {item.audioUrl && (
                      <button
                        onClick={() => new Audio(item.audioUrl).play()}
                        className="flex items-center gap-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-full transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-cyan-500/20 active:scale-95"
                      >
                        <Volume2 size={16} /> Nghe Audio
                      </button>
                    )}
                  </div>
                  
                  <p className="text-2xl font-bold text-jp-indigo mb-10 leading-snug">{item.question}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                    {["A", "B", "C", "D"].map(opt => {
                      const optionText = item[`option${opt}`];
                      const isSelected = selected === opt;
                      const isRight = checked && opt === item.correctAnswer;
                      const isWrong = checked && isSelected && !isCorrect && opt !== item.correctAnswer;
                      
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(item.listeningId, opt)}
                          disabled={checked}
                          className={`text-left p-6 rounded-2xl border-2 transition-all text-base font-medium flex items-center gap-5 group
                            ${isRight ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-sm" : 
                              isWrong ? "border-red-400 bg-red-50/50 text-red-700 shadow-sm" :
                              isSelected ? "border-cyan-500 bg-cyan-50/30 text-cyan-800 shadow-md ring-4 ring-cyan-500/10" : 
                              "border-neutral-100 hover:border-cyan-300 hover:bg-cyan-50/10 text-neutral-700 bg-white shadow-sm hover:shadow-md"
                            }
                            ${checked ? "cursor-default opacity-90" : "cursor-pointer active:scale-[0.98]"}
                          `}
                        >
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors
                            ${isRight ? "bg-emerald-500 text-white" : 
                              isWrong ? "bg-red-400 text-white" : 
                              isSelected ? "bg-cyan-500 text-white shadow-sm" : 
                              "bg-neutral-100 text-neutral-500 group-hover:bg-cyan-100 group-hover:text-cyan-700"}
                          `}>{opt}</span>
                          <span className="flex-1 leading-relaxed">{optionText}</span>
                          {isRight && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce-short"><CheckCircle2 size={18} className="text-emerald-600" /></div>}
                          {isWrong && <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center animate-shake"><XCircle size={18} className="text-red-500" /></div>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {selected && !checked && (
                      <button onClick={() => checkAnswer(item.listeningId)} className="px-8 py-4 bg-jp-indigo text-white rounded-xl text-sm font-bold tracking-[0.1em] hover:bg-jp-red transition-colors shadow-lg uppercase active:scale-95 text-center">
                        Kiểm tra đáp án
                      </button>
                    )}

                    {checked && (
                      <div className={`p-5 rounded-2xl text-md font-bold flex items-center gap-4 flex-1 shadow-sm ${isCorrect ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                        {isCorrect ? (
                          <><div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0"><CheckCircle2 size={24} /></div> <span className="text-lg">Chính xác tuyệt đối!</span></>
                        ) : (
                          <><div className="w-10 h-10 rounded-full bg-red-400 text-white flex items-center justify-center flex-shrink-0"><XCircle size={24} /></div> <span className="text-lg">Rất tiếc! Đáp án đúng là {item.correctAnswer}</span></>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
