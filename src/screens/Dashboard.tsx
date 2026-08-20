import type { ReactNode } from 'react'
import { Cell, Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, Clock3, Sparkles, TrendingUp, Wallet, TriangleAlert } from 'lucide-react'
import { KpiCard } from '../components/ui/kpi-card'
import { PanelHeader } from '../components/ui/panel-header'
import { ProgressRow } from '../components/ui/progress-row'
import type { Category, Transaction } from '../types'
import { compactMoney, formatDayMonth, formatMoney } from '../utils/format'
import { buildDailyTrend, buildMonthlyModel, typeColor } from '../utils/models'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { chartAxisTick, chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from '../components/ui/chart-theme'

export function Dashboard({
  monthly,
  dailyTrend,
  categoryById,
  transactions,
  cycleIndicator,
  incomeLabel,
  incomeIsPlanned = false,
}: {
  monthly: ReturnType<typeof buildMonthlyModel>
  dailyTrend: ReturnType<typeof buildDailyTrend>
  categoryById: Map<string, Category>
  transactions: Transaction[]
  cycleIndicator?: { message: string; detail: string }
  incomeLabel: string
  incomeIsPlanned?: boolean
}) {
  const latest = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const overspent = monthly.amountLeft < 0
  const categoryTotal = monthly.categoryRows.reduce((sum, row) => sum + row.actual, 0)
  const busiestDay = dailyTrend.reduce<{ label: string; spend: number } | null>(
    (peak, day) => (!peak || day.spend > peak.spend ? day : peak),
    null,
  )

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="grid gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-4">
        <KpiCard
          label="Left to spend"
          value={formatMoney(monthly.amountLeft)}
          detail={overspent ? `${Math.abs(monthly.percentageLeft).toFixed(1)}% over income` : `${monthly.percentageLeft.toFixed(1)}% of income still yours`}
          emphasis
          icon={Wallet}
        />
        <KpiCard
          label={incomeLabel}
          value={formatMoney(monthly.salary)}
          detail={incomeIsPlanned ? 'From Setup — log an income entry to use the real figure' : 'Recorded in this period'}
          icon={TrendingUp}
          tone={incomeIsPlanned ? 'neutral' : 'positive'}
        />
        <KpiCard
          label="Spent"
          value={formatMoney(monthly.totalActual)}
          detail={`${monthly.spendRatio.toFixed(0)}% of the budget plan`}
          icon={ArrowDownRight}
          tone={monthly.spendRatio > 100 ? 'negative' : 'neutral'}
        />
        <KpiCard
          label="Money score"
          value={`${monthly.score}/10`}
          detail={monthly.score >= 8 ? 'On track' : monthly.score >= 5 ? 'Getting steadier' : 'Needs attention'}
          icon={Sparkles}
          tone={monthly.score >= 8 ? 'positive' : monthly.score >= 5 ? 'warning' : 'negative'}
        />
      </section>

      {overspent && (
        <Callout
          icon={<TriangleAlert size={18} />}
          tone="negative"
          title="You are over budget this cycle"
          detail={`You have spent ${formatMoney(Math.abs(monthly.amountLeft))} more than ${incomeLabel.toLowerCase()}.`}
        />
      )}

      {cycleIndicator && (
        <Callout icon={<Clock3 size={18} />} tone="brand" title={cycleIndicator.message} detail={cycleIndicator.detail} />
      )}

      <Card className="min-w-0 xl:col-span-2">
        <CardHeader>
          <PanelHeader title="Daily spend" action={`${dailyTrend.length} days`} />
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" tick={chartAxisTick} tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
                <YAxis tickFormatter={(value) => compactMoney(Number(value))} tick={chartAxisTick} tickLine={false} axisLine={false} width={54} />
                <Tooltip
                  contentStyle={chartTooltipContentStyle}
                  cursor={{ stroke: 'var(--chart-1)', strokeOpacity: 0.35, strokeWidth: 2 }}
                  formatter={(value) => [formatMoney(Number(value)), 'Spend']}
                  itemStyle={chartTooltipItemStyle}
                  labelFormatter={(label) => String(label)}
                  labelStyle={chartTooltipLabelStyle}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="var(--chart-1)"
                  fill="url(#spendGradient)"
                  strokeWidth={2.5}
                  activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--card)', fill: 'var(--chart-1)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {busiestDay && busiestDay.spend > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Heaviest day so far was <strong className="font-semibold text-foreground">{busiestDay.label}</strong> at{' '}
              <strong className="font-semibold text-foreground tnum">{formatMoney(busiestDay.spend)}</strong>.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelHeader title="Budget split" action="50 / 30 / 20" />
        </CardHeader>
        <CardContent className="grid gap-5">
          {monthly.typeRows.map((row) => (
            <ProgressRow key={row.type} label={row.type} actual={row.actual} budget={row.budget} color={typeColor(row.type)} />
          ))}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <PanelHeader title="Category mix" action={`${monthly.categoryRows.length} active`} />
        </CardHeader>
        <CardContent>
          {categoryTotal > 0 ? (
            <div className="grid items-center gap-5 sm:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-1 xl:gap-6">
              <div className="relative mx-auto h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={monthly.categoryRows} dataKey="actual" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none" cornerRadius={6}>
                      {monthly.categoryRows.map((row) => (
                        <Cell key={row.categoryId} fill={categoryById.get(row.categoryId)?.color ?? 'var(--chart-1)'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipContentStyle}
                      formatter={(value) => formatMoney(Number(value))}
                      itemStyle={chartTooltipItemStyle}
                      labelStyle={chartTooltipLabelStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                  <span className="block text-[10px] font-bold tracking-[.1em] text-muted-foreground uppercase">Spent</span>
                  <span className="block text-sm font-extrabold tracking-[-.02em] tnum">{compactMoney(categoryTotal)}</span>
                </div>
              </div>
              <ul className="grid gap-2.5">
                {monthly.categoryRows
                  .slice()
                  .sort((a, b) => b.actual - a.actual)
                  .map((row) => (
                    <li className="flex items-center gap-2.5 text-sm" key={row.categoryId}>
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: categoryById.get(row.categoryId)?.color }} />
                      <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                      <span className="shrink-0 text-xs font-bold text-muted-foreground tnum">
                        {Math.round((row.actual / categoryTotal) * 100)}%
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <EmptyNote>Nothing categorised in this period yet.</EmptyNote>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <PanelHeader title="Recent entries" action={`${transactions.length} this period`} />
        </CardHeader>
        <CardContent className="grid">
          {latest.map((transaction) => {
            const category = categoryById.get(transaction.categoryId)
            return (
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-border/70 py-3 last:border-0 last:pb-0 first:pt-0"
                key={transaction.id}
              >
                <span
                  aria-hidden
                  className="grid size-9 place-items-center rounded-full text-xs font-extrabold"
                  style={{
                    color: category?.color,
                    background: category?.color ? `color-mix(in srgb, ${category.color} 14%, transparent)` : undefined,
                  }}
                >
                  {transaction.description.trim().slice(0, 1).toUpperCase() || '·'}
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold">{transaction.description}</strong>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDayMonth(transaction.date)} · {category?.name ?? 'Uncategorised'}
                  </span>
                </div>
                <b className="text-sm font-bold tnum">{formatMoney(transaction.amount)}</b>
              </div>
            )
          })}
          {latest.length === 0 && <EmptyNote>No entries in this period yet.</EmptyNote>}
        </CardContent>
      </Card>
    </div>
  )
}

const calloutTones = {
  brand: 'bg-accent text-primary',
  negative: 'bg-negative-muted text-negative',
} as const

function Callout({
  detail,
  icon,
  title,
  tone,
}: {
  detail: string
  icon: ReactNode
  title: string
  tone: keyof typeof calloutTones
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-xl bg-card p-4 shadow-sm border xl:col-span-3">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${calloutTones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <strong className={`block text-sm font-bold ${tone === 'negative' ? 'text-negative' : ''}`}>{title}</strong>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{children}</p>
}
