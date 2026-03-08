'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { SpendingCardItem } from './SpendingCardItem'
import { CreateCardDialog } from './CreateCardDialog'

export function CardPanel() {
  const cards = useAppStore((s) => s.cards)
  const [search, setSearch] = useState('')
  const [openCreate, setOpenCreate] = useState(false)

  const expenseCards = cards.filter(
    (c) => c.type === 'expense' && c.title.toLowerCase().includes(search.toLowerCase())
  )
  const incomeCards = cards.filter(
    (c) => c.type === 'income' && c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">Thẻ chi tiêu</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-50"
            onClick={() => setOpenCreate(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Tìm thẻ..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {expenseCards.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Chi tiêu
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
              Thu nhập
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
            <p className="text-slate-400 text-sm mb-3">Chưa có thẻ nào</p>
            <Button size="sm" onClick={() => setOpenCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tạo thẻ đầu tiên
            </Button>
          </div>
        )}

        {cards.length > 0 && expenseCards.length === 0 && incomeCards.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-4">Không tìm thấy thẻ</p>
        )}
      </div>

      {/* Footer add button */}
      {cards.length > 0 && (
        <div className="p-3 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => setOpenCreate(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm thẻ mới
          </Button>
        </div>
      )}

      <CreateCardDialog open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  )
}
