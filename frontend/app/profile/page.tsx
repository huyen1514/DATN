"use client";

import { useEffect, useMemo, useState } from "react";
import StudentLayout from "@/components/StudentLayout";
import { api } from "@/lib/api";
import {
  BookMarked,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Mail,
  Shield,
  Trophy,
  UserCircle,
  XCircle,
} from "lucide-react";

// --- Interfaces ---
interface UserProfile {
  userId: number;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface ExamResult {
  examResultId: number;
  score?: number;
  totalScore?: number;
  point?: number;
  points?: number;
  achievableScore?: number;
  totalQuestion: number;
  amountCorrectAnswers: number;
  isPassed: boolean;
  duration: number;
  completedAt: string;
  exam?: { examName: string };
}

interface BookmarkItem {
  bookmarkId: number;
  userId: number;
  itemId: number;
  type: string;
  itemName: string;
  createdAt: string;
}

// --- Helpers ---
const getScoreValue = (item: any): number => {
  if (!item) return 0;
  return item.score ?? item.totalScore ?? item.point ?? item.points ?? item.achievableScore ?? 0;
};
function getBookmarkTypeLabel(type: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized === "lesson") return "Bài học";
  if (normalized === "vocabulary" || normalized === "vocab") return "Từ vựng";
  if (normalized === "grammar") return "Ngữ pháp";
  return type || "Khác";
}

// Hàm bổ trợ để đảm bảo chuỗi thời gian từ backend luôn được hiểu là UTC nếu thiếu 'Z'
function ensureUTC(input: string) {
  if (!input) return input;
  if (input.includes("T") && !input.includes("Z") && !/[+-]\d{2}:?\d{2}$/.test(input)) {
    return input + "Z";
  }
  return input;
}

