"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, PlayCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import Link from "next/link";

type ProgressStatus = "NotStarted" | "InProgress" | "Completed";

interface LessonProgress {
  id: number;
  partType: string;
  status: ProgressStatus;
  score: number | null;
}

interface Props {
  lessonId: number;
  userId: number;
  levelName: string;
}

const PARTS = [
  { key: "Vocabulary", label: "Từ vựng" },
  { key: "Grammar", label: "Ngữ pháp" },
  { key: "Reading", label: "Đọc hiểu" },
  { key: "Listening", label: "Nghe hiểu" },
  { key: "Kanji", label: "Hán tự" },
];

export default function LessonProgressSidebar({ lessonId, userId, levelName }: Props) {
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [lessonId, userId]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/progress/lesson/${lessonId}/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
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
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "InProgress":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải tiến độ...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-jp-red" /> Tiến độ học tập
      </h3>
      <div className="space-y-3">
        {PARTS.map((part) => {
          const currentProgress = progress.find((p) => p.partType === part.key);
          const status = currentProgress?.status || "NotStarted";

          return (
            <Link 
              key={part.key} 
              href={`/${part.key.toLowerCase()}/${levelName}/${lessonId}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-700">{part.label}</span>
              <div className="flex items-center gap-2">
                {currentProgress?.score != null && (
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {currentProgress.score}đ
                  </span>
                )}
                {getStatusIcon(status)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
