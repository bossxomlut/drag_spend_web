"use client";

import Link from "next/link";
import { TrendingDown, ArrowLeft, Shield } from "lucide-react";
import { useUILanguage } from "@/hooks/useUILanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// ─── Data ──────────────────────────────────────────────────────────────────────

const T = {
  vi: {
    back: "Quay lại trang chủ",
    title: "Chính Sách Bảo Mật",
    lastUpdated: "Cập nhật lần cuối: 12 tháng 3, 2026",
    intro:
      "Drag Spend ('chúng tôi', 'ứng dụng') coi trọng quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng ứng dụng Drag Spend.",
    sections: [
      {
        title: "1. Thông tin chúng tôi thu thập",
        content: [
          {
            subtitle: "Thông tin tài khoản",
            text: "Khi bạn đăng ký, chúng tôi thu thập địa chỉ email và mật khẩu (được mã hoá). Bạn có thể tùy chọn cung cấp tên hiển thị.",
          },
          {
            subtitle: "Dữ liệu chi tiêu",
            text: "Bao gồm các giao dịch bạn tạo: tên khoản chi, số tiền, ngày giao dịch, danh mục. Dữ liệu này được lưu trữ để cung cấp tính năng theo dõi chi tiêu cá nhân.",
          },
          {
            subtitle: "Dữ liệu sử dụng",
            text: "Chúng tôi có thể thu thập thông tin về cách bạn sử dụng ứng dụng (ví dụ: các tính năng được truy cập) nhằm cải thiện trải nghiệm người dùng. Dữ liệu này không chứa nội dung cá nhân.",
          },
        ],
      },
      {
        title: "2. Cách chúng tôi sử dụng thông tin",
        content: [
          {
            subtitle: "",
            text: "Chúng tôi sử dụng thông tin thu thập để:\n• Cung cấp và duy trì các tính năng của ứng dụng\n• Đồng bộ dữ liệu chi tiêu giữa các thiết bị\n• Gửi email xác thực và khôi phục mật khẩu (nếu cần)\n• Cải thiện ứng dụng dựa trên phân tích tổng hợp (ẩn danh)\n• Đảm bảo bảo mật và phát hiện gian lận",
          },
        ],
      },
      {
        title: "3. Chia sẻ thông tin",
        content: [
          {
            subtitle: "",
            text: "Chúng tôi KHÔNG bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba vì mục đích thương mại.\n\nChúng tôi sử dụng Supabase (supabase.com) là nhà cung cấp hạ tầng dữ liệu. Dữ liệu của bạn được lưu trữ trên các máy chủ bảo mật của Supabase. Xem chính sách bảo mật của Supabase tại: supabase.com/privacy",
          },
        ],
      },
      {
        title: "4. Bảo mật dữ liệu",
        content: [
          {
            subtitle: "",
            text: "Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành:\n• Mã hoá HTTPS/TLS cho tất cả dữ liệu truyền tải\n• Mật khẩu được băm với thuật toán bcrypt\n• Xác thực JWT bảo mật\n• Row Level Security (RLS) — mỗi người dùng chỉ truy cập được dữ liệu của chính mình",
          },
        ],
      },
      {
        title: "5. Quyền của bạn",
        content: [
          {
            subtitle: "",
            text: "Bạn có toàn quyền với dữ liệu của mình:\n• Xem và chỉnh sửa thông tin tài khoản bất kỳ lúc nào\n• Xoá toàn bộ dữ liệu giao dịch\n• Yêu cầu xoá tài khoản trong phần cài đặt hoặc liên hệ qua email\n\nKhi bạn yêu cầu xoá tài khoản, tài khoản sẽ được đánh dấu chờ xoá. Toàn bộ dữ liệu sẽ bị xoá vĩnh viễn sau 30 ngày. Trong thời gian này, bạn có thể liên hệ bossxomlut@gmail.com để khôi phục tài khoản.",
          },
        ],
      },
      {
        title: "6. Lưu giữ dữ liệu",
        content: [
          {
            subtitle: "",
            text: "Dữ liệu của bạn được lưu giữ trong suốt thời gian tài khoản còn hoạt động. Sau khi yêu cầu xoá, tài khoản sẽ được đánh dấu chờ xoá và sẽ bị xoá hoàn toàn sau 30 ngày. Bạn có thể liên hệ để khôi phục trong thời gian này.",
          },
        ],
      },
      {
        title: "7. Trẻ em",
        content: [
          {
            subtitle: "",
            text: "Ứng dụng không hướng đến người dùng dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em. Nếu bạn phát hiện trẻ em đã đăng ký, vui lòng liên hệ để chúng tôi xoá tài khoản.",
          },
        ],
      },
      {
        title: "8. Thay đổi chính sách",
        content: [
          {
            subtitle: "",
            text: "Chúng tôi có thể cập nhật chính sách này theo thời gian. Thay đổi sẽ được thông báo qua email hoặc hiển thị trong ứng dụng. Tiếp tục sử dụng sau khi thay đổi có nghĩa là bạn chấp nhận chính sách mới.",
          },
        ],
      },
      {
        title: "9. Liên hệ",
        content: [
          {
            subtitle: "",
            text: "Nếu bạn có câu hỏi về chính sách bảo mật hoặc yêu cầu xoá dữ liệu, vui lòng liên hệ:\n\nEmail: bossxomlut@gmail.com\n\nChúng tôi sẽ phản hồi trong vòng 72 giờ làm việc.",
          },
        ],
      },
    ],
  },
  en: {
    back: "Back to home",
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 12, 2026",
    intro:
      "Drag Spend ('we', 'us', 'the app') respects your privacy. This policy describes how we collect, use, and protect your personal information when you use the Drag Spend application.",
    sections: [
      {
        title: "1. Information We Collect",
        content: [
          {
            subtitle: "Account information",
            text: "When you register, we collect your email address and password (encrypted). You may optionally provide a display name.",
          },
          {
            subtitle: "Spending data",
            text: "This includes transactions you create: expense name, amount, date, and category. This data is stored to provide personal expense tracking features.",
          },
          {
            subtitle: "Usage data",
            text: "We may collect information about how you use the app (e.g., which features are accessed) to improve the user experience. This data does not contain personal content.",
          },
        ],
      },
      {
        title: "2. How We Use Your Information",
        content: [
          {
            subtitle: "",
            text: "We use collected information to:\n• Provide and maintain app features\n• Sync spending data across devices\n• Send verification and password reset emails (when required)\n• Improve the app based on aggregated (anonymous) analytics\n• Ensure security and detect fraud",
          },
        ],
      },
      {
        title: "3. Sharing of Information",
        content: [
          {
            subtitle: "",
            text: "We do NOT sell, trade, or share your personal information with third parties for commercial purposes.\n\nWe use Supabase (supabase.com) as our data infrastructure provider. Your data is stored on Supabase's secure servers. See Supabase's privacy policy at: supabase.com/privacy",
          },
        ],
      },
      {
        title: "4. Data Security",
        content: [
          {
            subtitle: "",
            text: "We apply industry-standard security measures:\n• HTTPS/TLS encryption for all data in transit\n• Passwords hashed with bcrypt\n• Secure JWT authentication\n• Row Level Security (RLS) — each user can only access their own data",
          },
        ],
      },
      {
        title: "5. Your Rights",
        content: [
          {
            subtitle: "",
            text: "You have full control over your data:\n• View and edit account information at any time\n• Delete all transaction data\n• Request account deletion from app settings or by contacting us\n\nWhen you request account deletion, your account is marked for deletion. All data will be permanently deleted after 30 days. During this period, you can contact bossxomlut@gmail.com to restore your account.",
          },
        ],
      },
      {
        title: "6. Data Retention",
        content: [
          {
            subtitle: "",
            text: "Your data is retained for as long as your account remains active. After requesting deletion, the account is marked pending and all data is permanently removed after 30 days. You may contact us to restore your account within that window.",
          },
        ],
      },
      {
        title: "7. Children",
        content: [
          {
            subtitle: "",
            text: "The app is not intended for users under 13 years of age. We do not knowingly collect information from children. If you believe a child has registered, please contact us so we can delete the account.",
          },
        ],
      },
      {
        title: "8. Changes to This Policy",
        content: [
          {
            subtitle: "",
            text: "We may update this policy from time to time. Changes will be communicated via email or displayed within the app. Continued use after changes constitutes acceptance of the updated policy.",
          },
        ],
      },
      {
        title: "9. Contact Us",
        content: [
          {
            subtitle: "",
            text: "If you have questions about this privacy policy or wish to request data deletion, please contact us:\n\nEmail: bossxomlut@gmail.com\n\nWe will respond within 72 business hours.",
          },
        ],
      },
    ],
  },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  const [lang] = useUILanguage();
  const t = T[lang];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">Drag Spend</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {t.title}
            </h1>
          </div>
          <p className="text-sm text-slate-400 mb-8">{t.lastUpdated}</p>

          {/* Intro */}
          <p className="text-slate-600 leading-relaxed mb-10 text-[15px] border-l-4 border-indigo-200 pl-4 py-1">
            {t.intro}
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {t.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      {item.subtitle && (
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">
                          {item.subtitle}
                        </h3>
                      )}
                      <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Drag Spend ·{" "}
              <Link
                href="/terms"
                className="hover:text-indigo-600 transition-colors underline underline-offset-2">
                {lang === "vi" ? "Điều khoản sử dụng" : "Terms of Service"}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
