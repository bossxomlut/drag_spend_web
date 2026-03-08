import type { DragItem } from '@/types'
import { formatCompact } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface Props {
  item: DragItem
}

export function CardDragOverlay({ item }: Props) {
  if (item.kind === 'card') {
    const { card } = item
    const defaultVariant = card.variants?.find((v) => v.is_default) ?? card.variants?.[0]
    const amount = defaultVariant?.amount ?? 0

    return (
      <div
        className={cn(
          'w-60 rounded-xl border-2 shadow-2xl p-3 cursor-grabbing rotate-2 opacity-95',
          card.type === 'expense'
            ? 'bg-red-50 border-red-300'
            : 'bg-green-50 border-green-300'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{card.category?.icon ?? '📦'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 text-sm truncate">{card.title}</p>
            <p
              className={cn(
                'text-xs font-semibold',
                card.type === 'expense' ? 'text-red-600' : 'text-green-600'
              )}
            >
              {card.type === 'expense' ? '-' : '+'}{formatCompact(amount)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Transaction drag overlay
  const { transaction } = item
  return (
    <div
      className={cn(
        'w-60 rounded-xl border-2 shadow-2xl p-3 cursor-grabbing rotate-2 opacity-95',
        transaction.type === 'expense'
          ? 'bg-red-50 border-red-300'
          : 'bg-green-50 border-green-300'
      )}
    >
      <p className="font-medium text-slate-800 text-sm truncate">{transaction.title}</p>
      <p
        className={cn(
          'text-xs font-semibold',
          transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
        )}
      >
        {transaction.type === 'expense' ? '-' : '+'}{formatCompact(transaction.amount)}
      </p>
    </div>
  )
}
