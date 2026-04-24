"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import MainNavbar from "@/components/MainNavbar";
import BookmarkButton from "@/components/BookmarkButton";
import KanjiStroke from "@/components/KanjiStroke";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Info,
  PenTool
} from "lucide-react";
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

interface KanjiItem {
  kanjiId: number;
  lessonId: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi?: string;
  example: string;
}

interface BookmarkItem {
  bookmarkId: number;
  itemId: number;
  type: string;
}

export default function KanjiDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string;
  const lessonId = Number(params.lessonId as string);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kanjis, setKanjis] = useState<KanjiItem[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number>(1);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [lessonsData, lessonData, allKanjisData] = await Promise.all([
        api("/lessons"),
        api(`/lessons/${lessonId}`),
        api("/kanjis"),
      ]);

      if (Array.isArray(lessonsData)) {
        const filtered = lessonsData.filter((l: Lesson) =>
          l.level?.levelName.toLowerCase() === levelName.toLowerCase() &&
          (!l.skillType || l.skillType === "Kanji" || l.skillType === "Tự do")
        );
        setLessons(filtered);
      }

      if (lessonData?.lessonName) setLessonName(lessonData.lessonName);

      if (Array.isArray(allKanjisData)) {
        const filtered = allKanjisData.filter((k: KanjiItem) => k.lessonId === lessonId);
        setKanjis(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, levelName]);

  const loadBookmarks = useCallback(async (targetUserId: number) => {
    if (!targetUserId) return;
    try {
      const data = await api(`/bookmark/${targetUserId}`);
      setBookmarks(Array.isArray(data) ? (data as BookmarkItem[]) : []);
    } catch (e) {
      console.error("Could not load bookmarks", e);
    }
  }, []);

  const isLessonBookmarked = useMemo(
    () =>
      bookmarks.some(
        (bookmark) =>
          bookmark.itemId === lessonId &&
          bookmark.type.toLowerCase() === "lesson"
      ),
    [bookmarks, lessonId]
  );

  const toggleLessonBookmark = useCallback(async () => {
    if (!userId) return;
    setBookmarkLoading(true);
    try {
      if (isLessonBookmarked) {
        await api("/bookmark", "DELETE", { userId, itemId: lessonId, type: "Lesson" });
      } else {
        await api("/bookmark", "POST", { userId, itemId: lessonId, type: "Lesson" });
      }
      await loadBookmarks(userId);
    } catch (e) {
      console.error("Could not update lesson bookmark", e);
    } finally {
      setBookmarkLoading(false);
    }
  }, [isLessonBookmarked, lessonId, loadBookmarks, userId]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserId(u.userId);
        void loadBookmarks(u.userId);
      } catch (e) {}
    }
    void loadData();

    // Mark as accessed/in progress
    updateStatus("InProgress");

  }, [loadBookmarks, loadData, lessonId, userId]);

  const updateStatus = async (status: string) => {
    if (!userId) return;
    try {
      await api("/progress/lesson", "PUT", {
        userId,
        lessonId,
        partType: "Kanji",
        status,
        score: null
      });
    } catch (e) {
      console.error("Could not update progress", e);
    }
  };

  const handleNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < sortedLessons.length) {
      updateStatus("Completed");
      const nextLesson = sortedLessons[nextIndex];
      window.location.href = `/kanji/${levelName}/${nextLesson.lessonId}`;
    }
  };

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonId - b.lessonId),
    [lessons]
  );

  const currentLessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.lessonId === lessonId),
    [sortedLessons, lessonId]
  );

  const progressPercentage = useMemo(() => {
    if (sortedLessons.length === 0) return 0;
    return Math.round(((currentLessonIndex + 1) / sortedLessons.length) * 100);
  }, [currentLessonIndex, sortedLessons.length]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <MainNavbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">

        <aside className="sticky top-24 flex max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="shrink-0 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-[#a71f48] lg:text-2xl">Lộ trình Kanji</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{levelName.toUpperCase()}</p>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Tiến độ bài học</span>
                <span className="font-bold text-[#a71f48]">{progressPercentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#a71f48] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <LessonProgressSidebar lessonId={lessonId} userId={userId} levelName={levelName} />

          <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <div className="flex shrink-0 items-center gap-2 p-4 pb-2 text-base font-semibold text-slate-800">
              <BookOpen size={16} className="text-[#a71f48]" />
              <span>Danh sách bài</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
              {sortedLessons.map((lesson) => (
                <Link
                  key={lesson.lessonId}
                  href={`/kanji/${levelName}/${lesson.lessonId}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${lesson.lessonId === lessonId
                      ? "bg-rose-100 font-semibold text-[#a71f48]"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                >
                  {lesson.lessonName || `Bài ${lesson.lessonId}`}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 shrink-0 rounded-xl bg-amber-50 p-4 border border-amber-100 hidden lg:block">
            <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-xs uppercase tracking-wider">
              <Lightbulb size={14} />
              <span>Mẹo học tốt</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Tập viết Kanji kết hợp nhìn thứ tự nét vẽ để ghi nhớ hình thể chữ tốt hơn.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Chi tiết chữ Kanji
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500 sm:text-base">
                <span className="font-bold text-[#a71f48]">{levelName.toUpperCase()}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                <span>{lessonName || `Bài ${lessonId}`}</span>
              </p>
            </div>
            <BookmarkButton
              active={isLessonBookmarked}
              loading={bookmarkLoading}
              label={`Lưu bài ${lessonName || lessonId}`}
              onClick={() => void toggleLessonBookmark()}
            />
          </div>

          {/* Kanji Card List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#a71f48]"></div>
                <p className="mt-4 text-sm text-slate-500">Đang tải dữ liệu Hán tự...</p>
              </div>
            ) : kanjis.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500 shadow-sm">
                Chưa có chữ Kanji nào cho bài học này.
              </div>
            ) : (
              kanjis.map((k, idx) => (
                <article
                  key={k.kanjiId}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-rose-300 hover:shadow-md"
                >
                  {/* Thanh highlight bên trái */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#a71f48]"></div>

                  <div className="p-5 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_200px] gap-6 items-start">

                      {/* Cột 1: Đại diện chữ Kanji */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-6xl font-normal text-[#a71f48] md:text-7xl">
                          {k.character}
                        </div>
                        <div className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">
                          HÁN TỰ
                        </div>
                      </div>

                      {/* Cột 2: Thông tin Âm và Nghĩa */}
                      <div className="flex flex-col gap-5">
                        {/* Meaning */}
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nghĩa Hán Việt</span>
                          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                            {k.meaning}
                          </h3>
                        </div>

                        {/* Pronunciation boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-lg bg-blue-50/50 p-3 ring-1 ring-blue-100/50">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-blue-600/70">Kunyomi</span>
                            <p className="text-sm font-medium text-blue-700 leading-relaxed">{k.kunyomi || "Không có"}</p>
                          </div>
                          <div className="rounded-lg bg-rose-50/50 p-3 ring-1 ring-rose-100/50">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#a71f48]/70">Onyomi</span>
                            <p className="text-sm font-medium text-[#a71f48] leading-relaxed">{k.onyomi}</p>
                          </div>
                        </div>

                        {/* Examples */}
                        {k.example && (
                          <div className="rounded-xl bg-slate-50 p-4 text-slate-700 border border-slate-100">
                            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ví dụ & Giải nghĩa</span>
                            <div
                              className="text-sm leading-relaxed whitespace-pre-wrap font-medium"
                              dangerouslySetInnerHTML={{ __html: k.example }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Cột 3: Stroke Order Component */}
                      <div className="flex flex-col items-center justify-center p-4 border-l border-slate-100">
                        <span className="mb-4 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Thứ tự nét vẽ</span>
                        <div className="bg-white p-2 rounded-lg ring-1 ring-slate-100 shadow-inner">
                          <KanjiStroke character={k.character} size={140} />
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400 italic">Nhấn để xem lại mẫu viết</p>
                      </div>

                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <button
              onClick={() => updateStatus("Completed")}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-200"
            >
              <CheckCircle2 size={20} /> Đã thuộc Hán tự bài này
            </button>
            
            {currentLessonIndex < sortedLessons.length - 1 && (
              <button
                onClick={handleNextLesson}
                className="flex items-center gap-2 px-6 py-3 bg-[#a71f48] hover:bg-[#8e1a3d] text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200"
              >
                Bài học tiếp theo <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Bottom Lesson Navigation */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-slate-200 pt-6 pb-10">
            {sortedLessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={`/kanji/${levelName}/${lesson.lessonId}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${lesson.lessonId === lessonId
                    ? "border-[#a71f48] bg-[#a71f48] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {lesson.lessonName || `Bài ${lesson.lessonId}`}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
