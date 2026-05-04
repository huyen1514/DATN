"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { Folder, Plus, Edit2, Trash2, ChevronRight } from "lucide-react";

export default function FoldersPage() {
    const [folders, setFolders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch (e) { }
        }
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            const data = await api("/folders");
            if (Array.isArray(data)) {
                setFolders(data);
            } else if (data?.status === 401 || data?.title === "Unauthorized") {
                window.location.href = "/login";
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setName("");
        setDescription("");
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, folder: any) => {
        e.preventDefault();
        e.stopPropagation();
        setModalMode("edit");
        setCurrentFolderId(folder.folderId);
        setName(folder.name);
        setDescription(folder.description || "");
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        if (modalMode === "create") {
            await api("/folders", "POST", { name, description });
        } else {
            await api(`/folders/${currentFolderId}`, "PUT", { name, description });
        }
        setIsModalOpen(false);
        setIsSaving(false);
        loadFolders();
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Bạn có chắc chắn muốn xóa không gian học này không? Tất cả bộ thẻ bên trong sẽ mất.")) {
            await api(`/folders/${id}`, "DELETE");
            loadFolders();
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 border-b border-neutral-200 pb-6">
                    <div>
                        <p className="text-[#B91C1C] font-bold text-[10px] tracking-[0.2em] mb-2 uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#B91C1C] inline-block"></span>
                            学習スペース
                        </p>
                        <h1 className="text-3xl md:text-4xl font-serif text-neutral-800 tracking-tight">Không Gian Học</h1>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="mt-6 md:mt-0 group flex items-center gap-2 px-6 py-3 bg-[#B91C1C] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#991B1B] transition-all rounded-xl shadow-lg shadow-[#B91C1C]/20"
                    >
                        <span>Tạo Mới</span>
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-neutral-50/80 border border-neutral-100 h-40 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : folders.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                            <Folder size={32} className="text-neutral-300" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-serif text-neutral-800 mb-2">Chưa có không gian</h3>
                        <p className="text-neutral-400 mb-8 text-sm font-light">Bắt đầu hành trình học tập bằng cách tạo thư mục đầu tiên.</p>
                        <button
                            onClick={openCreateModal}
                            className="px-6 py-3 bg-[#B91C1C] text-white text-xs font-bold tracking-widest uppercase rounded-xl hover:bg-[#991B1B] shadow-lg shadow-[#B91C1C]/20 transition-all"
                        >
                            + Thêm không gian
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {folders.map((f) => (
                            <Link
                                href={`/folders/${f.folderId}`}
                                key={f.folderId}
                                className="group block bg-white p-6 pl-8 border border-neutral-200 rounded-2xl hover:border-[#B91C1C]/30 hover:shadow-[0_8px_30px_rgb(185,28,28,0.06)] relative transition-all duration-300 overflow-hidden"
                            >
                                {/* Thanh đỏ tươi hơn - Ngắn mặc định, Kéo dài full thẻ khi Hover */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#B91C1C] rounded-r-md transition-all duration-300 group-hover:h-full group-hover:w-2 group-hover:rounded-none"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-neutral-50 text-neutral-500 rounded-2xl flex items-center justify-center group-hover:bg-[#B91C1C]/5 group-hover:text-[#B91C1C] transition-colors duration-300">
                                        <Folder size={22} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={(e) => openEditModal(e, f)}
                                            className="p-2 text-neutral-400 hover:text-[#B91C1C] hover:bg-[#B91C1C]/10 rounded-xl transition-colors"
                                            title="Sửa"
                                        >
                                            <Edit2 size={16} strokeWidth={2} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, f.folderId)}
                                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-serif text-neutral-800 mb-2 line-clamp-1 relative z-10">{f.name}</h3>
                                {f.description && (
                                    <p className="text-sm text-neutral-500 font-light mb-6 line-clamp-2 min-h-[2.5rem] relative z-10">
                                        {f.description}
                                    </p>
                                )}

                                <div className="pt-4 mt-2 border-t border-neutral-100 flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-bold text-neutral-500 tracking-[0.15em] bg-neutral-50 px-3 py-1.5 rounded-full group-hover:bg-[#B91C1C]/5 group-hover:text-[#B91C1C] transition-colors">
                                        {f.decks?.length || 0} BỘ THẺ
                                    </span>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#B91C1C]/5 transition-colors">
                                        <ChevronRight size={16} className="text-neutral-300 group-hover:text-[#B91C1C] transition-colors" strokeWidth={2} />
                                    </div>
                                </div>

                                {/* Chữ Kanji trang trí (Giữ nguyên làm nền mờ) */}
                                <div className="absolute -bottom-4 -right-4 text-neutral-50 text-7xl font-serif font-black select-none pointer-events-none z-0 group-hover:scale-110 group-hover:text-[#B91C1C]/[0.02] transition-transform duration-500">
                                    学
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-8 border border-neutral-100 rounded-[2rem] shadow-2xl shadow-[#B91C1C]/10 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-neutral-50 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <span className="text-xl font-light leading-none">&times;</span>
                        </button>

                        <div className="mb-8">
                            <p className="text-[#B91C1C] font-bold text-[10px] tracking-[0.2em] mb-2 uppercase flex items-center gap-2">
                                {modalMode === "create" ? "新しい" : "編集"}
                            </p>
                            <h2 className="text-2xl font-serif text-neutral-800">
                                {modalMode === "create" ? "Không Gian Mới" : "Chỉnh Sửa"}
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">Tên không gian</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:border-[#B91C1C] focus:bg-white transition-all text-neutral-800 text-base font-medium placeholder:text-neutral-300 placeholder:font-sans placeholder:font-normal"
                                    placeholder="Nhập tên không gian học..."
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2 ml-1">Mô tả (Tùy chọn)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:border-[#B91C1C] focus:bg-white transition-all text-neutral-600 font-light resize-none h-24 placeholder:text-neutral-300"
                                    placeholder="Thêm ghi chú ngắn..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3.5 bg-white border border-neutral-200 text-neutral-500 text-xs font-bold tracking-widest uppercase hover:bg-neutral-50 rounded-xl transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={isSaving || !name.trim()}
                                onClick={handleSave}
                                className="flex-1 py-3.5 bg-[#B91C1C] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#991B1B] rounded-xl transition-colors disabled:opacity-50 disabled:bg-neutral-300"
                            >
                                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Tạo" : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}