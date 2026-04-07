"use client";

import { useTransition, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/hooks/useLocale";
import { useMonthlyTransactions } from "@/hooks/useData";
import { useDashboardT } from "@/hooks/useDashboardT";
import { formatCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export function MonthlyView() {
  const locale = useLocale();
  const t = useDashboardT();
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const viewMonth = useAppStore((s) => s.viewMonth);
  const setViewMonth = useAppStore((s) => s.setViewMonth);
  const transactionsByDate = useAppStore((s) => s.transactionsByDate);
  const [, startTransition] = useTransition();

  const yearMonth = viewMonth;
  useMonthlyTransactions(yearMonth);

  const [year, month] = viewMonth.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);

  // Calendar grid: Mon–Sun
  const calStart = startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const { monthIncome, monthExpense, activeDays } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const daysMap: Record<string, { income: number; expense: number }> = {};

    Object.entries(transactionsByDate).forEach(([date, txns]) => {
      if (!date.startsWith(viewMonth)) return;
      let dayIncome = 0;
      let dayExpense = 0;
      for (const t of txns) {
        if (t.type === "income") {
          dayIncome += t.amount;
          income += t.amount;
        } else {
          dayExpense += t.amount;
          expense += t.amount;
        }
      }
      daysMap[date] = { income: dayIncome, expense: dayExpense };
    });

    return { monthIncome: income, monthExpense: expense, activeDays: daysMap };
  }, [transactionsByDate, viewMonth]);

  const monthNet = monthIncome - monthExpense;

  return (
    <div className="flex flex-col h-full">
      {/* Month navigation */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              setViewMonth(format(subMonths(firstOfMonth, 1), "yyyy-MM"))
            }>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm capitalize">
            {format(firstOfMonth, "MMMM yyyy", { locale })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              setViewMonth(format(addMonths(firstOfMonth, 1), "yyyy-MM"))
            }>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, firstOfMonth);
            const isSelected = dateStr === selectedDate;
            const todayFlag = isToday(day);
            const dayData = activeDays[dateStr];
            const hasData =
              !!dayData && (dayData.income > 0 || dayData.expense > 0);

            return (
              <button
                key={dateStr}
                onClick={() => {
                  startTransition(() => setSelectedDate(dateStr));
                  // Sync view month if navigating to another month
                  const newMonth = format(day, "yyyy-MM");
                  if (newMonth !== viewMonth) setViewMonth(newMonth);
                }}
                className={cn(
                  "relative flex flex-col items-center py-1.5 rounded-lg transition-all text-xs",
                  !inMonth && "opacity-30",
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : todayFlag
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300",
                )}>
                <span
                  className={cn(
                    "font-medium leading-none",
                    isSelected && "text-white",
                  )}>
                  {format(day, "d")}
                </span>

                {/* Activity dots */}
                {hasData && inMonth && (
                  <div className="flex gap-0.5 mt-1">
                    {dayData.expense > 0 && (
                      <span
                        className={cn(
                          "w-1 h-1 rounded-full",
                          isSelected ? "bg-red-300" : "bg-red-400",
                        )}
                      />
                    )}
                    {dayData.income > 0 && (
                      <span
                        className={cn(
                          "w-1 h-1 rounded-full",
                          isSelected ? "bg-green-300" : "bg-green-500",
                        )}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly summary */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {t.monthSummaryTitle(month, year)}
        </h4>

        {/* Stat cards — 2-col grid prevents overflow at any column width */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-green-500 shrink-0" />
              <span className="text-[10px] text-green-700 dark:text-green-400 font-medium truncate">
                {t.monthIncome}
              </span>
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
              +{formatCompact(monthIncome)}
            </span>
          </div>

          <div className="flex flex-col p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-[10px] text-red-700 dark:text-red-400 font-medium truncate">
                {t.monthExpense}
              </span>
            </div>
            <span className="text-sm font-bold text-red-500 dark:text-red-400 tabular-nums">
              -{formatCompact(monthExpense)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {t.monthRemaining}
          </span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              monthNet > 0
                ? "text-green-600"
                : monthNet < 0
                  ? "text-red-500"
                  : "text-slate-500",
            )}>
            {monthNet > 0 ? "+" : ""}
            {formatCompact(monthNet)}
          </span>
        </div>

        {/* Top spending days */}
        {Object.keys(activeDays).length > 0 && (
          <>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-4">
              {t.monthActiveDays}
            </h4>
            <div className="space-y-1.5">
              {Object.entries(activeDays)
                .filter(([, d]) => d.expense > 0)
                .sort(([, a], [, b]) => b.expense - a.expense)
                .slice(0, 8)
                .map(([date, d]) => {
                  const isSelected = date === selectedDate;
                  return (
                    <button
                      key={date}
                      onClick={() =>
                        startTransition(() => setSelectedDate(date))
                      }
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all",
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300",
                      )}>
                      <span
                        className={cn(
                          "font-medium",
                          isSelected && "text-white",
                        )}>
                        {format(parseISO(date), "d/MM (EEE)", { locale })}
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          isSelected ? "text-red-300" : "text-red-500",
                        )}>
                        -{formatCompact(d.expense)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
