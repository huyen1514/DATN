import React, { useState } from "react";
import { X, CheckCircle, Loader2, QrCode } from "lucide-react";
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
  onSuccess,
  currentUser
}: ExamPaymentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [transactionRef, setTransactionRef] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const price = exam?.price || 50000;
  const amntStr = price.toLocaleString("vi-VN");

  // ThÃ´ng tin VietQR giáº£ Ä‘á»‹nh.
  // Thay tháº¿ báº±ng cáº¥u hÃ¬nh tháº­t náº¿u cáº§n.
  const BANK_ID = "MB";
  const ACCOUNT_NO = "0123456789"; 
  const ACCOUNT_NAME = "TEST DEMO";
  // Content ck: TÃªn user + Thanh toan de thi
  const transferContent = `U${currentUser?.userId} EX${exam?.examId}`;
  
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const handleConfirm = async () => {
    if (!transactionRef.trim()) {
      alert("Vui lÃ²ng nháº­p mÃ£ giao dá»‹ch!");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/payments/confirm-and-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          examId: exam.examId,
          transactionRef: transactionRef
        })
      });
      const data = await res.json();
      if (data.success) {
        setStep(3);
      } else {
        alert(data.message || "XÃ¡c nháº­n tháº¥t báº¡i");
      }
    } catch (e) {
      console.error(e);
      alert("CÃ³ lá»—i xáº£y ra, vui lÃ²ng thá»­ láº¡i sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in relative">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-jp-indigo">Má»Ÿ KhoÃ¡ Äá» Thi</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="text-center">
              <p className="text-neutral-500 mb-2">Äá» thi: <span className="font-bold text-neutral-800">{exam?.examName}</span></p>
              <div className="text-3xl font-black text-jp-indigo mb-6">{amntStr} VNÄ</div>

              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 mb-6 flex flex-col items-center">
                <p className="text-sm font-bold text-neutral-600 mb-3 flex items-center gap-2"><QrCode size={18} /> QuÃ©t mÃ£ Ä‘á»ƒ thanh toÃ¡n</p>
                <div className="bg-white p-2 rounded-xl shadow-sm border border-neutral-100 mb-3">
                  <img src={qrUrl} alt="VietQR" className="w-48 h-48 object-cover" />
                </div>
                <p className="text-xs text-neutral-400">NgÃ¢n hÃ ng: <span className="font-bold text-neutral-600">{BANK_ID}</span></p>
                <p className="text-xs text-neutral-400">STK: <span className="font-bold text-neutral-600">{ACCOUNT_NO}</span></p>
                <p className="text-xs text-neutral-400">NgÆ°á»i nháº­n: <span className="font-bold text-neutral-600">{ACCOUNT_NAME}</span></p>
              </div>

              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mb-6 font-medium">
                Vui lÃ²ng thanh toÃ¡n sá»‘ tiá»n trÃªn báº±ng cÃ¡ch quÃ©t mÃ£ QR. Sau khi thanh toÃ¡n, nháº¥n &quot;ÄÃ£ thanh toÃ¡n&quot; Ä‘á»ƒ xÃ¡c nháº­n.
              </p>

              <button onClick={() => setStep(2)} className="w-full py-4 bg-jp-indigo text-white rounded-xl font-bold hover:bg-jp-red transition-all shadow-md">
                TÃ´i ÄÃ£ Thanh ToÃ¡n
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-neutral-600 mb-4 text-sm">
                Vui lÃ²ng nháº­p <span className="font-bold">MÃ£ Giao Dá»‹ch</span> (Transaction Code) tá»« biÃªn lai chuyá»ƒn khoáº£n cá»§a báº¡n Ä‘á»ƒ há»‡ thá»‘ng xÃ¡c nháº­n.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">MÃ£ Giao Dá»‹ch</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="VD: FT2131235123..."
                  className="w-full bg-neutral-50 border-2 border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-jp-indigo transition-colors font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 bg-neutral-100 text-neutral-500 rounded-xl font-bold hover:bg-neutral-200 transition-colors">
                  Quay Láº¡i
                </button>
                <button onClick={handleConfirm} disabled={isLoading} className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-jp-indigo text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  XÃ¡c Nháº­n
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-2">Thanh ToÃ¡n ThÃ nh CÃ´ng!</h3>
              <p className="text-neutral-500 mb-8 px-4">
                Äá» thi <span className="font-bold text-neutral-700">{exam?.examName}</span> Ä‘Ã£ Ä‘Æ°á»£c má»Ÿ khoÃ¡. Báº¡n cÃ³ thá»ƒ báº¯t Ä‘áº§u lÃ m bÃ i ngay bÃ¢y giá».
              </p>
              <button onClick={() => { onClose(); onSuccess(); }} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30">
                Báº¯t Äáº§u Thi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
