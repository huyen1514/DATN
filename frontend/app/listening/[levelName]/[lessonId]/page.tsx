"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import BookmarkButton from "@/components/BookmarkButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PartyPopper,
  ListChecks,
  Play,
  Pause,
  Volume2
} from "lucide-react";
import LessonProgressSidebar from "@/components/LessonProgressSidebar";

/* =========== Types =========== */
interface Level {
  levelId: number;
  levelName: string;
}

interface Lesson {
  lessonId: number;
  lessonName?: string;
  level?: Level;
  skillType?: string;
}

interface ListeningItem {
  listeningId: number;
  lessonId: number;
  audioUrl?: string;
  imageUrl?: string;
  transcript?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

interface ListeningItemUI {
  listeningId: number;
  lessonId: number;
  audioUrl: string;
  imageUrl: string;
  transcript: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
}

interface BookmarkItem {
  bookmarkId: number;
  itemId: number;
  type: string;
}

const OPTION_LABELS = ["A", "B", "C", "D"];
const BACKEND_URL = API_URL.replace(/\/api$/, "");

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const Confetti = () => {
  const particles = Array.from({ length: 60 });
  const colors = ["#0891b2", "#ffcf00", "#00a86b", "#0074d9", "#0ea5e9", "#b10dc9"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          initial={{
            top: "-5%",
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)]
          }}
          animate={{
            top: "105%",
            left: `${Math.random() * 100}%`,
            rotate: 360 * (Math.random() * 2 + 1),
          }}
          transition={{
            duration: Math.random() * 2 + 2.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default function ListeningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  /* ---- Data State ---- */
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [listenings, setListenings] = useState<ListeningItemUI[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number>(1);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  /* ---- Quiz State ---- */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);

  // States cho Tiến trình
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  /* ---- Audio State ---- */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showScript, setShowScript] = useState(false);

  /* Reset Audio khi đổi câu hỏi */
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowScript(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentIdx]);

