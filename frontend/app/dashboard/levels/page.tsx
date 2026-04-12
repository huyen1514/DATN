"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { GraduationCap, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Level {
  levelId: number;
  levelName: string;
  createdAt: string;
}

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [levelName, setLevelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadLevels(); }, []);

  const loadLevels = async () => {
    try {
      const data = await api("/levels");
      if (Array.isArray(data)) setLevels(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setLevelName("");
    setEditId(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (level: Level) => {
    setModalMode("edit");
    setLevelName(level.levelName);
    setEditId(level.levelId);
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!levelName.trim()) { setError("Vui lòng nhập tên cấp độ"); return; }
    setIsSaving(true);
    setError("");
    try {
      if (modalMode === "create") {
        const res = await api("/levels", "POST", { levelName });
        if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      } else {
        const res = await api(`/levels/${editId}`, "PUT", { levelName });
        if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      }
      setIsModalOpen(false);
      loadLevels();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa cấp độ này?")) return;
    await api(`/levels/${id}`, "DELETE");
    loadLevels();
  };

  const filtered = levels.filter(l =>
    l.levelName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <GraduationCap size={24} className="text-violet-600" />
              Quản Lý Cấp Độ
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý các cấp độ JLPT (N5, N4, N3, N2, N1)</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm cấp độ
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cấp độ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500">{search ? "Không tìm thấy kết quả" : "Chưa có cấp độ nào"}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tên cấp độ</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((level) => (
                  <tr key={level.levelId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-neutral-500">{level.levelId}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-jp-indigo">{level.levelName}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">
                      {new Date(level.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(level)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(level.levelId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jp-indigo">
                {modalMode === "create" ? "Thêm Cấp Độ" : "Sửa Cấp Độ"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            <div className="mb-6">
              <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">
                Tên cấp độ
              </label>
              <input
                type="text"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                placeholder="Ví dụ: N5, N4, N3..."
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-500 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors">
                Hủy
              </button>
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="flex-1 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red transition-colors disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Thêm mới" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
