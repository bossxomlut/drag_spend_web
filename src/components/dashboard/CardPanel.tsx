"use client";

import { useState } from "react";
import { format, parseISO, isToday } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CalendarDays, Search } from "lucide-react";
import { SpendingCardItem } from "./SpendingCardItem";
import { CreateCardDialog } from "./CreateCardDialog";
import { useDashboardT } from "@/hooks/useDashboardT";

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

      <CreateCardDialog key={openCreate ? "open" : "closed"} open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  );
}
