"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Volume2, X, Trophy, CheckCircle2, Settings } from "lucide-react";
import Link from "next/link";

interface FlashCard {
  flashCardId: string;
  itemType: string;
  itemId: string;
  // TODO: Các field content thật khi backend gửi về
  frontText?: string;
  backText?: string;
}

export default function Flashcards() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States for Quizlet-like tracker
  const [learningCards, setLearningCards] = useState<FlashCard[]>([]);
  const [knownCards, setKnownCards] = useState<FlashCard[]>([]);

  useEffect(() => {
    // Gọi API lấy thẻ học, dùng mock loading ngắn để mượt UI
    api("/flashcards/today").then((data) => {
      setCards(data || []);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const handleReview = async (score: number) => {
    const card = cards[current];

    // Track "Chưa thuộc" (score=1) và "Đã thuộc" (score>1)
    if (score === 1) {
      setLearningCards((prev) => [...prev, card]);
    } else {
      setKnownCards((prev) => [...prev, card]);
    }

    // Gửi API không trễ UX
    api("/flashcards/review", "POST", {
      flashCardId: card.flashCardId,
      score,
    }).catch(console.error);

    setIsFlipped(false);

    // Đợi hiệu ứng lật thẻ quay về xong mới chuyển thẻ
    setTimeout(() => {
      setCurrent((prev) => prev + 1);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-jp-washi flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-jp-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isFinished = current >= cards.length;

  if (isFinished || cards.length === 0) {
    // MÀN HÌNH TỔNG KẾT (Summary Screen)
    const hasCards = cards.length > 0;
    return (
      <div className="min-h-screen bg-jp-washi flex flex-col font-sans text-jp-ink">
        <header className="px-6 py-6 flex items-center bg-white shadow-sm">
          <Link href="/dashboard" className="text-neutral-400 hover:text-jp-red transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="flex-1 text-center font-bold tracking-widest text-lg uppercase text-jp-indigo">KẾT QUẢ</h1>
          <div className="w-6"></div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col items-center pt-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-jp-red rounded-full flex items-center justify-center text-white shadow-xl shadow-jp-red/30 mb-8"
          >
            <Trophy size={48} />
          </motion.div>
          <h2 className="text-4xl font-serif text-jp-indigo mb-4 text-center">Hoàn thành bài học!</h2>
          <p className="text-neutral-500 mb-12 text-lg text-center">Bạn đã ôn tập xong các thẻ của ngày hôm nay.</p>

          {hasCards && (
            <div className="w-full max-w-xl bg-white rounded-[32px] p-10 border border-black/5 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-around mb-10 pb-10 border-b border-black/5">
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-[#f5a623] mb-2">{learningCards.length}</span>
                  <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">Đang học (Chưa thuộc)</span>
                </div>
                <div className="w-[1px] h-16 bg-neutral-100"></div>
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-[#4CAF50] mb-2">{knownCards.length}</span>
                  <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">Đã thuộc</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Link href="/dashboard" className="w-full bg-jp-indigo text-white text-center py-4 rounded-2xl font-bold tracking-widest hover:bg-jp-red transition-colors shadow-lg uppercase text-sm">
                  TRỞ LẠI DASHBOARD
                </Link>
              </div>
            </div>
          )}
          {!hasCards && (
            <Link href="/dashboard" className="bg-jp-indigo text-white px-10 py-4 rounded-full font-bold hover:bg-jp-red transition-colors shadow-lg uppercase tracking-widest text-sm">
              Về Dashboard
            </Link>
          )}
        </main>
      </div>
    );
  }

  const card = cards[current];
  const progressRatio = current / cards.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] font-sans text-jp-ink">

      {/* HEADER & PROGRESS BARS */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-neutral-400 hover:text-jp-red transition-colors cursor-pointer">
            <ArrowLeft size={24} />
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex font-bold text-sm">
              <span className="text-jp-indigo">{current + 1}</span>
              <span className="text-neutral-300 mx-2">/</span>
              <span className="text-neutral-500">{cards.length}</span>
            </div>
          </div>

          <button className="text-neutral-400 hover:text-jp-indigo transition-colors" title="Cài đặt">
            <Settings size={20} />
          </button>
        </div>

        {/* Thanh Progress */}
        <div className="h-1.5 w-full bg-neutral-100 flex relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressRatio * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-jp-indigo absolute left-0 top-0"
          />
        </div>
      </header>

      {/* KHU VỰC HỌC TẬP (STUDY AREA) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">

        {/* STATUS TRACKER */}
        <div className="w-full flex items-center justify-between mb-6 font-bold text-sm tracking-widest uppercase px-2">
          <div className="flex items-center gap-3 text-[#f5a623] bg-white px-4 py-2 rounded-full shadow-sm border border-[#f5a623]/20">
            <div className="w-5 h-5 rounded-full bg-[#f5a623] text-white flex items-center justify-center text-[10px]">
              {learningCards.length}
            </div>
            <span className="text-xs">Chưa thuộc</span>
          </div>
          <div className="flex items-center gap-3 text-[#4CAF50] bg-white px-4 py-2 rounded-full shadow-sm border border-[#4CAF50]/20">
            <span className="text-xs">Đã thuộc</span>
            <div className="w-5 h-5 rounded-full bg-[#4CAF50] text-white flex items-center justify-center text-[10px]">
              {knownCards.length}
            </div>
          </div>
        </div>

        {/* THẺ FLASHCARD 3D */}
        <div
          className="w-full aspect-[4/3] max-h-[60vh] perspective-[1500px] mb-12 cursor-pointer group"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={current} // Đổi thẻ sẽ mount thẻ mới
              initial={{ x: 300, opacity: 0, rotateY: 0 }}
              animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
              exit={{ x: -300, opacity: 0, pointerEvents: "none" }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
              className="w-full h-full relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* MẶT TRƯỚC (Front) */}
              <div
                className="absolute inset-0 w-full h-full bg-white rounded-[32px] shadow-2xl border border-black/5 flex flex-col items-center justify-center p-8 overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute top-6 left-6 text-neutral-300">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-neutral-100 px-3 py-1.5 rounded-full text-neutral-500">
                    {card?.itemType || "Flashcard"}
                  </span>
                </div>
                <button className="absolute top-6 right-6 text-neutral-400 hover:text-jp-red hover:bg-neutral-100 transition-colors p-3 rounded-full">
                  <Volume2 size={24} />
                </button>

                <h2 className="text-6xl md:text-8xl font-serif text-jp-indigo text-center break-words w-full px-6 leading-tight">
                  {card?.frontText || card?.itemId}
                </h2>

                {!isFlipped && (
                  <div className="absolute bottom-10 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 bg-neutral-100 px-4 py-2 rounded-full animate-bounce">
                      NHẤP ĐỂ LẬT THẺ
                    </span>
                  </div>
                )}
              </div>

              {/* MẶT SAU (Back) */}
              <div
                className="absolute inset-0 w-full h-full bg-jp-washi rounded-[32px] shadow-2xl border-4 border-jp-red/10 flex flex-col items-center justify-center p-8 overflow-hidden"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="absolute top-6 left-6 text-jp-red/50">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-jp-red/10 px-3 py-1.5 rounded-full text-jp-red">
                    Đáp Án
                  </span>
                </div>

                <h3 className="text-4xl md:text-5xl font-serif text-jp-indigo text-center mb-8 break-words w-full">
                  {card?.backText || card?.itemType}
                </h3>

                <div className="w-20 h-[2px] bg-jp-red/30 mb-8"></div>

                <p className="text-lg md:text-xl text-neutral-500 text-center max-w-md font-light">
                  [Ví dụ minh hoạ: Câu chứa từ vựng hoặc giải thích ngữ pháp sẽ hiển thị ở đây chờ kết nối API].
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* THANH ĐIỀU KHIỂN (Controls) */}
        <div className="w-full h-24 flex items-center justify-center">
          {isFlipped ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-4 md:gap-8 w-full max-w-xl justify-center"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleReview(1); }}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-white border border-transparent hover:border-[#f5a623]/40 text-[#f5a623] px-2 py-4 rounded-2xl shadow-md hover:shadow-xl transition-all"
              >
                <X size={28} />
                <span className="text-[10px] font-bold tracking-widest uppercase mt-1">Lại / Học Tiếp</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleReview(3); }}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-jp-indigo hover:bg-jp-red text-white py-5 rounded-2xl shadow-xl transition-all scale-105"
              >
                <Check size={32} />
                <span className="text-[10px] font-bold tracking-widest uppercase mt-1">Tốt / Đã Nhớ</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleReview(5); }}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-white border border-transparent hover:border-[#4CAF50]/40 text-[#4CAF50] px-2 py-4 rounded-2xl shadow-md hover:shadow-xl transition-all"
              >
                <CheckCircle2 size={28} />
                <span className="text-[10px] font-bold tracking-widest uppercase mt-1">Dễ</span>
              </button>
            </motion.div>
          ) : (
            <div className="text-neutral-400 text-[13px] font-medium tracking-wide">
              Hãy cố gắng nhớ nghĩa trong đầu trước khi lật thẻ nhé.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}