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
  score: number;
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

function getBookmarkTypeLabel(type: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized === "lesson") return "Bài học";
  if (normalized === "vocabulary" || normalized === "vocab") return "Từ vựng";
  if (normalized === "grammar") return "Ngữ pháp";
  return type || "Khác";
}

interface TestHistoryItem {
  testHistoryId: number;
  userId: number;
  score: number;
  date: string;
  detail: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [testHistories, setTestHistories] = useState<TestHistoryItem[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setExamResults(results as ExamResult[]);
          setTestHistories(results.map((e: ExamResult) => ({
             testHistoryId: e.examResultId,
             userId: userData.userId,
             score: e.score,
             date: e.completedAt,
             detail: "Bài thi JLPT"
          })));
      }
      if (Array.isArray(bookmarkData)) setBookmarks(bookmarkData as BookmarkItem[]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      totalExams: examResults.length,
      passed: examResults.filter((item) => item.isPassed).length,
      averageExamScore: examResults.length
        ? Math.round(examResults.reduce((sum, item) => sum + item.score, 0) / examResults.length)
        : 0,
      averagePracticeScore: testHistories.length
        ? Math.round(testHistories.reduce((sum, item) => sum + Number(item.score), 0) / testHistories.length)
        : 0,
      lessonBookmarks: bookmarks.filter((item) => item.type.toLowerCase() === "lesson").length,
      vocabularyBookmarks: bookmarks.filter((item) => item.type.toLowerCase() === "vocabulary").length,
    }),
    [bookmarks, examResults, testHistories]
  );

  const parsedDetails = useMemo(() => {
    const map = new Map<number, any>();
    testHistories.forEach((item) => {
      try {
        map.set(item.testHistoryId, JSON.parse(item.detail));
      } catch {
        map.set(item.testHistoryId, null);
      }
    });
    return map;
  }, [testHistories]);

  return (
    <StudentLayout>
      <div className="mx-auto max-w-5xl">
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

                {testHistories.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500">Chưa có bài test nào được lưu.</div>
                ) : (
                  <div className="divide-y divide-black/5">
                    {testHistories.map((item) => {
                      const parsed = parsedDetails.get(item.testHistoryId);
                      const answers = Array.isArray(parsed?.answers) ? parsed.answers : [];
                      const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
                      const isOpen = expandedHistoryId === item.testHistoryId;

                      return (
                        <div key={item.testHistoryId} className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isOpen ? null : item.testHistoryId)}
                            className="flex w-full items-center justify-between gap-4 text-left"
                          >
                            <div>
                              <p className="text-sm font-bold text-jp-indigo">Bài test #{item.testHistoryId}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {formatDate(item.date)}
                                </span>
                                <span>{answers.length || questions.length} câu</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-jp-red">
                                {item.score} / 180
                              </span>
                              <ChevronDown
                                size={18}
                                className={`text-neutral-400 transition ${isOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                              {questions.length > 0 ? (
                                <div className="space-y-3">
                                  {questions.slice(0, 5).map((question: any, index: number) => {
                                    const selected = parsed?.answers?.[question.examQuestionId];
                                    const correct = question.correctAnswer;
                                    const isCorrect = selected === correct;

                                    return (
                                      <div key={question.examQuestionId || index} className="rounded-2xl border border-white bg-white p-4">
                                        <p className="text-sm font-semibold text-jp-indigo">{question.questionText || `Câu ${index + 1}`}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-500">
                                            Chọn: {selected || "Chưa trả lời"}
                                          </span>
                                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">
                                            Đáp án: {correct || "-"}
                                          </span>
                                          <span
                                            className={`rounded-full px-2.5 py-1 font-bold ${
                                              isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                                            }`}
                                          >
                                            {isCorrect ? "Đúng" : "Sai"}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-600">
                                  {item.detail}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                              <div>
                                <p className="text-sm font-bold text-jp-indigo">{item.itemName || `Item ${item.itemId}`}</p>
                                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                                  {getBookmarkTypeLabel(item.type)} · {formatDate(item.createdAt)}
                                </p>
                              </div>
                              <BookMarked size={16} className="text-amber-500" />
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
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                result.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                              }`}
                            >
                              {result.isPassed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-jp-indigo">{result.exam?.examName || "Đề thi"}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {formatDate(result.completedAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {Math.floor(result.duration / 60)} phút {result.duration % 60} giây
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-lg font-bold ${result.isPassed ? "text-emerald-600" : "text-red-500"}`}>
                              {result.score} / 180
                            </p>
                            <p className="text-xs text-neutral-400">
                              {result.amountCorrectAnswers}/{result.totalQuestion} câu đúng
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

function formatDate(input: string) {
  return new Date(input).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
