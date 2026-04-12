"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Users, Edit2, Trash2, Search, X, Shield, UserCheck, UserX } from "lucide-react";

interface User {
  userId: number;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ userName: "", email: "", fullName: "", role: "User", isActive: true });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api("/users");
      if (Array.isArray(data)) setUsers(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ userName: u.userName, email: u.email, fullName: u.fullName, role: u.role, isActive: u.isActive });
    setError(""); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setIsSaving(true); setError("");
    try {
      const res = await api(`/users/${editUser.userId}`, "PUT", form);
      if (res?.error || res?.title) { setError(res.error || res.title); setIsSaving(false); return; }
      setIsModalOpen(false); loadUsers();
    } catch (e) { setError("Có lỗi xảy ra"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    await api(`/users/${id}`, "DELETE"); loadUsers();
  };

  const filtered = users.filter(u => {
    const matchSearch = u.userName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-jp-indigo flex items-center gap-2">
              <Users size={24} className="text-pink-600" /> Quản Lý Người Dùng
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Quản lý tài khoản người dùng hệ thống</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Tìm theo tên, email..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm" />
          </div>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm min-w-[160px]">
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {isLoading ? <div className="p-8 text-center text-neutral-400">Đang tải...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center"><Users size={48} className="mx-auto text-neutral-200 mb-4" /><p className="text-neutral-500">Không tìm thấy người dùng</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Họ tên</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Username</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Vai trò</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(u => (
                  <tr key={u.userId} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-sm text-neutral-500">{u.userId}</td>
                    <td className="px-6 py-4 text-sm font-bold text-jp-indigo">{u.fullName}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{u.userName}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${u.role === "Admin" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                        {u.role === "Admin" && <Shield size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${u.isActive ? "bg-green-50 text-green-600" : "bg-neutral-100 text-neutral-500"}`}>
                        {u.isActive ? <><UserCheck size={10} /> Hoạt động</> : <><UserX size={10} /> Khóa</>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(u.userId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jp-indigo">Chỉnh Sửa Người Dùng</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Họ tên</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Username</label>
                <input type="text" value={form.userName} onChange={(e) => setForm({...form, userName: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Vai trò</label>
                  <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-jp-indigo uppercase mb-2">Trạng thái</label>
                  <select value={form.isActive ? "true" : "false"} onChange={(e) => setForm({...form, isActive: e.target.value === "true"})}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                    <option value="true">Hoạt động</option>
                    <option value="false">Khóa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-neutral-200 text-neutral-500 rounded-xl font-bold text-sm">Hủy</button>
              <button disabled={isSaving} onClick={handleSave} className="flex-1 py-3 bg-jp-indigo text-white rounded-xl font-bold text-sm hover:bg-jp-red disabled:opacity-50">
                {isSaving ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
