"use client";

import { useEffect, useState } from "react";
import { uploadAudio, api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Headphones, Plus, Edit2, Trash2, Search, X, Upload } from "lucide-react";

interface Lesson { lessonId: number; lessonName: string; }
interface Listening {
  listeningId: number;
  audioUrl: string;
  transcript: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  lessonId: number;
  lesson?: Lesson;
}

export default function AdminListening() {
  const [items, setItems] = useState<Listening[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ audioUrl: "", transcript: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", lessonId: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [lData, lessonData] = await Promise.all([api("/listenings"), api("/lessons")]);
      if (Array.isArray(lData)) setItems(lData);
      if (Array.isArray(lessonData)) setLessons(lessonData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({ audioUrl: "", transcript: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", lessonId: lessons[0]?.lessonId || 0 });
    setSelectedFile(null);
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (item: Listening) => {
    setModalMode("edit");
    setForm({ audioUrl: item.audioUrl, transcript: item.transcript, question: item.question, optionA: item.optionA, optionB: item.optionB, optionC: item.optionC, optionD: item.optionD, correctAnswer: item.correctAnswer, lessonId: item.lessonId });
    setSelectedFile(null);
    setEditId(item.listeningId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { setError("Vui lòng nhập câu hỏi"); return; }
    setIsSaving(true); setError("");
    try {
      let finalAudioUrl = form.audioUrl;

      if (selectedFile) {
        try {
          const uploadRes = await uploadAudio(selectedFile);
          finalAudioUrl = uploadRes.url;
        } catch (e: any) {
          setError("Lỗi khi tải file audio: " + e.message);
          setIsSaving(false);
          return;
        }
      }

      const postBody = { ...form, audioUrl: finalAudioUrl };
      const res = modalMode === "create" ? await api("/listenings", "POST", postBody) : await api(`/listenings/${editId}`, "PUT", postBody);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bài nghe này?")) return;
    await api(`/listenings/${id}`, "DELETE"); loadData();
  };

  const filtered = items.filter(i => {
    const matchSearch = i.question.toLowerCase().includes(search.toLowerCase());
    const matchLesson = filterLesson === "all" || i.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <Headphones size={24} className="text-cyan-600" /> Quản Lý Luyện Nghe
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý bài nghe trắc nghiệm</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm bài nghe
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm câu hỏi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterLesson} onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]">
            <option value="all">Tất cả bài học</option>
            {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><Headphones size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có bài nghe nào</p></div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map(item => (
                <div key={item.listeningId} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full">{item.lesson?.lessonName || `Bài ${item.lessonId}`}</span>
                        <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">Đáp án: {item.correctAnswer}</span>
                      </div>
                      <p className="text-sm font-bold text-jp-indigo mb-2">{item.question}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                        <span>A. {item.optionA}</span>
                        <span>B. {item.optionB}</span>
                        <span>C. {item.optionC}</span>
                        <span>D. {item.optionD}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => openEdit(item)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.listeningId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Bài Nghe" : "Sửa Bài Nghe"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Tải tệp âm thanh (.mp3) *</label>
                <div className="relative flex-1">
                  <input 
                    type="file" 
                    accept="audio/*" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden" 
                    id="listening-audio-upload"
                  />
                  <label 
                    htmlFor="listening-audio-upload"
                    className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-pointer hover:border-jp-indigo/30 hover:bg-jp-indigo/5 transition-all w-full"
                  >
                    <Upload size={16} className="text-neutral-400" />
                    {selectedFile ? (
                      <span className="text-jp-indigo font-medium truncate">{selectedFile.name}</span>
                    ) : (
                      <span>{form.audioUrl ? "Chọn tệp khác để thay thế" : "Nhấn để chọn tệp .mp3"}</span>
                    )}
                  </label>
                </div>
                {form.audioUrl && (
                  <p className="mt-2 text-[10px] text-neutral-400 truncate">Link hiện tại: {form.audioUrl}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bản dịch (Transcript)</label>
                <textarea value={form.transcript} onChange={(e) => setForm({...form, transcript: e.target.value})} placeholder="Nội dung audio..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Câu hỏi *</label>
                <textarea value={form.question} onChange={(e) => setForm({...form, question: e.target.value})} placeholder="Nội dung câu hỏi..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-16" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án A *</label>
                  <input type="text" value={form.optionA} onChange={(e) => setForm({...form, optionA: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án B *</label>
                  <input type="text" value={form.optionB} onChange={(e) => setForm({...form, optionB: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án C *</label>
                  <input type="text" value={form.optionC} onChange={(e) => setForm({...form, optionC: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án D *</label>
                  <input type="text" value={form.optionD} onChange={(e) => setForm({...form, optionD: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đáp án đúng *</label>
                  <select value={form.correctAnswer} onChange={(e) => setForm({...form, correctAnswer: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                    {["A","B","C","D"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bài học *</label>
                  <select value={form.lessonId} onChange={(e) => setForm({...form, lessonId: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                    <option value={0}>-- Chọn --</option>
                    {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName}</option>)}
                  </select>
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
