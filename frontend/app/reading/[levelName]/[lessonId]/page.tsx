"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import BookmarkButton from "@/components/BookmarkButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PartyPopper,
  ListChecks
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

interface ReadingQuestion {
  questionId: number;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
}

interface ReadingPassage {
  passageId: number;
  lessonId: number;
  content: string;
  readingQuestions: ReadingQuestion[];
}

interface ReadingItemUI {
  readingId: number;
  lessonId: number;
  content: string;
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

/* =========== HIỆU ỨNG PHÁO HOA =========== */
const Confetti = () => {
  const particles = Array.from({ length: 60 });
  const colors = ["#bc002d", "#ffcf00", "#00a86b", "#0074d9", "#ff4136", "#b10dc9"];

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

export default function ReadingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  /* ---- Data State ---- */
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [readings, setReadings] = useState<ReadingItemUI[]>([]);
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

  /* ---- Fetch Data & Mapping Logic ---- */
  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allReadingsData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/readings"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter(
          (l: Lesson) =>
            (!l.skillType || l.skillType === "Đọc hiểu" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allReadingsData)) {
        const passages = allReadingsData.filter((p: ReadingPassage) => p.lessonId === lessonId);

        const flattenedReadings: ReadingItemUI[] = [];
        passages.forEach((p: ReadingPassage) => {
          if (p.readingQuestions && p.readingQuestions.length > 0) {
            p.readingQuestions.forEach((q: ReadingQuestion) => {
              flattenedReadings.push({
                readingId: p.passageId,
                lessonId: p.lessonId,
                content: p.content,
                question: q.questionText,
                option1: q.option1,
                option2: q.option2,
                option3: q.option3,
                option4: q.option4,
                correctOption: q.correctOption,
              });
            });
          }
        });

        setReadings(flattenedReadings);
        setAnswers(new Array(flattenedReadings.length).fill(null));
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
      await api("/progress/upsert", "POST", { userId, lessonId, partType: "Reading", status, score });
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
    await updateStatus("Completed");

    const currentIdx = sortedLessons.findIndex(l => Number(l.lessonId) === Number(lessonId));
    let nextId = lessonId + 1;

    if (currentIdx !== -1 && currentIdx < sortedLessons.length - 1) {
      nextId = sortedLessons[currentIdx + 1].lessonId;
    }

    setShowResult(false);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setAnswers([]);

    router.push(`/reading/${levelName}/${nextId}`);
  };

  /* ---- Bookmark Logic ---- */
  const currentReading = readings[currentIdx];
  const isBookmarked = bookmarks.some(b => b.itemId === currentReading?.readingId && b.type === "Reading");

