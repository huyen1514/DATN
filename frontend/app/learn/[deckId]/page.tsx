"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import FlashCardDisplay from "@/components/FlashCardDisplay";
import DifficultyButtons from "@/components/DifficultyButtons";
import ProgressRing from "@/components/ProgressRing";
import MainNavbar from "@/components/MainNavbar";
import { ArrowLeft, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function LearnPage({ params }: { params: { deckId: string } }) {
  const router = useRouter();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [deckName, setDeckName] = useState("Loading...");
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    loadCards();
  }, [params.deckId]);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await api(`/flashcards/deck/${params.deckId}`);
      
      if (Array.isArray(response)) {
        setCards(response);
      } else if (response.cards) {
        setCards(response.cards);
        setDeckName(response.deckName || "Flashcards");
      }
    } catch (error) {
      console.error("Error loading cards:", error);
      alert("Failed to load flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (score: number) => {
    const card = cards[index];
    setIsReviewing(true);

    try {
      await api("/flashcards/review", "POST", {
        flashCardId: card.flashCardId,
        score,
      });

      // Add to history for undo functionality
      setHistory([...history, index]);

      // Move to next card
      setIsFlipped(false);
      setIndex(index + 1);
    } catch (error) {
      console.error("Error reviewing card:", error);
      alert("Failed to save review");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setIndex(index - 1);
      setIsFlipped(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      setIsFlipped(!isFlipped);
    } else if (e.code === "Digit1" || e.code === "Numpad1") {
      handleReview(1);
    } else if (e.code === "Digit2" || e.code === "Numpad2") {
      handleReview(2);
    } else if (e.code === "Digit3" || e.code === "Numpad3") {
      handleReview(3);
    } else if (e.code === "Digit4" || e.code === "Numpad4") {
      handleReview(4);
    } else if (e.code === "Escape") {
      handleBack();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, isFlipped]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-jp-washi">
        <MainNavbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-jp-indigo border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-jp-indigo font-semibold">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-jp-washi flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📭</div>
        <h1 className="text-3xl font-bold text-jp-indigo">No flashcards found</h1>
        <button
          onClick={handleBack}
          className="mt-4 px-6 py-3 bg-jp-indigo text-white rounded-lg hover:bg-jp-red transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-jp-sakura/20 to-jp-washi flex flex-col items-center justify-center gap-6 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-8xl"
        >
          🎉
        </motion.div>
        <h1 className="text-4xl font-bold text-jp-indigo text-center">
          Session Complete!
        </h1>
        <p className="text-lg text-neutral-600 text-center max-w-md">
          You completed {cards.length} flashcards. Great job! Keep practicing to improve your retention.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setIndex(0);
              setIsFlipped(false);
              setHistory([]);
            }}
            className="px-6 py-3 bg-jp-indigo text-white rounded-lg hover:bg-jp-red transition-colors font-semibold"
          >
            Review Again
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-3 border-2 border-jp-indigo text-jp-indigo rounded-lg hover:bg-black/5 transition-colors font-semibold"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  const card = cards[index];
  const progress = index + 1;
  const total = cards.length;

  return (
    <div className="min-h-screen bg-jp-washi flex flex-col text-jp-ink">
      <MainNavbar />
      {/* Header */}
      <header className="sticky top-[88px] z-20 bg-white/50 backdrop-blur-md border-b border-black/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-jp-indigo hover:text-jp-red transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex-1 text-center">
            <h1 className="font-serif text-xl font-bold text-jp-indigo">
              {deckName}
            </h1>
          </div>

          <div className="w-20 flex justify-end">
            <ProgressRing current={progress} total={total} size={60} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Card Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="w-full max-w-2xl aspect-video"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.4 }}
          >
            <FlashCardDisplay
              frontText={card.frontText}
              hiraganaText={card.hiraganaText}
              backText={card.backText}
              audioUrl={card.audioUrl}
              isFlipped={isFlipped}
              onClick={() => setIsFlipped(!isFlipped)}
              className="h-full"
              showAudio={true}
            />
          </motion.div>
        </AnimatePresence>

        {/* Difficulty Buttons */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DifficultyButtons
                onDifficulty={handleReview}
                disabled={isReviewing}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        {!isFlipped && (
          <motion.p
            className="text-center text-neutral-500 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Press{" "}
            <kbd className="px-2 py-1 bg-black/10 rounded text-jp-indigo font-semibold">
              SPACE
            </kbd>{" "}
            or click to flip
          </motion.p>
        )}
      </main>

      {/* Footer - Undo & Help */}
      <footer className="bg-white/50 backdrop-blur-md border-t border-black/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-neutral-500">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="text-jp-indigo hover:text-jp-red disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            ↶ Undo
          </button>
          <div className="text-xs">
            Keyboard: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> •{" "}
            <kbd>ESC</kbd> to quit
          </div>
        </div>
      </footer>
    </div>
  );
}