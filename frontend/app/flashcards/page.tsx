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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Filter & Search
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
      setCards(Array.isArray(response) ? response : []);

      // Load deck info
      try {
        const deckResponse = await api(`/decks/${deckId}`);
        setDeck(deckResponse);
      } catch {
        // Deck info not available, continue with cards
      }
    } catch (error) {
      console.error("Error loading cards:", error);
      alert("Failed to load flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = cards;

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Apply search filter
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
    if (!window.confirm("Delete this flashcard?")) return;

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

      const updatedCard: FlashCard = {
        ...selectedCard,
        ...data,
      };
      setCards(
        cards.map((c) =>
          c.flashCardId === selectedCard.flashCardId ? updatedCard : c
        )
      );

      alert("Flashcard updated successfully!");
    } catch (error) {
      console.error("Error updating card:", error);
      throw error;
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleCreateCard = async (data: EditFlashCardData) => {
    const deckIdStr = new URLSearchParams(window.location.search).get("deckId");
    const deckId = parseInt(deckIdStr || "0");

    setIsEditLoading(true);
    try {
      const response = await api("/flashcards", "POST", {
        ...data,
        deckId,
      });

      setCards([...cards, response]);
      alert("Flashcard created successfully!");
    } catch (error) {
      console.error("Error creating card:", error);
      throw error;
    } finally {
      setIsEditLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700";
      case "Learning":
        return "bg-yellow-100 text-yellow-700";
      case "Review":
        return "bg-orange-100 text-orange-700";
      case "Mastered":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const stats = {
    total: cards.length,
    due: cards.filter((c) => {
      if (!c.nextReviewDate) return false;
      return new Date(c.nextReviewDate) < new Date();
    }).length,
    learning: cards.filter((c) => c.status === "Learning").length,
    mastered: cards.filter((c) => c.status === "Mastered").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-jp-washi">
        <MainNavbar />
        <div className="flex items-center justify-center py-24">
          <div className="space-y-4 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-jp-indigo" />
            <p className="text-jp-indigo font-semibold">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jp-washi text-jp-ink">
      <MainNavbar />
      {/* Header */}
      <header className="sticky top-[88px] z-30 bg-white/50 backdrop-blur-md border-b border-black/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-jp-indigo hover:text-jp-red transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold font-serif text-jp-indigo">
              {deck?.title || "Flashcards"}
            </h1>
            {deck?.description && (
              <p className="text-sm text-neutral-500 mt-1">
                {deck.description}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setSelectedCard(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-jp-indigo text-white rounded-lg hover:bg-jp-red transition-colors font-semibold text-sm"
          >
            <Plus size={18} />
            New Card
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-black/10">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
              Total
            </p>
            <p className="text-3xl font-bold text-jp-indigo mt-2">
              {stats.total}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-black/10">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
              Due Today
            </p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {stats.due}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-black/10">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
              Learning
            </p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.learning}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-black/10">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
              Mastered
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.mastered}
            </p>
          </div>
        </div>

        {/* Study Button */}
        {cards.length > 0 && (
          <Link
            href={`/learn/${
              new URLSearchParams(window.location.search).get("deckId") || "0"
            }`}
            className="w-full mb-8 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-jp-indigo to-jp-red text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
          >
            <Play size={20} />
            Start Learning
          </Link>
        )}

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["All", "New", "Learning", "Review", "Mastered"] as StatusFilter[]).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === filter
                      ? "bg-jp-indigo text-white"
                      : "bg-white border border-black/10 text-jp-indigo hover:bg-black/5"
                  }`}
                >
                  {filter}
                </button>
              )
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search by front, back, or hiragana..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jp-indigo"
            />
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-medium mb-4">
              {cards.length === 0 ? "No flashcards yet" : "No cards match your filters"}
            </p>
            {cards.length === 0 && (
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setSelectedCard(null);
                }}
                className="px-4 py-2 bg-jp-indigo text-white rounded-lg hover:bg-jp-red transition-colors font-semibold"
              >
                Create Your First Card
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCards.map((card, idx) => (
                <motion.div
                  key={card.flashCardId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white rounded-xl border border-black/10 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadgeStyle(
                          card.status
                        )}`}
                      >
                        {card.status}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {card.reviewCount} reviews
                      </span>
                    </div>

                    {/* Front Text */}
                    <div className="border-b border-black/10 pb-3">
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide mb-1">
                        Front
                      </p>
                      <p className="text-xl font-serif text-jp-indigo font-bold break-words">
                        {card.frontText}
                      </p>
                    </div>

                    {/* Hiragana */}
                    {card.hiraganaText && (
                      <div className="border-b border-black/10 pb-3">
                        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide mb-1">
                          Reading
                        </p>
                        <p className="text-sm font-serif text-jp-indigo italic">
                          {card.hiraganaText}
                        </p>
                      </div>
                    )}

                    {/* Back Text */}
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide mb-1">
                        Meaning
                      </p>
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {card.backText}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-black/10 px-4 py-3 bg-neutral-50 flex gap-2">
                    <button
                      onClick={() => handleEditCard(card)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-jp-indigo text-white text-sm rounded hover:bg-jp-red transition-colors font-semibold"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.flashCardId)}
                      className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition-colors font-semibold"
                    >
                      <Trash2 size={16} />
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
