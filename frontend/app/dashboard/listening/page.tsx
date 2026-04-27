"use client";

import { useEffect, useState } from "react";
import { uploadAudio, uploadImage, api, API_URL } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Headphones, Plus, Edit2, Trash2, Search, X, Upload, Image as ImageIcon, PlayCircle, XCircle } from "lucide-react";

/* Định nghĩa BACKEND_URL từ API_URL */
const BACKEND_URL = API_URL.replace(/\/api$/, "");

/* Hàm helper để nối URL cho ảnh và âm thanh */
const getFullUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
};

interface Lesson { lessonId: number; lessonName: string; levelName?: string; skillType?: string; }
interface Listening {
  listeningId: number;
  audioUrl: string;
  imageUrl?: string;
  transcript: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  lessonId: number;
  lesson?: Lesson;
}

export default function AdminListening() {
  const [items, setItems] = useState<Listening[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    audioUrl: "", imageUrl: "", transcript: "", question: "",
    optionA: "1", optionB: "2", optionC: "3", optionD: "4",
    correctAnswer: "A", lessonId: 0
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [lData, lessonData] = await Promise.all([api("/listenings"), api("/lessons")]);
      if (Array.isArray(lData)) setItems(lData);
      if (Array.isArray(lessonData)) setLessons(lessonData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({
      audioUrl: "", imageUrl: "", transcript: "", question: "",
      optionA: "1", optionB: "2", optionC: "3", optionD: "4",
      correctAnswer: "A", lessonId: lessons[0]?.lessonId || 0
    });
    setSelectedFile(null);
    setSelectedImageFile(null);
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (item: Listening) => {
    setModalMode("edit");
    setForm({
      audioUrl: item.audioUrl || "", imageUrl: item.imageUrl || "", transcript: item.transcript || "",
      question: item.question || "", optionA: item.optionA, optionB: item.optionB,
      optionC: item.optionC, optionD: item.optionD, correctAnswer: item.correctAnswer,
      lessonId: item.lessonId
    });
    setSelectedFile(null);
    setSelectedImageFile(null);
    setEditId(item.listeningId); setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { setError("Vui lòng nhập nội dung câu hỏi"); return; }
    if (modalMode === "create" && !selectedFile && !form.audioUrl) {
      setError("Vui lòng tải lên file Audio"); return;
    }

    setIsSaving(true); setError("");
    try {
      let finalAudioUrl = form.audioUrl;
      let finalImageUrl = form.imageUrl;

      if (selectedFile) {
        try {
          const uploadRes = await uploadAudio(selectedFile);
          finalAudioUrl = uploadRes.url;
        } catch (e: any) {
          setError("Lỗi khi tải file audio: " + e.message);
          setIsSaving(false); return;
        }
      }

      if (selectedImageFile) {
        try {
          const uploadRes = await uploadImage(selectedImageFile);
          finalImageUrl = uploadRes.url;
        } catch (e: any) {
          setError("Lỗi khi tải ảnh: " + e.message);
          setIsSaving(false); return;
        }
      }

      // THÊM LISTENING ID VÀO REQUEST BODY KHI CHỈNH SỬA ĐỂ TRÁNH LỖI 400 TỪ .NET
      const postBody = {
        ...form,
        audioUrl: finalAudioUrl,
        imageUrl: finalImageUrl,
        ...(modalMode === "edit" ? { listeningId: editId } : {})
      };

      const res = modalMode === "create"
        ? await api("/listenings", "POST", postBody)
        : await api(`/listenings/${editId}`, "PUT", postBody);

      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }

      setIsModalOpen(false); loadData();
    } catch (e) { setError("Có lỗi xảy ra khi lưu"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa câu hỏi nghe này? Thao tác không thể hoàn tác.")) return;
    await api(`/listenings/${id}`, "DELETE"); loadData();
  };

  const filtered = items.filter(i => {
    const searchLower = search.toLowerCase();
    const matchSearch = (i.question || "").toLowerCase().includes(searchLower) || (i.transcript || "").toLowerCase().includes(searchLower);
    const matchLesson = filterLesson === "all" || i.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <Headphones size={24} className="text-cyan-600" /> Quản Lý Luyện Nghe
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý file âm thanh, hình ảnh và câu hỏi trắc nghiệm</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm bài nghe
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm theo câu hỏi hoặc transcript..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterLesson} onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]">
            <option value="all">Tất cả bài học</option>
            {lessons.filter(l => l.skillType === "Nghe hiểu" || !l.skillType).map(l => (
              <option key={l.lessonId} value={l.lessonId}>
                {l.lessonName} {l.levelName ? `(${l.levelName}${l.skillType ? ` - ${l.skillType}` : ''})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Headphones size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500">Chưa có bài nghe nào</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map((item, index) => (
                <div key={item.listeningId} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row items-start gap-6">

                    {/* KHU VỰC MEDIA BÊN TRÁI - ĐÃ SỬA LẠI URL */}
                    <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
                      {item.imageUrl ? (
                        <div className="w-full h-32 rounded-xl border border-black/10 bg-white flex items-center justify-center overflow-hidden">
                          <img src={getFullUrl(item.imageUrl)} alt="minh họa" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-xl border border-black/5 border-dashed bg-neutral-50 flex flex-col items-center justify-center text-neutral-400">
                          <ImageIcon size={24} className="mb-2 opacity-30" />
                          <span className="text-[10px]">Không có ảnh</span>
                        </div>
                      )}
                      {item.audioUrl && (
                        <audio controls src={getFullUrl(item.audioUrl)} className="w-full h-10" />
                      )}
                    </div>

                    {/* NỘI DUNG CÂU HỎI */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold bg-cyan-50 text-cyan-600 px-3 py-1 rounded-md tracking-wider">
                          {item.lesson?.lessonName || `Bài ${item.lessonId}`}
                        </span>
                        <span className="text-xs font-bold bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-md">
                          Đáp án: {item.correctAnswer}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-jp-indigo mb-3 line-clamp-2">{item.question}</p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <span className={item.correctAnswer === 'A' ? 'font-bold text-green-600' : ''}>A. {item.optionA}</span>
                        <span className={item.correctAnswer === 'B' ? 'font-bold text-green-600' : ''}>B. {item.optionB}</span>
                        <span className={item.correctAnswer === 'C' ? 'font-bold text-green-600' : ''}>C. {item.optionC}</span>
                        <span className={item.correctAnswer === 'D' ? 'font-bold text-green-600' : ''}>D. {item.optionD}</span>
                      </div>

                      {item.transcript && (
                        <div className="mt-3 text-xs text-neutral-500 bg-white border border-neutral-100 p-3 rounded-lg line-clamp-1 italic cursor-help" title={item.transcript}>
                          <span className="font-bold text-neutral-400 not-italic mr-1">Script:</span> {item.transcript}
                        </div>
                      )}
                    </div>

                    {/* NÚT ACTION */}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button onClick={() => openEdit(item)} className="p-2.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.listeningId)} className="p-2.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center"><PlayCircle size={20} /></div>
                <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Bài Nghe Mới" : "Chỉnh Sửa Bài Nghe"}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2"><XCircle className="shrink-0 mt-0.5" size={16} /> {error}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* CỘT TRÁI: UPLOAD MEDIA & THÔNG TIN CHUNG (5 cột) */}
                <div className="lg:col-span-5 space-y-6">

                  {/* Chọn bài học */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2">Thuộc Bài học *</label>
                    <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">
                      <option value={0}>-- Chọn bài học --</option>
                      {lessons.filter(l => l.skillType === "Nghe hiểu" || !l.skillType).map(l => (
                        <option key={l.lessonId} value={l.lessonId}>
                          {l.lessonName} {l.levelName ? `(${l.levelName}${l.skillType ? ` - ${l.skillType}` : ''})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Upload Audio - ĐÃ SỬA LẠI URL TRONG MODAL */}
                  <div className="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100">
                    <label className="block text-[11px] font-bold tracking-wider text-cyan-800 uppercase mb-3 flex items-center gap-2">
                      <Headphones size={14} /> Tệp âm thanh (.mp3) *
                    </label>
                    <input type="file" accept="audio/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="audio-upload" />
                    <label htmlFor="audio-upload" className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-cyan-200 bg-white rounded-xl text-sm text-cyan-700 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-all mb-3 group">
                      <Upload size={18} className="text-cyan-400 group-hover:text-cyan-600 transition-colors" />
                      {selectedFile ? <span className="font-bold truncate">{selectedFile.name}</span> : <span className="font-medium">{form.audioUrl ? "Thay đổi File Audio" : "Chọn tệp MP3 tải lên"}</span>}
                    </label>
                    {(selectedFile || form.audioUrl) && (
                      <audio controls src={selectedFile ? URL.createObjectURL(selectedFile) : getFullUrl(form.audioUrl)} className="w-full h-10 rounded-lg" />
                    )}
                  </div>

                  {/* Upload Ảnh - ĐÃ SỬA LẠI URL TRONG MODAL */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-2">
                      <ImageIcon size={14} /> Ảnh minh họa (Không bắt buộc)
                    </label>
                    <input type="file" accept="image/*" onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-neutral-200 rounded-2xl text-sm text-neutral-500 cursor-pointer hover:border-jp-indigo/40 bg-neutral-50 hover:bg-white transition-all h-40">
                      {selectedImageFile || form.imageUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center group">
                          <img src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : getFullUrl(form.imageUrl)} alt="preview" className="max-w-full max-h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs gap-1"><Upload size={14} /> Thay ảnh</div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 mb-1"><Upload size={16} className="text-neutral-400" /></div>
                          <span>Nhấp để tải ảnh lên</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* CỘT PHẢI: NỘI DUNG CÂU HỎI & ĐÁP ÁN (7 cột) */}
                <div className="lg:col-span-7 space-y-6">

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Nội dung câu hỏi *</label>
                    <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="VD: Câu hỏi nghe số 1..."
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-[15px] resize-none h-20 outline-none focus:ring-2 focus:ring-jp-indigo/20 focus:border-jp-indigo transition-all" />
                  </div>

                  <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-600 uppercase mb-4">Các lựa chọn đáp án</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-neutral-200 rounded text-xs font-bold flex items-center justify-center text-neutral-500 shadow-sm">{opt}</span>
                          <input type="text"
                            value={(form as any)[`option${opt}`]}
                            onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                            className="w-full pl-12 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-jp-indigo bg-white transition-colors" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-5 border-t border-neutral-200/60 flex items-center gap-4">
                      <label className="text-sm font-bold text-green-700 whitespace-nowrap">Đáp án chuẩn xác:</label>
                      <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-green-200 bg-green-50 text-green-800 rounded-xl text-sm font-bold outline-none focus:border-green-400 cursor-pointer">
                        <option value="A">Đáp án A</option>
                        <option value="B">Đáp án B</option>
                        <option value="C">Đáp án C</option>
                        <option value="D">Đáp án D</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-2 flex justify-between">
                      <span>Bản dịch / Script (Không bắt buộc)</span>
                    </label>
                    <textarea value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} placeholder="Nội dung lời thoại để người học xem lại sau khi nghe xong..."
                      className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl text-sm resize-y min-h-[100px] outline-none focus:bg-white focus:border-jp-indigo transition-all" />
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-neutral-300 bg-white text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors shadow-sm">Thoát</button>
              <button disabled={isSaving} onClick={handleSave} className="px-8 py-2.5 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Thêm mới câu hỏi" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}