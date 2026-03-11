"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/currency";
import {
  useDeleteCard,
  useSetDefaultVariant,
  useCreateTransaction,
} from "@/hooks/useData";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical, Plus, Check } from "lucide-react";
import { CreateCardDialog } from "./CreateCardDialog";
import { toast } from "sonner";
import type { SpendingCard } from "@/types";
import { useDashboardT } from "@/hooks/useDashboardT";

interface Props {
  card: SpendingCard;
}

export function SpendingCardItem({ card }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const t = useDashboardT();
  const deleteCard = useDeleteCard();
  const setDefaultVariant = useSetDefaultVariant();
  const createTransaction = useCreateTransaction();
  const selectedDate = useAppStore((s) => s.selectedDate);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const removeTransaction = useAppStore((s) => s.removeTransaction);
  const transactionsByDate = useAppStore((s) => s.transactionsByDate);

  function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    const defaultVariant =
      card.variants?.find((v) => v.is_default) ?? card.variants?.[0];
    const amount = defaultVariant?.amount ?? 0;
    const existingCount = (transactionsByDate[selectedDate] ?? []).length;
    const tempId = `__opt__${Date.now()}`;
    const tempTxn = {
      id: tempId,
      user_id: "",
      source_card_id: card.id,
      date: selectedDate,
      title: card.title,
      amount,
      category_id: card.category_id,
      type: card.type,
      note: card.note ?? null,
      position: existingCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: card.category ?? null,
    };
    addTransaction(tempTxn);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);

    createTransaction.mutate(
      {
        source_card_id: card.id,
        date: selectedDate,
        title: card.title,
        amount,
        category_id: card.category_id,
        type: card.type,
        note: card.note ?? undefined,
        position: existingCount,
      },
      {
        onSuccess: (real) => {
          removeTransaction(tempId, selectedDate);
          addTransaction(real);
          toast.success(t.toastAdded(card.title));
        },
        onError: () => {
          removeTransaction(tempId, selectedDate);
          toast.error(t.toastError);
        },
      },
    );
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: thisDragging,
  } = useDraggable({
    id: `card-${card.id}`,
    data: { kind: "card", card } satisfies { kind: "card"; card: SpendingCard },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: thisDragging ? 0.3 : 1,
  };

  const defaultVariant =
    card.variants?.find((v) => v.is_default) ?? card.variants?.[0];
  const hasMultipleVariants = (card.variants?.length ?? 0) > 1;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative rounded-xl border transition-all duration-150 bg-white flex items-stretch",
          card.type === "expense"
            ? "border-red-100 hover:border-red-300 hover:shadow-md hover:shadow-red-50"
            : "border-green-100 hover:border-green-300 hover:shadow-md hover:shadow-green-50",
          thisDragging && "shadow-lg scale-105",
        )}>
        {/* Left: icon + content */}
        <div className="flex-1 flex items-start gap-2 p-3 min-w-0">
          {/* Icon */}
          <span className="text-base mt-0.5 shrink-0">
            {card.category?.icon ?? "📦"}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 leading-tight truncate">
              {card.title}
            </p>

            {/* Variants (single choice) */}
            {hasMultipleVariants ? (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {card.variants
                  ?.sort((a, b) => a.position - b.position)
                  .map((v) => (
                    <button
                      key={v.id}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!v.is_default) {
                          setDefaultVariant.mutate({
                            cardId: card.id,
                            variantId: v.id,
                          });
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-all",
                        v.is_default
                          ? card.type === "expense"
                            ? "bg-red-100 border-red-300 text-red-700 font-semibold"
                            : "bg-green-100 border-green-300 text-green-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400",
                      )}>
                      {v.is_default && (
                        <span className="w-1 h-1 rounded-full bg-current inline-block mr-0.5" />
                      )}
                      {v.label ? `${v.label} · ` : ""}
                      {formatCompact(v.amount)}
                    </button>
                  ))}
              </div>
            ) : (
              <p
                className={cn(
                  "text-xs font-semibold mt-0.5",
                  card.type === "expense" ? "text-red-500" : "text-green-500",
                )}>
                {card.type === "expense" ? "-" : "+"}
                {formatCompact(defaultVariant?.amount ?? 0)}
              </p>
            )}

            {/* Category badge */}
            {card.category && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 mt-1.5 font-normal"
                style={{
                  backgroundColor: card.category.color + "20",
                  color: card.category.color,
                }}>
                {card.category.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: action buttons + drag handle */}
        <div className="flex flex-col shrink-0">
          {/* Top buttons row */}
          <div className="flex gap-0.5 p-1.5 pb-0">
            {/* Quick-add: always visible on mobile, hover on desktop */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleQuickAdd}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                "lg:opacity-0 lg:group-hover:opacity-100",
                justAdded
                  ? card.type === "expense"
                    ? "bg-red-100 text-red-500"
                    : "bg-green-100 text-green-500"
                  : card.type === "expense"
                    ? "bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 active:scale-90"
                    : "bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-700 active:scale-90",
              )}
              title={t.quickAddTitle}>
              {justAdded ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Edit + Delete — shown on hover only */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100">
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(true);
              }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Wide drag handle — hidden on mobile, visible on desktop */}
          <div
            {...attributes}
            {...listeners}
            className="hidden lg:flex flex-1 items-center justify-center px-2 cursor-grab active:cursor-grabbing touch-none min-w-[28px]"
            title={t.dragTitle}>
            <GripVertical className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      </div>
      <CreateCardDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editCard={card}
      />
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              deleteCard.mutate(card.id);
              setDeleteConfirm(false);
            }}>
            <DialogHeader>
              <DialogTitle>{t.deleteCardTitle}</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {t.deleteCardPrefix} <strong>&ldquo;{card.title}&rdquo;</strong>{" "}
                {t.deleteCardSuffix}
              </p>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(false)}>
                {t.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={deleteCard.isPending}>
                {t.deleteBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>{" "}
    </>
  );
}
