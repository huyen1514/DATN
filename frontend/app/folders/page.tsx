"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import StudentLayout from "@/components/StudentLayout";
import { Folder, MoreVertical, Plus, Edit2, Trash2 } from "lucide-react";

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
            try { setUser(JSON.parse(userStr)); } catch (e) {}
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
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-jp-indigo mb-2">Không Gian Học</h1>
                        <p className="text-neutral-500 font-light">Danh sách các thư mục chứa các bộ thẻ học tập.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-6 py-3 bg-jp-indigo text-white rounded-full text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-jp-red transition-colors shadow-lg shadow-jp-indigo/20"
                    >
                        <Plus size={16} /> Tạo Mới
                    </button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white/50 border border-black/5 rounded-3xl h-40 animate-pulse"></div>
                        ))}
                    </div>
                ) : folders.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-black/5 text-center flex flex-col items-center shadow-sm">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <Folder size={32} className="text-blue-300" />
                        </div>
                        <h3 className="text-xl font-bold text-jp-indigo mb-2">Chưa có không gian nào</h3>
                        <p className="text-neutral-500 mb-6 max-w-sm">Dữ liệu các thư mục Không gian học đang được cập nhật.</p>
                        <button onClick={openCreateModal} className="px-8 py-3 bg-jp-red text-white rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-[#8b0000] transition-colors">
                            THÊM THƯ MỤC KHÔNG GIAN
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {folders.map((f) => (
                            <Link 
                                href={`/folders/${f.folderId}`}
                                key={f.folderId} 
                                className="group bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden block"
                            >
                                {/* Decorative abstract shape */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-[100px] pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Folder size={20} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => openEditModal(e, f)} className="p-2 text-neutral-300 hover:text-jp-indigo transition-colors hover:bg-neutral-100 rounded-full">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={(e) => handleDelete(e, f.folderId)} className="p-2 text-neutral-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-full">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-jp-indigo mb-1 group-hover:text-jp-red transition-colors relative z-10">{f.name}</h3>
                                {f.description && <p className="text-xs text-neutral-500 mb-4 line-clamp-2 relative z-10">{f.description}</p>}
                                <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-xs font-bold text-neutral-400 relative z-10">
                                    <span>{f.decks?.length || 0} BỘ THẺ</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-10 transform transition-all">
                        <div className="w-12 h-12 bg-jp-indigo/10 rounded-full flex items-center justify-center mb-6">
                            <Folder size={24} className="text-jp-indigo" />
                        </div>
                        <h2 className="text-2xl font-serif text-jp-indigo mb-6">
                            {modalMode === "create" ? "Không Gian Mới" : "Chỉnh Sửa"}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Tên không gian</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light"
                                    placeholder="Ví dụ: Tiếng Nhật N5"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Mô tả (Tùy chọn)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light resize-none h-24"
                                    placeholder="Ghi chú ngắn về Không gian học này..."
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
                                disabled={isSaving || !name.trim()}
                                onClick={handleSave}
                                className="flex-1 py-3.5 px-4 bg-jp-indigo text-white rounded-xl font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#1a2333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Đang lưu..." : modalMode === "create" ? "Tạo mới" : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}