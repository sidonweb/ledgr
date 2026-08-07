import { describe, expect, it } from 'vitest'
import type { Category, SettingsState, Transaction } from '../types'
import { buildCycleReview } from './cycleReview'
import { buildMonthlyModel } from './models'

function makeSettings(): SettingsState {
  return {
    startYear: 2026,
    salary: 10000,
    salaryGrowth: 10,
    weeklyLimit: 2000,
    budgetCycleType: 'calendar',
    shakeToOpenLedger: true,
    rolloverEnabled: false,
    categories: [
      { id: 'need-1', name: 'Rent', type: 'Need', color: '#111' },
      { id: 'want-1', name: 'Fun', type: 'Want', color: '#222' },
      { id: 'saving-1', name: 'SIP', type: 'Saving', color: '#333' },
      { id: 'income-1', name: 'Salary', type: 'Income', color: '#444' },
    ],
    paymentModes: ['UPI'],
  }
}

function makeCategoryById(settings: SettingsState) {
  return new Map<string, Category>(settings.categories.map((category) => [category.id, category]))
}

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    date: '2026-01-05',
    description: 'Test',
    categoryId: 'need-1',
    amount: 100,
    paymentMode: 'UPI',
    notes: '',
    ...overrides,
  }
}

describe('buildCycleReview', () => {
  it('gives a good headline and no over-budget or under-saving suggestions for a healthy cycle', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    const transactions = [makeTransaction({ categoryId: 'need-1', amount: 3000 }), makeTransaction({ categoryId: 'saving-1', amount: 2000 })]
    const monthly = buildMonthlyModel(transactions, settings, 2026, categoryById)
    const review = buildCycleReview(monthly, transactions, categoryById)
    expect(review.tone).toBe('good')
    expect(review.suggestions.some((suggestion) => suggestion.includes('exceeded'))).toBe(false)
    expect(review.suggestions.some((suggestion) => suggestion.includes('saving goal'))).toBe(false)
  })

  it('flags over-budget categories and a critical tone on heavy overspend', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    const transactions = [makeTransaction({ categoryId: 'need-1', amount: 13000 })]
    const monthly = buildMonthlyModel(transactions, settings, 2026, categoryById)
    const review = buildCycleReview(monthly, transactions, categoryById)
    expect(review.tone).toBe('critical')
    expect(review.suggestions.some((suggestion) => suggestion.includes('Need budget'))).toBe(true)
    expect(review.suggestions.some((suggestion) => suggestion.includes('saving goal'))).toBe(true)
  })

  it('calls out a weekend spending pattern when weekends run much higher', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    const transactions = [
      makeTransaction({ categoryId: 'want-1', date: '2026-01-05', amount: 100 }), // Monday
      makeTransaction({ categoryId: 'want-1', date: '2026-01-06', amount: 100 }), // Tuesday
      makeTransaction({ categoryId: 'want-1', date: '2026-01-03', amount: 1000 }), // Saturday
      makeTransaction({ categoryId: 'want-1', date: '2026-01-04', amount: 1000 }), // Sunday
    ]
    const monthly = buildMonthlyModel(transactions, settings, 2026, categoryById)
    const review = buildCycleReview(monthly, transactions, categoryById)
    expect(review.suggestions.some((suggestion) => suggestion.includes('weekends'))).toBe(true)
  })
})
