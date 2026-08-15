import type { Category, SettingsState } from '../types'

export const defaultIncomeCategory: Category = {
  id: 'income',
  name: 'Salary / Income',
  type: 'Income',
  color: '#1F7A54',
}

/**
 * The starting category palette. Client seed data and the server's empty state
 * both read it from here so the two can never drift apart.
 */
export const defaultCategories: Category[] = [
  { id: 'life-infra', name: 'Life Infrastructure', type: 'Need', color: '#2C6390' },
  { id: 'future-me', name: 'Future Me', type: 'Saving', color: '#1F7A54' },
  { id: 'performance-growth', name: 'Performance & Growth', type: 'Need', color: '#4A8296' },
  { id: 'relationships', name: 'Relationships & Generosity', type: 'Want', color: '#7B5E9E' },
  { id: 'lifestyle', name: 'Lifestyle Enjoyment', type: 'Want', color: '#B57611' },
  defaultIncomeCategory,
]

export const defaultPaymentModes = ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Bank Transfer']

export function normalizeSettings(settings: SettingsState): SettingsState {
  const hasIncomeCategory = settings.categories.some((category) => category.type === 'Income')

  return {
    ...settings,
    budgetCycleType: settings.budgetCycleType === 'salary' ? 'salary' : 'calendar',
    shakeToOpenLedger: settings.shakeToOpenLedger !== false,
    rolloverEnabled: settings.rolloverEnabled === true,
    categories: hasIncomeCategory ? settings.categories : [...settings.categories, { ...defaultIncomeCategory }],
  }
}
