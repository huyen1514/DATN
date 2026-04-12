"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { FileText, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Lesson { lessonId: number; lessonName: string; level?: { levelName: string }; skillType?: string; }
interface Reading {
  readingId: number;
  content: string;
  question: string;
  lessonId: number;
  lesson?: Lesson;
}

export default function AdminReading() {
  const [items, setItems] = useState<Reading[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ content: "", question: "", lessonId: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [rData, lData] = await Promise.all([api("/readings"), api("/lessons")]);
      if (Array.isArray(rData)) setItems(rData);
      if (Array.isArray(lData)) setLessons(lData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({ content: "", question: "", lessonId: lessons[0]?.lessonId || 0 });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (item: Reading) => {
    setModalMode("edit");
    setForm({ content: item.content, question: item.question, lessonId: item.lessonId });
    setEditId(item.readingId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.content.trim() || !form.question.trim()) { setError("Vui lòng nhập đầy đủ"); return; }
    setIsSaving(true); setError("");
    try {
      const res = modalMode === "create" ? await api("/readings", "POST", form) : await api(`/readings/${editId}`, "PUT", form);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bài đọc này?")) return;
    await api(`/readings/${id}`, "DELETE"); loadData();
  };

  const filtered = items.filter(i => {
    const matchSearch = i.question.toLowerCase().includes(search.toLowerCase()) || i.content.toLowerCase().includes(search.toLowerCase());
    const matchLesson = filterLesson === "all" || i.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <FileText size={24} className="text-indigo-600" /> Quản Lý Luyện Đọc
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý bài đọc hiểu</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm bài đọc
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm bài đọc..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterLesson} onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]">
            <option value="all">Tất cả bài học</option>
            {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName} {l.level ? `(${l.level.levelName}${l.skillType ? ` - ${l.skillType}` : ''})` : ''}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><FileText size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có bài đọc nào</p></div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map(item => (
                <div key={item.readingId} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full mb-3 inline-block">{item.lesson?.lessonName || `Bài ${item.lessonId}`}</span>
                      <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{item.content}</p>
                      <p className="text-sm font-bold text-jp-indigo">❓ {item.question}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => openEdit(item)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.readingId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Bài Đọc" : "Sửa Bài Đọc"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Nội dung bài đọc *</label>
                <textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="Nhập đoạn văn tiếng Nhật..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-40" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Câu hỏi *</label>
                <textarea value={form.question} onChange={(e) => setForm({...form, question: e.target.value})} placeholder="Nhập câu hỏi..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bài học *</label>
                <select value={form.lessonId} onChange={(e) => setForm({...form, lessonId: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                  <option value={0}>-- Chọn bài học --</option>
                  {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName} {l.level ? `(${l.level.levelName}${l.skillType ? ` - ${l.skillType}` : ''})` : ''}</option>)}
                </select>
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
