import type { Category, SettingsState } from '../types'

export const defaultIncomeCategory: Category = {
  id: 'income',
  name: 'Salary / Income',
  type: 'Income',
  color: '#2B5D8A',
}

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
