"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DeckDetail({ params }: any) {
    const [cards, setCards] = useState<any[]>([]);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        const data = await api(`/flashcards/deck/${params.id}`);
        setCards(data);
    };

    const addCard = async () => {
        await api("/flashcards", "POST", {
            deckId: params.id,
            frontText: front,
            backText: back
        });
        setFront("");
        setBack("");
        loadCards();
    };

    const deleteCard = async (id: number) => {
        await api(`/flashcards/${id}`, "DELETE");
        loadCards();
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-xl font-bold mb-4">Flashcards</h1>

            {/* CREATE */}
            <div className="bg-white p-4 shadow rounded mb-6">
                <input
                    placeholder="Front"
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    className="border p-2 w-full mb-2"
                />
                <input
                    placeholder="Back"
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    className="border p-2 w-full mb-2"
                />

                <button
                    onClick={addCard}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Add Card
                </button>
            </div>

            {/* LIST */}
            {cards.map((c) => (
                <div key={c.flashCardId} className="p-4 border mb-3 rounded">
                    <div className="flex justify-between">
                        <div>
                            <p className="font-bold">{c.frontText}</p>
                            <p className="text-gray-500">{c.backText}</p>
                        </div>

                        <button
                            onClick={() => deleteCard(c.flashCardId)}
                            className="text-red-500"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}