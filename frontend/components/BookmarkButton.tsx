"use client";

import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  active: boolean;
  loading?: boolean;
  label: string;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}

export default function BookmarkButton({
  active,
  loading = false,
  label,
  onClick,
  size = "md",
  className = "",
}: BookmarkButtonProps) {
  const sizing =
    size === "sm"
      ? "h-9 min-w-9 px-3 text-xs rounded-xl"
      : "h-11 min-w-11 px-4 text-sm rounded-2xl";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-2 border transition-all ${sizing} ${active
          ? "border-amber-300 bg-amber-50 text-amber-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-[#a71f48]"
        } ${loading ? "cursor-wait opacity-70" : ""} ${className}`}
    >
      <Bookmark size={size === "sm" ? 15 : 17} className={active ? "fill-current" : ""} />
      {size === "md" && <span className="font-bold">{active ? "Đã lưu" : "Lưu"}</span>}
    </button>
  );
}
