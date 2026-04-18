"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import MainNavbar from "@/components/MainNavbar";
import {
  ArrowLeft, RotateCcw, X, Check, Volume2, Sparkles, BookOpen,
  Maximize, Minimize, Loader2
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

  // Animation values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-8, 0, 8]);
  const leftOpacity = useTransform(x, [-100, -20, 0], [1, 0.5, 0]);
  const rightOpacity = useTransform(x, [0, 20, 100], [0, 0.5, 1]);
  const actionScale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

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
    const targetX = direction === "right" ? 800 : -800;

    animate(x, targetX, {
      duration: 0.35,
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
    const threshold = 120;
    if (info.offset.x > threshold) handleSwipe("right");
    else if (info.offset.x < -threshold) handleSwipe("left");
    else animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });

    setSwipeHint(null);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > 40) setSwipeHint("right");
    else if (info.offset.x < -40) setSwipeHint("left");
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
    } else if (e.code === "ArrowLeft" || e.code === "Digit1" || e.code === "Numpad1") {
      e.preventDefault();
      handleSwipe("left");
    } else if (e.code === "ArrowRight" || e.code === "Digit4" || e.code === "Numpad4") {
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

  // --- RENDERS ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBEFEF] font-sans text-jp-ink flex flex-col relative overflow-hidden">
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="w-10 h-10 animate-spin text-jp-indigo" />
            <p className="text-jp-ink/70 font-semibold tracking-wide text-sm">Đang tải Sumi Ink...</p>
          </div>
        </div>
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBEFEF] font-sans text-jp-ink flex flex-col relative overflow-hidden">
        <MainNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-jp-ink/5 mb-6">
            <BookOpen className="w-10 h-10 text-jp-ink/40" />
          </div>
          <h1 className="text-3xl font-serif text-jp-ink mb-3">Thư mục trống</h1>
          <p className="text-jp-ink/70 mb-8 max-w-sm">Bộ thẻ này hiện chưa có nội dung nào để học.</p>
          <button onClick={handleBack} className="px-8 py-3 bg-jp-indigo text-white rounded-full hover:bg-jp-red transition-all text-sm font-bold">
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
      <div className="min-h-screen bg-[#FBEFEF] font-sans text-jp-ink flex flex-col relative overflow-hidden">
        {!isFullscreen && <MainNavbar />}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm border border-jp-ink/5 mb-8 relative">
            <Sparkles className="w-14 h-14 text-[#ffcc00]" />
          </motion.div>
          <h1 className="text-4xl font-serif text-jp-ink mb-4 tracking-tight">Tuyệt vời!</h1>
          <p className="text-jp-ink/70 max-w-md mb-10 text-lg leading-relaxed">
            Bạn đã ghi nhớ thành công <span className="font-bold text-green-600">{knownCards.length}</span> thẻ
            {round > 1 && <> sau <span className="font-bold text-green-600">{round}</span> lượt ôn tập</>}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => { setCurrentDeck([...allCards]); setKnownCards([]); setLearningCards([]); setIndex(0); setIsFlipped(false); setRound(1); x.set(0); }} className="px-8 py-4 bg-jp-indigo text-white rounded-xl hover:bg-jp-red transition-all font-bold">
              Học lại từ đầu
            </button>
            <button onClick={handleBack} className="px-8 py-4 bg-white border border-jp-indigo/20 text-jp-indigo rounded-xl hover:bg-black/5 transition-all font-bold">
              Quay lại thư viện
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRoundComplete && learningCards.length > 0) {
    return (
      <div className="min-h-screen bg-[#FBEFEF] font-sans text-jp-ink flex flex-col relative overflow-hidden">
        {!isFullscreen && <MainNavbar />}
        <div className="flex-1 flex flex-col items-center p-6 max-w-3xl mx-auto w-full pt-16 z-10">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-jp-red tracking-widest uppercase mb-3 bg-white border border-jp-indigo/10 px-4 py-1.5 rounded-full inline-block shadow-sm">Tổng kết</p>
            <h1 className="text-4xl font-serif text-jp-ink">Kết quả lượt {round}</h1>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full mb-12">
            <div className="bg-[#FCF8F8] rounded-2xl border border-jp-ink/5 p-8 flex flex-col items-center shadow-sm">
              <span className="text-5xl font-bold text-green-600 mb-3 drop-shadow-sm">{knownCards.length}</span>
              <span className="text-sm font-bold text-jp-ink/60 uppercase tracking-wider">Đã thuộc</span>
            </div>
            <div className="bg-[#FCF8F8] rounded-2xl border border-jp-ink/5 p-8 flex flex-col items-center shadow-sm">
              <span className="text-5xl font-bold text-jp-red mb-3 drop-shadow-sm">{learningCards.length}</span>
              <span className="text-sm font-bold text-jp-ink/60 uppercase tracking-wider">Chưa thuộc</span>
            </div>
          </div>
          <div className="w-full mb-12 px-6 bg-[#FCF8F8] p-6 rounded-2xl border border-jp-indigo/10 shadow-sm">
            <div className="flex justify-between text-sm font-bold text-jp-ink mb-4">
              <span>Tiến độ ghi nhớ</span>
              <span className="text-jp-indigo">{Math.round((knownCards.length / allCards.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-jp-indigo rounded-full" initial={{ width: 0 }} animate={{ width: `${(knownCards.length / allCards.length) * 100}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
            </div>
          </div>
          <button onClick={handleStudyAgain} className="w-full sm:w-auto px-12 py-4 bg-jp-red text-white rounded-2xl font-bold text-lg hover:bg-jp-red/90 transition-all flex items-center justify-center gap-3 shadow-md">
            <RotateCcw size={22} strokeWidth={2.5} />
            Tiếp tục ôn {learningCards.length} thẻ
          </button>
        </div>
      </div>
    );
  }

  const card = currentDeck[index];

  // Đã thay đổi độ bo góc từ rounded-xl thành rounded-[2rem] để thẻ cong mềm mại hơn hẳn
  const cardClasses = `
    absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-12 bg-[#FCF8F8] rounded-[2rem] cursor-pointer
    transition-shadow duration-300 w-full h-full border border-jp-ink/10
    ${swipeHint === "left" ? "shadow-[0_20px_60px_rgba(239,68,68,0.15)] border-2 border-jp-red" : ""}
    ${swipeHint === "right" ? "shadow-[0_20px_60px_rgba(16,185,129,0.15)] border-2 border-green-600" : ""}
    ${!swipeHint ? "shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]" : ""}
  `;

  return (
    <div className="min-h-screen bg-[#FBEFEF] font-sans text-jp-ink flex flex-col relative overflow-hidden">
      {!isFullscreen && <MainNavbar />}

      {/* HEADER */}
      <header className={`sticky z-20 bg-[#FBEFEF]/80 backdrop-blur-md px-4 py-4 transition-all duration-300 ${!isFullscreen ? 'top-[88px]' : 'top-0'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center text-jp-indigo hover:text-jp-red hover:bg-black/5 transition-all shadow-sm">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm md:text-base font-black text-jp-ink tracking-wide drop-shadow-sm">{deckName}</span>
            <span className="text-[11px] md:text-xs text-jp-ink/60 font-bold mt-0.5">Thẻ {progress + 1} / {total}</span>
          </div>
          <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full flex items-center justify-center text-jp-indigo hover:text-jp-red hover:bg-black/5 transition-all shadow-sm" title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}>
            {isFullscreen ? <Minimize size={18} strokeWidth={2.5} /> : <Maximize size={18} strokeWidth={2.5} />}
          </button>
        </div>
        <div className="max-w-5xl mx-auto mt-4 h-1 bg-black/5 rounded-full overflow-hidden shadow-inner">
          <motion.div className="h-full bg-jp-indigo rounded-full shadow-sm" animate={{ width: `${(progress / total) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative">

        {/* KHU VỰC BỘ ĐẾM */}
        <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2 text-sm font-semibold">
          <div className="flex items-center gap-3 text-jp-red">
            <div className="px-4 py-1 bg-white border border-jp-red/30 shadow-sm rounded-full flex items-center justify-center text-jp-red">
              {learningCards.length}
            </div>
            <span>Chưa thuộc</span>
          </div>
          <div className="flex items-center gap-3 text-green-600">
            <span>Đã biết</span>
            <div className="px-4 py-1 bg-white border border-green-600/30 shadow-sm rounded-full flex items-center justify-center text-green-600">
              {knownCards.length}
            </div>
          </div>
        </div>

        {/* ICON BACKGROUND LÚC VUỐT */}
        <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-10 pointer-events-none z-0 max-w-[1400px] mx-auto w-full">
          <motion.div style={{ opacity: leftOpacity }} className="text-jp-red/10 drop-shadow-2xl"><X size={200} strokeWidth={1} /></motion.div>
          <motion.div style={{ opacity: rightOpacity }} className="text-green-600/10 drop-shadow-2xl"><Check size={200} strokeWidth={1} /></motion.div>
        </div>

        {/* KHU VỰC THẺ */}
        <div className="w-full max-w-5xl relative z-10 [perspective:2000px]">
          <motion.div
            className="w-full cursor-grab active:cursor-grabbing relative"
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          >
            {/* CON DẤU */}
            <motion.div style={{ opacity: leftOpacity }} className="absolute top-8 left-8 z-30 px-6 py-2 border-[4px] border-jp-red text-jp-red text-xl font-bold uppercase tracking-widest rounded-xl -rotate-12 bg-[#FCF8F8]/90 pointer-events-none shadow-lg">
              Chưa thuộc
            </motion.div>
            <motion.div style={{ opacity: rightOpacity }} className="absolute top-8 right-8 z-30 px-6 py-2 border-[4px] border-green-600 text-green-600 text-xl font-bold uppercase tracking-widest rounded-xl rotate-12 bg-[#FCF8F8]/90 pointer-events-none shadow-lg">
              Đã thuộc
            </motion.div>

            {/* VÙNG FLIP CHỨA 2 MẶT THẺ */}
            <motion.div
              className="relative w-full aspect-video md:aspect-[21/9] min-h-[320px] max-h-[500px] [transform-style:preserve-3d]"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 25 }}
            >
              {/* MẶT TRƯỚC */}
              <div
                className={cardClasses}
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                onClick={() => setIsFlipped(true)}
              >
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-serif text-jp-ink mb-4 text-center leading-tight drop-shadow-sm">
                  {card.frontText}
                </h2>
                {card.hiraganaText && (
                  <p className="text-xl md:text-2xl text-jp-indigo font-serif italic text-center">
                    {card.hiraganaText}
                  </p>
                )}
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
                <div className="mb-4 sm:mb-6 text-center w-full">
                  <p className="text-2xl sm:text-3xl font-serif font-black text-jp-ink mb-1">{card.frontText}</p>
                  {card.hiraganaText && <p className="text-sm md:text-base text-jp-indigo italic">{card.hiraganaText}</p>}
                </div>
                <div className="w-16 h-[3px] bg-jp-indigo rounded-full mb-4 sm:mb-6 shadow-sm" />
                <p className="text-2xl md:text-3xl font-medium text-jp-ink text-center mb-6 leading-snug w-full">
                  {card.backText}
                </p>
                {card.example && (
                  <div className="w-full max-w-3xl border-l-4 border-jp-indigo pl-4 md:pl-6 py-2 mb-4 text-left">
                    <p className="text-base md:text-lg text-jp-ink/70 leading-relaxed whitespace-pre-line">{card.example}</p>
                  </div>
                )}
                {card.audioUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); new Audio(card.audioUrl).play(); }}
                    className="mt-auto w-14 h-14 bg-white rounded-full flex items-center justify-center text-jp-indigo hover:text-jp-red hover:bg-black/5 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-jp-ink/5"
                  >
                    <Volume2 size={24} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* NÚT ĐIỀU KHIỂN */}
        <motion.div style={{ scale: actionScale }} className="flex items-center gap-6 md:gap-10 mt-10 relative z-10">
          <button onClick={() => handleSwipe("left")} disabled={isAnimating} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center shadow-[0_10px_30px_rgba(239,68,68,0.1)] border border-jp-red/20 text-jp-red hover:brightness-105 hover:-translate-y-1 transition-all disabled:opacity-50">
            <X size={32} strokeWidth={3} />
          </button>
          <button onClick={() => setIsFlipped(!isFlipped)} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-jp-indigo/20 text-jp-indigo hover:text-jp-ink hover:bg-black/5 hover:-translate-y-1 transition-all">
            <RotateCcw size={24} strokeWidth={3} />
          </button>
          <button onClick={() => handleSwipe("right")} disabled={isAnimating} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.1)] border border-green-600/20 text-green-600 hover:brightness-105 hover:-translate-y-1 transition-all disabled:opacity-50">
            <Check size={32} strokeWidth={3} />
          </button>
        </motion.div>

        {/* PHÍM TẮT ShortCut */}
        <div className="mt-8 flex items-center gap-4 text-jp-ink/60 text-xs font-bold tracking-wide">
          <span className="flex items-center gap-1"><kbd className="px-2 py-1 bg-white border border-jp-ink/10 rounded-lg shadow-sm font-sans">← / 1</kbd> Chưa thuộc</span>
          <span className="flex items-center gap-1"><kbd className="px-3 py-1 bg-white border border-jp-ink/10 rounded-lg shadow-sm font-sans">Space</kbd> Lật thẻ</span>
          <span className="flex items-center gap-1">Đã thuộc <kbd className="px-2 py-1 bg-white border border-jp-ink/10 rounded-lg shadow-sm font-sans">→ / 4</kbd></span>
        </div>
      </main>
    </div>
  );
}