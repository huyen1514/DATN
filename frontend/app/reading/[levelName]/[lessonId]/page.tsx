"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { FileText, ChevronLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ReadingDetailPage() {
  const params = useParams();
  const levelName = params.levelName as string; 
  const lessonIdStr = params.lessonId as string;
  const lessonId = parseInt(lessonIdStr);

  const [readings, setReadings] = useState<any[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [lessonId]);

  const loadData = async () => {
    try {
      const [lessonData, allReadings] = await Promise.all([
        api(`/lessons/${lessonId}`),
        api("/readings"),
      ]);

      if (lessonData) setLessonName(lessonData.lessonName || `Bài ${lessonId}`);
      if (Array.isArray(allReadings)) {
        const filtered = allReadings.filter((r: any) => r.lessonId === lessonId);
        setReadings(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <Link href={`/reading/${levelName}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-jp-indigo transition-colors mb-6 uppercase tracking-widest">
            <ChevronLeft size={16} /> Quay lại danh sách bài học
        </Link>
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3">
            <FileText size={28} className="text-indigo-600" />
            {lessonName}
          </h1>
          <p className="text-neutral-500 font-light">Danh sách các bài đọc hiểu thuộc {lessonName}</p>
        </div>

        {isLoading ? (
          <div className="text-center p-12 text-neutral-400">Đang tải dữ liệu...</div>
        ) : readings.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có bài đọc nào</h3>
            <p className="text-neutral-500">Bài học này hiện chưa được thêm bài đọc hiểu.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {readings.map((item, idx) => (
              <div key={item.readingId} className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-full mb-6 inline-block tracking-widest uppercase">
                  Đoạn văn {idx + 1}
                </span>
                
                <div className="bg-amber-50/50 rounded-2xl p-8 mb-8 border border-amber-200/50">
                  <p className="text-lg text-jp-indigo leading-loose whitespace-pre-wrap font-serif text-justify">
                    {item.content}
                  </p>
                </div>
                
                <div className="bg-neutral-50 rounded-2xl p-6 border border-black/5">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Câu hỏi tham khảo</p>
                  <p className="text-neutral-700 font-medium text-lg leading-relaxed">{item.question}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
