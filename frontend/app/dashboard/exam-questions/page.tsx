"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { HelpCircle, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Exam { examId: number; examName: string; }
interface ExamQuestion {
  examQuestionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number;
  audioUrl?: string;
  examId: number;
  userId: number;
  exam?: Exam;
}

export default function AdminExamQuestions() {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: 0, audioUrl: "", examId: 0, userId: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [qData, eData] = await Promise.all([api("/exam-questions"), api("/exams")]);
      if (Array.isArray(qData)) setQuestions(qData);
      if (Array.isArray(eData)) setExams(eData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const getAnswerLabel = (val: number) => {
    const labels = ["A", "B", "C", "D"];
    return labels[val] || val;
  };

  const openCreate = () => {
    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).userId : 1;
    setModalMode("create");
    setForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: 0, audioUrl: "", examId: exams[0]?.examId || 0, userId });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (q: ExamQuestion) => {
    setModalMode("edit");
    setForm({ question: q.question, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, correctAnswer: q.correctAnswer, audioUrl: q.audioUrl || "", examId: q.examId, userId: q.userId });
    setEditId(q.examQuestionId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { setError("Vui lòng nhập câu hỏi"); return; }
    setIsSaving(true); setError("");
    try {
      const res = modalMode === "create" ? await api("/exam-questions", "POST", form) : await api(`/exam-questions/${editId}`, "PUT", form);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    await api(`/exam-questions/${id}`, "DELETE"); loadData();
  };

  const filtered = questions.filter(q => {
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase());
    const matchExam = filterExam === "all" || q.examId === filterExam;
    return matchSearch && matchExam;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <HelpCircle size={24} className="text-purple-600" /> Quản Lý Câu Hỏi Thi
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý câu hỏi trắc nghiệm cho đề thi</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm câu hỏi
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm câu hỏi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterExam} onChange={(e) => setFilterExam(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]">
            <option value="all">Tất cả đề thi</option>
            {exams.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><HelpCircle size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có câu hỏi nào</p></div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map((q, idx) => (
                <div key={q.examQuestionId} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full">{q.exam?.examName || `Đề ${q.examId}`}</span>
                        <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">Đáp án: {getAnswerLabel(q.correctAnswer)}</span>
                      </div>
                      <p className="text-sm font-bold text-jp-indigo mb-3">Câu {idx + 1}: {q.question}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                        <span className={q.correctAnswer === 0 ? "text-green-600 font-bold" : ""}>A. {q.optionA}</span>
                        <span className={q.correctAnswer === 1 ? "text-green-600 font-bold" : ""}>B. {q.optionB}</span>
                        <span className={q.correctAnswer === 2 ? "text-green-600 font-bold" : ""}>C. {q.optionC}</span>
                        <span className={q.correctAnswer === 3 ? "text-green-600 font-bold" : ""}>D. {q.optionD}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => openEdit(q)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(q.examQuestionId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Câu Hỏi" : "Sửa Câu Hỏi"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đề thi *</label>
                <select value={form.examId} onChange={(e) => setForm({...form, examId: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                  <option value={0}>-- Chọn đề thi --</option>
                  {exams.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Câu hỏi *</label>
                <textarea value={form.question} onChange={(e) => setForm({...form, question: e.target.value})} placeholder="Nhập câu hỏi..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án A *</label>
                  <input type="text" value={form.optionA} onChange={(e) => setForm({...form, optionA: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án B *</label>
                  <input type="text" value={form.optionB} onChange={(e) => setForm({...form, optionB: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án C *</label>
                  <input type="text" value={form.optionC} onChange={(e) => setForm({...form, optionC: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án D *</label>
                  <input type="text" value={form.optionD} onChange={(e) => setForm({...form, optionD: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án đúng *</label>
                  <select value={form.correctAnswer} onChange={(e) => setForm({...form, correctAnswer: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Audio URL</label>
                  <input type="text" value={form.audioUrl} onChange={(e) => setForm({...form, audioUrl: e.target.value})} placeholder="https://..."
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-500 rounded-xl font-bold text-sm">Hủy</button>
              <button disabled={isSaving} onClick={handleSave} className="flex-1 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red disabled:opacity-50">
                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Thêm mới" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
