"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { BookOpen, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Level { levelId: number; levelName: string; }
interface Lesson {
  lessonId: number;
  lessonName: string;
  levelId: number;
  skillType: string;
  level?: Level;
  createdAt: string;
}

export default function AdminLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [lessonName, setLessonName] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<number>(0);
  const [skillType, setSkillType] = useState<string>("Tự do");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [lessonsData, levelsData] = await Promise.all([
        api("/lessons"),
        api("/levels"),
      ]);
      if (Array.isArray(lessonsData)) setLessons(lessonsData);
      if (Array.isArray(levelsData)) setLevels(levelsData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setLessonName("");
    setSelectedLevelId(levels.length > 0 ? levels[0].levelId : 0);
    setSkillType("Tự do");
    setEditId(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setModalMode("edit");
    setLessonName(lesson.lessonName);
    setSelectedLevelId(lesson.levelId);
    setSkillType(lesson.skillType || "Tự do");
    setEditId(lesson.lessonId);
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!lessonName.trim()) { setError("Vui lòng nhập tên bài học"); return; }
    if (!selectedLevelId) { setError("Vui lòng chọn cấp độ"); return; }
    setIsSaving(true);
    setError("");
    try {
      const body = { lessonName, levelId: selectedLevelId, skillType };
      if (modalMode === "create") {
        const res = await api("/lessons", "POST", body);
        if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      } else {
        const res = await api(`/lessons/${editId}`, "PUT", body);
        if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bài học này?")) return;
    await api(`/lessons/${id}`, "DELETE");
    loadData();
  };

  const filtered = lessons.filter(l => {
    const matchSearch = l.lessonName.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "all" || l.levelId === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" />
              Quản Lý Bài Học
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý bài học theo từng cấp độ</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm bài học
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm kiếm bài học..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm" />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo min-w-[160px]">
            <option value="all">Tất cả cấp độ</option>
            {levels.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500">Chưa có bài học nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tên bài học</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cấp độ</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Kỹ năng</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((lesson) => (
                  <tr key={lesson.lessonId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-neutral-500">{lesson.lessonId}</td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-jp-indigo">{lesson.lessonName}</span></td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-violet-50 text-violet-600 px-3 py-1 rounded-full">
                        {lesson.level?.levelName || `Level ${lesson.levelId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full">
                        {lesson.skillType || "Tự do"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{new Date(lesson.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(lesson)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(lesson.lessonId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Bài Học" : "Sửa Bài Học"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Tên bài học</label>
                <input type="text" value={lessonName} onChange={(e) => setLessonName(e.target.value)} placeholder="Ví dụ: Bài 1 - Chào hỏi"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Cấp độ</label>
                <select value={selectedLevelId} onChange={(e) => setSelectedLevelId(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm">
                  <option value={0}>-- Chọn cấp độ --</option>
                  {levels.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Phân loại Kỹ năng</label>
                <select value={skillType} onChange={(e) => setSkillType(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm">
                  <option value="Tự do">Tự do (Kết hợp)</option>
                  <option value="Từ vựng">Từ vựng</option>
                  <option value="Ngữ pháp">Ngữ pháp</option>
                  <option value="Kanji">Kanji (Chữ Hán)</option>
                  <option value="Đọc hiểu">Đọc hiểu</option>
                  <option value="Nghe hiểu">Nghe hiểu</option>
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
