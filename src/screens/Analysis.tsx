import { endOfMonth, endOfQuarter, format, getQuarter, isAfter, isBefore, parseISO, startOfMonth, startOfQuarter } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '../components/ui/button'
import { PanelHeader } from '../components/ui/panel-header'
import { ProgressRow } from '../components/ui/progress-row'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { chartAxisTick, chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from '../components/ui/chart-theme'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { spendingBudgetTypes } from '../data/constants'
import type { Category, SettingsState, Transaction } from '../types'
import { compactMoney, formatMoney } from '../utils/format'
import { buildCycleReview } from '../utils/cycleReview'
import { buildMonthlyModel, buildPaymentRows, buildWeeklyRows } from '../utils/models'

const toneStyles = {
  good: { text: 'text-positive', chip: 'bg-positive-muted text-positive', label: 'On plan' },
  warning: { text: 'text-warning', chip: 'bg-warning-muted text-warning', label: 'Watch this' },
  critical: { text: 'text-negative', chip: 'bg-negative-muted text-negative', label: 'Off plan' },
} as const

const WEEKLY_PAGE_SIZE = 5

export function Analysis({
  categoryById,
  settings,
  selectedMonthStart,
  transactions,
  selectedYear,
  monthly,
}: {
  categoryById: Map<string, Category>
  settings: SettingsState
  selectedMonthStart: Date
  transactions: Transaction[]
  selectedYear: number
  monthly: ReturnType<typeof buildMonthlyModel>
}) {
  const [mode, setMode] = useState<'Quarter' | 'Custom'>('Quarter')
  const [quarter, setQuarter] = useState(String(getQuarter(selectedMonthStart)))
  const [customStart, setCustomStart] = useState(format(startOfMonth(selectedMonthStart), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(selectedMonthStart), 'yyyy-MM-dd'))
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [paymentMode, setPaymentMode] = useState('All')

  const range = useMemo(() => {
    if (mode === 'Quarter') {
      const quarterStart = startOfQuarter(new Date(selectedYear, (Number(quarter) - 1) * 3, 1))
      return { start: quarterStart, end: endOfQuarter(quarterStart) }
    }
    return { start: parseISO(customStart), end: parseISO(customEnd) }
  }, [customEnd, customStart, mode, quarter, selectedYear])

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const category = categoryById.get(transaction.categoryId)
        const date = parseISO(transaction.date)
        if (category?.type === 'Income') return false
        if (isBefore(date, range.start) || isAfter(date, range.end)) return false
        if (categoryFilter !== 'All' && categoryFilter !== category?.type && categoryFilter !== category?.id) return false
        if (paymentMode !== 'All' && transaction.paymentMode !== paymentMode) return false
        return true
      }),
    [categoryById, categoryFilter, paymentMode, range.end, range.start, transactions],
  )
  const weeklyRows = useMemo(() => buildWeeklyRows(range.start, range.end, filtered, settings.weeklyLimit), [filtered, range.end, range.start, settings.weeklyLimit])
  const [weeklyPage, setWeeklyPage] = useState(1)
  useEffect(() => {
    setWeeklyPage(1)
  }, [weeklyRows])
  const weeklyTotalPages = Math.max(1, Math.ceil(weeklyRows.length / WEEKLY_PAGE_SIZE))
  const paginatedWeeklyRows = useMemo(
    () => weeklyRows.slice((weeklyPage - 1) * WEEKLY_PAGE_SIZE, weeklyPage * WEEKLY_PAGE_SIZE),
    [weeklyPage, weeklyRows],
  )
  const paymentRows = useMemo(() => buildPaymentRows(filtered), [filtered])
  const radarData = useMemo(
    () => monthly.typeRows.map((row) => ({ metric: row.type, Actual: row.actual, Budget: row.budget })),
    [monthly.typeRows],
  )
  const cycleReview = useMemo(() => buildCycleReview(monthly, transactions, categoryById), [categoryById, monthly, transactions])
  const rangeTotal = filtered.reduce((sum, transaction) => sum + transaction.amount, 0)
  const weeksOverLimit = weeklyRows.filter((row) => row.limit > 0 && row.spend > row.limit).length

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card className="min-w-0 xl:col-span-2">
        <CardHeader>
          <PanelHeader title="Weekly analysis" action={`${format(range.start, 'dd MMM')} – ${format(range.end, 'dd MMM')}`} />
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-muted/60 p-3">
            <FilterSelect value={mode} onValueChange={(value) => setMode(value as 'Quarter' | 'Custom')} label="Mode">
              <SelectItem value="Quarter">Quarter</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </FilterSelect>
            {mode === 'Quarter' ? (
              <FilterSelect value={quarter} onValueChange={setQuarter} label="Quarter">
                {[1, 2, 3, 4].map((item) => <SelectItem key={item} value={String(item)}>Q{item}</SelectItem>)}
              </FilterSelect>
            ) : (
              <>
                <div className="grid gap-1.5"><Label className="eyebrow" htmlFor="analysis-start">Start</Label><Input className="bg-card" id="analysis-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div>
                <div className="grid gap-1.5"><Label className="eyebrow" htmlFor="analysis-end">End</Label><Input className="bg-card" id="analysis-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div>
              </>
            )}
            <FilterSelect value={categoryFilter} onValueChange={setCategoryFilter} label="Category">
              <SelectItem value="All">All</SelectItem>
              {spendingBudgetTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
              {settings.categories.filter((category) => category.type !== 'Income').map((category) => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect value={paymentMode} onValueChange={setPaymentMode} label="Payment">
              <SelectItem value="All">All</SelectItem>
              {settings.paymentModes.map((modeName) => (
                <SelectItem key={modeName} value={modeName}>{modeName}</SelectItem>
              ))}
            </FilterSelect>
            <div className="ml-auto grid gap-1 pr-1 text-right">
              <span className="eyebrow">In range</span>
              <span className="text-lg leading-none font-extrabold tracking-[-.03em] tnum">{formatMoney(rangeTotal)}</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" tick={chartAxisTick} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickFormatter={(value) => compactMoney(Number(value))} tick={chartAxisTick} tickLine={false} axisLine={false} width={54} />
                <Tooltip
                  contentStyle={chartTooltipContentStyle}
                  cursor={{ fill: 'var(--muted)', radius: 10 }}
                  formatter={(value, name) => [formatMoney(Number(value)), name]}
                  itemStyle={chartTooltipItemStyle}
                  labelStyle={chartTooltipLabelStyle}
                />
                {settings.weeklyLimit > 0 && (
                  <ReferenceLine
                    y={settings.weeklyLimit}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{ value: `Limit ${compactMoney(settings.weeklyLimit)}`, position: 'right', fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
                  />
                )}
                <Bar dataKey="spend" name="Spend" radius={[8, 8, 8, 8]} maxBarSize={44}>
                  {weeklyRows.map((row) => (
                    <Cell key={row.label} fill={row.limit > 0 && row.spend > row.limit ? 'var(--chart-4)' : 'var(--chart-1)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--chart-1)]" /> Within limit</span>
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--chart-4)]" /> Over limit</span>
            <span className="flex items-center gap-2"><span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground/70" /> Weekly limit</span>
            {weeksOverLimit > 0 && (
              <span className="ml-auto font-semibold text-negative">
                {weeksOverLimit} {weeksOverLimit === 1 ? 'week' : 'weeks'} over limit
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelHeader title="Weekly limit" action={formatMoney(settings.weeklyLimit)} />
        </CardHeader>
        <CardContent className="grid gap-4">
          {paginatedWeeklyRows.map((row) => (
            <ProgressRow key={row.label} label={row.label} actual={row.spend} budget={row.limit} color="var(--chart-1)" />
          ))}
          {weeklyRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No weeks in this range yet.</p>}
          {weeklyTotalPages > 1 && (
            <div className="mt-1 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={weeklyPage === 1} onClick={() => setWeeklyPage((page) => page - 1)}>Previous</Button>
              <span className="text-xs font-semibold text-muted-foreground tnum">Page {weeklyPage} of {weeklyTotalPages}</span>
              <Button variant="outline" size="sm" disabled={weeklyPage === weeklyTotalPages} onClick={() => setWeeklyPage((page) => page + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelHeader title="Payment modes" action={`${paymentRows.length} active`} />
        </CardHeader>
        <CardContent className="grid gap-4">
          {paymentRows.map((row, index) => (
            <ProgressRow
              key={row.mode}
              label={row.mode}
              actual={row.amount}
              budget={paymentRows[0]?.amount || 1}
              color={`var(--chart-${(index % 6) + 1})`}
              compact
            />
          ))}
          {paymentRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No payments in this range yet.</p>}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <PanelHeader title="Budget shape" action="This cycle" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={chartAxisTick} />
                <Tooltip
                  contentStyle={chartTooltipContentStyle}
                  formatter={(value, name) => [formatMoney(Number(value)), name]}
                  itemStyle={chartTooltipItemStyle}
                  labelStyle={chartTooltipLabelStyle}
                />
                <Radar name="Budget" dataKey="Budget" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
                <Radar name="Actual" dataKey="Actual" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.22} strokeWidth={2.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 rounded-full bg-[var(--chart-1)]" /> Actual</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 rounded-full bg-muted-foreground/60" /> Budget</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelHeader title="Cycle review" action={`Score ${monthly.score}/10`} />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${toneStyles[cycleReview.tone].chip}`}>
              {toneStyles[cycleReview.tone].label}
            </span>
            <strong className={`mt-3 block text-sm leading-6 font-bold ${toneStyles[cycleReview.tone].text}`}>{cycleReview.headline}</strong>
          </div>
          {cycleReview.suggestions.length > 0 ? (
            <ul className="grid gap-3 text-sm text-muted-foreground">
              {cycleReview.suggestions.map((suggestion) => (
                <li key={suggestion} className="flex gap-2.5 border-b border-border/70 pb-3 leading-6 last:border-0 last:pb-0">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">Nothing stands out yet. Keep logging entries and suggestions will appear here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FilterSelect({ children, label, value, onValueChange }: { children: ReactNode; label: string; value: string; onValueChange: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label className="eyebrow">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="min-w-28 bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}
