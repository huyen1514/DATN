"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    if (isOpen) {
      setFormData({
        frontText: "",
        hiraganaText: "",
        backText: "",
        example: "",
        audioUrl: "",
        ...initialData,
      });
      setOriginalData({
        frontText: "",
        hiraganaText: "",
        backText: "",
        example: "",
        audioUrl: "",
        ...initialData,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const hasChanges =
    JSON.stringify(formData) !== JSON.stringify(originalData);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.frontText.trim()) {
      newErrors.frontText = "Front text (Kanji) is required";
    }

    if (!formData.backText.trim()) {
      newErrors.backText = "Meaning (Vietnamese) is required";
    }

    if (formData.frontText.length > 500) {
      newErrors.frontText = "Front text must be less than 500 characters";
    }

    if (
      formData.hiraganaText &&
      formData.hiraganaText.length > 500
    ) {
      newErrors.hiraganaText = "Hiragana must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
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
  };

  const handleClose = () => {
    if (hasChanges && !window.confirm("You have unsaved changes. Close anyway?")) {
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-black/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-jp-indigo">
                  Edit Flashcard
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Front Text (Kanji) */}
                <div>
                  <label className="block text-sm font-semibold text-jp-indigo mb-2">
                    Front Text (Kanji/Japanese)
                    <span className="text-jp-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="frontText"
                    value={formData.frontText}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg font-serif text-lg focus:outline-none focus:ring-2 transition-shadow ${
                      errors.frontText
                        ? "border-jp-red focus:ring-jp-red"
                        : "border-black/10 focus:ring-jp-indigo"
                    }`}
                    placeholder="e.g., 漢字"
                    disabled={isLoading}
                  />
                  {errors.frontText && (
                    <p className="text-sm text-jp-red mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.frontText}
                    </p>
                  )}
                </div>

                {/* Hiragana */}
                <div>
                  <label className="block text-sm font-semibold text-jp-indigo mb-2">
                    Hiragana/Romaji (Reading)
                  </label>
                  <input
                    type="text"
                    name="hiraganaText"
                    value={formData.hiraganaText || ""}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg font-serif italic focus:outline-none focus:ring-2 transition-shadow ${
                      errors.hiraganaText
                        ? "border-jp-red focus:ring-jp-red"
                        : "border-black/10 focus:ring-jp-indigo"
                    }`}
                    placeholder="e.g., かんじ or kanji"
                    disabled={isLoading}
                  />
                  {errors.hiraganaText && (
                    <p className="text-sm text-jp-red mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.hiraganaText}
                    </p>
                  )}
                </div>

                {/* Back Text (Vietnamese) */}
                <div>
                  <label className="block text-sm font-semibold text-jp-indigo mb-2">
                    Meaning (Vietnamese)
                    <span className="text-jp-red">*</span>
                  </label>
                  <textarea
                    name="backText"
                    value={formData.backText}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-shadow resize-none h-24 ${
                      errors.backText
                        ? "border-jp-red focus:ring-jp-red"
                        : "border-black/10 focus:ring-jp-indigo"
                    }`}
                    placeholder="e.g., Kanji / Chữ có nguồn gốc từ Trung Quốc"
                    disabled={isLoading}
                  />
                  {errors.backText && (
                    <p className="text-sm text-jp-red mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.backText}
                    </p>
                  )}
                </div>

                {/* Example */}
                <div>
                  <label className="block text-sm font-semibold text-jp-indigo mb-2">
                    Example Sentence (Optional)
                  </label>
                  <textarea
                    name="example"
                    value={formData.example || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jp-indigo transition-shadow resize-none h-20"
                    placeholder="e.g., 「漢字」は中国から来た文字です"
                    disabled={isLoading}
                  />
                </div>

                {/* Audio URL */}
                <div>
                  <label className="block text-sm font-semibold text-jp-indigo mb-2">
                    Audio URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="audioUrl"
                    value={formData.audioUrl || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jp-indigo transition-shadow"
                    placeholder="https://example.com/audio.mp3"
                    disabled={isLoading}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t border-black/10">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-lg border border-black/10 text-jp-indigo hover:bg-black/5 transition-colors font-medium disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasChanges || isLoading}
                    className="flex-1 px-4 py-3 rounded-lg bg-jp-indigo text-white hover:bg-jp-red transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
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
