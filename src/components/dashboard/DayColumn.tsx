"use client";

import { memo, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAppStore } from "@/store/useAppStore";
import { useTransactions } from "@/hooks/useData";
import { formatCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { TransactionItem } from "./TransactionItem";
import type { Transaction } from "@/types";

const EMPTY: Transaction[] = [];

interface Props {
  date: string;
  isSelected: boolean;
}

export const DayColumn = memo(function DayColumn({ date, isSelected }: Props) {
  // Granular selector: only re-renders when THIS date's transactions change
  const transactions = useAppStore((s) => s.transactionsByDate[date]) ?? EMPTY;
  const { isLoading } = useTransactions(date);

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date}`,
  });

  const { totalExpense, totalIncome, net } = useMemo(() => {
    const exp = transactions
      .filter((txn) => txn.type === "expense")
      .reduce((s, txn) => s + txn.amount, 0);
    const inc = transactions
      .filter((txn) => txn.type === "income")
      .reduce((s, txn) => s + txn.amount, 0);
    return { totalExpense: exp, totalIncome: inc, net: inc - exp };
  }, [transactions]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] rounded-xl border-2 transition-all duration-150 flex flex-col",
        isOver
          ? "border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100"
          : isSelected
            ? "border-indigo-200 bg-white"
            : "border-transparent bg-white/60 hover:bg-white hover:border-slate-200",
      )}>
      <div className="flex-1 p-1.5 space-y-1">
        {isLoading && (
          <div className="flex items-center justify-center h-16">
            <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div
            className={cn(
              "h-16 flex items-center justify-center rounded-lg border border-dashed text-xs",
              isOver
                ? "border-indigo-400 text-indigo-500"
                : "border-slate-200 text-slate-300",
            )}>
            {isOver ? "Thả vào đây" : ""}
          </div>
        )}

        <SortableContext
          items={transactions.map((t) => t.id)}
          strategy={verticalListSortingStrategy}>
          {transactions.map((txn) => (
            <TransactionItem key={txn.id} transaction={txn} />
          ))}
        </SortableContext>
      </div>

      {/* Daily total */}
      {transactions.length > 0 && (
        <div className="px-2 pb-1.5 pt-1 border-t border-slate-100">
          <p
            className={cn(
              "text-[11px] font-semibold text-center",
              net < 0
                ? "text-red-500"
                : net > 0
                  ? "text-green-500"
                  : "text-slate-400",
            )}>
            {net < 0 ? "-" : net > 0 ? "+" : ""}
            {formatCompact(Math.abs(net))}
          </p>
        </div>
      )}
    </div>
  );
});
