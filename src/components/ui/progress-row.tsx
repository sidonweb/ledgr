import { Progress } from './progress'
import { cn } from '../../utils/cn'
import { formatMoney } from '../../utils/format'

/**
 * A labelled meter: name, spend against budget, and the bar. Built on the stock
 * shadcn Progress — the series colour is passed in as a CSS variable so the
 * component itself stays unmodified.
 */
export function ProgressRow({
  actual,
  budget,
  color,
  compact,
  label,
}: {
  actual: number
  budget: number
  color: string
  compact?: boolean
  label: string
}) {
  const over = budget > 0 && actual > budget
  const ratio = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0
  const share = budget > 0 ? Math.round((actual / budget) * 100) : 0

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ background: over ? 'var(--destructive)' : color }}
          />
          {label}
        </span>
        <span className={cn('text-xs tabular-nums', over ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
          {formatMoney(actual)}
          {!compact && <span className="text-muted-foreground/70"> / {formatMoney(budget)}</span>}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress
          className="h-2 flex-1 bg-muted [&_[data-slot=progress-indicator]]:bg-(--bar)"
          style={{ '--bar': over ? 'var(--destructive)' : color } as React.CSSProperties}
          value={ratio}
        />
        {!compact && (
          <span
            className={cn(
              'w-10 shrink-0 text-right text-xs font-medium tabular-nums',
              over ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {share}%
          </span>
        )}
      </div>
    </div>
  )
}
