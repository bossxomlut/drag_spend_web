import { vi, enUS } from "date-fns/locale";
import { useAppStore } from "@/store/useAppStore";

export function useLocale() {
  const language = useAppStore((s) => s.language);
  return language === "en" ? enUS : vi;
}
