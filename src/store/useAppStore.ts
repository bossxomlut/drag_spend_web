import { create } from "zustand";
import { format } from "date-fns";
import type { SpendingCard, Transaction, Category } from "@/types";

interface AppState {
  // ── Selected date ──────────────────────────────────────────
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;

  // ── View month (shared between MonthlyView & ReportView) ───
  viewMonth: string; // YYYY-MM
  setViewMonth: (m: string) => void;

  // ── Categories ─────────────────────────────────────────────
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  addCategory: (cat: Category) => void;

  // ── Spending cards (templates) ─────────────────────────────
  cards: SpendingCard[];
  setCards: (cards: SpendingCard[]) => void;
  addCard: (card: SpendingCard) => void;
  updateCard: (card: SpendingCard) => void;
  removeCard: (id: string) => void;

  // ── Transactions (by date map) ─────────────────────────────
  transactionsByDate: Record<string, Transaction[]>; // key: YYYY-MM-DD
  setTransactionsForDate: (date: string, txns: Transaction[]) => void;
  addTransaction: (txn: Transaction) => void;
  updateTransaction: (txn: Transaction) => void;
  removeTransaction: (id: string, date: string) => void;
  reorderTransactions: (date: string, transactions: Transaction[]) => void;
  // ── Hidden cards per date (visual hint after drag/quick-add) ────
  hiddenCardsByDate: Record<string, string[]>; // date → cardIds
  addHiddenCard: (date: string, cardId: string) => void;
  // ── UI state ───────────────────────────────────────────────
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ── Selected date ──────────────────────────────────────────
  selectedDate: format(new Date(), "yyyy-MM-dd"),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // ── View month ─────────────────────────────────────────────
  viewMonth: format(new Date(), "yyyy-MM"),
  setViewMonth: (viewMonth) => set({ viewMonth }),

  // ── Categories ─────────────────────────────────────────────
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (cat) =>
    set((s) => ({
      categories: [...s.categories, cat].sort(
        (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
      ),
    })),

  // ── Spending cards ─────────────────────────────────────────
  cards: [],
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((s) => ({ cards: [card, ...s.cards] })),
  updateCard: (card) =>
    set((s) => ({ cards: s.cards.map((c) => (c.id === card.id ? card : c)) })),
  removeCard: (id) =>
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

  // ── Transactions ───────────────────────────────────────────
  transactionsByDate: {},
  setTransactionsForDate: (date, txns) =>
    set((s) => ({
      transactionsByDate: { ...s.transactionsByDate, [date]: txns },
    })),
  addTransaction: (txn) =>
    set((s) => {
      const existing = s.transactionsByDate[txn.date] ?? [];
      return {
        transactionsByDate: {
          ...s.transactionsByDate,
          [txn.date]: [...existing, txn],
        },
      };
    }),
  updateTransaction: (txn) =>
    set((s) => {
      const existing = s.transactionsByDate[txn.date] ?? [];
      return {
        transactionsByDate: {
          ...s.transactionsByDate,
          [txn.date]: existing.map((t) => (t.id === txn.id ? txn : t)),
        },
      };
    }),
  removeTransaction: (id, date) =>
    set((s) => {
      const existing = s.transactionsByDate[date] ?? [];
      return {
        transactionsByDate: {
          ...s.transactionsByDate,
          [date]: existing.filter((t) => t.id !== id),
        },
      };
    }),
  reorderTransactions: (date, transactions) =>
    set((s) => ({
      transactionsByDate: { ...s.transactionsByDate, [date]: transactions },
    })),

  // ── Hidden cards ───────────────────────────────────────────
  hiddenCardsByDate: {},
  addHiddenCard: (date, cardId) =>
    set((s) => ({
      hiddenCardsByDate: {
        ...s.hiddenCardsByDate,
        [date]: [...(s.hiddenCardsByDate[date] ?? []), cardId],
      },
    })),

  // ── UI ─────────────────────────────────────────────────────
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
}));
