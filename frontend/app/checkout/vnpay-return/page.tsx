"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const success = searchParams.get("success") === "true";
  const examId = searchParams.get("examId");
  const error = searchParams.get("error");
  
  const [countdown, setCountdown] = useState(5);

  // Effect đếm ngược
  useEffect(() => {
    if (success && examId && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success, examId, countdown]);

  // Effect chuyển hướng khi đếm ngược kết thúc
  useEffect(() => {
    if (success && examId && countdown === 0) {
      router.push(`/exams/${examId}`);
    }
  }, [success, examId, countdown, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MainNavbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-fade-in">
          {success ? (
            <>
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Thanh Toán Thành Công!</h2>
              <p className="text-neutral-500 mb-6">
                Bạn đã mở khóa đề thi thành công. Hệ thống sẽ tự động chuyển hướng sau <span className="font-bold text-jp-indigo">{countdown}</span> giây...
              </p>
              {examId && (
                <Link href={`/exams/${examId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
                  <Loader2 size={18} className="animate-spin" />
                  Chuyển đến bài thi ngay
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={48} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Thanh Toán Thất Bại</h2>
              <p className="text-neutral-500 mb-6">
                {error === "invalid_signature" 
                  ? "Chữ ký xác thực không hợp lệ. Giao dịch có thể đã bị can thiệp." 
                  : "Giao dịch đã bị hủy hoặc có lỗi xảy ra trong quá trình thanh toán."}
              </p>
              <Link href="/exams" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-colors">
                <ArrowLeft size={18} />
                Quay lại danh sách đề thi
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-jp-indigo w-12 h-12" /></div>}>
      <VnpayReturnContent />
    </Suspense>
  );
}
