"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Wallet, Search, Filter, CheckCircle, Clock, XCircle, DollarSign, Activity, CreditCard, LayoutDashboard, RefreshCcw, MoreVertical, ShieldCheck } from "lucide-react";

interface PaymentUser {
  fullName: string;
  userId: number;
  userName: string;
  email: string;
}

interface PaymentExam {
  examId: number;
  examName: string;
}

interface Payment {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  createdAt: string;
  paymentDate: string | null;
  user: PaymentUser;
  exam: PaymentExam;
}

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  successTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
    loadPayments();
  }, [page, status, search]); // Có thể debounce search, ở đây dùng tạm effect

  const loadStats = async () => {
    try {
      const data = await api("/payments/admin/statistics");
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      let url = `/payments/admin/all?page=${page}&pageSize=${pageSize}`;
      if (status !== "all") {
        let statusValue = 0;
        if (status === "Success") statusValue = 1;
        if (status === "Failed") statusValue = 2;
        // Pending = 0
        url += `&status=${statusValue}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await api(url);
      setPayments(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    if (!confirm("Xác nhận cập nhật thủ công giao dịch này thành Thành Công (Success)? Điều này sẽ cấp quyền vào đề thi cho User.")) return;
    setResolvingId(id);
    try {
      const res = await api(`/payments/admin/resolve-payment/${id}`, "PUT");
      if (res.error) {
        alert("Lỗi: " + res.error);
      } else {
        alert("Cập nhật thành công!");
        loadPayments();
        loadStats();
      }
    } catch (error) {
      alert("Lỗi kết nối");
    } finally {
      setResolvingId(null);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Success":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><CheckCircle size={12} /> Thành Công</span>;
      case "Pending":
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><Clock size={12} /> Chờ Duyệt</span>;
      case "Failed":
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><XCircle size={12} /> Thất Bại</span>;
      default:
        return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-[10px] font-black uppercase tracking-widest w-max">{s}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-jp-indigo flex items-center gap-3">
              <div className="bg-emerald-500 text-white p-2 rounded-xl"><Wallet size={24} /></div>
              Quản Lý Thanh Toán
            </h1>
            <p className="text-neutral-400 text-sm mt-2 font-medium">Đối soát giao dịch và thống kê doanh thu hệ thống</p>
          </div>
          <button onClick={() => { loadPayments(); loadStats(); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-black/5 text-jp-indigo rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm">
            <RefreshCcw size={16} /> Làm mới
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Tổng doanh thu</p>
                <h3 className="text-2xl font-black text-emerald-600">{stats ? formatCurrency(stats.totalRevenue) : "..."}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-jp-indigo/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Doanh thu tháng này</p>
                <h3 className="text-2xl font-black text-jp-indigo">{stats ? formatCurrency(stats.monthlyRevenue) : "..."}</h3>
              </div>
              <div className="w-10 h-10 bg-jp-indigo/10 text-jp-indigo rounded-2xl flex items-center justify-center">
                <Activity size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Giao dịch thành công</p>
                <h3 className="text-2xl font-black text-neutral-800">{stats ? stats.successTransactions : "..."} <span className="text-sm font-medium text-neutral-400">/ {stats ? stats.totalTransactions : "..."}</span></h3>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <CreditCard size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Chờ xử lý / Lỗi</p>
                <h3 className="text-2xl font-black text-amber-500">{stats ? stats.pendingTransactions : "..."} <span className="text-sm font-medium text-neutral-400">- {stats ? stats.failedTransactions : "..."}</span></h3>
              </div>
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-jp-indigo transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm mã giao dịch, email khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-black/5 rounded-2xl outline-none focus:border-jp-indigo transition-all font-medium text-sm"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="pl-14 pr-10 py-4 bg-white border-2 border-black/5 rounded-2xl text-sm font-bold text-neutral-600 outline-none focus:border-jp-indigo transition-all min-w-[200px] appearance-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Success">Thành công</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Failed">Thất bại</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-xl shadow-black/[0.02]">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 border-4 border-jp-indigo/10 border-t-jp-indigo rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-black text-neutral-300 uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet size={40} className="text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-lg">Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-black/5">
                    <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Mã Giao Dịch</th>
                    <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Khách Hàng</th>
                    <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Đề Thi</th>
                    <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Số Tiền</th>
                    <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Trạng Thái</th>
                    <th className="text-right px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {payments.map(payment => (
                    <tr key={payment.paymentId} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-jp-indigo text-sm">{payment.transactionId || `#${payment.paymentId}`}</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                            {new Date(payment.createdAt).toLocaleDateString('vi-VN')} {new Date(payment.createdAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-800 text-sm">{payment.user.fullName || payment.user.userName}</span>
                          <span className="text-[11px] text-neutral-500">{payment.user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-neutral-700 text-sm">{payment.exam.examName}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-emerald-600 text-sm">{formatCurrency(payment.amount)}</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{payment.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(payment.paymentStatus)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {payment.paymentStatus !== "Success" && (
                          <button
                            onClick={() => handleResolve(payment.paymentId)}
                            disabled={resolvingId === payment.paymentId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jp-indigo/10 text-jp-indigo hover:bg-jp-indigo hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <ShieldCheck size={14} />
                            {resolvingId === payment.paymentId ? "Đang xử lý..." : "Duyệt thủ công"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination (Simple) */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-black/5 flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-black/5 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-black/5 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
