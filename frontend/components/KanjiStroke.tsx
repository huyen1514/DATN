"use client";

import { useEffect, useRef } from "react";
import HanziWriter from "hanzi-writer";
import { Play, PenTool, RotateCcw } from "lucide-react";

interface KanjiStrokeProps {
    character: string; // Chữ Kanji truyền vào, ví dụ: "語"
    size?: number;     // Kích thước khung vẽ (mặc định 150px)
}

export default function KanjiStroke({ character, size = 150 }: KanjiStrokeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const writerRef = useRef<HanziWriter | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Xóa SVG cũ nếu có (bảo vệ khỏi React Strict Mode render 2 lần)
        containerRef.current.innerHTML = "";

        // Khởi tạo HanziWriter
        writerRef.current = HanziWriter.create(containerRef.current, character, {
            width: size,
            height: size,
            padding: 10,
            strokeColor: "#a71f48", // Màu nét vẽ (màu chủ đạo của bạn)
            radicalColor: "#155e75", // Màu bộ thủ (tuỳ chọn, để phân biệt bộ thủ)
            outlineColor: "#e2e8f0", // Màu viền mờ định hình (slate-200)
            drawingWidth: 15, // Độ đậm của nét bút
            showOutline: true,
            delayBetweenStrokes: 200, // Độ trễ giữa các nét (ms)

            // Tùy chọn dành riêng cho tiếng Nhật (nếu thư viện có dữ liệu nét chữ Nhật)
            // charDataLoader: (char, onComplete, onError) => { ... } 
        });

        // Cleanup khi component unmount hoặc character thay đổi
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [character, size]);

    // Hàm chạy hiệu ứng viết tự động
    const handleAnimate = () => {
        writerRef.current?.animateCharacter();
    };

    // Hàm cho phép người dùng tự vẽ (Quiz mode)
    const handleQuiz = () => {
        writerRef.current?.quiz({
            onMistake: (strokeData) => {
                console.log("Vẽ sai nét thứ:", strokeData.strokeNum);
            },
            onComplete: (summaryData) => {
                console.log("Hoàn thành bài tập viết!", summaryData);
            },
        });
    };

    // Hàm reset lại từ đầu
    const handleReset = () => {
        writerRef.current?.hideCharacter();
        writerRef.current?.showOutline();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            {/* Khu vực chứa chữ Kanji */}
            <div
                className="mb-4 flex items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200"
                ref={containerRef}
            >
                {/* HanziWriter sẽ render thẻ <svg> vào bên trong div này */}
            </div>

            {/* Các nút điều khiển */}
            <div className="flex flex-wrap justify-center gap-3">
                <button
                    onClick={handleAnimate}
                    className="flex items-center gap-2 rounded-full bg-[#a71f48] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b1b40]"
                >
                    <Play size={16} />
                    <span>Mẫu viết</span>
                </button>

                <button
                    onClick={handleQuiz}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-[#a71f48]"
                >
                    <PenTool size={16} />
                    <span>Tự tập viết</span>
                </button>

                <button
                    onClick={handleReset}
                    className="flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800"
                    title="Xóa để viết lại"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
    );
}