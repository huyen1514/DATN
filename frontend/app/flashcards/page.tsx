"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  Play,
  Loader2,
  Edit2,
  Search,
  Layers,
  Clock,
  Brain,
  Award,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainNavbar from "@/components/MainNavbar";
import EditFlashCardModal, {
  EditFlashCardData,
} from "@/components/EditFlashCardModal";

interface FlashCard {
  flashCardId: number;
  frontText: string;
  hiraganaText?: string;
  backText: string;
  example?: string;
  audioUrl?: string;
  status: string;
  nextReviewDate?: string;
  reviewCount: number;
}

interface Deck {
  deckId: number;
  title: string;
  description?: string;
}

type StatusFilter = "All" | "New" | "Learning" | "Review" | "Mastered";

export default function FlashcardDashboard() {
  const router = useRouter();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<FlashCard[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const deckIdStr = new URLSearchParams(window.location.search).get("deckId");
    if (deckIdStr) {
      loadCards(parseInt(deckIdStr));
    } else {
      router.push("/decks");
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, searchQuery, cards]);

  const loadCards = async (deckId: number) => {
    try {
      setIsLoading(true);
      const response = await api(`/flashcards/deck/${deckId}`);

      // Handle auth error
      if (!Array.isArray(response) && (response?.status === 401 || response?.title === "Unauthorized")) {
        window.location.href = "/login";
        return;
      }

      setCards(Array.isArray(response) ? response : []);
      try {
        const deckResponse = await api(`/decks/${deckId}`);
        setDeck(deckResponse);
      } catch { }
    } catch (error) {
      console.error("Error loading cards:", error);
      alert("Failed to load flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = cards;
    if (statusFilter !== "All") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.frontText.toLowerCase().includes(query) ||
          c.backText.toLowerCase().includes(query) ||
          (c.hiraganaText?.toLowerCase().includes(query) ?? false)
      );
    }
    setFilteredCards(filtered);
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!window.confirm("Are you sure you want to delete this flashcard?")) return;
    try {
      await api(`/flashcards/${cardId}`, "DELETE");
      setCards(cards.filter((c) => c.flashCardId !== cardId));
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete flashcard");
    }
  };

  const handleEditCard = (card: FlashCard) => {
    setSelectedCard(card);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (data: EditFlashCardData) => {
    if (!selectedCard) return;
    setIsEditLoading(true);
    try {
      await api(`/flashcards/${selectedCard.flashCardId}`, "PUT", data);
      const updatedCard: FlashCard = { ...selectedCard, ...data };
      setCards(cards.map((c) => (c.flashCardId === selectedCard.flashCardId ? updatedCard : c)));
    } catch (error) {
      console.error("Error updating card:", error);
      alert("Failed to update flashcard");
    } finally {
      setIsEditLoading(false);
      setIsEditModalOpen(false);
    }
  };

  const handleCreateCard = async (data: EditFlashCardData) => {
    const deckIdStr = new URLSearchParams(window.location.search).get("deckId");
    const deckId = parseInt(deckIdStr || "0");
    setIsEditLoading(true);
    try {
      const response = await api("/flashcards", "POST", { ...data, deckId });
      setCards([...cards, response]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating card:", error);
      alert("Failed to create flashcard");
    } finally {
      setIsEditLoading(false);
    }
  };

  // Tinh chỉnh lại màu sắc Badge mềm mại hơn
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-50 text-blue-600 border-blue-200";
      case "Learning": return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "Review": return "bg-orange-50 text-orange-600 border-orange-200";
      case "Mastered": return "bg-green-50 text-green-600 border-green-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const stats = {
    total: cards.length,
    due: cards.filter((c) => c.nextReviewDate && new Date(c.nextReviewDate) < new Date()).length,
    learning: cards.filter((c) => c.status === "Learning").length,
    mastered: cards.filter((c) => c.status === "Mastered").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-jp-washi flex flex-col">
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-jp-indigo" />
              <div className="absolute inset-0 border-4 border-jp-indigo/20 rounded-full animate-pulse" />
            </div>
            <p className="text-jp-indigo font-medium tracking-widest uppercase text-sm">Loading Deck...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jp-washi text-jp-ink font-sans selection:bg-jp-indigo/20">
      <MainNavbar />

      {/* Header */}
      <header className="sticky top-[88px] z-30 bg-jp-washi/80 backdrop-blur-xl border-b border-black/5 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 hover:text-jp-indigo transition-colors font-medium text-sm px-3 py-1.5 rounded-full hover:bg-black/5"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex-1 text-center px-4">
            <h1 className="text-2xl font-bold font-serif text-jp-indigo tracking-tight">
              {deck?.title || "Flashcards"}
            </h1>
            {deck?.description && (
              <p className="text-sm text-neutral-500 mt-1 truncate max-w-md mx-auto">
                {deck.description}
              </p>
            )}
          </div>

          <button
            onClick={() => { setIsCreateModalOpen(true); setSelectedCard(null); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-jp-indigo text-white rounded-full hover:bg-jp-indigo/90 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Card</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 lg:px-8 pb-24">

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Cards", value: stats.total, icon: Layers, color: "text-jp-indigo", bg: "bg-jp-indigo/5" },
            { label: "Due Today", value: stats.due, icon: Clock, color: "text-jp-red", bg: "bg-jp-red/5" },
            { label: "Learning", value: stats.learning, icon: Brain, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Mastered", value: stats.mastered, icon: Award, color: "text-green-600", bg: "bg-green-50" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-4 opacity-20 ${stat.color}`}>
                <stat.icon size={48} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <stat.icon size={16} />
                  </div>
                  <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Study Button */}
        {cards.length > 0 && (
          <Link
            href={`/learn/${new URLSearchParams(window.location.search).get("deckId") || "0"}`}
            className="group relative w-full mb-10 flex items-center justify-center gap-3 px-6 py-5 bg-jp-indigo text-white rounded-2xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-jp-indigo/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-jp-indigo via-indigo-600 to-jp-indigo opacity-80" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" /> {/* Tùy chọn nếu bạn có texture noise */}
            <div className="relative flex items-center gap-2 z-10">
              <Sparkles className="w-5 h-5 text-indigo-200 group-hover:text-white transition-colors" />
              <span className="font-bold text-lg tracking-wide">Start Learning Session</span>
              <Play className="w-5 h-5 ml-1 fill-current" />
            </div>
          </Link>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white p-2 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex flex-wrap gap-1 w-full md:w-auto p-1">
            {(["All", "New", "Learning", "Review", "Mastered"] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === filter
                    ? "bg-jp-washi text-jp-indigo shadow-sm border border-black/5"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-jp-ink"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border-transparent rounded-xl focus:bg-white focus:border-jp-indigo/30 focus:ring-2 focus:ring-jp-indigo/10 transition-all outline-none text-sm"
            />
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-black/5 border-dashed">
            <BookOpen className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-medium mb-6">
              {cards.length === 0 ? "Your deck is empty." : "No cards found matching your criteria."}
            </p>
            {cards.length === 0 && (
              <button
                onClick={() => { setIsCreateModalOpen(true); setSelectedCard(null); }}
                className="px-6 py-2.5 bg-white border border-black/10 text-jp-indigo rounded-full hover:bg-jp-washi hover:shadow-md transition-all font-semibold inline-flex items-center gap-2"
              >
                <Plus size={18} /> Create First Card
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredCards.map((card, idx) => (
                <motion.div
                  key={card.flashCardId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex flex-col bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(card.status)}`}>
                      {card.status}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium bg-neutral-50 px-2 py-1 rounded-md">
                      {card.reviewCount} rev
                    </span>
                  </div>

                  {/* Main Content (Karuta Style) */}
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    {/* Front Text (Kanji/Vocab) */}
                    <h3 className="text-4xl font-serif text-jp-ink font-bold mb-3 tracking-wide break-words w-full">
                      {card.frontText}
                    </h3>

                    {/* Reading (Hiragana) */}
                    {card.hiraganaText && (
                      <p className="text-sm font-medium text-jp-indigo/80 bg-jp-indigo/5 px-3 py-1 rounded-lg mb-4">
                        {card.hiraganaText}
                      </p>
                    )}

                    {/* Divider */}
                    <div className="w-12 h-0.5 bg-black/5 rounded-full mb-4"></div>

                    {/* Meaning (Back Text) */}
                    <p className="text-sm text-neutral-600 line-clamp-3 font-medium">
                      {card.backText}
                    </p>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex border-t border-black/5 bg-neutral-50/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCard(card)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-neutral-500 hover:text-jp-indigo hover:bg-black/5 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <div className="w-[1px] bg-black/5"></div>
                    <button
                      onClick={() => handleDeleteCard(card.flashCardId)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-neutral-400 hover:text-jp-red hover:bg-jp-red/5 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modals */}
      <EditFlashCardModal
        isOpen={isEditModalOpen || isCreateModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIsCreateModalOpen(false);
          setSelectedCard(null);
        }}
        onSave={selectedCard ? handleSaveEdit : handleCreateCard}
        initialData={selectedCard || undefined}
        isLoading={isEditLoading}
      />
    </div>
  );
}