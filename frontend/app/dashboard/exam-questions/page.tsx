"use client";

import { useEffect, useState } from "react";
import { api, uploadAudio, uploadImage } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { HelpCircle, Plus, Edit2, Trash2, Search, X, Upload, Image as ImageIcon, Volume2, BookOpen, Layers, Info, CheckCircle2, AlertTriangle, Loader2, Target, Headphones, PlayCircle, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5135";

interface Exam { examId: number; examName: string; }
interface ExamQuestion {
  examQuestionId: number; question: string;
  optionA: string; optionB: string; optionC: string | null; optionD: string | null;
  correctAnswer: number; audioUrl?: string; imageUrl?: string;
  section: number; mondaiNumber: number;
  passage?: string; instruction?: string; explanation?: string;
  examId: number; userId: number; exam?: Exam;
}

const SECTION_LABELS: Record<number, string> = { 0: "Từ vựng / Chữ Hán", 1: "Ngữ pháp", 2: "Đọc hiểu", 3: "Nghe hiểu" };

const resolveUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return API_BASE + url;
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
    question: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswer: 0, audioUrl: "", imageUrl: "", section: 0, mondaiNumber: 1,
    passage: "", instruction: "", explanation: "", examId: 0, userId: 1
  });

  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [qData, eData] = await Promise.all([api("/exam-questions"), api("/exams")]);
      if (Array.isArray(qData)) {
        setQuestions(qData.sort((a: ExamQuestion, b: ExamQuestion) => {
          if (a.examId !== b.examId) return a.examId - b.examId;
          if (a.section !== b.section) return a.section - b.section;
          return a.mondaiNumber - b.mondaiNumber;
        }));
      }
      if (Array.isArray(eData)) setExams(eData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).userId : 1;
    setModalMode("create");
    setForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "",
      correctAnswer: 0, audioUrl: "", imageUrl: "", section: 0, mondaiNumber: 1,
      passage: "", instruction: "", explanation: "", examId: exams[0]?.examId || 0, userId });
    setSelectedAudioFile(null); setSelectedImageFile(null);
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (q: ExamQuestion) => {
    setModalMode("edit");
    setForm({ question: q.question, optionA: q.optionA, optionB: q.optionB,
      optionC: q.optionC || "", optionD: q.optionD || "",
      correctAnswer: q.correctAnswer, audioUrl: q.audioUrl || "", imageUrl: q.imageUrl || "",
      section: q.section, mondaiNumber: q.mondaiNumber,
      passage: q.passage || "", instruction: q.instruction || "",
      explanation: q.explanation || "", examId: q.examId, userId: q.userId });
    setSelectedAudioFile(null); setSelectedImageFile(null);
    setEditId(q.examQuestionId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { setError("Vui lòng nhập câu hỏi"); return; }
    if (form.examId === 0) { setError("Vui lòng chọn đề thi"); return; }
    setIsSaving(true); setError("");
    try {
      let finalAudioUrl = form.audioUrl;
      let finalImageUrl = form.imageUrl;

      if (selectedAudioFile) {
        try {
          const uploadRes = await uploadAudio(selectedAudioFile);
          finalAudioUrl = uploadRes.url;
        } catch (e: any) { setError("Lỗi upload audio: " + e.message); setIsSaving(false); return; }
      }
      if (selectedImageFile) {
        try {
          const uploadRes = await uploadImage(selectedImageFile);
          finalImageUrl = uploadRes.url;
        } catch (e: any) { setError("Lỗi upload ảnh: " + e.message); setIsSaving(false); return; }
      }

      const postBody = { ...form, audioUrl: finalAudioUrl, imageUrl: finalImageUrl };
      const res = modalMode === "create"
        ? await api("/exam-questions", "POST", postBody)
        : await api(`/exam-questions/${editId}`, "PUT", postBody);
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
      <div className="max-w-6xl mx-auto pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <HelpCircle size={24} className="text-purple-600" /> Quản Lý Câu Hỏi Thi
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý nội dung, file nghe, hình ảnh và đáp án cho đề thi</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm câu hỏi
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm kiếm nội dung câu hỏi hoặc đoạn văn..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterExam} onChange={(e) => setFilterExam(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[220px]">
            <option value="all">Tất cả đề thi</option>
            {exams.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <HelpCircle size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500">Không tìm thấy câu hỏi nào</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map((q) => (
                <div key={q.examQuestionId} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row items-start gap-6">

                    {/* KHU VỰC MEDIA BÊN TRÁI */}
                    <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
                      {q.imageUrl ? (
                        <div className="w-full h-32 rounded-xl border border-black/10 bg-white flex items-center justify-center overflow-hidden">
                          <img src={resolveUrl(q.imageUrl)} alt="minh họa" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-xl border border-black/5 border-dashed bg-neutral-50 flex flex-col items-center justify-center text-neutral-400">
                          <ImageIcon size={24} className="mb-2 opacity-30" />
                          <span className="text-[10px]">Không có ảnh</span>
                        </div>
                      )}
                      {q.audioUrl && (
                        <audio controls src={resolveUrl(q.audioUrl)} className="w-full h-10" />
                      )}
                    </div>

                    {/* NỘI DUNG CÂU HỎI */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-100">{q.exam?.examName || `Đề ${q.examId}`}</span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-100">{SECTION_LABELS[q.section] || `Section ${q.section}`}</span>
                        <span className="px-3 py-1 bg-neutral-50 text-neutral-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-neutral-100">Mondai {q.mondaiNumber}</span>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-md border border-green-200">Đáp án: {["A","B","C","D"][q.correctAnswer] || q.correctAnswer}</span>
                      </div>

                      <p className="text-sm font-bold text-jp-indigo mb-3 line-clamp-2 font-japanese">{q.question}</p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <span className={q.correctAnswer === 0 ? 'font-bold text-green-600' : ''}>A. {q.optionA}</span>
                        <span className={q.correctAnswer === 1 ? 'font-bold text-green-600' : ''}>B. {q.optionB}</span>
                        <span className={q.correctAnswer === 2 ? 'font-bold text-green-600' : ''}>C. {q.optionC || '-'}</span>
                        <span className={q.correctAnswer === 3 ? 'font-bold text-green-600' : ''}>D. {q.optionD || '-'}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-neutral-400">
                        {q.passage && <span className="flex items-center gap-1"><BookOpen size={12} /> Có bài đọc</span>}
                        {q.audioUrl && <span className="flex items-center gap-1"><Volume2 size={12} /> Có audio</span>}
                        {q.explanation && <span className="flex items-center gap-1"><Info size={12} /> Có giải thích</span>}
                      </div>
                    </div>

                    {/* NÚT ACTION */}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button onClick={() => openEdit(q)} className="p-2.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(q.examQuestionId)} className="p-2.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><HelpCircle size={20} /></div>
                <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Câu Hỏi Mới" : "Chỉnh Sửa Câu Hỏi"}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2"><XCircle className="shrink-0 mt-0.5" size={16} /> {error}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* CỘT TRÁI: METADATA + UPLOAD MEDIA */}
                <div className="lg:col-span-5 space-y-6">

                  {/* Chọn Đề thi + Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2">Đề thi *</label>
                      <select value={form.examId} onChange={(e) => setForm({ ...form, examId: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo transition-all">
                        <option value={0}>Chọn đề thi</option>
                        {exams.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2">Phần thi</label>
                      <select value={form.section} onChange={(e) => setForm({ ...form, section: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo transition-all">
                        {Object.entries(SECTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2">Mondai Number</label>
                    <input type="number" value={form.mondaiNumber} onChange={(e) => setForm({ ...form, mondaiNumber: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo transition-all" />
                  </div>

                  {/* Upload Audio */}
                  <div className="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100">
                    <label className="block text-[11px] font-bold tracking-wider text-cyan-800 uppercase mb-3 flex items-center gap-2">
                      <Headphones size={14} /> Tệp âm thanh (Nghe hiểu)
                    </label>
                    <input type="file" accept="audio/*" onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)} className="hidden" id="exam-audio-upload" />
                    <label htmlFor="exam-audio-upload" className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-cyan-200 bg-white rounded-xl text-sm text-cyan-700 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-all mb-3 group">
                      <Upload size={18} className="text-cyan-400 group-hover:text-cyan-600 transition-colors" />
                      {selectedAudioFile ? <span className="font-bold truncate">{selectedAudioFile.name}</span> : <span className="font-medium">{form.audioUrl ? "Thay đổi File Audio" : "Chọn tệp MP3 tải lên"}</span>}
                    </label>
                    {(selectedAudioFile || form.audioUrl) && (
                      <audio controls src={selectedAudioFile ? URL.createObjectURL(selectedAudioFile) : resolveUrl(form.audioUrl)} className="w-full h-10 rounded-lg" />
                    )}
                  </div>

                  {/* Upload Ảnh */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-2">
                      <ImageIcon size={14} /> Ảnh minh họa (Không bắt buộc)
                    </label>
                    <input type="file" accept="image/*" onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)} className="hidden" id="exam-image-upload" />
                    <label htmlFor="exam-image-upload" className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-neutral-200 rounded-2xl text-sm text-neutral-500 cursor-pointer hover:border-jp-indigo/40 bg-neutral-50 hover:bg-white transition-all h-40">
                      {selectedImageFile || form.imageUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center group">
                          <img src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : resolveUrl(form.imageUrl)} alt="preview" className="max-w-full max-h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs gap-1"><Upload size={14} /> Thay ảnh</div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 mb-1"><Upload size={16} className="text-neutral-400" /></div>
                          <span>Nhấp để tải ảnh lên</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Passage */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-2"><BookOpen size={14} /> Đoạn văn đọc hiểu</label>
                    <textarea value={form.passage} onChange={(e) => setForm({ ...form, passage: e.target.value })} placeholder="Dán nội dung bài đọc tại đây..."
                      className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl text-sm resize-none h-32 outline-none focus:bg-white focus:border-jp-indigo transition-all font-japanese leading-relaxed" />
                  </div>
                </div>

                {/* CỘT PHẢI: NỘI DUNG CÂU HỎI & ĐÁP ÁN */}
                <div className="lg:col-span-7 space-y-6">

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2">Yêu cầu / Instruction</label>
                    <textarea value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} placeholder="VD: Hãy chọn cách đọc đúng..."
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo transition-all" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Câu hỏi chính *</label>
                    <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Nhập câu hỏi..."
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-[15px] resize-none h-20 outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo transition-all font-japanese" />
                  </div>

                  <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-600 uppercase mb-4">Các lựa chọn đáp án</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-neutral-200 rounded text-xs font-bold flex items-center justify-center text-neutral-500 shadow-sm">{opt}</span>
                          <input type="text"
                            value={(form as any)[`option${opt}`]}
                            onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                            className="w-full pl-12 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-jp-indigo bg-white transition-colors" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-5 border-t border-neutral-200/60 flex items-center gap-4">
                      <label className="text-sm font-bold text-green-700 whitespace-nowrap">Đáp án đúng:</label>
                      <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border-2 border-green-200 bg-green-50 text-green-800 rounded-xl text-sm font-bold outline-none focus:border-green-400 cursor-pointer">
                        <option value={0}>Đáp án A</option>
                        <option value={1}>Đáp án B</option>
                        <option value={2}>Đáp án C</option>
                        <option value={3}>Đáp án D</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2">Giải thích / Explanation</label>
                    <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Giải thích vì sao chọn đáp án này..."
                      className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl text-sm resize-y min-h-[100px] outline-none focus:bg-white focus:border-jp-indigo transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-neutral-300 bg-white text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors shadow-sm">Thoát</button>
              <button disabled={isSaving} onClick={handleSave} className="px-8 py-2.5 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isSaving ? "Đang xử lý..." : modalMode === "create" ? "Tạo câu hỏi mới" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
