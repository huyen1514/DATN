"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArrowRight, User } from "lucide-react";

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-6 backdrop-blur-xl md:px-16 sticky top-0 z-50 overflow-visible">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer lg:w-1/4">
        <div className="w-10 h-10 bg-jp-red rounded-full flex items-center justify-center text-white font-jp text-xl shadow-[0_0_15px_rgba(188,0,45,0.4)] group-hover:scale-110 transition-transform duration-300">
          日
        </div>
        <h1 className="text-xl font-bold tracking-[0.2em] font-serif uppercase text-jp-indigo mt-1">
          J-Learning
        </h1>
      </Link>

      <nav className="hidden lg:flex flex-1 justify-center items-center gap-6 xl:gap-8 text-[11px] font-bold tracking-[0.25em] z-50">
        {[
          { label: "TỪ VỰNG", path: "/vocabulary" },
          { label: "NGỮ PHÁP", path: "/grammar" },
          { label: "KANJI", path: "/kanji" },
          { label: "ĐỌC HIỂU", path: "/reading" },
          { label: "NGHE HIỂU", path: "/listening" },
          { label: "FLASHCARD", path: "/flashcards" },
        ].map((menu) => (
          <div key={menu.label} className="relative group py-2">
            <span className="cursor-pointer hover:text-jp-red transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-jp-red group-hover:after:w-full after:transition-all flex items-center gap-1">
              {menu.label}
            </span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-28 bg-white border border-black/5 shadow-xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col z-[9999] transform translate-y-2 group-hover:translate-y-0">
              {levels.length > 0 ? (
                levels.map((lvl) => (
                  <Link
                    key={lvl.levelId}
                    href={`${menu.path}/${lvl.levelName}`}
                    className="px-5 py-3 text-center text-jp-indigo hover:bg-jp-red hover:text-white transition-colors border-b border-black/5 last:border-0 hover:font-bold"
                  >
                    {lvl.levelName}
                  </Link>
                ))
              ) : (
                <span className="px-5 py-3 text-center text-neutral-400 text-[10px]">Đang tải...</span>
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden md:flex lg:w-1/4 justify-end items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-jp-indigo">
              <div className="w-8 h-8 rounded-full bg-jp-indigo/10 flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase">
                {user.fullName || user.userName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold tracking-[0.25em] text-jp-red hover:text-[#8b0000] px-4 border-l border-black/10 transition-colors"
            >
              ĐĂNG XUẤT
            </button>
            <Link
              href={user.role === "Admin" ? "/dashboard" : "/overview"}
              className="bg-jp-indigo text-white px-6 py-2.5 rounded-full text-[11px] font-bold tracking-[0.2em] shadow-md hover:bg-jp-red hover:-translate-y-0.5 transition-all outline-none"
            >
              WORKSPACE
            </Link>
          </div>
        ) : (
          <>
            <Link href="/login" className="text-[11px] font-bold tracking-[0.25em] hover:text-jp-red transition-colors">
              ĐĂNG NHẬP
            </Link>
            <Link
              href="/register"
              className="group relative overflow-hidden bg-jp-indigo text-jp-washi px-8 py-3.5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-[11px] font-bold tracking-[0.2em]"
            >
              <span className="relative z-10 flex items-center gap-2">
                BẮT ĐẦU <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 h-full w-full bg-jp-red scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0"></div>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
