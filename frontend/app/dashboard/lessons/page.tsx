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

// Khai báo mảng SKILLS ở đây để quản lý tập trung
const SKILLS = ["Từ vựng", "Ngữ pháp", "Kanji", "Đọc hiểu", "Nghe hiểu"];

export default function AdminLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const [filterSkillType, setFilterSkillType] = useState<string>("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [lessonName, setLessonName] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<number>(0);
  const [skillType, setSkillType] = useState<string>(SKILLS[0]); // Mặc định là phần tử đầu tiên
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => { setCurrentPage(1); }, [search, filterLevel, filterSkillType]);

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

  const formatLevelName = (levelId: number) => {
    const levelMap: Record<number, string> = {
      1: "N5",
      2: "N4",
      3: "N3",
    };
    return levelMap[levelId] || `Level ${levelId}`;
  };

  const openCreate = () => {
    setModalMode("create");
    setLessonName("");
    setSelectedLevelId(levels.length > 0 ? levels[0].levelId : 0);
    setSkillType(SKILLS[0]);
    setEditId(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setModalMode("edit");
    setLessonName(lesson.lessonName);
    setSelectedLevelId(lesson.levelId);
    setSkillType(lesson.skillType || SKILLS[0]);
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
    const matchSkill = filterSkillType === "all" || l.skillType === filterSkillType;
    return matchSearch && matchLevel && matchSkill;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm kiếm bài học..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm" />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo min-w-[160px]">
            <option value="all">Tất cả cấp độ</option>
            {levels.map(l => <option key={l.levelId} value={l.levelId}>{formatLevelName(l.levelId)}</option>)}
          </select>
          <select value={filterSkillType} onChange={(e) => setFilterSkillType(e.target.value)}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo min-w-[160px]">
            <option value="all">Tất cả kỹ năng</option>
            {SKILLS.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
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
          <>
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
                {currentItems.map((lesson) => (
                  <tr key={lesson.lessonId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-neutral-500">{lesson.lessonId}</td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-jp-indigo">{lesson.lessonName}</span></td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-violet-50 text-violet-600 px-3 py-1 rounded-full">
                        {formatLevelName(lesson.levelId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full">
                        {lesson.skillType || SKILLS[0]}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-black/5 bg-white">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-jp-indigo bg-neutral-50 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-jp-indigo text-white"
                          : "text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-jp-indigo bg-neutral-50 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </>
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
                  {levels.map(l => <option key={l.levelId} value={l.levelId}>{formatLevelName(l.levelId)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Phân loại Kỹ năng</label>
                <select value={skillType} onChange={(e) => setSkillType(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm">
                  {SKILLS.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
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