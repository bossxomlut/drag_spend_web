"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useCreateCard, useUpdateCard } from "@/hooks/useData";
import { parseCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, Tag } from "lucide-react";
import type { SpendingCard, TransactionType } from "@/types";
import { useDashboardT } from "@/hooks/useDashboardT";

interface Variant {
  id?: string;
  label: string;
  amount: string;
  is_default: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editCard?: SpendingCard;
}

export function CreateCardDialog({ open, onOpenChange, editCard }: Props) {
  const categories = useAppStore((s) => s.categories);
  const t = useDashboardT();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [note, setNote] = useState("");
  const [variants, setVariants] = useState<Variant[]>([
    { label: "", amount: "", is_default: true },
  ]);

  // Populate when editing
  useEffect(() => {
    if (editCard && open) {
      setTitle(editCard.title);
      setType(editCard.type);
      setCategoryId(editCard.category_id);
      setNote(editCard.note ?? "");
      setVariants(
        editCard.variants && editCard.variants.length > 0
          ? editCard.variants
              .sort((a, b) => a.position - b.position)
              .map((v) => ({
                id: v.id,
                label: v.label ?? "",
                amount: String(v.amount),
                is_default: v.is_default,
              }))
          : [{ label: "", amount: "", is_default: true }],
      );
    } else if (!editCard && open) {
      setTitle("");
      setType("expense");
      setCategoryId(null);
      setNote("");
      setVariants([{ label: "", amount: "", is_default: true }]);
    }
  }, [editCard, open]);

  const filteredCategories = categories.filter((c) => c.type === type);

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { label: "", amount: "", is_default: false },
    ]);
  }

  function removeVariant(idx: number) {
    setVariants((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // If removed the default, set first as default
      if (prev[idx].is_default && next.length > 0) {
        next[0].is_default = true;
      }
      return next;
    });
  }

  function setDefault(idx: number) {
    setVariants((prev) =>
      prev.map((v, i) => ({ ...v, is_default: i === idx })),
    );
  }

  function updateVariant(
    idx: number,
    field: keyof Variant,
    value: string | boolean,
  ) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (variants.every((v) => !v.amount)) return;

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      type,
      note: note.trim() || undefined,
      variants: variants
        .filter((v) => v.amount)
        .map((v) => ({
          label: v.label.trim() || null,
          amount: parseCompact(v.amount),
          is_default: v.is_default,
        })),
    };

    if (editCard) {
      await updateCard.mutateAsync({ id: editCard.id, ...payload });
    } else {
      await createCard.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const isPending = createCard.isPending || updateCard.isPending;

  return (
    <>
      <CreateCategoryDialog
        open={createCatOpen}
        onOpenChange={setCreateCatOpen}
        defaultType={type}
        onCreated={(id) => setCategoryId(id)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editCard ? t.createCardTitleEdit : t.createCardTitleNew}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  setCategoryId(null);
                }}
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
                onClick={() => {
                  setType("income");
                  setCategoryId(null);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                  type === "income"
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-slate-500 border-slate-200 hover:border-green-300",
                )}>
                {t.income}
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>
                {t.cardNameLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder={t.cardNamePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t.categoryLabel}</Label>
                <button
                  type="button"
                  onClick={() => setCreateCatOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                  <Tag className="w-3.5 h-3.5" />
                  {t.addCategoryBtn}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setCategoryId(cat.id === categoryId ? null : cat.id)
                    }
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all",
                      categoryId === cat.id
                        ? "text-white border-transparent"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400",
                    )}
                    style={
                      categoryId === cat.id
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : {}
                    }>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {t.amountLabel}
                  {variants.length > 1 && (
                    <span className="text-xs text-slate-400 ml-1 font-normal">
                      {t.defaultHint}
                    </span>
                  )}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700"
                  onClick={addVariant}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t.addVariantBtn}
                </Button>
              </div>

              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      title={t.setDefaultTitle}
                      onClick={() => setDefault(idx)}
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        v.is_default
                          ? type === "expense"
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-green-500 border-green-500 text-white"
                          : "border-slate-300 hover:border-slate-500",
                      )}>
                      {v.is_default && <Check className="w-3 h-3" />}
                    </button>

                    <Input
                      placeholder={t.variantLabelPlaceholder}
                      value={v.label}
                      onChange={(e) =>
                        updateVariant(idx, "label", e.target.value)
                      }
                      className="w-28 h-8 text-xs"
                    />

                    <Input
                      placeholder={t.variantAmountPlaceholder}
                      value={v.amount}
                      onChange={(e) =>
                        updateVariant(idx, "amount", e.target.value)
                      }
                      className="flex-1 h-8 text-xs"
                      required={idx === 0}
                    />

                    {variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                        onClick={() => removeVariant(idx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">{t.amountHintCard}</p>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label>{t.noteOptionalLabel}</Label>
              <Input
                placeholder={t.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}>
                {t.cancelBtn}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t.saving
                  : editCard
                    ? t.updateCardBtn
                    : t.createCardBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
