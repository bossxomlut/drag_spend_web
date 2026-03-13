"use client";

import { memo, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardT } from "@/hooks/useDashboardT";
import type { Transaction, Category, TransactionType } from "@/types";

export type DraftEdit = {
  title?: string;
  amount?: string;
  type?: TransactionType;
  category_id?: string | null;
};

interface Props {
  transactions: Transaction[];
  categories: Category[];
  drafts: Record<string, DraftEdit>;
  onEdit: (
    id: string,
    field: keyof DraftEdit,
    value: string | TransactionType | null,
  ) => void;
  onDelete: (args: { id: string; date: string }) => void;
  onValidationChange?: (hasErrors: boolean) => void;
}

type FieldErrors = { amount?: string; title?: string };

function isValidAmountInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // Allow: 0, 25k, 1.5m, 35000, 0k, 0m — reject letters/garbage
  return /^\d+(\.\d+)?(k|m)?$/i.test(trimmed);
}

export const TransactionTableView = memo(function TransactionTableView({
  transactions,
  categories,
  drafts,
  onEdit,
  onDelete,
  onValidationChange,
}: Props) {
  const t = useDashboardT();
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrors>>(
    {},
  );

  const reportErrors = useCallback(
    (next: Record<string, FieldErrors>) => {
      const hasErrors = Object.values(next).some((e) => e.amount || e.title);
      onValidationChange?.(hasErrors);
    },
    [onValidationChange],
  );

  const validateAmount = useCallback(
    (id: string, raw: string) => {
      const error = isValidAmountInput(raw) ? undefined : t.amountInvalidFormat;
      setFieldErrors((prev) => {
        const next = { ...prev, [id]: { ...prev[id], amount: error } };
        if (!next[id].amount && !next[id].title) delete next[id];
        reportErrors(next);
        return next;
      });
    },
    [t.amountInvalidFormat, reportErrors],
  );

  const validateTitle = useCallback(
    (id: string, raw: string) => {
      const error = raw.trim() ? undefined : t.titleRequired;
      setFieldErrors((prev) => {
        const next = { ...prev, [id]: { ...prev[id], title: error } };
        if (!next[id].amount && !next[id].title) delete next[id];
        reportErrors(next);
        return next;
      });
    },
    [t.titleRequired, reportErrors],
  );

  if (transactions.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[540px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">
              {t.txnTitleLabel}
            </th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[18%]">
              {t.txnAmountLabel}
            </th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[20%]">
              {t.expense} / {t.income}
            </th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[20%]">
              {t.categoryLabel}
            </th>
            <th className="py-2 px-3 w-[7%]" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const draft = drafts[txn.id] ?? {};
            const effectiveType = draft.type ?? txn.type;
            const filteredCats = categories.filter(
              (c) => c.type === effectiveType,
            );
            const isDirtyRow = !!drafts[txn.id];
            const errors = fieldErrors[txn.id] ?? {};

            return (
              <tr
                key={txn.id}
                className={cn(
                  "border-b border-border transition-colors",
                  isDirtyRow
                    ? "bg-amber-50 dark:bg-amber-950/20"
                    : "hover:bg-muted/40",
                )}>
                {/* Title */}
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={draft.title ?? txn.title}
                    onChange={(e) => {
                      onEdit(txn.id, "title", e.target.value);
                      validateTitle(txn.id, e.target.value);
                    }}
                    onBlur={(e) => validateTitle(txn.id, e.target.value)}
                    className={cn(
                      "w-full bg-transparent border rounded px-1.5 py-1 text-sm text-foreground focus:outline-none focus:bg-background transition-colors",
                      errors.title
                        ? "border-red-400 dark:border-red-500 focus:border-red-500"
                        : "border-transparent focus:border-indigo-400 dark:focus:border-indigo-500",
                    )}
                  />
                  {errors.title && (
                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5 px-1.5">
                      {errors.title}
                    </p>
                  )}
                </td>

                {/* Amount */}
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={
                      draft.amount !== undefined
                        ? draft.amount
                        : String(txn.amount)
                    }
                    onChange={(e) => {
                      onEdit(txn.id, "amount", e.target.value);
                      validateAmount(txn.id, e.target.value);
                    }}
                    onBlur={(e) => validateAmount(txn.id, e.target.value)}
                    placeholder={t.txnAmountPlaceholder}
                    className={cn(
                      "w-full bg-transparent border rounded px-1.5 py-1 text-sm font-semibold tabular-nums focus:outline-none focus:bg-background transition-colors",
                      errors.amount
                        ? "border-red-400 dark:border-red-500 focus:border-red-500"
                        : "border-transparent focus:border-indigo-400 dark:focus:border-indigo-500",
                      effectiveType === "expense"
                        ? "text-red-500 dark:text-red-400"
                        : "text-green-600 dark:text-green-500",
                    )}
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5 px-1.5">
                      {errors.amount}
                    </p>
                  )}
                </td>

                {/* Type toggle */}
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(txn.id, "type", "expense")}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                        effectiveType === "expense"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                          : "text-muted-foreground hover:bg-muted",
                      )}>
                      {t.expense}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(txn.id, "type", "income")}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                        effectiveType === "income"
                          ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-500"
                          : "text-muted-foreground hover:bg-muted",
                      )}>
                      {t.income}
                    </button>
                  </div>
                </td>

                {/* Category */}
                <td className="py-1.5 px-3">
                  <select
                    value={
                      draft.category_id !== undefined
                        ? (draft.category_id ?? "")
                        : (txn.category_id ?? "")
                    }
                    onChange={(e) =>
                      onEdit(
                        txn.id,
                        "category_id",
                        e.target.value === "" ? null : e.target.value,
                      )
                    }
                    className="w-full bg-background border border-border rounded px-1.5 py-1 text-sm text-foreground focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors">
                    <option value="">—</option>
                    {filteredCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Delete */}
                <td className="py-1.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onDelete({ id: txn.id, date: txn.date })}
                    title={t.btnTitleDelete}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors mx-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
