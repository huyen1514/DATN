"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import {
  ArrowRight,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Level {
  levelId: number;
  levelName: string;
}

interface AppUser {
  fullName?: string;
  userName?: string;
  role?: string;
}

export default function MainNavbar() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    }

    const loadLevels = async () => {
      try {
        const result = await api("/levels");
        if (Array.isArray(result)) {
          setLevels(result as Level[]);
        }
      } catch (error) {
        console.error("Failed to fetch levels:", error);
      }
    };

    void loadLevels();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const navMenus = [
    { label: "TỪ VỰNG", path: "/vocabulary" },
    { label: "NGỮ PHÁP", path: "/grammar" },
    { label: "KANJI", path: "/kanji" },
    { label: "ĐỌC HIỂU", path: "/reading" },
    { label: "NGHE HIỂU", path: "/listening" },
    { label: "JLPT", path: "/exams" },
  ];

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">

        {/* LOGO SECTION - shrink-0 để không chiếm quá nhiều chỗ */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c62828] text-lg font-bold text-white shadow-lg shadow-red-200 transition-transform duration-300 group-hover:scale-105">
            日
          </div>
          <span className="font-serif text-xl font-black tracking-tight text-slate-800 xl:text-2xl">
            J-LEARNING
          </span>
        </Link>

        {/* NAVIGATION LINKS - Ép trên 1 dòng (flex-nowrap) */}
        <nav className="hidden flex-1 flex-nowrap items-center justify-center gap-x-1 px-4 lg:flex xl:gap-x-4">
          {navMenus.map((menu) => (
            menu.path === "/exams" ? (
              <Link
                key={menu.label}
                href={menu.path}
                className="whitespace-nowrap px-2 py-2 text-[13px] font-bold tracking-wide text-slate-600 transition-colors hover:text-[#c62828]"
              >
                {menu.label}
              </Link>
            ) : (
            <div key={menu.label} className="group relative">
              <button className="flex items-center gap-1 whitespace-nowrap px-2 py-2 text-[13px] font-bold tracking-wide text-slate-600 transition-colors hover:text-[#c62828]">
                {menu.label}
                <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180 opacity-50" />
              </button>

              <div className="absolute left-1/2 top-full min-w-[110px] -translate-x-1/2 pt-3 opacity-0 invisible transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-200/40">
                  {levels.length > 0 ? (
                    levels.map((lvl) => (
                      <Link
                        key={lvl.levelId}
                        href={`${menu.path}/${lvl.levelName}`}
                        className="block rounded-xl px-4 py-2.5 text-center text-xs font-bold text-slate-600 transition-all hover:bg-red-50 hover:text-[#c62828] uppercase"
                      >
                        {lvl.levelName}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[10px] text-slate-400 text-center">...</div>
                  )}
                </div>
              </div>
            </div>
            )
          ))}

          <Link
            href="/flashcards/prebuilt"
            className="whitespace-nowrap px-3 py-2 text-[13px] font-bold tracking-wide text-slate-600 transition-colors hover:text-[#c62828]"
          >
            FLASHCARD
          </Link>
        </nav>

        {/* AUTH SECTION - shrink-0 */}
        <div className="hidden shrink-0 items-center justify-end gap-5 md:flex">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-full transition-all duration-300 border ${isUserMenuOpen
                    ? "bg-slate-50 border-slate-200 shadow-sm"
                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-md"
                  }`}
              >
                <div className="flex flex-col items-end leading-none">
                  <span className="whitespace-nowrap text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                    {user.fullName || user.userName}
                  </span>
                  <span className="text-[9px] font-medium text-slate-400 mt-1 uppercase">Học viên</span>
                </div>
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 transition-colors">
                  <UserIcon size={18} />
                </div>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-2 w-52 origin-top-right rounded-[2rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200"
                  >
                    <div className="flex flex-col gap-1">
                      <Link
                        href={user.role === "Admin" ? "/dashboard" : "/overview"}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-[#c62828]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors">
                          <LayoutDashboard size={16} />
                        </div>
                        WORKSPACE
                      </Link>

                      <div className="my-1 h-[1px] bg-slate-100 mx-3" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50/50 text-red-400">
                          <LogOut size={16} />
                        </div>
                        ĐĂNG XUẤT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="whitespace-nowrap text-[12px] font-bold tracking-wide text-slate-500 transition-colors hover:text-slate-800"
              >
                ĐĂNG NHẬP
              </Link>

              <Link
                href="/register"
                className="group flex items-center gap-2 whitespace-nowrap rounded-full bg-[#c62828] px-6 py-3 text-[11px] font-bold tracking-widest text-white shadow-xl shadow-red-100 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
              >
                BẮT ĐẦU
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}