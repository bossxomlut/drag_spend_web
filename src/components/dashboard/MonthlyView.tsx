"use client";

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
import { vi } from "date-fns/locale";
import { useAppStore } from "@/store/useAppStore";
import { useMonthlyTransactions } from "@/hooks/useData";
import { formatCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export function MonthlyView() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const viewMonth = useAppStore((s) => s.viewMonth);
  const setViewMonth = useAppStore((s) => s.setViewMonth);
  const transactionsByDate = useAppStore((s) => s.transactionsByDate);

  const yearMonth = viewMonth;
  useMonthlyTransactions(yearMonth);

  const [year, month] = viewMonth.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);

  // Calendar grid: Mon–Sun
  const calStart = startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Monthly aggregates
  let monthIncome = 0;
  let monthExpense = 0;
  const activeDays: Record<string, { income: number; expense: number }> = {};

  Object.entries(transactionsByDate).forEach(([date, txns]) => {
    if (!date.startsWith(viewMonth)) return;
    txns.forEach((t) => {
      if (t.type === "income") monthIncome += t.amount;
      else monthExpense += t.amount;
    });
    activeDays[date] = {
      income: txns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
      expense: txns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    };
  });

  const monthNet = monthIncome - monthExpense;

  return (
    <div className="flex flex-col h-full">
      {/* Month navigation */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
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
          <h3 className="font-semibold text-slate-700 text-sm capitalize">
            {format(firstOfMonth, "MMMM yyyy", { locale: vi })}
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
                  setSelectedDate(dateStr);
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
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "hover:bg-slate-100 text-slate-600",
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
          Tổng tháng {month}/{year}
        </h4>

        {/* Stat cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-700 font-medium">
                Thu nhập
              </span>
            </div>
            <span className="text-sm font-bold text-green-600">
              +{formatCompact(monthIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-700 font-medium">Chi tiêu</span>
            </div>
            <span className="text-sm font-bold text-red-500">
              -{formatCompact(monthExpense)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-600 font-medium">Còn lại</span>
            <span
              className={cn(
                "text-sm font-bold",
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
        </div>

        {/* Top spending days */}
        {Object.keys(activeDays).length > 0 && (
          <>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-4">
              Ngày có chi tiêu
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
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all",
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-slate-100 hover:border-slate-300 text-slate-600",
                      )}>
                      <span
                        className={cn(
                          "font-medium",
                          isSelected && "text-white",
                        )}>
                        {format(parseISO(date), "d/MM (EEE)", { locale: vi })}
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
