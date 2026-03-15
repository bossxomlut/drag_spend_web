"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrendingDown, CheckCircle2, Sparkles } from "lucide-react";
import { useUILanguage } from "@/hooks/useUILanguage";

const T = {
  vi: {
    verified: "Email đã xác thực!",
    heading: "Chào mừng đến Drag Spend",
    description:
      "Tài khoản của bạn đã sẵn sàng. Hãy chọn ngôn ngữ để bắt đầu hành trình quản lý chi tiêu thông minh nhé.",
    cta: "Bắt đầu ngay",
  },
  en: {
    verified: "Email verified!",
    heading: "Welcome to Drag Spend",
    description:
      "Your account is ready. Choose your language to start your smart expense tracking journey.",
    cta: "Get started",
  },
} as const;

export default function WelcomePage() {
  const [lang] = useUILanguage();
  const t = T[lang];
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 text-white mb-8">
          <div className="bg-indigo-500 rounded-xl p-2">
            <TrendingDown className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold">Drag Spend</span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          {/* Success icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1" />
            </div>
          </div>

          {/* Verified badge */}
          <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {t.verified}
          </span>

          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {t.heading}
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {t.description}
          </p>

          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => router.push("/onboarding/language")}>
            {t.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
