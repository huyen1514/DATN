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
                <div key={item.listeningId} className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-bold bg-cyan-50 text-cyan-600 px-5 py-2.5 rounded-full uppercase tracking-widest">
                      Câu {idx + 1}
                    </span>
                    {item.audioUrl && (
                      <button
                        onClick={() => new Audio(item.audioUrl).play()}
                        className="flex items-center gap-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 rounded-full transition-colors shadow-md"
                      >
                        <Volume2 size={16} /> Nghe Audio
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xl font-bold text-jp-indigo mb-8">{item.question}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                          className={`text-left p-5 rounded-2xl border-2 transition-all text-base font-medium flex items-center gap-4
                            ${isRight ? "border-green-500 bg-green-50 text-green-700" : 
                              isWrong ? "border-red-400 bg-red-50 text-red-600" :
                              isSelected ? "border-jp-indigo bg-jp-indigo/5 text-jp-indigo shadow-md" : 
                              "border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white"
                            }
                            ${checked ? "cursor-default" : "cursor-pointer hover:shadow-sm"}
                          `}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                            ${isRight ? "bg-green-500 text-white" : isWrong ? "bg-red-400 text-white" : isSelected ? "bg-jp-indigo text-white" : "bg-neutral-100 text-neutral-500"}
                          `}>{opt}</span>
                          {optionText}
                          {isRight && <CheckCircle2 size={20} className="ml-auto text-green-500" />}
                          {isWrong && <XCircle size={20} className="ml-auto text-red-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4">
                    {selected && !checked && (
                      <button onClick={() => checkAnswer(item.listeningId)} className="px-8 py-3 bg-jp-indigo text-white rounded-xl text-sm font-bold tracking-wider hover:bg-jp-red transition-colors shadow-md uppercase">
                        Kiểm tra đáp án
                      </button>
                    )}

                    {checked && (
                      <div className={`flex-1 p-5 rounded-xl text-md font-bold flex items-center gap-3 ${isCorrect ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                        {isCorrect ? <><CheckCircle2 size={20} /> Chính xác!</> : <><XCircle size={20} /> Sai rồi! Đáp án đúng là {item.correctAnswer}</>}
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
