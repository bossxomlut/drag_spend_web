"use client";

import { useEffect, useState } from "react";
import { useCreateCategory } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransactionType } from "@/types";
import { useDashboardT } from "@/hooks/useDashboardT";

const PRESET_COLORS = [
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#6b7280",
];

const PRESET_ICONS = [
  "🍜",
  "🍕",
  "☕",
  "🏠",
  "⛽",
  "🛍",
  "📱",
  "💊",
  "🎉",
  "✈️",
  "🏋️",
  "📚",
  "🎬",
  "🐾",
  "💰",
  "💻",
  "📈",
  "🏧",
  "🎁",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: TransactionType;
  onCreated?: (categoryId: string) => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  defaultType = "expense",
  onCreated,
}: Props) {
  const createCategory = useCreateCategory();
  const t = useDashboardT();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#6366f1");
  const [type, setType] = useState<TransactionType>(defaultType);

  useEffect(() => {
    if (open) {
      setName("");
      setIcon("📦");
      setColor("#6366f1");
      setType(defaultType);
    }
  }, [open, defaultType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await createCategory.mutateAsync({
      name: name.trim(),
      icon,
      color,
      type,
    });
    onCreated?.(result.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.createCatTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                type === "expense"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-red-300",
              )}>
              {t.expense}
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                type === "income"
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-green-300",
              )}>
              {t.income}
            </button>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>
              {t.catNameLabel} <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder={t.catNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <Label>{t.catIconLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value || "📦")}
                className="w-16 text-center text-lg"
                maxLength={2}
              />
              <div className="flex flex-wrap gap-1.5 flex-1">
                {PRESET_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={cn(
                      "w-8 h-8 rounded-md text-base border transition-all hover:bg-slate-50",
                      icon === ic
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200",
                    )}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>{t.catColorLabel}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer border border-slate-200 p-0.5"
              />
              <div className="flex flex-wrap gap-1.5 flex-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      color === c
                        ? "border-slate-800 scale-110"
                        : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500">{t.catPreview}</span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white"
              style={{ backgroundColor: color }}>
              {icon} {name || t.catFallbackName}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              {t.cancelBtn}
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? t.saving : t.addCatBtn}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
