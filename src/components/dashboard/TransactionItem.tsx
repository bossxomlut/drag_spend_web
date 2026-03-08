'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { formatCompact } from '@/lib/currency'
import { useDeleteTransaction, useSaveTransactionAsCard } from '@/hooks/useData'
import { MoreHorizontal, Pencil, Trash2, BookmarkPlus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditTransactionDialog } from './EditTransactionDialog'
import type { Transaction } from '@/types'

interface Props {
  transaction: Transaction
}

export function TransactionItem({ transaction: txn }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const deleteTransaction = useDeleteTransaction()
  const saveAsCard = useSaveTransactionAsCard()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: txn.id,
    data: { kind: 'transaction', transaction: txn, fromDate: txn.date },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'group flex items-center gap-1.5 p-1.5 rounded-lg cursor-grab active:cursor-grabbing',
          'border transition-all duration-100',
          txn.type === 'expense'
            ? 'bg-red-50/80 border-red-100 hover:border-red-200 hover:bg-red-50'
            : 'bg-green-50/80 border-green-100 hover:border-green-200 hover:bg-green-50'
        )}
      >
        <span className="text-sm shrink-0">
          {txn.category?.icon ?? (txn.type === 'expense' ? '💸' : '💰')}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-700 truncate leading-tight">
            {txn.title}
          </p>
          <p
            className={cn(
              'text-[11px] font-bold',
              txn.type === 'expense' ? 'text-red-500' : 'text-green-600'
            )}
          >
            {txn.type === 'expense' ? '-' : '+'}{formatCompact(txn.amount)}
          </p>
        </div>

        {/* Actions - only visible on hover, stop drag propagation */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded hover:bg-slate-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => setEditOpen(true)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => e.stopPropagation()}
              onSelect={() => saveAsCard.mutate(txn)}
            >
              <BookmarkPlus className="w-3.5 h-3.5 mr-2" />
              Lưu thành thẻ mới
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onPointerDown={(e) => e.stopPropagation()}
              onSelect={() => deleteTransaction.mutate({ id: txn.id, date: txn.date })}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditTransactionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={txn}
      />
    </>
  )
}
