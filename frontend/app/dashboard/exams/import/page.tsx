"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { AlertTriangle, FileJson, Loader2, Upload, X, CheckCircle, Info, ArrowRight, Layers } from "lucide-react";

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
  const [error, setError] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
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
    if (parsed.parseError) { setError(parsed.parseError); return; }
    const msg = validate(parsed.req);
    if (msg) { setError(msg); return; }

    setIsImporting(true);
    setError("");
    try {
      const res = await api("/exams/import-json-body", "POST", parsed.req);
      if (res?.examId) {
        setLastCreatedExamId(res.examId);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else if (res?.error) {
        setError(res.error);
      } else if (res?.Message || res?.message) {
        setError(res?.Message || res?.message);
        setWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      } else {
        setError("Import thất bại (không nhận được ExamId).");
      }
    } catch (e) {
      setError("Có lỗi xảy ra khi import.");
    } finally {
      setIsImporting(false);
    }
  };


  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-jp-indigo flex items-center gap-3">
            <div className="bg-orange-500 text-white p-2 rounded-xl"><Upload size={24} /></div>
            Import Đề Thi JLPT
          </h1>
          <p className="text-neutral-400 text-sm mt-2 font-medium">Hỗ trợ nhập liệu từ file JSON chuẩn.</p>
        </div>

        {error && (
          <div className="mb-8 p-5 rounded-3xl bg-red-50 border-2 border-red-100 text-red-700 flex items-start gap-4 shadow-lg shadow-red-500/5 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle size={24} className="shrink-0 mt-0.5" />
            <div className="flex-1">
               <h4 className="font-black text-sm uppercase tracking-widest mb-1">Đã xảy ra lỗi</h4>
               <p className="text-sm font-bold opacity-80 leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError("")} className="bg-white/50 p-2 rounded-xl hover:bg-white transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-8 p-5 rounded-3xl bg-amber-50 border-2 border-amber-100 text-amber-800 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3 mb-3">
               <Info size={20} className="text-amber-500" />
               <h4 className="text-xs font-black uppercase tracking-widest">Cảnh báo Parser ({warnings.length})</h4>
            </div>
            <ul className="text-xs font-bold space-y-1.5 list-disc ml-5 opacity-70">
              {warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
              {warnings.length > 5 && <li className="list-none pt-1">... và {warnings.length - 5} cảnh báo khác</li>}
            </ul>
          </div>
        )}

        {lastCreatedExamId != null && (
          <div className="mb-8 p-6 rounded-[2.5rem] bg-emerald-50 border-2 border-emerald-100 text-emerald-800 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-emerald-500/5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
               <CheckCircle size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black mb-1">Import thành công!</h3>
              <p className="font-bold opacity-70">Đề thi mới đã được tạo với ID: <span className="text-jp-indigo font-black">#{lastCreatedExamId}</span></p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => router.push(`/dashboard/exams/${lastCreatedExamId}/questions`)} className="px-6 py-3 bg-white border-2 border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                 Quản lý câu hỏi <ArrowRight size={14} />
               </button>
               <button onClick={() => window.open(`/exams/${lastCreatedExamId}`, '_blank')} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-emerald-500/20 flex items-center gap-2">Xem thử</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* JSON Editor */}
          <div className="space-y-6">
             <div className="bg-white border border-black/5 rounded-[2.5rem] shadow-xl shadow-black/[0.02] overflow-hidden flex flex-col h-full">
                <div className="p-8 border-b border-black/5 flex items-center justify-between bg-neutral-50/30">
                   <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 text-white p-2 rounded-xl"><FileJson size={20} /></div>
                      <span className="text-sm font-black uppercase tracking-widest text-jp-indigo">Dữ liệu JSON</span>
                   </div>
                   <label className="cursor-pointer px-6 py-2.5 bg-jp-indigo text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-jp-red transition-all shadow-lg shadow-jp-indigo/20">
                      Tải File JSON
                      <input type="file" accept=".json" className="hidden" onChange={(e) => handlePickFile(e.target.files?.[0] || null)} />
                   </label>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                   <div className="flex-1 relative">
                      <textarea 
                        value={raw}
                        onChange={(e) => { setRaw(e.target.value); setLastCreatedExamId(null); }}
                        placeholder="Dán dữ liệu JSON hoặc tải từ file..."
                        className="w-full h-[500px] bg-neutral-900 text-emerald-400 font-mono text-[11px] p-8 rounded-3xl outline-none focus:ring-4 focus:ring-jp-indigo/5 transition-all scrollbar-thin scrollbar-thumb-white/10"
                      />
                      {jsonFileName && (
                        <div className="absolute top-4 right-4 bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg backdrop-blur-md">
                          File: {jsonFileName}
                        </div>
                      )}
                   </div>

                   <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-neutral-50 rounded-3xl p-6 border border-black/5">
                         <div className="flex items-center gap-2 mb-4">
                            <Layers size={14} className="text-jp-indigo" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Xem trước thông số</span>
                         </div>
                         <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                               <span className="text-[9px] font-black text-neutral-300 uppercase block mb-1">Tên đề thi</span>
                               <span className="text-xs font-bold text-jp-indigo truncate block">{parsed.req?.test_info?.title || '-'}</span>
                            </div>
                            <div>
                               <span className="text-[9px] font-black text-neutral-300 uppercase block mb-1">Cấp độ</span>
                               <span className="text-xs font-bold text-jp-indigo">{parsed.req?.test_info?.level || '-'}</span>
                            </div>
                            <div>
                               <span className="text-[9px] font-black text-neutral-300 uppercase block mb-1">Số phần</span>
                               <span className="text-xs font-bold text-jp-indigo">{parsed.req?.sections?.length || 0} PHẦN</span>
                            </div>
                            <div>
                               <span className="text-[9px] font-black text-neutral-300 uppercase block mb-1">Tổng câu hỏi</span>
                               <span className="text-xs font-bold text-emerald-600 font-black">{stats?.questionCount || 0} CÂU</span>
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleImport}
                        disabled={isImporting || !raw.trim()}
                        className="h-full bg-jp-indigo text-white rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-jp-red transition-all shadow-xl shadow-jp-indigo/20 disabled:opacity-50"
                      >
                        {isImporting ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{isImporting ? 'Đang xử lý...' : 'Publish Ngay'}</span>
                      </button>
                   </div>

                     {/* Xem trước nội dung */}
                     {parsed.req?.sections && parsed.req.sections.length > 0 && (
                       <div className="mt-8 bg-neutral-50 rounded-3xl p-6 border border-black/5 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-black/10">
                         <div className="flex items-center gap-2 mb-4 sticky top-0 bg-neutral-50 pb-2 z-10">
                            <FileJson size={14} className="text-jp-indigo" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Xem trước Cấu trúc</span>
                         </div>
                         <div className="space-y-6">
                            {parsed.req.sections.map((section, sIdx) => (
                              <div key={sIdx} className="space-y-3">
                                 <div className="bg-jp-indigo/5 p-3 rounded-xl">
                                   <h3 className="text-xs font-black text-jp-indigo uppercase tracking-widest">
                                     Phần {sIdx + 1}: {section.section_name} {section.jp_name ? `(${section.jp_name})` : ''}
                                   </h3>
                                 </div>
                                 <div className="pl-4 space-y-4 border-l-2 border-black/5 ml-4">
                                    {section.mondai_list?.map((mondai, mIdx) => (
                                      <div key={mIdx} className="space-y-2">
                                        <h4 className="text-[11px] font-bold text-neutral-600">
                                          Mondai {mondai.mondai_number}: <span className="opacity-70">{mondai.instruction || 'Không có hướng dẫn'}</span>
                                        </h4>
                                        <div className="pl-4 space-y-2">
                                          {mondai.questions?.map((q, qIdx) => (
                                            <div key={qIdx} className="bg-white p-3 rounded-xl border border-black/5 shadow-sm">
                                              <p className="text-[11px] font-bold text-neutral-800 mb-2">Câu {q.number}: {q.content}</p>
                                              <div className="grid grid-cols-2 gap-2">
                                                {q.options?.map((opt, oIdx) => (
                                                  <div key={oIdx} className={`text-[10px] p-2 rounded-lg ${opt.option_id === q.correct_option_id ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100' : 'bg-neutral-50 text-neutral-500'}`}>
                                                    {opt.text}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            ))}
                         </div>
                       </div>
                     )}

                </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
