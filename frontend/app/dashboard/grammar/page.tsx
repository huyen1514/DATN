"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { PenTool, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Lesson { lessonId: number; lessonName: string; levelName?: string; skillType?: string; }
interface Grammar {
  grammarId: number;
  grammarName: string;
  structure: string;
  meaning: string;
  example: string;
  lessonId: number;
  lesson?: Lesson;
}

export default function AdminGrammar() {
  const [grammars, setGrammars] = useState<Grammar[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ grammarName: "", structure: "", meaning: "", example: "", lessonId: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [gData, lData] = await Promise.all([api("/grammars"), api("/lessons")]);
      if (Array.isArray(gData)) setGrammars(gData);
      if (Array.isArray(lData)) setLessons(lData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // Chỉ lấy những bài học thuộc kỹ năng "Ngữ pháp"
  const grammarLessons = lessons.filter(l => l.skillType === "Ngữ pháp");

  const openCreate = () => {
    setModalMode("create");
    setForm({
      grammarName: "",
      structure: "",
      meaning: "",
      example: "",
      lessonId: grammarLessons[0]?.lessonId || 0 // Mặc định chọn bài học ngữ pháp đầu tiên
    });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (g: Grammar) => {
    setModalMode("edit");
    setForm({ grammarName: g.grammarName, structure: g.structure, meaning: g.meaning, example: g.example, lessonId: g.lessonId });
    setEditId(g.grammarId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.grammarName.trim() || !form.structure.trim()) { setError("Vui lòng nhập đầy đủ"); return; }
    if (form.lessonId === 0) { setError("Vui lòng chọn bài học"); return; }

    setIsSaving(true); setError("");
    try {
      const res = modalMode === "create"
        ? await api("/grammars", "POST", form)
        : await api(`/grammars/${editId}`, "PUT", form);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa ngữ pháp này?")) return;
    await api(`/grammars/${id}`, "DELETE"); loadData();
  };

  const filtered = grammars.filter(g => {
    const matchSearch = g.grammarName.toLowerCase().includes(search.toLowerCase()) || g.meaning.toLowerCase().includes(search.toLowerCase());
    const matchLesson = filterLesson === "all" || g.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <PenTool size={24} className="text-amber-600" /> Quản Lý Ngữ Pháp
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý cấu trúc ngữ pháp theo bài học</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm ngữ pháp
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm ngữ pháp..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
          </div>
          <select value={filterLesson} onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo">
            <option value="all">Tất cả bài học</option>
            {/* Lặp qua mảng grammarLessons đã lọc */}
            {grammarLessons.map(l => (
              <option key={l.lessonId} value={l.lessonId}>
                {l.lessonName} {l.levelName ? `(${l.levelName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><PenTool size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có ngữ pháp nào</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider w-[50px]">ID</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tên</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cấu trúc</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Nghĩa</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Bài học</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(g => (
                  <tr key={g.grammarId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-neutral-500">{g.grammarId}</td>
                    <td className="px-6 py-4 text-sm font-bold text-jp-indigo">{g.grammarName}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 font-mono">{g.structure}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-[200px] truncate">{g.meaning}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                        {g.lesson?.lessonName || `Bài ${g.lessonId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(g)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(g.grammarId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Ngữ Pháp" : "Sửa Ngữ Pháp"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Tên ngữ pháp *</label>
                <input type="text" value={form.grammarName} onChange={(e) => setForm({ ...form, grammarName: e.target.value })} placeholder="Ví dụ: ～てから"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Cấu trúc *</label>
                <input type="text" value={form.structure} onChange={(e) => setForm({ ...form, structure: e.target.value })} placeholder="Vて + から + V2"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Nghĩa *</label>
                <textarea value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} placeholder="Sau khi... thì..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Ví dụ *</label>
                <textarea value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} placeholder="食べてから、出かけます。"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bài học *</label>
                <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo">
                  <option value={0}>-- Chọn --</option>
                  {/* Lặp qua mảng grammarLessons đã lọc cho Modal */}
                  {grammarLessons.map(l => (
                    <option key={l.lessonId} value={l.lessonId}>
                      {l.lessonName} {l.levelName ? `(${l.levelName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-500 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors">Hủy</button>
              <button disabled={isSaving} onClick={handleSave} className="flex-1 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red transition-colors disabled:opacity-50">
                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Thêm mới" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}