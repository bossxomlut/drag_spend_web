"use client";

import {
  useState,
  useTransition,
  useMemo,
  useCallback,
  memo,
  useEffect,
  useRef,
} from "react";
import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/hooks/useLocale";
import {
  useTransactions,
  useDeleteTransaction,
  useSaveTransactionAsCard,
  useCopyFromYesterday,
} from "@/hooks/useData";
import { formatVND, formatCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  Pencil,
  Trash2,
  BookmarkPlus,
  GripVertical,
  Copy,
  Loader2,
} from "lucide-react";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { useDashboardT } from "@/hooks/useDashboardT";
import type { Transaction } from "@/types";

const EMPTY: Transaction[] = [];

export function SelectedDayView() {
  const locale = useLocale();
  const t = useDashboardT();
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  // Granular selector: only re-renders when the selected date's transactions change
  const transactions =
    useAppStore((s) => s.transactionsByDate[s.selectedDate]) ?? EMPTY;
  const [, startTransition] = useTransition();

  useTransactions(selectedDate);
  const copyFromYesterday = useCopyFromYesterday();
  // Lift mutations to parent — avoids creating 2 mutation instances per TransactionItemFull
  const deleteTransaction = useDeleteTransaction();
  const saveAsCard = useSaveTransactionAsCard();
  const handleDelete = useCallback(
    (args: { id: string; date: string }) => deleteTransaction.mutate(args),
    [deleteTransaction],
  );
  const handleSave = useCallback(
    (txn: Transaction) => saveAsCard.mutate(txn),
    [saveAsCard],
  );
  const [pendingEditTxn, setPendingEditTxn] = useState<Transaction | null>(null);
  const [pendingDeleteTxn, setPendingDeleteTxn] =
    useState<Transaction | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);

  const { expenses, incomes, totalExpense, totalIncome, net } = useMemo(() => {
    const expenses = transactions.filter((txn) => txn.type === "expense");
    const incomes = transactions.filter((txn) => txn.type === "income");
    const totalExpense = expenses.reduce((s, txn) => s + txn.amount, 0);
    const totalIncome = incomes.reduce((s, txn) => s + txn.amount, 0);
    return {
      expenses,
      incomes,
      totalExpense,
      totalIncome,
      net: totalIncome - totalExpense,
    };
  }, [transactions]);

  const INITIAL_CHUNK = 40;
  const CHUNK_SIZE = 30;
  const [expenseRenderCount, setExpenseRenderCount] =
    useState(INITIAL_CHUNK);
  const [incomeRenderCount, setIncomeRenderCount] = useState(INITIAL_CHUNK);
  const prevExpenseLen = useRef(0);
  const prevIncomeLen = useRef(0);

  // Reset chunking when date or list size changes
  useEffect(() => {
    setExpenseRenderCount(Math.min(INITIAL_CHUNK, expenses.length));
    setIncomeRenderCount(Math.min(INITIAL_CHUNK, incomes.length));
    prevExpenseLen.current = expenses.length;
    prevIncomeLen.current = incomes.length;
  }, [selectedDate]);

  // Clamp (or auto-expand) render count when list length changes
  useEffect(() => {
    setExpenseRenderCount((c) => {
      const prevLen = prevExpenseLen.current;
      prevExpenseLen.current = expenses.length;
      if (c >= prevLen) return expenses.length; // keep fully-rendered state
      return Math.min(c, expenses.length);
    });
  }, [expenses.length]);

  useEffect(() => {
    setIncomeRenderCount((c) => {
      const prevLen = prevIncomeLen.current;
      prevIncomeLen.current = incomes.length;
      if (c >= prevLen) return incomes.length; // keep fully-rendered state
      return Math.min(c, incomes.length);
    });
  }, [incomes.length]);

  // Progressive render to avoid blocking on very large lists
  useEffect(() => {
    if (expenseRenderCount >= expenses.length) return;
    const id = window.setTimeout(() => {
      setExpenseRenderCount((c) =>
        Math.min(expenses.length, c + CHUNK_SIZE),
      );
    }, 16);
    return () => clearTimeout(id);
  }, [expenseRenderCount, expenses.length]);

  useEffect(() => {
    if (incomeRenderCount >= incomes.length) return;
    const id = window.setTimeout(() => {
      setIncomeRenderCount((c) =>
        Math.min(incomes.length, c + CHUNK_SIZE),
      );
    }, 16);
    return () => clearTimeout(id);
  }, [incomeRenderCount, incomes.length]);

  const visibleExpenses =
    expenseRenderCount >= expenses.length
      ? expenses
      : expenses.slice(0, expenseRenderCount);
  const visibleIncomes =
    incomeRenderCount >= incomes.length
      ? incomes
      : incomes.slice(0, incomeRenderCount);

  // Stable id arrays for SortableContext — avoids recreation on every render
  const expenseIds = useMemo(
    () => visibleExpenses.map((e) => e.id),
    [visibleExpenses],
  );
  const incomeIds = useMemo(
    () => visibleIncomes.map((i) => i.id),
    [visibleIncomes],
  );

  const { setNodeRef, isOver: isOverZone } = useDroppable({
    id: `day-${selectedDate}`,
  });

  // Also light up when a card is dragged over any transaction belonging to this day
  const [isCardOverList, setIsCardOverList] = useState(false);
  useDndMonitor({
    onDragOver({ active, over }) {
      if (!over) {
        setIsCardOverList(false);
        return;
      }
      const isCard = active.data.current?.kind === "card";
      const overTxn =
        over.data.current?.kind === "transaction" &&
        over.data.current?.fromDate === selectedDate;
      setIsCardOverList(isCard && overTxn);
    },
    onDragEnd() {
      setIsCardOverList(false);
    },
    onDragCancel() {
      setIsCardOverList(false);
    },
  });
  const isOver = isOverZone || isCardOverList;

  const parsedDate = parseISO(selectedDate);
  const todayFlag = isToday(parsedDate);

  function goPrev() {
    startTransition(() =>
      setSelectedDate(format(subDays(parsedDate, 1), "yyyy-MM-dd")),
    );
  }
  function goNext() {
    startTransition(() =>
      setSelectedDate(format(addDays(parsedDate, 1), "yyyy-MM-dd")),
    );
  }
  function goToday() {
    startTransition(() => setSelectedDate(format(new Date(), "yyyy-MM-dd")));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="px-3 lg:px-5 pt-3 lg:pt-5 pb-3 lg:pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 capitalize">
                  {format(parsedDate, "EEEE", { locale })}
                </h2>
                {todayFlag && (
                  <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                    {t.today}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                {format(parsedDate, "d MMMM yyyy", { locale })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {!todayFlag && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={goToday}>
              <CalendarDays className="w-3.5 h-3.5" />
              {t.today}
            </Button>
          )}
        </div>

        {/* Day summary chips */}
        {transactions.length > 0 && (
          <div className="flex items-center gap-3 mt-3">
            {totalIncome > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-semibold">
                  +{formatCompact(totalIncome)}
                </span>
              </div>
            )}
            {totalExpense > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-500 font-semibold">
                  -{formatCompact(totalExpense)}
                </span>
              </div>
            )}
            {transactions.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span
                  className={cn(
                    "text-sm font-bold",
                    net < 0
                      ? "text-red-500"
                      : net > 0
                        ? "text-green-600"
                        : "text-slate-400",
                  )}>
                  {net === 0
                    ? "±0"
                    : `${net > 0 ? "+" : ""}${formatCompact(net)}`}
                </span>
                <span className="text-xs text-slate-400">
                  {transactions.length} {t.transactions}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto transition-colors duration-150",
          isOver ? "bg-indigo-50/70" : "bg-white",
        )}>
        {/* Sections: Expense + Income */}
        {transactions.length === 0 ? (
          <div
            className={cn(
              "h-full flex flex-col items-center justify-center gap-3 transition-all",
              isOver ? "scale-105" : "",
            )}>
            <div
              className={cn(
                "w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center transition-colors",
                isOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200",
              )}>
              <span className="text-3xl">{isOver ? "✨" : "📋"}</span>
            </div>
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                isOver ? "text-indigo-600" : "text-slate-400",
              )}>
              {isOver ? t.dropHover : t.dropEmpty}
            </p>
            {!isOver && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
                disabled={copyFromYesterday.isPending}
                onClick={() => copyFromYesterday.mutate(selectedDate)}>
                {copyFromYesterday.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {t.copyYesterday}
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Expense transactions */}
            {expenses.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  {t.expense}
                </p>
                <SortableContext
                  items={expenseIds}
                  strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {visibleExpenses.map((txn) => (
                      <TransactionItemFull
                        key={txn.id}
                        transaction={txn}
                        t={t}
                        onRequestEdit={setPendingEditTxn}
                        onRequestDelete={setPendingDeleteTxn}
                        onSave={handleSave}
                      />
                    ))}
                  </div>
                </SortableContext>
              </section>
            )}

            {/* Income transactions */}
            {incomes.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  {t.income}
                </p>
                <SortableContext
                  items={incomeIds}
                  strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {visibleIncomes.map((txn) => (
                      <TransactionItemFull
                        key={txn.id}
                        transaction={txn}
                        t={t}
                        onRequestEdit={setPendingEditTxn}
                        onRequestDelete={setPendingDeleteTxn}
                        onSave={handleSave}
                      />
                    ))}
                  </div>
                </SortableContext>
              </section>
            )}

            {(expenseRenderCount < expenses.length ||
              incomeRenderCount < incomes.length) && (
              <p className="text-[11px] text-slate-400 text-center pt-2">
                {t.loadingMore ?? "Đang tải thêm..."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom total bar */}
      {transactions.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {transactions.length} {t.transactions}
          </span>
          <div className="flex items-center gap-4 text-sm">
            {totalIncome > 0 && (
              <span className="text-green-600">+{formatVND(totalIncome)}</span>
            )}
            {totalExpense > 0 && (
              <span className="text-red-500">-{formatVND(totalExpense)}</span>
            )}
            <span
              className={cn(
                "font-bold",
                net < 0
                  ? "text-red-500"
                  : net > 0
                    ? "text-green-600"
                    : "text-slate-500",
              )}>
              {net > 0 ? "+" : ""}
              {formatVND(net)}
            </span>
          </div>
        </div>
      )}

      {/* Shared dialogs (single instance, not per row) */}
      <ConfirmDialog
        open={!!pendingEditTxn}
        onOpenChange={(v) => {
          if (!v) setPendingEditTxn(null);
        }}
        title={t.editTxnTitle}
        description={
          pendingEditTxn
            ? `"${pendingEditTxn.title}" — ${formatVND(pendingEditTxn.amount)}`
            : undefined
        }
        confirmLabel={t.editTxnConfirm}
        onConfirm={() => {
          if (pendingEditTxn) setEditTxn(pendingEditTxn);
          setPendingEditTxn(null);
        }}
      />
      <ConfirmDialog
        open={!!pendingDeleteTxn}
        onOpenChange={(v) => {
          if (!v) setPendingDeleteTxn(null);
        }}
        title={t.deleteTxnTitle}
        description={
          pendingDeleteTxn
            ? `"${pendingDeleteTxn.title}" — ${formatVND(
                pendingDeleteTxn.amount,
              )} ${t.deleteTxnSuffix}`
            : undefined
        }
        confirmLabel={t.deleteTxnConfirm}
        danger
        onConfirm={() => {
          if (pendingDeleteTxn) {
            handleDelete({
              id: pendingDeleteTxn.id,
              date: pendingDeleteTxn.date,
            });
          }
          setPendingDeleteTxn(null);
        }}
      />
      {editTxn && (
        <EditTransactionDialog
          open={!!editTxn}
          onOpenChange={(open) => {
            if (!open) setEditTxn(null);
          }}
          transaction={editTxn}
        />
      )}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  const t = useDashboardT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm();
            onOpenChange(false);
          }}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              className={
                danger ? "bg-red-500 hover:bg-red-600 text-white" : ""
              }>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transaction Row ───────────────────────────────────────────────────────────
