"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, XCircle, Clock, CheckCircle2, ArrowRight, RotateCcw, BarChart3, Target, Layout, BookOpen, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import QuestionReview from "@/components/QuestionReview";
import StudentLayout from "@/components/StudentLayout";

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
  answers?: Record<string, string | number>;
  questions?: Array<any>;
}

function clamp(n: number, min: number, max: number) {
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// Logic kiểm tra đậu/rớt chuẩn JLPT bao phủ từ N5 đến N1
function checkIsPassed(scores: {
  score: number;
  passScaledTotal: number;
  passScaledVocabularyGrammarReading: number | null;
  passScaledVocabularyGrammar: number;
  passScaledReading: number;
  passScaledListening: number;
  vocabularyGrammarScore: number;
  readingScore: number;
  listeningScore: number;
}): boolean {
  // 1. Phải đạt tổng điểm tối thiểu
  if (scores.score < scores.passScaledTotal) return false;

  // Xác định xem bài thi là N1,N2,N3 (tách 3 kỹ năng) hay N4,N5 (gộp 2 kỹ năng)
  const isSeparatedSkills = !scores.passScaledVocabularyGrammarReading || scores.passScaledVocabularyGrammarReading === 0;

  // 2. Kiểm tra điểm liệt từng thành phần
  if (isSeparatedSkills) {
    if (scores.vocabularyGrammarScore < scores.passScaledVocabularyGrammar) return false;
    if (scores.readingScore < scores.passScaledReading) return false;
    if (scores.listeningScore < scores.passScaledListening) return false;
  } else {
    if (scores.vocabularyGrammarScore < (scores.passScaledVocabularyGrammarReading as number)) return false;
    if (scores.listeningScore < scores.passScaledListening) return false;
  }

  return true;
}

function ExamResultInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  const rid = searchParams.get("rid");

  const [result, setResult] = useState<ExamResultView | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "review">("summary");

  useEffect(() => {
    let cancelled = false;

    function applySession() {
      const raw = sessionStorage.getItem("examResult");
      if (!raw) return false;
      try {
        const o = JSON.parse(raw);

        const passInfo = {
          score: Number(o.score) || 0,
          passScaledTotal: o.passScaledTotal ?? 90,
          passScaledVocabularyGrammarReading: o.passScaledVocabularyGrammarReading ?? null,
          passScaledVocabularyGrammar: o.passScaledVocabularyGrammar ?? 0,
          passScaledReading: o.passScaledReading ?? 0,
          passScaledListening: o.passScaledListening ?? 0,
          vocabularyGrammarScore: Number(o.vocabularyGrammarScore) || 0,
          readingScore: Number(o.readingScore) || 0,
          listeningScore: Number(o.listeningScore) || 0,
        };

        setResult({
          examName: o.examName,
          totalQuestion: Number(o.totalQuestion) || 0,
          correctCount: Number(o.correctCount) || 0,
          duration: Number(o.duration) || 0,
          answers: o.answers ?? {},
          questions: o.questions ?? [],
          isPassed: checkIsPassed(passInfo),
          ...passInfo
        });
        return true;
      } catch { return false; }
    }

    async function load() {
      if (rid) {
        try {
          // Gọi trực tiếp hàm api() thay vì api.get()
          const data = await api(`/exam-results/${rid}`);
          if (cancelled) return;

          if (data && data.exam) {
            const passInfo = {
              score: Number(data.totalScore) || 0,
              passScaledTotal: data.exam.passScaledTotal ?? 90,
              passScaledVocabularyGrammarReading: data.exam.passScaledVocabularyGrammarReading ?? null,
              passScaledVocabularyGrammar: data.exam.passScaledVocabularyGrammar ?? 0,
              passScaledReading: data.exam.passScaledReading ?? 0,
              passScaledListening: data.exam.passScaledListening ?? 0,
              vocabularyGrammarScore: Number(data.vocabGrammarScore) || 0,
              readingScore: Number(data.readingScore) || 0,
              listeningScore: Number(data.listeningScore) || 0,
            };

            setResult({
              examName: data.exam.examName,
              totalQuestion: Number(data.totalQuestion) || 0,
              correctCount: Number(data.amountCorrectAnswers) || 0,
              duration: Number(data.duration) || 0,
              // Cập nhật: Không để trống answers và questions
              answers: data.answers || {},
              questions: data.questions || [],
              isPassed: checkIsPassed(passInfo),
              ...passInfo
            });
            return;
          }
        } catch (e) {
          console.error("Error loading exam results:", e);
        }
      }
      if (!applySession()) router.push("/exams");
    }

    load();
    return () => { cancelled = true; };
  }, [rid, router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-jp-indigo/10 border-t-jp-indigo rounded-full mx-auto mb-6" />
          <p className="text-xs font-black text-jp-indigo tracking-widest uppercase">Đang phân tích kết quả...</p>
        </div>
      </div>
    );
  }

  const wrongCount = (Number(result.totalQuestion) || 0) - (Number(result.correctCount) || 0);
  const scoreProgress = clamp((Number(result.score) || 0) / 180, 0, 1);
  const circumference = 2 * Math.PI * 52;
  const dash = (scoreProgress || 0) * circumference;

  const isN1N2N3 = !result.passScaledVocabularyGrammarReading || result.passScaledVocabularyGrammarReading === 0;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto py-10 px-4">

        {/* Header Section */}
        <div className={`rounded-[3rem] shadow-2xl overflow-hidden mb-12 relative ${result.isPassed ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-jp-red to-[#8b0021]"}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl" />

          <div className="relative z-10 p-12 text-center text-white">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-md shadow-xl border ${result.isPassed ? "bg-white/20 border-white/20" : "bg-black/20 border-black/10"}`}>
              {result.isPassed ? <Trophy size={48} className="animate-bounce text-yellow-300" /> : <AlertCircle size={48} className="text-white/90" />}
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              {result.isPassed ? "Chúc mừng!" : "Rất tiếc, bạn chưa Pass"}
            </h1>
            <p className="text-white/80 font-bold text-lg max-w-md mx-auto leading-relaxed">
              {result.examName || "Bài thi năng lực tiếng Nhật"}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
              ${activeTab === "summary" ? "bg-jp-indigo text-white shadow-xl shadow-jp-indigo/20 scale-105" : "bg-white text-neutral-400 hover:text-jp-indigo"}
            `}
          >
            <BarChart3 size={16} /> Tổng quan điểm số
          </button>
          <button
            onClick={() => setActiveTab("review")}
            disabled={!result.questions || result.questions.length === 0}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed
              ${activeTab === "review" ? "bg-jp-indigo text-white shadow-xl shadow-jp-indigo/20 scale-105" : "bg-white text-neutral-400 hover:text-jp-indigo"}
            `}
          >
            <Layout size={16} /> Xem lại bài làm
          </button>
        </div>

        {activeTab === "summary" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Main Score Circle */}
              <div className="lg:col-span-5 bg-white rounded-[3rem] p-10 border border-black/5 shadow-sm text-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-8">Điểm tổng quát</h3>
                <div className="relative w-48 h-48 mx-auto mb-8 group">
                  <div className="absolute inset-0 bg-neutral-50 rounded-full scale-110 -z-10 group-hover:scale-125 transition-transform duration-700" />
                  <svg className="w-full h-full -rotate-90 filter drop-shadow-lg" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={result.isPassed ? "#10b981" : "#bc002d"}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${dash} ${circumference}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-jp-indigo leading-none">
                      {/* Fix NaN display */}
                      {isNaN(result.score) ? 0 : result.score}
                    </span>
                    <span className="text-xs font-bold text-neutral-300 mt-2">THANG 180</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-xl border border-black/5">
                  <Target size={14} className="text-jp-indigo" />
                  <span className="text-xs font-bold text-neutral-500">Mục tiêu đạt: <span className="text-jp-indigo font-black">{result.passScaledTotal || 0}</span></span>
                </div>
              </div>

              {/* Section Details */}
              <div className="lg:col-span-7 space-y-4">
                {isN1N2N3 ? (
                  <>
                    {[
                      { label: "Kiến thức ngôn ngữ (Từ vựng/Ngữ pháp)", score: result.vocabularyGrammarScore || 0, pass: result.passScaledVocabularyGrammar || 0, color: "bg-blue-500", icon: BookOpen },
                      { label: "Đọc hiểu", score: result.readingScore || 0, pass: result.passScaledReading || 0, color: "bg-emerald-500", icon: BarChart3 },
                      { label: "Nghe hiểu", score: result.listeningScore || 0, pass: result.passScaledListening || 0, color: "bg-orange-500", icon: Target }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex items-center gap-6 relative overflow-hidden">
                        {s.score < s.pass && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />}
                        <div className={`w-14 h-14 rounded-2xl ${s.color.replace("bg-", "bg-")}/10 ${s.color.replace("bg-", "text-")} flex items-center justify-center shrink-0`}>
                          <s.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{s.label}</span>
                            <span className={`text-sm font-black ${s.score < s.pass ? "text-red-500" : "text-jp-indigo"}`}>{s.score} / 60</span>
                          </div>
                          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div className={`h-full ${s.score < s.pass ? "bg-red-500" : s.color} rounded-full`} style={{ width: `${(s.score / 60) * 100}%` }} />
                          </div>
                          <p className="text-[10px] font-bold text-neutral-400 mt-2">
                            Ngưỡng liệt: {s.pass} điểm {s.score < s.pass && <span className="text-red-500 ml-1">(Bị điểm liệt)</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex items-center gap-6 relative overflow-hidden">
                      {(result.vocabularyGrammarScore || 0) < ((result.passScaledVocabularyGrammarReading as number) || 0) && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />}
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <BookOpen size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Từ vựng + Ngữ pháp + Đọc</span>
                          <span className={`text-sm font-black ${(result.vocabularyGrammarScore || 0) < ((result.passScaledVocabularyGrammarReading as number) || 0) ? "text-red-500" : "text-jp-indigo"}`}>{result.vocabularyGrammarScore || 0} / 120</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full ${(result.vocabularyGrammarScore || 0) < ((result.passScaledVocabularyGrammarReading as number) || 0) ? "bg-red-500" : "bg-blue-500"} rounded-full`} style={{ width: `${((result.vocabularyGrammarScore || 0) / 120) * 100}%` }} />
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 mt-2">
                          Ngưỡng liệt: {result.passScaledVocabularyGrammarReading || 0} điểm
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex items-center gap-6 relative overflow-hidden">
                      {(result.listeningScore || 0) < (result.passScaledListening || 0) && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />}
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <Target size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Nghe hiểu</span>
                          <span className={`text-sm font-black ${(result.listeningScore || 0) < (result.passScaledListening || 0) ? "text-red-500" : "text-jp-indigo"}`}>{result.listeningScore || 0} / 60</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full ${(result.listeningScore || 0) < (result.passScaledListening || 0) ? "bg-red-500" : "bg-orange-500"} rounded-full`} style={{ width: `${((result.listeningScore || 0) / 60) * 100}%` }} />
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 mt-2">
                          Ngưỡng liệt: {result.passScaledListening || 0} điểm
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              {[
                { label: "Câu đúng", value: result.correctCount || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Câu sai", value: wrongCount || 0, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
                { label: "Thời gian", value: `${Math.floor((result.duration || 0) / 60)}p`, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Độ chính xác", value: `${(result.totalQuestion || 0) > 0 ? Math.round(((result.correctCount || 0) / result.totalQuestion) * 100) : 0}%`, icon: Target, color: "text-jp-indigo", bg: "bg-neutral-50" }
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-[2rem] p-6 text-center border border-black/5`}>
                  <s.icon size={20} className={`${s.color} mx-auto mb-3`} />
                  <div className={`text-2xl font-black ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4 text-jp-indigo">
                <div className="bg-jp-indigo text-white p-2 rounded-xl"><Layout size={20} /></div>
                <h3 className="text-lg font-black uppercase tracking-tight">Chi tiết bài làm</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Đúng</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Sai</span></div>
              </div>
            </div>

            {result.questions?.map((q, idx) => {
              const rawAns = result.answers?.[q.examQuestionId];
              let userAnsIdx: number | undefined;
              if (typeof rawAns === "number") userAnsIdx = rawAns;
              else if (typeof rawAns === "string") userAnsIdx = parseInt(rawAns);

              return (
                <QuestionReview
                  key={q.examQuestionId}
                  question={q}
                  userAnswer={userAnsIdx}
                  index={idx}
                />
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-16 max-w-md mx-auto">
          <button
            onClick={() => router.push(`/exams/${examId}`)}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border-2 border-black/5 text-neutral-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 hover:text-jp-indigo hover:border-jp-indigo/20 transition-all shadow-sm"
          >
            <RotateCcw size={16} /> Thi lại đề này
          </button>
          <Link href="/exams" className="flex-1 flex items-center justify-center gap-3 py-4 bg-jp-indigo text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-jp-indigo/20 hover:scale-105 transition-all shadow-lg shadow-jp-indigo/10">
            Trở về danh sách <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-jp-indigo/10 border-t-jp-indigo rounded-full" />
        </div>
      }
    >
      <ExamResultInner />
    </Suspense>
  );
}