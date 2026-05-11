"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, Mic, PenTool, Sparkles, Target, Settings, Info, Play } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-jp-red/10 selection:text-jp-red">
      <MainNavbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-20 px-6 md:px-16 overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-jp-red/[0.03] blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-jp-indigo/[0.03] blur-[100px] rounded-full pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3"></div>

        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-jp-red/20 bg-white/50 backdrop-blur-sm text-jp-red text-xs font-bold tracking-[0.15em] uppercase mb-8 shadow-sm">
              <Sparkles size={14} />
              <span>Nền tảng học chuẩn mực</span>
            </div>

            {/* Headline */}
            <h2 className="text-5xl md:text-7xl xl:text-[80px] font-sans font-medium text-balance mb-8 leading-[1.1] text-neutral-900 tracking-tight">
              Thành thạo <br />
              <span className="font-serif italic font-normal text-jp-red pr-4">Tiếng Nhật</span><br />
              theo cách của bạn.
            </h2>

            <p className="text-neutral-500 text-lg md:text-xl max-w-lg mb-12 leading-relaxed font-light">
              Trải nghiệm môi trường học tập tinh gọn, thẩm mỹ và hiệu quả với triết lý <strong className="text-neutral-900 font-medium">Kaizen</strong> (cải tiến liên tục) - tiếng Nhật không còn là rào cản.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <Link href="/register" className="group flex items-center justify-center gap-3 bg-neutral-900 text-white px-8 py-4 rounded-full font-semibold tracking-wide hover:bg-jp-red transition-colors duration-300 shadow-xl shadow-neutral-900/10 text-sm">
                BẮT ĐẦU NGAY
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* <Link href="/demo" className="group flex items-center justify-center gap-3 bg-white border border-neutral-200 text-neutral-900 px-8 py-4 rounded-full font-semibold tracking-wide hover:bg-neutral-50 hover:border-neutral-300 transition-all text-sm shadow-sm">
                <Play size={18} className="text-jp-red group-hover:scale-110 transition-transform" />
                XEM DEMO
              </Link> */}
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex items-center gap-5 pt-8 border-t border-neutral-200/60 max-w-md">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className={`w-10 h-10 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-sm`}>
                    <img src={`https://i.pravatar.cc/100?img=${idx + 10}`} alt="Student" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-neutral-500 leading-snug">
                Đồng hành cùng <br /><strong className="text-neutral-900">5,000+</strong> học viên.
              </p>
            </div>
          </div>

          {/* Hero Images - Modern Editorial Layout */}
          <div className="relative h-[600px] xl:h-[700px] w-full hidden lg:block">
            {/* Main Image */}
            <div className="absolute top-0 right-0 w-[85%] h-[90%] overflow-hidden rounded-[2.5rem] border border-neutral-200/50 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1200"
                alt="Kyoto Temple"
                className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-110 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-transparent to-transparent"></div>
            </div>

            {/* Floating Goal Widget (Cá nhân hóa) */}
            <div className="absolute bottom-24 -left-8 bg-white/90 backdrop-blur-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-3xl w-[280px] border border-white hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-jp-red/10 rounded-full flex items-center justify-center">
                    <Target className="text-jp-red" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Mục tiêu</p>
                    <p className="text-sm font-bold text-neutral-900">Thi đỗ JLPT N3</p>
                  </div>
                </div>
                {/* <span className="text-xs font-bold text-jp-red bg-jp-red/5 px-2 py-1 rounded-md">85%</span> */}
              </div>
              <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-jp-red to-rose-400 w-[85%] h-full rounded-full relative">
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Floating Japanese Text (Chữ chìm mờ) */}
            <div className="absolute top-16 -left-4 z-20 pointer-events-none select-none">
              <div className="writing-vertical-rl text-[80px] font-serif text-neutral-900/[0.03] leading-none h-[500px]">
                日本語を学ぶ
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM SECTION (Bento Box Style) */}
      <section className="py-32 px-6 md:px-16 bg-white relative z-10 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-neutral-900 mb-6">Trải nghiệm học tập toàn diện</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Hệ thống bài học được thiết kế tinh giản, kết hợp giữa phương pháp học truyền thống và công nghệ hiện đại.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Từ vựng", desc: "Flashcard thông minh, ghi nhớ qua thuật toán Spaced Repetition (SRS).", icon: BookOpen },
              { title: "Ngữ pháp", desc: "Cấu trúc dễ hiểu, học đến đâu thực hành ngay đến đó với ví dụ thực tế.", icon: PenTool },
              { title: "Giao tiếp", desc: "Luyện phát âm Kaiwa qua công nghệ AI nhận diện giọng nói tự nhiên.", icon: Mic },
              { title: "Mô phỏng JLPT", desc: "Kho đề thi thử chuẩn format của kỳ thi thực tế, tự động chấm điểm.", icon: Settings }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-[2rem] bg-neutral-50 border border-neutral-100 hover:bg-white hover:border-neutral-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 relative flex flex-col h-full"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-100 mb-8 group-hover:bg-neutral-900 group-hover:scale-110 transition-all duration-500">
                  <feature.icon size={24} className="text-neutral-700 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-medium text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed font-light flex-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KAIZEN PHILOSOPHY SECTION */}
      <section className="py-32 px-6 md:px-16 bg-neutral-900 text-white relative overflow-hidden">
        {/* Subtle patterned background */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 xl:gap-24 items-center relative z-10">
          <div className="relative w-full aspect-[4/5] lg:h-[700px] overflow-hidden rounded-[2.5rem] border border-white/10 group">
            <div className="w-full h-full relative">
              <img src="https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Bonsai/Zen" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
              <div className="absolute inset-0 bg-neutral-900/30 mix-blend-multiply"></div>
            </div>

            {/* Zen Circle Enso */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 border-[1px] border-white/20 rounded-full pointer-events-none mix-blend-overlay"></div>
          </div>

          <div className="pr-4 lg:pr-0">
            <div className="text-jp-red font-bold tracking-[0.3em] mb-6 text-xs flex items-center gap-4 uppercase">
              <span className="w-8 h-[1px] bg-jp-red"></span>
              Triết lý học tập
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-8 leading-[1.1]">
              Cải tiến liên tục. <br /> <span className="text-jp-red italic font-light">Kaizen</span>.
            </h2>
            <p className="text-lg text-neutral-400 mb-14 leading-relaxed font-light">
              Học ngôn ngữ không phải là cuộc đua nước rút, mà là quá trình dài cần sự bền bỉ. Chúng tôi chia nhỏ kiến thức để bạn tận hưởng những thành tựu nhỏ bé mỗi ngày.
            </p>
            <ul className="space-y-10">
              {[
                { t: 'Học ít nhưng sâu', d: 'Tối ưu thời gian tập trung thay vì kéo dài số giờ học, loại bỏ hoàn toàn việc nhồi nhét lý thuyết.' },
                { t: 'Tập trung tuyệt đối', d: 'Giao diện tinh giản, không quảng cáo, loại bỏ mọi yếu tố gây xao nhãng để bạn đắm chìm vào bài học.' },
                { t: 'Động lực mỗi ngày', d: 'Hệ thống theo dõi tiến trình thông minh giúp bạn nhìn thấy sự thay đổi rõ rệt của bản thân sau mỗi tuần.' }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-6 group">
                  <div className="font-serif text-3xl italic text-neutral-600 group-hover:text-jp-red transition-colors duration-500 mt-1">
                    0{i + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-white mb-2">{item.t}</h4>
                    <p className="text-neutral-400 text-sm leading-relaxed font-light">{item.d}</p>
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
            className="w-full h-full object-cover opacity-[0.04] grayscale"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto bg-white/80 backdrop-blur-xl p-12 md:p-20 rounded-[3rem] border border-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.06)] transition-shadow duration-700">
          <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-8 text-white font-serif text-2xl">
            日
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 text-neutral-900 tracking-tight">Sẵn sàng để bắt đầu?</h2>
          <p className="text-lg text-neutral-500 mb-12 font-light max-w-xl mx-auto">Tham gia cùng hàng nghìn học viên đang chinh phục tiếng Nhật mỗi ngày cùng J-Learning.</p>

          <Link
            href="/register"
            className="group inline-flex items-center gap-4 bg-jp-red text-white px-10 py-4 rounded-full font-bold tracking-[0.15em] hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-jp-red/20 transition-all duration-300 text-sm"
          >
            TẠO TÀI KHOẢN MIỄN PHÍ
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white text-neutral-900 border-t border-neutral-100 pt-24 pb-10 px-6 md:px-16 font-sans">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 mb-20">
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-jp-red rounded-lg flex items-center justify-center text-white font-serif text-lg shadow-sm">日</div>
              <h2 className="text-lg font-bold tracking-widest font-serif uppercase text-neutral-900">J-Learning</h2>
            </div>
            <p className="text-neutral-500 leading-relaxed text-sm font-light pr-4">
              Nền tảng học Tiếng Nhật hiện đại, kết hợp phương pháp Kaizen giúp tối ưu hiệu suất học tập dành riêng cho người Việt.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 tracking-widest uppercase text-xs text-neutral-900">Học Tập</h4>
            <ul className="space-y-4 text-neutral-500 text-sm font-light">
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Từ vựng (N5-N3)</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Ngữ pháp (N5-N3)</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Luyện thi JLPT</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Podcast Tiếng Nhật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 tracking-widest uppercase text-xs text-neutral-900">Hỗ Trợ</h4>
            <ul className="space-y-4 text-neutral-500 text-sm font-light">
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Liên hệ</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 tracking-widest uppercase text-xs text-neutral-900">Kết Nối</h4>
            <ul className="space-y-4 text-neutral-500 text-sm font-light">
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Facebook</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">Instagram</a></li>
              <li><a href="#" className="hover:text-jp-red transition-colors inline-block">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-400 text-[10px] tracking-widest uppercase font-semibold">
          <p>© 2026 J-LEARNING SYSTEM. ALL RIGHTS RESERVED.</p>
          <p className="flex items-center gap-2">
            <Info size={14} /> Hệ thống 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}