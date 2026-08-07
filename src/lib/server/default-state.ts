import type { AppState } from '@/types'
import { defaultIncomeCategory } from '@/utils/settings'

const defaultCategories = [
  { id: 'life-infra', name: 'Life Infrastructure', type: 'Need' as const, color: '#2B5D8A' },
  { id: 'future-me', name: 'Future Me', type: 'Saving' as const, color: '#A3A3A3' },
  { id: 'performance-growth', name: 'Performance & Growth', type: 'Need' as const, color: '#374151' },
  { id: 'relationships', name: 'Relationships & Generosity', type: 'Want' as const, color: '#111827' },
  { id: 'lifestyle', name: 'Lifestyle Enjoyment', type: 'Want' as const, color: '#7FD3FF' },
  defaultIncomeCategory,
]

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
      categories: defaultCategories,
      paymentModes: ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Bank Transfer'],
    },
    transactions: [],
  }
}
