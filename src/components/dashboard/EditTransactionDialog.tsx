"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useUpdateTransaction } from "@/hooks/useData";
import { parseCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { Tag } from "lucide-react";
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
import type { Transaction, TransactionType } from "@/types";
import { useDashboardT } from "@/hooks/useDashboardT";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: Transaction;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: Props) {
  const categories = useAppStore((s) => s.categories);
  const updateTransaction = useUpdateTransaction();
  const t = useDashboardT();

  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction.category_id,
  );
  const [note, setNote] = useState(transaction.note ?? "");
  const [createCatOpen, setCreateCatOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(transaction.title);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setCategoryId(transaction.category_id);
      setNote(transaction.note ?? "");
    }
  }, [open, transaction]);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateTransaction.mutateAsync({
      id: transaction.id,
      date: transaction.date,
      title: title.trim(),
      amount: parseCompact(amount),
      type,
      category_id: categoryId,
      note: note.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <>
      <CreateCategoryDialog
        open={createCatOpen}
        onOpenChange={setCreateCatOpen}
        defaultType={type}
        onCreated={(id) => setCategoryId(id)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.editTxnDialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Type */}
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
              <Label>{t.txnTitleLabel}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>{t.txnAmountLabel}</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t.txnAmountPlaceholder}
                required
              />
              <p className="text-[11px] text-slate-400">{t.txnAmountHint}</p>
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

            {/* Note */}
            <div className="space-y-1.5">
              <Label>{t.txnNoteLabel}</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.txnNotePlaceholder}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}>
                {t.cancelBtn}
              </Button>
              <Button type="submit" disabled={updateTransaction.isPending}>
                {updateTransaction.isPending ? t.saving : t.saveBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
