"use client";

import { useState, useTransition } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  format,
  isToday,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { DayColumn } from "./DayColumn";
import { cn } from "@/lib/utils";

export function WeekCalendar() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const [, startTransition] = useTransition();

  const [weekStart, setWeekStart] = useState(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }), // start on Monday
  );

  const days = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  });

  function prevWeek() {
    setWeekStart((d) => subWeeks(d, 1));
  }
  function nextWeek() {
    setWeekStart((d) => addWeeks(d, 1));
  }
  function goToday() {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    startTransition(() => setSelectedDate(format(today, "yyyy-MM-dd")));
  }

  const monthLabel = format(weekStart, "MMMM yyyy", { locale: vi });

  return (
    <div className="flex flex-col gap-3 min-w-[700px]">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-slate-700 capitalize text-sm min-w-36 text-center">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={goToday}>
          <CalendarDays className="w-3.5 h-3.5" />
          Hôm nay
        </Button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = dateStr === selectedDate;
          const todayFlag = isToday(day);

          return (
            <div key={dateStr} className="flex flex-col gap-1">
              {/* Day header */}
              <button
                onClick={() => startTransition(() => setSelectedDate(dateStr))}
                className={cn(
                  "flex flex-col items-center py-1.5 rounded-lg transition-all",
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : todayFlag
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-slate-100 text-slate-600",
                )}>
                <span className="text-[10px] font-medium uppercase tracking-wide">
                  {format(day, "EEE", { locale: vi })}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold leading-tight",
                    todayFlag && !isSelected && "text-indigo-600",
                  )}>
                  {format(day, "d")}
                </span>
              </button>

              {/* Day column drop zone */}
              <DayColumn date={dateStr} isSelected={isSelected} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
