"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, XCircle, Clock, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

interface ExamResultView {
  examName?: string;
  score: number;
  totalQuestion: number;
  correctCount: number;
  isPassed: boolean;
  duration: number;
  passScaledTotal: number;
  passScaledVocabularyGrammar: number;
  passScaledReading: number;
  passScaledListening: number;
  passScaledVocabularyGrammarReading?: number | null;
  vocabularyGrammarScore: number;
  readingScore: number;
  listeningScore: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function ExamResultInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  const rid = searchParams.get("rid");

  const [result, setResult] = useState<ExamResultView | null>(null);

  useEffect(() => {
    let cancelled = false;

    function applySession() {
      const raw = sessionStorage.getItem("examResult");
      if (!raw) return false;
      try {
        const o = JSON.parse(raw);
        setResult({
          examName: o.examName,
          score: o.score,
          totalQuestion: o.totalQuestion,
          correctCount: o.correctCount,
          isPassed: o.isPassed,
          duration: o.duration,
          passScaledTotal: o.passScaledTotal ?? 90,
          passScaledVocabularyGrammar: o.passScaledVocabularyGrammar ?? 0,
          passScaledReading: o.passScaledReading ?? 0,
          passScaledListening: o.passScaledListening ?? 0,
          passScaledVocabularyGrammarReading: o.passScaledVocabularyGrammarReading ?? null,
          vocabularyGrammarScore: o.vocabularyGrammarScore ?? 0,
          readingScore: o.readingScore ?? 0,
          listeningScore: o.listeningScore ?? 0,
        });
        return true;
      } catch {
        return false;
      }
    }

    async function load() {
      if (rid) {
        const data = await api(`/exam-results/${rid}`);
        if (cancelled) return;
        if (data?.examResultId != null && data.exam) {
          setResult({
            examName: data.exam.examName,
            score: Number(data.score),
            totalQuestion: data.totalQuestion,
            correctCount: data.amountCorrectAnswers,
            isPassed: !!data.isPassed,
            duration: data.duration,
            passScaledTotal: data.exam.passScaledTotal ?? 90,
            passScaledVocabularyGrammar: data.exam.passScaledVocabularyGrammar ?? 0,
            passScaledReading: data.exam.passScaledReading ?? 0,
            passScaledListening: data.exam.passScaledListening ?? 0,
            passScaledVocabularyGrammarReading: data.exam.passScaledVocabularyGrammarReading ?? null,
            vocabularyGrammarScore: Number(data.vocabularyGrammarScore ?? 0),
            readingScore: Number(data.readingScore ?? 0),
            listeningScore: Number(data.listeningScore ?? 0),
          });
          return;
        }
        if (!applySession()) router.push("/exams");
        return;
      }

      if (!applySession()) router.push("/exams");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [rid, router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-jp-washi flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-jp-indigo/20 border-t-jp-indigo rounded-full mx-auto mb-4" />
          <p className="text-sm text-neutral-500">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const wrongCount = result.totalQuestion - result.correctCount;
  const scoreProgress = clamp(result.score / 180, 0, 1);
  const circumference = 2 * Math.PI * 52;
  const dash = scoreProgress * circumference;

  return (
    <div className="min-h-screen bg-jp-washi flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`p-8 text-center text-white ${result.isPassed ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-700"}`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {result.isPassed ? <Trophy size={40} /> : <XCircle size={40} />}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {result.isPassed ? "Chúc mừng!" : "Chưa đạt"}
            </h1>
            <p className="text-white/70">
              {result.examName || "Kết quả bài thi"}
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={result.isPassed ? "#10b981" : "#ef4444"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-jp-indigo leading-none">{result.score}</span>
                  <span className="text-xs font-medium text-neutral-400 mt-1">/ 180</span>
                </div>
              </div>
              <p className="text-neutral-500 text-sm">
                Ngưỡng đạt: <span className="font-bold text-jp-indigo">{result.passScaledTotal}</span> điểm (thang 180)
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {result.passScaledVocabularyGrammarReading != null ? (
                <>
                  <div className="bg-violet-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-violet-700">Từ vựng + Ngữ pháp + Đọc</span>
                    <span className="text-sm font-bold text-violet-800">
                      {result.vocabularyGrammarScore} / 120 (đạt {result.passScaledVocabularyGrammarReading})
                    </span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-700">Nghe hiểu</span>
                    <span className="text-sm font-bold text-amber-800">
                      {result.listeningScore} / 60 (đạt {result.passScaledListening})
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-violet-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-violet-700">Từ vựng + Ngữ pháp</span>
                    <span className="text-sm font-bold text-violet-800">
                      {result.vocabularyGrammarScore} / 60 (đạt {result.passScaledVocabularyGrammar})
                    </span>
                  </div>
                  <div className="bg-cyan-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-cyan-700">Đọc hiểu</span>
                    <span className="text-sm font-bold text-cyan-800">
                      {result.readingScore} / 60 (đạt {result.passScaledReading})
                    </span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-700">Nghe hiểu</span>
                    <span className="text-sm font-bold text-amber-800">
                      {result.listeningScore} / 60 (đạt {result.passScaledListening})
                    </span>
                  </div>
                </>
              )}
            </div>

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

            <div className={`p-4 rounded-2xl text-center mb-6 ${result.isPassed ? "bg-emerald-50" : "bg-red-50"}`}>
              <p className={`font-bold text-lg ${result.isPassed ? "text-emerald-700" : "text-red-600"}`}>
                {result.isPassed
                  ? "Đạt yêu cầu theo ngưỡng đề thi."
                  : `Chưa đạt — cần tổng ${result.passScaledTotal} và qua ngưỡng từng phần.`}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {result.correctCount} / {result.totalQuestion} câu đúng · {formatDuration(result.duration)}
              </p>
            </div>

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

export default function ExamResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-jp-washi flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-jp-indigo/20 border-t-jp-indigo rounded-full" />
        </div>
      }
    >
      <ExamResultInner />
    </Suspense>
  );
}
