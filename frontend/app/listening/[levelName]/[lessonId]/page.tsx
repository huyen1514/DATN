"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import LessonProgressSidebar from "@/components/LessonProgressSidebar";

interface Level {
  levelId: number;
  levelName: string;
}

interface Lesson {
  lessonId: number;
  lessonName?: string;
  level?: Level;
  skillType?: string;
}

interface ListeningItem {
  listeningId: number;
  lessonId: number;
  audioUrl?: string;
  imageUrl?: string;
  transcript?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string; // Chú ý: Backend cần trả về trường này (vd: "A", "B", "C", "D")
}

// COMPONENT CON: Xử lý độc lập cho từng câu hỏi
function ListeningCard({ item, idx }: { item: ListeningItem; idx: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);

  const handlePlay = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border-2 border-jp-red/10 hover:border-jp-red/30 p-6 md:p-8 transition-all shadow-sm hover:shadow-lg">

      {/* Ẩn thẻ audio mặc định đi, chỉ dùng để xử lý logic */}
      {item.audioUrl && (
        <audio
          ref={audioRef}
          src={item.audioUrl}
          onEnded={handleEnded}
          className="hidden"
        />
      )}

      {/* HEADER CỦA CÂU HỎI (SỐ THỨ TỰ & AUDIO TÍNH NĂNG) */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-jp-sakura flex items-center justify-center flex-shrink-0 font-serif font-bold text-jp-red">
          {(idx + 1).toString().padStart(2, "0")}
        </div>
        <h3 className="text-xl font-serif font-bold text-jp-indigo">
          Câu {idx + 1}
        </h3>

        {item.audioUrl && (
          <div className="ml-auto flex items-center gap-4">
            {/* Chỉnh âm lượng (Ẩn trên mobile, hiện trên màn to) */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-jp-ink/60">🔉</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-jp-sakura rounded-lg appearance-none cursor-pointer accent-jp-red"
                title="Âm lượng"
              />
            </div>

            {/* Nút Nghe */}
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className={`px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2 ${isPlaying
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-jp-red hover:bg-red-700 text-white"
                }`}
              title={isPlaying ? "Đang phát..." : "Phát âm thanh"}
            >
              {isPlaying ? "⏳ Đang phát..." : "🔊 Nghe"}
            </button>
          </div>
        )}
      </div>

      {/* HIỂN THỊ CHỈNH ÂM LƯỢNG TRÊN MOBILE KHI XUỐNG DÒNG */}
      {item.audioUrl && (
        <div className="flex sm:hidden items-center justify-end gap-2 mb-4">
          <span className="text-xs text-jp-ink/60">🔉</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full max-w-[120px] h-1 bg-jp-sakura rounded-lg appearance-none cursor-pointer accent-jp-red"
          />
        </div>
      )}

      {/* HÌNH ẢNH MINH HỌA (NẾU CÓ) */}
      {item.imageUrl && (
        <div className="mb-4 flex justify-center">
          <img
            src={item.imageUrl}
            alt="Hình minh họa"
            className="max-h-64 rounded-lg border border-jp-red/10 object-contain"
          />
        </div>
      )}

      {/* CÂU HỎI */}
      <div className="bg-jp-washi/50 rounded-lg border border-jp-red/10 p-4 mb-4">
        <p className="text-jp-ink font-serif font-bold leading-relaxed">{item.question}</p>
      </div>

      {/* ĐÁP ÁN (OPTIONS) */}
      <div className="space-y-2 mb-4">
        {["A", "B", "C", "D"].map((option) => {
          const valueKey = `option${option}` as keyof ListeningItem;
          const text = item[valueKey];

          // Trạng thái kiểm tra đáp án
          const isSelected = selectedOption === option;
          const hasAnswered = selectedOption !== null;
          // So sánh với đáp án đúng từ API
          const isCorrectAnswer = option === item.correctAnswer;

          // Logic Class CSS
          let wrapperClass = "border-jp-red/10 hover:border-jp-red/30 hover:bg-jp-sakura/10 cursor-pointer";
          let iconClass = "bg-jp-sakura text-jp-red";
          let textClass = "text-jp-ink";

          if (hasAnswered) {
            wrapperClass = "border-gray-200 cursor-not-allowed opacity-60"; // Làm mờ các đáp án không được chọn mặc định

            if (isCorrectAnswer) {
              // Đáp án đúng -> Màu Xanh lá
              wrapperClass = "border-green-500 bg-green-50 shadow-sm opacity-100";
              iconClass = "bg-green-500 text-white";
              textClass = "text-green-700 font-bold";
            } else if (isSelected) {
              // Chọn sai -> Màu Đỏ
              wrapperClass = "border-red-500 bg-red-50 shadow-sm opacity-100";
              iconClass = "bg-red-500 text-white";
              textClass = "text-red-700 font-bold";
            }
          }

          return (
            <div
              key={option}
              onClick={() => {
                // Khóa chọn lại: Chỉ cho phép chọn nếu chưa trả lời
                if (!hasAnswered) {
                  setSelectedOption(option);
                }
              }}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-all duration-300 ${wrapperClass}`}
            >
              <span className={`w-8 h-8 font-bold rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-colors ${iconClass}`}>
                {option}
              </span>
              <span className={`text-sm leading-relaxed ${textClass}`}>
                {text}
              </span>
            </div>
          );
        })}
      </div>

      {/* SCRIPT TOGGLE */}
      {item.transcript && (
        <div className="mt-6">
          <button
            onClick={() => setShowScript(!showScript)}
            className="text-sm font-bold text-jp-red/80 hover:text-jp-red mb-3 inline-block transition-colors"
          >
            {showScript ? "▲ Ẩn Script" : "▼ Hiển thị Script"}
          </button>

          {showScript && (
            <div className="bg-jp-sakura/20 rounded-lg p-4 border border-jp-red/10 animate-fade-in">
              <p className="text-xs font-bold text-jp-red/70 uppercase tracking-wide mb-2">Bản ghi chép</p>
              <p className="text-sm text-jp-ink italic">{item.transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// MAIN PAGE COMPONENT
export default function ListeningDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [listenings, setListenings] = useState<ListeningItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number>(1);

  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allListeningsData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/listenings"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter((l: Lesson) =>
          l.level?.levelName === levelName &&
          (!l.skillType || l.skillType === "Nghe hiểu" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allListeningsData)) {
        const filtered = allListeningsData.filter((l: ListeningItem) => l.lessonId === lessonId);
        setListenings(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserId(u.userId);
      } catch (e) {}
    }
    void loadData();

    // Mark as accessed/in progress
    updateStatus("InProgress");

  }, [loadData, lessonId, userId]);

  const updateStatus = async (status: string, score: number | null = null) => {
    if (!userId) return;
    try {
      await api("/progress/lesson", "PUT", {
        userId,
        lessonId,
        partType: "Listening",
        status,
        score
      });
    } catch (e) {
      console.error("Could not update progress", e);
    }
  };

  const sortedLessons = useMemo(() => [...lessons].sort((a, b) => a.lessonId - b.lessonId), [lessons]);

  const currentLessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.lessonId === lessonId),
    [sortedLessons, lessonId]
  );

  const handleNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < sortedLessons.length) {
      updateStatus("Completed");
      const nextLesson = sortedLessons[nextIndex];
      window.location.href = `/listening/${levelName}/${nextLesson.lessonId}`;
    }
  };

  return (
    <div className="min-h-screen bg-white text-jp-ink">
      <MainNavbar />

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* TITLE SECTION */}
        <div className="mb-12 relative">
          <div className="inline-block">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-jp-indigo mb-2">
              {lessonName || "Nghe Hiểu"}
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-jp-red to-jp-sakura"></div>
          </div>
          <p className="text-jp-ink/60 mt-4 text-lg">Luyện tập nghe tiếng Nhật</p>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: LISTENING CARDS */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-jp-ink/40">
                <p className="text-lg">Đang tải...</p>
              </div>
            ) : listenings.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-jp-red/10 p-12 text-center">
                <p className="text-jp-ink/60 text-lg">Chưa có bài nghe nào</p>
              </div>
            ) : (
              listenings.map((item, idx) => (
                <ListeningCard key={item.listeningId} item={item} idx={idx} />
              ))
            )}
          </div>

          {/* RIGHT: SIDEBAR - LESSON NAVIGATOR */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <LessonProgressSidebar lessonId={lessonId} userId={userId} levelName={levelName} />

              <div className="bg-white rounded-2xl border-2 border-jp-red/10 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-jp-indigo uppercase tracking-widest mb-6 pb-3 border-b-2 border-jp-red/20">
                  📚 {lessons.length} Bài Học
                </h3>

              {/* LESSON GRID */}
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {sortedLessons.map((lesson, idx) => (
                  <Link
                    key={lesson.lessonId}
                    href={`/listening/${levelName}/${lesson.lessonId}`}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition ${lesson.lessonId === lessonId
                        ? "bg-jp-red text-white shadow-md scale-105"
                        : "bg-jp-sakura text-jp-indigo hover:bg-jp-red hover:text-white"
                      }`}
                    title={lesson.lessonName}
                  >
                    {idx + 1}
                  </Link>
                ))}
              </div>

              {/* INFO CARD */}
              <div className="mt-8 pt-6 border-t-2 border-jp-red/10">
                <p className="text-xs text-jp-ink/60 font-medium mb-2">💡 Mẹo:</p>
                <p className="text-xs text-jp-ink/70 leading-relaxed">
                  Nghe nhiều lần để quen với độ dài âm tiếng Nhật, chú ý các chi tiết nhỏ.
                </p>
              </div>
              </div>
            </div>

            {/* Next Lesson Button */}
            <div className="mt-8 flex justify-center">
              {currentLessonIndex < sortedLessons.length - 1 && (
                <button
                  onClick={handleNextLesson}
                  className="flex items-center gap-2 px-8 py-3 bg-[#a71f48] hover:bg-[#8e1a3d] text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200"
                >
                  Bài học tiếp theo <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER DECORATION */}
      <div className="h-1 bg-gradient-to-r from-jp-red via-jp-sakura to-jp-red mt-20"></div>
    </div>
  );
}