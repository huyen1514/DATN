"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Languages, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface Level { levelId: number; levelName: string; }
interface Lesson {
  lessonId: number;
  lessonName: string;
  levelId: number;
  skillType: string;
  level?: Level;
}

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

  // Hàm chuyển đổi ID thành tên N5, N4...
  const formatLevelName = (levelId: number) => {
    const levelMap: Record<number, string> = {
      1: "N5",
      2: "N4",
      3: "N3",
      4: "N2",
      5: "N1",
    };
    return levelMap[levelId] || `Level ${levelId}`;
  };

  // Lọc lấy các bài học Kanji
  const isKanjiLesson = (l: Lesson) => {
    const type = l.skillType?.toLowerCase() || "";
    return type.includes("kanji") || type.includes("hán");
  };

  const kanjiLessons = lessons.filter(isKanjiLesson);

  const openCreate = () => {
    setModalMode("create");
    setForm({
      character: "", meaning: "", onyomi: "", kunyomi: "", example: "",
      lessonId: kanjiLessons.length > 0 ? kanjiLessons[0].lessonId : 0
    });
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
    if (!form.character.trim() || !form.meaning.trim() || form.lessonId === 0) {
      setError("Vui lòng điền đủ thông tin và chọn bài học"); return;
    }
    setIsSaving(true); setError("");
    try {
      const res = modalMode === "create"
        ? await api("/kanjis", "POST", form)
        : await api(`/kanjis/${editId}`, "PUT", form);
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
    const matchSearch = k.character.includes(search) || k.meaning.toLowerCase().includes(search.toLowerCase());
    const matchLesson = filterLesson === "all" || k.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
            <Languages size={24} className="text-rose-600" /> Quản Lý Kanji
          </h1>
          <button onClick={openCreate} className="px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-all shadow-lg">
            <Plus size={16} className="inline mr-1" /> Thêm Kanji
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterLesson} onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]">
            <option value="all">Tất cả bài học</option>
            {kanjiLessons.map(l => (
              <option key={l.lessonId} value={l.lessonId}>
                {l.lessonName} - {formatLevelName(l.levelId)}
              </option>
            ))}
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
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-black/5">
                  <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Chữ Hán</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Nghĩa</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Bài học</th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-neutral-400 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((k) => (
                  <tr key={k.kanjiId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-400">{k.kanjiId}</td>
                    <td className="px-6 py-4 text-3xl font-serif text-jp-red">{k.character}</td>
                    <td className="px-6 py-4 text-sm font-medium text-jp-indigo">{k.meaning}</td>
                    <td className="px-6 py-4 text-xs font-bold text-blue-600">
                      {k.lesson ? `${k.lesson.lessonName} - ${formatLevelName(k.lesson.levelId)}` : `Bài ${k.lessonId}`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(k)} className="p-2 text-neutral-400 hover:text-blue-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(k.kanjiId)} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{modalMode === "create" ? "Thêm Kanji" : "Sửa Kanji"}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Chữ Hán" value={form.character} onChange={e => setForm({ ...form, character: e.target.value })} className="border p-3 rounded-xl text-center text-2xl font-serif focus:border-jp-indigo focus:outline-none focus:ring-1 focus:ring-jp-indigo" />
                <select value={form.lessonId} onChange={e => setForm({ ...form, lessonId: parseInt(e.target.value) })} className="border p-3 rounded-xl text-sm focus:border-jp-indigo focus:outline-none focus:ring-1 focus:ring-jp-indigo">
                  <option value={0}>Chọn bài học</option>
                  {kanjiLessons.map(l => (
                    <option key={l.lessonId} value={l.lessonId}>
                      {l.lessonName} - {formatLevelName(l.levelId)}
                    </option>
                  ))}
                </select>
              </div>
              <input placeholder="Nghĩa Hán Việt" value={form.meaning} onChange={e => setForm({ ...form, meaning: e.target.value })} className="w-full border p-3 rounded-xl text-sm focus:border-jp-indigo focus:outline-none focus:ring-1 focus:ring-jp-indigo" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Onyomi" value={form.onyomi} onChange={e => setForm({ ...form, onyomi: e.target.value })} className="border p-3 rounded-xl text-sm focus:border-jp-indigo focus:outline-none focus:ring-1 focus:ring-jp-indigo" />
                <input placeholder="Kunyomi" value={form.kunyomi} onChange={e => setForm({ ...form, kunyomi: e.target.value })} className="border p-3 rounded-xl text-sm focus:border-jp-indigo focus:outline-none focus:ring-1 focus:ring-jp-indigo" />
              </div>
              <textarea placeholder="Ví dụ" value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} className="w-full border p-3 rounded-xl text-sm h-20 resize-none focus:border-jp-indigo focus:outline-none focus:ring-1 focus:ring-jp-indigo" />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-neutral-50 transition-colors">Hủy</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-jp-indigo text-white rounded-xl font-bold disabled:opacity-50 hover:bg-jp-red transition-colors">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}