type DashboardT = ReturnType<typeof useDashboardT>;

interface TransactionItemFullProps {
  transaction: Transaction;
  t: DashboardT;
  onRequestEdit: (txn: Transaction) => void;
  onRequestDelete: (txn: Transaction) => void;
  onSave: (txn: Transaction) => void;
}

const TransactionItemFull = memo(function TransactionItemFull({
  transaction: txn,
  t,
  onRequestEdit,
  onRequestDelete,
  onSave,
}: TransactionItemFullProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: txn.id,
    data: { kind: "transaction", transaction: txn, fromDate: txn.date },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-center gap-2 px-2 py-2 rounded-lg",
          "transition-colors duration-100 hover:bg-slate-50",
        )}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-slate-200 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none shrink-0 p-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Icon */}
        <span className="text-base shrink-0 leading-none">
          {txn.category?.icon ?? (txn.type === "expense" ? "💸" : "💰")}
        </span>

        {/* Title + note */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 truncate leading-tight">
            {txn.title}
          </p>
          {txn.note && (
            <p className="text-xs text-slate-400 italic truncate">{txn.note}</p>
          )}
        </div>

        {/* Amount */}
        <span
          className={cn(
            "text-sm font-semibold shrink-0 tabular-nums",
            txn.type === "expense" ? "text-red-500" : "text-green-600",
          )}>
          {txn.type === "expense" ? "-" : "+"}
          {formatVND(txn.amount)}
        </span>

        {/* Inline action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onRequestEdit(txn)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-500 transition-colors"
            title={t.btnTitleEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSave(txn)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-amber-500 transition-colors"
            title={t.btnTitleSave}>
            <BookmarkPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRequestDelete(txn)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title={t.btnTitleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
});
