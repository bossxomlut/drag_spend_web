"use client";

import { useMemo } from "react";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";
import { useAppStore } from "@/store/useAppStore";
import { useMonthlyReport } from "@/hooks/useData";
import { formatCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  Flame,
  CalendarDays,
  Sigma,
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
  const viewMonth = useAppStore((s) => s.viewMonth);
  const { data: reportData = [] } = useMonthlyReport(viewMonth);

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
      { name: string; icon: string; value: number; color: string }
    > = {};
    for (const row of reportData) {
      if (row.type !== "expense") continue;
      const key = row.category_id ?? "__none__";
      if (!map[key]) {
        map[key] = {
          name: row.category_name ?? "Khác",
          icon: row.category_icon ?? "📦",
          value: 0,
          color: row.category_color ?? "#64748b",
        };
      }
      map[key].value += Number(row.total);
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [reportData]);

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
          Báo cáo {month}/{year}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {format(firstOfMonth, "MMMM yyyy", { locale: vi })}
        </p>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
            <CalendarDays className="w-8 h-8 opacity-40" />
            <p className="text-xs">Chưa có dữ liệu tháng này</p>
          </div>
        ) : (
          <>
            {/* ── Quick stat cards ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Chi tiêu TB/ngày"
                value={`${formatCompact(stats.avgDaily)}`}
                sub={`${stats.activeDayCount} ngày có chi tiêu`}
                icon={<Sigma className="w-3.5 h-3.5 text-indigo-400" />}
                color="indigo"
              />
              <StatCard
                label="Ngày nhiều nhất"
                value={
                  stats.maxDay.date ? formatCompact(stats.maxDay.expense) : "—"
                }
                sub={
                  stats.maxDay.date
                    ? format(parseISO(stats.maxDay.date), "d/MM (EEE)", {
                        locale: vi,
                      })
                    : ""
                }
                icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}
                color="orange"
              />
              <StatCard
                label="Tổng chi tiêu"
                value={`-${formatCompact(stats.totalExpense)}`}
                icon={<TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                color="red"
              />
              <StatCard
                label="Tổng thu nhập"
                value={`+${formatCompact(stats.totalIncome)}`}
                icon={<TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                color="green"
              />
            </div>

            {/* ── Daily expense bar chart ───────────────────── */}
            <section>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Chi tiêu theo ngày
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
                    labelFormatter={(label) => `Ngày ${label}`}
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
                      name="Thu nhập"
                    />
                  )}
                  <Bar
                    dataKey="expense"
                    fill="#f87171"
                    radius={[3, 3, 0, 0]}
                    name="Chi tiêu"
                  />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* ── Category pie chart ────────────────────────── */}
            {categoryData.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Chi tiêu theo danh mục
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
                    return (
                      <div key={cat.name} className="flex items-center gap-2">
                        <span className="text-sm leading-none">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-slate-600 truncate">
                              {cat.name}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 ml-2 shrink-0">
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  cat.color ||
                                  CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 shrink-0 w-12 text-right">
                          {formatCompact(cat.value)}
                        </span>
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
