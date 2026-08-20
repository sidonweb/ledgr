import type { CSSProperties } from 'react'

export const chartTooltipContentStyle: CSSProperties = {
  backgroundColor: 'var(--popover)',
  border: 'none',
  outline: '1px solid var(--border)',
  borderRadius: '14px',
  boxShadow: 'var(--elevation-pop)',
  color: 'var(--popover-foreground)',
  fontSize: '13px',
  padding: '10px 12px',
}

export const chartTooltipLabelStyle: CSSProperties = {
  color: 'var(--muted-foreground)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  marginBottom: '6px',
}

export const chartTooltipItemStyle: CSSProperties = {
  color: 'var(--popover-foreground)',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  padding: 0,
}

export const chartAxisTick = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
  fontWeight: 600,
} as const

/** The categorical series colours, in the order they should be handed out. */
export const chartSeries = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]
