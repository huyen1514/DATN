"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    api("/flashcards").then(setCards);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Số flashcard: {cards.length}</p>
    </div>
  );
}