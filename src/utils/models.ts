import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns'
import { spendingBudgetTypes } from '../data/constants'
import type { BudgetCycle, BudgetType, Category, SettingsState, SpendingBudgetType, Transaction } from '../types'

export function buildSalaryPlans(settings: SettingsState) {
  return Array.from({ length: 5 }, (_, index) => {
    const salary = Math.round(settings.salary * (1 + settings.salaryGrowth / 100) ** index)
    return {
      year: settings.startYear + index,
      salary,
      need: Math.floor(salary * 0.5),
      want: Math.floor(salary * 0.3),
      saving: Math.ceil(salary * 0.2),
    }
  })
}

export function buildMonthlyModel(
  transactions: Transaction[],
  settings: SettingsState,
  selectedYear: number,
  categoryById: Map<string, Category>,
  incomeOverride?: number,
) {
  const salaryPlan = buildSalaryPlans(settings).find((item) => item.year === selectedYear) ?? buildSalaryPlans(settings)[0]
  const salary = incomeOverride ?? salaryPlan.salary
  const budgetByType: Record<SpendingBudgetType, number> = {
    Need: Math.floor(salary * 0.5),
    Want: Math.floor(salary * 0.3),
    Saving: Math.ceil(salary * 0.2),
  }
  const actualByType: Record<SpendingBudgetType, number> = { Need: 0, Want: 0, Saving: 0 }
  const actualByCategory = new Map<string, number>()

  for (const transaction of transactions) {
    const category = categoryById.get(transaction.categoryId)
    if (!category || category.type === 'Income') continue
    actualByType[category.type] += transaction.amount
    actualByCategory.set(category.id, (actualByCategory.get(category.id) ?? 0) + transaction.amount)
  }

  const typeRows = spendingBudgetTypes.map((type) => ({
    type,
    budget: budgetByType[type],
    actual: actualByType[type],
    difference: budgetByType[type] - actualByType[type],
  }))
  const categoryRows = Array.from(actualByCategory.entries())
    .map(([categoryId, actual]) => ({
      categoryId,
      name: categoryById.get(categoryId)?.name ?? 'Uncategorized',
      type: categoryById.get(categoryId)?.type ?? 'Need',
      actual,
    }))
    .sort((a, b) => b.actual - a.actual)

  const totalActual = typeRows.reduce((sum, row) => sum + row.actual, 0)
  const amountLeft = salary - totalActual
  const percentageLeft = salary > 0 ? (amountLeft / salary) * 100 : 0
  const totalBudget = budgetByType.Need + budgetByType.Want + budgetByType.Saving
  const spendRatio = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
  const overBudgetPenalty = typeRows.reduce((sum, row) => sum + Math.max(row.actual - row.budget, 0) / Math.max(row.budget, 1), 0)
  const savingsPenalty = actualByType.Saving < budgetByType.Saving ? (budgetByType.Saving - actualByType.Saving) / Math.max(budgetByType.Saving, 1) : 0
  const score = Math.max(0, Math.min(10, Math.round((10 - (overBudgetPenalty + savingsPenalty * 0.5) * 4) * 10) / 10))

  return { actualByType, amountLeft, categoryRows, percentageLeft, salary, score, spendRatio, totalActual, typeRows }
}

export function buildDailyTrend(rangeStart: Date, rangeEnd: Date, transactions: Transaction[], categoryById: Map<string, Category>) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  return days.map((day) => {
    const spend = transactions
      .filter((transaction) => isSameDay(parseISO(transaction.date), day))
      .filter((transaction) => {
        const type = categoryById.get(transaction.categoryId)?.type
        return type !== 'Saving' && type !== 'Income'
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    return { date: format(day, 'yyyy-MM-dd'), label: format(day, 'dd MMM'), spend }
  })
}

export function buildWeeklyRows(start: Date, end: Date, transactions: Transaction[], weeklyLimit: number) {
  const rows = []
  let cursor = startOfWeek(start, { weekStartsOn: 1 })
  while (!isAfter(cursor, end)) {
    const weekStart = cursor
    const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 })
    const spend = transactions
      .filter((transaction) => {
        const date = parseISO(transaction.date)
        return isWithinInterval(date, { start: weekStart, end: weekEnd })
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    rows.push({
      label: `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM')}`,
      spend,
      limit: weeklyLimit,
      ratio: weeklyLimit > 0 ? (spend / weeklyLimit) * 100 : 0,
    })
    cursor = addDays(cursor, 7)
  }
  return rows
}

export function buildPaymentRows(transactions: Transaction[]) {
  const map = new Map<string, number>()
  for (const transaction of transactions) {
    map.set(transaction.paymentMode, (map.get(transaction.paymentMode) ?? 0) + transaction.amount)
  }
  return Array.from(map.entries())
    .map(([mode, amount]) => ({ mode, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function buildYearDailyTotals(year: number, transactions: Transaction[], categoryById: Map<string, Category>) {
  const map = new Map<string, number>()
  for (const transaction of transactions) {
    const date = parseISO(transaction.date)
    if (date.getFullYear() !== year) continue
    const type = categoryById.get(transaction.categoryId)?.type
    if (type === 'Saving' || type === 'Income') continue
    map.set(transaction.date, (map.get(transaction.date) ?? 0) + transaction.amount)
  }
  return map
}

/** Needs, wants and savings each keep one hue, so the split reads the same everywhere. */
export function typeColor(type: BudgetType) {
  if (type === 'Want') return 'var(--chart-3)'
  if (type === 'Saving') return 'var(--chart-1)'
  return 'var(--chart-2)'
}

export function buildBudgetCycles(transactions: Transaction[], categoryById: Map<string, Category>): BudgetCycle[] {
  const incomeByDate = new Map<string, number>()

  for (const transaction of transactions) {
    if (categoryById.get(transaction.categoryId)?.type !== 'Income') continue
    incomeByDate.set(transaction.date, (incomeByDate.get(transaction.date) ?? 0) + transaction.amount)
  }

  const incomeDates = Array.from(incomeByDate.keys()).sort()
  return incomeDates.map((startDate, index) => ({
    id: startDate,
    startDate,
    endDate: incomeDates[index + 1] ? format(subDays(parseISO(incomeDates[index + 1]), 1), 'yyyy-MM-dd') : null,
    income: incomeByDate.get(startDate) ?? 0,
  }))
}

export function estimateCycleDaysRemaining(cycles: BudgetCycle[], cycleId: string, referenceDate: Date) {
  const cycleIndex = cycles.findIndex((cycle) => cycle.id === cycleId)
  if (cycleIndex < 0) return null

  const cycle = cycles[cycleIndex]
  if (cycle.endDate) {
    return Math.max(0, differenceInCalendarDays(addDays(parseISO(cycle.endDate), 1), referenceDate))
  }

  const completedLengths = cycles
    .slice(0, cycleIndex)
    .filter((item) => item.endDate)
    .map((item) => differenceInCalendarDays(addDays(parseISO(item.endDate!), 1), parseISO(item.startDate)))
    .slice(-3)

  if (completedLengths.length < 2) return null
  const averageLength = Math.round(completedLengths.reduce((sum, length) => sum + length, 0) / completedLengths.length)
  const estimatedNextIncome = addDays(parseISO(cycle.startDate), averageLength)
  return Math.max(0, differenceInCalendarDays(estimatedNextIncome, referenceDate))
}
