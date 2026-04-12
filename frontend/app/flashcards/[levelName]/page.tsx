"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import Link from "next/link";
import { Layers, ArrowRight, BookOpen } from "lucide-react";

export default function FlashcardsLevelPage() {
  const params = useParams();
  const levelName = params.levelName as string; 

  const [decks, setDecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [levelName]);

  const loadData = async () => {
    try {
      const allDecks = await api("/decks");
      if (Array.isArray(allDecks)) {
        // Filter decks based on title containing the level name
        const filtered = allDecks.filter((d: any) => 
          d.title.toUpperCase().includes(levelName.toUpperCase()) || 
          (d.description && d.description.toUpperCase().includes(levelName.toUpperCase()))
        );
        setDecks(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-jp-indigo mb-2 flex items-center gap-3 uppercase">
            <Layers size={28} className="text-jp-red" />
            BỘ THẺ TỪ (FLASHCARDS) - {levelName}
          </h1>
          <p className="text-neutral-500 font-light">Các bộ thẻ ghi nhớ dành cho trình độ {levelName.toUpperCase()}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white/50 border border-black/5 rounded-3xl animate-pulse" />)}
          </div>
        ) : decks.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-black/5 text-center">
            <BookOpen size={48} className="mx-auto text-neutral-200 mb-6" />
            <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có bộ thẻ nào</h3>
            <p className="text-neutral-500">Các bộ Flashcards ôn tập cho trình độ {levelName} đang được cập nhật.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {decks.map(deck => (
              <div key={deck.deckId} className="group bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="p-8">
                  <div className="w-12 h-12 bg-jp-red/10 rounded-2xl flex items-center justify-center text-jp-red mb-6 group-hover:scale-110 transition-transform">
                    <Layers size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-jp-indigo mb-2 group-hover:text-jp-red transition-colors">
                    {deck.title}
                  </h3>
                  {deck.description && (
                    <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{deck.description}</p>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full">
                      {deck.flashCardCount || 0} thẻ
                    </span>
                  </div>

                  <Link
                    href={`/learn/${deck.deckId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-jp-indigo to-jp-red text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                  >
                    Học ngay <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
