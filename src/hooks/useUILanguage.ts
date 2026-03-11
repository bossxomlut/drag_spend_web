"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

export type UILanguage = "vi" | "en";

const KEY = "ui_language";

function getURLLang(): UILanguage | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("lang");
  return v === "vi" || v === "en" ? v : null;
}

export function syncLangToURL(l: UILanguage) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", l);
  window.history.replaceState({}, "", url.toString());
}

export function useUILanguage(): [UILanguage, (l: UILanguage) => void] {
  // Use the shared Zustand store so ALL components react to the same state
  const language = useAppStore((s) => s.language) as UILanguage;
  const setLanguage = useAppStore((s) => s.setLanguage);

  // Hydrate: URL param > localStorage > default
  useEffect(() => {
    const urlLang = getURLLang();
    const stored = localStorage.getItem(KEY) as UILanguage | null;
    const effective =
      urlLang ?? (stored === "vi" || stored === "en" ? stored : null);
    if (effective) {
      setLanguage(effective);
      localStorage.setItem(KEY, effective);
    }
    // Always reflect current lang in URL
    syncLangToURL((effective ?? language) as UILanguage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLang = useCallback(
    (l: UILanguage) => {
      localStorage.setItem(KEY, l);
      setLanguage(l);
      syncLangToURL(l);
    },
    [setLanguage],
  );

  return [language, setLang];
}

export function getStoredUILanguage(): UILanguage {
  if (typeof window === "undefined") return "vi";
  const v = localStorage.getItem(KEY);
  return v === "en" ? "en" : "vi";
}
