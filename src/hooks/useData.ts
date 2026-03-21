"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type {
  Category,
  SpendingCard,
  Transaction,
  TransactionType,
  CreateCardPayload,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  Profile,
} from "@/types";
import { toast } from "sonner";

const supabase = createClient();

// ─── Parallel Initial Data Fetch ─────────────────────────────

export function useInitialDashboardData() {
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setCategories = useAppStore((s) => s.setCategories);
  const setCards = useAppStore((s) => s.setCards);

  return useQuery({
    queryKey: ["initial-dashboard"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const [profileRes, categoriesRes, cardsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("categories").select("*").order("type").order("name"),
        supabase
          .from("spending_cards")
          .select(
            `*, category:categories(*), variants:card_variants(*)`,
          )
          .eq("user_id", user.id)
          .order("use_count", { ascending: false })
          .order("position"),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (cardsRes.error) throw cardsRes.error;

      const profile = profileRes.data;
      const storedLang = localStorage.getItem("ui_language");
      const effectiveLang =
        storedLang === "vi" || storedLang === "en"
          ? storedLang
          : profile.language;
      if (effectiveLang) {
        setLanguage(effectiveLang);
        localStorage.setItem("ui_language", effectiveLang);
        if (profile.language && effectiveLang !== profile.language) {
          supabase
            .from("profiles")
            .update({ language: effectiveLang })
            .eq("id", user.id)
            .then(() => {});
        }
      }

      setCategories(categoriesRes.data as Category[]);
      setCards(cardsRes.data as SpendingCard[]);

      return {
        profile: profile as Profile,
        categories: categoriesRes.data as Category[],
        cards: cardsRes.data as SpendingCard[],
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Profile ─────────────────────────────────────────────────

export function useProfile() {
  const setLanguage = useAppStore((s) => s.setLanguage);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      const profile = data as Profile;
      // Priority: localStorage (explicit user choice before login) > DB
      const storedLang = localStorage.getItem("ui_language");
      const effectiveLang =
        storedLang === "vi" || storedLang === "en"
          ? storedLang
          : profile.language;
      if (effectiveLang) {
        setLanguage(effectiveLang);
        localStorage.setItem("ui_language", effectiveLang);
        // Silently sync DB if the user had switched language on the login page
        if (profile.language && effectiveLang !== profile.language) {
          supabase
            .from("profiles")
            .update({ language: effectiveLang })
            .eq("id", user.id)
            .then(() => {});
        }
      }
      return profile;
    },
  });
}

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

export function useCreateCategory() {
  const qc = useQueryClient();
  const addCategory = useAppStore((s) => s.addCategory);

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      icon: string;
      color: string;
      type: TransactionType;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: payload.name,
          icon: payload.icon,
          color: payload.color,
          type: payload.type,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: (newCategory) => {
      addCategory(newCategory);
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã thêm danh mục");
    },
    onError: () => {
      toast.error("Không thể thêm danh mục");
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
    },
    // Optimistic update is handled in SpendingCardItem; no store/query update on success
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
    staleTime: 60_000, // avoid refetch when switching back to an already-loaded date
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
      // Just invalidate so re-fetch confirms real data.
      // report-month is derived from transactions-month — one invalidation covers both.
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
      qc.invalidateQueries({
        queryKey: ["transactions-month", txn.date.slice(0, 7)],
      });
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
      qc.invalidateQueries({
        queryKey: ["transactions-month", date.slice(0, 7)],
      });
      toast.success("Đã xóa");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Shared fetch for monthly transactions ──────────────────

async function fetchMonthlyTransactions(
  yearMonth: string,
): Promise<Transaction[]> {
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
  return data as Transaction[];
}

// Fetch all transactions for a given month (YYYY-MM)
export function useMonthlyTransactions(yearMonth: string) {
  const setTransactionsForDates = useAppStore((s) => s.setTransactionsForDates);

  return useQuery({
    queryKey: ["transactions-month", yearMonth],
    queryFn: async () => {
      const data = await fetchMonthlyTransactions(yearMonth);
      // Populate store by date
      const grouped: Record<string, Transaction[]> = {};
      for (const txn of data) {
        if (!grouped[txn.date]) grouped[txn.date] = [];
        grouped[txn.date].push(txn);
      }
      setTransactionsForDates(grouped);
      return data;
    },
    enabled: !!yearMonth,
    staleTime:
      yearMonth < format(new Date(), "yyyy-MM") ? Infinity : 1000 * 60 * 5,
  });
}

type MonthlyReportRow = {
  date: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  type: "income" | "expense";
  total: number;
  tx_count: number;
};

// Aggregated report — derived client-side from transactions-month cache
// Shares the same cache key as useMonthlyTransactions — zero extra network request.
function deriveMonthlyReport(txns: Transaction[]): MonthlyReportRow[] {
  const map = new Map<string, MonthlyReportRow>();
  for (const txn of txns) {
    const key = `${txn.date}|${txn.category_id ?? ""}|${txn.type}`;
    const existing = map.get(key);
    if (existing) {
      existing.total += txn.amount;
      existing.tx_count += 1;
    } else {
      map.set(key, {
        date: txn.date,
        category_id: txn.category_id,
        category_name: txn.category?.name ?? null,
        category_icon: txn.category?.icon ?? null,
        category_color: txn.category?.color ?? null,
        type: txn.type,
        total: txn.amount,
        tx_count: 1,
      });
    }
  }
  return Array.from(map.values());
}

export function useMonthlyReport(yearMonth: string) {
  const setTransactionsForDates = useAppStore((s) => s.setTransactionsForDates);
  return useQuery({
    queryKey: ["transactions-month", yearMonth],
    // Identical queryFn to useMonthlyTransactions so either hook can initiate the fetch safely
    queryFn: async () => {
      const data = await fetchMonthlyTransactions(yearMonth);
      const grouped: Record<string, Transaction[]> = {};
      for (const txn of data) {
        if (!grouped[txn.date]) grouped[txn.date] = [];
        grouped[txn.date].push(txn);
      }
      setTransactionsForDates(grouped);
      return data;
    },
    select: deriveMonthlyReport,
    enabled: !!yearMonth,
    staleTime:
      yearMonth < format(new Date(), "yyyy-MM") ? Infinity : 1000 * 60 * 5,
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
