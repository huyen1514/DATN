"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { Languages, PenTool, BookA, Headphones, FileText, Volume2, CheckCircle2, XCircle } from "lucide-react";

type TabType = "kanji" | "grammar" | "vocabulary" | "listening" | "reading";

export default function LessonDetailPage() {
  const params = useParams();
  const levelId = params.levelId as string;
  const lessonId = params.lessonId as string;

  const [activeTab, setActiveTab] = useState<TabType>("kanji");
  const [lesson, setLesson] = useState<any>(null);
  const [kanjis, setKanjis] = useState<any[]>([]);
  const [grammars, setGrammars] = useState<any[]>([]);
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [listenings, setListenings] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listening quiz state
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, string>>({});
  const [listeningChecked, setListeningChecked] = useState<Record<number, boolean>>({});

  useEffect(() => { loadData(); }, [lessonId]);

  const loadData = async () => {
    try {
      const [lessonData, kanjiData, grammarData, vocabData, listeningData, readingData] = await Promise.all([
        api(`/lessons/${lessonId}`),
        api(`/kanjis?lessonId=${lessonId}`),
        api(`/grammars?lessonId=${lessonId}`),
        api(`/vocabularies?lessonId=${lessonId}`),
        api(`/listenings?lessonId=${lessonId}`),
        api(`/readings?lessonId=${lessonId}`),
      ]);
      if (lessonData?.lessonId) setLesson(lessonData);
      if (Array.isArray(kanjiData)) setKanjis(kanjiData);
      if (Array.isArray(grammarData)) setGrammars(grammarData);
      if (Array.isArray(vocabData)) setVocabs(vocabData);
      if (Array.isArray(listeningData)) setListenings(listeningData);
      if (Array.isArray(readingData)) setReadings(readingData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const tabs = [
    { key: "kanji" as TabType, label: "Kanji", icon: Languages, count: kanjis.length, color: "text-rose-600" },
    { key: "grammar" as TabType, label: "Ngữ pháp", icon: PenTool, count: grammars.length, color: "text-amber-600" },
    { key: "vocabulary" as TabType, label: "Từ vựng", icon: BookA, count: vocabs.length, color: "text-emerald-600" },
    { key: "listening" as TabType, label: "Nghe", icon: Headphones, count: listenings.length, color: "text-cyan-600" },
    { key: "reading" as TabType, label: "Đọc", icon: FileText, count: readings.length, color: "text-indigo-600" },
  ];

  const handleListeningAnswer = (listeningId: number, answer: string) => {
    if (listeningChecked[listeningId]) return;
    setListeningAnswers(prev => ({ ...prev, [listeningId]: answer }));
  };

  const checkListeningAnswer = (listeningId: number) => {
    setListeningChecked(prev => ({ ...prev, [listeningId]: true }));
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          <Link href="/courses" className="hover:text-jp-red transition-colors">Khóa học</Link>
          <span>/</span>
          <Link href={`/courses/${levelId}`} className="hover:text-jp-red transition-colors">
            {lesson?.level?.levelName || "..."}
          </Link>
          <span>/</span>
          <span className="text-jp-indigo font-bold">{lesson?.lessonName || "..."}</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2">{lesson?.lessonName || "Đang tải..."}</h1>
          <p className="text-neutral-500 font-light">Nội dung chi tiết của bài học</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-jp-indigo text-white shadow-lg shadow-jp-indigo/20"
                  : "bg-white text-neutral-500 border border-black/5 hover:bg-neutral-50"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-white/20" : "bg-neutral-100"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-black/5 text-center text-neutral-400">Đang tải nội dung...</div>
        ) : (
          <>
            {/* KANJI TAB */}
            {activeTab === "kanji" && (
              kanjis.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-black/5 text-center"><Languages size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có Kanji cho bài này</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kanjis.map(k => (
                    <div key={k.kanjiId} className="bg-white rounded-2xl border border-black/5 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-5">
                        <div className="w-20 h-20 bg-jp-red/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-5xl font-serif text-jp-red">{k.character}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-jp-indigo mb-2">{k.meaning}</h3>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-neutral-400 font-bold text-xs uppercase">Onyomi:</span> <span className="text-neutral-700">{k.onyomi}</span></p>
                            {k.kunyomi && <p><span className="text-neutral-400 font-bold text-xs uppercase">Kunyomi:</span> <span className="text-neutral-700">{k.kunyomi}</span></p>}
                            <p className="pt-2 text-neutral-500 text-xs border-t border-black/5 mt-2">
                              <span className="font-bold text-neutral-400">VD:</span> {k.example}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* GRAMMAR TAB */}
            {activeTab === "grammar" && (
              grammars.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-black/5 text-center"><PenTool size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có ngữ pháp cho bài này</p></div>
              ) : (
                <div className="space-y-4">
                  {grammars.map(g => (
                    <div key={g.grammarId} className="bg-white rounded-2xl border border-black/5 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-lg font-serif">{g.grammarName}</span>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-4 mb-3">
                        <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Cấu trúc</p>
                        <p className="text-jp-indigo font-mono font-bold">{g.structure}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Ý nghĩa</p>
                        <p className="text-neutral-700">{g.meaning}</p>
                      </div>
                      <div className="bg-blue-50/50 rounded-xl p-4">
                        <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Ví dụ</p>
                        <p className="text-neutral-700 italic">{g.example}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* VOCABULARY TAB */}
            {activeTab === "vocabulary" && (
              vocabs.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-black/5 text-center"><BookA size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có từ vựng cho bài này</p></div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/5 bg-neutral-50/50">
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Từ</th>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Cách đọc</th>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Nghĩa</th>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Loại từ</th>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase">Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {vocabs.map(v => (
                        <tr key={v.vocabularyId} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-4 text-lg font-serif font-bold text-jp-indigo">{v.word}</td>
                          <td className="px-6 py-4 text-sm text-jp-red">{v.reading}</td>
                          <td className="px-6 py-4 text-sm text-neutral-700">{v.meaning}</td>
                          <td className="px-6 py-4 text-xs text-neutral-500">{v.partOfSpeech || "—"}</td>
                          <td className="px-6 py-4 text-xs text-neutral-500 max-w-[200px] truncate">{v.example || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* LISTENING TAB */}
            {activeTab === "listening" && (
              listenings.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-black/5 text-center"><Headphones size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có bài nghe cho bài này</p></div>
              ) : (
                <div className="space-y-6">
                  {listenings.map((item, idx) => {
                    const selected = listeningAnswers[item.listeningId];
                    const checked = listeningChecked[item.listeningId];
                    const isCorrect = selected === item.correctAnswer;
                    return (
                      <div key={item.listeningId} className="bg-white rounded-2xl border border-black/5 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-bold bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full">Câu {idx + 1}</span>
                          {item.audioUrl && (
                            <button
                              onClick={() => new Audio(item.audioUrl).play()}
                              className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full"
                            >
                              <Volume2 size={14} /> Nghe
                            </button>
                          )}
                        </div>
                        <p className="text-base font-bold text-jp-indigo mb-4">{item.question}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {["A", "B", "C", "D"].map(opt => {
                            const optionText = item[`option${opt}`];
                            const isSelected = selected === opt;
                            const isRight = checked && opt === item.correctAnswer;
                            const isWrong = checked && isSelected && !isCorrect && opt !== item.correctAnswer;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleListeningAnswer(item.listeningId, opt)}
                                disabled={checked}
                                className={`text-left p-4 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-3
                                  ${isRight ? "border-green-500 bg-green-50 text-green-700" : 
                                    isWrong ? "border-red-400 bg-red-50 text-red-600" :
                                    isSelected ? "border-jp-indigo bg-jp-indigo/5 text-jp-indigo" : 
                                    "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                                  }
                                  ${checked ? "cursor-default" : "cursor-pointer hover:shadow-sm"}
                                `}
                              >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                  ${isRight ? "bg-green-500 text-white" : isWrong ? "bg-red-400 text-white" : isSelected ? "bg-jp-indigo text-white" : "bg-neutral-100 text-neutral-500"}
                                `}>{opt}</span>
                                {optionText}
                                {isRight && <CheckCircle2 size={16} className="ml-auto text-green-500" />}
                                {isWrong && <XCircle size={16} className="ml-auto text-red-400" />}
                              </button>
                            );
                          })}
                        </div>

                        {selected && !checked && (
                          <button onClick={() => checkListeningAnswer(item.listeningId)} className="px-6 py-2 bg-jp-indigo text-white rounded-xl text-sm font-bold hover:bg-jp-red transition-colors">
                            Kiểm tra
                          </button>
                        )}

                        {checked && (
                          <div className={`p-3 rounded-xl text-sm font-medium ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                            {isCorrect ? "✅ Chính xác!" : `❌ Sai rồi! Đáp án đúng là ${item.correctAnswer}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* READING TAB */}
            {activeTab === "reading" && (
              readings.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-black/5 text-center"><FileText size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Chưa có bài đọc cho bài này</p></div>
              ) : (
                <div className="space-y-6">
                  {readings.map((item, idx) => (
                    <div key={item.readingId} className="bg-white rounded-2xl border border-black/5 p-6">
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full mb-4 inline-block">Bài đọc {idx + 1}</span>
                      <div className="bg-amber-50/30 rounded-xl p-5 mb-4 border border-amber-200/30">
                        <p className="text-base text-jp-indigo leading-relaxed whitespace-pre-wrap font-serif">{item.content}</p>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Câu hỏi</p>
                        <p className="text-neutral-700 font-medium">{item.question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
