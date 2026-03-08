export type TransactionType = 'income' | 'expense'

// ─── DB Row Types ───────────────────────────────────────────

export interface Profile {
  id: string
  name: string | null
  currency: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: TransactionType
  created_at: string
}

export interface CardVariant {
  id: string
  card_id: string
  label: string | null
  amount: number
  is_default: boolean
  position: number
  created_at: string
}

export interface SpendingCard {
  id: string
  user_id: string
  title: string
  category_id: string | null
  type: TransactionType
  note: string | null
  position: number
  use_count: number
  created_at: string
  updated_at: string
  // joined
  category?: Category | null
  variants?: CardVariant[]
}

export interface Transaction {
  id: string
  user_id: string
  source_card_id: string | null
  date: string // YYYY-MM-DD
  title: string
  amount: number
  category_id: string | null
  type: TransactionType
  note: string | null
  position: number
  created_at: string
  updated_at: string
  // joined
  category?: Category | null
}

// ─── Form / Create Types ─────────────────────────────────────

export interface CreateCardPayload {
  title: string
  category_id: string | null
  type: TransactionType
  note?: string
  variants: { label: string | null; amount: number; is_default: boolean }[]
}

export interface UpdateCardPayload extends Partial<CreateCardPayload> {
  id: string
}

export interface CreateTransactionPayload {
  source_card_id: string | null
  date: string
  title: string
  amount: number
  category_id: string | null
  type: TransactionType
  note?: string
}

export interface UpdateTransactionPayload {
  id: string
  title?: string
  amount?: number
  category_id?: string | null
  type?: TransactionType
  note?: string
}

// ─── UI Types ────────────────────────────────────────────────

export interface DayTotal {
  date: string
  income: number
  expense: number
  net: number
}

export type DragItem =
  | { kind: 'card'; card: SpendingCard }
  | { kind: 'transaction'; transaction: Transaction; fromDate: string }
