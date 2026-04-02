"use client";

import { useEffect } from "react";
import { useUILanguage } from "@/hooks/useUILanguage";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdBannerProps {
  slot?: string;
  format?: string;
  className?: string;
}

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const defaultSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

export function AdBanner({
  slot = defaultSlot,
  format = "auto",
  className,
}: AdBannerProps) {
  const [lang] = useUILanguage();

  useEffect(() => {
    if (!clientId || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle script not yet loaded
    }
  }, [slot]);

  if (!clientId || !slot) return null;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center select-none mb-0.5">
        {lang === "vi" ? "Quảng cáo" : "Advertisement"}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
