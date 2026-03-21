---
description: "Use when writing mutations, dialogs, forms, validation, or data-editing UI. Enforces project patterns for TanStack Query, Zustand, amount formatting, validation, and destructive action guards."
applyTo: "src/**/*.{ts,tsx}"
---

# Data & UX Patterns

## 1. Amount Format

The project uses compact suffixes: **`k` = thousands, `m` = millions**. Do NOT use `tr`.

| Input string | Parsed value | Display |
| ------------ | ------------ | ------- |
| `25k`        | 25,000       | `25k`   |
| `1.5m`       | 1,500,000    | `1.5m`  |
| `0` or `0k`  | 0            | `0`     |

**Parsing:** use `parseCompact()` from `@/lib/currency`.  
**Formatting:** use `formatVND()` or `formatCompact()` from `@/lib/currency`.

```ts
import { parseCompact, formatVND, formatCompact } from "@/lib/currency";

parseCompact("25k"); // → 25000
parseCompact("1.5m"); // → 1500000
formatVND(25000); // → "25k"
formatVND(1500000); // → "1.5m"
```

**Valid amount regex:** `/^\d+(\.\d+)?(k|m)?$/i`  
Accepts: `0`, `35000`, `25k`, `1.5m`, `0k`, `0m`  
Rejects: empty string, letters, `1.5tr`, `abc`

**Hint text** (use in placeholders and hints):

- Vietnamese: `"VD: 25k, 1.5m, 35000"`
- English: `"E.g. 25k, 1.5m, 35000"`

---

## 2. Validation — Dual Layer

Always use two layers of validation for user-editable amounts and required fields.

### Layer 1 — Reactive (inline, per field)

Validate on `onChange` AND `onBlur`. Show error message below the input.

```tsx
const [amountError, setAmountError] = useState<string | undefined>();

function validateAmount(raw: string) {
  const error = /^\d+(\.\d+)?(k|m)?$/i.test(raw.trim())
    ? undefined
    : t.amountInvalidFormat;
  setAmountError(error);
}

<input
  value={amount}
  onChange={(e) => {
    setAmount(e.target.value);
    validateAmount(e.target.value);
  }}
  onBlur={(e) => validateAmount(e.target.value)}
  className={cn(
    "border rounded px-2 py-1 focus:outline-none transition-colors",
    amountError
      ? "border-red-400 dark:border-red-500"
      : "border-border focus:border-indigo-400 dark:focus:border-indigo-500",
  )}
/>;
{
  amountError && (
    <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5">
      {amountError}
    </p>
  );
}
```

### Layer 2 — Hard guard before save

Before any API call, validate all fields again and return early with `toast.error` on failure. This catches edge cases the reactive layer may have missed.

```tsx
async function handleSubmit() {
  if (!title.trim()) {
    toast.error(t.titleRequired);
    return;
  }
  if (!/^\d+(\.\d+)?(k|m)?$/i.test(amount.trim())) {
    toast.error(t.amountInvalidFormat);
    return;
  }
  // ...proceed with mutation
}
```

**Rules:**

- Empty string is always invalid for amount
- `0` is a valid amount (e.g. free meals, free activities)
- Required translation keys: `amountInvalidFormat`, `titleRequired` in both `vi` and `en`

---

## 3. Destructive Actions — Always Confirm

Never delete data immediately on button click. Always show a confirmation dialog first.

```tsx
const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

// Button click → set pending (open dialog)
<button onClick={() => setPendingDelete(item)}>Delete</button>

// Dialog handles the actual deletion
<ConfirmDialog
  open={!!pendingDelete}
  onOpenChange={(v) => { if (!v) setPendingDelete(null); }}
  title={t.deleteItemTitle}
  description={`"${pendingDelete?.name}" ${t.deleteItemSuffix}`}
  confirmLabel={t.deleteBtn}
  danger
  onConfirm={() => {
    if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  }}
/>
```

The reusable `ConfirmDialog` component lives in `SelectedDayView.tsx` — reference or extract it.

---

## 4. No Auto-Save for Bulk Edits

When building any UI that allows editing multiple records at once (e.g. table view, bulk edit):

- Store pending changes in **local state** (not Zustand)
- Show a **"Save changes"** button that is only visible when there are unsaved edits (`isDirty`)
- Do NOT save automatically on blur or input change
- Disable the save button when there are validation errors
- When navigating away with unsaved changes: show a **"Discard changes?"** dialog

