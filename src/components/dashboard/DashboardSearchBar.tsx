"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardT } from "@/hooks/useDashboardT";
import { useAppStore } from "@/store/useAppStore";
import { formatVND } from "@/lib/currency";
import {
  Search,
  X,
  TrendingDown,
  TrendingUp,
  Loader2,
  CalendarDays,
  SlidersHorizontal,
  BarChart2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface SearchFilters {
  type: "" | "expense" | "income";
  date_from: string;
  date_to: string;
}

/**
 * Returns the text with matched substrings wrapped in a <mark> element.
 * Uses diacritic-insensitive comparison to mirror the backend unaccent search.
 */
function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d");
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const normQuery = removeAccents(query);
  if (!normQuery) return text;

  // Build a normalized version character-by-character, tracking original indices
  const chars = [...text];
  const normMap: number[] = []; // normMap[normIdx] = original char index
  let normText = "";
  chars.forEach((ch, origIdx) => {
    const n = removeAccents(ch);
    for (let i = 0; i < n.length; i++) {
      normMap.push(origIdx);
      normText += n[i];
    }
  });

  // Collect all match ranges in the normalized string
  const ranges: [number, number][] = [];
  let from = 0;
  while (from <= normText.length - normQuery.length) {
    const idx = normText.indexOf(normQuery, from);
    if (idx === -1) break;
    ranges.push([idx, idx + normQuery.length]);
    from = idx + 1;
  }
  if (ranges.length === 0) return text;

  // Map normalized ranges back to original text indices
  const origRanges: [number, number][] = ranges.map(([ns, ne]) => [
    normMap[ns],
    normMap[ne - 1] + 1,
  ]);

  // Build React nodes
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  for (const [start, end] of origRanges) {
    if (start > lastIdx) nodes.push(text.slice(lastIdx, start));
    nodes.push(
      <mark
        key={start}
        className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded-sm px-0">
        {text.slice(start, end)}
      </mark>,
    );
    lastIdx = end;
  }
  if (lastIdx < text.length) nodes.push(text.slice(lastIdx));
  return <>{nodes}</>;
}

