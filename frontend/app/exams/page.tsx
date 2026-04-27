"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { ClipboardList, Clock, Search, Lock, Unlock, Play, CheckCircle, BookMarked } from "lucide-react";
import ExamPaymentModal from "@/components/ExamPaymentModal";

interface Exam {
  examId: number;
  examName: string;
  duration: number;
  levelName: string;
  price: number;
  isActive: boolean;
  totalQuestions: number;
  createdAt: string;
}

interface Level { levelId: number; levelName: string; }

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [userExams, setUserExams] = useState<number[]>([]);
  const [bookmarkedExams, setBookmarkedExams] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<{ userId: number; role?: string } | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    loadData();
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      loadUserExams(u.userId);
    }
  }, []);

  const loadUserExams = async (userId: number) => {
    try {
      const [res, bookmarksRes] = await Promise.all([
        api(`/user-exams?userId=${userId}`),
        api(`/bookmark/${userId}`)
      ]);
      const data = Array.isArray(res) ? res : (res?.data || res?.Data || []);
      if (Array.isArray(data)) {
        setUserExams(data.map((ue: any) => ue.examId));
      }
      if (Array.isArray(bookmarksRes)) {
        setBookmarkedExams(
          bookmarksRes.filter((b: any) => b.type === "Exam").map((b: any) => b.itemId)
        );
      }
    } catch (e) { console.error(e); }
  };

  const toggleBookmark = async (e: React.MouseEvent, examId: number) => {
    e.preventDefault();
    if (!currentUser) return alert("Vui lòng đăng nhập để lưu đề thi!");
    try {
      await api("/bookmark/toggle", "POST", {
        userId: currentUser.userId,
        itemId: examId,
        type: "Exam"
      });
      setBookmarkedExams(prev => 
        prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
      );
    } catch (e) { console.error("Toggle bookmark failed", e); }
  };


  const handleUnlock = (exam: Exam) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để mở khoá đề thi!");
      return;
    }
    setSelectedExam(exam);
  };

  const loadData = async () => {
    try {
      const [eData, lData] = await Promise.all([api("/exams"), api("/levels")]);
      const examList = Array.isArray(eData) ? eData : (eData?.data || eData?.Data || []);
      setExams(examList);

      const levelList = Array.isArray(lData) ? lData : (lData?.data || lData?.Data || []);
      if (Array.isArray(levelList)) {
        setLevels(levelList);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const levelQuery = params.get("level");
          if (levelQuery) {
            const matchedLvl = levelList.find((l: any) => l.levelName.toLowerCase() === levelQuery.toLowerCase());
            if (matchedLvl) setFilterLevel(matchedLvl.levelId);
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const filtered = exams.filter(e => {
    const matchesLevel = filterLevel === "all" || e.levelName === filterLevel;
    const matchesSearch = e.examName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const renderExamCard = (exam: Exam) => {
    const isUnlocked = currentUser?.role === "Admin" || userExams.includes(exam.examId);
    const isBookmarked = bookmarkedExams.includes(exam.examId);
    return (
      <div key={exam.examId} className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all flex flex-col h-full overflow-hidden">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                {exam.levelName || `JLPT`}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Clock size={14} /> {exam.duration} phút
              </span>
            </div>
            <div>
              <button 
                onClick={(e) => toggleBookmark(e, exam.examId)} 
                className={`mr-3 hover:scale-110 transition-transform ${isBookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                title={isBookmarked ? "Bỏ lưu" : "Lưu đề thi"}
              >
                <BookMarked size={20} fill={isBookmarked ? "currentColor" : "none"} className="inline-block" />
              </button>
              {isUnlocked ? (
                <CheckCircle size={20} className="text-green-500 inline-block" />
              ) : (
                <Lock size={18} className="text-gray-400 inline-block" />
              )}
            </div>

          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
            {exam.examName}
          </h3>

          <p className="text-sm text-gray-500 mb-6 flex-1">
            Đề thi bao gồm các phần thi: Từ vựng, Ngữ pháp, Đọc hiểu và Nghe hiểu theo cấu trúc JLPT mới nhất.
          </p>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Giá bán</span>
              <span className={`text-base font-bold ${isUnlocked ? "text-green-600" : "text-gray-900"}`}>
                {isUnlocked ? "Đã sở hữu" : `${(exam.price || 50000).toLocaleString("vi-VN")}đ`}
              </span>
            </div>

            {isUnlocked ? (
              <Link
                href={`/exams/${exam.examId}`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                <Play size={16} fill="currentColor" /> Bắt đầu thi
              </Link>
            ) : (
              <button
                onClick={() => handleUnlock(exam)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                <Unlock size={16} /> Mua đề
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Danh sách đề thi
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Hệ thống đề thi trắc nghiệm được biên soạn bám sát cấu trúc đề thi JLPT thực tế.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-gray-200 pb-6">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setFilterLevel("all")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${filterLevel === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              Tất cả
            </button>
            {levels.map(l => (
              <button
                key={l.levelId}
                onClick={() => setFilterLevel(l.levelName)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${filterLevel === l.levelName ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                JLPT {l.levelName}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tên đề thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Hiển thị {filtered.length} kết quả
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy đề thi</h3>
            <p className="text-gray-500 text-sm">
              Thử thay đổi từ khóa hoặc bộ lọc trình độ để xem thêm kết quả.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filtered.map(exam => renderExamCard(exam))}
          </div>
        )}
      </div>

      <ExamPaymentModal
        exam={selectedExam}
        isOpen={selectedExam !== null}
        onClose={() => setSelectedExam(null)}
        onSuccess={() => {
          if (currentUser) loadUserExams(currentUser.userId);
        }}
        currentUser={currentUser}
      />
    </StudentLayout>
  );
}