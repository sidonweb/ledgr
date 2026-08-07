import { formatMoney } from '../../utils/format'
import { Progress } from './progress'

export function ProgressRow({ actual, budget, color, compact, label }: { actual: number; budget: number; color: string; compact?: boolean; label: string }) {
  const over = budget > 0 && actual > budget
  const ratio = budget > 0 ? Math.min((actual / budget) * 100, 140) : 0
  return (
    <div className="grid gap-2.5">
      <div className="flex justify-between gap-3 text-sm">
        <strong className="font-semibold">{label}</strong>
        <span className={`text-xs ${over ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
          {formatMoney(actual)}
          {!compact && ` / ${formatMoney(budget)}`}
        </span>
      </div>
      <Progress className="bg-muted" indicatorStyle={{ background: over ? 'var(--destructive)' : color }} value={Math.min(ratio, 100)} />
    </div>
  )
}
