"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, UserPlus, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !userName || !email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await api("/auth/register", "POST", {
        userName,
        email,
        fullName,
        passWord: password
      });

      // Nếu API trả về chuỗi (theo AuthController của backend trả về message string)
      // hoặc trả về object có lỗi
      if (res && res.error) {
         setError(res.error || "Đăng ký thất bại. Vui lòng thử lại.");
      } else {
         setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi kết nối. Vui lòng kiểm tra lại email hoặc tên đăng nhập.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-jp-washi text-jp-ink font-sans selection:bg-jp-red/20 selection:text-jp-red">
      {/* Left side: Image and Art (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000" 
          alt="Spring in Japan" 
          className="absolute inset-0 w-full h-full object-cover opacity-70 hover:scale-105 transition-transform duration-[40s] ease-linear"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/40 pointer-events-none"></div>
        
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
                Bắt đầu <br />
                <span className="text-jp-red italic pr-2 font-light">hành trình mới.</span>
              </h2>
              <p className="text-white/60 text-lg max-w-sm font-light leading-relaxed">
                Tạo tài khoản ngay hôm nay để trải nghiệm phương pháp học tiếng Nhật hiệu quả nhất.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="writing-vertical-rl text-7xl font-serif text-white/10 select-none pointer-events-none"
            >
              新しい旅立ち
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#E0E7FF]/50 rounded-full blur-[100px] pointer-events-none"></div>
        
        <Link href="/" className="absolute top-8 left-8 lg:hidden inline-flex items-center gap-2 text-neutral-500 hover:text-jp-indigo transition-colors cursor-pointer group z-20">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="w-16 h-16 bg-jp-indigo rounded-full flex items-center justify-center text-white font-serif text-2xl shadow-[0_0_20px_rgba(19,27,35,0.2)] mx-auto lg:mx-0 mb-8 border border-white/10">
              学
            </div>
            <h1 className="text-3xl font-bold text-jp-indigo mb-3 font-serif">Đăng Ký</h1>
            <p className="text-neutral-500 font-light text-sm">Điền thông tin bên dưới để tạo tài khoản</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/70 backdrop-blur-sm border border-green-100 p-8 rounded-2xl text-center shadow-lg"
            >
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-jp-indigo mb-2">Đăng ký thành công!</h3>
              <p className="text-neutral-500 text-sm mb-6">Tài khoản của bạn đã được tạo thành công. Bạn hiện có thể đăng nhập vào hệ thống.</p>
              <Link href="/login" className="inline-flex items-center justify-center w-full py-4 bg-jp-indigo text-white rounded-xl font-bold tracking-[0.1em] text-xs hover:bg-black transition-colors">
                TỚI TRANG ĐĂNG NHẬP
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#FEE2E2] text-[#B91C1C] text-sm border border-[#FCA5A5] rounded-xl"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Full Name & Username in 2 columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Họ và tên</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-jp-indigo transition-colors">
                        <User size={16} />
                      </div>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-3.5 bg-white/70 backdrop-blur-sm border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light text-sm"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Tên đăng nhập</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-jp-indigo transition-colors">
                        <User size={16} />
                      </div>
                      <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full pl-9 pr-3 py-3.5 bg-white/70 backdrop-blur-sm border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light text-sm"
                        placeholder="nguyenvana123"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-jp-indigo transition-colors">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-[0.1em] text-jp-indigo uppercase mb-2">Mật khẩu</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-jp-indigo transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-neutral-200 rounded-xl outline-none focus:border-jp-indigo focus:ring-1 focus:ring-jp-indigo transition-all font-light"
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
                      Tạo tài khoản <UserPlus size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 h-full w-full bg-jp-red scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0"></div>
              </button>
            </form>
          )}

          <div className="mt-12 text-center text-sm font-light text-neutral-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-jp-indigo font-bold hover:text-jp-red transition-colors underline decoration-neutral-300 hover:decoration-jp-red underline-offset-4">
              Đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