  const handleToggleBookmark = async () => {
    if (!userId || !currentReading?.readingId) return;
    setBookmarkLoading(true);
    try {
      await api("/bookmark/toggle", "POST", {
        userId,
        itemId: currentReading.readingId,
        type: "Reading"
      });
      await loadBookmarks(userId);
    } catch (error) {
      console.error("Lỗi khi bookmark:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  /* ---- Quiz Logic ---- */
  const totalQuestions = readings.length;
  const isCorrect = selectedOption !== null && currentReading && selectedOption === currentReading.correctOption;

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSelectOption = (optionNum: number) => {
    if (isAnswered) return;
    setSelectedOption(optionNum);
    setIsAnswered(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = optionNum;
      return next;
    });
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowResult(true);
      const correctCount = answers.filter((a, i) => a !== null && readings[i] && a === readings[i].correctOption).length;
      const finalScore = Math.round((correctCount / totalQuestions) * 100);
      updateStatus("Completed", finalScore);
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
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---- Styles Helpers ---- */
  const getOptionClasses = (optionNum: number): string => {
    const base = "flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl text-[1rem] font-medium transition-all duration-200 border-2";
    if (!isAnswered) return `${base} border-b-4 border-neutral-200 bg-white hover:border-jp-indigo hover:bg-indigo-50/30 hover:-translate-y-1 active:border-b-2 active:translate-y-[2px] cursor-pointer shadow-sm`;
    const isSelected = selectedOption === optionNum;
    const isRight = optionNum === currentReading?.correctOption;
    if (isRight) return `${base} border-b-4 border-emerald-500 bg-emerald-50 text-emerald-800 pointer-events-none shadow-sm`;
    if (isSelected && !isRight) return `${base} border-b-4 border-red-400 bg-red-50 text-red-800 pointer-events-none shadow-sm`;
    return `${base} border-neutral-200 bg-neutral-50 opacity-50 pointer-events-none`;
  };

  const getOptionLabelClasses = (optionNum: number): string => {
    const base = "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-200 border-2";
    if (!isAnswered) return `${base} bg-neutral-50 text-neutral-500 border-neutral-200`;
    const isSelected = selectedOption === optionNum;
    const isRight = optionNum === currentReading?.correctOption;
    if (isRight) return `${base} bg-emerald-500 text-white border-emerald-600`;
    if (isSelected && !isRight) return `${base} bg-red-500 text-white border-red-600`;
    return `${base} bg-neutral-100 text-neutral-400 border-neutral-200`;
  };

  const renderContentHTML = (htmlStr: string) => {
    let result = htmlStr.replace(/src=['"]\/images\//g, `src='${BACKEND_URL}/uploads/images/`);
    result = result.replace(/src=['"]\/(?!uploads|http)/g, `src='${BACKEND_URL}/`);
    return result;
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-jp-red border-t-transparent rounded-full animate-spin"></div>
      <p className="text-jp-ink/60 font-medium animate-pulse">Đang chuẩn bị bài đọc...</p>
    </div>
  );

  /* HIỂN THỊ MÀN HÌNH CHƯA CÓ DỮ LIỆU ĐỂ TRÁNH LỖI UNDEFINED */
  if (!isLoading && readings.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 pb-20">
      <MainNavbar />
      <div className="flex flex-col items-center justify-center flex-1 mt-20">
        <XCircle size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Chưa có dữ liệu</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          Bài học Đọc hiểu này hiện tại chưa có đoạn văn hoặc câu hỏi nào. Bạn vui lòng quay lại sau nhé.
        </p>
        <Link href={`/reading/${levelName}`} className="px-8 py-3 bg-jp-indigo text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-indigo-900/20">
          Quay lại danh sách
        </Link>
      </div>
    </div>
  );

  const correctAnswersCount = answers.filter((a, i) => a === readings[i]?.correctOption).length;
  const isPerfectScore = correctAnswersCount === totalQuestions && totalQuestions > 0;

  const currentLessonIndexUI = sortedLessons.findIndex(l => Number(l.lessonId) === Number(lessonId));
  const hasNextLessonUI = currentLessonIndexUI !== -1 && currentLessonIndexUI < sortedLessons.length - 1;

  /* ======================= UI RENDER ======================= */
  return (
    <div className="min-h-screen bg-slate-50/50 text-jp-ink font-sans selection:bg-jp-red/20 pb-20">
      <MainNavbar />
      {showResult && <Confetti />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="mb-10">
          <Link href={`/reading/${levelName}`} className="inline-flex items-center gap-2 text-sm text-jp-ink/50 hover:text-jp-red transition-colors mb-6 font-medium">
            <ChevronLeft size={16} /> Quay lại danh sách
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-jp-red to-rose-400 flex items-center justify-center shadow-lg shadow-jp-red/20">
                <BookOpen size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{lessonName || "Bài Đọc Hiểu"}</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Trình độ {levelName?.toUpperCase()} • Mài giũa kỹ năng đọc</p>
              </div>
            </div>

            {!showResult && currentReading && (
              <BookmarkButton
                active={isBookmarked}
                loading={bookmarkLoading}
                label={isBookmarked ? "Đã lưu đoạn văn" : "Lưu đoạn văn này"}
                onClick={handleToggleBookmark}
              />
            )}
          </div>

          {!showResult && (
            <div className="mt-8 max-w-2xl">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-3 tracking-widest">
                <span>TIẾN TRÌNH: {answeredCount} / {totalQuestions} CÂU ĐÃ TRẢ LỜI</span>
                <span className="text-jp-red">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-jp-red to-rose-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>

        {showResult ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 text-center">
              <div className="bg-gradient-to-br from-jp-indigo to-slate-900 p-12 text-white relative">
                <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                  {isPerfectScore ? (
                    <PartyPopper size={80} className="mx-auto text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                  ) : (
                    <Trophy size={80} className="mx-auto text-amber-400 mb-6 drop-shadow-md" />
                  )}
                </motion.div>
                <h2 className="text-4xl font-black mb-2 uppercase tracking-wide">
                  {isPerfectScore ? "TUYỆT VỜI! XUẤT SẮC!" : "HOÀN THÀNH BÀI HỌC"}
                </h2>
                <p className="opacity-80 font-medium">Bạn đã hoàn thành rất tốt phần đọc hiểu này.</p>
              </div>

              <div className="p-10 pt-12 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Điểm số của bạn</p>
                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-jp-red to-rose-500 mb-10 flex justify-center items-baseline gap-2">
                  {correctAnswersCount} <span className="text-3xl text-slate-300">/ {totalQuestions}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                  <button onClick={handleRetry} className="flex items-center justify-center gap-2 p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                    <RotateCcw size={20} /> Làm lại bài này
                  </button>

                  {hasNextLessonUI ? (
                    <button onClick={handleNextLesson} className="flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1">
                      Bài tiếp theo <ArrowRight size={20} />
                    </button>
                  ) : (
                    <Link href={`/reading/${levelName}`} className="flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1">
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
                    <div className="p-8 md:p-12 max-h-[55vh] overflow-y-auto custom-scrollbar">
                      <div className="flex items-center justify-between mb-6">
                        <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg tracking-wider">ĐOẠN VĂN</div>
                      </div>
                      <div className="prose max-w-none text-slate-700 text-[1.1rem] leading-loose font-serif selection:bg-jp-sakura/50"
                        dangerouslySetInnerHTML={{ __html: renderContentHTML(currentReading?.content || "") }} />
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                    <div className="p-8 md:p-12 bg-slate-50/50">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-snug">
                        <span className="text-jp-red mr-2">Q:</span>{currentReading?.question}
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
                              {isAnswered && num === currentReading?.correctOption ? <CheckCircle2 size={20} /> :
                                isAnswered && selectedOption === num ? <XCircle size={20} /> : OPTION_LABELS[num - 1]}
                            </span>
                            <span className="flex-1 leading-relaxed">{currentReading ? (currentReading as any)[`option${num}`] : ""}</span>
                          </motion.button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {isAnswered && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8">
                            <div className={`p-5 rounded-2xl border-2 flex items-start gap-4 shadow-sm ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                              <div className="mt-0.5">{isCorrect ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}</div>
                              <div>
                                <h4 className="font-bold text-lg mb-1">{isCorrect ? "Tuyệt vời! Bạn đã chọn đúng." : "Rất tiếc, chưa chính xác."}</h4>
                                {!isCorrect && <p className="opacity-90">Đáp án đúng là: <strong>{OPTION_LABELS[currentReading.correctOption - 1]}</strong></p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-200">
                        <button onClick={handlePrev} disabled={currentIdx === 0} className="px-6 py-3 font-bold text-slate-500 rounded-xl hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-2">
                          <ChevronLeft size={18} /> Câu trước
                        </button>
                        <button onClick={handleNext} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isAnswered ? 'bg-jp-indigo text-white hover:bg-slate-800 hover:-translate-y-1 hover:shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} disabled={!isAnswered}>
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
              <div className="sticky top-24">
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">
                  {/* Header Sidebar */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks size={20} className="text-jp-indigo" />
                      Danh sách câu hỏi
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Bạn đã hoàn thành {answeredCount}/{totalQuestions} câu
                    </p>
                  </div>

                  {/* Body Sidebar - List Câu hỏi */}
                  <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {readings.map((reading, idx) => {
                      const isActive = idx === currentIdx;
                      const hasAnswered = answers[idx] !== null;
                      const isOptionCorrect = answers[idx] === reading.correctOption;

                      return (
                        <button
                          key={idx}
                          onClick={() => goToQuestion(idx)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${isActive
                            ? "bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-bold shadow-sm"
                            : hasAnswered
                              ? "bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-300"
                              : "bg-white border-2 border-transparent hover:bg-slate-50 text-slate-500"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${isActive ? "bg-jp-indigo text-white shadow-md shadow-indigo-200"
                              : hasAnswered ? "bg-slate-100 text-slate-500"
                                : "bg-slate-100 text-slate-400"
                              }`}>
                              {idx + 1}
                            </div>
                            <span className="text-sm">Câu số {idx + 1}</span>
                          </div>

                          {/* Trạng thái trả lời (Icon Check/Cross) */}
                          {hasAnswered && (
                            isOptionCorrect
                              ? <CheckCircle2 size={18} className="text-emerald-500" />
                              : <XCircle size={18} className="text-red-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}