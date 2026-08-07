import { describe, expect, it } from 'vitest'
import type { Category, SettingsState, Transaction } from '../types'
import {
  buildBudgetCycles,
  buildMonthlyModel,
  buildPaymentRows,
  buildSalaryPlans,
  buildWeeklyRows,
  estimateCycleDaysRemaining,
  typeColor,
} from './models'

function makeSettings(overrides: Partial<SettingsState> = {}): SettingsState {
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
    paymentModes: ['UPI', 'Cash'],
    ...overrides,
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

describe('buildSalaryPlans', () => {
  it('compounds salary growth year over year', () => {
    const plans = buildSalaryPlans(makeSettings({ salary: 10000, salaryGrowth: 10, startYear: 2026 }))
    expect(plans).toHaveLength(5)
    expect(plans[0]).toMatchObject({ year: 2026, salary: 10000 })
    expect(plans[1].salary).toBe(11000)
    expect(plans[2].salary).toBe(12100)
  })

  it('splits each year into 50/30/20 need/want/saving', () => {
    const [plan] = buildSalaryPlans(makeSettings({ salary: 10000 }))
    expect(plan.need).toBe(5000)
    expect(plan.want).toBe(3000)
    expect(plan.saving).toBe(2000)
  })
})

describe('buildMonthlyModel', () => {
  it('computes budget vs actual for a normal cycle', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    const transactions = [
      makeTransaction({ categoryId: 'need-1', amount: 3000 }),
      makeTransaction({ categoryId: 'want-1', amount: 1000 }),
      makeTransaction({ categoryId: 'saving-1', amount: 2000 }),
    ]
    const model = buildMonthlyModel(transactions, settings, 2026, categoryById)
    expect(model.salary).toBe(10000)
    expect(model.totalActual).toBe(6000)
    expect(model.amountLeft).toBe(4000)
    expect(model.actualByType).toEqual({ Need: 3000, Want: 1000, Saving: 2000 })
    expect(model.score).toBeGreaterThan(0)
  })

  it('goes negative and tanks the score when expenses exceed income', () => {
    const settings = makeSettings({ salary: 10000 })
    const categoryById = makeCategoryById(settings)
    const transactions = [makeTransaction({ categoryId: 'need-1', amount: 13000 })]
    const model = buildMonthlyModel(transactions, settings, 2026, categoryById)
    expect(model.amountLeft).toBe(-3000)
    expect(model.percentageLeft).toBeLessThan(0)
    expect(model.score).toBeCloseTo(1.6)
  })

  it('uses incomeOverride instead of the settings salary when provided', () => {
    const settings = makeSettings({ salary: 10000 })
    const categoryById = makeCategoryById(settings)
    const model = buildMonthlyModel([], settings, 2026, categoryById, 25000)
    expect(model.salary).toBe(25000)
    expect(model.amountLeft).toBe(25000)
  })

  it('ignores Income-type transactions when computing actual spend', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    const transactions = [makeTransaction({ categoryId: 'income-1', amount: 10000 }), makeTransaction({ categoryId: 'need-1', amount: 500 })]
    const model = buildMonthlyModel(transactions, settings, 2026, categoryById)
    expect(model.totalActual).toBe(500)
  })
})

describe('buildBudgetCycles', () => {
  it('derives cycle boundaries from income transaction dates', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    const transactions = [
      makeTransaction({ categoryId: 'income-1', date: '2026-01-01', amount: 10000 }),
      makeTransaction({ categoryId: 'income-1', date: '2026-01-28', amount: 11000 }),
    ]
    const cycles = buildBudgetCycles(transactions, categoryById)
    expect(cycles).toHaveLength(2)
    expect(cycles[0]).toMatchObject({ startDate: '2026-01-01', endDate: '2026-01-27', income: 10000 })
    expect(cycles[1]).toMatchObject({ startDate: '2026-01-28', endDate: null, income: 11000 })
  })

  it('returns no cycles when there is no income transaction', () => {
    const settings = makeSettings()
    const categoryById = makeCategoryById(settings)
    expect(buildBudgetCycles([makeTransaction({ categoryId: 'need-1' })], categoryById)).toHaveLength(0)
  })
})

describe('estimateCycleDaysRemaining', () => {
  it('returns null when fewer than 2 completed cycles exist', () => {
    const cycles = [{ id: 'a', startDate: '2026-01-01', endDate: null, income: 10000 }]
    expect(estimateCycleDaysRemaining(cycles, 'a', new Date('2026-01-10'))).toBeNull()
  })

  it('estimates remaining days from the average of past completed cycles', () => {
    const cycles = [
      { id: 'a', startDate: '2026-01-01', endDate: '2026-01-30', income: 10000 },
      { id: 'b', startDate: '2026-01-31', endDate: '2026-03-01', income: 10000 },
      { id: 'c', startDate: '2026-03-02', endDate: null, income: 10000 },
    ]
    const result = estimateCycleDaysRemaining(cycles, 'c', new Date('2026-03-05'))
    expect(result).not.toBeNull()
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('returns days remaining directly for a cycle with a known end date', () => {
    const cycles = [{ id: 'a', startDate: '2026-01-01', endDate: '2026-01-10', income: 10000 }]
    expect(estimateCycleDaysRemaining(cycles, 'a', new Date('2026-01-08'))).toBe(3)
  })
})

describe('buildWeeklyRows', () => {
  it('buckets spend by week and compares against the weekly limit', () => {
    const transactions = [makeTransaction({ date: '2026-01-05', amount: 500 }), makeTransaction({ date: '2026-01-06', amount: 300 })]
    const rows = buildWeeklyRows(new Date('2026-01-01'), new Date('2026-01-14'), transactions, 1000)
    const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0)
    expect(totalSpend).toBe(800)
    expect(rows.every((row) => row.limit === 1000)).toBe(true)
  })
})

describe('buildPaymentRows', () => {
  it('sums amounts per payment mode, sorted descending', () => {
    const rows = buildPaymentRows([
      makeTransaction({ paymentMode: 'UPI', amount: 100 }),
      makeTransaction({ paymentMode: 'Cash', amount: 500 }),
      makeTransaction({ paymentMode: 'UPI', amount: 50 }),
    ])
    expect(rows).toEqual([
      { mode: 'Cash', amount: 500 },
      { mode: 'UPI', amount: 150 },
    ])
  })
})

describe('typeColor', () => {
  it('returns a distinct color per budget type', () => {
    expect(typeColor('Need')).toBe('#2B5D8A')
    expect(typeColor('Want')).toBe('#7FD3FF')
    expect(typeColor('Saving')).toBe('#374151')
  })
})
