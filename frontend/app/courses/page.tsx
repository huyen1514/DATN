"use client";

import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { GraduationCap, BookOpen, Languages, Headphones, FileText } from "lucide-react";

export default function CoursesPage() {
  const modules = [
    {
      title: "Từ vựng",
      description: "Ôn luyện từ vựng theo từng cấp độ JLPT.",
      href: "/vocabulary/N5",
      icon: BookOpen,
    },
    {
      title: "Ngữ pháp",
      description: "Học cấu trúc ngữ pháp từ cơ bản đến nâng cao.",
      href: "/grammar/N5",
      icon: GraduationCap,
    },
    {
      title: "Kanji",
      description: "Luyện chữ Hán theo bài học và trình độ.",
      href: "/kanji/N5",
      icon: Languages,
    },
    {
      title: "Luyện nghe",
      description: "Nghe hiểu qua hội thoại và câu hỏi thực tế.",
      href: "/listening/N5",
      icon: Headphones,
    },
    {
      title: "Luyện đọc",
      description: "Đọc hiểu đoạn văn theo chuẩn JLPT.",
      href: "/reading/N5",
      icon: FileText,
    },
  ];

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2">Khóa Học</h1>
          <p className="text-neutral-500 font-light">
            Chọn một chức năng để bắt đầu học. Mỗi mục sẽ đưa bạn đến module tương ứng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group bg-white border border-black/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-jp-indigo/10 text-jp-indigo flex items-center justify-center mb-4 group-hover:bg-jp-red/10 group-hover:text-jp-red transition-colors">
                <module.icon size={22} />
              </div>
              <h2 className="text-lg font-bold text-jp-indigo mb-2">{module.title}</h2>
              <p className="text-sm text-neutral-500">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
