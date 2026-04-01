"use client";

import { useMemo, useState, useEffect } from "react";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/hooks/useLocale";
import { useMonthlyReport, useMonthlyBudgets, useUpsertBudget } from "@/hooks/useData";
import { formatCompact, parseCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useDashboardT } from "@/hooks/useDashboardT";
import type { Transaction } from "@/types";
import { toast } from "sonner";
import {
  TrendingDown,
  TrendingUp,
  Flame,
  CalendarDays,
  Sigma,
  ChevronRight,
  ChevronDown,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CATEGORY_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

export function ReportView() {
  const locale = useLocale();
  const t = useDashboardT();
  const viewMonth = useAppStore((s) => s.viewMonth);
  const transactionsByDate = useAppStore((s) => s.transactionsByDate);
  const { data: reportData = [] } = useMonthlyReport(viewMonth);
  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(null);
  const [editBudgetKey, setEditBudgetKey] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const upsertBudget = useUpsertBudget();

  // Fetch budgets for the viewed month; populate store
  useMonthlyBudgets(viewMonth);
  const storeBudgets = useAppStore((s) => s.budgets);

  const budgetByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of storeBudgets[viewMonth] ?? []) {
      if (b.amount > 0) map[b.category_id] = b.amount;
    }
    return map;
  }, [storeBudgets, viewMonth]);

  // Reset budget edit state when navigating months
  useEffect(() => {
    setEditBudgetKey(null);
    setBudgetInput("");
  }, [viewMonth]);

  function saveBudget(categoryId: string, input: string) {
    const trimmed = input.trim();
    if (trimmed && !/^\d+(\.\d+)?(k|m)?$/i.test(trimmed)) {
      toast.error(t.amountInvalidFormat);
      return;
    }
    const amount = trimmed ? parseCompact(trimmed) : 0;
    upsertBudget.mutate(
      { category_id: categoryId, month: viewMonth, amount },
      { onSuccess: () => { setEditBudgetKey(null); setBudgetInput(""); } },
    );
  }

  const [year, month] = viewMonth.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const days = eachDayOfInterval({
    start: startOfMonth(firstOfMonth),
    end: endOfMonth(firstOfMonth),
  });

  // ── Daily bar chart data ─────────────────────────────────
  const dailyData = useMemo(() => {
    const dayMap: Record<string, { expense: number; income: number }> = {};
    for (const row of reportData) {
      if (!dayMap[row.date]) dayMap[row.date] = { expense: 0, income: 0 };
      if (row.type === "expense") dayMap[row.date].expense += Number(row.total);
      else dayMap[row.date].income += Number(row.total);
    }
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      return {
        day: format(day, "d"),
        date: dateStr,
        ...(dayMap[dateStr] ?? { expense: 0, income: 0 }),
      };
    });
  }, [reportData, days]);

  // ── Category pie data ────────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<
      string,
      {
        id: string | null;
        name: string;
        icon: string;
        value: number;
        color: string;
      }
    > = {};
    for (const row of reportData) {
      if (row.type !== "expense") continue;
      const key = row.category_id ?? "__none__";
      if (!map[key]) {
        map[key] = {
          id: row.category_id,
          name: row.category_name ?? t.categoryOther,
          icon: row.category_icon ?? "📦",
          value: 0,
          color: row.category_color ?? "#64748b",
        };
      }
      map[key].value += Number(row.total);
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [reportData, t]);

  // ── Transactions grouped by category key ─────────────────
  const catTxMap = useMemo(() => {
    const all: Transaction[] = Object.values(transactionsByDate)
      .flat()
      .filter(
        (txn) => txn.type === "expense" && txn.date.startsWith(viewMonth),
      );
    const map: Record<string, Transaction[]> = {};
    for (const txn of all) {
      const key = txn.category_id ?? "__none__";
      if (!map[key]) map[key] = [];
      map[key].push(txn);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => b.date.localeCompare(a.date) || a.position - b.position,
      );
    }
    return map;
  }, [transactionsByDate, viewMonth]);

  // ── Summary stats ────────────────────────────────────────
  const stats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let maxDay = { date: "", expense: 0 };
    let activeDayCount = 0;

    dailyData.forEach(({ date, expense, income }) => {
      totalExpense += expense;
      totalIncome += income;
      if (expense > 0) {
        activeDayCount++;
        if (expense > maxDay.expense) maxDay = { date, expense };
      }
    });

    const avgDaily = activeDayCount > 0 ? totalExpense / activeDayCount : 0;
    return { totalExpense, totalIncome, avgDaily, maxDay, activeDayCount };
  }, [dailyData]);

  const hasData = stats.totalExpense > 0 || stats.totalIncome > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
        <h3 className="font-semibold text-slate-700 text-sm">
          {t.reportTitle(month, year)}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {format(firstOfMonth, "MMMM yyyy", { locale })}
        </p>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
            <CalendarDays className="w-8 h-8 opacity-40" />
            <p className="text-xs">{t.noReportData}</p>
          </div>
        ) : (
          <>
            {/* ── Quick stat cards ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label={t.statAvgDaily}
                value={`${formatCompact(stats.avgDaily)}`}
                sub={t.statDaysActive(stats.activeDayCount)}
                icon={<Sigma className="w-3.5 h-3.5 text-indigo-400" />}
                color="indigo"
              />
              <StatCard
                label={t.statTopDay}
                value={
                  stats.maxDay.date ? formatCompact(stats.maxDay.expense) : "—"
                }
                sub={
                  stats.maxDay.date
                    ? format(parseISO(stats.maxDay.date), "d/MM (EEE)", {
                        locale,
                      })
                    : ""
                }
                icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}
                color="orange"
              />
              <StatCard
                label={t.statTotalExpense}
                value={`-${formatCompact(stats.totalExpense)}`}
                icon={<TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                color="red"
              />
              <StatCard
                label={t.statTotalIncome}
                value={`+${formatCompact(stats.totalIncome)}`}
                icon={<TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                color="green"
              />
            </div>

            {/* ── Daily expense bar chart ───────────────────── */}
            <section>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {t.chartByDay}
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={dailyData}
                  barSize={6}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCompact(v)}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatCompact(Number(value))]}
                    labelFormatter={(label) => t.chartDayLabel(label)}
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  />
                  {stats.totalIncome > 0 && (
                    <Bar
                      dataKey="income"
                      fill="#86efac"
                      radius={[3, 3, 0, 0]}
                      name={t.chartBarIncome}
                    />
                  )}
                  <Bar
                    dataKey="expense"
                    fill="#f87171"
                    radius={[3, 3, 0, 0]}
                    name={t.chartBarExpense}
                  />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* ── Category pie chart ────────────────────────── */}
            {categoryData.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {t.chartByCat}
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}>
                      {categoryData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.color ||
                            CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [formatCompact(Number(value))]}
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category breakdown list */}
                <div className="space-y-1.5 mt-2">
                  {categoryData.map((cat, i) => {
                    const pct =
                      stats.totalExpense > 0
                        ? Math.round((cat.value / stats.totalExpense) * 100)
                        : 0;
                    const catKey = cat.id ?? "__none__";
                    const isOpen = selectedCatKey === catKey;
                    const txns = catTxMap[catKey] ?? [];
                    const budget = cat.id ? budgetByCategory[cat.id] : undefined;
                    const budgetPct = budget
                      ? Math.round((cat.value / budget) * 100)
                      : 0;
                    const isEditingBudget = editBudgetKey === catKey;
                    const isOver = budget && budgetPct >= 100;
                    const isWarning = budget && budgetPct >= 80 && budgetPct < 100;
                    return (
                      <div
                        key={cat.name}
                        className={cn(
                          "rounded-xl border transition-colors",
                          isOver
                            ? "border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-900/10"
                            : isWarning
                              ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-900/10"
                              : budget
                                ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-900/10"
                                : isOpen
                                  ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70"
                                  : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700",
                        )}>
                        {/* Main row */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          {/* Expand toggle — left portion */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCatKey(isOpen ? null : catKey)
                            }
                            className="flex items-center gap-2 flex-1 min-w-0 text-left">
                            <span className="text-base leading-none shrink-0">
                              {cat.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                                  {cat.name}
                                </span>
                                {budget ? (
                                  <span
                                    className={cn(
                                      "text-xs font-bold ml-2 shrink-0",
                                      isOver
                                        ? "text-red-500 dark:text-red-400"
                                        : isWarning
                                          ? "text-amber-500 dark:text-amber-400"
                                          : "text-emerald-600 dark:text-emerald-400",
                                    )}>
                                    {isOver ? t.budgetOver : `${budgetPct}%`}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2 shrink-0">
                                    {pct}%
                                  </span>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "rounded-full overflow-hidden",
                                  budget ? "h-2 bg-slate-200 dark:bg-slate-700" : "h-1.5 bg-slate-100 dark:bg-slate-700",
                                )}>
                                {budget ? (
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(100, budgetPct)}%`,
                                      backgroundColor: isOver
                                        ? "#ef4444"
                                        : isWarning
                                          ? "#f59e0b"
                                          : "#22c55e",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor:
                                        cat.color ||
                                        CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                                    }}
                                  />
                                )}
                              </div>
                              {budget && (
                                <p
                                  className={cn(
                                    "text-[10px] mt-0.5 font-medium",
                                    isOver
                                      ? "text-red-400 dark:text-red-400"
                                      : isWarning
                                        ? "text-amber-500 dark:text-amber-400"
                                        : "text-emerald-600 dark:text-emerald-400",
                                  )}>
                                  {t.budgetOf(
                                    formatCompact(cat.value),
                                    formatCompact(budget),
                                  )}
                                </p>
                              )}
                            </div>
                          </button>

                          {/* Amount */}
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 w-12 text-right">
                            {formatCompact(cat.value)}
                          </span>

                          {/* Budget button — always visible for real categories */}
                          {cat.id && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditingBudget) {
                                  setEditBudgetKey(null);
                                  setBudgetInput("");
                                } else {
                                  setEditBudgetKey(catKey);
                                  setBudgetInput(
                                    budget ? formatCompact(budget) : "",
                                  );
                                }
                              }}
                              title={t.setBudgetBtn}
                              className={cn(
                                "flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all shrink-0 border",
                                isEditingBudget
                                  ? "bg-indigo-500 border-indigo-500 text-white"
                                  : budget
                                    ? isOver
                                      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400"
                                      : isWarning
                                        ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                                        : "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-300 hover:text-indigo-500",
                              )}>
                              <Target className="w-3 h-3" />
                              <span>{budget ? formatCompact(budget) : t.setBudgetBtn}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCatKey(isOpen ? null : catKey)
                            }
                            className="shrink-0 ml-0.5">
                            {isOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>

                        {/* Inline budget editor */}
                        {isEditingBudget && cat.id && (
                          <div className="mx-3 mb-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2.5">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex-1">
                                {t.setBudgetBtn} · {cat.icon} {cat.name}
                              </span>
                              {budget && (
                                <button
                                  type="button"
                                  onClick={() => saveBudget(cat.id!, "0")}
                                  className="text-[10px] text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30">
                                  {t.removeBudget}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={budgetInput}
                                onChange={(e) => setBudgetInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    saveBudget(cat.id!, budgetInput);
                                  if (e.key === "Escape") {
                                    setEditBudgetKey(null);
                                    setBudgetInput("");
                                  }
                                }}
                                placeholder={t.budgetPlaceholder}
                                className="flex-1 h-8 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => saveBudget(cat.id!, budgetInput)}
                                disabled={upsertBudget.isPending}
                                className="h-8 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors disabled:opacity-60">
                                {upsertBudget.isPending ? t.saving : t.saveBtn}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                              {t.budgetHint}
                            </p>
                          </div>
                        )}

                        {/* Drill-down: individual transactions */}
                        {isOpen && (
                          <div className="mx-3 mb-3 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                {t.catTxTitle} ({txns.length})
                              </span>
                            </div>
                            {txns.length === 0 ? (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-3">
                                {t.catTxEmpty}
                              </p>
                            ) : (
                              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {txns.map((txn) => (
                                  <div
                                    key={txn.id}
                                    className="flex items-center gap-2 px-2.5 py-1.5">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 w-8">
                                      {format(parseISO(txn.date), "d/MM")}
                                    </span>
                                    <span className="flex-1 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                      {txn.title}
                                    </span>
                                    <span className="text-[11px] font-semibold text-red-500 dark:text-red-400 shrink-0">
                                      -{formatCompact(txn.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: "indigo" | "orange" | "red" | "green";
}) {
  const bg = {
    indigo: "bg-indigo-50 border-indigo-100",
    orange: "bg-orange-50 border-orange-100",
    red: "bg-red-50 border-red-100",
    green: "bg-green-50 border-green-100",
  }[color];

  return (
    <div className={cn("rounded-xl border p-3", bg)}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-700 leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
