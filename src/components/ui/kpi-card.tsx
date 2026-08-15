import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from '../../utils/cn'

export type KpiTone = 'neutral' | 'positive' | 'negative' | 'warning'

const toneText: Record<KpiTone, string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
}

/**
 * One headline figure, built on the stock Card. `emphasis` inverts a single KPI
 * per row so the eye lands on the number that matters most — the rest stay quiet.
 */
export function KpiCard({
  detail,
  emphasis = false,
  icon: Icon,
  label,
  tone = 'neutral',
  value,
}: {
  detail?: string
  emphasis?: boolean
  icon?: LucideIcon
  label: string
  tone?: KpiTone
  value: string
}) {
  return (
    <Card className={cn('gap-0 py-0', emphasis && 'border-primary bg-primary text-primary-foreground')}>
      <CardContent className="flex flex-col justify-between px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <span className={cn('eyebrow', emphasis && 'text-primary-foreground/70')}>{label}</span>
          {Icon && (
            <Icon
              className={cn('size-4 shrink-0', emphasis ? 'text-primary-foreground/70' : 'text-muted-foreground')}
              aria-hidden
            />
          )}
        </div>
        <span className="mt-6 block text-3xl leading-none font-semibold tracking-tight tnum">{value}</span>
        {detail && (
          <span className={cn('mt-2 block text-xs', emphasis ? 'text-primary-foreground/70' : toneText[tone])}>
            {detail}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
