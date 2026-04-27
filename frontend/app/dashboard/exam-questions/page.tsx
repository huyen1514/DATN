"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { HelpCircle, Plus, Edit2, Trash2, Search, X, Volume2, BookOpen, Layers, Info, CheckCircle2, AlertTriangle, Loader2, Target } from "lucide-react";

interface Exam { examId: number; examName: string; }
interface ExamQuestion {
  examQuestionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: number;
  audioUrl?: string;
  section: number;
  mondaiNumber: number;
  passage?: string;
  instruction?: string;
  explanation?: string;
  examId: number;
  userId: number;
  exam?: Exam;
}

const SECTION_LABELS: Record<number, string> = {
  0: "Từ vựng / Chữ Hán",
  1: "Ngữ pháp",
  2: "Đọc hiểu",
  3: "Nghe hiểu"
};

export default function AdminExamQuestions() {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: 0,
    audioUrl: "",
    section: 0,
    mondaiNumber: 1,
    passage: "",
    instruction: "",
    explanation: "",
    examId: 0,
    userId: 1
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [qData, eData] = await Promise.all([api("/exam-questions"), api("/exams")]);
      if (Array.isArray(qData)) {
        setQuestions(qData.sort((a, b) => {
          if (a.examId !== b.examId) return a.examId - b.examId;
          if (a.section !== b.section) return a.section - b.section;
          return a.mondaiNumber - b.mondaiNumber;
        }));
      }
      if (Array.isArray(eData)) setExams(eData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const getAnswerLabel = (val: number) => ["A", "B", "C", "D"][val] || val;

  const openCreate = () => {
    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).userId : 1;
    setModalMode("create");
    setForm({
      question: "", optionA: "", optionB: "", optionC: "", optionD: "",
      correctAnswer: 0, audioUrl: "", section: 0, mondaiNumber: 1,
      passage: "", instruction: "", explanation: "",
      examId: exams[0]?.examId || 0, userId
    });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (q: ExamQuestion) => {
    setModalMode("edit");
    setForm({
      question: q.question, optionA: q.optionA, optionB: q.optionB,
      optionC: q.optionC || "", optionD: q.optionD || "",
      correctAnswer: q.correctAnswer, audioUrl: q.audioUrl || "",
      section: q.section, mondaiNumber: q.mondaiNumber,
      passage: q.passage || "", instruction: q.instruction || "",
      explanation: q.explanation || "",
      examId: q.examId, userId: q.userId
    });
    setEditId(q.examQuestionId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { setError("Vui lòng nhập câu hỏi"); return; }
    if (form.examId === 0) { setError("Vui lòng chọn đề thi"); return; }

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
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase()) || (q.passage && q.passage.toLowerCase().includes(search.toLowerCase()));
    const matchExam = filterExam === "all" || q.examId === filterExam;
    return matchSearch && matchExam;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-jp-indigo flex items-center gap-3">
              <div className="bg-purple-500 text-white p-2 rounded-xl"><HelpCircle size={24} /></div>
              Quản Lý Câu Hỏi
            </h1>
            <p className="text-neutral-400 text-sm mt-2 font-medium">Quản lý nội dung, đoạn văn và đáp án cho đề thi</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-jp-indigo text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-jp-red transition-all shadow-xl shadow-jp-indigo/20">
            <Plus size={16} /> Thêm câu hỏi thủ công
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-jp-indigo transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi hoặc đoạn văn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-black/5 rounded-[1.5rem] outline-none focus:border-jp-indigo transition-all font-medium"
            />
          </div>
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-6 py-4 bg-white border-2 border-black/5 rounded-[1.5rem] text-sm font-bold text-jp-indigo outline-none focus:border-jp-indigo transition-all min-w-[240px]"
          >
            <option value="all">Tất cả đề thi</option>
            {exams.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 border-4 border-jp-indigo/10 border-t-jp-indigo rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-black text-neutral-300 uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2.5rem] border border-black/5 shadow-sm">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={40} className="text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-lg">Không tìm thấy câu hỏi nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((q, idx) => (
                <div key={q.examQuestionId} className="bg-white rounded-[2rem] border border-black/5 p-6 hover:shadow-xl hover:shadow-black/[0.02] transition-all group relative">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-jp-indigo text-white text-[10px] font-black uppercase tracking-widest rounded-lg">ID: {q.examQuestionId}</span>
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-orange-100">{q.exam?.examName || `Đề ${q.examId}`}</span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-purple-100">{SECTION_LABELS[q.section] || `Section ${q.section}`}</span>
                        <span className="px-3 py-1 bg-neutral-50 text-neutral-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-neutral-100 text-nowrap">Mondai {q.mondaiNumber}</span>
                      </div>

                      <h3 className="text-lg font-bold text-jp-indigo mb-4 font-japanese leading-relaxed">
                        {q.question}
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[
                          { l: 'A', t: q.optionA, ok: q.correctAnswer === 0 },
                          { l: 'B', t: q.optionB, ok: q.correctAnswer === 1 },
                          { l: 'C', t: q.optionC, ok: q.correctAnswer === 2 },
                          { l: 'D', t: q.optionD, ok: q.correctAnswer === 3 }
                        ].map((opt, i) => (
                          <div key={i} className={`px-3 py-2 rounded-xl text-xs font-medium border ${opt.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-neutral-50 border-transparent text-neutral-500'}`}>
                            <span className="mr-2 opacity-50">{opt.l}.</span> {opt.t || '-'}
                            {opt.ok && <CheckCircle2 size={12} className="inline ml-2" />}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400">
                        {q.passage && <span className="flex items-center gap-1"><BookOpen size={12} /> Có bài đọc</span>}
                        {q.audioUrl && <span className="flex items-center gap-1"><Volume2 size={12} /> Có audio</span>}
                        {q.explanation && <span className="flex items-center gap-1"><Info size={12} /> Có giải thích</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(q)} className="p-3 text-neutral-400 hover:text-jp-indigo hover:bg-jp-indigo/5 rounded-xl transition-all shadow-sm bg-white border border-black/5"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(q.examQuestionId)} className="p-3 text-neutral-400 hover:text-jp-red hover:bg-jp-red/5 rounded-xl transition-all shadow-sm bg-white border border-black/5"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Large for details */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-jp-indigo/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl my-4 relative overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="px-10 py-6 border-b border-black/5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-jp-indigo">{modalMode === "create" ? "Thêm Câu Hỏi Mới" : "Sửa Câu Hỏi"}</h2>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Cấu hình chi tiết nội dung và đáp án</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-neutral-100 text-neutral-400 hover:text-neutral-600 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
              {error && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-3">
                <AlertTriangle size={18} /> {error}
              </div>}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Question & Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4 text-jp-indigo border-b border-black/5 pb-2">
                    <Layers size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Nội dung câu hỏi</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Đề thi *</label>
                      <select value={form.examId} onChange={(e) => setForm({ ...form, examId: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-sm">
                        <option value={0}>Chọn đề thi</option>
                        {exams.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Phần thi / Section</label>
                      <select value={form.section} onChange={(e) => setForm({ ...form, section: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-sm">
                        {Object.entries(SECTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Mondai Number</label>
                      <input type="number" value={form.mondaiNumber} onChange={(e) => setForm({ ...form, mondaiNumber: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Audio URL (Nghe hiểu)</label>
                      <input type="text" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://..."
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Yêu cầu / Instruction</label>
                    <textarea value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} placeholder="VD: Hãy chọn cách đọc đúng của từ gạch chân..."
                      className="w-full px-5 py-3 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-sm h-16 resize-none" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Đoạn văn đọc hiểu (Passage)</label>
                    <textarea value={form.passage} onChange={(e) => setForm({ ...form, passage: e.target.value })} placeholder="Dán nội dung bài đọc tại đây..."
                      className="w-full px-5 py-4 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-medium text-sm h-48 resize-none font-japanese leading-relaxed" />
                  </div>
                </div>

                {/* Right Column: Options & Explanation */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4 text-jp-indigo border-b border-black/5 pb-2">
                    <Target size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Câu hỏi & Đáp án</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Câu hỏi chính *</label>
                    <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Nhập câu hỏi..."
                      className="w-full px-5 py-3 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-black text-lg h-24 resize-none font-japanese" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: 'A', k: 'optionA' }, { l: 'B', k: 'optionB' },
                      { l: 'C', k: 'optionC' }, { l: 'D', k: 'optionD' }
                    ].map(opt => (
                      <div key={opt.l}>
                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">Đáp án {opt.l} *</label>
                        <input type="text" value={(form as any)[opt.k]} onChange={(e) => setForm({ ...form, [opt.k]: e.target.value })}
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-sm" />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-jp-indigo uppercase tracking-widest mb-2">Đáp án đúng *</label>
                      <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-jp-indigo text-white rounded-xl outline-none font-black text-sm">
                        <option value={0}>A</option>
                        <option value={1}>B</option>
                        <option value={2}>C</option>
                        <option value={3}>D</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Giải thích / Explanation</label>
                    <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Giải thích vì sao chọn đáp án này..."
                      className="w-full px-5 py-3 bg-emerald-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-medium text-xs h-32 resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 border-t border-black/5 bg-neutral-50/50 flex gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border-2 border-black/5 text-neutral-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all">Hủy bỏ</button>
              <button disabled={isSaving} onClick={handleSave} className="flex-[2] py-4 bg-jp-indigo text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jp-red shadow-xl shadow-jp-indigo/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isSaving ? "Đang xử lý..." : modalMode === "create" ? "Tạo câu hỏi mới" : "Cập nhật thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
