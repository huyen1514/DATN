"use client";

import { useEffect, useState } from "react";
import { uploadAudio, api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { BookA, Plus, Edit2, Trash2, Search, X, Upload, AudioLines } from "lucide-react";

interface Lesson { lessonId: number; lessonName: string; level?: { levelName: string }; skillType?: string; }
interface Vocabulary {
  vocabularyId: number;
  word: string;
  reading: string;
  meaning: string;
  example?: string;
  partOfSpeech?: string;
  audioUrl?: string;
  lessonId: number;
  lesson?: Lesson;
}

export default function AdminVocabulary() {
  const [vocabs, setVocabs] = useState<Vocabulary[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ word: "", reading: "", meaning: "", example: "", partOfSpeech: "", audioUrl: "", lessonId: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [vData, lData] = await Promise.all([api("/vocabularies"), api("/lessons")]);
      if (Array.isArray(vData)) setVocabs(vData);
      if (Array.isArray(lData)) setLessons(lData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({ word: "", reading: "", meaning: "", example: "", partOfSpeech: "", audioUrl: "", lessonId: lessons[0]?.lessonId || 0 });
    setSelectedFile(null);
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (v: Vocabulary) => {
    setModalMode("edit");
    setForm({ word: v.word, reading: v.reading, meaning: v.meaning, example: v.example || "", partOfSpeech: v.partOfSpeech || "", audioUrl: v.audioUrl || "", lessonId: v.lessonId });
    setSelectedFile(null);
    setEditId(v.vocabularyId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.word.trim() || !form.meaning.trim()) { setError("Vui lòng nhập đầy đủ"); return; }
    setIsSaving(true); setError("");
    try {
      let finalAudioUrl = form.audioUrl;
      
      // Nếu có chọn file mới thì upload trước
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
      const res = modalMode === "create" ? await api("/vocabularies", "POST", postBody) : await api(`/vocabularies/${editId}`, "PUT", postBody);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa từ vựng này?")) return;
    await api(`/vocabularies/${id}`, "DELETE"); loadData();
  };

  const filtered = vocabs.filter(v => {
    const matchSearch = v.word.toLowerCase().includes(search.toLowerCase()) || v.meaning.toLowerCase().includes(search.toLowerCase()) || v.reading.includes(search);
    const matchLesson = filterLesson === "all" || v.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <BookA size={24} className="text-emerald-600" /> Quản Lý Từ Vựng
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý từ vựng theo bài học</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm từ vựng
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm từ vựng..." value={search} onChange={(e) => setSearch(e.target.value)}
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
            <div className="p-12 text-center"><BookA size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có từ vựng nào</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Từ</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cách đọc</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Nghĩa</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Loại từ</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Bài học</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(v => (
                  <tr key={v.vocabularyId} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-lg font-serif font-bold text-jp-indigo">{v.word}</td>
                    <td className="px-6 py-4 text-sm text-jp-red">{v.reading}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-[200px] truncate">{v.meaning}</td>
                    <td className="px-6 py-4 text-xs text-neutral-500">{v.partOfSpeech || "—"}</td>
                    <td className="px-6 py-4"><span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{v.lesson?.lessonName || `Bài ${v.lessonId}`}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(v)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(v.vocabularyId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Từ Vựng" : "Sửa Từ Vựng"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Từ *</label>
                  <input type="text" value={form.word} onChange={(e) => setForm({...form, word: e.target.value})} placeholder="食べる"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm font-serif text-lg" autoFocus />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Cách đọc *</label>
                  <input type="text" value={form.reading} onChange={(e) => setForm({...form, reading: e.target.value})} placeholder="たべる"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Nghĩa *</label>
                <input type="text" value={form.meaning} onChange={(e) => setForm({...form, meaning: e.target.value})} placeholder="Ăn"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Loại từ</label>
                  <input type="text" value={form.partOfSpeech} onChange={(e) => setForm({...form, partOfSpeech: e.target.value})} placeholder="Động từ"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bài học *</label>
                  <select value={form.lessonId} onChange={(e) => setForm({...form, lessonId: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                    <option value={0}>-- Chọn --</option>
                    {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName} {l.level ? `(${l.level.levelName}${l.skillType ? ` - ${l.skillType}` : ''})` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Ví dụ</label>
                <textarea value={form.example} onChange={(e) => setForm({...form, example: e.target.value})} placeholder="毎日ご飯を食べます。"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Tải tệp âm thanh (.mp3)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden" 
                      id="audio-upload"
                    />
                    <label 
                      htmlFor="audio-upload"
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
                  {form.audioUrl && !selectedFile && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 italic text-[10px]">
                      <AudioLines size={12} /> Đã có file
                    </div>
                  )}
                </div>
                {form.audioUrl && (
                  <p className="mt-2 text-[10px] text-neutral-400 truncate">Link hiện tại: {form.audioUrl}</p>
                )}
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
