"use client";

import { useState } from "react";
import { format, parseISO, isToday } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CalendarDays, Search, RefreshCw } from "lucide-react";
import { SpendingCardItem } from "./SpendingCardItem";
import { CreateCardDialog } from "./CreateCardDialog";
import { useDashboardT } from "@/hooks/useDashboardT";
import { usePendingRecurring, useApplyRecurring } from "@/hooks/useData";
import { toast } from "sonner";

const EMPTY_IDS: string[] = [];

export function CardPanel() {
  const locale = useLocale();
  const t = useDashboardT();
  const cards = useAppStore((s) => s.cards);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const hiddenIds = useAppStore(
    (s) => s.hiddenCardsByDate[selectedDate] ?? EMPTY_IDS,
  );
  const hiddenCardIds = new Set(hiddenIds);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const viewMonth = useAppStore((s) => s.viewMonth);
  const pendingRecurring = usePendingRecurring(viewMonth);
  const applyRecurring = useApplyRecurring();

  const parsedDate = parseISO(selectedDate);
  const todayFlag = isToday(parsedDate);
  const dateLabel = todayFlag
    ? t.today
    : format(parsedDate, "d/MM (EEE)", { locale });

  const expenseCards = cards.filter(
    (c) =>
      c.type === "expense" &&
      !hiddenCardIds.has(c.id) &&
      c.title.toLowerCase().includes(search.toLowerCase()),
  );
  const incomeCards = cards.filter(
    (c) =>
      c.type === "income" &&
      !hiddenCardIds.has(c.id) &&
      c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-0 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 dark:from-slate-800/80 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-extrabold text-base text-slate-800 dark:text-white tracking-tight">
            {t.panelTitle}
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full shadow"
            onClick={() => setOpenCreate(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Recurring banner */}
      {pendingRecurring.length > 0 && (
        <div className="mx-3 mt-2 mb-0 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 space-y-1.5">
          {/* Header row */}
          <div className="flex items-center justify-between pt-2 pb-0.5">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {t.recurringBanner(pendingRecurring.length)}
              </p>
            </div>
            <button
              type="button"
              disabled={applyRecurring.isPending}
              onClick={() =>
                applyRecurring.mutate(
                  { cards: pendingRecurring, yearMonth: viewMonth },
                  {
                    onSuccess: (txns) => {
                      toast.success(t.recurringApplied(txns.length));
                    },
                  },
                )
              }
              className="shrink-0 h-6 px-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-60">
              {applyRecurring.isPending ? "..." : t.recurringApplyAll}
            </button>
          </div>
          {/* Per-card rows */}
          <div className="pb-1.5 space-y-1">
            {(() => {
              const [ry, rm] = viewMonth.split("-").map(Number);
              const lastDay = new Date(ry, rm, 0).getDate();
              return pendingRecurring.map((c) => {
                const effDay = Math.min(c.recurring_day!, lastDay);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/60 dark:bg-slate-800/40 px-2 py-1">
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate flex-1">
                      {c.title}
                    </span>
                    <span className="text-[10px] text-indigo-400 shrink-0">
                      {t.recurringOnDay(effDay)}
                    </span>
                    <button
                      type="button"
                      disabled={applyRecurring.isPending}
                      onClick={() =>
                        applyRecurring.mutate(
                          { cards: [c], yearMonth: viewMonth },
                          {
                            onSuccess: (txns) => {
                              toast.success(t.recurringApplied(txns.length));
                            },
                          },
                        )
                      }
                      className="shrink-0 h-5 px-2 rounded-md bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800/50 dark:hover:bg-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold transition-colors disabled:opacity-60">
                      {t.recurringAddOne}
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Mobile hint: tap + to add to selected date */}
      <div className="lg:hidden mx-3 mb-2 mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
        <CalendarDays className="w-3 h-3 shrink-0" />
        <span>
          {t.mobileHintPrefix}{" "}
          <strong className="text-slate-600">{dateLabel}</strong>
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {expenseCards.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t.expense}
            </p>
            <div className="space-y-2">
              {expenseCards.map((card) => (
                <SpendingCardItem key={card.id} card={card} />
              ))}
            </div>
          </section>
        )}

        {incomeCards.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t.income}
            </p>
            <div className="space-y-2">
              {incomeCards.map((card) => (
                <SpendingCardItem key={card.id} card={card} />
              ))}
            </div>
          </section>
        )}

        {cards.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-3">{t.noCards}</p>
            <Button size="sm" onClick={() => setOpenCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t.createFirstCard}
            </Button>
          </div>
        )}

        {cards.length > 0 &&
          expenseCards.length === 0 &&
          incomeCards.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">
              {t.noCardsFound}
            </p>
          )}
      </div>

      {/* Footer add button */}
      {cards.length > 0 && (
        <div className="p-3 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => setOpenCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            {t.addNewCard}
          </Button>
        </div>
      )}

      <CreateCardDialog
        key={openCreate ? "open" : "closed"}
        open={openCreate}
        onOpenChange={setOpenCreate}
      />
    </div>
  );
}
