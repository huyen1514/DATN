"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  User,
  Users,
  GraduationCap,
  BookOpen,
  Languages,
  PenTool,
  BookA,
  Headphones,
  FileText,
  ClipboardList,
  HelpCircle,
  ChevronLeft,
  Shield,
  Home,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const normalizeUser = (raw: any) => ({
    fullName: raw?.fullName ?? raw?.FullName ?? "",
    userName: raw?.userName ?? raw?.UserName ?? "",
    role: raw?.role ?? raw?.Role ?? "",
  });

  const [authState] = useState<{
    user: { fullName?: string; userName?: string; role?: string } | null | undefined;
    redirectTo: "/login" | "/" | null;
  } | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const userStr = localStorage.getItem("user");
    if (!userStr) return { user: null, redirectTo: "/login" };
    try {
      const parsed = JSON.parse(userStr);
      const normalized = normalizeUser(parsed);
      if (normalized.role !== "Admin") return { user: null, redirectTo: "/" };
      return { user: normalized, redirectTo: null };
    } catch {
      return { user: null, redirectTo: "/login" };
    }
  });
  const user = authState?.user;

  useEffect(() => {
    if (authState?.redirectTo) {
      window.location.href = authState.redirectTo;
    }
  }, [authState]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const navGroups = [
    {
      label: "Tổng quan",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      ],
    },
    {
      label: "Quản lý nội dung",
      items: [
        { label: "Cấp độ (Level)", icon: GraduationCap, href: "/dashboard/levels" },
        { label: "Bài học", icon: BookOpen, href: "/dashboard/lessons" },
        { label: "Kanji", icon: Languages, href: "/dashboard/kanji" },
        { label: "Ngữ pháp", icon: PenTool, href: "/dashboard/grammar" },
        { label: "Từ vựng", icon: BookA, href: "/dashboard/vocabulary" },
        { label: "Luyện nghe", icon: Headphones, href: "/dashboard/listening" },
        { label: "Luyện đọc", icon: FileText, href: "/dashboard/reading" },
      ],
    },
    {
      label: "Luyện thi",
      items: [
        { label: "Đề thi", icon: ClipboardList, href: "/dashboard/exams" },
        { label: "Câu hỏi thi", icon: HelpCircle, href: "/dashboard/exam-questions" },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        { label: "Người dùng", icon: Users, href: "/dashboard/users" },
      ],
    },
  ];

  if (user === undefined) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex text-jp-ink font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-jp-indigo flex flex-col fixed inset-y-0 z-20 overflow-y-auto">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 bg-jp-red rounded-lg flex items-center justify-center text-white font-serif text-lg shadow-lg">
            日
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.15em] text-white uppercase">
              J-Learning
            </h1>
            <p className="text-[10px] text-white/40 font-medium flex items-center gap-1">
              <Shield size={10} /> Admin Panel
            </p>
          </div>
        </div>

        {/* Nav Groups */}
        <div className="flex-1 py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-white/30 mb-2 tracking-[0.2em] uppercase px-3">
                {group.label}
              </p>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[13px] font-medium
                        ${isActive
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80"
                        }
                      `}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all text-[13px] font-medium"
          >
            <Home size={16} />
            Trang chủ Student
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all text-[13px] font-medium"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-[260px] flex flex-col">
        {/* Top Bar */}
        <header className="h-14 px-6 flex items-center justify-between bg-white sticky top-0 z-10 border-b border-black/5 shadow-sm">
          <div className="flex items-center gap-3">
            {pathname !== "/dashboard" && (
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1 text-sm text-neutral-400 hover:text-jp-indigo transition-colors"
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-jp-indigo/5 rounded-lg">
              <div className="w-6 h-6 bg-jp-red/10 text-jp-red rounded-full flex items-center justify-center">
                <User size={12} />
              </div>
              <span className="text-[12px] font-bold text-jp-indigo">
                {user.fullName || user.userName}
              </span>
              <span className="text-[10px] bg-jp-red text-white px-2 py-0.5 rounded-full font-bold">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
