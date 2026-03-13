---
description: "Use when writing or editing any component, page, or hook. Enforces dark mode support, Vietnamese + English locale translations, and post-coding formatting."
applyTo: "src/**/*.{ts,tsx}"
---

# Coding Standards

## 1. Dark Mode

Always include `dark:` variants for every Tailwind color utility class.

**Required pairs:**
| Light | Dark |
|---|---|
| `bg-white` | `dark:bg-slate-900` |
| `bg-slate-50` | `dark:bg-slate-800` |
| `text-slate-900` | `dark:text-slate-100` |
| `text-slate-500` | `dark:text-slate-400` |
| `border-slate-200` | `dark:border-slate-700` |

Prefer semantic CSS variables from `globals.css` over hardcoded colors when available (e.g. `bg-background`, `text-foreground`, `border-border`). These switch automatically between light/dark.

```tsx
// Good — semantic token (auto dark mode)
<div className="bg-background text-foreground border border-border" />

// Good — explicit dark variant
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />

// Bad — missing dark variant
<div className="bg-white text-slate-900" />
```

---

## 2. Locale (Vietnamese + English)

All user-visible text must be translated. Use the project's custom translation pattern.

### For dashboard/app components — use `useDashboardT()`

```tsx
import { useDashboardT } from "@/hooks/useDashboardT";

export function MyComponent() {
  const t = useDashboardT();
  return <span>{t.myKey}</span>;
}
```

**When adding new text**, add both `vi` and `en` keys to the `T` object in `src/hooks/useDashboardT.ts`:

```ts
const T = {
  vi: {
    myKey: "Văn bản tiếng Việt",
    myDynamic: (name: string) => `Xin chào ${name}`,
  },
  en: {
    myKey: "English text",
    myDynamic: (name: string) => `Hello ${name}`,
  },
};
```

### For language state — use `useUILanguage()`

```tsx
import { useUILanguage } from "@/hooks/useUILanguage";

const [language, setLanguage] = useUILanguage();
// language is "vi" | "en"
```

### For date formatting — use `useLocale()`

```tsx
import { useLocale } from "@/hooks/useLocale";
import { format } from "date-fns";

const locale = useLocale();
format(date, "dd MMMM yyyy", { locale });
```

**Rules:**
- Never hardcode Vietnamese or English strings outside the `T` object
- Always add both `vi` and `en` keys simultaneously — never leave one missing
- Use functions for dynamic/interpolated strings: `(count: number) => \`${count} mục\``

---

## 3. Post-Coding Formatting

After finishing any code change, run:

```bash
npm run lint
```

Fix all reported errors before considering the task done.
