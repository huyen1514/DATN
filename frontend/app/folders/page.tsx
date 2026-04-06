"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FoldersPage() {
    const [folders, setFolders] = useState<any[]>([]);
    const [name, setName] = useState("");

    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        const data = await api("/folders");
        setFolders(data);
    };

    const createFolder = async () => {
        await api("/folders", "POST", { name });
        setName("");
        loadFolders();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Folders</h1>

            <div className="flex gap-2 mb-6">
                <input
                    className="border p-2 flex-1 rounded"
                    placeholder="Tên folder"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    onClick={createFolder}
                    className="bg-blue-500 text-white px-4 rounded"
                >
                    Tạo
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {folders.map((f) => (
                    <div key={f.folderId} className="p-4 border rounded shadow">
                        <h2 className="font-bold">{f.name}</h2>
                        <p className="text-sm text-gray-500">{f.decks?.length || 0} decks</p>
                    </div>
                ))}
            </div>
        </div>
    );
}