function formatDate(input: string) {
  if (!input) return "N/A";
  const date = new Date(ensureUTC(input));
  
  if (isNaN(date.getTime())) return input;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = await api("/users/me");
      if (!userData?.userId) return;

      setUser(userData as UserProfile);

      const [results, bookmarkData] = await Promise.all([
        api(`/exam-results/history/${userData.userId}`),
        api(`/bookmark/${userData.userId}`)
      ]);

      if (Array.isArray(results)) {
        setExamResults(results);
        setDebugData(results);
      }
      if (Array.isArray(bookmarkData)) setBookmarks(bookmarkData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // FIX NaN: Đảm bảo kiểm tra độ dài mảng trước khi chia
  const stats = useMemo(
    () => {
      const totalExams = examResults.length;

      return {
        totalExams,
        passed: examResults.filter((item) => item.isPassed).length,
        averageExamScore: totalExams > 0
          ? Math.round(examResults.reduce((sum, item) => sum + getScoreValue(item), 0) / totalExams)
          : 0,
        averagePracticeScore: totalExams > 0
          ? Math.round(examResults.reduce((sum, item) => sum + getScoreValue(item), 0) / totalExams)
          : 0,
        lessonBookmarks: bookmarks.filter((item) => (item.type || "").toLowerCase() === "lesson").length,
        vocabularyBookmarks: bookmarks.filter((item) => (item.type || "").toLowerCase() === "vocabulary").length,
      };
    },
    [bookmarks, examResults]
  );

  const parsedDetails = useMemo(() => {
    const map = new Map<number, any>();
    examResults.forEach((item) => {
      // Logic để parse detail nếu cần, ở đây sử dụng placeholder
      map.set(item.examResultId, null);
    });
    return map;
  }, [examResults]);

  return (
    <StudentLayout>
      <div className="mx-auto max-w-5xl px-4 md:px-0">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-serif text-jp-indigo">
            <UserCircle size={28} className="text-jp-red" />
            Hồ Sơ Cá Nhân
          </h1>
          <p className="mt-2 text-neutral-500">Một nơi để xem hồ sơ tài khoản, lịch sử luyện thi, bookmark và bài test đã lưu.</p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-neutral-400 shadow-sm">Đang tải...</div>
        ) : user ? (
          <>
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
              <div className="relative h-28 bg-[linear-gradient(135deg,#182b44_0%,#2a4c73_55%,#a71f48_100%)]">
                <div className="absolute -bottom-10 left-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border-4 border-white bg-white shadow-lg">
                  <UserCircle size={42} className="text-jp-indigo" />
                </div>
              </div>

              <div className="px-8 pb-8 pt-14">
                <h2 className="text-2xl font-bold text-jp-indigo">{user.fullName}</h2>
                <p className="mt-1 text-sm text-neutral-500">@{user.userName}</p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <ProfileInfo icon={Mail} label="Email" value={user.email} />
                  <ProfileInfo icon={Shield} label="Vai trò" value={user.role} />
                  <ProfileInfo icon={Calendar} label="Trạng thái" value={user.isActive ? "Đang hoạt động" : "Bị khóa"} accent={user.isActive ? "text-emerald-600" : "text-red-500"} />
                </div>
              </div>
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-4">
              <StatCard icon={ClipboardList} label="Bài thi đã làm" value={stats.totalExams} accent="text-orange-500" />
              <StatCard icon={Trophy} label="Lần đạt" value={stats.passed} accent="text-emerald-600" />
              <StatCard icon={BookMarked} label="Bookmark bài học" value={stats.lessonBookmarks} accent="text-jp-red" />
              <StatCard icon={CheckCircle2} label="Điểm TB luyện tập" value={`${stats.averagePracticeScore}%`} accent="text-jp-indigo" />
            </section>

            <section className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
                <div className="border-b border-black/5 px-6 py-4">
                  <h3 className="flex items-center gap-2 font-bold text-jp-indigo">
                    <ClipboardList size={18} className="text-jp-red" />
                    Lịch sử làm bài test
                  </h3>
                </div>

                {examResults.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500">Chưa có bài test nào được lưu.</div>
                ) : (
                  <div className="divide-y divide-black/5">
                    {examResults.slice(0, 5).map((item) => {
                      const isOpen = expandedHistoryId === item.examResultId;

                      return (
                        <div key={item.examResultId} className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isOpen ? null : item.examResultId)}
                            className="flex w-full items-center justify-between gap-4 text-left"
                          >
                            <div>
                              <p className="text-sm font-bold text-jp-indigo">Bài thi #{item.examResultId}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {formatDate(item.completedAt)}
                                </span>
                                <span>{item.amountCorrectAnswers}/{item.totalQuestion} câu đúng</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-jp-red">
                                {getScoreValue(item)} / 180
                              </span>
                              <ChevronDown
                                size={18}
                                className={`text-neutral-400 transition ${isOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="rounded-xl bg-white p-3 border border-black/5">
                                  <p className="text-neutral-400 uppercase font-bold text-[9px]">Kết quả</p>
                                  <p className={`mt-1 font-bold ${item.isPassed ? "text-emerald-600" : "text-jp-red"}`}>
                                    {item.isPassed ? "ĐẠT" : "KHÔNG ĐẠT"}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-white p-3 border border-black/5">
                                  <p className="text-neutral-400 uppercase font-bold text-[9px]">Thời gian làm bài</p>
                                  <p className="mt-1 font-bold text-jp-indigo">{Math.floor(item.duration / 60)} phút</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Debugging UI */}
                <div className="px-6 py-4 border-t border-dashed border-neutral-100">
                  <details className="cursor-pointer">
                    <summary className="text-[10px] text-neutral-400 hover:text-jp-red">
                      [DEBUG] Xem JSON thô
                    </summary>
                    <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-neutral-900 p-3 text-[10px] text-emerald-400 font-mono">
                      <pre>{JSON.stringify(debugData?.slice(0, 1), null, 2)}</pre>
                    </div>
                  </details>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
                  <h3 className="mb-5 flex items-center gap-2 font-bold text-jp-indigo">
                    <BookMarked size={18} className="text-jp-red" />
                    Bookmark Library
                  </h3>

                  <div className="mb-5 grid grid-cols-2 gap-4">
                    <BookmarkMetric label="Bài học" value={stats.lessonBookmarks} />
                    <BookmarkMetric label="Từ vựng" value={stats.vocabularyBookmarks} />
                  </div>

                  <div className="space-y-3">
                    {bookmarks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-500">
                        Chưa có dữ liệu bookmark.
                      </div>
                    ) : (
                      [...bookmarks]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((item) => (
                          <div
                            key={item.bookmarkId}
                            className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-jp-indigo truncate">{item.itemName || `Item ${item.itemId}`}</p>
                                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                                  {getBookmarkTypeLabel(item.type)} · {formatDate(item.createdAt)}
                                </p>
                              </div>
                              <BookMarked size={16} className="text-amber-500 shrink-0" />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
                  <h3 className="mb-5 flex items-center gap-2 font-bold text-jp-indigo">
                    <Trophy size={18} className="text-amber-500" />
                    Lịch sử thi JLPT
                  </h3>

                  {examResults.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-500">
                      Bạn chưa làm bài thi nào.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {examResults.map((result) => (
                        <div
                          key={result.examResultId}
                          className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${result.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                                }`}
                            >
                              {result.isPassed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-jp-indigo truncate">{result.exam?.examName || "Đề thi"}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} />
                                  {formatDate(result.completedAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {Math.floor(result.duration / 60)}p
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${result.isPassed ? "text-emerald-600" : "text-red-500"}`}>
                              {getScoreValue(result)}/180
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
              <h3 className="mb-5 font-bold text-jp-indigo">Tóm tắt nhanh</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <QuickSummary label="Điểm thi trung bình" value={`${stats.averageExamScore}%`} />
                <QuickSummary label="Điểm luyện tập trung bình" value={`${stats.averagePracticeScore}%`} />
                <QuickSummary label="Tổng bookmark" value={bookmarks.length} />
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center text-neutral-500 shadow-sm">Không thể tải thông tin người dùng.</div>
        )}
      </div>
    </StudentLayout>
  );
}

// --- Components ---
// FIX: Render Icon dưới dạng Component JSX <Icon />
function ProfileInfo({
  icon: Icon,
  label,
  value,
  accent = "text-jp-indigo",
}: {
  icon: any;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
      <Icon size={18} className="text-neutral-400" />
      <div>
        <p className="text-[10px] font-bold uppercase text-neutral-400">{label}</p>
        <p className={`text-sm font-medium ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 text-center shadow-sm">
      <Icon size={24} className={`mx-auto mb-3 ${accent}`} />
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
    </div>
  );
}

function BookmarkMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-jp-indigo">{value}</p>
    </div>
  );
}

function QuickSummary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-jp-indigo">{value}</p>
    </div>
  );
}