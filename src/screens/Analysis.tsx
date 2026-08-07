import { endOfMonth, endOfQuarter, format, getQuarter, isAfter, isBefore, parseISO, startOfMonth, startOfQuarter } from 'date-fns'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PanelHeader } from '../components/ui/PanelHeader'
import { ProgressRow } from '../components/ui/ProgressRow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from '../components/ui/chart-theme'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/label'
import { spendingBudgetTypes } from '../data/constants'
import type { Category, SettingsState, Transaction } from '../types'
import { compactMoney, formatMoney } from '../utils/format'
import { buildCycleReview } from '../utils/cycleReview'
import { buildMonthlyModel, buildPaymentRows, buildWeeklyRows } from '../utils/models'

const toneStyles = {
  good: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-destructive',
} as const

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
  const paymentRows = useMemo(() => buildPaymentRows(filtered), [filtered])
  const radarData = useMemo(
    () => monthly.typeRows.map((row) => ({ metric: row.type, Actual: row.actual, Budget: row.budget })),
    [monthly.typeRows],
  )
  const cycleReview = useMemo(() => buildCycleReview(monthly, transactions, categoryById), [categoryById, monthly, transactions])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.75fr)]">
      <Card className="min-w-0 xl:col-span-2">
        <CardHeader><PanelHeader title="Weekly Analysis" action={`${format(range.start, 'dd MMM')} - ${format(range.end, 'dd MMM')}`} /></CardHeader>
        <CardContent>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <FilterSelect value={mode} onValueChange={(value) => setMode(value as 'Quarter' | 'Custom')} label="Mode">
            <SelectItem value="Quarter">Quarter</SelectItem><SelectItem value="Custom">Custom</SelectItem>
          </FilterSelect>
          {mode === 'Quarter' ? (
            <FilterSelect value={quarter} onValueChange={setQuarter} label="Quarter">
              {[1, 2, 3, 4].map((item) => <SelectItem key={item} value={String(item)}>Q{item}</SelectItem>)}
            </FilterSelect>
          ) : (
            <>
              <div className="grid gap-1.5"><Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase" htmlFor="analysis-start">Start</Label><Input id="analysis-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div>
              <div className="grid gap-1.5"><Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase" htmlFor="analysis-end">End</Label><Input id="analysis-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div>
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
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyRows}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => compactMoney(Number(value))} tickLine={false} axisLine={false} width={58} />
              <Tooltip
                contentStyle={chartTooltipContentStyle}
                formatter={(value) => formatMoney(Number(value))}
                itemStyle={chartTooltipItemStyle}
                labelStyle={chartTooltipLabelStyle}
              />
              <Legend />
              <Bar dataKey="spend" name="Spend" fill="var(--chart-1)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="limit" name="Limit" fill="var(--chart-2)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </CardContent>
      </Card>

      <Card><CardHeader><PanelHeader title="Weekly Limit" action={formatMoney(settings.weeklyLimit)} /></CardHeader><CardContent className="grid gap-4">
          {weeklyRows.map((row) => (
            <ProgressRow key={row.label} label={row.label} actual={row.spend} budget={row.limit} color={row.spend > row.limit ? '#2B5D8A' : '#7FD3FF'} />
          ))}
      </CardContent></Card>

      <Card><CardHeader><PanelHeader title="Payment Modes" action={`${paymentRows.length} active`} /></CardHeader><CardContent className="grid gap-4">
          {paymentRows.map((row) => (
            <ProgressRow key={row.mode} label={row.mode} actual={row.amount} budget={paymentRows[0]?.amount || 1} color="#2B5D8A" compact />
          ))}
      </CardContent></Card>

      <Card className="min-w-0">
        <CardHeader><PanelHeader title="Budget Shape" action="This cycle" /></CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                {/* <PolarRadiusAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickFormatter={(value) => compactMoney(Number(value))} /> */}
                <Tooltip
                  contentStyle={chartTooltipContentStyle}
                  formatter={(value) => formatMoney(Number(value))}
                  itemStyle={chartTooltipItemStyle}
                  labelStyle={chartTooltipLabelStyle}
                />
                <Legend />
                <Radar name="Actual" dataKey="Actual" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Budget" dataKey="Budget" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><PanelHeader title="Cycle Review" action={`Score ${monthly.score}/10`} /></CardHeader>
        <CardContent className="grid gap-3">
          <strong className={`text-sm font-bold ${toneStyles[cycleReview.tone]}`}>{cycleReview.headline}</strong>
          {cycleReview.suggestions.length > 0 ? (
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {cycleReview.suggestions.map((suggestion) => (
                <li key={suggestion} className="border-b pb-2 last:border-0 last:pb-0">{suggestion}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing stands out yet — keep logging entries to see suggestions here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FilterSelect({ children, label, value, onValueChange }: { children: ReactNode; label: string; value: string; onValueChange: (value: string) => void }) {
  return <div className="grid gap-1.5"><Label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{label}</Label><Select value={value} onValueChange={onValueChange}><SelectTrigger className="min-w-28"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>
}
