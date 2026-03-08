'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUpdateTransaction } from '@/hooks/useData'
import { parseCompact } from '@/lib/currency'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Transaction, TransactionType } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction: Transaction
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: Props) {
  const categories = useAppStore((s) => s.categories)
  const updateTransaction = useUpdateTransaction()

  const [title, setTitle] = useState(transaction.title)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [type, setType] = useState<TransactionType>(transaction.type)
  const [categoryId, setCategoryId] = useState<string | null>(transaction.category_id)
  const [note, setNote] = useState(transaction.note ?? '')

  useEffect(() => {
    if (open) {
      setTitle(transaction.title)
      setAmount(String(transaction.amount))
      setType(transaction.type)
      setCategoryId(transaction.category_id)
      setNote(transaction.note ?? '')
    }
  }, [open, transaction])

  const filteredCategories = categories.filter((c) => c.type === type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updateTransaction.mutateAsync({
      id: transaction.id,
      date: transaction.date,
      title: title.trim(),
      amount: parseCompact(amount),
      type,
      category_id: categoryId,
      note: note.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa giao dịch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(null) }}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                type === 'expense'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-red-300'
              )}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(null) }}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                type === 'income'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-green-300'
              )}
            >
              Thu nhập
            </button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Tên</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Số tiền</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 35k, 1.5tr"
              required
            />
            <p className="text-[11px] text-slate-400">25k = 25,000đ · 1.5tr = 1,500,000đ</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <div className="flex flex-wrap gap-1.5">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all',
                    categoryId === cat.id
                      ? 'text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  )}
                  style={
                    categoryId === cat.id
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : {}
                  }
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={updateTransaction.isPending}>
              {updateTransaction.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
