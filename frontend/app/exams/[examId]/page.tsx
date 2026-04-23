"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Play, Pause, Volume2, BookOpen } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";

interface ExamQuestion {
  [x: string]: any;
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

const SECTION_LABELS: Record<number, string> = {
  0: "Từ vựng / Chữ Hán",
  1: "Ngữ pháp",
  2: "Đọc hiểu",
  3: "Nghe hiểu"
};

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
  const [sessionId, setSessionId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playedAudios, setPlayedAudios] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { loadExam(); }, [examId]);

  // Audio Sync per Question (To avoid restarting when navigating questions sharing same Audio)
  useEffect(() => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIndex];

    // If audio is playing but user navigates to a question WITHOUT this audio, we should probably pause it.
    // However, for real JLPT test, user won't navigate away; we just let it run or force UI.
    // Let's keep it simple: we do not halt the Audio if they just switch sub-questions.
  }, [currentIndex, questions]);

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

        // Start session
        try {
          const session = await api(`/exams/start-session`, "POST", {
            userId,
            examId: parseInt(examId),
            durationSeconds: examData.duration * 60
          });
          if (session && session.sessionId) {
            setSessionId(session.sessionId);
          }
        } catch (err) {
          console.error("Failed to start exam session", err);
        }
      }
      if (Array.isArray(questionsData)) {
        const sorted = questionsData.sort((a, b) => {
          if (a.section !== b.section) return a.section - b.section;
          if (a.mondaiNumber !== b.mondaiNumber) return a.mondaiNumber - b.mondaiNumber;
          return a.examQuestionId - b.examQuestionId;
        });
        setQuestions(sorted);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const selectAnswer = (questionId: number, answerIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIdx }));

    if (sessionId) {
      if (debounceRef.current[questionId]) {
        clearTimeout(debounceRef.current[questionId]);
      }
      debounceRef.current[questionId] = setTimeout(async () => {
        try {
          await api(`/exams/auto-save-answer`, "POST", {
            sessionId,
            questionId,
            selectedOption: answerIdx.toString()
          });
        } catch (err) {
          console.error("Auto save failed", err);
        }
      }, 1500);
    }
  };

  const handlePlayAudio = () => {
    const current = questions[currentIndex];
    if (!audioRef.current || !current.audioUrl) return;

    // Disable playing again if already played for this exam session! (JLPT style)
    if (playedAudios[current.audioUrl]) return;

    audioRef.current.play().catch(e => console.error("Audio error", e));
    setIsPlaying(true);
    setPlayedAudios(prev => ({ ...prev, [current.audioUrl!]: true }));
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (sessionId) {
      try {
        await api(`/exams/submit`, "POST", { sessionId });
      } catch (err) {
        console.error("Failed to submit session", err);
      }
    }

    // Calculate score by section (JLPT style: 60 + 60 + 60)
    let correctCount = 0;
    const sectionScores = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const sectionTotals = { 0: 0, 1: 0, 2: 0, 3: 0 };

    questions.forEach(q => {
      sectionTotals[q.section as keyof typeof sectionTotals]++;
      if (answers[q.examQuestionId] === q.correctAnswer) {
        correctCount++;
        sectionScores[q.section as keyof typeof sectionScores]++;
      }
    });

    const totalQuestions = questions.length;
    const vgTotal = sectionTotals[0] + sectionTotals[1];
    const readTotal = sectionTotals[2];
    const listenTotal = sectionTotals[3];
    const vgCorrect = sectionScores[0] + sectionScores[1];
    const readCorrect = sectionScores[2];
    const listenCorrect = sectionScores[3];
    const passScaledTotal = exam?.passScaledTotal ?? 0;
    const passScaledListening = exam?.passScaledListening ?? 0;

    const isOfficialTwoPart = exam?.passScaledVocabularyGrammarReading != null;

    // Scores to send to backend
    let vocabularyGrammarScore = 0;
    let readingScore = 0;
    let listeningScore = listenTotal > 0 ? Math.round((listenCorrect / listenTotal) * 60) : 0;
    let score = 0;
    let isPassed = false;

    if (isOfficialTwoPart) {
      const vgrTotal = vgTotal + readTotal;
      const vgrCorrect = vgCorrect + readCorrect;
      const vocabularyGrammarReadingScore = vgrTotal > 0 ? Math.round((vgrCorrect / vgrTotal) * 120) : 0;

      // Convention: store combined 120-score into vocabularyGrammarScore
      vocabularyGrammarScore = vocabularyGrammarReadingScore;
      readingScore = 0;
      score = vocabularyGrammarReadingScore + listeningScore;

      const passScaledVocabularyGrammarReading = exam?.passScaledVocabularyGrammarReading ?? 0;
      isPassed =
        score >= passScaledTotal &&
        vocabularyGrammarReadingScore >= passScaledVocabularyGrammarReading &&
        listeningScore >= passScaledListening;
    } else {
      // Custom 3-part format (60+60+60)
      vocabularyGrammarScore = vgTotal > 0 ? Math.round((vgCorrect / vgTotal) * 60) : 0;
      readingScore = readTotal > 0 ? Math.round((readCorrect / readTotal) * 60) : 0;
      score = vocabularyGrammarScore + readingScore + listeningScore;

      const passScaledVocabularyGrammar = exam?.passScaledVocabularyGrammar ?? 0;
      const passScaledReading = exam?.passScaledReading ?? 0;
      isPassed =
        score >= passScaledTotal &&
        vocabularyGrammarScore >= passScaledVocabularyGrammar &&
        readingScore >= passScaledReading &&
        listeningScore >= passScaledListening;
    }
    const duration = exam ? (exam.duration * 60 - timeLeft) : 0;

    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).userId : 1;

    let savedResultId: number | undefined;
    try {
      const saved = await api("/exam-results", "POST", {
        score,
        totalQuestion: totalQuestions,
        amountCorrectAnswers: correctCount,
        isPassed,
        duration,
        userId,
        examId: parseInt(examId),
        vocabularyGrammarScore,
        readingScore,
        listeningScore,
        hasParalysisScore: false
      });
      if (saved && typeof saved.examResultId === "number") savedResultId = saved.examResultId;
    } catch (e) { console.error(e); }

    const resultData = {
      examName: exam?.examName,
      score,
      totalQuestion: totalQuestions,
      correctCount,
      isPassed,
      duration,
      passScaledTotal,
      passScaledVocabularyGrammar: exam?.passScaledVocabularyGrammar ?? 0,
      passScaledReading: exam?.passScaledReading ?? 0,
      passScaledListening,
      passScaledVocabularyGrammarReading: exam?.passScaledVocabularyGrammarReading ?? null,
      vocabularyGrammarScore,
      readingScore,
      listeningScore,
      answers,
      questions,
    };
    sessionStorage.setItem("examResult", JSON.stringify(resultData));
    const q = savedResultId != null ? `?rid=${savedResultId}` : "";
    router.push(`/exams/${examId}/result${q}`);
  }, [answers, questions, exam, timeLeft, examId, isSubmitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <MainNavbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center"><div className="animate-spin w-10 h-10 border-4 border-jp-indigo/20 border-t-jp-indigo rounded-full mx-auto mb-4" /><p className="text-jp-indigo font-bold">Đang tải đề thi...</p></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md">
            <AlertTriangle size={48} className="mx-auto text-orange-400 mb-4" />
            <h2 className="text-xl font-bold text-jp-indigo mb-2">Đề thi chưa có câu hỏi</h2>
            <p className="text-neutral-500 mb-6">Xin lỗi, cấu trúc bài thi đang được bảo trì.</p>
            <button onClick={() => router.push("/exams")} className="px-6 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red transition-colors">Quay lại</button>
          </div>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  // Calculate Options (Filtering out nulls)
  const optionsList = [
    { idx: 0, label: "A", text: current.optionA },
    { idx: 1, label: "B", text: current.optionB },
  ];
  if (current.optionC) optionsList.push({ idx: 2, label: "C", text: current.optionC });
  if (current.optionD) optionsList.push({ idx: 3, label: "D", text: current.optionD });

  const answeredCount = Object.keys(answers).length;
  const isTimeWarning = timeLeft < 300 && timeLeft > 0;
  const hasPassage = !!current.passage;

  // Grouping for sidebar
  const groupedQuestions = questions.reduce((acc, q, idx) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push({ ...q, globalIdx: idx });
    return acc;
  }, {} as Record<number, (ExamQuestion & { globalIdx: number })[]>);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col h-screen overflow-hidden">
      <MainNavbar />

      {/* Top Bar */}
      <header className="bg-white border-b border-black/10 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/exams")} className="text-neutral-400 hover:text-jp-indigo transition-colors"><ChevronLeft size={20} /></button>
          <h1 className="font-bold text-jp-indigo text-lg line-clamp-1 max-w-[200px] sm:max-w-md">{exam?.examName}</h1>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl border ${isTimeWarning ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-neutral-50 text-jp-indigo border-neutral-200"}`}>
          <Clock size={18} className={isTimeWarning ? "text-red-500" : "text-neutral-400"} /> {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-neutral-500 hidden sm:inline">{answeredCount}/{questions.length} đã trả lời</span>
          <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-sm shadow-jp-indigo/30 transition-all flex items-center gap-2">
            <Send size={14} /> Nộp bài
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar Nav */}
        <aside className="w-[280px] bg-white border-r border-neutral-200 p-4 overflow-y-auto hidden lg:block shrink-0 custom-scrollbar">
          {Object.entries(groupedQuestions).map(([sectionId, sectionQuestions]) => {
            const sectionNum = parseInt(sectionId);
            const isCurrentSection = current.section === sectionNum;
            return (
              <div key={sectionId} className="mb-6">
                <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between
                    ${isCurrentSection ? "text-jp-indigo border-jp-indigo/20" : "text-neutral-400 border-neutral-100"}`}>
                  {SECTION_LABELS[sectionNum] || `Section ${sectionNum}`}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {sectionQuestions.map((q) => (
                    <button
                      key={q.examQuestionId}
                      onClick={() => setCurrentIndex(q.globalIdx)}
                      title={`Mondai ${q.mondaiNumber} - Câu ${q.globalIdx + 1}`}
                      className={`w-full aspect-square rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center
                         ${currentIndex === q.globalIdx ? "bg-jp-indigo text-white shadow-md ring-2 ring-jp-indigo/20 scale-105 z-10" :
                          answers[q.examQuestionId] !== undefined ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50"}
                       `}>
                      {q.globalIdx + 1}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Content View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white/50">

          <div className="flex-1 flex overflow-hidden">
            {/* Split Screen: Left Side (Passage) */}
            {hasPassage && (
              <div className="w-1/2 h-full border-r border-neutral-200 bg-white overflow-y-auto p-6 md:p-10 custom-scrollbar shadow-inner">
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-jp-indigo/10 text-jp-indigo text-xs font-bold rounded-lg mb-6 tracking-wide">
                    <BookOpen size={14} /> BÀI ĐỌC
                  </div>
                  {current.instruction && (
                    <p className="font-bold text-neutral-800 mb-6 pb-4 border-b border-neutral-100 leading-relaxed">
                      {current.instruction}
                    </p>
                  )}
                  <div className="text-neutral-700 leading-loose text-base font-medium whitespace-pre-wrap">
                    {current.passage}
                  </div>
                </div>
              </div>
            )}

            {/* Split Screen: Right Side (Question & Options) */}
            <div className={`p-6 md:p-10 overflow-y-auto flex flex-col custom-scrollbar ${hasPassage ? 'w-1/2 bg-neutral-50/50' : 'w-full lg:px-24 xl:px-48 relative'}`}>
              <div className={`w-full ${!hasPassage ? 'max-w-3xl mx-auto' : ''}`}>

                {/* Header Info Question */}
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Mondai {current.mondaiNumber} • Câu số {currentIndex + 1}
                  </span>
                </div>

                {/* Instruction (If no passage, display it here) */}
                {!hasPassage && current.instruction && (
                  <div className="bg-white border border-neutral-200 p-5 rounded-2xl mb-6 shadow-sm">
                    <p className="font-bold text-jp-indigo leading-relaxed">{current.instruction}</p>
                  </div>
                )}

                {/* Audio Player (If Audio Url Exists) */}
                {current.audioUrl && (
                  <div className="mb-8 bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-5 shadow-sm">
                    <audio
                      ref={audioRef}
                      src={current.audioUrl}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />

                    <button
                      onClick={handlePlayAudio}
                      disabled={playedAudios[current.audioUrl!] && !isPlaying}
                      className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full text-white transition-all shadow-md 
                            ${isPlaying ? "bg-amber-500 animate-pulse" :
                          playedAudios[current.audioUrl!] ? "bg-neutral-300 cursor-not-allowed" : "bg-jp-indigo hover:scale-105"}`}
                    >
                      {isPlaying ? <Volume2 size={24} className="animate-bounce" /> : <Play size={24} className="ml-1" />}
                    </button>

                    <div className="flex-1 w-full text-center md:text-left">
                      <p className="font-bold text-neutral-800 mb-1 text-sm tracking-wide">Audio Băng Nghe</p>
                      <p className={`text-xs font-medium ${playedAudios[current.audioUrl!] && !isPlaying ? "text-red-500" : "text-neutral-500"}`}>
                        {isPlaying ? "Đang phát đoạn hội thoại..." :
                          playedAudios[current.audioUrl!] ? "Đã phát (Không nghe lại)" : "Chỉ được nghe 1 lần duy nhất!"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100">
                      <Volume2 size={18} className={volume === 0 ? "text-neutral-300" : "text-neutral-500"} />
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-jp-indigo"
                      />
                    </div>
                  </div>
                )}

                {/* Question Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 sm:p-8 mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-jp-indigo transition-all group-hover:bg-jp-red" />
                  <p className="text-xl sm:text-2xl font-bold text-neutral-800 leading-relaxed mb-4">{current.question}</p>
                  {current.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-neutral-200 mt-6 inline-block bg-neutral-50 p-2">
                      <img src={current.imageUrl} alt="attachment" className="max-h-64 object-contain rounded-lg shadow-sm" />
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-4 mb-8">
                  {optionsList.map(opt => {
                    const isSelected = answers[current.examQuestionId] === opt.idx;
                    return (
                      <button
                        key={opt.idx}
                        onClick={() => selectAnswer(current.examQuestionId, opt.idx)}
                        className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center gap-5 text-[15px] sm:text-base font-medium group
                              ${isSelected ? "border-jp-indigo bg-jp-indigo text-white shadow-lg shadow-jp-indigo/20 scale-[1.01]"
                            : "border-neutral-200 text-neutral-700 bg-white hover:border-jp-indigo/40 hover:bg-neutral-50 hover:shadow-sm"}
                            `}>
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors
                              ${isSelected ? "bg-white text-jp-indigo" : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-jp-indigo group-hover:shadow-sm"}
                            `}>{opt.label}</span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Bar Navigation */}
          <div className="bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white transition-all">
              <ChevronLeft size={18} /> Trước
            </button>

            <span className="text-sm font-bold text-neutral-400 bg-neutral-100 px-4 py-1.5 rounded-full lg:hidden">
              {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-sm shadow-jp-indigo/30 transition-all">
                Kế tiếp <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-jp-red text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-sm shadow-jp-red/30 transition-all">
                Nộp bài <Send size={16} className="ml-1" />
              </button>
            )}
          </div>

        </main>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-jp-indigo to-jp-red" />
            <AlertTriangle size={56} className="mx-auto text-amber-500 mb-6" />
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Bạn muốn nộp bài?</h2>

            <div className="bg-neutral-50 rounded-2xl p-4 mb-6 mt-4 border border-neutral-100">
              <p className="text-neutral-500 text-sm mb-1">Hiện tại bạn đã trả lời:</p>
              <p className="text-2xl font-black text-jp-indigo"><span className="text-3xl">{answeredCount}</span><span className="text-neutral-300 mx-1">/</span><span className="text-lg text-neutral-400">{questions.length}</span></p>
            </div>

            {answeredCount < questions.length && (
              <p className="text-amber-600 text-sm font-bold mb-6 flex items-center justify-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                ⚠️ Còn {questions.length - answeredCount} câu chưa điền!
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3.5 bg-white border-2 border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 rounded-xl font-bold text-sm transition-all focus:outline-none">
                Tiếp tay thi
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3.5 bg-gradient-to-r from-jp-red to-red-600 shadow-md shadow-red-500/30 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center focus:outline-none">
                {isSubmitting ? <span className="animate-pulse">Đang nộp...</span> : "Chắc chắn nộp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
