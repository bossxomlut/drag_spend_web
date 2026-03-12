"use client";

import Link from "next/link";
import { TrendingDown, ArrowLeft, FileText } from "lucide-react";
import { useUILanguage } from "@/hooks/useUILanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// ─── Data ──────────────────────────────────────────────────────────────────────

const T = {
  vi: {
    back: "Quay lại trang chủ",
    title: "Điều Khoản Sử Dụng",
    lastUpdated: "Cập nhật lần cuối: 12 tháng 3, 2026",
    intro:
      "Bằng cách tạo tài khoản hoặc sử dụng Drag Spend, bạn đồng ý với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng.",
    sections: [
      {
        title: "1. Chấp nhận điều khoản",
        text: "Bằng việc truy cập hoặc sử dụng ứng dụng Drag Spend, bạn đồng ý bị ràng buộc bởi các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng.",
      },
      {
        title: "2. Tài khoản người dùng",
        text: "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Không chia sẻ tài khoản với người khác. Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.",
      },
      {
        title: "3. Sử dụng hợp lệ",
        text: "Bạn đồng ý không sử dụng ứng dụng để:\n• Vi phạm pháp luật hiện hành\n• Đăng thông tin sai lệch hoặc gây hại\n• Cố gắng truy cập trái phép vào hệ thống\n• Phá hoại hoặc làm gián đoạn dịch vụ",
      },
      {
        title: "4. Miễn phí & hạn chế",
        text: "Drag Spend cung cấp dịch vụ miễn phí. Chúng tôi có quyền giới hạn tính năng, điều chỉnh giới hạn sử dụng, hoặc ngừng dịch vụ với thông báo trước hợp lý.",
      },
      {
        title: "5. Quyền sở hữu trí tuệ",
        text: "Giao diện, thiết kế và mã nguồn của Drag Spend thuộc sở hữu của chúng tôi. Dữ liệu chi tiêu bạn nhập thuộc sở hữu của bạn. Bạn không được sao chép, phân phối hay tạo sản phẩm phái sinh từ ứng dụng mà không có sự cho phép.",
      },
      {
        title: "6. Giới hạn trách nhiệm",
        text: "Drag Spend được cung cấp 'nguyên trạng'. Chúng tôi không chịu trách nhiệm cho:\n• Mất dữ liệu do sự cố kỹ thuật ngoài tầm kiểm soát\n• Quyết định tài chính dựa trên dữ liệu trong ứng dụng\n• Gián đoạn dịch vụ tạm thời",
      },
      {
        title: "7. Chấm dứt tài khoản",
        text: "Chúng tôi có quyền tạm ngừng hoặc xoá tài khoản vi phạm điều khoản này. Bạn cũng có thể yêu cầu xoá tài khoản bất kỳ lúc nào bằng cách liên hệ bossxomlut@gmail.com.",
      },
      {
        title: "8. Thay đổi điều khoản",
        text: "Chúng tôi có thể cập nhật các điều khoản này theo thời gian. Tiếp tục sử dụng sau khi thay đổi có hiệu lực là bằng chứng bạn chấp nhận điều khoản mới.",
      },
      {
        title: "9. Liên hệ",
        text: "Mọi thắc mắc liên quan đến điều khoản sử dụng, vui lòng liên hệ:\n\nEmail: bossxomlut@gmail.com",
      },
    ],
  },
  en: {
    back: "Back to home",
    title: "Terms of Service",
    lastUpdated: "Last updated: March 12, 2026",
    intro:
      "By creating an account or using Drag Spend, you agree to the following terms. Please read carefully before use.",
    sections: [
      {
        title: "1. Acceptance of Terms",
        text: "By accessing or using the Drag Spend application, you agree to be bound by these terms. If you do not agree, please stop using the service.",
      },
      {
        title: "2. User Accounts",
        text: "You are responsible for maintaining the security of your login credentials. Do not share your account with others. Notify us immediately if you detect unauthorized access.",
      },
      {
        title: "3. Acceptable Use",
        text: "You agree not to use the app to:\n• Violate any applicable laws\n• Post false or harmful information\n• Attempt unauthorized access to systems\n• Disrupt or sabotage the service",
      },
      {
        title: "4. Free Service & Limitations",
        text: "Drag Spend is provided free of charge. We reserve the right to limit features, adjust usage limits, or discontinue the service with reasonable prior notice.",
      },
      {
        title: "5. Intellectual Property",
        text: "The interface, design, and source code of Drag Spend are our property. The spending data you enter belongs to you. You may not copy, distribute, or create derivative works from the app without permission.",
      },
      {
        title: "6. Limitation of Liability",
        text: "Drag Spend is provided 'as is'. We are not liable for:\n• Data loss due to technical failures beyond our control\n• Financial decisions made based on data in the app\n• Temporary service interruptions",
      },
      {
        title: "7. Account Termination",
        text: "We reserve the right to suspend or delete accounts that violate these terms. You may also request account deletion at any time by contacting bossxomlut@gmail.com.",
      },
      {
        title: "8. Changes to Terms",
        text: "We may update these terms from time to time. Continued use after changes take effect constitutes acceptance of the new terms.",
      },
      {
        title: "9. Contact",
        text: "For any questions regarding these terms, please contact us:\n\nEmail: bossxomlut@gmail.com",
      },
    ],
  },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TermsPage() {
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
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">{t.title}</h1>
          </div>
          <p className="text-sm text-slate-400 mb-8">{t.lastUpdated}</p>

          {/* Intro */}
          <p className="text-slate-600 leading-relaxed mb-10 text-[15px] border-l-4 border-indigo-200 pl-4 py-1">
            {t.intro}
          </p>

          {/* Sections */}
          <div className="space-y-8">
            {t.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-slate-900 mb-3">
                  {section.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                  {section.text}
                </p>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Drag Spend ·{" "}
              <Link
                href="/privacy"
                className="hover:text-indigo-600 transition-colors underline underline-offset-2">
                {lang === "vi" ? "Chính sách bảo mật" : "Privacy Policy"}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