  /* ---- Fetch Data ---- */
  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allListeningsData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/listenings"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter(
          (l: Lesson) =>
            (!l.skillType || l.skillType === "Nghe hiểu" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allListeningsData)) {
        const lessonItems = allListeningsData.filter((p: ListeningItem) => p.lessonId === lessonId);

        const mappedItems: ListeningItemUI[] = lessonItems.map((item: ListeningItem) => {
          let correctNum = 1;
          if (item.correctAnswer === "B") correctNum = 2;
          if (item.correctAnswer === "C") correctNum = 3;
          if (item.correctAnswer === "D") correctNum = 4;

          return {
            listeningId: item.listeningId,
            lessonId: item.lessonId,
            audioUrl: item.audioUrl || "",
            imageUrl: item.imageUrl || "",
            transcript: item.transcript || "",
            question: item.question,
            option1: item.optionA,
            option2: item.optionB,
            option3: item.optionC,
            option4: item.optionD,
            correctOption: correctNum,
          };
        });

        setListenings(mappedItems);
        setAnswers(new Array(mappedItems.length).fill(null));
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu:", e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  const loadBookmarks = useCallback(async (targetUserId: number) => {
    if (!targetUserId) return;
    try {
      const data = await api(`/bookmark/${targetUserId}`);
      setBookmarks(Array.isArray(data) ? (data as BookmarkItem[]) : []);
    } catch (e) { console.error(e); }
  }, []);

  const updateStatus = useCallback(async (status: string, score: number | null = null) => {
    if (!userId) return;
    try {
      await api("/progress/upsert", "POST", { userId, lessonId, partType: "Listening", status, score });
    } catch (e) { console.error(e); }
  }, [userId, lessonId]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserId(u.userId);
      void loadBookmarks(u.userId);
    }
    void loadData();
    updateStatus("InProgress");
  }, [loadBookmarks, loadData, updateStatus]);

  /* ---- Tính toán Bài tiếp theo ---- */
  const sortedLessons = useMemo(() => [...lessons].sort((a, b) => a.lessonId - b.lessonId), [lessons]);

  const handleNextLesson = async () => {
    const currentScore = listenings.length > 0 ? Math.round((correctCount / listenings.length) * 100) : null;
    await updateStatus("Completed", currentScore);

    const currentIdxMatch = sortedLessons.findIndex(l => Number(l.lessonId) === Number(lessonId));
    let nextId = lessonId + 1;
    if (currentIdxMatch !== -1 && currentIdxMatch < sortedLessons.length - 1) {
      nextId = sortedLessons[currentIdxMatch + 1].lessonId;
    }
    setShowResult(false);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setAnswers([]);
    router.push(`/listening/${levelName}/${nextId}`);
  };

  /* ---- Bookmark Logic ---- */
  const currentItem = listenings[currentIdx];
  const isBookmarked = bookmarks.some(b => b.itemId === currentItem?.listeningId && b.type === "Listening");

  const handleToggleBookmark = async () => {
    if (!userId || !currentItem?.listeningId) return;
    setBookmarkLoading(true);
    try {
      await api("/bookmark", "POST", { userId, itemId: currentItem.listeningId, type: "Listening" });
      await loadBookmarks(userId);
    } catch (error) { console.error("Lỗi khi bookmark:", error); }
    finally { setBookmarkLoading(false); }
  };

  /* ---- Audio Logic ---- */
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(!isPlaying);
    }
  };
  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  /* ---- Quiz Logic ---- */
  const totalQuestions = listenings.length;
  const isCorrect = selectedOption !== null && currentItem && selectedOption === currentItem.correctOption;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSelectOption = (optionNum: number) => {
    if (isAnswered) return;
    setSelectedOption(optionNum);
    setIsAnswered(true);

    // Kiểm tra câu trả lời và Cập nhật điểm ngay lập tức
    const isThisCorrect = currentItem && optionNum === currentItem.correctOption;

    setAnsweredCount(prev => prev + 1);
    if (isThisCorrect) setCorrectCount(prev => prev + 1);

    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = optionNum;
      return next;
    });

    // Nếu là câu cuối cùng, gọi API cập nhật điểm
    if (answeredCount + 1 === totalQuestions) {
      const finalCorrect = correctCount + (isThisCorrect ? 1 : 0);
      const finalScore = Math.round((finalCorrect / totalQuestions) * 100);
      updateStatus("Completed", finalScore);
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowResult(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      const prevAnswer = answers[currentIdx - 1];
      setSelectedOption(prevAnswer);
      setIsAnswered(prevAnswer !== null);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIdx(index);
    setSelectedOption(answers[index]);
    setIsAnswered(answers[index] !== null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setAnswers(new Array(totalQuestions).fill(null));
    setAnsweredCount(0);
    setCorrectCount(0);
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---- Styles Helpers ---- */
  const getOptionClasses = (optionNum: number): string => {
    const base = "flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl text-[1rem] font-medium transition-all duration-200 border-2";
    if (!isAnswered) return `${base} border-b-4 border-neutral-200 bg-white hover:border-cyan-500 hover:bg-cyan-50/30 hover:-translate-y-1 active:border-b-2 active:translate-y-[2px] cursor-pointer shadow-sm`;
    const isSelected = selectedOption === optionNum;
    const isRight = optionNum === currentItem?.correctOption;
    if (isRight) return `${base} border-b-4 border-emerald-500 bg-emerald-50 text-emerald-800 pointer-events-none shadow-sm`;
    if (isSelected && !isRight) return `${base} border-b-4 border-red-400 bg-red-50 text-red-800 pointer-events-none shadow-sm`;
    return `${base} border-neutral-200 bg-neutral-50 opacity-50 pointer-events-none`;
  };

  const getOptionLabelClasses = (optionNum: number): string => {
    const base = "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-200 border-2";
    if (!isAnswered) return `${base} bg-neutral-50 text-neutral-500 border-neutral-200`;
    const isSelected = selectedOption === optionNum;
    const isRight = optionNum === currentItem?.correctOption;
    if (isRight) return `${base} bg-emerald-500 text-white border-emerald-600`;
    if (isSelected && !isRight) return `${base} bg-red-500 text-white border-red-600`;
    return `${base} bg-neutral-100 text-neutral-400 border-neutral-200`;
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-cyan-800 font-medium animate-pulse">Đang chuẩn bị bài nghe...</p>
    </div>
  );

  if (!isLoading && listenings.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 pb-20">
      <MainNavbar />
      <div className="flex flex-col items-center justify-center flex-1 mt-20">
        <XCircle size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Chưa có dữ liệu</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          Bài học Nghe hiểu này hiện tại chưa có câu hỏi nào. Bạn vui lòng quay lại sau nhé.
        </p>
        <Link href={`/listening/${levelName}`} className="px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-900/20">
          Quay lại danh sách
        </Link>
      </div>
    </div>
  );

  const isPerfectScore = correctCount === totalQuestions && totalQuestions > 0;
  const currentLessonIndexUI = sortedLessons.findIndex(l => Number(l.lessonId) === Number(lessonId));
  const hasNextLessonUI = currentLessonIndexUI !== -1 && currentLessonIndexUI < sortedLessons.length - 1;

  /* ======================= UI RENDER ======================= */
  return (
    <div className="min-h-screen bg-slate-50/50 text-jp-ink font-sans selection:bg-cyan-500/20 pb-20">
      <MainNavbar />
      {showResult && <Confetti />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="mb-10">
          <Link href={`/listening/${levelName}`} className="inline-flex items-center gap-2 text-sm text-jp-ink/50 hover:text-cyan-600 transition-colors mb-6 font-medium">
            <ChevronLeft size={16} /> Quay lại danh sách
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Headphones size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{lessonName || "Bài Nghe Hiểu"}</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Trình độ {levelName?.toUpperCase()} • Mài giũa đôi tai</p>
              </div>
            </div>

            {!showResult && currentItem && (
              <BookmarkButton
                active={isBookmarked}
                loading={bookmarkLoading}
                label={isBookmarked ? "Đã lưu bài nghe" : "Lưu bài nghe này"}
                onClick={handleToggleBookmark}
              />
            )}
          </div>
        </div>

        {showResult ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 text-center">
              <div className="bg-gradient-to-br from-slate-900 to-cyan-900 p-12 text-white relative">
                <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                  {isPerfectScore ? (
                    <PartyPopper size={80} className="mx-auto text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                  ) : (
                    <Trophy size={80} className="mx-auto text-amber-400 mb-6 drop-shadow-md" />
                  )}
                </motion.div>
                <h2 className="text-4xl font-black mb-2 uppercase tracking-wide">
                  {isPerfectScore ? "TUYỆT VỜI! XUẤT SẮC!" : "HOÀN THÀNH BÀI NGHE"}
                </h2>
                <p className="opacity-80 font-medium">Kỹ năng nghe của bạn đang tiến bộ rất nhanh.</p>
              </div>

              <div className="p-10 pt-12 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Điểm số của bạn</p>
                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-10 flex justify-center items-baseline gap-2">
                  {correctCount} <span className="text-3xl text-slate-300">/ {totalQuestions}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                  <button onClick={handleRetry} className="flex items-center justify-center gap-2 p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                    <RotateCcw size={20} /> Nghe lại bài này
                  </button>

                  {hasNextLessonUI ? (
                    <button onClick={handleNextLesson} className="flex items-center justify-center gap-2 p-4 bg-cyan-500 text-white rounded-2xl font-bold hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-1">
                      Bài tiếp theo <ArrowRight size={20} />
                    </button>
                  ) : (
                    <Link href={`/listening/${levelName}`} className="flex items-center justify-center gap-2 p-4 bg-cyan-500 text-white rounded-2xl font-bold hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-1">
                      Về danh sách
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">

                    {/* KHU VỰC AUDIO VÀ HÌNH ẢNH */}
                    <div className="p-8 md:p-12 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-8">
                        <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-xs font-bold rounded-lg tracking-wider flex items-center gap-2">
                          <Headphones size={14} /> FILE NGHE
                        </div>
                      </div>

                      {currentItem?.audioUrl && (
                        <audio
                          ref={audioRef}
                          src={currentItem.audioUrl.startsWith('/') ? `${BACKEND_URL}${currentItem.audioUrl}` : currentItem.audioUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                      )}

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 flex flex-col gap-4 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-500">{formatTime(currentTime)}</span>
                          <span className="text-sm font-bold text-slate-500">{formatTime(duration)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            <Volume2 size={20} className="text-slate-400" />
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={volume}
                              onChange={(e) => {
                                setVolume(Number(e.target.value));
                                if (audioRef.current) audioRef.current.volume = Number(e.target.value);
                              }}
                              className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-400"
                            />
                          </div>
                          <button
                            onClick={togglePlay}
                            className="w-14 h-14 flex items-center justify-center bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/30 text-white hover:bg-cyan-600 hover:scale-105 transition-all"
                          >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                          </button>
                          <div className="w-24"></div>
                        </div>
                      </div>

                      {currentItem?.imageUrl && (
                        <div className="flex justify-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
                          <img
                            src={currentItem.imageUrl.startsWith('/') ? `${BACKEND_URL}${currentItem.imageUrl}` : currentItem.imageUrl}
                            alt="Visual Content"
                            className="max-h-80 object-contain rounded-xl mix-blend-multiply"
                          />
                        </div>
                      )}

                      {currentItem?.transcript && (
                        <div>
                          <button onClick={() => setShowScript(!showScript)} className="text-sm font-bold text-slate-400 hover:text-cyan-600 transition-colors flex items-center gap-2">
                            <span className={`transition-transform duration-300 ${showScript ? "rotate-180" : ""}`}>▼</span>
                            {showScript ? "Ẩn Bản dịch / Lời thoại" : "Xem Bản dịch / Lời thoại"}
                          </button>
                          <AnimatePresence>
                            {showScript && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                                <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                                  <p className="text-sm text-indigo-900 leading-loose whitespace-pre-line font-medium">
                                    {currentItem.transcript}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* KHU VỰC CÂU HỎI VÀ ĐÁP ÁN */}
                    <div className="p-8 md:p-12 bg-slate-50/50">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-snug">
                        <span className="text-cyan-600 mr-2">Q:</span>{currentItem?.question}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((num, i) => (
                          <motion.button
                            key={num}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={getOptionClasses(num)}
                            onClick={() => handleSelectOption(num)}
                          >
                            <span className={getOptionLabelClasses(num)}>
                              {isAnswered && num === currentItem?.correctOption ? <CheckCircle2 size={20} /> :
                                isAnswered && selectedOption === num ? <XCircle size={20} /> : OPTION_LABELS[num - 1]}
                            </span>
                            <span className="flex-1 leading-relaxed">{currentItem ? (currentItem as any)[`option${num}`] : ""}</span>
                          </motion.button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {isAnswered && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8">
                            <div className={`p-5 rounded-2xl border-2 flex items-start gap-4 shadow-sm ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                              <div className="mt-0.5">{isCorrect ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}</div>
                              <div>
                                <h4 className="font-bold text-lg mb-1">{isCorrect ? "Tuyệt vời! Bạn đã nghe đúng." : "Rất tiếc, chưa chính xác."}</h4>
                                {!isCorrect && <p className="opacity-90">Đáp án đúng là: <strong>{OPTION_LABELS[currentItem.correctOption - 1]}</strong></p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-200">
                        <button onClick={handlePrev} disabled={currentIdx === 0} className="px-6 py-3 font-bold text-slate-500 rounded-xl hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-2">
                          <ChevronLeft size={18} /> Câu trước
                        </button>
                        <button onClick={handleNext} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isAnswered ? 'bg-cyan-600 text-white hover:bg-cyan-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} disabled={!isAnswered}>
                          {currentIdx < totalQuestions - 1 ? "Câu tiếp theo" : "Xem kết quả"} <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ==== SIDEBAR CUSTOM ==== */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">

                {/* THANH TIẾN ĐỘ */}
                <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Tiến độ làm bài</h4>
                    <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <p>Đã làm: <span className="text-slate-800 font-bold">{answeredCount}/{totalQuestions}</span></p>
                    <p>Đúng: <span className="text-emerald-600 font-bold">{correctCount}</span></p>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks size={20} className="text-cyan-600" />
                      Danh sách câu hỏi
                    </h3>
                  </div>

                  <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {listenings.map((reading, idx) => {
                      const isActive = idx === currentIdx;
                      const hasAnswered = answers[idx] !== null;
                      const isOptionCorrect = answers[idx] === reading.correctOption;

                      return (
                        <button
                          key={idx}
                          onClick={() => goToQuestion(idx)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${isActive
                            ? "bg-cyan-50 border-2 border-cyan-200 text-cyan-800 font-bold shadow-sm"
                            : hasAnswered
                              ? "bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-300"
                              : "bg-white border-2 border-transparent hover:bg-slate-50 text-slate-500"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${isActive ? "bg-cyan-600 text-white shadow-md shadow-cyan-200"
                              : hasAnswered ? "bg-slate-100 text-slate-500"
                                : "bg-slate-100 text-slate-400"
                              }`}>
                              {idx + 1}
                            </div>
                            <span className="text-sm">Câu số {idx + 1}</span>
                          </div>
                          {hasAnswered && (
                            isOptionCorrect ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <LessonProgressSidebar lessonId={lessonId} userId={userId} levelName={levelName} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}