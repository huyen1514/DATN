"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  Languages,
  Loader2,
  Search,
  ChevronRight,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

interface PrebuiltLesson {
  lessonId: number;
  lessonName: string;
  levelName: string;
  vocabCount: number;
  kanjiCount: number;
  vocabMastered: number;
  kanjiMastered: number;
  vocabDeckId?: number;
  kanjiDeckId?: number;
  skillType?: string; // Giữ lại để tránh lỗi type ở các chỗ khác nếu có
}

type SkillTab = "Vocabulary" | "Kanji";

const LEVEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  N5: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  N4: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
  N3: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  N2: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  N1: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
};

const DEFAULT_COLOR = { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };

export default function PrebuiltFlashcardsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<PrebuiltLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SkillTab>("Vocabulary");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startingLesson, setStartingLesson] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const result = await api("/prebuilt-flashcards/lessons");
      if (Array.isArray(result)) setLessons(result);
    } catch (error) {
      console.error("Error loading prebuilt lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async (lessonId: number, type: string) => {
    setStartingLesson(lessonId);
    try {
      const typeParam = type === "Kanji" ? "kanji" : "vocab";
      const result = await api(`/prebuilt-flashcards/start/${typeParam}/${lessonId}`, "POST");
      if (result.deckId) {
        router.push(`/learn/${result.deckId}`);
      } else {
        alert("Có lỗi khi tạo bộ thẻ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error starting lesson:", error);
      alert("Có lỗi khi tạo bộ thẻ. Vui lòng đăng nhập và thử lại.");
    } finally {
      setStartingLesson(null);
    }
  };

  const levels = [...new Set(lessons.map((l) => l.levelName))].sort();

  // Đã thêm logic: Chỉ hiển thị bài học nếu có số lượng thẻ > 0 tương ứng với Tab đang chọn
  const filteredLessons = lessons.filter((l) => {
    const matchesLevel = selectedLevel === "all" || l.levelName === selectedLevel;
    const matchesSearch = !searchQuery || l.lessonName.toLowerCase().includes(searchQuery.toLowerCase());
    const hasCards = activeTab === "Vocabulary" ? l.vocabCount > 0 : l.kanjiCount > 0;

    return matchesLevel && matchesSearch && hasCards;
  });

  const groupedByLevel = filteredLessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.levelName]) acc[lesson.levelName] = [];
      acc[lesson.levelName].push(lesson);
      return acc;
    },
    {} as Record<string, PrebuiltLesson[]>
  );

  // Tính tổng số thẻ dựa trên Tab đang active
  const totalCards = filteredLessons.reduce((s, l) => {
    return s + (activeTab === "Vocabulary" ? l.vocabCount : l.kanjiCount);
  }, 0);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#faf9f7] font-sans">
        {/* ─── HERO HEADER ─────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-stone-200">
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #1a1a1a 1px, transparent 1px),
                linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />

          <div className="absolute right-0 top-0 h-full flex items-center pr-16 pointer-events-none select-none">
            <span className="text-[240px] font-thin text-stone-100 leading-none tracking-tight">
              {activeTab === "Vocabulary" ? "語" : "字"}
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[1.5px] bg-[#c62828]" />
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#c62828] uppercase">
                Học liệu chuẩn mực
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-light text-stone-800 mb-4 tracking-tight leading-none">
              Thư viện
              <em className="not-italic font-semibold text-[#c62828] ml-4">
                Flashcard
              </em>
            </h1>

            <p className="text-stone-500 text-[15px] leading-relaxed max-w-lg mt-4 mb-10 font-normal">
              Bộ thẻ ghi nhớ được biên soạn theo từng bài học và cấp độ, giúp bạn học tập có hệ thống và hiệu quả.
            </p>

            <div className="flex items-center gap-8">
              <div>
                <p className="text-3xl font-semibold text-stone-800 tabular-nums">{filteredLessons.length}</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-widest mt-0.5 font-medium">Bộ thẻ</p>
              </div>
              <div className="w-px h-10 bg-stone-200" />
              <div>
                <p className="text-3xl font-semibold text-stone-800 tabular-nums">{totalCards.toLocaleString()}</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-widest mt-0.5 font-medium">
                  {activeTab === "Vocabulary" ? "Từ vựng" : "Kanji"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CONTROL BAR ─────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-[#faf9f7]/95 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-center gap-4 py-3">
              <div className="flex gap-0 bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                {(["Vocabulary", "Kanji"] as SkillTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSelectedLevel("all"); }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 ${activeTab === tab
                        ? "bg-stone-800 text-white"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                      }`}
                  >
                    {tab === "Vocabulary" ? <BookOpen size={13} /> : <Languages size={13} />}
                    {tab === "Vocabulary" ? "Từ vựng" : "Chữ Hán"}
                  </button>
                ))}
              </div>

              <div className="hidden md:block w-px h-7 bg-stone-200" />

              <div className="flex items-center gap-1.5 flex-wrap">
                {["all", ...levels].map((level) => {
                  const color = level === "all" ? DEFAULT_COLOR : (LEVEL_COLORS[level] ?? DEFAULT_COLOR);
                  const isActive = selectedLevel === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${isActive
                          ? `${color.bg} ${color.text} ring-1 ring-current ring-opacity-30`
                          : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        }`}
                    >
                      {isActive && level !== "all" && (
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                      )}
                      {level === "all" ? "Tất cả" : level}
                    </button>
                  );
                })}
              </div>

              <div className="relative md:ml-auto">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm bài học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-56 pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-stone-200" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-t-2 border-[#c62828] animate-spin" />
              </div>
              <p className="text-stone-400 text-[11px] font-bold uppercase tracking-[0.2em]">Đang tải...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-7xl font-thin text-stone-200 mb-6">空</div>
              <p className="text-stone-400 text-sm">Không tìm thấy bài học phù hợp</p>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(groupedByLevel).map(([levelName, levelLessons]) => {
                const color = LEVEL_COLORS[levelName] ?? DEFAULT_COLOR;

                // Cập nhật lại logic đếm thẻ theo từng cấp độ (Level)
                const totalCardsInLevel = levelLessons.reduce((s, l) => {
                  return s + (activeTab === "Vocabulary" ? l.vocabCount : l.kanjiCount);
                }, 0);

                return (
                  <section key={levelName}>
                    <div className="flex items-center gap-4 mb-7">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${color.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${color.text}`}>
                          Trình độ {levelName}
                        </span>
                      </div>
                      <div className="flex-grow h-px bg-stone-200" />
                      <span className="text-[11px] text-stone-400 font-medium">
                        {levelLessons.length} bài học · {totalCardsInLevel} thẻ
                      </span>
                    </div>

                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                      {levelLessons.map((lesson) => {
                        const isStarting = startingLesson === lesson.lessonId;
                        const isHovered = hoveredCard === lesson.lessonId;

                        // Xác định data hiển thị phụ thuộc vào Tab đang Active
                        const currentCount = activeTab === "Vocabulary" ? lesson.vocabCount : lesson.kanjiCount;
                        const masteredCount = activeTab === "Vocabulary" ? (lesson.vocabMastered || 0) : (lesson.kanjiMastered || 0);
                        const progressPercent = currentCount > 0 ? Math.round((masteredCount / currentCount) * 100) : 0;

                        return (
                          <motion.div
                            key={lesson.lessonId}
                            variants={itemVariants}
                            onMouseEnter={() => setHoveredCard(lesson.lessonId)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            <div
                              className={`group relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col ${isHovered
                                  ? "border-stone-300 shadow-xl shadow-stone-100 -translate-y-0.5"
                                  : "border-stone-200 shadow-sm"
                                }`}
                            >
                              <div className={`h-0.5 w-full ${color.dot} opacity-60`} />

                              <div className="p-5 flex flex-col flex-grow">
                                <div className="flex items-center justify-between mb-4">
                                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${color.text}`}>
                                    {levelName}
                                  </span>
                                  <span className="text-[10px] text-stone-400 font-medium tabular-nums">
                                    {currentCount} thẻ
                                  </span>
                                </div>

                                <h3 className="text-[14px] font-semibold text-stone-800 leading-snug mb-4 flex-grow group-hover:text-[#c62828] transition-colors duration-200 line-clamp-2">
                                  {lesson.lessonName}
                                </h3>

                                <div className="mb-6">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-neutral-500">Tiến trình học</span>
                                    <span className="text-xs font-bold text-blue-600">
                                      {masteredCount}/{currentCount} thẻ
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 transition-all duration-500"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleStartLesson(lesson.lessonId, activeTab)}
                                  disabled={isStarting}
                                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${isStarting
                                      ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                      : "bg-stone-800 text-white hover:bg-[#c62828] active:scale-[0.98]"
                                    }`}
                                >
                                  {isStarting ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" />
                                      Đang tải...
                                    </>
                                  ) : (
                                    <>
                                      Học ngay
                                      <ChevronRight
                                        size={13}
                                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                                      />
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}