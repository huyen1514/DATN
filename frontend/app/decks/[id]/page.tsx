"use client";

import { useEffect, useState } from "react";
import { api, resolveMediaUrl } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StudentLayout from "@/components/StudentLayout";
import { Play, Plus, Edit2, Trash2, BookOpen, Volume2 } from "lucide-react";
import EditFlashCardModal, { EditFlashCardData } from "@/components/EditFlashCardModal";

export default function DeckDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [deck, setDeck] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state for Flashcard (Create/Edit)
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [isSavingCard, setIsSavingCard] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch (e) { }
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
        setSelectedCard(null);
        setIsCardModalOpen(true);
    };

    const openEditCardModal = (card: any) => {
        setSelectedCard(card);
        setIsCardModalOpen(true);
    };

    const handleSaveCard = async (data: EditFlashCardData) => {
        setIsSavingCard(true);
        try {
            if (!selectedCard) {
                await api("/flashcards", "POST", {
                    deckId: parseInt(params.id as string),
                    ...data
                });
            } else {
                await api(`/flashcards/${selectedCard.flashCardId}`, "PUT", {
                    deckId: parseInt(params.id as string),
                    ...data
                });
            }
            setIsCardModalOpen(false);
            loadDeckDetails();
        } catch (error) {
            console.error("Error saving card:", error);
            alert("Có lỗi khi lưu thẻ.");
        } finally {
            setIsSavingCard(false);
        }
    };

    const handleDeleteCard = async (id: number) => {
        if (confirm("Chắc chắn xoá thẻ này khỏi bộ?")) {
            await api(`/flashcards/${id}`, "DELETE");
            loadDeckDetails();
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto pb-20 px-4 pt-8">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="h-48 bg-neutral-100 rounded-[2rem] mb-12"></div>
                        <div className="h-8 bg-neutral-200 w-1/4 rounded-xl mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-neutral-50/80 border border-neutral-100 rounded-2xl"></div>)}
                        </div>
                    </div>
                ) : !deck ? null : (
                    <>
                        {/* Deck Header Banner - Soft Zen Style */}
                        <div className="bg-white border border-neutral-200 p-8 md:p-10 rounded-[2rem] mb-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                            {/* Decorative Kanji background */}
                            <div className="absolute -top-10 -right-10 text-neutral-50 text-[150px] font-serif font-black select-none pointer-events-none z-0">
                                帳
                            </div>

                            <div className="relative z-10 w-full md:w-2/3 text-center md:text-left">
                                <p className="text-[#B91C1C] font-bold text-[10px] tracking-[0.2em] mb-3 uppercase flex items-center justify-center md:justify-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#B91C1C] inline-block"></span>
                                    単語帳 (BỘ THẺ TỪ)
                                </p>
                                <h1 className="text-3xl md:text-4xl font-serif text-neutral-800 mb-3 leading-tight">{deck.title}</h1>

                                <p className="text-neutral-500 font-normal text-sm max-w-lg mx-auto md:mx-0 mb-6">
                                    {deck.description || "Chưa có mô tả cho bộ thẻ này."}
                                </p>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 text-neutral-600 px-4 py-2 rounded-xl text-sm font-medium">
                                        <BookOpen size={16} className="text-[#B91C1C]" />
                                        {deck.flashCards?.length || 0} thẻ vựng
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 w-full md:w-auto flex justify-center md:justify-end">
                                <Link
                                    href={`/learn/${deck.deckId}`}
                                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#B91C1C] text-white rounded-2xl hover:bg-[#991B1B] shadow-lg shadow-[#B91C1C]/20 transition-all w-full md:w-auto"
                                >
                                    <Play size={20} fill="currentColor" />
                                    <span className="text-sm font-bold tracking-widest uppercase">Học Ngay</span>
                                </Link>
                            </div>
                        </div>

                        {/* Flashcards Section */}
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-4 border-b border-neutral-100">
                            <div>
                                <h2 className="text-2xl font-serif text-neutral-800">Danh sách từ vựng</h2>
                            </div>
                            <button
                                onClick={openCreateCardModal}
                                className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-2.5 bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#B91C1C] hover:text-white hover:border-[#B91C1C] transition-all"
                            >
                                <Plus size={16} strokeWidth={2.5} /> Thêm Thẻ
                            </button>
                        </div>

                        {/* Cards Grid */}
                        {deck.flashCards?.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                                    <BookOpen size={32} className="text-neutral-300" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-serif text-neutral-800 mb-2">Bộ thẻ đang trống</h3>
                                <p className="text-neutral-400 mb-8 text-sm font-normal">Hãy thêm những từ vựng đầu tiên vào bộ thẻ này.</p>
                                <button
                                    onClick={openCreateCardModal}
                                    className="px-6 py-3 bg-[#B91C1C] text-white text-xs font-bold tracking-widest uppercase rounded-xl hover:bg-[#991B1B] shadow-lg shadow-[#B91C1C]/20 transition-all"
                                >
                                    + Thêm thẻ mới
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {deck.flashCards.map((card: any) => (
                                    <div key={card.flashCardId} className="group bg-white p-6 pl-8 rounded-2xl border border-neutral-200 hover:border-[#B91C1C]/30 shadow-sm hover:shadow-[0_8px_30px_rgb(185,28,28,0.06)] relative transition-all duration-300 flex flex-col justify-between overflow-hidden">

                                        {/* Thanh đỏ kéo dài full thẻ khi Hover */}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#B91C1C] rounded-r-md transition-all duration-300 group-hover:h-full group-hover:w-2 group-hover:rounded-none"></div>

                                        {/* Nút Sửa/Xóa (Góc trên phải) */}
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={() => openEditCardModal(card)}
                                                className="p-2 text-neutral-400 hover:text-[#B91C1C] hover:bg-[#B91C1C]/10 rounded-xl transition-colors"
                                                title="Sửa thẻ"
                                            >
                                                <Edit2 size={16} strokeWidth={2} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCard(card.flashCardId)}
                                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Xóa thẻ"
                                            >
                                                <Trash2 size={16} strokeWidth={2} />
                                            </button>
                                        </div>

                                        {/* Mặt Trước (Front) */}
                                        <div className="mb-5 pr-16">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] text-[#B91C1C] font-bold tracking-[0.15em] uppercase bg-[#B91C1C]/5 px-2 py-1 rounded-md">Mặt Trước</span>
                                                {card.status && card.status !== "New" && (
                                                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-1 rounded-md font-bold uppercase">{card.status}</span>
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-bold font-serif text-neutral-800">{card.frontText}</h3>
                                            {card.hiraganaText && (
                                                <p className="text-sm text-neutral-500 mt-1 font-medium">{card.hiraganaText}</p>
                                            )}
                                        </div>

                                        {/* Mặt Sau (Back) */}
                                        <div className="pt-4 border-t border-neutral-100 relative">
                                            {/* Nút phát âm thanh (Nếu có) */}
                                            {card.audioUrl && (
                                                <button
                                                    onClick={() => { const url = resolveMediaUrl(card.audioUrl); if (url) new Audio(url).play(); }}
                                                    className="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-50 text-neutral-500 hover:bg-[#B91C1C] hover:text-white transition-colors"
                                                    title="Nghe phát âm"
                                                >
                                                    <Volume2 size={14} strokeWidth={2} />
                                                </button>
                                            )}

                                            <span className="block text-[10px] text-neutral-400 font-bold tracking-[0.15em] uppercase mb-1">Mặt Sau</span>
                                            <p className="text-base text-neutral-800 font-medium">{card.backText}</p>

                                            {card.example && (
                                                <div className="mt-3 pl-3 border-l-2 border-[#B91C1C]/30 text-sm text-neutral-500 font-normal">
                                                    {card.example}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Create/Edit Card using component */}
            <EditFlashCardModal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                onSave={handleSaveCard}
                initialData={selectedCard || undefined}
                isLoading={isSavingCard}
            />
        </StudentLayout>
    );
}