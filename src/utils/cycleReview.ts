import { parseISO } from 'date-fns'
import type { Category, Transaction } from '../types'
import { formatMoney } from './format'
import type { buildMonthlyModel } from './models'

export type CycleReview = {
  tone: 'good' | 'warning' | 'critical'
  headline: string
  suggestions: string[]
}

export function buildCycleReview(
  monthly: ReturnType<typeof buildMonthlyModel>,
  transactions: Transaction[],
  categoryById: Map<string, Category>,
): CycleReview {
  const tone: CycleReview['tone'] = monthly.score >= 8 ? 'good' : monthly.score >= 5 ? 'warning' : 'critical'
  const headline =
    tone === 'good' ? "You're on track this cycle." : tone === 'warning' ? 'Doing okay, but a few categories need attention.' : 'This cycle needs attention.'

  const suggestions: string[] = []

  for (const row of monthly.typeRows) {
    if (row.actual > row.budget) {
      suggestions.push(`You've exceeded your ${row.type} budget by ${formatMoney(row.actual - row.budget)}.`)
    }
  }

  const savingRow = monthly.typeRows.find((row) => row.type === 'Saving')
  if (savingRow && savingRow.actual < savingRow.budget) {
    suggestions.push(`You're behind on your saving goal by ${formatMoney(savingRow.budget - savingRow.actual)}.`)
  }

  const biggestCategory = monthly.categoryRows[0]
  if (biggestCategory && monthly.totalActual > 0 && biggestCategory.actual / monthly.totalActual > 0.3) {
    suggestions.push(`${biggestCategory.name} is your biggest expense this cycle at ${formatMoney(biggestCategory.actual)}.`)
  }

  const weekendPattern = buildWeekendPattern(transactions, categoryById)
  if (weekendPattern) suggestions.push(weekendPattern)

  return { tone, headline, suggestions }
}

function buildWeekendPattern(transactions: Transaction[], categoryById: Map<string, Category>) {
  let weekdaySpend = 0
  let weekdayCount = 0
  let weekendSpend = 0
  let weekendCount = 0

  for (const transaction of transactions) {
    const type = categoryById.get(transaction.categoryId)?.type
    if (type === 'Income' || type === 'Saving') continue
    const day = parseISO(transaction.date).getDay()
    if (day === 0 || day === 6) {
      weekendSpend += transaction.amount
      weekendCount += 1
    } else {
      weekdaySpend += transaction.amount
      weekdayCount += 1
    }
  }

  if (weekdayCount === 0 || weekendCount === 0) return null
  const weekdayAverage = weekdaySpend / weekdayCount
  const weekendAverage = weekendSpend / weekendCount
  if (weekendAverage > weekdayAverage * 1.3) {
    return `You tend to spend more on weekends (avg ${formatMoney(weekendAverage)} vs ${formatMoney(weekdayAverage)} on weekdays).`
  }
  return null
}
