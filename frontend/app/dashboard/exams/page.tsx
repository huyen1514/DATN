"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";
import { ClipboardList, Plus, Edit2, Trash2, Search, X, Clock, Upload, DollarSign, Target, Info } from "lucide-react";

interface Level { levelId: number; levelName: string; }
interface Exam {
  examId: number;
  examName: string;
  duration: number;
  levelId: number;
  level?: Level;
  createdAt: string;
  price: number;
  passScaledTotal: number;
  passScaledVocabularyGrammar: number;
  passScaledReading: number;
  passScaledListening: number;
  passScaledVocabularyGrammarReading?: number | null;
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

  const [form, setForm] = useState({
    examName: "",
    duration: 60,
    levelId: 0,
    price: 50000,
    passScaledTotal: 90,
    passScaledVocabularyGrammar: 19,
    passScaledReading: 19,
    passScaledListening: 19,
    passScaledVocabularyGrammarReading: null as number | null
  });

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
    setForm({
      examName: "",
      duration: 60,
      levelId: levels[0]?.levelId || 0,
      price: 50000,
      passScaledTotal: 90,
      passScaledVocabularyGrammar: 19,
      passScaledReading: 19,
      passScaledListening: 19,
      passScaledVocabularyGrammarReading: null
    });
    setEditId(null); setError(""); setIsModalOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setModalMode("edit");
    setForm({
      examName: exam.examName,
      duration: exam.duration,
      levelId: exam.levelId,
      price: exam.price || 0,
      passScaledTotal: exam.passScaledTotal || 90,
      passScaledVocabularyGrammar: exam.passScaledVocabularyGrammar || 0,
      passScaledReading: exam.passScaledReading || 0,
      passScaledListening: exam.passScaledListening || 0,
      passScaledVocabularyGrammarReading: exam.passScaledVocabularyGrammarReading || null
    });
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-jp-indigo flex items-center gap-3">
              <div className="bg-orange-500 text-white p-2 rounded-xl"><ClipboardList size={24} /></div>
              Quản Lý Đề Thi
            </h1>
            <p className="text-neutral-400 text-sm mt-2 font-medium">Hệ thống quản lý và cấu hình đề thi JLPT</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/exams/import" className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black/5 text-jp-indigo rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm">
              <Upload size={16} /> Import JSON/PDF
            </Link>
            <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-jp-indigo text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-jp-red transition-all shadow-xl shadow-jp-indigo/20">
              <Plus size={16} /> Thêm đề thi mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-jp-indigo transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm tên đề thi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-black/5 rounded-[1.5rem] outline-none focus:border-jp-indigo transition-all font-medium"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
              className="px-6 py-4 bg-white border-2 border-black/5 rounded-[1.5rem] text-sm font-bold text-jp-indigo outline-none focus:border-jp-indigo transition-all min-w-[200px]"
            >
              <option value="all">Tất cả cấp độ</option>
              {levels.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-xl shadow-black/[0.02]">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 border-4 border-jp-indigo/10 border-t-jp-indigo rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-black text-neutral-300 uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardList size={40} className="text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-lg">Chưa có đề thi nào phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-black/5">
                    <th className="text-left px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Đề thi</th>
                    <th className="text-left px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Thông số</th>
                    <th className="text-left px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Giá & Điểm đạt</th>
                    <th className="text-left px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Thời gian tạo</th>
                    <th className="text-right px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filtered.map(exam => (
                    <tr key={exam.examId} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-jp-indigo/5 text-jp-indigo flex items-center justify-center font-black group-hover:bg-jp-indigo group-hover:text-white transition-all">
                            {exam.level?.levelName || '??'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-jp-indigo text-lg leading-tight">{exam.examName}</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Exam ID: {exam.examId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                            <Clock size={14} className="text-neutral-300" /> {exam.duration} phút
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                            JLPT {exam.level?.levelName}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-emerald-600">{(exam.price || 0).toLocaleString()}đ</span>
                          <span className="text-[10px] font-bold text-neutral-400">Đạt: <span className="text-jp-indigo">{exam.passScaledTotal || 0}/180</span></span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-neutral-400 font-medium">
                        {new Date(exam.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(exam)} className="p-3 text-neutral-400 hover:text-jp-indigo hover:bg-jp-indigo/5 rounded-xl transition-all"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(exam.examId)} className="p-3 text-neutral-400 hover:text-jp-red hover:bg-jp-red/5 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Modern & Compact */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-jp-indigo/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl my-8 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-jp-indigo to-jp-red" />
            <div className="px-10 py-8 border-b border-black/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-jp-indigo">{modalMode === "create" ? "Tạo Đề Thi Mới" : "Chỉnh Sửa Đề Thi"}</h2>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Cấu hình thông số bài thi chuẩn JLPT</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-neutral-100 text-neutral-400 hover:text-neutral-600 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-10">
              {error && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-3">
                <AlertTriangle size={18} /> {error}
              </div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Left Side: Basic Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4 text-jp-indigo">
                    <div className="bg-jp-indigo/10 p-2 rounded-lg"><Info size={16} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Thông tin cơ bản</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">Tên đề thi *</label>
                    <input type="text" value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} placeholder="VD: JLPT N5 Official 2024"
                      className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">Thời lượng (Phút)</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                        <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                          className="w-full pl-12 pr-5 py-3.5 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">Cấp độ</label>
                      <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: parseInt(e.target.value) })}
                        className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold">
                        <option value={0}>Chọn cấp độ</option>
                        {levels.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">Giá sở hữu (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                      <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                        className="w-full pl-12 pr-5 py-3.5 bg-neutral-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-jp-indigo transition-all font-bold text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* Right Side: Pass Marks */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4 text-jp-indigo">
                    <div className="bg-jp-indigo/10 p-2 rounded-lg"><Target size={16} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Ngưỡng điểm đạt (Scaled)</span>
                  </div>

                  <div className="bg-neutral-50 p-6 rounded-3xl space-y-5 border border-black/5">
                    <div>
                      <label className="block text-[10px] font-black text-jp-indigo uppercase tracking-widest mb-2">Tổng điểm đạt (0-180) *</label>
                      <input type="number" value={form.passScaledTotal} onChange={(e) => setForm({ ...form, passScaledTotal: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-black/5 rounded-xl font-black text-jp-indigo focus:border-jp-indigo outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Từ vựng/Ngữ pháp</label>
                        <input type="number" value={form.passScaledVocabularyGrammar} onChange={(e) => setForm({ ...form, passScaledVocabularyGrammar: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white border border-black/5 rounded-lg text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Đọc hiểu</label>
                        <input type="number" value={form.passScaledReading} onChange={(e) => setForm({ ...form, passScaledReading: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white border border-black/5 rounded-lg text-sm font-bold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Nghe hiểu</label>
                        <input type="number" value={form.passScaledListening} onChange={(e) => setForm({ ...form, passScaledListening: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white border border-black/5 rounded-lg text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-jp-red uppercase tracking-widest mb-1.5">Combo V/G/R (N4/N5)</label>
                        <input type="number" value={form.passScaledVocabularyGrammarReading || ''} onChange={(e) => setForm({ ...form, passScaledVocabularyGrammarReading: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Trống" className="w-full px-3 py-2 bg-white border border-black/5 rounded-lg text-sm font-bold" />
                      </div>
                    </div>
                    <p className="text-[9px] text-neutral-400 italic">Lưu ý: để trống Combo nếu đề thi chia làm 3 phần độc lập (N1-N3).</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border-2 border-black/5 text-neutral-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all">Hủy bỏ</button>
                <button disabled={isSaving} onClick={handleSave} className="flex-[2] py-4 bg-jp-indigo text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jp-red shadow-xl shadow-jp-indigo/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />}
                  {isSaving ? "Đang xử lý..." : modalMode === "create" ? "Tạo đề thi ngay" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
  )
}

function Loader2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
  )
}
