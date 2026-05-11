"use client";

import { useEffect, useState, useMemo } from "react";
import { uploadAudio, api, resolveMediaUrl } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { BookA, Plus, Edit2, Trash2, Search, X, Upload, AudioLines, Volume2, Loader2 } from "lucide-react";

interface Level { levelId: number; levelName: string; }
interface Lesson {
  lessonId: number;
  lessonName: string;
  levelId: number;
  levelName?: string;
  skillType?: string;
}
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
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterLesson, setFilterLesson] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ word: "", reading: "", meaning: "", example: "", partOfSpeech: "", audioUrl: "", lessonId: 0 });
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [vData, lData, lvData] = await Promise.all([
        api("/vocabularies"),
        api("/lessons"),
        api("/levels")
      ]);
      if (Array.isArray(vData)) setVocabs(vData);
      if (Array.isArray(lData)) setLessons(lData);
      if (Array.isArray(lvData)) setLevels(lvData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // Chỉ lấy những bài học thuộc kỹ năng "Từ vựng"
  const vocabLessons = useMemo(() => {
    return lessons.filter(l => l.skillType === "Từ vựng");
  }, [lessons]);

  // Lọc danh sách bài học dựa trên filterLevel được chọn
  const availableLessons = useMemo(() => {
    if (filterLevel === "all") return vocabLessons;
    return vocabLessons.filter(l => String(l.levelId) === filterLevel);
  }, [vocabLessons, filterLevel]);

  const openCreate = () => {
    setModalMode("create");
    setForm({ word: "", reading: "", meaning: "", example: "", partOfSpeech: "", audioUrl: "", lessonId: vocabLessons[0]?.lessonId || 0 });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (v: Vocabulary) => {
    setModalMode("edit");
    setForm({ word: v.word, reading: v.reading, meaning: v.meaning, example: v.example || "", partOfSpeech: v.partOfSpeech || "", audioUrl: v.audioUrl || "", lessonId: v.lessonId });
    setEditId(v.vocabularyId); setError(""); setIsModalOpen(true);
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAudio(true);
    setError("");
    try {
      const uploadRes = await uploadAudio(file);
      setForm(prev => ({ ...prev, audioUrl: uploadRes.url }));
    } catch (err: any) {
      setError("Lỗi khi tải file audio: " + (err.message || "Upload thất bại"));
    } finally {
      setIsUploadingAudio(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.word.trim() || !form.meaning.trim() || form.lessonId === 0) {
      setError("Vui lòng nhập đầy đủ thông tin và chọn Bài học");
      return;
    }
    if (isUploadingAudio) {
      setError("Vui lòng đợi tải file audio xong");
      return;
    }
    setIsSaving(true); setError("");
    try {
      const postBody = { ...form };
      console.log("[Vocabulary Save] Sending body:", JSON.stringify(postBody));
      const res = modalMode === "create" ? await api("/vocabularies", "POST", postBody) : await api(`/vocabularies/${editId}`, "PUT", postBody);
      console.log("[Vocabulary Save] Response:", JSON.stringify(res));
      if (res?.error || res?.title || res?.errors) {
        const errMsg = res.error || res.title || JSON.stringify(res.errors);
        setError(errMsg);
        setIsSaving(false);
        return;
      }
      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa từ vựng này?")) return;
    await api(`/vocabularies/${id}`, "DELETE"); loadData();
  };

  const filtered = vocabs.filter(v => {
    const s = search.toLowerCase().trim();
    const matchSearch = !s ||
      v.word.toLowerCase().includes(s) ||
      v.meaning.toLowerCase().includes(s) ||
      v.reading.toLowerCase().includes(s);

    const matchLesson = filterLesson === "all" || String(v.lessonId) === filterLesson;

    const lessonOfVocab = lessons.find(l => String(l.lessonId) === String(v.lessonId));
    const matchLevel = filterLevel === "all" || String(lessonOfVocab?.levelId) === filterLevel;

    return matchSearch && matchLesson && matchLevel;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <BookA size={24} className="text-emerald-600" /> Quản Lý Từ Vựng
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý từ vựng theo bài học và cấp độ</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm từ vựng
          </button>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm kiếm từ vựng..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo text-sm" />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => {
              setFilterLevel(e.target.value);
              setFilterLesson("all");
            }}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo min-w-[160px] cursor-pointer"
          >
            <option value="all">Tất cả cấp độ</option>
            {levels.map(l => <option key={l.levelId} value={String(l.levelId)}>{l.levelName}</option>)}
          </select>

          <select
            value={filterLesson}
            onChange={(e) => setFilterLesson(e.target.value)}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo min-w-[200px] cursor-pointer"
          >
            <option value="all">Tất cả bài học</option>
            {availableLessons.map(l => (
              <option key={l.lessonId} value={String(l.lessonId)}>
                {l.lessonName}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><BookA size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có từ vựng nào</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider w-[50px]">ID</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Từ</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cách đọc</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Nghĩa</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Loại từ</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(v => (
                  <tr key={v.vocabularyId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-neutral-500">{v.vocabularyId}</td>
                    <td className="px-6 py-4 text-lg font-serif font-bold text-jp-indigo">{v.word}</td>
                    <td className="px-6 py-4 text-sm text-jp-red">{v.reading}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-[200px] truncate">{v.meaning}</td>
                    <td className="px-6 py-4 text-xs text-neutral-500">{v.partOfSpeech || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(v)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(v.vocabularyId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  <input type="text" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} placeholder="食べる"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm font-serif text-lg focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" autoFocus />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Cách đọc *</label>
                  <input type="text" value={form.reading} onChange={(e) => setForm({ ...form, reading: e.target.value })} placeholder="たべる"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Nghĩa *</label>
                <input type="text" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} placeholder="Ăn"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Loại từ</label>
                  <input type="text" value={form.partOfSpeech} onChange={(e) => setForm({ ...form, partOfSpeech: e.target.value })} placeholder="Động từ"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bài học *</label>
                  <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo">
                    <option value={0}>-- Chọn --</option>
                    {vocabLessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Ví dụ</label>
                <textarea value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} placeholder="毎日ご飯を食べます。"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Tải tệp âm thanh (.mp3)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/mp3, audio/mpeg, audio/wav, audio/m4a, audio/ogg"
                    onChange={handleAudioFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    id="audio-upload"
                    disabled={isSaving || isUploadingAudio}
                  />
                  <div className={`w-full px-4 py-3 border-2 border-dashed rounded-xl flex items-center gap-3 transition-colors ${
                    isUploadingAudio
                      ? 'border-jp-indigo/50 bg-jp-indigo/5'
                      : 'border-neutral-200 hover:border-jp-indigo/30 hover:bg-jp-indigo/5'
                  }`}>
                    {isUploadingAudio ? (
                      <div className="flex items-center gap-2 text-jp-indigo font-medium text-sm">
                        <Loader2 size={16} className="animate-spin" />
                        Đang tải lên...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-neutral-500 text-sm">
                        <Upload size={16} />
                        <span>{form.audioUrl ? "Chọn tệp khác để thay thế" : "Nhấn để chọn tệp .mp3"}</span>
                      </div>
                    )}
                  </div>
                </div>
                {form.audioUrl && !isUploadingAudio && (
                  <div className="mt-3 flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-100 p-3 rounded-xl">
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <Volume2 size={14} />
                      </div>
                      <audio src={resolveMediaUrl(form.audioUrl)} controls className="h-8 flex-1 max-w-[250px]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, audioUrl: "" }))}
                      className="p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors shrink-0"
                      title="Xóa âm thanh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
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