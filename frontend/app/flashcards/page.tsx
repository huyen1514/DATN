"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, BookOpen, Layers, ArrowRight, Play, Award, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlashCard {
  flashCardId: number;
  itemType: string;
  itemId: number;
  status: number;
  reviewCount: number;
  nextReviewDate: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

export default function FlashcardDashboard() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState("Vocabulary");
  const [newItemId, setNewItemId] = useState("");

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const data = await api("/flashcards");
      setCards(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá thẻ này không?")) return;
    try {
      await api(`/flashcards/${id}`, "DELETE");
      setCards(cards.filter(c => c.flashCardId !== id));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xoá thẻ.");
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemId) return;
    try {
      await api("/flashcards", "POST", {
        itemType: newItemType,
        itemId: parseInt(newItemId),
      });
      setIsAddModalOpen(false);
      setNewItemId("");
      fetchCards(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Lỗi thêm thẻ. Có thể thẻ đã tồn tại.");
    }
  };

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 0: return { label: "MỚI", color: "text-blue-600", bg: "bg-blue-50" };
      case 1: return { label: "ĐANG HỌC", color: "text-[#f5a623]", bg: "bg-[#f5a623]/10" };
      case 2: return { label: "ÔN TẬP", color: "text-purple-600", bg: "bg-purple-50" };
      case 3: return { label: "ĐÃ THUỘC", color: "text-[#4CAF50]", bg: "bg-[#4CAF50]/10" };
      default: return { label: "UNKNOWN", color: "text-neutral-500", bg: "bg-neutral-100" };
    }
  };

  // Đếm danh mục
  const masteredCount = cards.filter(c => c.status === 3).length;
  const learningCount = cards.length - masteredCount;

  return (
    <div className="min-h-screen flex flex-col bg-jp-washi font-sans text-jp-ink">
      
      {/* HEADER NAVBAR */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
         <div className="px-6 md:px-12 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Link href="/dashboard" className="text-neutral-400 hover:text-jp-red transition-colors flex items-center gap-2">
                  <ArrowLeft size={20} />
                  <span className="text-xs font-bold tracking-widest uppercase hidden md:block">Bảng điều khiển</span>
               </Link>
            </div>
            
            <h1 className="text-lg font-bold tracking-[0.2em] font-serif uppercase text-jp-indigo">
               BỘ SƯU TẬP THẺ
            </h1>

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-jp-indigo text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-jp-red transition-colors flex items-center gap-2 shadow-sm"
            >
               <Plus size={16} /> Thêm Thẻ
            </button>
         </div>
      </header>

      {/* HIỆU ỨNG TẢI */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-jp-red" size={32} />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">
            
            {/* VÙNG THỐNG KÊ (HERO) */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="col-span-1 border border-black/5 bg-white p-8 rounded-3xl shadow-sm flex flex-col justify-center items-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-jp-sakura/30 rounded-bl-full -z-0"></div>
                   <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2 relative z-10">Tổng Số Thẻ</h3>
                   <p className="text-5xl font-serif text-jp-indigo relative z-10">{cards.length}</p>
                </div>

                <div className="md:col-span-2 border border-black/5 bg-jp-indigo p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between relative overflow-hidden text-white gap-6">
                   <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none blur-xl"></div>
                   
                   <div>
                       <h2 className="text-3xl font-serif mb-4 flex items-center gap-3">
                         <BookOpen className="text-jp-red" />
                         Hành Trình Ôn Tập
                       </h2>
                       <div className="flex items-center gap-6">
                          <div>
                            <p className="text-3xl font-bold text-[#f5a623]">{learningCardsCount()}</p>
                            <p className="text-[10px] tracking-widest uppercase text-white/50 mt-1">Đang học</p>
                          </div>
                          <div className="w-[1px] h-8 bg-white/20"></div>
                          <div>
                            <p className="text-3xl font-bold text-[#4CAF50] flex items-center gap-2">{masteredCount} <Award size={20} className="text-[#4CAF50]" /></p>
                            <p className="text-[10px] tracking-widest uppercase text-white/50 mt-1">Thông thạo</p>
                          </div>
                       </div>
                   </div>

                   <Link href="/flashcards/learn" className="bg-jp-red text-white px-8 py-5 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-jp-red transition-all shadow-lg flex items-center gap-3 group w-full sm:w-auto text-center justify-center">
                      <Play size={18} className="fill-current" />
                      HỌC HÔM NAY
                   </Link>
                </div>
            </div>

            {/* DANH SÁCH THẺ (GRID) */}
            <div className="flex items-center gap-3 mb-6">
                <Layers className="text-jp-red" size={24} />
                <h3 className="text-xl font-bold font-serif text-jp-indigo">Tất cả thẻ của bạn</h3>
            </div>

            {cards.length === 0 ? (
               <div className="w-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-black/10 rounded-3xl bg-black/5">
                  <BookOpen size={48} className="text-neutral-300 mb-4" />
                  <p className="text-neutral-500 font-medium mb-6">Bạn chưa có thẻ flashcard nào.</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-white border border-jp-indigo text-jp-indigo px-8 py-3 rounded-full text-xs font-bold tracking-[0.2em] uppercase hover:bg-jp-indigo hover:text-white transition-colors"
                  >
                     Thêm thẻ ngay
                  </button>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {cards.map((card, idx) => {
                      const { label, color, bg } = getStatusDisplay(card.status);
                      return (
                         <motion.div 
                           key={card.flashCardId}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           transition={{ delay: idx * 0.05 }}
                           className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-lg transition-all group relative"
                         >
                            <button 
                              onClick={() => handleDelete(card.flashCardId)}
                              className="absolute top-4 right-4 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                              title="Xóa thẻ"
                            >
                               <Trash2 size={16} />
                            </button>

                            <div className="mb-4 flex items-center gap-2">
                               <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm ${bg} ${color}`}>
                                  {label}
                               </span>
                               <span className="text-xs text-neutral-400 border border-neutral-200 px-2 rounded-sm">{card.itemType}</span>
                            </div>

                            <h4 className="text-3xl font-serif text-jp-indigo mb-6 break-words">
                               #{card.itemId}
                            </h4>

                            <div className="border-t border-black/5 pt-4 text-[10px] tracking-widest uppercase text-neutral-400 flex flex-col gap-1.5">
                                <div className="flex justify-between">
                                   <span>ÔN TẬP:</span>
                                   <span className="text-jp-indigo font-bold">{new Date(card.nextReviewDate).toLocaleDateString("vi-VN")}</span>
                                </div>
                                <div className="flex justify-between">
                                   <span>LẦN LẶP:</span>
                                   <span className="text-jp-indigo font-bold">{card.reviewCount} lần</span>
                                </div>
                            </div>
                         </motion.div>
                      );
                    })}
                  </AnimatePresence>
               </div>
            )}
        </main>
      )}

      {/* MODAL THÊM THẺ */}
      <AnimatePresence>
         {isAddModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jp-indigo/40 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            >
               <motion.div 
                 initial={{ scale: 0.95, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.95, y: 20 }}
                 onClick={e => e.stopPropagation()}
                 className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/20 relative"
               >
                  <button 
                     onClick={() => setIsAddModalOpen(false)}
                     className="absolute top-6 right-6 text-neutral-400 hover:text-jp-red transition-colors"
                  >
                     <ArrowLeft className="rotate-45" size={20} style={{ transform: "rotate(45deg)"}} /> 
                     {/* Using rotate arrow inside plus like a cross, or just wait, actually Lucide has X icon, but ArrowLeft is easy to just not use, wait I can just use text 'ĐÓNG' */}
                  </button>
                  <div className="absolute top-6 right-6" onClick={() => setIsAddModalOpen(false)}>
                    <span className="text-xs font-bold text-neutral-400 hover:text-jp-red cursor-pointer uppercase tracking-widest border border-neutral-200 px-3 py-1 rounded-full">Đóng</span>
                  </div>
                  
                  <h3 className="text-2xl font-serif text-jp-indigo mb-6">Thêm Thẻ Mới</h3>
                  
                  <form onSubmit={handleAddCard} className="flex flex-col gap-5">
                     <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Loại Dữ Liệu</label>
                        <select 
                          value={newItemType} 
                          onChange={(e) => setNewItemType(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-jp-indigo focus:outline-none focus:border-jp-red focus:ring-1 focus:ring-jp-red transition-all"
                        >
                           <option value="Vocabulary">Từ vựng (Vocabulary)</option>
                           <option value="Grammar">Ngữ pháp (Grammar)</option>
                           <option value="Kanji">Kanji</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">ID Bài Học / Từ vựng</label>
                        <input 
                          type="number" 
                          required
                          value={newItemId}
                          onChange={(e) => setNewItemId(e.target.value)}
                          placeholder="Ví dụ: 12"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-jp-indigo focus:outline-none focus:border-jp-red focus:ring-1 focus:ring-jp-red transition-all"
                        />
                     </div>

                     <button type="submit" className="mt-4 bg-jp-indigo text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs hover:bg-jp-red transition-colors shadow-md">
                        Tạo Thẻ Flashcard
                     </button>
                  </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );

  function learningCardsCount() {
    return cards.length - masteredCount;
  }
}
