"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Volume2 } from "lucide-react";

interface FlashCardDisplayProps {
  frontText: string;
  hiraganaText?: string;
  backText: string;
  audioUrl?: string;
  isFlipped?: boolean;
  onClick?: () => void;
  className?: string;
  showAudio?: boolean;
}

export default function FlashCardDisplay({
  frontText,
  hiraganaText,
  backText,
  audioUrl,
  isFlipped = false,
  onClick,
  className = "",
  showAudio = true,
}: FlashCardDisplayProps) {
  const [flipped, setFlipped] = useState(isFlipped);

  const toggleFlip = () => {
    setFlipped(!flipped);
    onClick?.();
  };

  const handleAudioPlay = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <motion.div
      className={`relative w-full h-full perspective cursor-pointer ${className}`}
      onClick={toggleFlip}
      initial={{ rotateY: flipped ? 180 : 0 }}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      style={{
        transformStyle: "preserve-3d",
      } as any}
    >
      {/* Front Side */}
      <motion.div
        className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 bg-gradient-to-br from-jp-washi to-white/80 border border-black/10 ${
          flipped ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{ backfaceVisibility: "hidden" } as any}
      >
        <div className="text-center space-y-6">
          <p className="text-sm font-medium text-neutral-500 tracking-wide uppercase">
            Front
          </p>
          <p className="text-6xl font-serif text-jp-ink font-bold break-words max-w-full">
            {frontText}
          </p>
          <p className="text-base text-neutral-400 italic">
            Click or press Space to flip
          </p>
        </div>
      </motion.div>

      {/* Back Side */}
      <motion.div
        className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 bg-gradient-to-br from-jp-sakura/30 to-white/80 border border-black/10 ${
          flipped ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        } as any}
      >
        <div className="w-full space-y-6 flex flex-col items-center">
          {/* Hiragana */}
          {hiraganaText && (
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-500 tracking-wide uppercase mb-2">
                Reading
              </p>
              <p className="text-2xl font-serif text-jp-indigo font-medium italic">
                {hiraganaText}
              </p>
            </div>
          )}

          {/* Meaning */}
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-500 tracking-wide uppercase mb-2">
              Meaning
            </p>
            <p className="text-3xl font-semibold text-jp-ink">
              {backText}
            </p>
          </div>

          {/* Audio Button */}
          {showAudio && audioUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAudioPlay();
              }}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-jp-indigo text-white hover:bg-jp-red transition-colors"
              title="Play audio"
            >
              <Volume2 size={18} />
              Play
            </button>
          )}

          <p className="text-xs text-neutral-400 mt-4 italic">
            Click to flip back
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
