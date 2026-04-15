"use client";

import { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [user] = useState<{fullName?: string, userName?: string, role?: string} | null | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user === null) {
      window.location.href = "/login";
    }
  }, [user]);

  if (user === undefined) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-white text-jp-ink font-sans selection:bg-jp-red/20 selection:text-jp-red">
      <MainNavbar />
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        {children}
      </main>
    </div>
  );
}
