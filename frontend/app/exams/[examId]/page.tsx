"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Play, Pause, Volume2, BookOpen, Layers, CheckCircle2, Info } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";

interface ExamQuestion {
  examQuestionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: number;
  audioUrl?: string;
  section: number;
  mondaiNumber: number;
  passage?: string;
  imageUrl?: string;
  questionGroupId?: string;
  instruction?: string;
  explanation?: string;
}

interface Exam {
  examId: number;
  examName: string;
  duration: number;
  passScaledTotal?: number | null;
  passScaledVocabularyGrammar?: number | null;
  passScaledReading?: number | null;
  passScaledListening?: number | null;
  passScaledVocabularyGrammarReading?: number | null;
}

const SECTION_LABELS: Record<number, { label: string; jp: string; color: string }> = {
  0: { label: "Từ vựng / Chữ Hán", jp: "文字・語彙", color: "bg-blue-500" },
  1: { label: "Ngữ pháp", jp: "文法", color: "bg-purple-500" },
  2: { label: "Đọc hiểu", jp: "読解", color: "bg-emerald-500" },
  3: { label: "Nghe hiểu", jp: "聴解", color: "bg-orange-500" }
};

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Index in CURRENT section
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playedAudios, setPlayedAudios] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Group questions by section
  const sectionedQuestions = useMemo(() => {
    const groups: Record<number, ExamQuestion[]> = {};
    questions.forEach(q => {
      if (!groups[q.section]) groups[q.section] = [];
      groups[q.section].push(q);
    });
    return groups;
  }, [questions]);

  const sortedSections = useMemo(() => {
    return Object.keys(sectionedQuestions).map(Number).sort((a, b) => a - b);
  }, [sectionedQuestions]);

  const currentQuestions = useMemo(() => {
    return sectionedQuestions[currentSection] || [];
  }, [sectionedQuestions, currentSection]);

  useEffect(() => { loadExam(); }, [examId]);

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
      const userStr = localStorage.getItem("user");
      const userId = userStr ? JSON.parse(userStr).userId : 1;

      const [examData, questionsData] = await Promise.all([
        api(`/exams/${examId}`),
        api(`/exam-questions?examId=${examId}`),
      ]);
      
      if (examData?.examId) {
        setExam(examData);
        setTimeLeft(examData.duration * 60);

        try {
          const session = await api(`/exams/start-session`, "POST", {
            userId,
            examId: parseInt(examId),
            durationSeconds: examData.duration * 60
          });
          if (session && session.sessionId) {
            setSessionId(session.sessionId);
          }
        } catch (err) { console.error("Failed to start exam session", err); }
      }
      
      if (Array.isArray(questionsData)) {
        const sorted = questionsData.sort((a, b) => {
          if (a.section !== b.section) return a.section - b.section;
          if (a.mondaiNumber !== b.mondaiNumber) return a.mondaiNumber - b.mondaiNumber;
          return a.examQuestionId - b.examQuestionId;
        });
        setQuestions(sorted);
        if (sorted.length > 0) {
          setCurrentSection(sorted[0].section);
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const selectAnswer = (questionId: number, answerIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIdx }));

    if (sessionId) {
      if (debounceRef.current[questionId]) clearTimeout(debounceRef.current[questionId]);
      debounceRef.current[questionId] = setTimeout(async () => {
        try {
          await api(`/exams/auto-save-answer`, "POST", {
            sessionId,
            questionId,
            selectedOption: answerIdx.toString()
          });
        } catch (err) { console.error("Auto save failed", err); }
      }, 1000);
    }
  };

  const handlePlayAudio = () => {
    const current = currentQuestions[currentIndex];
    if (!audioRef.current || !current?.audioUrl) return;
    if (playedAudios[current.audioUrl]) return;

    audioRef.current.play().catch(e => console.error("Audio error", e));
    setIsPlaying(true);
    setPlayedAudios(prev => ({ ...prev, [current.audioUrl!]: true }));
  };

  const handleAudioEnded = () => { setIsPlaying(false); };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (sessionId) {
      try {
        await api(`/exams/submit`, "POST", { sessionId });
      } catch (err) { console.error("Failed to submit session", err); }
    }

    // Scoring logic (remains similar to before)
    let correctCount = 0;
    const sectionScores: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const sectionTotals: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

    questions.forEach(q => {
      sectionTotals[q.section]++;
      if (answers[q.examQuestionId] === q.correctAnswer) {
        correctCount++;
        sectionScores[q.section]++;
      }
    });

    const totalQuestions = questions.length;
    const vgTotal = (sectionTotals[0] || 0) + (sectionTotals[1] || 0);
    const readTotal = sectionTotals[2] || 0;
    const listenTotal = sectionTotals[3] || 0;
    const vgCorrect = (sectionScores[0] || 0) + (sectionScores[1] || 0);
    const readCorrect = sectionScores[2] || 0;
    const listenCorrect = sectionScores[3] || 0;
    
    const passScaledTotal = exam?.passScaledTotal ?? 0;
    const passScaledListening = exam?.passScaledListening ?? 0;
    const isOfficialTwoPart = exam?.passScaledVocabularyGrammarReading != null;

    let vocabularyGrammarScore = 0;
    let readingScore = 0;
    const listeningScore = listenTotal > 0 ? Math.round((listenCorrect / listenTotal) * 60) : 0;
    let score = 0;
    let isPassed = false;

    if (isOfficialTwoPart) {
      const vgrTotal = vgTotal + readTotal;
      const vgrCorrect = vgCorrect + readCorrect;
      const vocabularyGrammarReadingScore = vgrTotal > 0 ? Math.round((vgrCorrect / vgrTotal) * 120) : 0;
      vocabularyGrammarScore = vocabularyGrammarReadingScore;
      score = vocabularyGrammarReadingScore + listeningScore;
      const passScaledVGR = exam?.passScaledVocabularyGrammarReading ?? 0;
      isPassed = score >= passScaledTotal && vocabularyGrammarReadingScore >= passScaledVGR && listeningScore >= passScaledListening;
    } else {
      vocabularyGrammarScore = vgTotal > 0 ? Math.round((vgCorrect / vgTotal) * 60) : 0;
      readingScore = readTotal > 0 ? Math.round((readCorrect / readTotal) * 60) : 0;
      score = vocabularyGrammarScore + readingScore + listeningScore;
      const passScaledVG = exam?.passScaledVocabularyGrammar ?? 0;
      const passScaledR = exam?.passScaledReading ?? 0;
      isPassed = score >= passScaledTotal && vocabularyGrammarScore >= passScaledVG && readingScore >= passScaledR && listeningScore >= passScaledListening;
    }

    const durationUsed = exam ? (exam.duration * 60 - timeLeft) : 0;
    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).userId : 1;

    let savedResultId: number | undefined;
    try {
      const saved = await api("/exam-results", "POST", {
        score, totalQuestion: totalQuestions, amountCorrectAnswers: correctCount,
        isPassed, duration: durationUsed, userId, examId: parseInt(examId),
        vocabularyGrammarScore, readingScore, listeningScore, hasParalysisScore: false
      });
      if (saved && typeof saved.examResultId === "number") savedResultId = saved.examResultId;
    } catch (e) { console.error(e); }

    const resultData = {
      examName: exam?.examName, score, totalQuestion: totalQuestions, correctCount, isPassed,
      duration: durationUsed, passScaledTotal,
      passScaledVocabularyGrammar: exam?.passScaledVocabularyGrammar ?? 0,
      passScaledReading: exam?.passScaledReading ?? 0,
      passScaledListening,
      passScaledVocabularyGrammarReading: exam?.passScaledVocabularyGrammarReading ?? null,
      vocabularyGrammarScore, readingScore, listeningScore,
      answers, questions
    };
    sessionStorage.setItem("examResult", JSON.stringify(resultData));
    router.push(`/exams/${examId}/result${savedResultId ? `?rid=${savedResultId}` : ""}`);
  }, [answers, questions, exam, timeLeft, examId, isSubmitting, sessionId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const moveToNextSection = () => {
    const currentIdxInSections = sortedSections.indexOf(currentSection);
    if (currentIdxInSections < sortedSections.length - 1) {
      setCurrentSection(sortedSections[currentIdxInSections + 1]);
      setCurrentIndex(0);
    } else {
      setShowConfirm(true);
    }
  };

  const moveToPrevSection = () => {
    const currentIdxInSections = sortedSections.indexOf(currentSection);
    if (currentIdxInSections > 0) {
      const prevSection = sortedSections[currentIdxInSections - 1];
      setCurrentSection(prevSection);
      setCurrentIndex(sectionedQuestions[prevSection].length - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-jp-indigo/10 border-t-jp-indigo rounded-full animate-spin mx-auto mb-6" />
          <p className="text-jp-indigo font-black tracking-widest uppercase text-xs">Đang chuẩn bị đề thi...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuestions[currentIndex];
  const optionsList = currentQuestion ? [
    { idx: 0, label: "A", text: currentQuestion.optionA },
    { idx: 1, label: "B", text: currentQuestion.optionB },
    ...(currentQuestion.optionC ? [{ idx: 2, label: "C", text: currentQuestion.optionC }] : []),
    ...(currentQuestion.optionD ? [{ idx: 3, label: "D", text: currentQuestion.optionD }] : [])
  ] : [];

  const totalAnswered = Object.keys(answers).length;
  const isTimeCritical = timeLeft < 300 && timeLeft > 0;
  const progressPercent = Math.round((totalAnswered / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col h-screen overflow-hidden font-sans">
      <MainNavbar />

      {/* Persistent Progress Bar */}
      <div className="h-1.5 w-full bg-neutral-200 shrink-0 relative">
         <div 
          className="h-full bg-gradient-to-r from-jp-indigo to-jp-red transition-all duration-500 shadow-[0_0_10px_rgba(188,0,45,0.3)]" 
          style={{ width: `${progressPercent}%` }} 
         />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-black/5 px-8 py-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <h1 className="font-black text-jp-indigo text-lg leading-none mb-1">{exam?.examName}</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTimeCritical ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Đang trong thời gian làm bài</span>
              </div>
           </div>
        </div>

        {/* Countdown Timer */}
        <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border-2 transition-all ${isTimeCritical ? 'bg-red-50 border-red-200 text-red-600 scale-105 shadow-lg shadow-red-500/10' : 'bg-jp-indigo border-jp-indigo text-white shadow-xl shadow-jp-indigo/20'}`}>
          <Clock size={20} className={isTimeCritical ? "animate-pulse" : ""} />
          <span className="font-mono text-2xl font-black tracking-tighter">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tiến độ hoàn thành</span>
              <span className="text-sm font-black text-jp-indigo">{totalAnswered} / {questions.length} CÂU</span>
           </div>
           <button 
            onClick={() => setShowConfirm(true)} 
            className="px-6 py-3 bg-jp-red text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-jp-red/30 transition-all active:scale-95 flex items-center gap-2"
           >
             <Send size={14} /> Nộp bài
           </button>
        </div>
      </header>

      {/* Section Tab Bar */}
      <div className="bg-white border-b border-black/5 flex px-8 py-1 overflow-x-auto no-scrollbar shrink-0">
         {sortedSections.map(s => {
           const isActive = currentSection === s;
           const config = SECTION_LABELS[s] || { label: `Phần ${s}`, jp: "", color: "bg-neutral-500" };
           const answeredInSection = sectionedQuestions[s].filter(q => answers[q.examQuestionId] !== undefined).length;
           const totalInSection = sectionedQuestions[s].length;
           
           return (
             <button 
              key={s} 
              onClick={() => { setCurrentSection(s); setCurrentIndex(0); }}
              className={`flex flex-col items-start px-6 py-3 border-b-4 transition-all min-w-[200px] hover:bg-neutral-50 ${isActive ? 'border-jp-red bg-jp-red/[0.02]' : 'border-transparent'}`}
             >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${config.color}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-jp-red' : 'text-neutral-400'}`}>{config.label}</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-jp-indigo">{config.jp}</span>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{answeredInSection}/{totalInSection}</span>
                </div>
             </button>
           );
         })}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Nav (Specific to current section) */}
        <aside className="w-72 bg-white border-r border-black/5 p-6 overflow-y-auto hidden xl:block shrink-0 custom-scrollbar">
           <div className="flex items-center gap-2 mb-6 text-neutral-400">
             <Layers size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Danh sách câu hỏi</span>
           </div>
           
           <div className="grid grid-cols-4 gap-3">
              {currentQuestions.map((q, idx) => {
                const isSelected = currentIndex === idx;
                const isAnswered = answers[q.examQuestionId] !== undefined;
                return (
                  <button 
                    key={q.examQuestionId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`aspect-square rounded-xl text-xs font-black transition-all flex items-center justify-center border-2
                      ${isSelected ? 'bg-jp-indigo border-jp-indigo text-white shadow-lg shadow-jp-indigo/20 scale-110' : 
                        isAnswered ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-neutral-100 text-neutral-400 hover:border-jp-indigo/20'}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
           </div>

           <div className="mt-10 p-6 bg-jp-indigo text-white rounded-3xl shadow-xl shadow-jp-indigo/20">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-jp-red" />
                <span className="text-[10px] font-black uppercase tracking-widest">Lưu ý</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed opacity-80">
                Hãy kiểm tra kỹ các câu hỏi trước khi sang phần thi tiếp theo. Bạn có thể quay lại các phần trước đó bất kỳ lúc nào.
              </p>
           </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
           
           {/* Section Splash Overlay (Optional: only if you want a transition) */}

           <div className="flex-1 flex overflow-hidden">
              {/* Reading Passage Split View */}
              {currentQuestion?.passage && (
                <div className="w-1/2 h-full bg-white border-r border-black/5 overflow-y-auto p-12 custom-scrollbar shadow-inner">
                   <div className="max-w-xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-jp-indigo text-white text-[10px] font-black uppercase tracking-widest rounded-xl mb-10">
                        <BookOpen size={14} /> Đoạn văn đọc hiểu
                      </div>
                      <div className="text-jp-indigo text-lg leading-[2.2] font-medium font-japanese whitespace-pre-wrap">
                        {currentQuestion.passage}
                      </div>
                   </div>
                </div>
              )}

              {/* Question View */}
              <div className={`flex-1 overflow-y-auto p-12 custom-scrollbar bg-white/30 ${!currentQuestion?.passage ? 'max-w-4xl mx-auto w-full' : ''}`}>
                 
                 {/* Question Card */}
                 <div className="max-w-2xl mx-auto">
                    
                    {/* Instructions */}
                    {currentQuestion?.instruction && (
                      <div className="bg-white border-2 border-jp-indigo/5 p-6 rounded-3xl mb-8 shadow-sm flex items-start gap-4">
                        <div className="bg-jp-indigo text-white p-2 rounded-xl shrink-0"><Layers size={16} /></div>
                        <p className="text-sm font-bold text-jp-indigo leading-relaxed">{currentQuestion.instruction}</p>
                      </div>
                    )}

                    {/* Audio Player (Listening Section) */}
                    {currentQuestion?.audioUrl && (
                      <div className="mb-10 bg-white border-2 border-black/5 rounded-[2rem] p-8 shadow-xl shadow-black/5 flex flex-col md:flex-row items-center gap-8 group">
                        <audio ref={audioRef} src={currentQuestion.audioUrl} onEnded={handleAudioEnded} className="hidden" />
                        <button 
                          onClick={handlePlayAudio}
                          disabled={playedAudios[currentQuestion.audioUrl!] && !isPlaying}
                          className={`w-20 h-20 shrink-0 flex items-center justify-center rounded-full text-white shadow-2xl transition-all
                            ${isPlaying ? 'bg-orange-500 animate-pulse' : 
                              playedAudios[currentQuestion.audioUrl!] ? 'bg-neutral-200' : 'bg-jp-indigo hover:scale-110 active:scale-95'}
                          `}
                        >
                          {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                        </button>
                        <div className="flex-1 text-center md:text-left">
                           <h4 className="text-lg font-black text-jp-indigo mb-1 uppercase tracking-tight">Listening Audio</h4>
                           <p className={`text-sm font-bold ${playedAudios[currentQuestion.audioUrl!] && !isPlaying ? 'text-red-500' : 'text-neutral-400'}`}>
                             {isPlaying ? 'Đang phát âm thanh...' : 
                               playedAudios[currentQuestion.audioUrl!] ? 'Đã phát xong (Chỉ nghe 1 lần)' : 'Nhấn nút để nghe (Chỉ được nghe 1 lần duy nhất!)'}
                           </p>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-black/5 flex items-center gap-3">
                           <Volume2 size={16} className="text-neutral-400" />
                           <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => {
                             const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v;
                           }} className="w-24 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-jp-indigo" />
                        </div>
                      </div>
                    )}

                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-6">
                       <span className="px-4 py-1.5 bg-jp-indigo/5 text-jp-indigo text-[10px] font-black uppercase tracking-widest rounded-full">
                         Câu {currentIndex + 1} của {currentQuestions.length}
                       </span>
                    </div>

                    {/* Question Content */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-black/5 p-10 mb-8 relative">
                       <div className="absolute top-10 left-0 w-2 h-10 bg-jp-red rounded-r-full" />
                       <h2 className="text-2xl md:text-3xl font-black text-jp-indigo leading-snug font-japanese">
                         {currentQuestion?.question}
                       </h2>
                       {currentQuestion?.imageUrl && (
                         <div className="mt-10 rounded-3xl overflow-hidden border-4 border-neutral-50 shadow-inner inline-block">
                           <img src={currentQuestion.imageUrl} alt="attachment" className="max-h-80 object-contain" />
                         </div>
                       )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-4 mb-10">
                       {optionsList.map(opt => {
                         const isSelected = answers[currentQuestion.examQuestionId] === opt.idx;
                         return (
                           <button 
                            key={opt.idx}
                            onClick={() => selectAnswer(currentQuestion.examQuestionId, opt.idx)}
                            className={`group w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center gap-6
                              ${isSelected ? 'bg-jp-indigo border-jp-indigo text-white shadow-2xl shadow-jp-indigo/20 scale-[1.02]' : 
                                'bg-white border-black/5 text-jp-indigo hover:border-jp-indigo/20 hover:bg-neutral-50'}
                            `}
                           >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-colors shrink-0
                                ${isSelected ? 'bg-white text-jp-indigo' : 'bg-neutral-100 text-neutral-400 group-hover:bg-jp-indigo/5 group-hover:text-jp-indigo'}
                              `}>
                                {opt.label}
                              </div>
                              <span className="text-lg font-bold leading-tight">{opt.text}</span>
                           </button>
                         );
                       })}
                    </div>
                 </div>
              </div>
           </div>

           {/* Navigation Controls Footer */}
           <footer className="bg-white border-t border-black/5 px-8 py-5 flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-20">
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                    else moveToPrevSection();
                  }}
                  disabled={currentIndex === 0 && sortedSections.indexOf(currentSection) === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black/5 text-neutral-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} /> Quay lại
                </button>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                 <span className="text-xs font-black text-jp-indigo">{currentIndex + 1} / {currentQuestions.length}</span>
              </div>

              <div className="flex gap-3">
                {currentIndex < currentQuestions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="flex items-center gap-2 px-8 py-3 bg-jp-indigo text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-jp-indigo/20 transition-all active:scale-95"
                  >
                    Tiếp theo <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={moveToNextSection}
                    className="flex items-center gap-2 px-8 py-3 bg-jp-red text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-jp-red/20 transition-all active:scale-95"
                  >
                    {sortedSections.indexOf(currentSection) < sortedSections.length - 1 ? 'Phần tiếp theo' : 'Nộp bài'} <ChevronRight size={16} />
                  </button>
                )}
              </div>
           </footer>
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-jp-indigo/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 text-center animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-jp-indigo to-jp-red" />
              <div className="w-20 h-20 bg-jp-red/10 text-jp-red rounded-full flex items-center justify-center mx-auto mb-8">
                 <AlertTriangle size={40} />
              </div>
              <h2 className="text-3xl font-black text-jp-indigo mb-4 tracking-tight">Xác nhận nộp bài?</h2>
              <p className="text-neutral-500 font-medium mb-8">
                Bạn đã hoàn thành <span className="font-black text-jp-red">{totalAnswered} / {questions.length}</span> câu hỏi. 
                Bạn có chắc chắn muốn kết thúc phần thi không?
              </p>

              <div className="flex flex-col gap-3">
                 <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-jp-indigo text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-jp-indigo/20 transition-all disabled:opacity-50"
                 >
                   {isSubmitting ? 'ĐANG NỘP BÀI...' : 'ĐỒNG Ý NỘP BÀI'}
                 </button>
                 <button 
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-4 bg-neutral-100 text-neutral-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 transition-all"
                 >
                   TIẾP TỤC LÀM BÀI
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
