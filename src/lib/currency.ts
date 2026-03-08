/**
 * Format a number as compact VND: 35000 → 35k, 1500000 → 1.5m
 */
export function formatVND(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return `${val % 1 === 0 ? val : val.toFixed(1)}m`
  }
  if (amount >= 1_000) {
    const val = amount / 1_000
    return `${val % 1 === 0 ? val : val.toFixed(1)}k`
  }
  return `${amount}`
}

/**
 * Format compact numbers: 1,500,000 → 1.5m, 35,000 → 35k
 */
export function formatCompact(amount: number): string {
  return formatVND(amount)
}

/**
 * Parse a compact string back to number: "25k" → 25000, "1.5tr" → 1500000
 */
export function parseCompact(value: string): number {
  const trimmed = value.trim().toLowerCase()
  if (trimmed.endsWith('tr')) {
    return parseFloat(trimmed.replace('tr', '')) * 1_000_000
  }
  if (trimmed.endsWith('k')) {
    return parseFloat(trimmed.replace('k', '')) * 1_000
  }
  return parseFloat(trimmed.replace(/[^0-9.]/g, '')) || 0
}
