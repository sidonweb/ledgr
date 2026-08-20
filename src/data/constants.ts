import { format } from 'date-fns'
import type { AppState, BudgetType, SpendingBudgetType, Transaction } from '../types'
import { createId } from '../utils/id'
import { defaultCategories, defaultPaymentModes } from '../utils/settings'

export { defaultCategories }

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const spendingBudgetTypes: SpendingBudgetType[] = ['Need', 'Want', 'Saving']
export const budgetTypes: BudgetType[] = [...spendingBudgetTypes, 'Income']
export const appName = 'Ledgr.'
export const authTokenKey = 'ledgr-auth-token'
export const legacyAuthTokenKey = 'where-did-my-money-go-auth-token'
export const today = new Date()

export const emptyDraft = {
  date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  categoryId: defaultCategories[0].id,
  amount: '',
  paymentMode: 'UPI',
  notes: '',
}

export const initialState: AppState = {
  settings: {
    startYear: today.getFullYear(),
    salary: 0,
    salaryGrowth: 10,
    weeklyLimit: 0,
    budgetCycleType: 'calendar',
    shakeToOpenLedger: true,
    rolloverEnabled: false,
    categories: defaultCategories,
    paymentModes: defaultPaymentModes,
  },
  transactions: [
    tx('2026-01-01', 'Uber late night - NYE', 'life-infra', 450, 'UPI', 'NYE cab home'),
    tx('2026-01-01', 'Brunch out with friends', 'lifestyle', 950, 'Credit Card', 'New year brunch'),
    tx('2026-01-01', 'Swiggy dinner', 'lifestyle', 380, 'UPI', 'Too tired to cook'),
    tx('2026-01-02', 'House Rent', 'life-infra', 12000, 'Bank Transfer', 'Monthly rent'),
    tx('2026-01-02', 'Groceries - BigBasket', 'life-infra', 1600, 'UPI', 'Monthly stock'),
    tx('2026-01-02', 'Swiggy lunch', 'lifestyle', 320, 'UPI', 'Office lunch'),
    tx('2026-01-03', 'Myntra sale - clothes', 'lifestyle', 3200, 'Credit Card', 'Sale haul'),
    tx('2026-01-03', 'Movie + popcorn', 'lifestyle', 800, 'UPI', 'Weekend movie'),
    tx('2026-01-05', 'Gym renewal', 'performance-growth', 1500, 'Credit Card', 'Quarterly plan'),
    tx('2026-01-08', 'SIP transfer', 'future-me', 10000, 'Bank Transfer', 'Monthly investing'),
    tx('2026-02-02', 'House Rent', 'life-infra', 12000, 'Bank Transfer', 'Monthly rent'),
    tx('2026-02-04', 'Groceries', 'life-infra', 2100, 'UPI', 'Monthly stock'),
    tx('2026-02-07', 'Concert tickets', 'lifestyle', 2600, 'Credit Card', 'Saturday plan'),
    tx('2026-02-11', 'Course subscription', 'performance-growth', 899, 'Debit Card', 'Learning'),
    tx('2026-02-14', 'Gift hamper', 'relationships', 1400, 'UPI', 'Birthday'),
    tx('2026-02-16', 'SIP transfer', 'future-me', 10000, 'Bank Transfer', 'Monthly investing'),
    tx('2026-03-02', 'House Rent', 'life-infra', 12000, 'Bank Transfer', 'Monthly rent'),
    tx('2026-03-06', 'Medical checkup', 'life-infra', 1800, 'Debit Card', 'Annual tests'),
    tx('2026-03-09', 'Weekend trip', 'lifestyle', 7200, 'Credit Card', 'Short break'),
    tx('2026-03-18', 'Books', 'performance-growth', 950, 'UPI', 'Career reading'),
    tx('2026-03-20', 'Family dinner', 'relationships', 2500, 'Credit Card', 'Treat'),
    tx('2026-03-25', 'SIP transfer', 'future-me', 10000, 'Bank Transfer', 'Monthly investing'),
    tx('2026-04-01', 'House Rent', 'life-infra', 12000, 'Bank Transfer', 'Monthly rent'),
    tx('2026-04-01', 'Groceries', 'life-infra', 1600, 'UPI', 'Monthly stock'),
    tx('2026-04-01', 'April SIP', 'future-me', 10000, 'Bank Transfer', 'Monthly investing'),
    tx('2026-04-02', 'Cab to airport', 'life-infra', 1079, 'UPI', 'Early flight'),
    tx('2026-04-03', 'Dinner out', 'lifestyle', 2180, 'Credit Card', 'Friends'),
    tx('2026-04-04', 'House supplies', 'life-infra', 1580, 'UPI', 'Cleaning supplies'),
    tx('2026-04-05', 'Streaming subscriptions', 'lifestyle', 768, 'Credit Card', 'Monthly'),
    tx('2026-04-06', 'Groceries top-up', 'life-infra', 1580, 'UPI', 'Vegetables and staples'),
    tx('2026-04-07', 'Online workshop', 'performance-growth', 1260, 'Debit Card', 'Skill building'),
    tx('2026-04-08', 'Birthday gift', 'relationships', 1329, 'UPI', 'Friend'),
    tx('2026-04-09', 'Coffee meetings', 'lifestyle', 420, 'UPI', 'Work catchups'),
    tx('2026-04-10', 'Doctor consultation', 'life-infra', 1000, 'Debit Card', 'Routine'),
    tx('2026-04-11', 'Weekend food crawl', 'lifestyle', 2330, 'Credit Card', 'Saturday'),
    tx('2026-04-12', 'Metro recharge', 'life-infra', 930, 'UPI', 'Commute'),
  ],
}

function tx(date: string, description: string, categoryId: string, amount: number, paymentMode: string, notes: string): Transaction {
  return {
    id: createId(),
    date,
    description,
    categoryId,
    amount,
    paymentMode,
    notes,
  }
}
