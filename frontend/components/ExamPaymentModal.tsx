import React, { useState } from "react";
import { X, Loader2, CreditCard } from "lucide-react";
import { API_URL } from "../lib/api";

interface ExamPaymentModalProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: any;
}

export default function ExamPaymentModal({
  exam,
  isOpen,
  onClose,
  currentUser
}: ExamPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const price = exam?.price || 50000;
  const amntStr = price.toLocaleString("vi-VN");

  const handlePayWithVNPay = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/payments/create-payment-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          examId: exam.examId,
          amount: price,
          paymentMethod: 1 // PaymentMethodType.VNPay
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Không thể tạo URL thanh toán VNPay");
      }
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayWithMomo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/payments/create-momo-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          examId: exam.examId,
          amount: price,
          paymentMethod: 0 // PaymentMethodType.Momo
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Không thể tạo URL thanh toán Momo");
      }
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in relative">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-jp-indigo">Mở Khoá Đề Thi</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-neutral-500 mb-2">Đề thi: <span className="font-bold text-neutral-800">{exam?.examName}</span></p>
          <div className="text-3xl font-black text-jp-indigo mb-6">{amntStr} VNĐ</div>

          <p className="text-sm text-neutral-500 mb-6">
            Bạn có thể thanh toán an toàn qua VNPay hoặc ví điện tử Momo.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePayWithVNPay} 
              disabled={isLoading} 
              className="w-full py-4 bg-[#005BAA] text-white rounded-xl font-bold hover:bg-[#004785] transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              Thanh Toán Qua VNPay
            </button>

            <button 
              onClick={handlePayWithMomo} 
              disabled={isLoading} 
              className="w-full py-4 bg-[#A50064] text-white rounded-xl font-bold hover:bg-[#8A0053] transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              Thanh Toán Bằng MoMo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}