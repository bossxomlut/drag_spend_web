"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useUILanguage } from "@/hooks/useUILanguage";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdBannerProps {
  slot?: string;
}

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const defaultSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

export function AdBanner({ slot = defaultSlot }: AdBannerProps) {
  const [lang] = useUILanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible || !clientId || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle script not yet loaded
    }
  }, [visible, slot]);

  function dismiss() {
    setVisible(false);
  }

  if (!clientId || !slot || !visible) return null;

  const label = lang === "vi" ? "Quảng cáo" : "Ad";
  const closeLabel = lang === "vi" ? "Ẩn" : "Hide";

  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
      {/* Label */}
      <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
        {label}
      </span>

      {/* Ad unit */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: "block", height: 50 }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        title={closeLabel}
        aria-label={closeLabel}
        className="flex-shrink-0 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
        <X className="w-3 h-3" />
        <span className="hidden sm:inline">{closeLabel}</span>
      </button>
    </div>
  );
}
