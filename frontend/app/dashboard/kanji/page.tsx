"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Languages, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Lesson { lessonId: number; lessonName: string; level?: { levelName: string }; }
interface Kanji {
  kanjiId: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi?: string;
  example: string;
  lessonId: number;
  lesson?: Lesson;
}

export default function AdminKanji() {
  const [kanjis, setKanjis] = useState<Kanji[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ character: "", meaning: "", onyomi: "", kunyomi: "", example: "", lessonId: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [kData, lData] = await Promise.all([api("/kanjis"), api("/lessons")]);
      if (Array.isArray(kData)) setKanjis(kData);
      if (Array.isArray(lData)) setLessons(lData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({ character: "", meaning: "", onyomi: "", kunyomi: "", example: "", lessonId: lessons[0]?.lessonId || 0 });
    setEditId(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (k: Kanji) => {
    setModalMode("edit");
    setForm({ character: k.character, meaning: k.meaning, onyomi: k.onyomi, kunyomi: k.kunyomi || "", example: k.example, lessonId: k.lessonId });
    setEditId(k.kanjiId);
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.character.trim() || !form.meaning.trim()) { setError("Vui lòng nhập đầy đủ thông tin"); return; }
    setIsSaving(true); setError("");
    try {
      const body = { ...form };
      const res = modalMode === "create"
        ? await api("/kanjis", "POST", body)
        : await api(`/kanjis/${editId}`, "PUT", body);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false);
      loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa kanji này?")) return;
    await api(`/kanjis/${id}`, "DELETE");
    loadData();
  };

  const filtered = kanjis.filter(k => {
    const matchSearch = k.character.includes(search) || k.meaning.toLowerCase().includes(search.toLowerCase()) || k.onyomi.includes(search);
    const matchLesson = filterLesson === "all" || k.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <Languages size={24} className="text-rose-600" /> Quản Lý Kanji
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý chữ Hán theo bài học</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm Kanji
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm theo chữ, nghĩa, onyomi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 text-sm" />
          </div>
          <select value={filterLesson} onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]">
            <option value="all">Tất cả bài học</option>
            {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Languages size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500">Chưa có kanji nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Chữ Hán</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Nghĩa</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Onyomi</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Kunyomi</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Bài học</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((k) => (
                  <tr key={k.kanjiId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-3xl font-serif text-jp-red">{k.character}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-jp-indigo">{k.meaning}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{k.onyomi}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{k.kunyomi || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                        {k.lesson?.lessonName || `Bài ${k.lessonId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(k)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(k.kanjiId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Kanji" : "Sửa Kanji"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Chữ Hán *</label>
                  <input type="text" value={form.character} onChange={(e) => setForm({...form, character: e.target.value})} placeholder="漢"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-2xl font-serif text-center" autoFocus />
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
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Nghĩa *</label>
                <input type="text" value={form.meaning} onChange={(e) => setForm({...form, meaning: e.target.value})} placeholder="Ví dụ: Nước, Sơn, Hỏa..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Onyomi *</label>
                  <input type="text" value={form.onyomi} onChange={(e) => setForm({...form, onyomi: e.target.value})} placeholder="カン"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Kunyomi</label>
                  <input type="text" value={form.kunyomi} onChange={(e) => setForm({...form, kunyomi: e.target.value})} placeholder="みず"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Ví dụ *</label>
                <textarea value={form.example} onChange={(e) => setForm({...form, example: e.target.value})} placeholder="漢字 (かんじ) - Chữ Hán"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-500 rounded-xl font-bold text-sm hover:bg-neutral-50">Hủy</button>
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
