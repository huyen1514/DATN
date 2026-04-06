"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Learn({ params }: any) {
    const [cards, setCards] = useState<any[]>([]);
    const [index, setIndex] = useState(0);
    const [flip, setFlip] = useState(false);

    useEffect(() => {
        api(`/flashcards/deck/${params.deckId}`).then(setCards);
    }, []);

    const review = async (score: number) => {
        const card = cards[index];

        await api("/flashcards/review", "POST", {
            flashCardId: card.flashCardId,
            score
        });

        setFlip(false);
        setIndex((i) => i + 1);
    };

    if (index >= cards.length) return <h1>Done!</h1>;

    const card = cards[index];

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div
                onClick={() => setFlip(!flip)}
                className="w-96 h-60 bg-white shadow-xl flex items-center justify-center text-2xl cursor-pointer"
            >
                {flip ? card.backText : card.frontText}
            </div>

            {flip && (
                <div className="mt-4 flex gap-4">
                    <button onClick={() => review(1)}>Lại</button>
                    <button onClick={() => review(3)}>Tốt</button>
                    <button onClick={() => review(5)}>Dễ</button>
                </div>
            )}
        </div>
    );
}