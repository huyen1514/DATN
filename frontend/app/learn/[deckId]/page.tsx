"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import MainNavbar from "@/components/MainNavbar";
import {
  ArrowLeft, RotateCcw, X, Check, Volume2, Sparkles, BookOpen,
  Maximize, Minimize,
  Loader2
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface FlashCard {
  flashCardId: number;
  deckId: number;
  frontText: string;
  hiraganaText?: string;
  backText: string;
  example?: string;
  audioUrl?: string;
  status: number;
  nextReviewDate?: string;
  reviewCount: number;
}

type SwipeDirection = "left" | "right" | null;

export default function LearnPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const router = useRouter();

  const [allCards, setAllCards] = useState<FlashCard[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashCard[]>([]);
  const [knownCards, setKnownCards] = useState<FlashCard[]>([]);
  const [learningCards, setLearningCards] = useState<FlashCard[]>([]);
  const [deckName, setDeckName] = useState("Đang tải...");
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeHint, setSwipeHint] = useState<SwipeDirection>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const leftOpacity = useTransform(x, [-100, -20, 0], [1, 0.5, 0]);
  const rightOpacity = useTransform(x, [0, 20, 100], [0, 0.5, 1]);
  const actionScale = useTransform(x, [-100, 0, 100], [0.8, 1, 0.8]);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await api(`/flashcards/deck/${deckId}`);

      let cards: FlashCard[] = [];
      if (Array.isArray(response)) {
        cards = response;
      } else if (response.cards) {
        cards = response.cards;
        setDeckName(response.deckName || "Flashcard");
      }

      setAllCards(cards);
      setCurrentDeck([...cards]);
      setKnownCards([]);
      setLearningCards([]);
      setIndex(0);
      setRound(1);
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadDeckName = async () => {
      try {
        const deck = await api(`/decks/${deckId}`);
        if (deck?.title) setDeckName(deck.title);
      } catch {
        // ignore
      }
    };
    loadDeckName();
  }, [deckId]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Lỗi khi chuyển đổi toàn màn hình:", err);
    }
  };

  const saveReview = async (card: FlashCard, score: number) => {
    try {
      await api("/flashcards/review", "POST", { flashCardId: card.flashCardId, score });
    } catch (error) {
      console.error("Error saving review:", error);
    }
  };

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (isAnimating || index >= currentDeck.length) return;
    setIsAnimating(true);

    const card = currentDeck[index];
    const targetX = direction === "right" ? 500 : -500;

    animate(x, targetX, {
      duration: 0.3,
      ease: "easeOut",
      onComplete: () => {
        if (direction === "right") {
          setKnownCards(prev => [...prev, card]);
          saveReview(card, 4);
        } else {
          setLearningCards(prev => [...prev, card]);
          saveReview(card, 1);
        }

        setIndex(prev => prev + 1);
        setIsFlipped(false);
        setSwipeHint(null);
        x.set(0);
        setIsAnimating(false);
      },
    });
  }, [isAnimating, index, currentDeck, x]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) handleSwipe("right");
    else if (info.offset.x < -threshold) handleSwipe("left");
    else animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });

    setSwipeHint(null);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > 30) setSwipeHint("right");
    else if (info.offset.x < -30) setSwipeHint("left");
    else setSwipeHint(null);
  };

  const handleStudyAgain = () => {
    setCurrentDeck([...learningCards]);
    setLearningCards([]);
    setIndex(0);
    setIsFlipped(false);
    setRound(prev => prev + 1);
    x.set(0);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isAnimating) return;
    if (e.code === "Space") {
      e.preventDefault();
      setIsFlipped(f => !f);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      handleSwipe("left");
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      handleSwipe("right");
    } else if (e.code === "Escape" && !document.fullscreenElement) {
      router.back();
    }
  }, [handleSwipe, isAnimating, router]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleBack = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-jp-red" />
            <p className="text-neutral-500 font-medium tracking-wide text-sm">Đang tải thẻ học...</p>
          </div>
        </div>
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
        <MainNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-200 mb-6">
            <BookOpen className="w-8 h-8 text-neutral-300" />
          </div>
          <h1 className="text-2xl font-serif text-neutral-900 mb-2">Thư mục trống</h1>
          <p className="text-neutral-500 mb-8 max-w-sm">Bộ thẻ này hiện chưa có nội dung nào để học.</p>
          <button onClick={handleBack} className="px-6 py-2.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors text-sm font-medium">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isRoundComplete = index >= currentDeck.length;
  const allMastered = isRoundComplete && learningCards.length === 0;
  const progress = Math.min(index, currentDeck.length);
  const total = currentDeck.length;

  if (allMastered && currentDeck.length > 0) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
        {!isFullscreen && <MainNavbar />}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border border-neutral-100 mb-8 relative">
            <Sparkles className="w-10 h-10 text-emerald-500" />
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
          </motion.div>
          <h1 className="text-4xl font-serif text-neutral-900 mb-4 tracking-tight">Tuyệt vời!</h1>
          <p className="text-neutral-500 max-w-sm mb-10 text-lg leading-relaxed">
            Bạn đã ghi nhớ thành công <span className="font-semibold text-neutral-900">{knownCards.length}</span> thẻ
            {round > 1 && <> sau <span className="font-semibold text-neutral-900">{round}</span> lượt ôn tập</>}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={() => { setCurrentDeck([...allCards]); setKnownCards([]); setLearningCards([]); setIndex(0); setIsFlipped(false); setRound(1); x.set(0); }} className="px-8 py-3.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors font-medium shadow-sm">
              Học lại từ đầu
            </button>
            <button onClick={handleBack} className="px-8 py-3.5 bg-white border border-neutral-200 text-neutral-900 rounded-full hover:bg-neutral-50 transition-colors font-medium">
              Quay lại thư viện
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRoundComplete && learningCards.length > 0) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
        {!isFullscreen && <MainNavbar />}
        <div className="flex-1 flex flex-col items-center p-6 max-w-2xl mx-auto w-full pt-12">
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-jp-red tracking-widest uppercase mb-2">Tổng kết</p>
            <h1 className="text-3xl font-serif text-neutral-900">Kết quả lượt {round}</h1>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="bg-white rounded-3xl border border-neutral-100 p-6 flex flex-col items-center shadow-sm">
              <span className="text-4xl font-light text-emerald-600 mb-2">{knownCards.length}</span>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Đã thuộc</span>
            </div>
            <div className="bg-white rounded-3xl border border-neutral-100 p-6 flex flex-col items-center shadow-sm">
              <span className="text-4xl font-light text-amber-500 mb-2">{learningCards.length}</span>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Cần ôn lại</span>
            </div>
          </div>
          <div className="w-full mb-12 px-2">
            <div className="flex justify-between text-sm font-medium text-neutral-500 mb-3">
              <span>Tiến độ ghi nhớ</span>
              <span>{Math.round((knownCards.length / allCards.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-neutral-200/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${(knownCards.length / allCards.length) * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>
          <button onClick={handleStudyAgain} className="w-full sm:w-auto px-10 py-4 bg-jp-red text-white rounded-full font-medium hover:bg-jp-red/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            <RotateCcw size={18} />
            Tiếp tục ôn {learningCards.length} thẻ
          </button>
        </div>
      </div>
    );
  }

  const card = currentDeck[index];

  // Helper tạo class CSS cho thẻ
  const cardClasses = `
    absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-10 bg-white rounded-[2rem] cursor-pointer
    transition-shadow duration-300
    ${swipeHint === "left" ? "shadow-[0_20px_40px_rgba(245,158,11,0.15)] border border-amber-300" : ""}
    ${swipeHint === "right" ? "shadow-[0_20px_40px_rgba(16,185,129,0.15)] border border-emerald-300" : ""}
    ${!swipeHint ? "shadow-[0_12px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] border border-neutral-100" : ""}
  `;

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col overflow-hidden">
      {!isFullscreen && <MainNavbar />}

      <header className={`sticky z-20 bg-neutral-50/80 backdrop-blur-md px-4 py-4 transition-all duration-300 ${!isFullscreen ? 'top-[88px]' : 'top-0'}`}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-neutral-900 tracking-wide">{deckName}</span>
            <span className="text-[11px] text-neutral-500 font-medium mt-0.5">Thẻ {progress + 1} / {total}</span>
          </div>
          <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all shadow-sm" title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
        <div className="max-w-xl mx-auto mt-4 h-1 bg-neutral-200/50 rounded-full overflow-hidden">
          <motion.div className="h-full bg-neutral-900 rounded-full" animate={{ width: `${(progress / total) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </header>

      <div className="max-w-xl mx-auto w-full px-6 pt-4 flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-2 text-amber-500">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          {learningCards.length} Học lại
        </div>
        <div className="flex items-center gap-2 text-emerald-600">
          Đã thuộc {knownCards.length}
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none z-0 max-w-3xl mx-auto w-full">
          <motion.div style={{ opacity: leftOpacity }} className="text-amber-500/20"><X size={120} strokeWidth={1} /></motion.div>
          <motion.div style={{ opacity: rightOpacity }} className="text-emerald-500/20"><Check size={120} strokeWidth={1} /></motion.div>
        </div>

        {/* Vùng bọc Perspective để tạo chiều sâu 3D */}
        <div className="w-full max-w-[380px] relative z-10 [perspective:2000px]">
          <motion.div
            className="w-full cursor-grab active:cursor-grabbing relative"
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          >
            <motion.div style={{ opacity: leftOpacity }} className="absolute top-8 left-6 z-30 px-4 py-1.5 border-[3px] border-amber-500 text-amber-500 font-bold uppercase tracking-widest rounded-lg -rotate-12 bg-white/80 backdrop-blur-sm pointer-events-none">
              Chưa thuộc
            </motion.div>
            <motion.div style={{ opacity: rightOpacity }} className="absolute top-8 right-6 z-30 px-4 py-1.5 border-[3px] border-emerald-500 text-emerald-500 font-bold uppercase tracking-widest rounded-lg rotate-12 bg-white/80 backdrop-blur-sm pointer-events-none">
              Đã thuộc
            </motion.div>

            {/* Vùng Flip chứa 2 mặt thẻ */}
            <motion.div
              className="relative w-full min-h-[460px] [transform-style:preserve-3d]"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 25 }}
            >
              {/* MẶT TRƯỚC */}
              <div
                className={cardClasses}
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                onClick={() => setIsFlipped(true)}
              >
                <h2 className="text-6xl sm:text-7xl font-bold font-serif text-neutral-900 mb-4 text-center leading-tight">
                  {card.frontText}
                </h2>
                {card.hiraganaText && (
                  <p className="text-xl text-neutral-400 font-serif italic text-center">
                    {card.hiraganaText}
                  </p>
                )}
                <p className="absolute bottom-8 text-xs font-medium text-neutral-300 uppercase tracking-widest">
                  Nhấn để lật thẻ
                </p>
              </div>

              {/* MẶT SAU */}
              <div
                className={cardClasses}
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
                onClick={() => setIsFlipped(false)}
              >
                <div className="mb-6 text-center">
                  <p className="text-2xl font-serif text-neutral-900 mb-1">{card.frontText}</p>
                  {card.hiraganaText && <p className="text-sm text-neutral-500 italic">{card.hiraganaText}</p>}
                </div>
                <div className="w-8 h-[3px] bg-jp-red rounded-full mb-6" />
                <p className="text-2xl font-medium text-neutral-800 text-center mb-6 leading-snug w-full">
                  {card.backText}
                </p>
                {card.example && (
                  <div className="w-full border-l-2 border-neutral-200 pl-4 py-1 mb-4 text-left">
                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{card.example}</p>
                  </div>
                )}
                {card.audioUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); new Audio(card.audioUrl).play(); }}
                    className="mt-auto w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all shadow-sm border border-neutral-100"
                  >
                    <Volume2 size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div style={{ scale: actionScale }} className="flex items-center gap-6 mt-10 relative z-10">
          <button onClick={() => handleSwipe("left")} disabled={isAnimating} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-neutral-100 hover:border-amber-500 hover:text-amber-500 text-neutral-400 transition-all disabled:opacity-50">
            <X size={28} />
          </button>
          <button onClick={() => setIsFlipped(!isFlipped)} className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors">
            <RotateCcw size={20} />
          </button>
          <button onClick={() => handleSwipe("right")} disabled={isAnimating} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-neutral-100 hover:border-emerald-500 hover:text-emerald-500 text-neutral-400 transition-all disabled:opacity-50">
            <Check size={28} />
          </button>
        </motion.div>

        <div className="mt-8 flex items-center gap-4 text-neutral-400 text-[11px] font-medium tracking-wide">
          <span className="flex items-center gap-1"><kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-neutral-500 font-sans shadow-sm">←</kbd> Chưa thuộc</span>
          <span className="flex items-center gap-1"><kbd className="px-3 py-1 bg-white border border-neutral-200 rounded text-neutral-500 font-sans shadow-sm">Space</kbd> Lật</span>
          <span className="flex items-center gap-1">Đã thuộc <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-neutral-500 font-sans shadow-sm">→</kbd></span>
        </div>
      </main>
    </div>
  );
}