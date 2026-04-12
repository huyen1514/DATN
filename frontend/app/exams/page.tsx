"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { ClipboardList, Clock, GraduationCap, Play } from "lucide-react";

interface Exam {
  examId: number;
  examName: string;
  duration: number;
  levelId: number;
  level?: { levelId: number; levelName: string };
}

interface Level { levelId: number; levelName: string; }

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [eData, lData] = await Promise.all([api("/exams"), api("/levels")]);
      if (Array.isArray(eData)) setExams(eData);
      if (Array.isArray(lData)) setLevels(lData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const filtered = exams.filter(e => filterLevel === "all" || e.levelId === filterLevel);

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <ClipboardList size={28} className="text-orange-500" />
            Luyện Thi JLPT
          </h1>
          <p className="text-neutral-500 font-light">Chọn đề thi để luyện tập. Đề thi được thiết kế theo chuẩn JLPT.</p>
        </div>

        {/* Level Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setFilterLevel("all")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filterLevel === "all" ? "bg-jp-indigo text-white shadow-lg" : "bg-white border border-black/5 text-neutral-500 hover:bg-neutral-50"}`}>
            Tất cả
          </button>
          {levels.map(l => (
            <button key={l.levelId} onClick={() => setFilterLevel(l.levelId)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filterLevel === l.levelId ? "bg-jp-indigo text-white shadow-lg" : "bg-white border border-black/5 text-neutral-500 hover:bg-neutral-50"}`}>
              {l.levelName}
            </button>
          ))}
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white/50 border border-black/5 rounded-3xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <ClipboardList size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có đề thi nào</h3>
            <p className="text-neutral-500">Đề thi đang được cập nhật.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(exam => (
              <div key={exam.examId} className="group bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold bg-violet-50 text-violet-600 px-3 py-1 rounded-full flex items-center gap-1">
                      <GraduationCap size={12} /> {exam.level?.levelName || `Level ${exam.levelId}`}
                    </span>
                    <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                      <Clock size={12} /> {exam.duration} phút
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-jp-indigo mb-4 group-hover:text-jp-red transition-colors">
                    {exam.examName}
                  </h3>

                  <Link
                    href={`/exams/${exam.examId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-jp-indigo to-jp-red text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                  >
                    <Play size={16} /> Bắt đầu thi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
