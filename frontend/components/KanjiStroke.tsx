"use client";

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { Play, PenTool, RotateCcw, AlertTriangle } from "lucide-react";

interface KanjiStrokeProps {
    character: string; // Chữ Kanji truyền vào, ví dụ: "語"
    size?: number;     // Kích thước khung vẽ (mặc định 150px)
}

// Hàm tải dữ liệu nét chữ từ CDN (JP trước, CN sau)
async function loadCharData(char: string): Promise<object | null> {
    try {
        // Thử kho tiếng Nhật trước
        const resJp = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data-jp@0/${char}.json`);
        if (resJp.ok) return await resJp.json();

        // Fallback sang kho Hán tự mặc định
        console.log(`Character ${char} not found in JP dataset, trying CN fallback...`);
        const resCn = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`);
        if (resCn.ok) return await resCn.json();
    } catch (err) {
        console.warn(`[KanjiStroke] Network error loading "${char}":`, err);
    }
    return null;
}

export default function KanjiStroke({ character, size = 150 }: KanjiStrokeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const writerRef = useRef<HanziWriter | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        let cancelled = false;

        // Xóa SVG cũ nếu có
        containerRef.current.innerHTML = "";
        setLoadError(false);

        // Tải dữ liệu trước, rồi mới khởi tạo HanziWriter
        loadCharData(character).then((charData) => {
            if (cancelled || !containerRef.current) return;

            if (!charData) {
                console.warn(`[KanjiStroke] Không có dữ liệu nét vẽ cho "${character}"`);
                setLoadError(true);
                return;
            }

            try {
                writerRef.current = HanziWriter.create(containerRef.current, character, {
                    width: size,
                    height: size,
                    padding: 10,
                    strokeColor: "#a71f48",
                    radicalColor: "#155e75",
                    outlineColor: "#e2e8f0",
                    drawingWidth: 15,
                    showOutline: true,
                    delayBetweenStrokes: 200,

                    // Trả dữ liệu đã tải sẵn, không cần fetch lại
                    charDataLoader: (_char, onComplete) => {
                        onComplete(charData as any);
                    }
                });
            } catch (err) {
                console.warn(`[KanjiStroke] Lỗi khởi tạo HanziWriter cho "${character}":`, err);
                setLoadError(true);
            }
        });

        // Cleanup khi component unmount hoặc character thay đổi
        return () => {
            cancelled = true;
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

    // Giao diện thay thế khi không tải được dữ liệu nét vẽ
    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center w-full">
                <div
                    className="mb-4 flex flex-col items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200 text-slate-400"
                    style={{ width: size, height: size }}
                >
                    <span className="text-5xl mb-2">{character}</span>
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                        <AlertTriangle size={12} />
                        <span>Chưa có mẫu viết</span>
                    </div>
                </div>
            </div>
        );
    }

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

                {/* <button
                    onClick={handleReset}
                    className="flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800"
                    title="Xóa để viết lại"
                >
                    <RotateCcw size={16} />
                </button> */}
            </div>
        </div>
    );
}