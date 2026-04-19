"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { api, uploadExamPdf, uploadExamPdfWithAnswerKey } from "@/lib/api";
import { AlertTriangle, ClipboardList, FileJson, FileText, Loader2, Upload, X } from "lucide-react";

type ImportExamRequest = {
  test_info: {
    test_id: string;
    title: string;
    level: string;
    total_duration_minutes: number;
    pass_marks?: Record<string, number>;
  };
  sections: Array<{
    section_id: string;
    section_name: string;
    jp_name?: string;
    duration_minutes?: number;
    mondai_list: Array<{
      mondai_id: string;
      mondai_number: number;
      instruction?: string;
      vn_instruction?: string;
      reading_passage?: string | null;
      audio_url?: string | null;
      questions: Array<{
        question_id: string;
        number: number;
        content: string;
        attachment?: string | null;
        options: Array<{ option_id: number; text: string }>;
        correct_option_id: number;
        explanation?: string | null;
      }>;
    }>;
  }>;
};

function safeJsonParse(text: string): { value: any; error?: string } {
  try {
    return { value: JSON.parse(text) };
  } catch (e: any) {
    return { value: null, error: e?.message || "JSON không hợp lệ" };
  }
}

function summarize(req: ImportExamRequest | null) {
  if (!req) return null;
  const mondaiCount = req.sections.reduce((acc, s) => acc + (s.mondai_list?.length || 0), 0);
  const questionCount = req.sections.reduce(
    (acc, s) =>
      acc +
      (s.mondai_list || []).reduce((a, m) => a + (m.questions?.length || 0), 0),
    0
  );
  return { mondaiCount, questionCount };
}

