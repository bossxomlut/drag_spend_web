'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { useCategories, useCards, useCreateTransaction } from '@/hooks/useData'
import { CardPanel } from './CardPanel'
import { SelectedDayView } from './SelectedDayView'
import { MonthlyView } from './MonthlyView'
import { DashboardHeader } from './DashboardHeader'
import { CardDragOverlay } from './CardDragOverlay'
import type { DragItem, Transaction } from '@/types'

export function DashboardClient() {
  const qc = useQueryClient()
  useCategories()
  useCards()

  // Ensure profile row exists (handles users created before schema was applied)
  useEffect(() => {
    async function ensureProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert profile
      await supabase
        .from('profiles')
        .upsert(
          { id: user.id, name: user.user_metadata?.name ?? null },
          { onConflict: 'id', ignoreDuplicates: true }
        )

      // Seed default categories if none exist yet
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })

      if ((count ?? 0) === 0) {
        await supabase.rpc('seed_default_categories', { p_user_id: user.id })
        qc.invalidateQueries({ queryKey: ['categories'] })
      }
    }
    ensureProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedDate = useAppStore((s) => s.selectedDate)
  const transactionsByDate = useAppStore((s) => s.transactionsByDate)
  const setIsDragging = useAppStore((s) => s.setIsDragging)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const removeTransaction = useAppStore((s) => s.removeTransaction)

  const createTransaction = useCreateTransaction()

  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItem
    setActiveDragItem(data)
    setIsDragging(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false)
    setActiveDragItem(null)

    const { over, active } = event
    if (!over) return

    const dragItem = active.data.current as DragItem
    const overId = over.id as string

    // Accept both the droppable zone (day-YYYY-MM-DD) and drops onto existing transaction rows
    let targetDate: string | null = null
    if (overId.startsWith('day-')) {
      targetDate = overId.replace('day-', '')
    } else if (over.data.current?.kind === 'transaction') {
      targetDate = over.data.current.fromDate ?? over.data.current.transaction?.date ?? null
    }
    if (!targetDate) return

    if (dragItem.kind === 'card') {
      const card = dragItem.card
      const defaultVariant = card.variants?.find((v) => v.is_default) ?? card.variants?.[0]
      const amount = defaultVariant?.amount ?? 0
      const existingCount = (transactionsByDate[targetDate] ?? []).length

      // ── Optimistic: add temp transaction instantly ──────────
      const tempId = `__opt__${Date.now()}`
      const tempTxn = {
        id: tempId,
        user_id: '',
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
      }
      addTransaction(tempTxn)

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
            removeTransaction(tempId, targetDate)
            addTransaction(real)
          },
          onError: () => {
            removeTransaction(tempId, targetDate)
          },
        }
      )
    }
    // Transaction-to-transaction reorder is handled inside DayColumn via SortableContext
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-slate-50">
        <DashboardHeader />
        <div className="flex flex-1 overflow-hidden">

          {/* Column 1: Card Panel */}
          <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
            <CardPanel />
          </aside>

          {/* Column 2: Selected Day (main drag zone) */}
          <main className="w-80 flex-shrink-0 overflow-hidden border-r border-slate-200 bg-white flex flex-col">
            <SelectedDayView />
          </main>

          {/* Column 3: Monthly overview */}
          <aside className="flex-1 bg-white overflow-y-auto">
            <MonthlyView />
          </aside>

        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragItem && <CardDragOverlay item={activeDragItem} />}
      </DragOverlay>
    </DndContext>
  )
}
