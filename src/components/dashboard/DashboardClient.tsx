"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useAppStore } from "@/store/useAppStore";
import {
  useProfile,
  useCategories,
  useCards,
  useCreateTransaction,
} from "@/hooks/useData";
import { CardPanel } from "./CardPanel";
import { SelectedDayView } from "./SelectedDayView";
import { MonthlyView } from "./MonthlyView";
import { ReportView } from "./ReportView";
import { DashboardHeader } from "./DashboardHeader";
import { CardDragOverlay } from "./CardDragOverlay";
import { cn } from "@/lib/utils";
import { LayoutGrid, CalendarDays, Calendar, BarChart2 } from "lucide-react";
import type { DragItem } from "@/types";
import { useDashboardT } from "@/hooks/useDashboardT";

type MobileTab = "cards" | "day" | "month" | "report";

export function DashboardClient() {
  useProfile();
  useCategories();
  useCards();

  const setIsDragging = useAppStore((s) => s.setIsDragging);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const removeTransaction = useAppStore((s) => s.removeTransaction);
  const addHiddenCard = useAppStore((s) => s.addHiddenCard);

  const createTransaction = useCreateTransaction();

  const t = useDashboardT();
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("day");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItem;
    setActiveDragItem(data);
    setIsDragging(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    setActiveDragItem(null);

    const { over, active } = event;
    if (!over) return;

    const dragItem = active.data.current as DragItem;
    const overId = over.id as string;

    // Accept both the droppable zone (day-YYYY-MM-DD) and drops onto existing transaction rows
    let targetDate: string | null = null;
    if (overId.startsWith("day-")) {
      targetDate = overId.replace("day-", "");
    } else if (over.data.current?.kind === "transaction") {
      targetDate =
        over.data.current.fromDate ??
        over.data.current.transaction?.date ??
        null;
    }
    if (!targetDate) return;

    if (dragItem.kind === "card") {
      const card = dragItem.card;
      const defaultVariant =
        card.variants?.find((v) => v.is_default) ?? card.variants?.[0];
      const amount = defaultVariant?.amount ?? 0;
      const existingCount = (
        useAppStore.getState().transactionsByDate[targetDate] ?? []
      ).length;

      // ── Optimistic: add temp transaction instantly ──────────
      const tempId = `__opt__${Date.now()}`;
      const tempTxn = {
        id: tempId,
        user_id: "",
        source_card_id: card.id,
        date: targetDate,
        title: card.title,
        amount,
        category_id: card.category_id,
        type: card.type,
        note: card.note ?? null,
        position: existingCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: card.category ?? null,
      };
      addTransaction(tempTxn);

      createTransaction.mutate(
        {
          source_card_id: card.id,
          date: targetDate,
          title: card.title,
          amount,
          category_id: card.category_id,
          type: card.type,
          note: card.note ?? undefined,
          position: existingCount,
        },
        {
          onSuccess: (real) => {
            removeTransaction(tempId, targetDate);
            addTransaction(real);
            addHiddenCard(targetDate, card.id);
          },
          onError: () => {
            removeTransaction(tempId, targetDate);
          },
        },
      );
    }
    // Transaction-to-transaction reorder is handled inside DayColumn via SortableContext
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-slate-50">
        <DashboardHeader />

        {/* ── Main content area ───────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Card Panel — lg+: w-52, mobile tab */}
          <aside
            className={cn(
              "border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0",
              "lg:w-86 lg:flex lg:flex-col",
              mobileTab === "cards" ? "flex flex-col flex-1" : "hidden",
            )}>
            <CardPanel />
          </aside>

          {/* Column 2: Selected Day — lg+: w-72, mobile tab */}
          <main
            className={cn(
              "border-r border-slate-200 bg-white flex flex-col overflow-hidden flex-shrink-0",
              "lg:w-72 lg:flex",
              mobileTab === "day" ? "flex flex-1" : "hidden",
            )}>
            <SelectedDayView />
          </main>

          {/* Column 3: Monthly — lg+: flex-1 on lg, w-64 on xl; mobile tab */}
          <aside
            className={cn(
              "border-r border-slate-200 bg-white overflow-y-auto",
              "lg:flex lg:flex-col lg:flex-1 xl:flex-none xl:w-64 xl:flex-shrink-0",
              mobileTab === "month" ? "flex flex-col flex-1" : "hidden",
            )}>
            <MonthlyView />
          </aside>

          {/* Column 4: Report — xl+: flex-1; mobile tab */}
          <aside
            className={cn(
              "bg-white overflow-y-auto",
              "xl:flex xl:flex-col xl:flex-1",
              mobileTab === "report" ? "flex flex-col flex-1" : "hidden",
            )}>
            <ReportView />
          </aside>
        </div>

        {/* ── Mobile bottom tab bar (hidden on lg+) ──────────── */}
        <nav className="lg:hidden flex-shrink-0 border-t border-slate-200 bg-white flex items-center justify-around h-14 z-50">
          {(
            [
              {
                tab: "cards",
                icon: <LayoutGrid className="w-5 h-5" />,
                label: t.tabCards,
              },
              {
                tab: "day",
                icon: <CalendarDays className="w-5 h-5" />,
                label: t.tabDay,
              },
              {
                tab: "month",
                icon: <Calendar className="w-5 h-5" />,
                label: t.tabMonth,
              },
              {
                tab: "report",
                icon: <BarChart2 className="w-5 h-5" />,
                label: t.tabReport,
              },
            ] as { tab: MobileTab; icon: React.ReactNode; label: string }[]
          ).map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
                mobileTab === tab
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600",
              )}>
              {icon}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragItem && <CardDragOverlay item={activeDragItem} />}
      </DragOverlay>
    </DndContext>
  );
}
