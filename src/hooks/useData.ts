"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type {
  Category,
  SpendingCard,
  Transaction,
  CreateCardPayload,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "@/types";
import { toast } from "sonner";

const supabase = createClient();

// ─── Categories ─────────────────────────────────────────────

export function useCategories() {
  const setCategories = useAppStore((s) => s.setCategories);

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("type")
        .order("name");
      if (error) throw error;
      setCategories(data as Category[]);
      return data as Category[];
    },
  });
}

// ─── Spending Cards ──────────────────────────────────────────

export function useCards() {
  const setCards = useAppStore((s) => s.setCards);

  return useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spending_cards")
        .select(
          `
          *,
          category:categories(*),
          variants:card_variants(*)
        `,
        )
        .order("use_count", { ascending: false })
        .order("position");
      if (error) throw error;
      const cards = data as SpendingCard[];
      setCards(cards);
      return cards;
    },
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  const addCard = useAppStore((s) => s.addCard);

  return useMutation({
    mutationFn: async (payload: CreateCardPayload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create card
      const { data: card, error } = await supabase
        .from("spending_cards")
        .insert({
          user_id: user.id,
          title: payload.title,
          category_id: payload.category_id,
          type: payload.type,
          note: payload.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Create variants
      if (payload.variants.length > 0) {
        const { error: ve } = await supabase.from("card_variants").insert(
          payload.variants.map((v, i) => ({
            card_id: card.id,
            label: v.label,
            amount: v.amount,
            is_default: v.is_default,
            position: i,
          })),
        );
        if (ve) throw ve;
      }

      // 3. Fetch full card with relations
      const { data: full, error: fe } = await supabase
        .from("spending_cards")
        .select("*, category:categories(*), variants:card_variants(*)")
        .eq("id", card.id)
        .single();
      if (fe) throw fe;

      return full as SpendingCard;
    },
    onSuccess: (card) => {
      addCard(card);
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success(`Đã tạo thẻ "${card.title}"`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  const updateCard = useAppStore((s) => s.updateCard);

  return useMutation({
    mutationFn: async (
      payload: { id: string } & Partial<CreateCardPayload>,
    ) => {
      const { id, variants, ...rest } = payload;

      const { error } = await supabase
        .from("spending_cards")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      if (variants !== undefined) {
        // Replace all variants
        await supabase.from("card_variants").delete().eq("card_id", id);
        if (variants.length > 0) {
          await supabase.from("card_variants").insert(
            variants.map((v, i) => ({
              card_id: id,
              label: v.label,
              amount: v.amount,
              is_default: v.is_default,
              position: i,
            })),
          );
        }
      }

      const { data: full, error: fe } = await supabase
        .from("spending_cards")
        .select("*, category:categories(*), variants:card_variants(*)")
        .eq("id", id)
        .single();
      if (fe) throw fe;
      return full as SpendingCard;
    },
    onSuccess: (card) => {
      updateCard(card);
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Đã cập nhật thẻ");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  const removeCard = useAppStore((s) => s.removeCard);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("spending_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      removeCard(id);
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Đã xóa thẻ");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Update the default variant selection (called when user picks a variant)
export function useSetDefaultVariant() {
  const qc = useQueryClient();
  const updateCard = useAppStore((s) => s.updateCard);

  return useMutation({
    mutationFn: async ({
      cardId,
      variantId,
    }: {
      cardId: string;
      variantId: string;
    }) => {
      // Unset all defaults for card, then set new default
      await supabase
        .from("card_variants")
        .update({ is_default: false })
        .eq("card_id", cardId);
      await supabase
        .from("card_variants")
        .update({ is_default: true })
        .eq("id", variantId);

      const { data: full, error } = await supabase
        .from("spending_cards")
        .select("*, category:categories(*), variants:card_variants(*)")
        .eq("id", cardId)
        .single();
      if (error) throw error;
      return full as SpendingCard;
    },
    onSuccess: (card) => {
      updateCard(card);
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Transactions ────────────────────────────────────────────

export function useTransactions(date: string) {
  const setTransactionsForDate = useAppStore((s) => s.setTransactionsForDate);

  return useQuery({
    queryKey: ["transactions", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .eq("date", date)
        .order("position");
      if (error) throw error;
      const txns = data as Transaction[];
      setTransactionsForDate(date, txns);
      return txns;
    },
    enabled: !!date,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateCard = useAppStore((s) => s.updateCard);

  return useMutation({
    mutationFn: async (
      payload: CreateTransactionPayload & { position?: number },
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          source_card_id: payload.source_card_id,
          date: payload.date,
          title: payload.title,
          amount: payload.amount,
          category_id: payload.category_id,
          type: payload.type,
          note: payload.note ?? null,
          position: payload.position ?? 0,
        })
        .select("*, category:categories(*)")
        .single();
      if (error) throw error;

      // Increment use_count on source card
      if (payload.source_card_id) {
        await supabase
          .rpc("increment_card_use_count", { card_id: payload.source_card_id })
          .throwOnError();
        // Refresh card in store
        const { data: card } = await supabase
          .from("spending_cards")
          .select("*, category:categories(*), variants:card_variants(*)")
          .eq("id", payload.source_card_id)
          .single();
        if (card) updateCard(card as SpendingCard);
      }

      return data as Transaction;
    },
    onSuccess: (txn) => {
      // NOTE: store update is handled optimistically in DashboardClient
      // Just invalidate so re-fetch confirms real data
      qc.invalidateQueries({ queryKey: ["transactions", txn.date] });
      qc.invalidateQueries({
        queryKey: ["transactions-month", txn.date.slice(0, 7)],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const updateTransaction = useAppStore((s) => s.updateTransaction);

  return useMutation({
    mutationFn: async (
      payload: UpdateTransactionPayload & { date: string },
    ) => {
      const { id, date, ...rest } = payload;
      const { data, error } = await supabase
        .from("transactions")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, category:categories(*)")
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    onSuccess: (txn) => {
      updateTransaction(txn);
      qc.invalidateQueries({ queryKey: ["transactions", txn.date] });
      toast.success("Đã cập nhật");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const removeTransaction = useAppStore((s) => s.removeTransaction);

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { id, date };
    },
    onSuccess: ({ id, date }) => {
      removeTransaction(id, date);
      qc.invalidateQueries({ queryKey: ["transactions", date] });
      toast.success("Đã xóa");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Fetch all transactions for a given month (YYYY-MM)
export function useMonthlyTransactions(yearMonth: string) {
  const setTransactionsForDate = useAppStore((s) => s.setTransactionsForDate);

  return useQuery({
    queryKey: ["transactions-month", yearMonth],
    queryFn: async () => {
      const [year, month] = yearMonth.split("-");
      const from = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .gte("date", from)
        .lte("date", to)
        .order("position");
      if (error) throw error;

      // Populate store by date
      const grouped: Record<string, Transaction[]> = {};
      for (const txn of data as Transaction[]) {
        if (!grouped[txn.date]) grouped[txn.date] = [];
        grouped[txn.date].push(txn);
      }
      Object.entries(grouped).forEach(([date, txns]) =>
        setTransactionsForDate(date, txns),
      );

      return data as Transaction[];
    },
    enabled: !!yearMonth,
  });
}

// Save a transaction as a new template card
export function useSaveTransactionAsCard() {
  const qc = useQueryClient();
  const addCard = useAppStore((s) => s.addCard);

  return useMutation({
    mutationFn: async (txn: Transaction) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: card, error } = await supabase
        .from("spending_cards")
        .insert({
          user_id: user.id,
          title: txn.title,
          category_id: txn.category_id,
          type: txn.type,
          note: txn.note,
        })
        .select()
        .single();
      if (error) throw error;

      // Create single variant with transaction's amount
      await supabase.from("card_variants").insert({
        card_id: card.id,
        label: null,
        amount: txn.amount,
        is_default: true,
        position: 0,
      });

      const { data: full, error: fe } = await supabase
        .from("spending_cards")
        .select("*, category:categories(*), variants:card_variants(*)")
        .eq("id", card.id)
        .single();
      if (fe) throw fe;
      return full as SpendingCard;
    },
    onSuccess: (card) => {
      addCard(card);
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success(`Đã lưu "${card.title}" thành thẻ mới`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Copy all transactions from previous day into targetDate
export function useCopyFromYesterday() {
  const qc = useQueryClient();
  const setTransactionsForDate = useAppStore((s) => s.setTransactionsForDate);

  return useMutation({
    mutationFn: async (targetDate: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const prevDate = format(subDays(parseISO(targetDate), 1), "yyyy-MM-dd");

      const { data: prevTxns, error: fetchErr } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .eq("date", prevDate)
        .order("position");
      if (fetchErr) throw fetchErr;
      if (!prevTxns || prevTxns.length === 0) {
        throw new Error("Hôm qua không có giao dịch nào");
      }

      const toInsert = prevTxns.map((t, i) => ({
        user_id: user.id,
        source_card_id: t.source_card_id ?? null,
        date: targetDate,
        title: t.title,
        amount: t.amount,
        category_id: t.category_id ?? null,
        type: t.type,
        note: t.note ?? null,
        position: i,
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from("transactions")
        .insert(toInsert)
        .select("*, category:categories(*)");
      if (insertErr) throw insertErr;

      return { targetDate, transactions: inserted as Transaction[] };
    },
    onSuccess: ({ targetDate, transactions }) => {
      setTransactionsForDate(targetDate, transactions);
      qc.invalidateQueries({ queryKey: ["transactions", targetDate] });
      qc.invalidateQueries({
        queryKey: ["transactions-month", targetDate.slice(0, 7)],
      });
      toast.success(`Đã sao chép ${transactions.length} giao dịch từ hôm qua`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
