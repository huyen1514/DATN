"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const [decks, setDecks] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    const data = await api("/decks");
    setDecks(data);
  };

  const createDeck = async () => {
    await api("/decks", "POST", {
      title,
      description: "",
      isPublic: false
    });
    setTitle("");
    loadDecks();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Decks</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Tên deck"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          onClick={createDeck}
          className="bg-indigo-500 text-white px-4 rounded"
        >
          Tạo Deck
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {decks.map((d) => (
          <Link
            href={`/decks/${d.deckId}`}
            key={d.deckId}
            className="p-4 border rounded shadow hover:shadow-lg"
          >
            <h2 className="font-bold">{d.title}</h2>
            <p>{d.flashCardCount} cards</p>
          </Link>
        ))}
      </div>
    </div>
  );
}