```tsx
const [draftEdits, setDraftEdits] = useState<Record<string, Draft>>({});
const isDirty = Object.keys(draftEdits).length > 0;

// Clear drafts on navigation
useEffect(() => {
  setDraftEdits({});
}, [selectedDate]);

// Save all at once
async function handleSave() {
  // hard validation...
  await Promise.all(
    Object.entries(draftEdits).map(([id, draft]) =>
      updateMutation.mutateAsync({ id, ...draft }),
    ),
  );
  setDraftEdits({});
}
```

---

## 5. Mutations — TanStack Query Pattern

```ts
export function useUpdateItem() {
  const qc = useQueryClient();
  const updateItem = useAppStore((s) => s.updateItem);

  return useMutation({
    mutationFn: async (payload: UpdatePayload & { date: string }) => {
      const { id, date, ...rest } = payload;
      const { data, error } = await supabase
        .from("items")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, category:categories(*)")
        .single();
      if (error) throw error;
      return data as Item;
    },
    onSuccess: (item) => {
      updateItem(item); // update Zustand store
      qc.invalidateQueries({ queryKey: ["items", item.date] }); // invalidate cache
      toast.success("Đã cập nhật"); // user feedback
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
```

**Rules:**

- Always `throw error` (never return it)
- Always call `qc.invalidateQueries` after mutation
- Always `toast.success` in `onSuccess`, `toast.error(e.message)` in `onError`
- Fetch fresh data with relations (`.select("*, category:categories(*)")`) when the result is stored

---

## 6. Optimistic Updates

For mutations that feel slow (create transaction, drag & drop):

```ts
const tempId = `__opt__${Date.now()}`;
const tempItem = {
  id: tempId,
  ...payload,
  created_at: new Date().toISOString(),
};

addItem(tempItem); // immediate store update

mutate(payload, {
  onSuccess: (real) => {
    removeItem(tempId);
    addItem(real);
  },
  onError: () => {
    removeItem(tempId);
    toast.error("...");
  },
});
```

---

## 7. Zustand — Granular Selectors Only

Always select the minimum slice needed. Never select the whole store.

```tsx
// ✅ Good
const selectedDate = useAppStore((s) => s.selectedDate);
const categories = useAppStore((s) => s.categories);

// ❌ Bad — causes unnecessary re-renders
const store = useAppStore();
```

---

## 8. Callback Lifting

Mutations belong in the parent component. Children receive typed handler functions as props.

```tsx
// Parent
const deleteItem = useDeleteItem();
const handleDelete = useCallback(
  (id: string) => deleteItem.mutate(id),
  [deleteItem],
);

return <ChildTable onDelete={handleDelete} />;

// Child — no mutation, just calls the prop
<button onClick={() => onDelete(item.id)}>Delete</button>;
```

---

## 9. Component Structure Template

```tsx
"use client";

// 1. React
import { useState, useCallback, useMemo, memo } from "react";
// 2. External libraries
import { cn } from "@/lib/utils";
// 3. Hooks / Store
import { useAppStore } from "@/store/useAppStore";
import { useDashboardT } from "@/hooks/useDashboardT";
// 4. Components
import { Button } from "@/components/ui/button";
// 5. Icons
import { Trash2, Pencil } from "lucide-react";
// 6. Types
import type { Item } from "@/types";

interface Props {
  items: Item[];
  onDelete: (id: string) => void;
}

export const MyComponent = memo(function MyComponent({
  items,
  onDelete,
}: Props) {
  const t = useDashboardT();
  // ...
});
```

---

## 10. Icon Sizes

| Context                      | Size class                           |
| ---------------------------- | ------------------------------------ |
| Inline text / small button   | `w-3.5 h-3.5`                        |
| Standard button / row action | `w-4 h-4`                            |
| Navigation / tab bar         | `w-5 h-5`                            |
| Loading spinner              | `w-3.5 h-3.5 animate-spin` (Loader2) |

---

## 11. Query Keys Convention

```ts
["categories"]["cards"]["profile"][("transactions", "2026-03-13")][ // static list // static list // single record // date param
  ("transactions-month", "2026-03")
][("monthly-report", "2026-03")]; // month param // aggregated
```

- Use `staleTime: 60_000` for frequently changing data (transactions)
- Use `staleTime: Infinity` for static data (categories, cards)
