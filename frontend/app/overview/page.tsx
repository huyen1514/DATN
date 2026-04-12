"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { Folder, Layers, BookOpen, Clock, ArrowRight, GraduationCap, ClipboardList } from "lucide-react";

export default function OverviewPage() {
  const [stats, setStats] = useState({ folders: 0, decks: 0, flashcards: 0 });
  const [recentDecks, setRecentDecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [folders, decks] = await Promise.all([
        api("/folders"),
        api("/decks"),
      ]);

      if (!Array.isArray(folders) && (folders?.status === 401 || folders?.title === "Unauthorized")) {
        window.location.href = "/login";
        return;
      }

      let totalFlashcards = 0;
      let allDecks = Array.isArray(decks) ? decks : [];
      allDecks.forEach((d: any) => {
        totalFlashcards += (d.flashCardCount || 0);
      });

      setStats({
        folders: Array.isArray(folders) ? folders.length : 0,
        decks: allDecks.length,
        flashcards: totalFlashcards,
      });

      setRecentDecks(allDecks.slice(0, 3));
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: "Không gian học", value: stats.folders, icon: Folder, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Bộ thẻ từ", value: stats.decks, icon: Layers, color: "text-jp-red", bg: "bg-red-50" },
    { label: "Thẻ ghi nhớ", value: stats.flashcards, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2">Tổng Quan</h1>
          <p className="text-neutral-500 font-light">Chào mừng trở lại! Dưới đây là tóm tắt không gian học tập của bạn.</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/courses" className="group bg-gradient-to-br from-violet-500 to-violet-700 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Khóa Học</h3>
              <p className="text-white/70 text-sm">Học theo trình độ JLPT N5→N1</p>
            </div>
            <ArrowRight className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
          <Link href="/exams" className="group bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Luyện Thi</h3>
              <p className="text-white/70 text-sm">Làm đề thi thử JLPT</p>
            </div>
            <ArrowRight className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center gap-6 group hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-[0.1em] text-neutral-400 uppercase mb-1">{stat.label}</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
                ) : (
                  <h3 className="text-3xl font-bold text-jp-indigo leading-none">{stat.value}</h3>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-jp-indigo font-serif flex items-center gap-2">
              <Clock size={18} className="text-jp-red" /> Hoạt động gần đây
            </h2>
            <Link href="/folders" className="text-[11px] font-bold text-jp-indigo uppercase tracking-[0.1em] flex items-center gap-1 hover:text-jp-red transition-colors">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-neutral-400">Đang tải dữ liệu...</div>
            ) : recentDecks.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                  <Layers className="text-neutral-300" size={24} />
                </div>
                <p className="text-neutral-500 mb-4">Bạn chưa có bộ thẻ nào.</p>
                <Link href="/folders" className="inline-flex py-3 px-6 bg-jp-indigo text-white rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-jp-red transition-colors">
                  Tạo bộ thẻ đầu tiên
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {recentDecks.map(deck => (
                  <Link
                    key={deck.deckId}
                    href={`/decks/${deck.deckId}`}
                    className="flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-jp-red/10 rounded-xl flex items-center justify-center text-jp-red">
                        <Layers size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-jp-indigo group-hover:text-jp-red transition-colors">{deck.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1">{deck.flashCardCount} thẻ</p>
                      </div>
                    </div>
                    <div className="text-neutral-300 group-hover:text-jp-red group-hover:translate-x-1 transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
