"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { syncLangToURL } from "@/hooks/useUILanguage";

const OPTIONS = [
  { code: "vi", flag: "🇻🇳", label: "VI" },
  { code: "en", flag: "🇺🇸", label: "EN" },
];

export function DashboardLanguageSwitcher() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const handleSwitch = useCallback(
    async (l: string) => {
      if (l === language) return;
      // Immediate UI update
      setLanguage(l);
      localStorage.setItem("ui_language", l);
      syncLangToURL(l as "vi" | "en");
      // Persist to DB (fire-and-forget)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ language: l })
          .eq("id", user.id);
      }
    },
    [language, setLanguage],
  );

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-slate-700 bg-slate-800 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          onClick={() => handleSwitch(opt.code)}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
            transition-all duration-150 cursor-pointer
            ${
              language === opt.code
                ? "bg-slate-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }
          `}>
          <span>{opt.flag}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
