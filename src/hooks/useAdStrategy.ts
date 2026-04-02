"use client";

import { useMemo } from "react";

export interface SmartBannerConfig {
  id: string;
  variant: "insight" | "tip" | "affiliate";
  icon: string;
  vi: string;
  en: string;
  ctaVi?: string;
  ctaEn?: string;
  ctaHref?: string;
}

export interface AdStrategyContext {
  totalExpense: number;
  totalIncome: number;
  /** Monthly avg daily expense */
  avgDaily?: number;
  /** Days that had at least one expense */
  activeDayCount?: number;
  /** Expense breakdown by category — for monthly report context */
  categoryData?: Array<{ id: string | null; name: string; value: number }>;
  /** Number of transactions — for daily context */
  transactionCount?: number;
}

// Thresholds
const FOOD_RATIO_THRESHOLD = 0.3; // 30% of monthly expense
const HIGH_AVG_DAILY_VND = 200_000;
const DAILY_TIP_MIN_TXN = 3; // show tip after 3+ transactions in a day
const FOOD_KEYWORDS = [
  "ăn",
  "food",
  "café",
  "cafe",
  "cà phê",
  "nhà hàng",
  "drink",
  "coffee",
  "trà",
  "bữa",
];

/**
 * Rule engine: evaluates spending context and returns the highest-priority
 * contextual banner config, or null if no strategy applies.
 *
 * Priority order:
 *   1. food_spike       — food/drink > 30% of monthly expense
 *   2. high_avg_daily   — avg daily VND >= 200k over 3+ active days
 *   3. daily_habit      — 3+ transactions logged in a single day
 *   4. monthly_tip      — fallback after 5+ active days in a month
 */
export function useAdStrategy(
  ctx: AdStrategyContext,
): SmartBannerConfig | null {
  const {
    totalExpense,
    totalIncome,
    avgDaily = 0,
    activeDayCount = 0,
    categoryData = [],
    transactionCount = 0,
  } = ctx;

  return useMemo(() => {
    // ── 1. Food / drink category spike ──────────────────────
    if (totalExpense > 0 && categoryData.length > 0) {
      const foodTotal = categoryData
        .filter((c) =>
          FOOD_KEYWORDS.some((kw) => c.name?.toLowerCase().includes(kw)),
        )
        .reduce((s, c) => s + c.value, 0);
      const ratio = foodTotal / totalExpense;

      if (ratio >= FOOD_RATIO_THRESHOLD && foodTotal > 50_000) {
        const pct = Math.round(ratio * 100);
        return {
          id: "food_spike",
          variant: "affiliate",
          icon: "🍜",
          vi: `Ăn uống chiếm ${pct}% chi tiêu tháng này — thử tìm deal giảm giá để tiết kiệm hơn nhé!`,
          en: `Food & drinks are ${pct}% of your spending this month — try hunting for deals!`,
          ctaVi: "Mẹo tiết kiệm ăn uống",
          ctaEn: "Food saving tips",
          ctaHref: "https://moneysmart.vn/",
        };
      }
    }

    // ── 2. High average daily spend ──────────────────────────
    if (avgDaily >= HIGH_AVG_DAILY_VND && activeDayCount >= 3) {
      return {
        id: "high_avg_daily",
        variant: "insight",
        icon: "💡",
        vi: `Chi tiêu trung bình ${activeDayCount} ngày khá cao. Đặt ngân sách danh mục để kiểm soát tốt hơn.`,
        en: `High average spending over ${activeDayCount} days. Set category budgets to stay on track.`,
        ctaVi: "Tìm hiểu quy tắc 50/30/20",
        ctaEn: "Learn the 50/30/20 rule",
        ctaHref: "https://moneysmart.vn/quy-tac-50-30-20/",
      };
    }

    // ── 3. Daily tracking habit positive reinforcement ───────
    if (transactionCount >= DAILY_TIP_MIN_TXN) {
      return {
        id: "daily_habit",
        variant: "tip",
        icon: "✅",
        vi: "Ghi lại chi tiêu mỗi ngày giúp bạn tiết kiệm trung bình 15–20% mỗi tháng.",
        en: "Tracking expenses daily helps save an average of 15–20% more each month.",
      };
    }

    // ── 4. Monthly overview fallback ─────────────────────────
    if ((totalExpense > 0 || totalIncome > 0) && activeDayCount >= 5) {
      return {
        id: "monthly_tip",
        variant: "tip",
        icon: "📊",
        vi: "Xem danh sách danh mục bên dưới để tìm khoản nào có thể cắt giảm tháng tới.",
        en: "Check the category breakdown below to find spending you can reduce next month.",
      };
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    totalExpense,
    totalIncome,
    avgDaily,
    activeDayCount,
    transactionCount,
    categoryData.length,
  ]);
}
