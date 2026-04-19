"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { UserCircle, Mail, Shield, Calendar, Trophy, ClipboardList, CheckCircle2, XCircle, Clock } from "lucide-react";

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

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const userData = await api("/users/me");
      if (userData?.userId) {
        setUser(userData);
        // Load exam history
        const results = await api(`/exam-results?userId=${userData.userId}`);
        if (Array.isArray(results)) setExamResults(results);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const stats = {
    totalExams: examResults.length,
    passed: examResults.filter(r => r.isPassed).length,
    avgScore: examResults.length > 0 ? Math.round(examResults.reduce((sum, r) => sum + r.score, 0) / examResults.length) : 0,
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <UserCircle size={28} className="text-jp-red" />
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-neutral-500 font-light">Thông tin tài khoản và lịch sử thi của bạn.</p>
        </div>

        {isLoading ? (
          <div className="bg-white p-8 rounded-3xl animate-pulse text-center text-neutral-400">Đang tải...</div>
        ) : user ? (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-jp-indigo to-jp-red h-24 relative">
                <div className="absolute -bottom-10 left-8">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                    <UserCircle size={40} className="text-jp-indigo" />
                  </div>
                </div>
              </div>
              <div className="pt-14 pb-6 px-8">
                <h2 className="text-2xl font-bold text-jp-indigo mb-1">{user.fullName}</h2>
                <p className="text-neutral-500 text-sm mb-6">@{user.userName}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                    <Mail size={18} className="text-neutral-400" />
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Email</p>
                      <p className="text-sm text-jp-indigo font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                    <Shield size={18} className="text-neutral-400" />
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Vai trò</p>
                      <p className="text-sm text-jp-indigo font-medium">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                    <Calendar size={18} className="text-neutral-400" />
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Trạng thái</p>
                      <p className={`text-sm font-medium ${user.isActive ? "text-emerald-600" : "text-red-500"}`}>
                        {user.isActive ? "Đang hoạt động" : "Bị khóa"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-black/5 text-center">
                <ClipboardList size={24} className="text-orange-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-jp-indigo">{stats.totalExams}</p>
                <p className="text-xs font-bold text-neutral-400 uppercase">Bài thi đã làm</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-black/5 text-center">
                <Trophy size={24} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-emerald-600">{stats.passed}</p>
                <p className="text-xs font-bold text-neutral-400 uppercase">Lần đạt</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-black/5 text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-3xl font-bold text-jp-indigo">{stats.avgScore}%</p>
                <p className="text-xs font-bold text-neutral-400 uppercase">Điểm trung bình</p>
              </div>
            </div>

            {/* Exam History */}
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5">
                <h3 className="font-bold text-jp-indigo flex items-center gap-2">
                  <Trophy size={18} className="text-jp-red" /> Lịch sử thi
                </h3>
              </div>
              {examResults.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">Bạn chưa làm bài thi nào.</div>
              ) : (
                <div className="divide-y divide-black/5">
                  {examResults.map(r => (
                    <div key={r.examResultId} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                          {r.isPassed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-jp-indigo text-sm">{r.exam?.examName || "Đề thi"}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                              <Calendar size={12} /> {new Date(r.completedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {r.duration > 0 && (
                              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                                <Clock size={12} /> {Math.floor(r.duration / 60)} phút {r.duration % 60} giây
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${r.isPassed ? "text-emerald-600" : "text-red-500"}`}>{r.score}%</p>
                        <p className="text-xs text-neutral-400">{r.amountCorrectAnswers}/{r.totalQuestion} câu đúng</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-3xl text-center text-neutral-500">Không thể tải thông tin người dùng.</div>
        )}
      </div>
    </StudentLayout>
  );
}
