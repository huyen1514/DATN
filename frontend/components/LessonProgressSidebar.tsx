"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, PlayCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import Link from "next/link";

type ProgressStatus = "NotStarted" | "InProgress" | "Completed";

// Sửa lại Interface để khớp với API mới (Lấy dữ liệu từ mảng parts của bảng Cha)
interface LessonPart {
  partType: string;
  status: ProgressStatus;
  score: number | null;
}

interface ProgressResponse {
  parts: LessonPart[];
}

interface Props {
  lessonId: number;
  userId: number; // Mặc định nhận từ prop nhưng sẽ kiểm tra thêm localStorage
  levelName: string;
}

const PARTS = [
  { key: "Vocabulary", label: "Từ vựng" },
  { key: "Grammar", label: "Ngữ pháp" },
  { key: "Reading", label: "Đọc hiểu" },
  { key: "Listening", label: "Nghe hiểu" },
  { key: "Kanji", label: "Kanji" },
];

export default function LessonProgressSidebar({ lessonId, userId, levelName }: Props) {
  // Đổi state từ progress -> parts cho chuẩn logic
  const [parts, setParts] = useState<LessonPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState<number>(userId);

  useEffect(() => {
    // Bọc lính gác JSON cho localStorage
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr && userStr !== "undefined" && userStr !== "null") {
          const parsedUser = JSON.parse(userStr);
          if (parsedUser && parsedUser.userId) {
            setActiveUserId(parsedUser.userId);
          }
        }
      } catch (err) {
        console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchProgress();

    // Thêm Interval: Tự động tải lại mỗi 2 giây để đồng bộ dấu tick khi bấm "Đã thuộc bài"
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, [lessonId, activeUserId]);

  const fetchProgress = async () => {
    // Chặn gọi API rác: Nếu userId <= 0 thì không gọi API
    if (!activeUserId || activeUserId <= 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/progress/lesson/${lessonId}/user/${activeUserId}`);
      if (res.ok) {
        const data: ProgressResponse = await res.json();
        // Lấy mảng parts từ response
        setParts(data.parts || []);
      } else {
        // Lỗi 404 (Chưa học bài này bao giờ) thì set parts rỗng, không cần báo lỗi
        setParts([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải tiến độ", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500 transition-all duration-300 scale-110" />;
      case "InProgress":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  if (loading) return (
    <div className="p-4 text-center text-sm text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải tiến độ...
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-[#a71f48]" /> Tiến độ học tập
      </h3>
      <div className="space-y-3">
        {PARTS.map((part) => {
          // Tìm tiến độ của phần hiện tại trong mảng parts
          const currentProgress = parts.find((p) => p.partType === part.key);
          const status = currentProgress?.status || "NotStarted";

          return (
            <Link
              key={part.key}
              href={`/${part.key.toLowerCase()}/${levelName}/${lessonId}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group"
            >
              <span className={`text-sm transition-colors ${status === "Completed" ? "font-bold text-green-600"
                : status === "InProgress" ? "font-bold text-[#a71f48]"
                  : "font-medium text-gray-700 group-hover:text-gray-900"
                }`}>
                {part.label}
              </span>
              <div className="flex items-center gap-2">
                {/* {currentProgress?.score != null && (
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {currentProgress.score}
                  </span>
                )} */}
                {getStatusIcon(status)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}