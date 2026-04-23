"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  FileText,
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

interface ReadingItem {
  readingId: number;
  lessonId: number;
  content: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
  imageUrl?: string;
}

const OPTION_LABELS = ["A", "B", "C", "D"];
// Derive backend base URL from API_URL (remove trailing /api)
const BACKEND_URL = API_URL.replace(/\/api$/, "");

export default function ReadingDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  /* ---- Data State ---- */
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number>(1);

  /* ---- Quiz State ---- */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  /* ---- Fetch Data ---- */
  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allReadingsData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/readings"),
      ]);

      // Build a set of lessonIds that actually have reading data
      const readingLessonIds = new Set<number>();
      if (Array.isArray(allReadingsData)) {
        allReadingsData.forEach((r: ReadingItem) => readingLessonIds.add(r.lessonId));
      }

      if (Array.isArray(lessonsData)) {
        // Only include lessons that HAVE readings — matches the list page logic
        const filtered = lessonsData.filter(
          (l: Lesson) =>
            l.level?.levelName?.toUpperCase() === levelName?.toUpperCase() &&
            (!l.skillType ||
              l.skillType === "Đọc hiểu" ||
              l.skillType === "Tự do") &&
            readingLessonIds.has(l.lessonId)
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allReadingsData)) {
        const filtered = allReadingsData.filter(
          (r: ReadingItem) => r.lessonId === lessonId
        );
        setReadings(filtered);
        setAnswers(new Array(filtered.length).fill(null));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  /* ---- Handlers & Helpers ---- */
  const updateStatus = useCallback(
    async (status: string, score: number | null = null) => {
      if (!userId) return;
      try {
        await api("/progress/lesson", "PUT", {
          userId,
          lessonId,
          partType: "Reading",
          status,
          score,
        });
      } catch (e) {
        console.error("Could not update progress", e);
      }
    },
    [userId, lessonId]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUserId(u.userId);
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
    void loadData();

    // Mark as accessed/in progress
    updateStatus("InProgress");
  }, [loadData, updateStatus]);

  // FIX: Định nghĩa sortedLessons trước khi sử dụng
  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => a.lessonId - b.lessonId);
  }, [lessons]);

  const currentLessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.lessonId === lessonId),
    [sortedLessons, lessonId]
  );

  const handleNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < sortedLessons.length) {
      // Mark as completed if moving to next lesson
      updateStatus("Completed");
      const nextLesson = sortedLessons[nextIndex];
      window.location.href = `/reading/${levelName}/${nextLesson.lessonId}`;
    }
  };

  /* ---- Quiz Logic ---- */
  const currentReading = readings[currentIdx];
  const totalQuestions = readings.length;
  const isCorrect =
    selectedOption !== null &&
    currentReading &&
    selectedOption === currentReading.correctOption;

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
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowResult(true);
      const correctCount = answers.filter(
        (a, i) => a !== null && readings[i] && a === readings[i].correctOption
      ).length;
      const finalScore = Math.round((correctCount / totalQuestions) * 100);
      updateStatus("Completed", finalScore);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      const prevAnswer = answers[currentIdx - 1];
      setSelectedOption(prevAnswer);
      setIsAnswered(prevAnswer !== null);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setAnswers(new Array(totalQuestions).fill(null));
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const correctCount = answers.filter(
    (a, i) => a !== null && readings[i] && a === readings[i].correctOption
  ).length;

  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  /* ---- Option styling ---- */
  const getOptionClasses = (optionNum: number): string => {
    const base =
      "flex items-center gap-3.5 w-full text-left px-5 py-4 border-2 rounded-2xl text-[0.95rem] text-jp-ink relative overflow-hidden transition-all duration-200";

    if (!isAnswered) {
      return `${base} border-neutral-200 bg-white cursor-pointer hover:border-jp-red hover:bg-jp-sakura/30 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0`;
    }

    const isSelected = selectedOption === optionNum;
    const isRight = optionNum === currentReading?.correctOption;
    const disabled = "pointer-events-none";

    if (isSelected && isRight)
      return `${base} border-emerald-400 bg-emerald-50 ${disabled}`;
    if (isSelected && !isRight)
      return `${base} border-red-400 bg-red-50 ${disabled}`;
    if (!isSelected && isRight)
      return `${base} border-emerald-400 bg-emerald-50 animate-pulse ${disabled}`;
    return `${base} border-neutral-100 bg-neutral-50/50 opacity-60 ${disabled}`;
  };

  const getOptionLabelClasses = (optionNum: number): string => {
    const base =
      "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-200";

    if (!isAnswered) return `${base} bg-neutral-100 text-neutral-500`;

    const isSelected = selectedOption === optionNum;
    const isRight = optionNum === currentReading?.correctOption;

    if ((isSelected && isRight) || (!isSelected && isRight))
      return `${base} bg-emerald-500 text-white`;
    if (isSelected && !isRight) return `${base} bg-red-500 text-white`;
    return `${base} bg-neutral-100 text-neutral-400`;
  };

  /* ---- Render HTML content ---- */
  const renderContentHTML = (htmlStr: string) => {
    // The JSON data uses /images/readings/... but actual files are at wwwroot/uploads/images/readings/...
    let result = htmlStr.replace(/src=['"]\/images\//g, `src='${BACKEND_URL}/uploads/images/`);
    result = result.replace(/src=['"]\/(?!uploads|http)/g, `src='${BACKEND_URL}/`);
    return result;
  };

  /* ---- Hide broken images after render ---- */
  useEffect(() => {
    if (!contentRef.current) return;
    const imgs = contentRef.current.querySelectorAll("img");
    imgs.forEach((img) => {
      img.onerror = () => {
        img.style.display = "none";
      };
      if (img.complete && img.naturalWidth === 0) {
        img.style.display = "none";
      }
    });
  }, [currentIdx, readings]);

  /* ======================= RESULT SCREEN ======================= */
  if (showResult) {
    const scoreColorClass =
      scorePercent >= 80
        ? "from-emerald-50 to-emerald-100 border-emerald-400 text-emerald-600"
        : scorePercent >= 50
          ? "from-amber-50 to-yellow-100 border-amber-400 text-amber-600"
          : "from-red-50 to-red-100 border-red-400 text-red-500";

    const barGradient =
      scorePercent >= 80
        ? "from-emerald-400 to-emerald-300"
        : scorePercent >= 50
          ? "from-amber-400 to-yellow-300"
          : "from-red-400 to-red-300";

    return (
      <div className="min-h-screen bg-white text-jp-ink">
        <MainNavbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.7 }}
            className="mb-6"
          >
            {scorePercent >= 80 ? (
              <Sparkles size={48} className="mx-auto text-amber-500" />
            ) : (
              <Trophy size={48} className="mx-auto text-jp-indigo/40" />
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-serif font-bold text-jp-indigo mb-2"
          >
            {scorePercent >= 80
              ? "すごい！ Xuất sắc!"
              : scorePercent >= 50
                ? "がんばった！ Khá tốt!"
                : "もう少し！ Cần cố gắng thêm!"}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-jp-ink/50 mb-8"
          >
            Kết quả bài đọc hiểu: {lessonName}
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.35, duration: 0.6 }}
            className={`w-36 h-36 rounded-full bg-gradient-to-br ${scoreColorClass} border-4 flex flex-col items-center justify-center mx-auto mb-6`}
          >
            <span className="text-4xl font-bold leading-none">
              {correctCount}/{totalQuestions}
            </span>
            <span className="text-xs opacity-70 font-medium mt-1">
              câu đúng
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-xs mx-auto mb-10"
          >
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${barGradient} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${scorePercent}%` }}
                transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-sm text-jp-ink/50 mt-2">
              {scorePercent}% chính xác
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-3 mb-10 flex-wrap"
          >
            {answers.map((a, i) => {
              const correct = readings[i] && a === readings[i].correctOption;
              return (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 ${correct
                    ? "bg-emerald-100 text-emerald-600 border-emerald-300"
                    : "bg-red-100 text-red-500 border-red-300"
                    }`}
                >
                  {correct ? "✓" : "✗"}
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-transparent text-jp-indigo border-2 border-neutral-200 rounded-2xl font-bold text-[0.95rem] cursor-pointer transition-all hover:border-jp-indigo hover:bg-neutral-50"
            >
              <RotateCcw size={18} />
              Làm lại
            </button>
            {currentLessonIndex < sortedLessons.length - 1 && (
              <button
                onClick={handleNextLesson}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-jp-red to-rose-400 text-white border-none rounded-2xl font-bold text-[0.95rem] shadow-lg shadow-jp-red/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-jp-red/30"
              >
                Bài tiếp theo
                <ArrowRight size={18} />
              </button>
            )}
          </motion.div>
        </div>
        <div className="h-1 bg-gradient-to-r from-jp-red via-jp-sakura to-jp-red mt-20" />
      </div>
    );
  }

  /* ======================= MAIN QUIZ VIEW ======================= */
  return (
    <div className="min-h-screen bg-[#fafafa] text-jp-ink">
      <MainNavbar />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <Link
            href={`/reading/${levelName}`}
            className="inline-flex items-center gap-2 text-sm text-jp-ink/50 hover:text-jp-red transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Quay lại danh sách
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-jp-red to-rose-400 flex items-center justify-center">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-jp-indigo">
                {lessonName || "Đọc Hiểu"}
              </h1>
              <p className="text-sm text-jp-ink/50">
                Trình độ {levelName?.toUpperCase()} • Luyện đọc hiểu tiếng Nhật
              </p>
            </div>
          </div>
        </div>

        {!isLoading && totalQuestions > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-jp-ink/60 tracking-wide uppercase">
                Câu {currentIdx + 1} / {totalQuestions}
              </span>
              <span className="text-xs font-semibold text-jp-red">
                {Math.round(((currentIdx + 1) / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-jp-red to-rose-400 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3 justify-center flex-wrap">
              {readings.map((_, i) => {
                let dotClass =
                  "w-2.5 h-2.5 rounded-full transition-all duration-300 ";
                if (i === currentIdx) {
                  dotClass +=
                    "bg-jp-red scale-125 shadow-[0_0_0_3px_rgba(188,0,45,0.2)]";
                } else if (answers[i] !== null) {
                  dotClass +=
                    answers[i] === readings[i]?.correctOption
                      ? "bg-emerald-400"
                      : "bg-red-400";
                } else {
                  dotClass += "bg-neutral-200";
                }
                return <div key={i} className={dotClass} />;
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                <div className="h-72 bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%] animate-pulse rounded-3xl" />
                <div className="h-48 bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%] animate-pulse rounded-3xl" />
              </div>
            ) : readings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-black/5 p-16 text-center">
                <FileText
                  size={48}
                  className="mx-auto text-neutral-200 mb-6"
                />
                <h3 className="text-xl font-bold text-jp-indigo mb-2">
                  Chưa có bài đọc nào
                </h3>
                <p className="text-neutral-500">
                  Nội dung bài đọc đang được cập nhật.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentReading?.readingId ?? currentIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div
                      ref={contentRef}
                      className="p-6 md:p-10 max-h-[600px] overflow-y-auto scroll-smooth"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-jp-sakura flex items-center justify-center font-serif font-bold text-jp-red text-sm">
                          {(currentIdx + 1).toString().padStart(2, "0")}
                        </div>
                        <h3 className="text-lg font-serif font-bold text-jp-indigo">
                          Đoạn {currentIdx + 1}
                        </h3>
                      </div>

                      <div
                        className="font-serif leading-[1.9] text-jp-ink text-[0.95rem] [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:pb-2 [&_p]:mb-2.5 [&_b]:font-bold [&_b]:text-jp-indigo [&_ul]:pl-0 [&_ul]:my-3 [&_li]:py-1 [&_li]:text-sm [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-md [&_img]:mx-auto [&_img]:block [&_img]:my-4 [&_hr]:border-none [&_hr]:h-0.5 [&_hr]:bg-gradient-to-r [&_hr]:from-transparent [&_hr]:via-neutral-200 [&_hr]:to-transparent [&_hr]:my-7 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_td]:border [&_td]:border-neutral-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_th]:border [&_th]:border-neutral-200 [&_th]:px-3 [&_th]:py-2 [&_th]:text-sm [&_th]:bg-neutral-50 [&_th]:font-bold"
                        dangerouslySetInnerHTML={{
                          __html: renderContentHTML(
                            currentReading?.content || ""
                          ),
                        }}
                      />
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-jp-red/20 to-transparent" />

                    <div className="p-6 md:p-10 bg-gradient-to-b from-jp-sakura/10 to-white">
                      <div className="mb-6">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-jp-red/80 uppercase tracking-widest mb-3">
                          <BookOpen size={14} />
                          Câu hỏi
                        </span>
                        <p className="text-lg font-serif font-semibold text-jp-indigo leading-relaxed">
                          {currentReading?.question}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {[1, 2, 3, 4].map((optNum) => {
                          const optKey =
                            `option${optNum}` as keyof ReadingItem;
                          const text = currentReading?.[optKey] as string;
                          if (!text) return null;

                          return (
                            <button
                              key={optNum}
                              className={getOptionClasses(optNum)}
                              onClick={() => handleSelectOption(optNum)}
                            >
                              <span className={getOptionLabelClasses(optNum)}>
                                {isAnswered &&
                                  optNum === currentReading?.correctOption ? (
                                  <CheckCircle2 size={18} />
                                ) : isAnswered &&
                                  selectedOption === optNum &&
                                  optNum !==
                                  currentReading?.correctOption ? (
                                  <XCircle size={18} />
                                ) : (
                                  OPTION_LABELS[optNum - 1]
                                )}
                              </span>
                              <span className="flex-1 text-left">{text}</span>
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {isAnswered && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 ${isCorrect
                              ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300"
                              : "bg-gradient-to-r from-red-50 to-red-100/50 border-red-300"
                              }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2
                                  size={24}
                                  className="text-emerald-600 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-emerald-800">
                                    正解！ Chính xác!
                                  </p>
                                  <p className="text-sm text-emerald-700/80">
                                    Bạn đã chọn đúng đáp án.
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <XCircle
                                  size={24}
                                  className="text-red-600 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-red-800">
                                    残念！ Chưa đúng
                                  </p>
                                  <p className="text-sm text-red-700/80">
                                    Đáp án đúng là:{" "}
                                    <strong>
                                      {
                                        OPTION_LABELS[
                                        (currentReading?.correctOption ?? 1) -
                                        1
                                        ]
                                      }
                                      .{" "}
                                      {
                                        currentReading?.[
                                        `option${currentReading.correctOption}` as keyof ReadingItem
                                        ] as string
                                      }
                                    </strong>
                                  </p>
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {isAnswered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-6 flex items-center justify-between"
                        >
                          <button
                            onClick={handlePrev}
                            disabled={currentIdx === 0}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-jp-indigo border-2 border-neutral-200 rounded-2xl font-bold text-sm cursor-pointer transition-all hover:border-jp-indigo hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:bg-transparent"
                          >
                            <ChevronLeft size={18} />
                            Câu trước
                          </button>
                          <button
                            onClick={handleNext}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-jp-red to-rose-400 text-white border-none rounded-2xl font-bold text-sm cursor-pointer shadow-lg shadow-jp-red/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-jp-red/30 active:translate-y-0"
                          >
                            {currentIdx < totalQuestions - 1
                              ? "Câu tiếp theo"
                              : "Xem kết quả"}
                            <ChevronRight size={18} />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <LessonProgressSidebar lessonId={lessonId} userId={userId} levelName={levelName} />

              <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm mt-6">
                <h3 className="text-sm font-bold text-jp-indigo uppercase tracking-widest mb-5 pb-3 border-b border-black/5 flex items-center gap-2">
                  <FileText size={14} className="text-jp-red" />
                  {lessons.length} Bài Học
                </h3>

                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {lessons.map((lesson, idx) => (
                    <Link
                      key={lesson.lessonId}
                      href={`/reading/${levelName}/${lesson.lessonId}`}
                      className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${lesson.lessonId === lessonId
                        ? "bg-gradient-to-br from-jp-red to-rose-400 text-white shadow-md scale-105"
                        : "bg-jp-sakura/60 text-jp-indigo hover:bg-jp-red hover:text-white hover:scale-105"
                        }`}
                      title={lesson.lessonName}
                    >
                      {idx + 1}
                    </Link>
                  ))}
                </div>
              </div>

              {totalQuestions > 0 && (
                <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-jp-indigo uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" />
                    Tiến trình
                  </h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-jp-indigo">
                      {answers.filter((a) => a !== null).length}
                      <span className="text-base font-normal text-jp-ink/40">
                        /{totalQuestions}
                      </span>
                    </div>
                    <p className="text-xs text-jp-ink/50 mt-1">
                      Câu đã trả lời
                    </p>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-gradient-to-r from-jp-red to-rose-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${(answers.filter((a) => a !== null).length /
                            totalQuestions) *
                            100
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200/50 p-6">
                <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Mẹo học
                </p>
                <p className="text-xs text-amber-800/70 leading-relaxed">
                  Đọc chậm từng câu, chú ý các từ khóa quan trọng. Nếu gặp
                  kanji lạ, hãy đoán nghĩa qua ngữ cảnh trước khi tra từ điển.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-jp-red via-jp-sakura to-jp-red mt-20" />
    </div>
  );
}