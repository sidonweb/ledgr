import type { AppState } from '@/types'
import { defaultCategories, defaultPaymentModes } from '@/utils/settings'

export function buildEmptyState(): AppState {
  return {
    settings: {
      startYear: new Date().getFullYear(),
      salary: 0,
      salaryGrowth: 10,
      weeklyLimit: 0,
      budgetCycleType: 'calendar',
      shakeToOpenLedger: true,
      rolloverEnabled: false,
      categories: defaultCategories.map((category) => ({ ...category })),
      paymentModes: [...defaultPaymentModes],
    },
    transactions: [],
  }
}
