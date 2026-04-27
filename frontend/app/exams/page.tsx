"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { ClipboardList, Clock, GraduationCap, Play, Lock, Unlock, Loader2, Search, BarChart3, Star, CheckCircle } from "lucide-react";
import ExamPaymentModal from "@/components/ExamPaymentModal";

interface Exam {
  examId: number;
  examName: string;
  duration: number;
  levelId: number;
  price: number;
  level?: { levelId: number; levelName: string };
}

interface Level { levelId: number; levelName: string; }

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [userExams, setUserExams] = useState<number[]>([]);
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
      const data = await api(`/user-exams?userId=${userId}`);
      if (Array.isArray(data)) {
        setUserExams(data.map((ue: any) => ue.examId));
      }
    } catch (e) { console.error(e); }
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
      if (Array.isArray(eData)) setExams(eData);
      if (Array.isArray(lData)) {
        setLevels(lData);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const levelQuery = params.get("level");
          if (levelQuery) {
            const matchedLvl = lData.find(l => l.levelName.toLowerCase() === levelQuery.toLowerCase());
            if (matchedLvl) setFilterLevel(matchedLvl.levelId);
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const filtered = exams.filter(e => {
    const matchesLevel = filterLevel === "all" || e.levelId === filterLevel;
    const matchesSearch = e.examName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const stats = {
    total: exams.length,
    purchased: userExams.length,
    n5: exams.filter(e => e.levelId === levels.find(l => l.levelName === "N5")?.levelId).length,
    n4: exams.filter(e => e.levelId === levels.find(l => l.levelName === "N4")?.levelId).length,
  };

  const renderExamCard = (exam: Exam) => {
    const isUnlocked = currentUser?.role === "Admin" || userExams.includes(exam.examId);
    return (
      <div key={exam.examId} className="group relative bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden flex flex-col h-full">
        {/* Card Header Background */}
        <div className={`h-24 w-full transition-colors duration-500 ${isUnlocked ? "bg-gradient-to-br from-jp-indigo/5 to-jp-red/5" : "bg-neutral-50"}`}>
           {!isUnlocked && (
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl text-neutral-400 shadow-sm border border-black/5">
              <Lock size={18} />
            </div>
          )}
          {isUnlocked && (
             <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-500/30">
               <CheckCircle size={18} />
             </div>
          )}
        </div>

        <div className="p-8 pt-0 -mt-10 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
             <div className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-widest shadow-sm ${isUnlocked ? "bg-jp-indigo text-white" : "bg-neutral-200 text-neutral-500"}`}>
               {exam.level?.levelName || `JLPT`}
             </div>
             <div className="px-4 py-1.5 rounded-xl bg-white border border-black/5 text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 shadow-sm">
               <Clock size={12} /> {exam.duration} PHÚT
             </div>
          </div>

          <h3 className={`text-xl font-black mb-3 leading-tight transition-colors ${isUnlocked ? "text-jp-indigo group-hover:text-jp-red" : "text-neutral-500"}`}>
            {exam.examName}
          </h3>
          
          <p className="text-neutral-400 text-sm mb-6 line-clamp-2 font-medium">
             Đề thi bao gồm các phần thi: Từ vựng, Ngữ pháp, Đọc hiểu và Nghe hiểu theo cấu trúc JLPT mới nhất.
          </p>

          <div className="mt-auto pt-6 border-t border-black/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Giá sở hữu</span>
              <span className={`text-lg font-black ${isUnlocked ? "text-emerald-600" : "text-jp-indigo"}`}>
                {isUnlocked ? "ĐÃ MỞ KHÓA" : `${(exam.price || 50000).toLocaleString("vi-VN")}đ`}
              </span>
            </div>
            
            {isUnlocked ? (
              <Link
                href={`/exams/${exam.examId}`}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-jp-indigo to-jp-red text-white rounded-2xl font-black text-xs hover:shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
              >
                <Play size={14} fill="currentColor" /> Thi ngay
              </Link>
            ) : (
              <button
                onClick={() => handleUnlock(exam)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-jp-indigo/10 text-jp-indigo rounded-2xl font-black text-xs hover:bg-jp-indigo hover:text-white hover:border-jp-indigo transition-all uppercase tracking-widest"
              >
                <Unlock size={14} /> Mua đề
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Hero Section */}
        <div className="relative mb-16 pt-8 pb-12 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-jp-indigo/[0.02] to-jp-red/[0.02] rounded-[3rem] -z-10 border border-black/5" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-jp-red/10 text-jp-red rounded-full text-xs font-black tracking-widest mb-6 border border-jp-red/10 animate-pulse">
                <Star size={14} fill="currentColor" /> HỆ THỐNG LUYỆN THI CHUẨN JLPT
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-jp-indigo mb-6 leading-tight">
                Chinh Phục JLPT <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-jp-indigo to-jp-red">Thật Dễ Dàng.</span>
              </h1>
              <p className="text-neutral-500 text-lg font-medium leading-relaxed mb-8">
                Hệ thống đề thi đa dạng, sát với thực tế, giúp bạn làm quen với cấu trúc và áp lực phòng thi thật.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-md group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-jp-indigo transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tên đề thi..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-black/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-jp-indigo focus:shadow-xl focus:shadow-jp-indigo/5 transition-all font-medium text-jp-indigo"
                />
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-sm">
               {[
                 { label: "Tổng số đề", value: stats.total, icon: ClipboardList, color: "bg-jp-indigo" },
                 { label: "Đã sở hữu", value: stats.purchased, icon: CheckCircle, color: "bg-emerald-500" },
                 { label: "Đề thi N5", value: stats.n5, icon: GraduationCap, color: "bg-orange-500" },
                 { label: "Đề thi N4", value: stats.n4, icon: GraduationCap, color: "bg-blue-500" }
               ].map((s, i) => (
                 <div key={i} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`${s.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-black/5`}>
                      <s.icon size={20} />
                    </div>
                    <div className="text-2xl font-black text-jp-indigo leading-none mb-1">{s.value}</div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{s.label}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Level Filter */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-4 gap-4 no-scrollbar">
          <div className="flex gap-3">
            <button 
              onClick={() => setFilterLevel("all")}
              className={`px-6 py-3.5 rounded-2xl text-xs font-black tracking-widest transition-all whitespace-nowrap shadow-sm border-2 ${filterLevel === "all" ? "bg-jp-indigo border-jp-indigo text-white shadow-xl shadow-jp-indigo/20 scale-105" : "bg-white border-black/5 text-neutral-400 hover:border-jp-indigo/20 hover:text-jp-indigo"}`}>
              TẤT CẢ TRÌNH ĐỘ
            </button>
            {levels.map(l => (
              <button 
                key={l.levelId} 
                onClick={() => setFilterLevel(l.levelId)}
                className={`px-6 py-3.5 rounded-2xl text-xs font-black tracking-widest transition-all whitespace-nowrap shadow-sm border-2 ${filterLevel === l.levelId ? "bg-jp-indigo border-jp-indigo text-white shadow-xl shadow-jp-indigo/20 scale-105" : "bg-white border-black/5 text-neutral-400 hover:border-jp-indigo/20 hover:text-jp-indigo"}`}>
                JLPT {l.levelName}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold whitespace-nowrap bg-neutral-50 px-4 py-2 rounded-xl border border-black/5">
             <BarChart3 size={14} /> Hiển thị {filtered.length} đề thi
          </div>
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-white border border-black/5 rounded-[2rem] animate-pulse relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-neutral-50" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white py-24 rounded-[3rem] border border-black/5 text-center shadow-sm">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-black/5">
              <ClipboardList size={40} className="text-neutral-200" />
            </div>
            <h3 className="text-2xl font-black text-jp-indigo mb-3">Không tìm thấy đề thi</h3>
            <p className="text-neutral-400 font-medium max-w-sm mx-auto">
              Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn trình độ khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
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
