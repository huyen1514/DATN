"use client";

import { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{fullName?: string, userName?: string, role?: string} | null>(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      window.location.href = "/login";
      return;
    }
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
    } catch {
      window.location.href = "/login";
    }
  }, []);

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-white text-jp-ink font-sans selection:bg-jp-red/20 selection:text-jp-red">
      <MainNavbar />
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        {children}
      </main>
    </div>
  );
}
