import { Cell, Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock3, TriangleAlert } from 'lucide-react'
import { KpiCard } from '../components/ui/KpiCard'
import { PanelHeader } from '../components/ui/PanelHeader'
import { ProgressRow } from '../components/ui/ProgressRow'
import type { Category, Transaction } from '../types'
import { compactMoney, formatDate, formatMoney } from '../utils/format'
import { buildDailyTrend, buildMonthlyModel, typeColor } from '../utils/models'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from '../components/ui/chart-theme'

export function Dashboard({
  monthly,
  dailyTrend,
  categoryById,
  transactions,
  cycleIndicator,
  incomeLabel,
}: {
  monthly: ReturnType<typeof buildMonthlyModel>
  dailyTrend: ReturnType<typeof buildDailyTrend>
  categoryById: Map<string, Category>
  transactions: Transaction[]
  cycleIndicator?: { message: string; detail: string }
  incomeLabel: string
}) {
  const latest = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
      <section className="grid gap-3 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-4">
        <KpiCard label={incomeLabel} value={formatMoney(monthly.salary)} tone="blue" />
        <KpiCard label="Spent" value={formatMoney(monthly.totalActual)} detail={`${monthly.spendRatio.toFixed(0)}% of budget plan`} tone="rose" />
        <KpiCard
          label="Left"
          value={formatMoney(monthly.amountLeft)}
          detail={monthly.amountLeft < 0 ? `${Math.abs(monthly.percentageLeft).toFixed(1)}% over income` : `${monthly.percentageLeft.toFixed(1)}% of income`}
          tone={monthly.amountLeft < 0 ? 'rose' : 'green'}
        />
        <KpiCard label="Score" value={`${monthly.score}/10`} detail={monthly.score >= 8 ? 'On track' : 'Needs attention'} tone="amber" />
      </section>

      {monthly.amountLeft < 0 && (
        <Card className="border-destructive/40 bg-destructive/5 xl:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <span className="grid size-9 place-items-center rounded-lg bg-destructive/15 text-destructive"><TriangleAlert size={17} /></span>
            <div>
              <strong className="block text-sm font-bold text-destructive">You&apos;re over budget this cycle</strong>
              <span className="text-xs text-muted-foreground">You&apos;ve spent {formatMoney(Math.abs(monthly.amountLeft))} more than {incomeLabel.toLowerCase()}.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {cycleIndicator && (
        <Card className="xl:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><Clock3 size={17} /></span>
            <div>
              <strong className="block text-sm font-bold">{cycleIndicator.message}</strong>
              <span className="text-xs text-muted-foreground">{cycleIndicator.detail}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="min-w-0">
        <CardHeader><PanelHeader title="Daily Spend" action={`${dailyTrend.length} days`} /></CardHeader>
        <CardContent><div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => compactMoney(Number(value))} tickLine={false} axisLine={false} width={58} />
              <Tooltip
                contentStyle={chartTooltipContentStyle}
                cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.35 }}
                formatter={(value) => formatMoney(Number(value))}
                itemStyle={chartTooltipItemStyle}
                labelFormatter={(label) => String(label)}
                labelStyle={chartTooltipLabelStyle}
              />
              <Area type="monotone" dataKey="spend" stroke="currentColor" className="text-foreground" fill="url(#spendGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div></CardContent>
      </Card>

      <Card>
        <CardHeader><PanelHeader title="Budget Split" action="50 / 30 / 20" /></CardHeader>
        <CardContent className="grid gap-5">
          {monthly.typeRows.map((row) => (
            <ProgressRow key={row.type} label={row.type} actual={row.actual} budget={row.budget} color={typeColor(row.type)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><PanelHeader title="Category Mix" action={`${monthly.categoryRows.length} active`} /></CardHeader>
        <CardContent><div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={monthly.categoryRows} dataKey="actual" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2}>
                {monthly.categoryRows.map((row) => (
                  <Cell key={row.categoryId} fill={categoryById.get(row.categoryId)?.color ?? '#A3A3A3'} />
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
        </div></CardContent>
      </Card>

      <Card>
        <CardHeader><PanelHeader title="Recent Entries" action={`${transactions.length} this month`} /></CardHeader>
        <CardContent className="grid gap-1">
          {latest.map((transaction) => {
            const category = categoryById.get(transaction.categoryId)
            return (
              <div className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 border-b py-3 last:border-0" key={transaction.id}>
                <span className="size-2.5 rounded-full" style={{ background: category?.color }} />
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold">{transaction.description}</strong>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDate(transaction.date)} - {category?.name}
                  </span>
                </div>
                <b className="text-sm">{formatMoney(transaction.amount)}</b>
              </div>
            )
          })}
          {latest.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No entries this month yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
