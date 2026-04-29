"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { FileText, Plus, Edit2, Trash2, Search, X, PlusCircle } from "lucide-react";

interface Lesson {
  lessonId: number;
  lessonName: string;
  levelName?: string;
  skillType?: string;
}

interface ReadingQuestion {
  readingQuestionId?: number;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
}

interface ReadingPassage {
  passageId: number;
  content: string;
  imageUrl?: string | null;
  lessonId: number;
  lesson?: Lesson;
  readingQuestions: ReadingQuestion[];
}

export default function AdminReading() {
  const [items, setItems] = useState<ReadingPassage[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLesson, setFilterLesson] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);

  // Form state hỗ trợ nhiều câu hỏi
  const [form, setForm] = useState<{
    content: string;
    lessonId: number;
    readingQuestions: ReadingQuestion[];
  }>({
    content: "",
    lessonId: 0,
    readingQuestions: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [rData, lData] = await Promise.all([api("/readings"), api("/lessons")]);
      if (Array.isArray(rData)) setItems(rData);
      if (Array.isArray(lData)) setLessons(lData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm({
      content: "",
      lessonId: lessons[0]?.lessonId || 0,
      readingQuestions: [
        { questionText: "", option1: "", option2: "", option3: "", option4: "", correctOption: 1 }
      ]
    });
    setEditId(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (item: ReadingPassage) => {
    setModalMode("edit");
    setForm({
      content: item.content,
      lessonId: item.lessonId,
      // Đảm bảo clone array để tránh tham chiếu trực tiếp
      readingQuestions: item.readingQuestions ? JSON.parse(JSON.stringify(item.readingQuestions)) : []
    });
    setEditId(item.passageId);
    setError("");
    setIsModalOpen(true);
  };

  // Các hàm xử lý form động (Dynamic form) cho Câu hỏi
  const handleAddQuestion = () => {
    setForm((prev) => ({
      ...prev,
      readingQuestions: [
        ...prev.readingQuestions,
        { questionText: "", option1: "", option2: "", option3: "", option4: "", correctOption: 1 }
      ]
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      readingQuestions: prev.readingQuestions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionChange = (index: number, field: keyof ReadingQuestion, value: any) => {
    setForm((prev) => {
      const newQuestions = [...prev.readingQuestions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, readingQuestions: newQuestions };
    });
  };

  const handleSave = async () => {
    if (!form.content.trim() || form.lessonId === 0) {
      setError("Vui lòng nhập nội dung bài đọc và chọn bài học.");
      return;
    }

    // Validate cơ bản cho các câu hỏi
    for (let i = 0; i < form.readingQuestions.length; i++) {
      const q = form.readingQuestions[i];
      if (!q.questionText.trim() || !q.option1.trim() || !q.option2.trim()) {
        setError(`Vui lòng nhập đủ câu hỏi và ít nhất 2 đáp án cho Câu số ${i + 1}`);
        return;
      }
    }

    setIsSaving(true);
    setError("");
    try {
      const res = modalMode === "create"
        ? await api("/readings", "POST", form)
        : await api(`/readings/${editId}`, "PUT", { passageId: editId, ...form });

      if (res?.error || res?.title) {
        setError(res.error || res.title);
        setIsSaving(false);
        return;
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      setError("Có lỗi xảy ra khi lưu dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bài đọc này và toàn bộ câu hỏi đi kèm?")) return;
    await api(`/readings/${id}`, "DELETE");
    loadData();
  };

  // Cập nhật logic filter để tìm kiếm cả trong nội dung đoạn văn lẫn các câu hỏi
  const filtered = items.filter(i => {
    const searchLower = search.toLowerCase();
    const matchSearch = i.content.toLowerCase().includes(searchLower) ||
      i.readingQuestions?.some(q => q.questionText.toLowerCase().includes(searchLower));
    const matchLesson = filterLesson === "all" || i.lessonId === filterLesson;
    return matchSearch && matchLesson;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <FileText size={24} className="text-indigo-600" /> Quản Lý Luyện Đọc
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý các đoạn văn và bộ câu hỏi trắc nghiệm</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors shadow-lg">
            <Plus size={16} /> Thêm bài đọc
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm kiếm nội dung bài đọc hoặc câu hỏi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select
            value={filterLesson}
            onChange={(e) => setFilterLesson(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[200px]"
          >
            <option value="all">Tất cả bài học</option>
            {lessons
              .filter(l => l.skillType === "Đọc hiểu")
              .map(l => (
                <option key={l.lessonId} value={l.lessonId}>
                  {l.lessonName} {l.levelName ? `(${l.levelName})` : ''}
                </option>
              ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500">Chưa có bài đọc nào</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map(item => (
                <div key={item.passageId} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full mb-3 inline-block">
                        {item.lesson?.lessonName || `Bài ${item.lessonId}`}
                      </span>

                      <div
                        className="text-sm text-neutral-700 mb-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-sm"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />

                      {/* Hiển thị danh sách câu hỏi con */}
                      {item.readingQuestions && item.readingQuestions.length > 0 && (
                        <div className="ml-4 space-y-2 border-l-2 border-neutral-200 pl-4">
                          {item.readingQuestions.map((q, idx) => (
                            <div key={q.readingQuestionId || idx} className="text-sm">
                              <span className="font-bold text-jp-indigo">Câu {idx + 1}: </span>
                              <span className="text-neutral-700">{q.questionText}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-6">
                      <button onClick={() => openEdit(item)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.passageId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Mở rộng form max-w-4xl vì cần không gian ngang cho các đáp án */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
              <h2 className="text-xl font-bold text-jp-indigo">{modalMode === "create" ? "Thêm Bài Đọc & Câu Hỏi" : "Sửa Bài Đọc"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              <div className="space-y-6">
                {/* Phần 1: Thông tin Bài đọc */}
                <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100 space-y-4">
                  <h3 className="font-bold text-neutral-700 mb-2">1. Nội dung đoạn văn</h3>
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Bài học *</label>
                    <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm">
                      <option value={0}>-- Chọn bài học --</option>
                      {lessons.map(l => <option key={l.lessonId} value={l.lessonId}>{l.lessonName} {l.levelName ? `(${l.levelName}${l.skillType ? ` - ${l.skillType}` : ''})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Đoạn văn (Có thể dùng HTML) *</label>
                    <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Nhập đoạn văn tiếng Nhật..."
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm resize-none h-32" />
                  </div>
                </div>

                {/* Phần 2: Danh sách câu hỏi */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-neutral-700">2. Danh sách câu hỏi trắc nghiệm</h3>
                    <button onClick={handleAddQuestion} className="flex items-center gap-1 text-sm text-indigo-600 font-bold hover:text-indigo-800">
                      <PlusCircle size={16} /> Thêm câu hỏi
                    </button>
                  </div>

                  <div className="space-y-4">
                    {form.readingQuestions.map((q, index) => (
                      <div key={index} className="relative bg-white border border-neutral-200 p-5 rounded-xl shadow-sm">
                        <div className="absolute right-4 top-4">
                          <button onClick={() => handleRemoveQuestion(index)} className="text-neutral-400 hover:text-red-500" title="Xóa câu hỏi này">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <label className="block text-sm font-bold text-jp-indigo mb-2">Câu {index + 1}</label>

                        <input type="text" value={q.questionText} onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                          placeholder="Nhập nội dung câu hỏi..." className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm mb-4" />

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <input type="text" value={q.option1} onChange={(e) => handleQuestionChange(index, "option1", e.target.value)} placeholder="Đáp án 1" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm" />
                          <input type="text" value={q.option2} onChange={(e) => handleQuestionChange(index, "option2", e.target.value)} placeholder="Đáp án 2" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm" />
                          <input type="text" value={q.option3} onChange={(e) => handleQuestionChange(index, "option3", e.target.value)} placeholder="Đáp án 3" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm" />
                          <input type="text" value={q.option4} onChange={(e) => handleQuestionChange(index, "option4", e.target.value)} placeholder="Đáp án 4" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm" />
                        </div>

                        <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                          <label className="text-sm font-bold text-indigo-700">Đáp án đúng là:</label>
                          <select value={q.correctOption} onChange={(e) => handleQuestionChange(index, "correctOption", parseInt(e.target.value))}
                            className="px-3 py-1 border border-indigo-200 rounded bg-white text-sm">
                            <option value={1}>Đáp án 1</option>
                            <option value={2}>Đáp án 2</option>
                            <option value={3}>Đáp án 3</option>
                            <option value={4}>Đáp án 4</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {form.readingQuestions.length === 0 && (
                      <div className="text-center p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500 text-sm">
                        Chưa có câu hỏi nào. Bấm "Thêm câu hỏi" để bắt đầu.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3 shrink-0 bg-white rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-50">Hủy bỏ</button>
              <button disabled={isSaving} onClick={handleSave} className="flex-1 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red disabled:opacity-50 transition-colors">
                {isSaving ? "Đang xử lý..." : modalMode === "create" ? "Lưu Bài Đọc" : "Cập nhật Bài Đọc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}