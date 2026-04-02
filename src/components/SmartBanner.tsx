"use client";

import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useUILanguage } from "@/hooks/useUILanguage";
import { cn } from "@/lib/utils";
import type { SmartBannerConfig } from "@/hooks/useAdStrategy";

interface SmartBannerProps {
  config: SmartBannerConfig;
  className?: string;
}

const VARIANT_WRAP: Record<SmartBannerConfig["variant"], string> = {
  insight:
    "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50",
  tip: "bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50",
  affiliate:
    "bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-800/50",
};

const VARIANT_TEXT: Record<SmartBannerConfig["variant"], string> = {
  insight: "text-indigo-700 dark:text-indigo-300",
  tip: "text-amber-700 dark:text-amber-300",
  affiliate: "text-teal-700 dark:text-teal-300",
};

const VARIANT_CTA: Record<SmartBannerConfig["variant"], string> = {
  insight:
    "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200",
  tip: "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200",
  affiliate:
    "text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200",
};

/**
 * Native inline banner that looks like a financial insight card.
 * Dismissible per session (React state only — reappears on refresh).
 */
export function SmartBanner({ config, className }: SmartBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [lang] = useUILanguage();

  if (dismissed) return null;

  const isEn = lang === "en";
  const message = isEn ? config.en : config.vi;
  const ctaLabel = isEn ? config.ctaEn : config.ctaVi;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3 py-2.5",
        VARIANT_WRAP[config.variant],
        className,
      )}>
      {/* Icon */}
      <span className="text-sm leading-snug shrink-0 mt-0.5" aria-hidden>
        {config.icon}
      </span>

      {/* Message + optional CTA link */}
      <p
        className={cn(
          "flex-1 text-[11px] leading-relaxed",
          VARIANT_TEXT[config.variant],
        )}>
        {message}
        {ctaLabel && config.ctaHref && (
          <>
            {" "}
            <a
              href={config.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:no-underline",
                VARIANT_CTA[config.variant],
              )}>
              {ctaLabel}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </>
        )}
      </p>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-0.5"
        aria-label={isEn ? "Dismiss" : "Ẩn"}>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