export default function ImportExamPage() {
  const router = useRouter();

  const [raw, setRaw] = useState<string>("");
  const [jsonFileName, setJsonFileName] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
  const [lastCreatedExamId, setLastCreatedExamId] = useState<number | null>(null);

  const parsed = useMemo(() => {
    if (!raw.trim()) return { req: null as ImportExamRequest | null, parseError: "" };
    const { value, error } = safeJsonParse(raw);
    if (error) return { req: null, parseError: error };
    return { req: value as ImportExamRequest, parseError: "" };
  }, [raw]);

  const stats = useMemo(() => summarize(parsed.req), [parsed.req]);

  const validate = (req: ImportExamRequest | null): string => {
    if (!req) return "Chưa có dữ liệu JSON";
    if (!req.test_info?.title) return "Thiếu `test_info.title`";
    if (!req.test_info?.level) return "Thiếu `test_info.level`";
    if (!Array.isArray(req.sections) || req.sections.length === 0) return "Thiếu `sections`";
    const hasMondai = req.sections.some((s) => Array.isArray(s.mondai_list) && s.mondai_list.length > 0);
    if (!hasMondai) return "Không có `mondai_list`";
    return "";
  };

  const handlePickFile = async (file: File | null) => {
    if (!file) return;
    setJsonFileName(file.name);
    setLastCreatedExamId(null);
    const text = await file.text();
    setRaw(text);
    setError("");
    setWarnings([]);
  };

  const handleImport = async () => {
    setLastCreatedExamId(null);
    setWarnings([]);
    if (parsed.parseError) {
      setError(parsed.parseError);
      return;
    }
    const msg = validate(parsed.req);
    if (msg) {
      setError(msg);
      return;
    }

    setIsImporting(true);
    setError("");
    try {
      const res = await api("/exams/import", "POST", parsed.req);
      if (res?.examId) {
        setLastCreatedExamId(res.examId);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else if (res?.error) {
        setError(res.error);
      } else {
        setError("Import thất bại (không nhận được ExamId).");
      }
    } catch (e) {
      setError("Có lỗi xảy ra khi import.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportPdf = async () => {
    if (!pdfFile) {
      setError("Vui lòng chọn file PDF.");
      return;
    }
    setLastCreatedExamId(null);
    setWarnings([]);
    setError("");
    setIsImportingPdf(true);
    try {
      const res = answerKeyFile
        ? await uploadExamPdfWithAnswerKey(pdfFile, answerKeyFile, false)
        : await uploadExamPdf(pdfFile, false);
      if (res?.value?.examId) {
        setLastCreatedExamId(res.value.examId);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else if (res?.examId) {
        setLastCreatedExamId(res.examId);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else if (res?.error) {
        setError(res.error);
      } else if (res?.message) {
        setError(res.message);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else {
        setError("Import PDF thất bại.");
      }
    } catch {
      setError("Có lỗi xảy ra khi import PDF.");
    } finally {
      setIsImportingPdf(false);
    }
  };

  const handlePreviewPdfToJson = async () => {
    if (!pdfFile) {
      setError("Vui lòng chọn file PDF.");
      return;
    }
    setLastCreatedExamId(null);
    setWarnings([]);
    setError("");
    setIsPreviewingPdf(true);
    try {
      const res = answerKeyFile
        ? await uploadExamPdfWithAnswerKey(pdfFile, answerKeyFile, true)
        : await uploadExamPdf(pdfFile, true);

      const draft = res?.Draft ?? res?.draft;
      if (draft) {
        setRaw(JSON.stringify(draft, null, 2));
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
        setJsonFileName("(draft từ PDF)");
      } else if (res?.error) {
        setError(res.error);
      } else if (res?.message) {
        setError(res.message);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else {
        setError("Không thể tạo draft JSON từ PDF.");
      }
    } catch {
      setError("Có lỗi xảy ra khi preview PDF.");
    } finally {
      setIsPreviewingPdf(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
            <Upload size={22} className="text-orange-600" /> Import đề thi (JSON / PDF)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            JSON: chính xác nhất. PDF: hệ thống parse text và phân loại tự động (cần rà soát đáp án trước khi dùng chính thức).
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5" />
            <div className="text-sm font-medium">{error}</div>
            <button onClick={() => setError("")} className="ml-auto text-red-500/70 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
            <div className="text-sm font-bold mb-2">Cảnh báo parser</div>
            <ul className="text-xs space-y-1 list-disc ml-4">
              {warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}
              {warnings.length > 8 && <li>... và {warnings.length - 8} cảnh báo khác</li>}
            </ul>
          </div>
        )}

        {lastCreatedExamId != null && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center gap-3">
            <ClipboardList size={18} />
            <div className="text-sm font-semibold">
              Import thành công. ExamId: <span className="font-black">{lastCreatedExamId}</span>
            </div>
            <button
              onClick={() => router.push(`/exams/${lastCreatedExamId}`)}
              className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              Mở đề
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white border border-black/5 rounded-3xl shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-jp-indigo">
                  <FileText size={16} /> Import từ PDF
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-jp-indigo text-white text-sm font-bold hover:bg-jp-red transition-colors">
                  <Upload size={16} /> Chọn PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setPdfFile(f);
                      setLastCreatedExamId(null);
                      setWarnings([]);
                    }}
                  />
                </label>
              </div>
              <div className="p-5">
                <div className="text-sm text-neutral-600 mb-3">
                  File: <span className="font-semibold text-neutral-800">{pdfFile?.name || "(chưa chọn)"}</span>
                </div>
                <div className="text-sm text-neutral-600 mb-4">
                  Answer key (PDF/TXT):{" "}
                  <span className="font-semibold text-neutral-800">{answerKeyFile?.name || "(tuỳ chọn)"}</span>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-200 text-jp-indigo text-sm font-bold hover:bg-neutral-50 transition-colors mb-4">
                  <Upload size={14} /> Chọn Answer Key
                  <input
                    type="file"
                    accept="application/pdf,.pdf,text/plain,.txt"
                    className="hidden"
                    onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handlePreviewPdfToJson}
                    disabled={isPreviewingPdf || !pdfFile}
                    className="py-3 rounded-2xl bg-white border border-jp-indigo text-jp-indigo font-bold text-sm hover:bg-jp-indigo/5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isPreviewingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
                    {isPreviewingPdf ? "Đang parse draft..." : "Preview/Edit trước khi publish"}
                  </button>
                  <button
                    onClick={handleImportPdf}
                    disabled={isImportingPdf || !pdfFile}
                    className="py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isImportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {isImportingPdf ? "Đang đọc PDF & import..." : "Import PDF trực tiếp"}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                  Gợi ý: dùng nút Preview để parse thành JSON, chỉnh sửa lại rồi mới publish. PDF scan/ảnh cần OCR để chính xác.
                </p>
              </div>
            </div>

            <div className="bg-white border border-black/5 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-jp-indigo">
                  <FileJson size={16} /> Dữ liệu JSON
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-jp-indigo text-white text-sm font-bold hover:bg-jp-red transition-colors">
                  <Upload size={16} /> Chọn file
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {jsonFileName && (
                <div className="px-5 py-3 text-xs text-neutral-500 border-b border-black/5">
                  File: <span className="font-semibold text-neutral-700">{jsonFileName}</span>
                </div>
              )}

              <div className="p-5">
                <textarea
                  value={raw}
                  onChange={(e) => {
                    setRaw(e.target.value);
                    setLastCreatedExamId(null);
                  }}
                  placeholder="Dán JSON vào đây..."
                  className="w-full h-[420px] font-mono text-[12px] leading-relaxed p-4 rounded-2xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-jp-indigo/20"
                />
                {parsed.parseError && (
                  <div className="mt-3 text-sm text-red-600 font-semibold">
                    JSON parse error: <span className="font-mono">{parsed.parseError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-black/5 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-black/5">
                <div className="text-sm font-bold text-jp-indigo">Preview</div>
                <div className="text-xs text-neutral-500 mt-1">Kiểm tra nhanh trước khi import.</div>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Test info</div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-neutral-500">Title:</span>{" "}
                      <span className="font-bold text-neutral-800">{parsed.req?.test_info?.title || "-"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Level:</span>{" "}
                      <span className="font-bold text-jp-indigo">{parsed.req?.test_info?.level || "-"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Duration:</span>{" "}
                      <span className="font-bold text-neutral-800">{parsed.req?.test_info?.total_duration_minutes ?? "-"}</span>
                      <span className="text-neutral-500"> phút</span>
                    </div>
                    <div className="pt-2 text-xs text-neutral-500">
                      Pass marks:{" "}
                      <span className="font-mono">
                        {parsed.req?.test_info?.pass_marks ? JSON.stringify(parsed.req.test_info.pass_marks) : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Sections</div>
                    <div className="text-2xl font-black text-violet-800 mt-1">{parsed.req?.sections?.length ?? 0}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Mondai</div>
                    <div className="text-2xl font-black text-amber-800 mt-1">{stats?.mondaiCount ?? 0}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 col-span-2">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Questions</div>
                    <div className="text-3xl font-black text-emerald-800 mt-1">{stats?.questionCount ?? 0}</div>
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-jp-indigo to-jp-red text-white font-black text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isImporting ? "Đang import..." : "Import vào hệ thống"}
                </button>

                <div className="text-xs text-neutral-500 leading-relaxed">
                  Lưu ý: endpoint sẽ tự tạo `Exam` + `ExamQuestion`. Với đề JLPT official (N5 2018) có thể dùng ngưỡng
                  2 phần (120 + 60) từ `pass_marks`.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

