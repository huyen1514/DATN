"use client";

import { useEffect, useState, useMemo } from "react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  Languages,
  PenTool,
  Headphones,
  FileText,
  GraduationCap,
  ClipboardList,
  ArrowRight,
  Layers,
  Folder,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  PlayCircle,
} from "lucide-react";

/* ============ Types ============ */
interface LessonProgress {
  id: number;
  lessonId: number;
  partType: string;
  status: string;
  score: number | null;
  lastAccessedAt: string;
}

interface ExamResult {
  examResultId: number;
  score: number;
  totalQuestion: number;
  amountCorrectAnswers: number;
  isPassed: boolean;
  completedAt: string;
  exam?: { examName: string };
}

interface Level {
  levelId: number;
  levelName: string;
}

/* ============ Constants ============ */
const SKILL_MAP: Record<string, { label: string; icon: any; color: string; bg: string; path: string }> = {
  Vocabulary: { label: "Từ vựng", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", path: "/vocabulary" },
  Grammar:    { label: "Ngữ pháp", icon: PenTool, color: "text-violet-600", bg: "bg-violet-50", path: "/grammar" },
  Kanji:      { label: "Hán tự", icon: Languages, color: "text-amber-600", bg: "bg-amber-50", path: "/kanji" },
  Reading:    { label: "Đọc hiểu", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", path: "/reading" },
  Listening:  { label: "Nghe hiểu", icon: Headphones, color: "text-rose-600", bg: "bg-rose-50", path: "/listening" },
};

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

/* ============ Component ============ */
export default function OverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [progresses, setProgresses] = useState<LessonProgress[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [flashcardStats, setFlashcardStats] = useState({ folders: 0, decks: 0, cards: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        void loadAllData(u.userId);
      } catch { }
    }
  }, []);

  const loadAllData = async (userId: number) => {
    try {
      const [levelsData, foldersData, decksData, examResultsData] = await Promise.all([
        api("/levels"),
        api("/folders"),
        api("/decks"),
        api(`/exam-results?userId=${userId}`),
      ]);

      if (Array.isArray(levelsData)) setLevels(levelsData);

      // Flashcard stats
      const allFolders = Array.isArray(foldersData) ? foldersData : [];
      const allDecks = Array.isArray(decksData) ? decksData : [];
      let totalCards = 0;
      allDecks.forEach((d: any) => { totalCards += d.flashCardCount || 0; });
      setFlashcardStats({ folders: allFolders.length, decks: allDecks.length, cards: totalCards });

      if (Array.isArray(examResultsData)) setExamResults(examResultsData);

      // Load all progress for this user
      try {
        const res = await fetch(`${API_URL}/progress/all/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setProgresses(data);
        }
      } catch { }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---- Derived stats ---- */
  const skillProgress = useMemo(() => {
    const counts: Record<string, { total: number; completed: number; inProgress: number }> = {};
    Object.keys(SKILL_MAP).forEach(k => { counts[k] = { total: 0, completed: 0, inProgress: 0 }; });
    progresses.forEach(p => {
      const key = p.partType;
      if (counts[key]) {
        counts[key].total++;
        if (p.status === "Completed") counts[key].completed++;
        if (p.status === "InProgress") counts[key].inProgress++;
      }
    });
    return counts;
  }, [progresses]);

  const recentActivity = useMemo(() => {
    return [...progresses]
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 5);
  }, [progresses]);

  const totalLessonsLearned = useMemo(() => {
    const uniqueLessons = new Set(progresses.map(p => p.lessonId));
    return uniqueLessons.size;
  }, [progresses]);

  const totalCompleted = progresses.filter(p => p.status === "Completed").length;
  const totalInProgress = progresses.filter(p => p.status === "InProgress").length;

  const examStats = useMemo(() => ({
    total: examResults.length,
    passed: examResults.filter(r => r.isPassed).length,
    avg: examResults.length > 0 ? Math.round(examResults.reduce((s, r) => s + r.score, 0) / examResults.length) : 0,
  }), [examResults]);

  const streakDays = useMemo(() => {
    if (progresses.length === 0) return 0;
    const dates = [...new Set(progresses.map(p =>
      new Date(p.lastAccessedAt).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      if (d.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [progresses]);

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto pb-12">

        {/* ====== GREETING HERO ====== */}
        <div className="relative mb-10 rounded-[2rem] bg-gradient-to-br from-jp-indigo via-[#1e3a5f] to-[#0f2027] text-white p-8 md:p-10 overflow-hidden">
          {/* Decorative */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-jp-red/10 rounded-full blur-3xl" />
          <div className="absolute right-8 bottom-6 text-[120px] font-serif text-white/[0.03] leading-none select-none pointer-events-none hidden md:block">
            学
          </div>

          <div className="relative z-10">
            <p className="text-white/50 text-sm font-medium mb-1 tracking-wide">{GREETING()},</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
              {user?.fullName || user?.userName || "Học viên"} 👋
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-xl leading-relaxed">
              Tiếp tục hành trình chinh phục tiếng Nhật. Mỗi ngày một bước tiến nhỏ, bạn sẽ đi rất xa!
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Flame size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{streakDays}</p>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">Ngày liên tiếp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Target size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{totalLessonsLearned}</p>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">Bài đã học</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{totalCompleted}</p>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">Kỹ năng hoàn thành</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Trophy size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{examStats.passed}</p>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">Bài thi đạt</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== SKILL PROGRESS GRID ====== */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-jp-indigo flex items-center gap-2">
              <TrendingUp size={20} className="text-jp-red" />
              Tiến độ theo kỹ năng
            </h2>
            <Link href="/courses" className="text-xs font-bold text-jp-red hover:underline flex items-center gap-1">
              Vào học <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(SKILL_MAP).map(([key, skill]) => {
              const stat = skillProgress[key] || { total: 0, completed: 0, inProgress: 0 };
              const active = stat.completed + stat.inProgress;
              const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
              const defaultLevel = levels.length > 0 ? levels[0].levelName : "N5";

              return (
                <Link
                  key={key}
                  href={`${skill.path}/${defaultLevel}`}
                  className="group bg-white rounded-2xl border border-black/5 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${skill.bg} flex items-center justify-center ${skill.color} group-hover:scale-110 transition-transform`}>
                      <skill.icon size={20} />
                    </div>
                    {active > 0 && (
                      <span className="text-[10px] font-bold text-white bg-jp-indigo/80 px-2 py-0.5 rounded-md">
                        {active} bài
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-jp-indigo text-sm mb-2 group-hover:text-jp-red transition-colors">{skill.label}</h3>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-jp-red to-rose-400 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-neutral-400 font-medium">{stat.completed} hoàn thành</span>
                    <span className="text-[10px] font-bold text-jp-red">{pct}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ====== QUICK ACTIONS + EXAM STATS ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Quick actions */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/courses" className="group bg-gradient-to-br from-violet-500 to-violet-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <GraduationCap size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base">Khóa Học</h3>
                <p className="text-white/60 text-xs mt-0.5">Học theo trình độ JLPT N5 → N1</p>
              </div>
              <ArrowRight className="ml-auto opacity-40 group-hover:opacity-100 shrink-0 group-hover:translate-x-1 transition-all" size={18} />
            </Link>

            <Link href="/exams" className="group bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <ClipboardList size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base">Luyện Thi JLPT</h3>
                <p className="text-white/60 text-xs mt-0.5">Làm đề thi thử chuẩn JLPT</p>
              </div>
              <ArrowRight className="ml-auto opacity-40 group-hover:opacity-100 shrink-0 group-hover:translate-x-1 transition-all" size={18} />
            </Link>

            <Link href="/flashcards/prebuilt" className="group bg-gradient-to-br from-teal-500 to-teal-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Layers size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base">Flashcard</h3>
                <p className="text-white/60 text-xs mt-0.5">Ôn tập bằng thẻ ghi nhớ</p>
              </div>
              <ArrowRight className="ml-auto opacity-40 group-hover:opacity-100 shrink-0 group-hover:translate-x-1 transition-all" size={18} />
            </Link>

            <Link href="/folders" className="group bg-gradient-to-br from-sky-500 to-sky-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Folder size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base">Không gian học</h3>
                <p className="text-white/60 text-xs mt-0.5">{flashcardStats.folders} thư mục · {flashcardStats.decks} bộ thẻ</p>
              </div>
              <ArrowRight className="ml-auto opacity-40 group-hover:opacity-100 shrink-0 group-hover:translate-x-1 transition-all" size={18} />
            </Link>
          </div>

          {/* Exam summary */}
          <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
            <h3 className="font-bold text-jp-indigo text-sm mb-5 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Thống kê luyện thi
            </h3>
            {examStats.total === 0 ? (
              <div className="text-center py-6">
                <ClipboardList size={32} className="text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400 mb-4">Bạn chưa làm bài thi nào.</p>
                <Link href="/exams" className="text-xs font-bold text-jp-red hover:underline">
                  Bắt đầu luyện thi →
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-amber-600 leading-none">{examStats.total}</span>
                    <span className="text-[9px] text-amber-500 font-medium mt-0.5">bài thi</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Đạt: <strong className="text-emerald-600">{examStats.passed}</strong></span>
                      <span className="text-neutral-500">Chưa đạt: <strong className="text-red-500">{examStats.total - examStats.passed}</strong></span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${examStats.total > 0 ? (examStats.passed / examStats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Điểm trung bình</p>
                  <p className="text-3xl font-bold text-jp-indigo">{examStats.avg}<span className="text-base text-neutral-400">%</span></p>
                </div>
                <Link href="/profile" className="flex items-center justify-center gap-2 text-xs font-bold text-jp-red hover:underline pt-2">
                  Xem lịch sử chi tiết <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ====== RECENT ACTIVITY ====== */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
            <h2 className="font-bold text-jp-indigo flex items-center gap-2">
              <Clock size={18} className="text-jp-red" />
              Hoạt động gần đây
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-neutral-400 text-sm">Đang tải...</div>
          ) : recentActivity.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles size={32} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm mb-4">Chưa có hoạt động nào. Bắt đầu học ngay!</p>
              <Link href="/courses" className="inline-flex items-center gap-2 bg-jp-indigo text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-jp-red transition-colors">
                <PlayCircle size={16} /> Vào học ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {recentActivity.map((item, idx) => {
                const skill = SKILL_MAP[item.partType];
                if (!skill) return null;
                const Icon = skill.icon;
                const timeAgo = getTimeAgo(item.lastAccessedAt);
                const defaultLevel = levels.length > 0 ? levels[0].levelName : "N5";

                return (
                  <Link
                    key={item.id || idx}
                    href={`${skill.path}/${defaultLevel}/${item.lessonId}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/50 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${skill.bg} flex items-center justify-center ${skill.color} shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-jp-indigo group-hover:text-jp-red transition-colors">
                        Bài {item.lessonId} - {skill.label}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
                        <Clock size={12} /> {timeAgo}
                        {item.status === "Completed" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 size={12} /> Hoàn thành
                          </span>
                        )}
                        {item.status === "InProgress" && (
                          <span className="text-blue-500 font-medium">Đang học</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-neutral-300 group-hover:text-jp-red group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

/* ============ Helper ============ */
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}
