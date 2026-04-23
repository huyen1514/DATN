"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StudentLayout from "@/components/StudentLayout";
import { Layers, Plus, Edit2, Trash2 } from "lucide-react";

export default function FolderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [folder, setFolder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [currentDeckId, setCurrentDeckId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch (e) {}
        }
        loadFolderDetails();
    }, [params.id]);

    const loadFolderDetails = async () => {
        try {
            const data = await api(`/folders/${params.id}`);
            if (data && data.folderId) {
                setFolder(data);
            } else {
                router.push("/folders");
            }
        } catch (e) {
            console.error(e);
            router.push("/folders");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setTitle("");
        setDescription("");
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, deck: any) => {
        e.preventDefault();
        e.stopPropagation();
        setModalMode("edit");
        setCurrentDeckId(deck.deckId);
        setTitle(deck.title);
        // GET detail of deck might be needed to get desc, but we can just use empty if not available in list
        setDescription(deck.description || ""); 
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim()) return;
        setIsSaving(true);
        if (modalMode === "create") {
            await api("/decks", "POST", { 
                title, 
                description, 
                isPublic: false,
                folderId: parseInt(params.id as string)
            });
        } else {
            await api(`/decks/${currentDeckId}`, "PUT", { 
                title, 
                description, 
                isPublic: false,
                folderId: parseInt(params.id as string)
            });
        }
        setIsModalOpen(false);
        setIsSaving(false);
        loadFolderDetails();
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Chắc chắn xoá bộ thẻ này? Tất cả thẻ bên trong sẽ bị xoá.")) {
            await api(`/decks/${id}`, "DELETE");
            loadFolderDetails();
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="h-8 bg-neutral-200 w-1/3 rounded mb-4"></div>
                        <div className="h-4 bg-neutral-100 w-1/4 rounded mb-12"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-neutral-100 rounded-3xl"></div>)}
                        </div>
                    </div>
                ) : !folder ? null : (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-serif text-jp-indigo mb-2">{folder.name}</h1>
                                <p className="text-neutral-500 font-light">{folder.description || "Danh sách các bộ thẻ thuộc không gian này."}</p>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-6 py-3 bg-jp-indigo text-white rounded-full text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-jp-red transition-colors shadow-lg shadow-jp-indigo/20"
                            >
                                <Plus size={16} /> Tạo Bộ Thẻ
                            </button>
                        </div>

                        {folder.decks?.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-black/5 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <Layers size={24} className="text-jp-red" />
                                </div>
                                <h3 className="text-xl font-bold text-jp-indigo mb-2">Thư mục trống</h3>
                                <p className="text-neutral-500 mb-6">Bạn chưa có bộ thẻ nào trong không gian này.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {folder.decks.map((d: any) => (
                                    <Link 
                                        href={`/decks/${d.deckId}`}
                                        key={d.deckId} 
                                        className="group bg-white p-6 rounded-3xl border border-transparent shadow-[0_2px_15px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-jp-red/10 hover:-translate-y-1 transition-all duration-300 block"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-red-50 text-jp-red rounded-xl flex items-center justify-center group-hover:bg-jp-red group-hover:text-white transition-colors">
                                                <Layers size={20} />
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => openEditModal(e, d)} className="p-2 text-neutral-300 hover:text-jp-indigo transition-colors hover:bg-neutral-100 rounded-full">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={(e) => handleDelete(e, d.deckId)} className="p-2 text-neutral-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-full">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-jp-indigo mb-1 group-hover:text-jp-red transition-colors">{d.title}</h3>
                                        <p className="text-xs text-neutral-400 font-medium tracking-[0.1em] uppercase">Bộ thẻ</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Create/Edit Deck */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-10">
                        <h2 className="text-2xl font-serif text-jp-indigo mb-6">
                            {modalMode === "create" ? "Tạo Bộ Thẻ Mới" : "Sửa Bộ Thẻ"}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Tên bộ thẻ</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light"
                                    placeholder="Ví dụ: Từ vựng Bài 1..."
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Mô tả</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light resize-none h-24"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3.5 px-4 bg-white border border-neutral-200 text-neutral-500 rounded-xl font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-neutral-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={isSaving || !title.trim()}
                                onClick={handleSave}
                                className="flex-1 py-3.5 px-4 bg-jp-indigo text-white rounded-xl font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#1a2333] transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Tạo Mới" : "Lưu Xong"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}
