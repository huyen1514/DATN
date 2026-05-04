"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { api, resolveMediaUrl, uploadExamQuestionMedia } from "@/lib/api";
import { AlertTriangle, Loader2, Image as ImageIcon, Music, CheckCircle, Upload } from "lucide-react";

type ExamQuestion = {
  examQuestionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: number;
  section: number;
  mondaiNumber: number;
  passage?: string;
  instruction?: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
};

export default function ManageExamQuestionsPage() {
  const { examId } = useParams();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    if (examId) {
      fetchQuestions();
    }
  }, [examId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await api(`/exam-questions?examId=${examId}`);
      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        setError("Dữ liệu không hợp lệ.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMedia = async (file: File | null, questionId: number) => {
    if (!file) return;
    setUploadingId(questionId);
    try {
      const res = await uploadExamQuestionMedia(file, questionId);
      if (res.Url) {
        // Cập nhật lại UI
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.examQuestionId === questionId) {
              return {
                ...q,
                ...(res.Type === "audio" ? { audioUrl: res.Url } : { imageUrl: res.Url }),
              };
            }
            return q;
          })
        );
        alert("Upload thành công!");
      } else {
        alert(res.Message || "Upload thất bại.");
      }
    } catch (err: any) {
      alert("Lỗi upload: " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-jp-indigo flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl"><Upload size={24} /></div>
            Quản lý Media Câu hỏi (Đề #{examId})
          </h1>
          <p className="text-neutral-400 text-sm mt-2 font-medium">Bổ sung âm thanh và hình ảnh cho từng câu hỏi</p>
        </div>

        {error && (
          <div className="mb-8 p-5 rounded-3xl bg-red-50 border-2 border-red-100 text-red-700 flex items-center gap-4">
            <AlertTriangle size={24} />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-jp-indigo" size={40} />
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => (
              <div key={q.examQuestionId} className="bg-white border border-black/5 rounded-[2rem] p-6 shadow-xl shadow-black/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white bg-jp-indigo px-3 py-1 rounded-lg">
                        Phần {q.section}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-100 px-3 py-1 rounded-lg">
                        Mondai {q.mondaiNumber}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        ID: {q.examQuestionId}
                      </span>
                    </div>
                    {q.instruction && (
                      <p className="text-[11px] font-bold text-neutral-400 italic">HD: {q.instruction}</p>
                    )}
                    <h3 className="text-sm font-bold text-neutral-800">{q.question}</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                      {['A', 'B', 'C', 'D'].map((opt, idx) => {
                        const val = (q as any)[`option${opt}`];
                        if (!val) return null;
                        return (
                          <div key={opt} className={`text-[10px] p-2 rounded-lg ${q.correctAnswer === idx ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100' : 'bg-neutral-50 text-neutral-500'}`}>
                            {opt}. {val}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {/* Audio Upload */}
                    <div className="p-3 bg-neutral-50 border border-black/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600">
                          <Music size={14} className="text-violet-500" /> Âm thanh
                        </div>
                        {q.audioUrl && <CheckCircle size={14} className="text-emerald-500" />}
                      </div>
                      {q.audioUrl && (
                        <audio controls src={resolveMediaUrl(q.audioUrl)} className="h-8 w-full" />
                      )}
                      <label className={`block text-center cursor-pointer px-3 py-2 border border-dashed rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${uploadingId === q.examQuestionId ? 'bg-neutral-100 text-neutral-400 pointer-events-none' : 'border-violet-200 text-violet-600 hover:bg-violet-50'}`}>
                        {uploadingId === q.examQuestionId ? <Loader2 size={12} className="animate-spin inline mr-1" /> : <Upload size={12} className="inline mr-1" />}
                        {uploadingId === q.examQuestionId ? "Đang tải..." : "Tải MP3"}
                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleUploadMedia(e.target.files?.[0] || null, q.examQuestionId)} />
                      </label>
                    </div>

                    {/* Image Upload */}
                    <div className="p-3 bg-neutral-50 border border-black/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600">
                          <ImageIcon size={14} className="text-blue-500" /> Hình ảnh
                        </div>
                        {q.imageUrl && <CheckCircle size={14} className="text-emerald-500" />}
                      </div>
                      {q.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveMediaUrl(q.imageUrl)} alt="Preview" className="h-16 w-auto object-contain rounded-md" />
                      )}
                      <label className={`block text-center cursor-pointer px-3 py-2 border border-dashed rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${uploadingId === q.examQuestionId ? 'bg-neutral-100 text-neutral-400 pointer-events-none' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                        {uploadingId === q.examQuestionId ? <Loader2 size={12} className="animate-spin inline mr-1" /> : <Upload size={12} className="inline mr-1" />}
                        {uploadingId === q.examQuestionId ? "Đang tải..." : "Tải Ảnh"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadMedia(e.target.files?.[0] || null, q.examQuestionId)} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {questions.length === 0 && (
              <div className="text-center p-20 text-neutral-400 font-bold">Không có câu hỏi nào.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
