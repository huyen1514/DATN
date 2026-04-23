"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import Link from "next/link";

interface RecentProgress {
  lessonId: number;
  partType: string;
  lastAccessedAt: string;
  levelName: string;
}

const PART_LABELS: Record<string, string> = {
  Vocabulary: "Từ vựng",
  Grammar: "Ngữ pháp",
  Reading: "Đọc hiểu",
  Listening: "Nghe hiểu",
  Kanji: "Hán tự",
};

export default function ContinueLearningCard({ userId }: { userId: number }) {
  const [recent, setRecent] = useState<RecentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, [userId]);

  const fetchRecent = async () => {
    try {
      const res = await fetch(`${API_URL}/progress/recent/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecent(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài học gần nhất", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!recent) return null;

  const partLabel = PART_LABELS[recent.partType] || recent.partType;

  return (
    <div className="bg-gradient-to-r from-jp-indigo to-[#2a3b5c] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
      {/* Background decorations */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white/70 mb-2 text-sm font-medium">
            <BookOpen className="w-4 h-4" />
            <span>Tiếp tục học</span>
          </div>
          <h3 className="text-xl font-bold mb-1">
            Bài {recent.lessonId} - {partLabel}
          </h3>
          <p className="text-sm text-white/60">
            Truy cập lần cuối: {new Date(recent.lastAccessedAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        
        <Link 
          href={`/${recent.partType.toLowerCase()}/${recent.levelName}/${recent.lessonId}`}
          className="inline-flex items-center justify-center gap-2 bg-white text-jp-indigo px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
        >
          Học tiếp <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
