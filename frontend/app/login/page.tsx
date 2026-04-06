"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await api("/auth/login", "POST", {
        email,
        passWord: password
      });

      if (res.token) {
        localStorage.setItem("token", res.token);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
        window.location.href = "/";
      } else {
        setError(res.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-jp-washi text-jp-ink font-sans selection:bg-jp-red/20 selection:text-jp-red">
      {/* Left side: Image and Art (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-jp-indigo overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=2000"
          alt="Kyoto Streets"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity hover:scale-105 transition-transform duration-[30s] ease-linear"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-jp-indigo via-transparent to-jp-indigo/30 pointer-events-none"></div>

        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Trang chủ</span>
            </Link>
          </div>

          <div className="flex justify-between items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className="text-4xl xl:text-5xl font-serif text-white mb-6 leading-tight">
                Chào mừng <br />
                <span className="text-jp-red italic pr-2 font-light">trở lại,</span>
              </h2>
              <p className="text-white/60 text-lg max-w-sm font-light leading-relaxed">
                Tiếp tục hành trình chinh phục tiếng Nhật của bạn cùng <strong className="text-white font-medium">J-Learning</strong>.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="writing-vertical-rl text-7xl font-serif text-white/10 select-none pointer-events-none"
            >
              おかえりなさい
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-jp-sakura/40 rounded-full blur-[100px] pointer-events-none"></div>

        <Link href="/" className="absolute top-8 left-8 lg:hidden inline-flex items-center gap-2 text-neutral-500 hover:text-jp-indigo transition-colors cursor-pointer group z-20">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-12 text-center lg:text-left">
            <div className="w-16 h-16 bg-jp-red rounded-full flex items-center justify-center text-white font-serif text-2xl shadow-[0_0_20px_rgba(188,0,45,0.3)] mx-auto lg:mx-0 mb-8">
              日
            </div>
            <h1 className="text-3xl font-bold text-jp-indigo mb-3 font-serif">Đăng Nhập</h1>
            <p className="text-neutral-500 font-light text-sm">Điền thông tin để truy cập vào hệ thống học tập</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#FEE2E2] text-[#B91C1C] text-sm border border-[#FCA5A5] rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.2em] text-jp-indigo uppercase mb-2">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-jp-indigo transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-10 py-4 bg-white/70 backdrop-blur-sm border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold tracking-[0.2em] text-jp-indigo uppercase">Mật khẩu</label>
                  <a href="#" className="text-xs text-jp-red hover:text-[#8B0000] hover:underline decoration-jp-red/30 underline-offset-4 transition-all">Quên mật khẩu?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-jp-indigo transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-10 py-4 bg-white/70 backdrop-blur-sm border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full group relative overflow-hidden bg-jp-indigo text-jp-washi py-4 mt-8 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý
                  </span>
                ) : (
                  <>
                    Đăng nhập <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 h-full w-full bg-jp-red scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0"></div>
            </button>
          </form>

          <div className="mt-12 text-center text-sm font-light text-neutral-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-jp-indigo font-bold hover:text-jp-red transition-colors underline decoration-neutral-300 hover:decoration-jp-red underline-offset-4">
              Đăng ký ngay
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}