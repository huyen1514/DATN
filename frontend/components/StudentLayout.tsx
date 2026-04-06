"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Folder, 
  Layers, 
  LayoutDashboard, 
  LogOut, 
  User, 
  Settings, 
  ChevronLeft 
} from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{fullName?: string, userName?: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) {}
    } else {
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Bảng điều khiển", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Không gian học", icon: Folder, href: "/folders" }
  ];

  if (!user) return null; // Wait for auth

  return (
    <div className="min-h-screen bg-jp-washi flex text-jp-ink font-sans selection:bg-jp-red/20 selection:text-jp-red">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white/50 backdrop-blur-xl border-r border-black/5 flex flex-col fixed inset-y-0 z-20">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-jp-red rounded-full flex items-center justify-center text-white font-serif shadow-md transition-transform group-hover:scale-105">
              日
            </div>
            <h1 className="text-sm font-bold tracking-[0.2em] font-serif uppercase text-jp-indigo">
              J-Learning
            </h1>
          </Link>
        </div>

        <div className="p-4 flex-1">
          <p className="text-[10px] font-bold text-neutral-400 mb-4 tracking-[0.2em] uppercase px-2">Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium
                    ${isActive 
                      ? "bg-jp-indigo text-white shadow-md shadow-jp-indigo/20" 
                      : "text-neutral-500 hover:bg-black/5 hover:text-jp-indigo"
                    }
                  `}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-black/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="h-16 px-8 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-black/5">
          <div className="flex items-center">
            {pathname !== "/dashboard" && pathname !== "/folders" && (
                <button 
                  onClick={() => window.history.back()}
                  className="flex items-center gap-1 text-sm text-neutral-500 hover:text-jp-indigo transition-colors"
                >
                  <ChevronLeft size={16} /> Quay lại
                </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-black/5">
              <div className="w-6 h-6 bg-jp-indigo/10 text-jp-indigo rounded-full flex items-center justify-center">
                <User size={12} />
              </div>
              <span className="text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase">
                {user.fullName || user.userName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
