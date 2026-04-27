"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Clock, Send, AlertTriangle, Play, Pause, Volume2, BookOpen, Layers, Info } from "lucide-react";
//import MainNavbar from "@/components/MainNavbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5135";
const resolveMediaUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return API_BASE + url;
};

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<Record<number, NodeJS.Timeout>>({});

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playedAudios, setPlayedAudios] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          const session = await api(`/exam-sessions/start`, "POST", {
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
          await api(`/exam-sessions/auto-save`, "POST", {
            sessionId,
            questionId,
            selectedOption: answerIdx.toString()
          });
        } catch (err) { console.error("Auto save failed", err); }
      }, 1000);
    }

    // Tự động chuyển câu hỏi tiếp theo (Tuỳ chọn: Bạn có thể bật/tắt tính năng này)
    // if (currentIndex < currentQuestions.length - 1) {
    //   setCurrentIndex(currentIndex + 1);
    // }
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

    let savedResultId: number | undefined;
    if (sessionId) {
      try {
        const res = await api(`/exam-results/submit/${sessionId}`, "POST");
        if (res && typeof res.examResultId === "number") savedResultId = res.examResultId;
      } catch (err) { console.error("Failed to submit session", err); }
    }

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

    // Đã lưu kết quả thông qua API submit session ở trên
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-jp-indigo/20 border-t-jp-indigo rounded-full animate-spin mx-auto mb-4" />
          <p className="text-jp-indigo font-semibold text-sm">Đang chuẩn bị đề thi...</p>
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
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden font-sans">
      {/* <MainNavbar /> */}

      {/* Progress Bar tinh chỉnh mỏng lại */}
      <div className="h-1 w-full bg-slate-200 shrink-0 relative">
        <div
          className="h-full bg-jp-indigo transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header nhỏ gọn - Đã dồn toàn bộ Control sang phải */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex flex-col">
          <h1 className="font-bold text-slate-800 text-base md:text-lg">{exam?.examName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isTimeCritical ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-[11px] font-medium text-slate-500">Đang làm bài</span>
          </div>
        </div>

        {/* Khối bên phải: Bao gồm Thông số + Đồng hồ + Nút nộp bài */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] text-slate-500">Đã trả lời</span>
            <span className="text-sm font-bold text-jp-indigo">{totalAnswered} / {questions.length}</span>
          </div>

          {/* Timer được dời sang đây */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${isTimeCritical ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
            <Clock size={16} className={isTimeCritical ? "animate-pulse" : ""} />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="px-5 py-2.5 bg-jp-indigo text-white rounded-lg font-medium text-sm hover:bg-jp-indigo/90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Send size={16} className="hidden sm:block" /> <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Section Tab Bar */}
      <div className="bg-white border-b border-slate-200 flex px-6 py-0 overflow-x-auto no-scrollbar shrink-0">
        {sortedSections.map(s => {
          const isActive = currentSection === s;
          const config = SECTION_LABELS[s] || { label: `Phần ${s}`, jp: "", color: "bg-slate-500" };
          const answeredInSection = sectionedQuestions[s].filter(q => answers[q.examQuestionId] !== undefined).length;
          const totalInSection = sectionedQuestions[s].length;

          return (
            <button
              key={s}
              onClick={() => { setCurrentSection(s); setCurrentIndex(0); }}
              className={`flex flex-col items-start px-4 py-2 border-b-2 transition-all min-w-[150px] hover:bg-slate-50 ${isActive ? 'border-jp-indigo bg-jp-indigo/5' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                <span className={`text-xs font-semibold ${isActive ? 'text-jp-indigo' : 'text-slate-500'}`}>{config.label}</span>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-medium text-slate-600">{config.jp}</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{answeredInSection}/{totalInSection}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar Nav */}
        <aside className="w-60 bg-white border-r border-slate-200 p-4 overflow-y-auto hidden xl:block shrink-0 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Layers size={14} />
            <span className="text-xs font-semibold">Danh sách câu hỏi</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {currentQuestions.map((q, idx) => {
              const isSelected = currentIndex === idx;
              const isAnswered = answers[q.examQuestionId] !== undefined;
              return (
                <button
                  key={q.examQuestionId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`aspect-square rounded-lg text-sm font-semibold transition-all flex items-center justify-center border
                      ${isSelected ? 'bg-jp-indigo border-jp-indigo text-white shadow-sm' :
                      isAnswered ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                    `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">Lưu ý</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Bạn có thể quay lại các phần trước đó bất kỳ lúc nào để kiểm tra đáp án.
            </p>
          </div>
        </aside>

        {/* Content View (Không còn footer, mở rộng full không gian) */}
        <main className="flex-1 flex flex-col overflow-hidden relative">

          <div className="flex-1 flex overflow-hidden">
            {/* Reading Passage Split View */}
            {currentQuestion?.passage && (
              <div className="w-full lg:w-[40%] xl:w-[35%] h-full bg-white border-r border-slate-200 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md mb-6">
                    <BookOpen size={14} /> Đoạn văn đọc hiểu
                  </div>
                  <div className="text-slate-800 text-base md:text-lg leading-loose font-medium font-japanese whitespace-pre-wrap">
                    {currentQuestion.passage}
                  </div>
                </div>
              </div>
            )}

            {/* Question View */}
            <div className={`flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/50`}>

              <div className={`${currentQuestion?.passage ? 'max-w-3xl' : 'max-w-4xl'} mx-auto w-full pb-10`}>

                {/* Instructions */}
                {currentQuestion?.instruction && (
                  <div className="bg-white border border-slate-200 p-4 rounded-xl mb-6 shadow-sm flex items-start gap-3">
                    <Info size={18} className="text-jp-indigo shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700">{currentQuestion.instruction}</p>
                  </div>
                )}

                {/* Audio Player (Listening Section) */}
                {currentQuestion?.audioUrl && (
                  <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                    <audio ref={audioRef} src={resolveMediaUrl(currentQuestion.audioUrl)} onEnded={handleAudioEnded} className="hidden" />
                    <button
                      onClick={handlePlayAudio}
                      disabled={playedAudios[currentQuestion.audioUrl!] && !isPlaying}
                      className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-white transition-all
                            ${isPlaying ? 'bg-orange-500 animate-pulse' :
                          playedAudios[currentQuestion.audioUrl!] ? 'bg-slate-300' : 'bg-jp-indigo hover:bg-jp-indigo/90'}
                          `}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                    </button>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-sm font-bold text-slate-800 mb-0.5">Bài nghe</h4>
                      <p className={`text-[11px] font-medium ${playedAudios[currentQuestion.audioUrl!] && !isPlaying ? 'text-red-500' : 'text-slate-500'}`}>
                        {isPlaying ? 'Đang phát...' :
                          playedAudios[currentQuestion.audioUrl!] ? 'Đã phát xong (Chỉ được nghe 1 lần)' : 'Nhấn để nghe (Chỉ nghe được 1 lần duy nhất!)'}
                      </p>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                      <Volume2 size={16} className="text-slate-400" />
                      <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => {
                        const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v;
                      }} className="w-20 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                    </div>
                  </div>
                )}

                {/* Question Header */}
                <div className="mb-4">
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                    Câu {currentIndex + 1}
                  </span>
                </div>

                {/* Question Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed font-japanese">
                    {currentQuestion?.question}
                  </h2>
                  {currentQuestion?.imageUrl && (
                    <div className="mt-6 rounded-xl overflow-hidden border border-slate-100 inline-block">
                      <img src={resolveMediaUrl(currentQuestion.imageUrl)} alt="attachment" className="max-h-72 object-contain" />
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {optionsList.map(opt => {
                    const isSelected = answers[currentQuestion.examQuestionId] === opt.idx;
                    return (
                      <button
                        key={opt.idx}
                        onClick={() => selectAnswer(currentQuestion.examQuestionId, opt.idx)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4
                              ${isSelected ? 'bg-jp-indigo/5 border-jp-indigo text-jp-indigo shadow-sm' :
                            'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                                ${isSelected ? 'bg-jp-indigo text-white' : 'bg-slate-100 text-slate-500'}
                              `}>
                          {opt.label}
                        </div>
                        <span className="text-base md:text-lg font-medium">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-fade-in">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nộp bài thi?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Bạn đã làm <span className="font-bold text-jp-indigo">{totalAnswered}/{questions.length}</span> câu hỏi.
              Bạn có chắc chắn muốn nộp bài?
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-jp-indigo text-white rounded-lg font-semibold text-sm hover:bg-jp-indigo/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'ĐANG NỘP...' : 'ĐỒNG Ý NỘP BÀI'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors"
              >
                QUAY LẠI LÀM TIẾP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}