"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, XCircle, Clock, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

interface ExamResult {
  examName?: string;
  score: number;
  totalQuestion: number;
  correctCount: number;
  isPassed: boolean;
  duration: number;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("examResult");
    if (data) {
      try {
        setResult(JSON.parse(data));
      } catch (e) {
        router.push("/exams");
      }
    } else {
      router.push("/exams");
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-jp-washi flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-jp-indigo/20 border-t-jp-indigo rounded-full" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const wrongCount = result.totalQuestion - result.correctCount;

  return (
    <div className="min-h-screen bg-jp-washi flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Result Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-8 text-center text-white ${result.isPassed ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-700"}`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {result.isPassed ? <Trophy size={40} /> : <XCircle size={40} />}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {result.isPassed ? "Chúc mừng! 🎉" : "Chưa đạt 😢"}
            </h1>
            <p className="text-white/70">
              {result.examName || "Kết quả bài thi"}
            </p>
          </div>

          {/* Score */}
          <div className="p-8">
            {/* Big Score */}
            <div className="text-center mb-8">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke={result.isPassed ? "#10b981" : "#ef4444"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 327} 327`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-jp-indigo">{result.score}</span>
                </div>
              </div>
              <p className="text-neutral-500 text-sm">Điểm số (trên 100)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                <CheckCircle2 size={20} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">{result.correctCount}</p>
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-wider">Đúng</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <XCircle size={20} className="text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
                <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-wider">Sai</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <Clock size={20} className="text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-600">{Math.floor(result.duration / 60)}p</p>
                <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-wider">Thời gian</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`p-4 rounded-2xl text-center mb-6 ${result.isPassed ? "bg-emerald-50" : "bg-red-50"}`}>
              <p className={`font-bold text-lg ${result.isPassed ? "text-emerald-700" : "text-red-600"}`}>
                {result.isPassed ? "✅ ĐẠT - Bạn đã vượt qua bài thi!" : "❌ CHƯA ĐẠT - Cần 60% để đạt"}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {result.correctCount} / {result.totalQuestion} câu đúng • Thời gian: {formatDuration(result.duration)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link href={`/exams/${examId}`} className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-neutral-200 text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors">
                <RotateCcw size={16} /> Thi lại
              </Link>
              <Link href="/exams" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red transition-colors">
                Danh sách đề <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
