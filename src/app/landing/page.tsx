import Link from "next/link";
import {
  ArrowRight,
  LayoutGrid,
  CalendarDays,
  BarChart2,
  Copy,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingDown,
  TrendingUp,
  MousePointerClick,
  Star,
} from "lucide-react";

export const metadata = {
  title: "Drag Spend — Quản lý chi tiêu thông minh",
  description:
    "Theo dõi thu chi hàng ngày bằng thao tác kéo thả trực quan. Nhanh, đẹp, không phức tạp.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Nav ──────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">Drag Spend</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              Dùng miễn phí
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-indigo-100 via-violet-50 to-pink-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-40 right-0 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute top-60 left-0 w-56 h-56 bg-violet-200 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Hoàn toàn miễn phí · Không cần cài đặt
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-3xl mx-auto">
          Chi tiêu thông minh
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            chỉ với thao tác kéo thả
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          Tạo thẻ chi tiêu, kéo vào ngày, xem báo cáo ngay. Không phức tạp,
          không dư thừa — chỉ đúng những gì bạn cần.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5">
            Bắt đầu ngay
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-indigo-700 font-semibold px-7 py-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white transition-all">
            Đăng nhập
          </Link>
        </div>

        {/* Mock UI preview */}
        <div className="mt-16 mx-auto max-w-4xl">
          <MockDashboard />
        </div>
      </section>

      {/* ─── Features grid ────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
              Tính năng
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Mọi thứ bạn cần để
              <br className="hidden md:block" /> quản lý chi tiêu
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
              Cách dùng
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              3 bước, dưới 10 giây
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                  {i + 1}
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats / social proof ─────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-indigo-600 to-violet-700 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-10 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold">{s.value}</div>
              <div className="mt-1 text-indigo-200 text-sm font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories showcase ──────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
              Danh mục
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Danh mục chi tiêu đầy đủ
            </h2>
            <p className="mt-3 text-slate-500">
              Được tạo sẵn khi bạn đăng ký, có thể tuỳ chỉnh thoải mái.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span>{c.icon}</span>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-200">
            <Star className="w-8 h-8 text-white" fill="white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Bắt đầu theo dõi chi tiêu <br className="hidden md:block" />
            ngay hôm nay
          </h2>
          <p className="text-slate-500 mb-10">
            Miễn phí, không cần thẻ tín dụng. Đăng ký dưới 30 giây.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 text-base">
            Tạo tài khoản miễn phí
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center text-slate-400 text-xs">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingDown className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-semibold text-slate-600">Drag Spend</span>
        </div>
        <p>© {new Date().getFullYear()} · Quản lý chi tiêu thông minh</p>
      </footer>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
        {icon}
      </div>
      <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function MockDashboard() {
  const cards = [
    {
      icon: "🍜",
      label: "Ăn sáng",
      amount: "25k",
      color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    {
      icon: "☕",
      label: "Cà phê",
      amount: "25k",
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      icon: "🍱",
      label: "Ăn trưa",
      amount: "35k",
      color: "bg-green-50 border-green-200 text-green-700",
    },
    {
      icon: "⛽",
      label: "Xăng",
      amount: "50k",
      color: "bg-orange-50 border-orange-200 text-orange-700",
    },
    {
      icon: "🏠",
      label: "Tiền trọ",
      amount: "3m",
      color: "bg-indigo-50 border-indigo-200 text-indigo-700",
    },
  ];
  const txns = [
    { icon: "🍜", label: "Ăn sáng", amount: "25k", type: "expense" },
    { icon: "☕", label: "Cà phê", amount: "25k", type: "expense" },
    { icon: "🍱", label: "Ăn trưa", amount: "35k", type: "expense" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden bg-slate-50 text-left">
      {/* Topbar */}
      <div className="h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="ml-4 text-xs text-slate-400 font-mono">
          dragspend.app/dashboard
        </div>
      </div>

      <div className="flex h-72">
        {/* Card panel */}
        <div className="w-52 bg-white border-r border-slate-100 p-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
            Thẻ chi tiêu
          </p>
          {cards.map((c) => (
            <div
              key={c.label}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-grab ${c.color}`}>
              <span>{c.icon}</span>
              <span className="flex-1">{c.label}</span>
              <span className="opacity-70">{c.amount}</span>
            </div>
          ))}
        </div>

        {/* Selected day */}
        <div className="w-56 bg-white border-r border-slate-100 p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Thứ Hai</p>
              <p className="text-[10px] text-slate-400">10 tháng 3 2026</p>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
              Hôm nay
            </span>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex items-center gap-1 text-[11px] text-red-500 font-semibold">
              <TrendingDown className="w-3 h-3" />
              −85k
            </div>
          </div>
          <div className="space-y-1.5">
            {txns.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 text-xs">
                <span>{t.icon}</span>
                <span className="flex-1 font-medium text-slate-700">
                  {t.label}
                </span>
                <span className="text-red-500 font-semibold">−{t.amount}</span>
              </div>
            ))}
          </div>
          {/* Drag hint */}
          <div className="mt-3 border-2 border-dashed border-indigo-200 rounded-lg h-10 flex items-center justify-center gap-1.5">
            <MousePointerClick className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] text-indigo-400">Kéo thẻ vào đây</span>
          </div>
        </div>

        {/* Monthly mini */}
        <div className="flex-1 bg-white p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tháng 3 / 2026
          </p>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
              <div
                key={d}
                className="text-center text-[9px] text-slate-400 font-semibold">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <div
                key={d}
                className={`aspect-square rounded flex items-center justify-center text-[10px] font-medium
                  ${d === 10 ? "bg-indigo-600 text-white" : d < 10 ? "bg-red-50 text-red-400" : "text-slate-300"}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Tổng chi tháng 3</span>
              <span className="font-bold text-red-500">−1.2m</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <MousePointerClick className="w-5 h-5 text-indigo-600" />,
    title: "Kéo thả trực quan",
    desc: "Kéo thẻ chi tiêu thả vào ngày bất kỳ — nhanh hơn gõ tay 5 lần. Không cần điền form dài dòng.",
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: <LayoutGrid className="w-5 h-5 text-violet-600" />,
    title: "Thẻ chi tiêu cá nhân",
    desc: "Tạo thẻ cho từng khoản chi cố định. Mỗi thẻ có nhiều mức giá (25k / 35k / 50k). Kéo 1 cái là xong.",
    accent: "bg-violet-50 text-violet-600",
  },
  {
    icon: <CalendarDays className="w-5 h-5 text-blue-600" />,
    title: "Xem theo ngày & tháng",
    desc: "Nhìn tổng quan tháng trên lịch, chọn ngày bất kỳ để xem chi tiết. Điều hướng mượt mà.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-emerald-600" />,
    title: "Báo cáo trực quan",
    desc: "Biểu đồ bar theo ngày, donut chart theo danh mục, thống kê ngày chi nhiều nhất — tất cả real-time.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <Copy className="w-5 h-5 text-pink-600" />,
    title: "Sao chép như hôm qua",
    desc: "Ngày nào chi giống hôm qua? 1 nút — toàn bộ giao dịch được clone sang ngày mới tức thì.",
    accent: "bg-pink-50 text-pink-600",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
    title: "Dữ liệu riêng tư & an toàn",
    desc: "Mỗi người dùng chỉ thấy dữ liệu của mình. Mật khẩu mã hoá, kết nối bảo mật Supabase RLS.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: <Zap className="w-5 h-5 text-orange-600" />,
    title: "Giao diện siêu nhanh",
    desc: "Optimistic UI — mọi thao tác phản hồi ngay lập tức, không cần chờ server. Trải nghiệm mượt mà.",
    accent: "bg-orange-50 text-orange-600",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-green-600" />,
    title: "Theo dõi thu nhập",
    desc: "Không chỉ chi tiêu — ghi nhận lương, thưởng, freelance. Cân bằng thu chi ngay trong ngày.",
    accent: "bg-green-50 text-green-600",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-purple-600" />,
    title: "Responsive & Mobile",
    desc: "Dùng được trên điện thoại với tab bar ở dưới. Trên máy tính thì layout đa cột rộng thoải mái.",
    accent: "bg-purple-50 text-purple-600",
  },
];

const STEPS = [
  {
    title: "Tạo thẻ chi tiêu",
    desc: "Thêm các khoản chi thường gặp: ăn sáng, cà phê, xăng... Mỗi thẻ có thể có nhiều mức giá khác nhau.",
  },
  {
    title: "Kéo thả vào ngày",
    desc: "Hôm ăn sáng 25k? Chỉ cần kéo thẻ vào ô ngày hôm nay. Giao dịch được ghi lại ngay tức thì.",
  },
  {
    title: "Xem báo cáo",
    desc: "Biểu đồ và thống kê tự động cập nhật. Biết ngay bạn đang chi nhiều nhất vào khoản nào.",
  },
];

const STATS = [
  { value: "< 3s", label: "Thêm 1 giao dịch mới" },
  { value: "100%", label: "Miễn phí, không quảng cáo" },
  { value: "∞", label: "Lịch sử lưu trữ mãi mãi" },
];

const CATEGORIES = [
  { icon: "🍜", name: "Ăn uống" },
  { icon: "🏠", name: "Tiền trọ" },
  { icon: "⛽", name: "Tiền xăng" },
  { icon: "📱", name: "Điện thoại" },
  { icon: "🛍", name: "Mua sắm" },
  { icon: "💑", name: "Đi chơi" },
  { icon: "🏡", name: "Gia đình" },
  { icon: "✈", name: "Du lịch" },
  { icon: "💊", name: "Y tế" },
  { icon: "🧺", name: "Đi chợ" },
  { icon: "🎮", name: "Giải trí" },
  { icon: "💰", name: "Lương" },
  { icon: "💻", name: "Freelancer" },
  { icon: "🎁", name: "Thưởng" },
  { icon: "💳", name: "Cashback" },
];
