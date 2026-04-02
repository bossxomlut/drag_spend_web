import type { Transaction } from "@/types";

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsCsv(
  transactions: Transaction[],
  filename: string,
  labels: {
    date: string;
    title: string;
    amount: string;
    type: string;
    category: string;
    note: string;
    income: string;
    expense: string;
  },
) {
  const sorted = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.position - b.position,
  );

  const rows: string[] = [
    [
      labels.date,
      labels.title,
      labels.amount,
      labels.type,
      labels.category,
      labels.note,
    ]
      .map(escapeCsvField)
      .join(","),
    ...sorted.map((txn) =>
      [
        txn.date,
        txn.title,
        txn.amount,
        txn.type === "income" ? labels.income : labels.expense,
        txn.category?.name ?? "",
        txn.note ?? "",
      ]
        .map(escapeCsvField)
        .join(","),
    ),
  ];

  const csv = rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
