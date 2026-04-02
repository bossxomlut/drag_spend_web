"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdBanner } from "@/components/AdBanner";
import { useDashboardT } from "@/hooks/useDashboardT";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECS = 5;

interface CsvAdGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}

/**
 * Renders a fresh countdown each time it is mounted.
 * Caller should increment a `key` prop on each open to force remount.
 */
export function CsvAdGateDialog({
  open,
  onOpenChange,
  onDownload,
}: CsvAdGateDialogProps) {
  const t = useDashboardT();
  const [remaining, setRemaining] = useState(COUNTDOWN_SECS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown once on mount; cleans up on unmount.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleDownload() {
    onDownload();
    onOpenChange(false);
  }

  const unlocked = remaining === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogTitle>{t.csvAdGateTitle}</DialogTitle>
        <DialogDescription>{t.csvAdGateDesc}</DialogDescription>

        {/* Ad unit */}
        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <AdBanner />
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-400 dark:bg-indigo-500 transition-[width] duration-1000 ease-linear"
            style={{
              width: `${((COUNTDOWN_SECS - remaining) / COUNTDOWN_SECS) * 100}%`,
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {t.csvAdGateCancel}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!unlocked}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              unlocked
                ? "bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
            )}>
            <Download className="w-3 h-3" />
            {unlocked ? t.csvAdGateDownload : t.csvAdGateWait(remaining)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
