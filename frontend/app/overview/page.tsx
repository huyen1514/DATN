"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { api } from "@/lib/api";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Flame,
  Headphones,
  Languages,
  PenTool,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface Level {
  levelId: number;
  levelName: string;
}

// CẬP NHẬT INTERFACE THEO CHUẨN MỚI CỦA BACKEND
interface LessonPart {
  partType: string;
  status: string;
  score: number | null;
  lastAccessedAt: string;
}

interface UserProgress {
  userProgressId: number;
  userId: number;
  lessonId: number;
  lessonName: string;
  skillType: string;
  levelName: string;
  score: number;
  lastAccessed: string;
  completed: boolean;
  parts: LessonPart[];
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

interface DashboardResponse {
  userId: number;
  totalLessonsLearned: number;
  completedLessons: number;
  averageScore: number;
}

interface BookmarkItem {
  bookmarkId: number;
  itemId: number;
  type: string;
  itemName: string;
  createdAt: string;
}

interface TestHistoryItem {
  testHistoryId: number;
  userId: number;
  score: number;
  date: string;
  detail: string;
}

interface RecommendedLesson {
  lessonId: number;
  lessonName: string;
  skillType: string;
  levelName: string;
  recommendationReason: string;
}

interface RecommendationResponse {
  userId: number;
  averageScore: number;
  simulatedKMeansCluster: string;
  simulatedAprioriRule: string;
  lessons: RecommendedLesson[];
}

const SKILL_MAP: Record<string, { label: string; icon: any; path: string; bg: string; color: string }> = {
  Vocabulary: { label: "Từ vựng", icon: BookOpen, path: "/vocabulary", bg: "bg-blue-50", color: "text-blue-600" },
  Grammar: { label: "Ngữ pháp", icon: PenTool, path: "/grammar", bg: "bg-violet-50", color: "text-violet-600" },
  Kanji: { label: "Hán tự", icon: Languages, path: "/kanji", bg: "bg-amber-50", color: "text-amber-600" },
  Reading: { label: "Đọc hiểu", icon: FileText, path: "/reading", bg: "bg-emerald-50", color: "text-emerald-600" },
  Listening: { label: "Nghe hiểu", icon: Headphones, path: "/listening", bg: "bg-rose-50", color: "text-rose-600" },
};

const GREETING = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

export default function OverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  
  // Sử dụng mảng UserProgress làm chuẩn
  const [progresses, setProgresses] = useState<UserProgress[]>([]);
  
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [testHistories, setTestHistories] = useState<TestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      void loadAllData(parsed.userId);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  }, []);

  const loadAllData = async (userId: number) => {
    try {
      const [levelsData, examResultsData, dashboardData, recommendationsData, bookmarksData, historyData, progressData] =
        await Promise.all([
          api("/levels"),
          api(`/exam-results?userId=${userId}`),
          api(`/dashboard/${userId}`),
          api(`/recommendations/${userId}`),
          api(`/bookmark/${userId}`),
          api(`/test-history/${userId}`),
          api(`/progress/user/${userId}`) // Cập nhật gọi đúng API mới
        ]);

      if (Array.isArray(levelsData)) setLevels(levelsData as Level[]);
      if (Array.isArray(examResultsData)) setExamResults(examResultsData as ExamResult[]);
      if (dashboardData?.userId) setDashboard(dashboardData as DashboardResponse);
      if (recommendationsData?.userId) setRecommendations(recommendationsData as RecommendationResponse);
      if (Array.isArray(bookmarksData)) setBookmarks(bookmarksData as BookmarkItem[]);
      if (Array.isArray(historyData)) setTestHistories(historyData as TestHistoryItem[]);
      if (Array.isArray(progressData)) setProgresses(progressData as UserProgress[]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultLevel = levels[0]?.levelName || "N5";

  // CẬP NHẬT LOGIC: Duyệt qua mảng cha (UserProgress) -> mảng con (Parts)
  const skillProgress = useMemo(() => {
    const counts: Record<string, { total: number; completed: number; inProgress: number }> = {};
    Object.keys(SKILL_MAP).forEach((key) => {
      counts[key] = { total: 0, completed: 0, inProgress: 0 };
    });

    progresses.forEach((up) => {
      up.parts.forEach((part) => {
        if (!counts[part.partType]) return;
        counts[part.partType].total += 1;
        if (part.status === "Completed") counts[part.partType].completed += 1;
        if (part.status === "InProgress") counts[part.partType].inProgress += 1;
      });
    });

    return counts;
  }, [progresses]);

  // Làm phẳng (Flatten) danh sách chi tiết các kỹ năng để hiện ở phần "Hoạt động gần đây"
  const recentActivity = useMemo(() => {
    const flatParts: Array<{ lessonId: number, levelName: string, lessonName: string, partType: string, status: string, lastAccessedAt: string }> = [];
    
    progresses.forEach(up => {
      up.parts.forEach(part => {
        flatParts.push({
          lessonId: up.lessonId,
          levelName: up.levelName,
          lessonName: up.lessonName,
          partType: part.partType,
          status: part.status,
          lastAccessedAt: part.lastAccessedAt
        });
      });
    });

    return flatParts
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 5);
  }, [progresses]);

  const bookmarkSummary = useMemo(
    () => ({
      lessons: bookmarks.filter((item) => item.type.toLowerCase() === "lesson").length,
      vocabularies: bookmarks.filter((item) => item.type.toLowerCase() === "vocabulary").length,
      latest: [...bookmarks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    }),
    [bookmarks]
  );

  // Tính chuỗi ngày học liên tục dựa trên bảng Cha
  const streakDays = useMemo(() => {
    if (progresses.length === 0) return 0;

    const dates = [...new Set(progresses.map((item) => new Date(item.lastAccessed).toDateString()))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    for (let i = 0; i < dates.length; i += 1) {
      const current = new Date(dates[i]);
      current.setHours(0, 0, 0, 0);

      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);

      if (current.getTime() !== expected.getTime()) break;
      streak += 1;
    }

    return streak;
  }, [progresses]);

  const examStats = useMemo(
    () => ({
      total: examResults.length,
      passed: examResults.filter((item) => item.isPassed).length,
      average: examResults.length
        ? Math.round(examResults.reduce((sum, item) => sum + item.score, 0) / examResults.length)
        : 0,
    }),
    [examResults]
  );

  // Nút "Tiếp tục học" sẽ trỏ thẳng tới kỹ năng cuối cùng user truy cập
  const continueLearningTarget = useMemo(() => {
    const item = recentActivity[0];
    if (!item || !SKILL_MAP[item.partType]) return "/courses";
    return `${SKILL_MAP[item.partType].path}/${item.levelName || defaultLevel}/${item.lessonId}`;
  }, [defaultLevel, recentActivity]);

  return (
    <StudentLayout>
      <div className="mx-auto max-w-6xl pb-12">
        {/* Header Hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_32%),linear-gradient(135deg,#16263d_0%,#27476d_46%,#a71f48_100%)] px-8 py-9 text-white shadow-xl shadow-slate-900/10">
          <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-rose-300/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div>
              <p className="mb-2 text-sm font-medium text-white/65">{GREETING()},</p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {user?.fullName || user?.userName || "Học viên"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                Tiến độ học đang được gom thành một luồng rõ ràng: hệ thống lưu hoạt động học tập, tổng hợp thành dashboard,
                rồi dựa trên dữ liệu đó để gợi ý bài tiếp theo phù hợp.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <HeroMetric icon={Flame} label="Ngày liên tiếp" value={streakDays} />
                <HeroMetric icon={Target} label="Bài đã học" value={dashboard?.totalLessonsLearned ?? 0} />
                <HeroMetric icon={CheckCircle2} label="Bài hoàn thành" value={dashboard?.completedLessons ?? 0} />
                <HeroMetric icon={Star} label="Điểm trung bình" value={`${Math.round(dashboard?.averageScore ?? 0)}%`} />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={continueLearningTarget}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-jp-indigo transition hover:-translate-y-0.5"
                >
                  Tiếp tục học
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Xem hồ sơ học tập
                </Link>
              </div>
            </div>

            {/* Recommendations */}
            <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BrainCircuit size={18} className="text-amber-300" />
                Gợi ý học tiếp
              </div>

              {recommendations?.lessons?.length ? (
                <>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Phân cụm mô phỏng</p>
                    <p className="mt-1 text-lg font-bold">{recommendations.simulatedKMeansCluster}</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/65">{recommendations.simulatedAprioriRule}</p>
                  </div>

                  <div className="space-y-3">
                    {recommendations.lessons.slice(0, 3).map((lesson) => {
                      const skill = SKILL_MAP[lesson.skillType] || SKILL_MAP.Vocabulary;
                      return (
                        <Link
                          key={lesson.lessonId}
                          href={`${skill.path}/${lesson.levelName || defaultLevel}/${lesson.lessonId}`}
                          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                        >
                          <div className="mt-0.5 rounded-xl bg-white/10 p-2">
                            <skill.icon size={16} className="text-amber-200" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">{lesson.lessonName}</p>
                            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/45">
                              {lesson.levelName} · {skill.label}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-white/65">{lesson.recommendationReason}</p>
                          </div>
                          <ChevronRight size={16} className="mt-1 text-white/35" />
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-white/65">
                  Hệ thống sẽ bắt đầu gợi ý khi đã có đủ dữ liệu học tập từ tiến độ và điểm số của bạn.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CÁC PHẦN DƯỚI ĐÂY GIỮ NGUYÊN HOẶC ĐƯỢC MAP THEO STATE MỚI */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-jp-indigo">
              <TrendingUp size={20} className="text-jp-red" />
              Tiến độ theo kỹ năng
            </h2>
            <Link href="/courses" className="flex items-center gap-1 text-xs font-bold text-jp-red hover:underline">
              Vào học
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Object.entries(SKILL_MAP).map(([key, skill]) => {
              const stats = skillProgress[key] || { total: 0, completed: 0, inProgress: 0 };
              const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
              return (
                <Link
                  key={key}
                  href={`${skill.path}/${defaultLevel}`}
                  className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${skill.bg} ${skill.color}`}>
                      <skill.icon size={20} />
                    </div>
                    <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-[11px] font-bold text-neutral-500">
                      {stats.completed + stats.inProgress} bài
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-jp-indigo transition group-hover:text-jp-red">{skill.label}</h3>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-jp-red to-rose-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-neutral-400">
                    <span>{stats.completed} hoàn thành</span>
                    <span className="font-bold text-jp-red">{percent}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bảng hoạt động và Lưu trữ */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-jp-indigo">
                <BookMarked size={18} className="text-jp-red" />
                Thư viện đã lưu
              </h2>
              <Link href="/profile" className="text-xs font-bold text-jp-red hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
              <MiniMetric label="Bài học đã lưu" value={bookmarkSummary.lessons} />
              <MiniMetric label="Từ vựng đã lưu" value={bookmarkSummary.vocabularies} />
            </div>

            <div className="space-y-3">
              {bookmarkSummary.latest.length === 0 ? (
                <EmptyCard text="Bạn chưa bookmark bài học hoặc từ vựng nào." />
              ) : (
                bookmarkSummary.latest.map((item) => (
                  <div
                    key={item.bookmarkId}
                    className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-jp-indigo">{item.itemName || `Item ${item.itemId}`}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                        {item.type} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <BookMarked size={16} className="text-amber-500" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-jp-indigo">
                <ClipboardList size={18} className="text-jp-red" />
                Lịch sử làm bài
              </h2>
              <Link href="/profile" className="text-xs font-bold text-jp-red hover:underline">
                Xem chi tiết
              </Link>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
              <MiniMetric label="Bài test đã lưu" value={testHistories.length} />
              <MiniMetric label="Điểm TB luyện tập" value={`${Math.round(dashboard?.averageScore ?? 0)}%`} />
            </div>

            <div className="space-y-3">
              {testHistories.length === 0 ? (
                <EmptyCard text="Chưa có lịch sử làm bài nào được lưu." />
              ) : (
                testHistories.slice(0, 3).map((item) => (
                  <div
                    key={item.testHistoryId}
                    className="rounded-2xl border border-neutral-100 bg-neutral-50/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-jp-indigo">Bài test #{item.testHistoryId}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-jp-red">
                        {Math.round(item.score)}%
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Lịch sử hoạt động gần đây & Bài tập */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-5">
              <h2 className="flex items-center gap-2 font-bold text-jp-indigo">
                <Clock size={18} className="text-jp-red" />
                Hoạt động gần đây
              </h2>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-sm text-neutral-400">Đang tải...</div>
            ) : recentActivity.length === 0 ? (
              <div className="p-10">
                <EmptyCard text="Chưa có hoạt động học tập gần đây." />
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {recentActivity.map((item, index) => {
                  const skill = SKILL_MAP[item.partType];
                  if (!skill) return null;
                  return (
                    <Link
                      key={`${item.lessonId}-${item.partType}-${index}`}
                      href={`${skill.path}/${item.levelName || defaultLevel}/${item.lessonId}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-neutral-50"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${skill.bg} ${skill.color}`}>
                        <skill.icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-jp-indigo">
                          {item.lessonName || `Bài ${item.lessonId}`} · {skill.label}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {getTimeAgo(item.lastAccessedAt)} · {item.status === "Completed" ? "Hoàn thành" : "Đang học"}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-neutral-300" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 font-bold text-jp-indigo">
              <Trophy size={18} className="text-amber-500" />
              Thống kê luyện thi
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ScoreCard label="Bài thi" value={examStats.total} accent="text-jp-indigo" />
              <ScoreCard label="Đạt" value={examStats.passed} accent="text-emerald-600" />
              <ScoreCard label="Điểm TB" value={`${examStats.average}%`} accent="text-amber-600" />
            </div>

            <div className="mt-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Liên kết logic hệ thống</p>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed text-amber-900/80">
                <li>`Progress` lưu trạng thái học và điểm của user.</li>
                <li>`Dashboard` gom dữ liệu đó thành các chỉ số tổng quan dễ đọc.</li>
                <li>`Recommendation` tiếp tục dùng dữ liệu đã tổng hợp để đề xuất bài phù hợp hơn.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}

function HeroMetric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-white/55">
        <Icon size={15} />
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-jp-indigo">{value}</p>
    </div>
  );
}

function ScoreCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4 text-center">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-5 text-sm text-neutral-500">
      {text}
    </div>
  );
}

function formatDate(input: string) {
  return new Date(input).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return formatDate(dateStr);
}