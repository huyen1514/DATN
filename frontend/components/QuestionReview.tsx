"use client";

import React from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface OptionDto {
  id: number;
  text: string;
}

interface QuestionReviewProps {
  question: {
    examQuestionId: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string | null;
    optionD: string | null;
    correctAnswer: number;
    explanation?: string;
    instruction?: string;
    passage?: string;
    section: number;
  };
  userAnswer: number | undefined;
  index: number;
}

const SECTION_LABELS: Record<number, string> = {
  0: "Từ vựng",
  1: "Ngữ pháp",
  2: "Đọc hiểu",
  3: "Nghe hiểu"
};

export default function QuestionReview({ question, userAnswer, index }: QuestionReviewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isCorrect = userAnswer === question.correctAnswer;
  
  const options = [
    { idx: 0, label: "A", text: question.optionA },
    { idx: 1, label: "B", text: question.optionB },
    ...(question.optionC ? [{ idx: 2, label: "C", text: question.optionC }] : []),
    ...(question.optionD ? [{ idx: 3, label: "D", text: question.optionD }] : [])
  ];

  const getOptionStatus = (idx: number) => {
    if (idx === question.correctAnswer) return "correct";
    if (idx === userAnswer && idx !== question.correctAnswer) return "wrong";
    return "neutral";
  };

  return (
    <div className={`mb-4 rounded-3xl border-2 overflow-hidden transition-all duration-300 ${isCorrect ? 'border-emerald-100 bg-white' : 'border-red-100 bg-white'}`}>
      {/* Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0
            ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}
          `}>
            {index + 1}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
              {SECTION_LABELS[question.section] || "CÂU HỎI"}
            </span>
            <p className="text-sm font-bold text-jp-indigo line-clamp-1 font-japanese">
              {question.question}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {userAnswer === undefined && (
             <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 uppercase tracking-widest">Bỏ trống</span>
           )}
           <div className={`p-2 rounded-xl ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-dashed border-neutral-100">
           {question.instruction && (
             <div className="mb-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex gap-3">
                <HelpCircle size={16} className="text-neutral-400 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-neutral-600 leading-relaxed italic">{question.instruction}</p>
             </div>
           )}

           {question.passage && (
             <div className="mb-6 p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Đoạn văn tham chiếu</span>
                <p className="text-sm text-jp-indigo leading-loose font-japanese whitespace-pre-wrap">{question.passage}</p>
             </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {options.map(opt => {
                const status = getOptionStatus(opt.idx);
                return (
                  <div 
                    key={opt.idx}
                    className={`px-4 py-3 rounded-2xl border-2 flex items-center gap-4 text-sm font-bold transition-all
                      ${status === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 
                        status === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : 'border-neutral-100 text-neutral-400 opacity-60'}
                    `}
                  >
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                        ${status === 'correct' ? 'bg-emerald-500 text-white' : 
                          status === 'wrong' ? 'bg-red-500 text-white' : 'bg-neutral-100 text-neutral-400'}
                     `}>
                       {opt.label}
                     </div>
                     <span className="flex-1 font-japanese">{opt.text}</span>
                     {status === 'correct' && <CheckCircle2 size={16} />}
                     {status === 'wrong' && <XCircle size={16} />}
                  </div>
                );
              })}
           </div>

           {question.explanation && (
             <div className="p-5 bg-jp-indigo rounded-[2rem] text-white shadow-xl shadow-jp-indigo/20">
                <div className="flex items-center gap-2 mb-3">
                   <div className="bg-jp-red text-white p-1.5 rounded-lg"><HelpCircle size={12} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Giải thích chi tiết</span>
                </div>
                <p className="text-xs font-medium leading-loose opacity-90">{question.explanation}</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