export function DashboardSearchBar() {
  const t = useDashboardT();
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const setViewMonth = useAppStore((s) => s.setViewMonth);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: "",
    date_from: "",
    date_to: "",
  });

  // Results — never cleared until dialog closes, so UI stays stable while refreshing
  const [results, setResults] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // first load (no results yet)
  const [isRefreshing, setIsRefreshing] = useState(false); // re-fetch with existing results
  const [isLoadingMore, setIsLoadingMore] = useState(false); // appending next pages
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showStats, setShowStats] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Stable refs so the IntersectionObserver callback reads fresh values
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const hasSearchedRef = useRef(false);

  const hasActiveFilter = filters.type || filters.date_from || filters.date_to;

  // Computed stats from visible results
  const stats = {
    totalExpense: results
      .filter((r) => r.type === "expense")
      .reduce((s, r) => s + r.amount, 0),
    totalIncome: results
      .filter((r) => r.type === "income")
      .reduce((s, r) => s + r.amount, 0),
    count: results.length,
  };

  // Live search with debounce
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query && !hasActiveFilter) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, open]);

  const PAGE_SIZE = 20;

  async function runSearch(pageNum = 1) {
    const isFirstPage = pageNum === 1;
    if (isFirstPage) {
      if (results.length === 0) setIsLoading(true);
      else setIsRefreshing(true);
    } else {
      setIsLoadingMore(true);
      isLoadingMoreRef.current = true;
    }
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "transaction",
          query,
          filters: {
            type: filters.type || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
          },
          page: pageNum,
          pageSize: PAGE_SIZE,
        }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const newRows: Transaction[] = json.data ?? [];
      const newTotal: number = json.total ?? 0;
      if (isFirstPage) {
        setResults(newRows);
        setSelectedTxn(null);
      } else {
        setResults((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...newRows.filter((r) => !seen.has(r.id))];
        });
      }
      setTotal(newTotal);
      setPage(pageNum);
      pageRef.current = pageNum;
      const loadedCount = isFirstPage
        ? newRows.length
        : results.length + newRows.length;
      hasMoreRef.current = newTotal > loadedCount;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
      setHasSearched(true);
      hasSearchedRef.current = true;
    }
  }

  // IntersectionObserver — load next page when sentinel scrolls into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isLoadingMoreRef.current &&
          hasSearchedRef.current
        ) {
          runSearch(pageRef.current + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearched]);

  function handleGoToDay(txn: Transaction) {
    setSelectedDate(txn.date);
    setViewMonth(txn.date.slice(0, 7));
    handleClose();
  }

  function handleClose() {
    setOpen(false);
    setQuery("");
    setFilters({ type: "", date_from: "", date_to: "" });
    setResults([]);
    setTotal(0);
    setPage(1);
    pageRef.current = 1;
    hasMoreRef.current = false;
    setHasSearched(false);
    hasSearchedRef.current = false;
    setIsLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;
    setShowFilters(false);
    setSelectedTxn(null);
    setShowStats(false);
  }

  return (
    <>
      {/* Trigger button — moderate width, centred in header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-150 group"
        aria-label={t.searchBtn}>
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left text-sm truncate">{t.searchBtn}</span>
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-slate-700 group-hover:bg-slate-600 font-mono text-slate-500 shrink-0">
          ⌘K
        </kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
          else setOpen(true);
        }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl w-full p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="sr-only">
            <DialogTitle>{t.searchTitle}</DialogTitle>
          </DialogHeader>

          {/* ── Search input row ── */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            {isLoading || isRefreshing ? (
              <Loader2 className="w-5 h-5 text-indigo-500 shrink-0 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholderTxn}
              className="flex-1 bg-transparent outline-none text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {/* Stats toggle */}
            <button
              onClick={() => setShowStats((v) => !v)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                showStats
                  ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
              title={t.statsTitle}>
              <BarChart2 className="w-4 h-4" />
            </button>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "relative p-1.5 rounded-lg transition-colors",
                showFilters || hasActiveFilter
                  ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
              title={t.filterBtn}>
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilter && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
            {(query || hasActiveFilter) && (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── Filter row ── */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                {(["", "expense", "income"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilters((f) => ({ ...f, type: v }))}
                    className={cn(
                      "px-3 py-1.5 transition-colors font-medium",
                      filters.type === v
                        ? "bg-indigo-500 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700",
                    )}>
                    {v === ""
                      ? t.typeAll
                      : v === "expense"
                        ? t.typeExpense
                        : t.typeIncome}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date_from: e.target.value }))
                }
                className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                title={t.dateFrom}
              />
              <span className="text-slate-400 self-center text-xs">→</span>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date_to: e.target.value }))
                }
                className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                title={t.dateTo}
              />
              {hasActiveFilter && (
                <button
                  onClick={() =>
                    setFilters({ type: "", date_from: "", date_to: "" })
                  }
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                  {t.clearFilter}
                </button>
              )}
            </div>
          )}

          {/* ── Results area — min-height keeps dialog stable ── */}
          <div
            className={cn(
              "min-h-80 max-h-[30rem] overflow-y-auto transition-opacity duration-150",
              isRefreshing && "opacity-60 pointer-events-none",
            )}>
            {/* Initial hint */}
            {!hasSearched && !isLoading && (
              <div className="flex flex-col items-center justify-center h-80 text-slate-400 dark:text-slate-500 gap-2">
                <Search className="w-8 h-8 opacity-30" />
                <span className="text-sm">{t.searchHint}</span>
              </div>
            )}

            {/* First-load spinner (no results yet) */}
            {isLoading && !hasSearched && (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            )}

            {/* Empty state */}
            {hasSearched && !isLoading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center h-80 text-slate-400 dark:text-slate-500 gap-2">
                <span className="text-2xl">🔍</span>
                <span className="text-sm">{t.noResults}</span>
              </div>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <ul className="py-1 divide-y divide-slate-50 dark:divide-slate-800/60">
                {results.map((txn) => {
                  const isSelected = selectedTxn?.id === txn.id;
                  return (
                    <li key={txn.id}>
                      {/* Row — click to expand inline detail */}
                      <button
                        onClick={() => setSelectedTxn(isSelected ? null : txn)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800",
                        )}>
                        <span
                          className={cn(
                            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            txn.type === "expense"
                              ? "bg-red-50 dark:bg-red-900/30 text-red-500"
                              : "bg-green-50 dark:bg-green-900/30 text-green-500",
                          )}>
                          {txn.type === "expense" ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                            {highlightMatch(txn.title, query)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <CalendarDays className="w-3 h-3" />
                            {format(new Date(txn.date), "dd/MM/yyyy")}
                            {txn.category && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                {txn.category.icon}{" "}
                                {highlightMatch(txn.category.name, query)}
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold shrink-0",
                            txn.type === "expense"
                              ? "text-red-500"
                              : "text-green-500",
                          )}>
                          {txn.type === "expense" ? "-" : "+"}
                          {formatVND(txn.amount)}
                        </span>
                        {isSelected ? (
                          <ChevronUp className="w-3 h-3 text-indigo-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                      </button>

                      {/* Inline detail panel */}
                      {isSelected && (
                        <div className="px-4 pb-4 pt-2 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-900/40">
                          <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 space-y-2.5 text-sm">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-wide">
                                  {t.txnTitleLabel}
                                </p>
                                <p className="font-medium text-slate-800 dark:text-slate-100 break-words">
                                  {highlightMatch(txn.title, query)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-wide">
                                  {t.txnAmountLabel}
                                </p>
                                <p
                                  className={cn(
                                    "font-semibold",
                                    txn.type === "expense"
                                      ? "text-red-500"
                                      : "text-green-500",
                                  )}>
                                  {txn.type === "expense" ? "-" : "+"}
                                  {formatVND(txn.amount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-wide">
                                  {t.txnDateLabel}
                                </p>
                                <p className="text-slate-700 dark:text-slate-300">
                                  {format(new Date(txn.date), "dd/MM/yyyy")}
                                </p>
                              </div>
                              {txn.category && (
                                <div>
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-wide">
                                    {t.categoryLabel}
                                  </p>
                                  <p className="text-slate-700 dark:text-slate-300">
                                    {txn.category.icon}{" "}
                                    {highlightMatch(txn.category.name, query)}
                                  </p>
                                </div>
                              )}
                            </div>
                            {txn.note && (
                              <div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-wide">
                                  {t.txnNoteLabel}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-xs">
                                  {highlightMatch(txn.note ?? "", query)}
                                </p>
                              </div>
                            )}
                            <div className="pt-0.5">
                              <button
                                onClick={() => handleGoToDay(txn)}
                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg transition-colors">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {t.viewThisDay}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Sentinel — triggers IntersectionObserver to load next page */}
            <div ref={sentinelRef} className="py-1">
              {isLoadingMore && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                </div>
              )}
              {hasSearched && !isLoadingMore && total > results.length && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">
                  {t.showingOf(results.length, total)}
                </p>
              )}
            </div>
          </div>

          {/* ── Stats panel ── */}
          {showStats && hasSearched && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                {t.statsTitle}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 text-center border border-slate-200 dark:border-slate-700">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {stats.count}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t.statsCount(stats.count).replace(/^\d+ /, "")}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 text-center border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-red-500">
                    -{formatVND(stats.totalExpense)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t.statTotalExpense}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 text-center border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-green-500">
                    +{formatVND(stats.totalIncome)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t.statTotalIncome}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
