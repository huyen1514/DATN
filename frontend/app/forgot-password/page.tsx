"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Mail, Key, Lock } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSuccess("Mã OTP đã được gửi đến email của bạn!");
        setStep(2);
      } else {
        const text = await res.text();
        setError(text || "Email không tồn tại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        setSuccess("Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
        setStep(3);
      } else {
        const text = await res.text();
        setError(text || "Mã OTP không chính xác.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (res.ok) {
        setSuccess("Đổi mật khẩu thành công! Chuyển hướng...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        const text = await res.text();
        setError(text || "Đổi mật khẩu thất bại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quên mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1 && "Nhập email của bạn để nhận mã xác thực"}
            {step === 2 && "Kiểm tra email và nhập mã OTP"}
            {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center border border-green-200">
            {success}
          </div>
        )}

        {/* STEP 1: Email */}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Địa chỉ Email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
            >
              {loading ? "Đang gửi..." : "Nhận mã OTP"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm tracking-widest text-center text-lg"
                placeholder="Nhập mã OTP (6 số)"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
            >
              {loading ? "Đang xác thực..." : "Xác nhận OTP"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-gray-600 hover:text-gray-500"
              >
                Nhập lại email
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Reset Password */}
        {step === 3 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu mới"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
            >
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
