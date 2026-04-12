"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import {
  Users,
  GraduationCap,
  BookOpen,
  Languages,
  PenTool,
  BookA,
  Headphones,
  FileText,
  ClipboardList,
  TrendingUp,
  Layers,
  Folder,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  levels: number;
  lessons: number;
  kanjis: number;
  grammars: number;
  vocabularies: number;
  listenings: number;
  readings: number;
  exams: number;
  users: number;
  folders: number;
  decks: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    levels: 0, lessons: 0, kanjis: 0, grammars: 0,
    vocabularies: 0, listenings: 0, readings: 0,
    exams: 0, users: 0, folders: 0, decks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [levels, lessons, kanjis, grammars, vocabularies, listenings, readings, exams, users, folders, decks] =
        await Promise.all([
          api("/levels"),
          api("/lessons"),
          api("/kanjis"),
          api("/grammars"),
          api("/vocabularies"),
          api("/listenings"),
          api("/readings"),
          api("/exams"),
          api("/users"),
          api("/folders"),
          api("/decks"),
        ]);

      setStats({
        levels: Array.isArray(levels) ? levels.length : 0,
        lessons: Array.isArray(lessons) ? lessons.length : 0,
        kanjis: Array.isArray(kanjis) ? kanjis.length : 0,
        grammars: Array.isArray(grammars) ? grammars.length : 0,
        vocabularies: Array.isArray(vocabularies) ? vocabularies.length : 0,
        listenings: Array.isArray(listenings) ? listenings.length : 0,
        readings: Array.isArray(readings) ? readings.length : 0,
        exams: Array.isArray(exams) ? exams.length : 0,
        users: Array.isArray(users) ? users.length : 0,
        folders: Array.isArray(folders) ? folders.length : 0,
        decks: Array.isArray(decks) ? decks.length : 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: "Cấp độ", value: stats.levels, icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50", href: "/dashboard/levels" },
    { label: "Bài học", value: stats.lessons, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/lessons" },
    { label: "Kanji", value: stats.kanjis, icon: Languages, color: "text-rose-600", bg: "bg-rose-50", href: "/dashboard/kanji" },
    { label: "Ngữ pháp", value: stats.grammars, icon: PenTool, color: "text-amber-600", bg: "bg-amber-50", href: "/dashboard/grammar" },
    { label: "Từ vựng", value: stats.vocabularies, icon: BookA, color: "text-emerald-600", bg: "bg-emerald-50", href: "/dashboard/vocabulary" },
    { label: "Luyện nghe", value: stats.listenings, icon: Headphones, color: "text-cyan-600", bg: "bg-cyan-50", href: "/dashboard/listening" },
    { label: "Luyện đọc", value: stats.readings, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", href: "/dashboard/reading" },
    { label: "Đề thi", value: stats.exams, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50", href: "/dashboard/exams" },
    { label: "Người dùng", value: stats.users, icon: Users, color: "text-pink-600", bg: "bg-pink-50", href: "/dashboard/users" },
    { label: "Thư mục", value: stats.folders, icon: Folder, color: "text-sky-600", bg: "bg-sky-50", href: "/dashboard/levels" },
    { label: "Bộ thẻ", value: stats.decks, icon: Layers, color: "text-teal-600", bg: "bg-teal-50", href: "/dashboard/levels" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-3">
            <TrendingUp size={24} className="text-jp-red" />
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Tổng quan hệ thống J-Learning
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className="bg-white p-5 rounded-2xl border border-black/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-[11px] font-bold tracking-[0.1em] text-neutral-400 uppercase mb-1">{stat.label}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
              ) : (
                <h3 className="text-2xl font-bold text-jp-indigo leading-none">{stat.value}</h3>
              )}
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl border border-black/5 p-6">
          <h2 className="text-lg font-bold text-jp-indigo mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Thêm Level", href: "/dashboard/levels", color: "bg-violet-500" },
              { label: "Thêm Bài học", href: "/dashboard/lessons", color: "bg-blue-500" },
              { label: "Thêm Kanji", href: "/dashboard/kanji", color: "bg-rose-500" },
              { label: "Thêm Đề thi", href: "/dashboard/exams", color: "bg-orange-500" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`${action.color} text-white text-center py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity`}
              >
                + {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}