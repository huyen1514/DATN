"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  Languages,
  ArrowRight,
  Loader2,
  Search,
  Sparkles,
  Bookmark,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface PrebuiltLesson {
  lessonId: number;
  lessonName: string;
  levelName: string;
  levelId: number;
  skillType: string;
  cardCount: number;
}

type SkillTab = "Vocabulary" | "Kanji";

export default function PrebuiltFlashcardsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<PrebuiltLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SkillTab>("Vocabulary");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startingLesson, setStartingLesson] = useState<number | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const result = await api("/prebuilt-flashcards/lessons");
      if (Array.isArray(result)) {
        setLessons(result);
      }
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
      const result = await api(
        `/prebuilt-flashcards/start/${typeParam}/${lessonId}`,
        "POST"
      );
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

  const filteredLessons = lessons.filter((l) => {
    const matchesTab = l.skillType === activeTab;
    const matchesLevel = selectedLevel === "all" || l.levelName === selectedLevel;
    const matchesSearch = !searchQuery || l.lessonName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesLevel && matchesSearch;
  });

  const groupedByLevel = filteredLessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.levelName]) acc[lesson.levelName] = [];
      acc[lesson.levelName].push(lesson);
      return acc;
    },
    {} as Record<string, PrebuiltLesson[]>
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }
  };

  const totalCards = filteredLessons.reduce((s, l) => s + l.cardCount, 0);

  return (
    <StudentLayout>
      <div className="relative min-h-screen font-sans text-slate-800 bg-slate-50/50">

        {/* --- DYNAMIC BACKGROUND: Tăng độ sáng và mờ --- */}
        <div className="fixed inset-0 z-0 pointer-events-none grayscale opacity-[0.05]">
          <img
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000"
            alt="Japan Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-slate-50/50 backdrop-blur-[0.5px]"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 pt-12">

          {/* --- PAGE HEADER --- */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-100 bg-white/80 text-[#c62828] text-[10px] font-bold tracking-[0.1em] uppercase mb-6 shadow-sm">
              <Sparkles size={12} /> HỌC LIỆU CHUẨN MỰC
            </div>

            <h1 className="text-4xl md:text-5xl font-sans text-slate-800 mb-4 tracking-tight font-semibold">
              Thư viện <span className="font-serif text-[#c62828] italic font-normal">Flashcard</span>
            </h1>

            <p className="text-slate-500 text-base leading-relaxed max-w-2xl font-medium">
              Học tập hiệu quả với các bộ thẻ ghi nhớ được biên soạn chuẩn mực theo từng bài học và cấp độ JLPT.
            </p>
          </header>

          {/* --- TOOLBAR: Sử dụng Slate thay vì Black --- */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">

            {/* Tabs - Slate Style */}
            <div className="flex gap-1 p-1.5 bg-slate-200/50 rounded-full w-fit border border-slate-200/60 backdrop-blur-md">
              {(["Vocabulary", "Kanji"] as SkillTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedLevel("all");
                  }}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab
                    ? "bg-slate-800 text-white shadow-md shadow-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {tab === "Vocabulary" ? <BookOpen size={14} /> : <Languages size={14} />}
                  {tab === "Vocabulary" ? "Từ vựng" : "Chữ Hán"}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Level Filter - Slate Style */}
              <div className="flex bg-slate-200/50 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-md">
                <button
                  onClick={() => setSelectedLevel("all")}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all ${selectedLevel === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  Tất cả
                </button>
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all ${selectedLevel === level ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Search - Soften colors */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* --- QUICK STATS --- */}
          <div className="flex items-center gap-4 border-b border-slate-200/80 pb-6 mb-12">
            <span className="text-sm font-bold text-slate-700">{filteredLessons.length} Bộ thẻ</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-sm text-slate-400 font-medium tracking-wide">
              Tổng cộng {totalCards} {activeTab === "Vocabulary" ? "từ vựng" : "chữ Kanji"}
            </span>
          </div>

          {/* --- MAIN CONTENT Area --- */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#c62828]" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Đang khởi tạo...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm py-24 rounded-[3rem] border border-slate-200 border-dashed text-center shadow-sm">
              <Bookmark className="w-12 h-12 mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-serif italic text-slate-400">Không tìm thấy tài liệu phù hợp</h3>
            </div>
          ) : (
            <div className="space-y-16 pb-20">
              {Object.entries(groupedByLevel).map(([levelName, levelLessons]) => (
                <div key={levelName}>

                  <div className="flex items-center gap-4 mb-8">
                    <Compass size={18} className="text-[#c62828]" />
                    <h2 className="text-2xl font-serif text-slate-800 font-medium tracking-tight uppercase">Trình độ {levelName}</h2>
                    <div className="flex-grow h-[1px] bg-slate-200/60"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{levelLessons.length} bài học</span>
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {levelLessons.map((lesson) => (
                      <motion.div key={lesson.lessonId} variants={itemVariants}>
                        <div className="group relative bg-white border border-slate-200/80 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-red-100 transition-all duration-500 flex flex-col h-full overflow-hidden">

                          {/* Watermark: Slate tone */}
                          <div className="absolute -bottom-4 -right-2 text-[120px] font-serif text-slate-50 opacity-[0.8] group-hover:text-red-50/80 group-hover:scale-110 transition-all duration-700 pointer-events-none select-none leading-none">
                            {activeTab === "Vocabulary" ? "語" : "漢"}
                          </div>

                          <div className="relative z-10 flex-grow">
                            {/* Metadata
                            <div className="flex justify-between items-start mb-6">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#c62828] bg-red-50/60 px-2.5 py-1 rounded-full border border-red-100/50">
                                JLPT {levelName}
                              </span>
                            </div> */}

                            {/* Title: Slate text */}
                            <h3 className="text-lg font-bold text-slate-700 mb-6 group-hover:text-[#c62828] transition-colors leading-tight min-h-[3rem]">
                              {lesson.lessonName}
                            </h3>

                            {/* Scale Indicator */}
                            <div className="flex items-center gap-2 mb-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-100 group-hover:bg-[#c62828] transition-colors"></div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quy mô:</span>
                              <span className="text-[11px] font-black text-slate-600 uppercase">{lesson.cardCount} Thẻ ghi nhớ</span>
                            </div>
                          </div>

                          {/* Action Button: Deep Slate instead of Black */}
                          <div className="relative z-10 pt-2 mt-auto">
                            <button
                              onClick={() => handleStartLesson(lesson.lessonId, lesson.skillType)}
                              disabled={startingLesson === lesson.lessonId}
                              className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${startingLesson === lesson.lessonId
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
                                : "bg-slate-800 text-white hover:bg-[#c62828] shadow-lg shadow-slate-200 hover:shadow-red-200"
                                }`}
                            >
                              {startingLesson === lesson.lessonId ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Đang đồng bộ...
                                </>
                              ) : (
                                <>
                                  Bắt đầu học ngay <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}