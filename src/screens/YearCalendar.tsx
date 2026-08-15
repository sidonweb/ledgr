import { format, getDay, getDaysInMonth } from 'date-fns'
import { useMemo } from 'react'
import { PanelHeader } from '../components/ui/panel-header'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { monthNames } from '../data/constants'
import type { Category, Transaction } from '../types'
import { compactMoney, formatMoney } from '../utils/format'
import { buildYearDailyTotals } from '../utils/models'

/** Five buckets, so a glance tells you heavy days from quiet ones. */
const LEVELS = [0, 0.12, 0.3, 0.55, 0.8]

export function YearCalendar({
  categoryById,
  selectedYear,
  transactions,
}: {
  categoryById: Map<string, Category>
  selectedYear: number
  transactions: Transaction[]
}) {
  const daily = useMemo(() => buildYearDailyTotals(selectedYear, transactions, categoryById), [categoryById, selectedYear, transactions])
  const maxSpend = Math.max(...Array.from(daily.values()), 1)
  const yearTotal = Array.from(daily.values()).reduce((sum, amount) => sum + amount, 0)
  const activeDays = Array.from(daily.values()).filter((amount) => amount > 0).length

  function tintFor(amount: number) {
    if (amount <= 0) return { background: 'var(--muted)', color: 'var(--muted-foreground)' }
    const intensity = amount / maxSpend
    const step = LEVELS.filter((level) => intensity >= level).length
    const mix = [0, 16, 34, 56, 82][step - 1] ?? 16
    return {
      background: `color-mix(in srgb, var(--chart-1) ${mix}%, var(--muted))`,
      color: mix > 50 ? '#ffffff' : 'var(--foreground)',
    }
  }

  return (
    <Card>
      <CardHeader>
        <PanelHeader title={`${selectedYear} at a glance`} action={`${activeDays} days with spend`} />
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/60 px-4 py-3">
          <div>
            <span className="eyebrow">Spent this year</span>
            <strong className="mt-1 block text-xl leading-none font-extrabold tracking-[-.03em] tnum">{formatMoney(yearTotal)}</strong>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>Quiet</span>
            {[0, 16, 34, 56, 82].map((mix) => (
              <span
                className="size-3.5 rounded-[5px] border"
                key={mix}
                style={{ background: `color-mix(in srgb, var(--chart-1) ${mix}%, var(--muted))` }}
              />
            ))}
            <span>Heavy</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {monthNames.map((month, monthIndex) => {
            const first = new Date(selectedYear, monthIndex, 1)
            const days = getDaysInMonth(first)
            const offset = (getDay(first) + 6) % 7
            const monthTotal = Array.from({ length: days }).reduce<number>((sum, _, index) => {
              const key = format(new Date(selectedYear, monthIndex, index + 1), 'yyyy-MM-dd')
              return sum + (daily.get(key) ?? 0)
            }, 0)

            return (
              <div className="rounded-lg bg-muted/45 p-4" key={month}>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold">{month}</h3>
                  <span className="text-[11px] font-semibold text-muted-foreground tnum">
                    {monthTotal > 0 ? compactMoney(monthTotal) : '—'}
                  </span>
                </div>
                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground/70">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: offset }).map((_, index) => (
                    <span key={`blank-${index}`} />
                  ))}
                  {Array.from({ length: days }).map((_, index) => {
                    const date = new Date(selectedYear, monthIndex, index + 1)
                    const key = format(date, 'yyyy-MM-dd')
                    const amount = daily.get(key) ?? 0
                    return (
                      <span
                        className="grid aspect-square place-items-center rounded-[6px] text-[10px] font-semibold tnum"
                        key={key}
                        title={`${format(date, 'dd MMM yyyy')} — ${formatMoney(amount)}`}
                        style={tintFor(amount)}
                      >
                        {index + 1}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
