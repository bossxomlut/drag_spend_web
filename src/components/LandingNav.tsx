"use client";

import Link from "next/link";
import { TrendingDown } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUILanguage } from "@/hooks/useUILanguage";

const T = {
  vi: { login: "Đăng nhập", cta: "Dùng miễn phí" },
  en: { login: "Sign in", cta: "Get started free" },
};

export function LandingNav() {
  const [lang] = useUILanguage();
  const t = T[lang];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">Drag Spend</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
            {t.login}
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
            {t.cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
