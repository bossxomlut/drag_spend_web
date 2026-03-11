"use client";

import { useUILanguage, type UILanguage } from "@/hooks/useUILanguage";

const OPTIONS: { code: UILanguage; flag: string; label: string }[] = [
  { code: "vi", flag: "🇻🇳", label: "VI" },
  { code: "en", flag: "🇺🇸", label: "EN" },
];

export function LanguageSwitcher() {
  const [lang, setLang] = useUILanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/10 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLang(opt.code)}
          className={`
            flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold
            transition-all duration-150 cursor-pointer
            ${
              lang === opt.code
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-300 hover:text-white"
            }
          `}>
          <span>{opt.flag}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
