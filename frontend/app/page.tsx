"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Mic, PenTool, Sparkles, Target, Settings, Info, User } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<{fullName?: string, userName?: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-jp-washi text-jp-ink font-sans selection:bg-jp-red/20 selection:text-jp-red">
      {/* NAVBAR */}
      <header className="flex justify-between items-center px-6 md:px-16 py-6 bg-jp-washi/80 backdrop-blur-xl sticky top-0 z-50 border-b border-black/5">
        <div className="flex items-center gap-3 group cursor-pointer lg:w-1/4">
          <div className="w-10 h-10 bg-jp-red rounded-full flex items-center justify-center text-white font-serif text-xl shadow-[0_0_15px_rgba(188,0,45,0.4)] group-hover:scale-110 transition-transform duration-300">
            日
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] font-serif uppercase text-jp-indigo mt-1">
            J-Learning
          </h1>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center items-center gap-6 xl:gap-8 text-[11px] font-bold tracking-[0.25em]">
          <Link href="/courses" className="hover:text-jp-red transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-jp-red hover:after:w-full after:transition-all">
            KHÓA HỌC
          </Link>
          <Link href="/folders" className="hover:text-jp-red transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-jp-red hover:after:w-full after:transition-all">
            KHÔNG GIAN HỌC
          </Link>
          <Link href="/dashboard" className="hover:text-jp-red transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-jp-red hover:after:w-full after:transition-all">
            BỘ THẺ TỪ
          </Link>
          <Link href="/dashboard" className="hover:text-jp-red transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-jp-red hover:after:w-full after:transition-all">
            THẺ GHI NHỚ
          </Link>
          <Link href="/methodology" className="hover:text-jp-red transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-jp-red hover:after:w-full after:transition-all">
            PHƯƠNG PHÁP
          </Link>
        </nav>

        <div className="hidden md:flex lg:w-1/4 justify-end items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-jp-indigo">
                <div className="w-8 h-8 rounded-full bg-jp-indigo/10 flex items-center justify-center">
                  <User size={14} />
                </div>
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase">
                  {user.fullName || user.userName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] font-bold tracking-[0.25em] text-jp-red hover:text-[#8b0000] px-4 border-l border-black/10 transition-colors"
              >
                ĐĂNG XUẤT
              </button>
              <Link
                href="/dashboard"
                className="bg-jp-indigo text-white px-6 py-2.5 rounded-full text-[11px] font-bold tracking-[0.2em] shadow-md hover:bg-jp-red hover:-translate-y-0.5 transition-all outline-none"
              >
                WORKSPACE
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-[11px] font-bold tracking-[0.25em] hover:text-jp-red transition-colors">
                ĐĂNG NHẬP
              </Link>
              <Link
                href="/register"
                className="group relative overflow-hidden bg-jp-indigo text-jp-washi px-8 py-3.5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-[11px] font-bold tracking-[0.2em]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  BẮT ĐẦU <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 h-full w-full bg-jp-red scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0"></div>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-10 pb-20 px-6 md:px-16 overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-jp-sakura/40 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-jp-red/30 bg-jp-sakura/30 text-jp-red text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-8 animate-fade-in">
              <Sparkles size={14} />
              <span>Nền tảng học Tiếng Nhật chuẩn mực</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl xl:text-[80px] font-sans font-light text-balance mb-8 leading-[1.1] text-jp-indigo">
              Thành thạo <br/>
              <span className="font-serif italic font-normal text-jp-red pr-4">Tiếng Nhật</span><br/>
              theo cách của bạn.
            </h2>
            
            <p className="text-neutral-500 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-light">
              Trải nghiệm môi trường học tập tinh gọn, thẩm mỹ và hiệu quả với triết lý <strong className="text-jp-indigo font-medium">Kaizen</strong> (cải tiến liên tục) - tiếng Nhật không còn là rào cản.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Link href="/register" className="group flex items-center justify-center gap-3 bg-jp-red text-white px-10 py-5 font-bold tracking-[0.25em] hover:bg-[#8B0000] transition-all shadow-xl shadow-jp-red/20 text-xs">
                KHÁM PHÁ NGAY
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link href="/demo" className="flex items-center justify-center gap-3 border border-black/10 bg-white text-jp-indigo px-10 py-5 font-bold tracking-[0.25em] hover:border-jp-indigo transition-all text-xs">
                XEM DEMO
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(idx => (
                    <div key={idx} className={`w-10 h-10 rounded-full border-2 border-white bg-neutral-${idx}00 overflow-hidden`}>
                       <img src={`https://i.pravatar.cc/100?img=${idx+10}`} alt="Student" className="w-full h-full object-cover" />
                    </div>
                 ))}
              </div>
              <p className="text-xs text-neutral-500"><strong className="text-jp-indigo">5,000+</strong> học viên <br/> đã tham gia hệ thống.</p>
            </div>
          </div>

          {/* Hero Images - Artistic layout */}
          <div className="relative h-[550px] xl:h-[650px] w-full hidden lg:block perspective-1000">
             <div className="absolute top-0 right-0 w-[85%] h-[95%] overflow-hidden shadow-2xl rounded-tr-[120px] rounded-bl-[120px]">
               <img 
                 src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1200" 
                 alt="Kyoto Temple" 
                 className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-105 ease-out"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-jp-indigo/30 to-transparent"></div>
             </div>
             
             {/* Floating Accent Card Element */}
             <div className="absolute bottom-16 -left-4 bg-white/95 backdrop-blur-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl w-[260px] border border-white hover:-translate-y-2 transition-transform duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#FEE2E2] rounded-full flex items-center justify-center">
                    <Target className="text-jp-red" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-jp-indigo">Học viên xuất sắc</h4>
                    <p className="text-[11px] text-neutral-500">Đạt JLPT N2 sau 1 năm</p>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-jp-red to-[#ff4d4d] w-[85%] h-full rounded-full relative">
                  </div>
                </div>
             </div>
             
             {/* Floating Japanese Text */}
             <div className="absolute top-10 -left-6 z-20 pointer-events-none">
                <div className="writing-vertical-rl text-6xl font-serif text-black/10 leading-none h-[400px]">
                   日本語を学ぶ
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM SECTION */}
      <section className="py-32 px-6 md:px-16 bg-white relative z-10 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-serif text-jp-indigo mb-6">Trải nghiệm học tập toàn diện</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">Hệ thống bài học được thiết kế tinh giản, kết hợp giữa phương pháp học truyền thống và công nghệ hiện đại nhằm tối ưu khả năng ghi nhớ.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-10">
            {[
              { title: "Từ vựng", desc: "Flashcard thông minh, ghi nhớ qua Spaced Repetition (SRS).", icon: BookOpen },
              { title: "Ngữ pháp", desc: "Cấu trúc dễ hiểu, học đến đâu thực hành ngay đến đó.", icon: PenTool },
              { title: "Giao tiếp", desc: "Luyện phát âm qua công nghệ AI nhận diện tự nhiên.", icon: Mic },
              { title: "Mô phỏng JLPT", desc: "Kho đề thi thử chuẩn format của kỳ thi thực tế.", icon: Settings }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group p-8 xl:p-10 rounded-3xl bg-jp-washi/50 border border-black/5 hover:bg-white hover:border-jp-red/30 hover:shadow-[0_20px_40px_-15px_rgba(188,0,45,0.1)] transition-all duration-500 relative overflow-hidden cursor-default"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-jp-sakura/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-[100px]"></div>
                
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 group-hover:bg-jp-red group-hover:shadow-lg group-hover:shadow-jp-red/30 transition-all duration-500 relative z-10">
                  <feature.icon size={28} className="text-jp-red group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-jp-indigo mb-4 relative z-10">{feature.title}</h3>
                <p className="text-neutral-500 leading-relaxed relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KAIZEN PHILOSOPHY SECTION */}
      <section className="py-32 px-6 md:px-16 bg-jp-indigo text-jp-washi relative overflow-hidden">
        {/* Subtle patterned background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 0 0, transparent 0, #faf8f5 10px), repeating-linear-gradient(#faf8f555, #faf8f5)'}}></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 xl:gap-32 items-center relative z-10">
          <div className="relative w-full aspect-square md:aspect-auto lg:h-[700px] overflow-hidden rounded-[80px] rounded-tr-[200px] rounded-bl-[200px] border border-white/10 hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-shadow duration-700">
            <div className="w-full h-full relative">
              <img src="https://images.unsplash.com/photo-1578469645762-461b4fa615f4?auto=format&fit=crop&q=80&w=1200" alt="Bonsai/Zen" className="w-full h-full object-cover transition-transform duration-[5s] hover:scale-105" />
              <div className="absolute inset-0 bg-jp-indigo/40 mix-blend-multiply"></div>
            </div>
            
            {/* Zen Circle Enso */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-[2px] border-jp-gold/30 rounded-full pointer-events-none mix-blend-overlay"></div>
          </div>

          <div>
            <div className="text-jp-gold font-bold tracking-[0.4em] mb-6 text-xs flex items-center gap-4">
              <span className="w-12 h-[1px] bg-jp-gold"></span>
              TRIẾT LÝ HỌC TẬP
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-10 leading-tight">
              Cải tiến liên tục. <br/> <span className="text-jp-red italic font-light">Kaizen</span>.
            </h2>
            <p className="text-xl text-white/70 mb-12 leading-[1.8] font-light">
               Học ngôn ngữ không phải là cuộc đua nước rút, mà là quá trình dài cần sự bền bỉ. Chúng tôi chia nhỏ kiến thức để bạn tận hưởng những thành tựu nhỏ bé mỗi ngày.
            </p>
            <ul className="space-y-8">
              {[
                {t: 'Học ít nhưng sâu, không ôm đồm lý thuyết.', d: 'Tối ưu thời gian tập trung thay vì kéo dài số giờ học.'},
                {t: 'Giao diện tinh giản tuyệt đối.', d: 'Loại bỏ mọi yếu tố gây xao nhãng để bạn hoàn toàn đắm chìm vào tiếng Nhật.'},
                {t: 'Tạo động lực học tập liên tục.', d: 'Theo dõi tiến trình thông minh giúp bạn nhận ra sự tiến bộ của bản thân mỗi tuần.'}
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-5 group cursor-default">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-jp-red mt-1 group-hover:bg-jp-red group-hover:text-white transition-colors duration-300">
                     <span className="text-xs font-bold leading-none">{i+1}</span>
                  </div>
                  <div>
                     <h4 className="text-lg font-bold text-white mb-2 group-hover:text-jp-red transition-colors duration-300">{item.t}</h4>
                     <p className="text-white/50 text-sm leading-relaxed">{item.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-40 px-6 text-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1490806678567-2410b2da3073?auto=format&fit=crop&q=80&w=2000" 
            alt="Fuji Mount Background"
            className="w-full h-full object-cover opacity-10 grayscale"
          />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto bg-white/60 backdrop-blur-md p-10 md:p-16 rounded-[40px] border border-white/50 shadow-2xl hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-shadow duration-500">
           <div className="w-16 h-16 bg-jp-red rounded-full flex items-center justify-center mx-auto mb-8 text-white font-serif text-2xl shadow-[0_0_20px_rgba(188,0,45,0.3)]">
             日
           </div>
           <h2 className="text-4xl md:text-6xl font-serif mb-6 text-jp-indigo">Sẵn sàng để bắt đầu?</h2>
           <p className="text-xl text-neutral-500 mb-12 font-light">Tham gia cùng hàng nghìn học viên đang cải thiện bản thân mỗi ngày cùng J-Learning.</p>
           
           <Link
              href="/register"
              className="inline-flex items-center gap-4 bg-jp-indigo text-white px-12 py-5 font-bold tracking-[0.2em] hover:bg-jp-red transition-all duration-500 text-[11px] uppercase shadow-2xl hover:scale-105"
            >
              TẠO TÀI KHOẢN MIỄN PHÍ
              <ArrowRight size={18} />
            </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-jp-washi text-jp-indigo border-t border-black/5 pt-24 pb-10 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 mb-20">
           <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-jp-red rounded-full flex items-center justify-center text-white font-serif shadow-md">日</div>
                <h2 className="text-xl font-bold tracking-[0.2em] font-serif uppercase">J-Learning</h2>
              </div>
              <p className="text-neutral-500 leading-relaxed mb-8 text-sm">
                 Nền tảng học Tiếng Nhật hiện đại, kết hợp phương pháp Kaizen giúp tối ưu hiệu suất học tập dành cho người Việt.
              </p>
           </div>
           
           <div>
              <h4 className="font-bold mb-8 tracking-[0.2em] uppercase text-xs">Học Tập</h4>
              <ul className="space-y-4 text-neutral-500 text-sm">
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Tự vựng (N5-N1)</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Ngữ pháp (N5-N1)</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Luyện thi JLPT</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Podcast Tiếng Nhật</a></li>
              </ul>
           </div>
           
           <div>
              <h4 className="font-bold mb-8 tracking-[0.2em] uppercase text-xs">Hỗ Trợ</h4>
              <ul className="space-y-4 text-neutral-500 text-sm">
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Về chúng tôi</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Liên hệ</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Điều khoản sử dụng</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Chính sách bảo mật</a></li>
              </ul>
           </div>

           <div>
              <h4 className="font-bold mb-8 tracking-[0.2em] uppercase text-xs">Kết Nối</h4>
              <ul className="space-y-4 text-neutral-500 text-sm">
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Facebook</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">Instagram</a></li>
                 <li><a href="#" className="hover:text-jp-red transition-colors inline-block hover:translate-x-1">YouTube</a></li>
              </ul>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-black/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-400 text-xs tracking-widest uppercase">
           <p>© 2026 J-LEARNING SYSTEM. ALL RIGHTS RESERVED.</p>
           <p className="flex items-center gap-2">
              <Info size={14} /> Hệ thống 2.0
           </p>
        </div>
      </footer>
    </div>
  );
}