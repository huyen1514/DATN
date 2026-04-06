"use client";

import { motion } from "framer-motion";

interface DifficultyButtonsProps {
  onDifficulty: (score: number) => void;
  disabled?: boolean;
}

interface DifficultyOption {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  description: string;
  timeframe: string;
  key: string;
}

const difficulties: DifficultyOption[] = [
  {
    score: 1,
    label: "Again",
    color: "text-white",
    bgColor: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    description: "Quên hoặc sai",
    timeframe: "1 giờ",
    key: "1",
  },
  {
    score: 2,
    label: "Hard",
    color: "text-white",
    bgColor: "bg-orange-500",
    hoverColor: "hover:bg-orange-600",
    description: "Khó, suy nghĩ lâu",
    timeframe: "1 ngày",
    key: "2",
  },
  {
    score: 3,
    label: "Good",
    color: "text-white",
    bgColor: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    description: "Tốt, tạm được",
    timeframe: "3 ngày",
    key: "3",
  },
  {
    score: 4,
    label: "Easy",
    color: "text-white",
    bgColor: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    description: "Dễ, hiểu rõ",
    timeframe: "7 ngày",
    key: "4",
  },
];

export default function DifficultyButtons({
  onDifficulty,
  disabled = false,
}: DifficultyButtonsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Legend */}
      <div className="mb-4 text-center text-sm text-neutral-500">
        <p className="font-medium mb-2">Keyboard: 1 / 2 / 3 / 4</p>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {difficulties.map((option) => (
          <motion.button
            key={option.score}
            onClick={() => onDifficulty(option.score)}
            disabled={disabled}
            className={`relative group overflow-hidden px-3 py-4 md:py-6 rounded-xl transition-all font-semibold text-center ${
              option.bgColor
            } ${option.color} ${option.hoverColor} disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            {/* Ripple effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-0"
              whileTap={{ opacity: 0.2 }}
            />

            <div className="relative z-10">
              <div className="text-xl md:text-2xl font-bold mb-1">
                {option.label}
              </div>
              <div className="text-xs md:text-sm opacity-90">
                ({option.key})
              </div>
              <div className="text-xs opacity-75 mt-1">{option.description}</div>
              <div className="text-xs font-semibold mt-1.5 opacity-90">
                ↻ {option.timeframe}
              </div>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-2">
              <div className="bg-black/80 text-white px-3 py-1 rounded text-xs whitespace-nowrap">
                Next review in {option.timeframe}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-neutral-400 mt-4">
        Choose how easy this card was for you
      </p>
    </div>
  );
}
