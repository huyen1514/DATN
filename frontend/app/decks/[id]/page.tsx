"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StudentLayout from "@/components/StudentLayout";
import { Play, Plus, Edit2, Trash2, BookOpen, SkipForward } from "lucide-react";

export default function DeckDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [deck, setDeck] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state for Flashcard (Create/Edit)
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [cardModalMode, setCardModalMode] = useState<"create" | "edit">("create");
    const [currentCardId, setCurrentCardId] = useState<number | null>(null);
    const [frontText, setFrontText] = useState("");
    const [backText, setBackText] = useState("");
    const [isSavingCard, setIsSavingCard] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch (e) {}
        }
        loadDeckDetails();
    }, [params.id]);

    const loadDeckDetails = async () => {
        try {
            const data = await api(`/decks/${params.id}`);
            if (data && data.deckId) {
                setDeck(data);
            } else {
                router.push("/dashboard");
            }
        } catch (e) {
            console.error(e);
            router.push("/dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    // Flashcard Handlers
    const openCreateCardModal = () => {
        setCardModalMode("create");
        setFrontText("");
        setBackText("");
        setIsCardModalOpen(true);
    };

    const openEditCardModal = (card: any) => {
        setCardModalMode("edit");
        setCurrentCardId(card.flashCardId);
        setFrontText(card.frontText);
        setBackText(card.backText);
        setIsCardModalOpen(true);
    };

    const handleSaveCard = async () => {
        if (!frontText.trim() || !backText.trim()) return;
        setIsSavingCard(true);
        if (cardModalMode === "create") {
            await api("/flashcards", "POST", {
                deckId: parseInt(params.id as string),
                frontText,
                backText
            });
        } else {
            await api(`/flashcards/${currentCardId}`, "PUT", {
                deckId: parseInt(params.id as string),
                frontText,
                backText
            });
        }
        setIsCardModalOpen(false);
        setIsSavingCard(false);
        loadDeckDetails();
    };

    const handleDeleteCard = async (id: number) => {
        if (confirm("Chắc chắn xoá thẻ này khỏi bộ?")) {
            await api(`/flashcards/${id}`, "DELETE");
            loadDeckDetails();
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto pb-20">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="h-64 bg-neutral-200 rounded-[30px] mb-8"></div>
                    </div>
                ) : !deck ? null : (
                    <>
                        {/* Deck Header Banner */}
                        <div className="bg-gradient-to-br from-jp-indigo to-[#1a2333] text-white p-8 md:p-12 rounded-[40px] shadow-2xl mb-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                            {/* Abstract Decor */}
                            <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-jp-red/20 blur-[80px] rounded-full pointer-events-none"></div>
                            
                            <div className="relative z-10 w-full md:w-2/3 text-center md:text-left">
                                <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-bold tracking-[0.2em] mb-4 uppercase backdrop-blur-md">
                                    BỘ THẺ TỪ
                                </span>
                                <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">{deck.title}</h1>
                                
                                {deck.description && (
                                    <p className="text-white/70 font-light mb-6 text-lg max-w-lg">{deck.description}</p>
                                )}

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm mt-4">
                                    <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full font-medium">
                                        <BookOpen size={16} className="text-jp-red" />
                                        {deck.flashCards?.length || 0} thẻ
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <Link 
                                    href={`/learn/${deck.deckId}`}
                                    className="group relative flex items-center justify-center gap-3 w-40 h-40 bg-jp-red rounded-full shadow-[0_10px_40px_rgba(188,0,45,0.4)] hover:scale-105 hover:bg-[#8b0000] transition-all duration-500 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full origin-center"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                       <Play size={32} className="text-white mb-2 ml-2" fill="white" />
                                       <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">HỌC NGAY</span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Flashcards Section */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-serif text-jp-indigo">Danh sách từ vựng</h2>
                            <button
                                onClick={openCreateCardModal}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-jp-indigo border border-black/10 rounded-full text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-neutral-50 hover:border-jp-red/30 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Thêm Thẻ
                            </button>
                        </div>

                        {/* Cards Grid */}
                        {deck.flashCards?.length === 0 ? (
                            <div className="bg-white/50 border border-black/5 rounded-3xl p-16 text-center shadow-sm">
                                <p className="text-neutral-500">Chưa có thẻ ghi nhớ nào trong bộ thẻ này. Hãy thêm từ vựng mới!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {deck.flashCards.map((card: any) => (
                                    <div key={card.flashCardId} className="group bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex items-stretch">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-100 group-hover:bg-jp-red transition-colors"></div>
                                        
                                        <div className="flex-1 pr-4 border-r border-black/5 py-2">
                                            <p className="text-xs text-neutral-400 font-bold tracking-widest uppercase mb-2">Mặt Trước</p>
                                            <p className="text-xl font-bold font-serif text-jp-indigo">{card.frontText}</p>
                                        </div>
                                        
                                        <div className="flex-1 pl-4 py-2 flex flex-col justify-between">
                                            <div>
                                                <p className="text-xs text-neutral-400 font-bold tracking-widest uppercase mb-2">Mặt Sau</p>
                                                <p className="text-lg text-neutral-700">{card.backText}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditCardModal(card)} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteCard(card.flashCardId)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Create/Edit Card */}
            {isCardModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 md:p-10">
                        <div className="flex border-b border-black/10 pb-6 mb-6">
                            <h2 className="text-xl font-serif text-jp-indigo">
                                {cardModalMode === "create" ? "Tạo Thẻ Mới" : "Chỉnh Sửa Thẻ"}
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase mb-3">Mặt Trước (Tiếng Nhật/Kanji)</label>
                                <textarea
                                    value={frontText}
                                    onChange={(e) => setFrontText(e.target.value)}
                                    className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:border-jp-indigo focus:bg-white transition-all font-serif text-2xl resize-none h-32"
                                    placeholder="Ví dụ: 日本語"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase mb-3">Mặt Sau (Nghĩa/Cách đọc)</label>
                                <textarea
                                    value={backText}
                                    onChange={(e) => setBackText(e.target.value)}
                                    className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:border-jp-indigo focus:bg-white transition-all text-lg resize-none h-32"
                                    placeholder="Nihongo (Tiếng Nhật)"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsCardModalOpen(false)}
                                className="flex-1 py-4 px-4 bg-white border border-neutral-200 text-neutral-500 rounded-xl font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-neutral-50 transition-colors"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                disabled={isSavingCard || !frontText.trim() || !backText.trim()}
                                onClick={handleSaveCard}
                                className="flex-1 py-4 px-4 bg-jp-indigo text-white rounded-xl font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#1a2333] transition-colors disabled:opacity-50"
                            >
                                {isSavingCard ? "Đang lưu..." : "Lưu Thẻ Vựng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}