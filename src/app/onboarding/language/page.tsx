"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingDown, Check } from "lucide-react";
import { useUILanguage, getStoredUILanguage } from "@/hooks/useUILanguage";

const T = {
  vi: {
    title: "Chọn ngôn ngữ",
    subtitle: "Dữ liệu mẫu sẽ được tạo theo ngôn ngữ bạn chọn.",
    btnLoading: "Đang khởi tạo...",
    btnContinue: "Tiếp tục",
    errSession: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.",
    errGeneric: "Có lỗi xảy ra, vui lòng thử lại.",
  },
  en: {
    title: "Choose your language",
    subtitle: "Sample data will be created in the language you choose.",
    btnLoading: "Setting up...",
    btnContinue: "Continue",
    errSession: "Session expired, please log in again.",
    errGeneric: "An error occurred, please try again.",
  },
} as const;

const LANGUAGES = [
  {
    code: "vi",
    flag: "🇻🇳",
    name: "Tiếng Việt",
    description: "Dữ liệu mẫu bằng tiếng Việt",
  },
  {
    code: "en",
    flag: "🇺🇸",
    name: "English",
    description: "Sample data in English",
  },
];

export default function LanguageSelectPage() {
  const [selected, setSelected] = useState<string>(() => getStoredUILanguage());
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [lang] = useUILanguage();
  const t = T[lang] ?? T.vi;

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t.errSession);
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase.rpc("ensure_user_seeded", {
      p_user_id: user.id,
      p_name: user.user_metadata?.name ?? null,
      p_language: selected,
    });

    setLoading(false);

    if (error) {
      toast.error(t.errGeneric);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white mb-2">
            <div className="bg-indigo-500 rounded-xl p-2">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">Drag Spend</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-semibold text-slate-800 mb-1">
            {t.title}
          </h1>
          <p className="text-sm text-slate-500 mb-6">{t.subtitle}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelected(lang.code)}
                  className={`
                    relative flex flex-col items-center gap-2 rounded-xl border-2 p-5
                    transition-all duration-150 cursor-pointer
                    ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}>
                  {isSelected && (
                    <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <span className="text-4xl">{lang.flag}</span>
                  <span
                    className={`font-semibold text-sm ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
                    {lang.name}
                  </span>
                  <span className="text-xs text-slate-400 text-center leading-tight">
                    {lang.description}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full"
            disabled={!selected || loading}
            onClick={handleContinue}>
            {loading ? t.btnLoading : t.btnContinue}
          </Button>
        </div>
      </div>
    </div>
  );
}
