import { format, parseISO } from 'date-fns'

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function compactMoney(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
  return `₹${value}`
}

export function formatDate(value: string) {
  return format(parseISO(value), 'dd MMM yyyy')
}

/** "12 Aug" — the short form used inside dense lists where the year is implied. */
export function formatDayMonth(value: string) {
  return format(parseISO(value), 'dd MMM')
}

export function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
