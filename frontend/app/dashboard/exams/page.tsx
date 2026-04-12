"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { ClipboardList, Plus, Edit2, Trash2, Search, X, Clock } from "lucide-react";

interface Level { levelId: number; levelName: string; }
interface Exam {
  examId: number;
  examName: string;
  duration: number;
  levelId: number;
  level?: Level;
  createdAt: string;
}

export default function AdminExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ examName: "", duration: 60, levelId: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [eData, lData] = await Promise.all([api("/exams"), api("/levels")]);
      if (Array.isArray(eData)) setExams(eData);
      if (Array.isArray(lData)) setLevels(lData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({ examName: "", duration: 60, levelId: levels[0]?.levelId || 0 });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setModalMode("edit");
    setForm({ examName: exam.examName, duration: exam.duration, levelId: exam.levelId });
    setEditId(exam.examId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.examName.trim()) { setError("Vui lòng nhập tên đề thi"); return; }
    setIsSaving(true); setError("");
    try {
      const res = modalMode === "create" ? await api("/exams", "POST", form) : await api(`/exams/${editId}`, "PUT", form);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa đề thi này?")) return;
    await api(`/exams/${id}`, "DELETE"); loadData();
  };

  const filtered = exams.filter(e => {
    const matchSearch = e.examName.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "all" || e.levelId === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <ClipboardList size={24} className="text-orange-600" /> Quản Lý Đề Thi
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý đề thi theo cấp độ JLPT</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm đề thi
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm đề thi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[160px]">
            <option value="all">Tất cả cấp độ</option>
            {levels.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><ClipboardList size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có đề thi nào</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tên đề thi</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thời gian</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cấp độ</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(exam => (
                  <tr key={exam.examId} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-sm text-neutral-500">{exam.examId}</td>
                    <td className="px-6 py-4 text-sm font-bold text-jp-indigo">{exam.examName}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-sm text-neutral-600">
                        <Clock size={14} /> {exam.duration} phút
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-bold bg-violet-50 text-violet-600 px-3 py-1 rounded-full">{exam.level?.levelName || `Level ${exam.levelId}`}</span></td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{new Date(exam.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(exam)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(exam.examId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Đề Thi" : "Sửa Đề Thi"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Tên đề thi *</label>
                <input type="text" value={form.examName} onChange={(e) => setForm({...form, examName: e.target.value})} placeholder="Ví dụ: Đề thi N5 - Đề 01"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Thời gian (phút) *</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({...form, duration: parseInt(e.target.value) || 0})} placeholder="60"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Cấp độ *</label>
                <select value={form.levelId} onChange={(e) => setForm({...form, levelId: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                  <option value={0}>-- Chọn cấp độ --</option>
                  {levels.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
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
