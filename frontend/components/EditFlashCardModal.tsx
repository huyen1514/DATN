"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Upload, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadAudio, resolveMediaUrl } from "@/lib/api";

interface EditFlashCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditFlashCardData) => Promise<void>;
  initialData?: Partial<EditFlashCardData>;
  isLoading?: boolean;
}

export interface EditFlashCardData {
  frontText: string;
  hiraganaText?: string;
  backText: string;
  example?: string;
  audioUrl?: string;
}

export default function EditFlashCardModal({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  isLoading = false,
}: EditFlashCardModalProps) {
  const [formData, setFormData] = useState<EditFlashCardData>({
    frontText: "",
    hiraganaText: "",
    backText: "",
    example: "",
    audioUrl: "",
    ...initialData,
  });

  const [originalData, setOriginalData] = useState(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const newData = {
        frontText: "",
        hiraganaText: "",
        backText: "",
        example: "",
        audioUrl: "",
        ...initialData,
      };
      setFormData(newData);
      setOriginalData(newData);
      setErrors({});
    }
  }, [isOpen, JSON.stringify(initialData)]);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
  const isEditing = Object.keys(initialData).length > 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.frontText.trim()) {
      newErrors.frontText = "Vui lòng nhập từ vựng (Mặt trước)";
    }

    if (!formData.backText.trim()) {
      newErrors.backText = "Vui lòng nhập nghĩa (Mặt sau)";
    }

    if (formData.frontText.length > 500) {
      newErrors.frontText = "Từ vựng không được vượt quá 500 ký tự";
    }

    if (formData.hiraganaText && formData.hiraganaText.length > 500) {
      newErrors.hiraganaText = "Cách đọc không được vượt quá 500 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving flashcard:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleClose = () => {
    if (hasChanges && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?")) {
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (z-[9998] để đè lên Navbar) */}
          <motion.div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal Container (z-[9999]) */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
          >
            {/* Modal Card - Cấu trúc Flex Column để giới hạn chiều cao và scroll nội dung */}
            <motion.div
              className="bg-white rounded-[2rem] shadow-2xl shadow-[#B91C1C]/10 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* --- HEADER (Cố định) --- */}
              <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
                <div>
                  <p className="text-[#B91C1C] font-bold text-[10px] tracking-[0.2em] mb-1.5 uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] inline-block"></span>
                    {isEditing ? "編集" : "新しい"}
                  </p>
                  <h2 className="text-2xl font-serif text-neutral-800">
                    {isEditing ? "Chỉnh Sửa Thẻ" : "Tạo Thẻ Mới"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>

              {/* --- FORM WRAPPER --- */}
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

                {/* --- BODY CONTAIN INPUTS (Cuộn được) --- */}
                <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-white">

                  {/* Front Text */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">
                      Mặt trước (Kanji / Tiếng Nhật) <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="text"
                      name="frontText"
                      value={formData.frontText}
                      onChange={handleChange}
                      className={`w-full px-5 py-3.5 bg-neutral-50 border rounded-2xl outline-none transition-all text-neutral-800 text-lg font-serif placeholder:font-sans placeholder:text-base placeholder:text-neutral-300 ${errors.frontText ? "border-red-400 focus:border-red-500 bg-red-50" : "border-neutral-100 focus:border-[#B91C1C] focus:bg-white"
                        }`}
                      placeholder="VD: 漢字"
                      disabled={isLoading}
                      autoFocus
                    />
                    {errors.frontText && (
                      <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1 font-medium">
                        <AlertCircle size={14} /> {errors.frontText}
                      </p>
                    )}
                  </div>

                  {/* Hiragana */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">
                      Cách đọc (Hiragana / Romaji)
                    </label>
                    <input
                      type="text"
                      name="hiraganaText"
                      value={formData.hiraganaText || ""}
                      onChange={handleChange}
                      className={`w-full px-5 py-3.5 bg-neutral-50 border rounded-2xl outline-none transition-all text-neutral-600 font-medium placeholder:font-normal placeholder:text-neutral-300 ${errors.hiraganaText ? "border-red-400 focus:border-red-500 bg-red-50" : "border-neutral-100 focus:border-[#B91C1C] focus:bg-white"
                        }`}
                      placeholder="VD: かんじ"
                      disabled={isLoading}
                    />
                    {errors.hiraganaText && (
                      <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1 font-medium">
                        <AlertCircle size={14} /> {errors.hiraganaText}
                      </p>
                    )}
                  </div>

                  {/* Back Text */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">
                      Mặt sau (Nghĩa Tiếng Việt) <span className="text-[#B91C1C]">*</span>
                    </label>
                    <textarea
                      name="backText"
                      value={formData.backText}
                      onChange={handleChange}
                      className={`w-full px-5 py-3.5 bg-neutral-50 border rounded-2xl outline-none transition-all resize-none h-28 text-neutral-800 placeholder:text-neutral-300 ${errors.backText ? "border-red-400 focus:border-red-500 bg-red-50" : "border-neutral-100 focus:border-[#B91C1C] focus:bg-white"
                        }`}
                      placeholder="VD: Chữ Hán / Chữ có nguồn gốc từ Trung Quốc"
                      disabled={isLoading}
                    />
                    {errors.backText && (
                      <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1 font-medium">
                        <AlertCircle size={14} /> {errors.backText}
                      </p>
                    )}
                  </div>

                  {/* Example */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">
                      Câu ví dụ (Tùy chọn)
                    </label>
                    <textarea
                      name="example"
                      value={formData.example || ""}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:border-[#B91C1C] focus:bg-white transition-all resize-none h-24 text-neutral-600 placeholder:text-neutral-300"
                      placeholder="VD: 「漢字」は中国から来た文字です"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Audio Upload */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">
                      File âm thanh (Tùy chọn)
                    </label>

                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/mp3, audio/wav, audio/m4a, audio/ogg"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setIsUploadingAudio(true);
                          try {
                            const data = await uploadAudio(file);
                            setFormData(prev => ({ ...prev, audioUrl: data.url }));
                          } catch (error) {
                            console.error("Audio upload error:", error);
                            alert("Có lỗi khi tải lên âm thanh.");
                          } finally {
                            setIsUploadingAudio(false);
                            e.target.value = "";
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        disabled={isLoading || isUploadingAudio}
                      />
                      <div className={`w-full px-5 py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-colors ${isUploadingAudio ? 'border-[#B91C1C]/50 bg-[#B91C1C]/5' : 'border-neutral-200 bg-neutral-50 hover:border-[#B91C1C]/50 hover:bg-[#B91C1C]/5'}`}>
                        {isUploadingAudio ? (
                          <div className="flex items-center gap-2 text-[#B91C1C] font-medium">
                            <div className="w-4 h-4 border-2 border-[#B91C1C]/30 border-t-[#B91C1C] rounded-full animate-spin"></div>
                            Đang tải lên...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Upload size={18} />
                            <span className="font-medium">Nhấn để tải file Audio lên</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.audioUrl && !isUploadingAudio && (
                      <div className="mt-3 flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-100 p-3 rounded-2xl">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#B91C1C] shadow-sm shrink-0">
                            <Volume2 size={18} />
                          </div>
                          <audio src={resolveMediaUrl(formData.audioUrl)} controls className="h-8 flex-1 max-w-[250px]" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, audioUrl: "" }))}
                          className="p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors shrink-0"
                          title="Xóa âm thanh"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* --- FOOTER (Cố định ở dưới cùng) --- */}
                <div className="px-8 py-5 bg-neutral-50/80 border-t border-neutral-100 flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-neutral-50 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!hasChanges || isLoading}
                    className="flex-1 py-3.5 bg-[#B91C1C] text-white rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-[#991B1B] transition-colors disabled:opacity-50 disabled:bg-neutral-300 shadow-lg shadow-[#B91C1C]/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      isEditing ? "Lưu Thay Đổi" : "Tạo Mới"
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}