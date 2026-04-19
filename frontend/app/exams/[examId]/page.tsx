"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Play, Pause, Volume2 } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";

interface ExamQuestion {
  examQuestionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number;
  audioUrl?: string;
}

interface Exam {
  examId: number;
  examName: string;
  duration: number;
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { loadExam(); }, [examId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [currentIndex]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft > 0]);

  const loadExam = async () => {
    try {
      const [examData, questionsData] = await Promise.all([
        api(`/exams/${examId}`),
        api(`/exam-questions?examId=${examId}`),
      ]);
      if (examData?.examId) {
        setExam(examData);
        setTimeLeft(examData.duration * 60);
      }
      if (Array.isArray(questionsData)) setQuestions(questionsData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const selectAnswer = (questionId: number, answerIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIdx }));
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Audio error", e));
      setIsPlaying(true);
    }
  };

  const handleEnded = () => setIsPlaying(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate results
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.examQuestionId] === q.correctAnswer) correctCount++;
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = score >= 60;
    const duration = exam ? (exam.duration * 60 - timeLeft) : 0;

    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).userId : 1;

    try {
      await api("/exam-results", "POST", {
        score,
        totalQuestion: totalQuestions,
        amountCorrectAnswers: correctCount,
        isPassed,
        duration,
        userId,
        examId: parseInt(examId),
      });
    } catch (e) { console.error(e); }

    // Navigate to results with data
    const resultData = {
      examName: exam?.examName,
      score,
      totalQuestion: totalQuestions,
      correctCount,
      isPassed,
      duration,
      answers,
      questions,
    };
    sessionStorage.setItem("examResult", JSON.stringify(resultData));
    router.push(`/exams/${examId}/result`);
  }, [answers, questions, exam, timeLeft, examId, isSubmitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const current = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeWarning = timeLeft < 300 && timeLeft > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-jp-washi">
        <MainNavbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center"><div className="animate-spin w-10 h-10 border-4 border-jp-indigo/20 border-t-jp-indigo rounded-full mx-auto mb-4" /><p className="text-jp-indigo font-bold">Đang tải đề thi...</p></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-jp-washi flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md">
          <AlertTriangle size={48} className="mx-auto text-orange-400 mb-4" />
          <h2 className="text-xl font-bold text-jp-indigo mb-2">Đề thi chưa có câu hỏi</h2>
          <p className="text-neutral-500 mb-6">Vui lòng quay lại và chọn đề thi khác.</p>
          <button onClick={() => router.push("/exams")} className="px-6 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red transition-colors">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <MainNavbar />
      {/* Top Bar */}
      <header className="bg-white border-b border-black/10 px-6 py-3 flex items-center justify-between sticky top-[88px] z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/exams")} className="text-neutral-400 hover:text-jp-indigo transition-colors"><ChevronLeft size={20} /></button>
          <h1 className="font-bold text-jp-indigo text-lg">{exam?.examName}</h1>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${isTimeWarning ? "bg-red-50 text-red-600 animate-pulse" : "bg-jp-indigo/5 text-jp-indigo"}`}>
          <Clock size={18} /> {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">{answeredCount}/{questions.length} đã trả lời</span>
          <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-jp-red text-white rounded-xl font-bold text-sm hover:bg-[#8b0000] transition-colors flex items-center gap-2">
            <Send size={14} /> Nộp bài
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Question Navigation */}
        <aside className="w-[200px] bg-white border-r border-black/10 p-4 overflow-y-auto hidden md:block">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Câu hỏi</p>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => (
              <button key={q.examQuestionId} onClick={() => setCurrentIndex(idx)}
                className={`w-full aspect-square rounded-lg text-xs font-bold transition-all
                  ${currentIndex === idx ? "bg-jp-indigo text-white shadow-lg scale-110" :
                    answers[q.examQuestionId] !== undefined ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}
                `}>
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Question Content */}
        <main className="flex-1 p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-3xl">
            {/* Question header */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-bold bg-jp-indigo/10 text-jp-indigo px-4 py-1.5 rounded-full">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              {/* Progress bar */}
              <div className="flex-1 mx-6 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-jp-indigo to-jp-red rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
              </div>
            </div>

            {/* Audio Player (If URL exists) */}
            {current.audioUrl && (
              <div className="mb-6 bg-jp-indigo/5 border border-jp-indigo/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 animate-fade-in shadow-inner">
                <audio ref={audioRef} src={current.audioUrl} onEnded={handleEnded} className="hidden" />
                
                <button 
                  onClick={handlePlayPause} 
                  className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-white transition-all shadow-md 
                    ${isPlaying ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-jp-indigo hover:bg-jp-indigo/90"}`}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>
                
                <div className="flex-1 w-full text-center md:text-left">
                  <p className="font-bold text-jp-indigo mb-1 text-sm">File nghe câu hỏi</p>
                  <p className="text-xs text-neutral-500">{isPlaying ? "Đang phát..." : "Nhấn nút để nghe"}</p>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Volume2 size={16} className="text-neutral-400" />
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={volume} 
                    onChange={handleVolumeChange} 
                    className="w-24 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-jp-indigo" 
                  />
                </div>
              </div>
            )}

            {/* Question */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-jp-indigo to-jp-red" />
              <p className="text-xl font-bold text-jp-indigo leading-relaxed">{current.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {[
                { idx: 0, label: "A", text: current.optionA },
                { idx: 1, label: "B", text: current.optionB },
                { idx: 2, label: "C", text: current.optionC },
                { idx: 3, label: "D", text: current.optionD },
              ].map(opt => {
                const isSelected = answers[current.examQuestionId] === opt.idx;
                return (
                  <button key={opt.idx} onClick={() => selectAnswer(current.examQuestionId, opt.idx)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 text-base font-medium
                      ${isSelected ? "border-jp-indigo bg-jp-indigo/5 text-jp-indigo shadow-md" : "border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50"}
                    `}>
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${isSelected ? "bg-jp-indigo text-white" : "bg-neutral-100 text-neutral-500"}
                    `}>{opt.label}</span>
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-50 disabled:opacity-30 transition-all">
                <ChevronLeft size={16} /> Câu trước
              </button>
              {currentIndex < questions.length - 1 ? (
                <button onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red transition-colors">
                  Câu tiếp <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-jp-red text-white rounded-xl font-bold text-sm hover:bg-[#8b0000] transition-colors">
                  <Send size={14} /> Nộp bài
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-orange-400 mb-4" />
            <h2 className="text-xl font-bold text-jp-indigo mb-2">Nộp bài thi?</h2>
            <p className="text-neutral-500 text-sm mb-2">Bạn đã trả lời <strong className="text-jp-indigo">{answeredCount}/{questions.length}</strong> câu.</p>
            {answeredCount < questions.length && <p className="text-orange-500 text-sm mb-4">⚠️ Còn {questions.length - answeredCount} câu chưa trả lời!</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-500 rounded-xl font-bold text-sm">Tiếp tục thi</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-jp-red text-white rounded-xl font-bold text-sm hover:bg-[#8b0000] disabled:opacity-50">
                {isSubmitting ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
