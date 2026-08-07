'use client'

import { endOfMonth, format, isWithinInterval, parseISO } from 'date-fns'
import {
  CalendarDays,
  Filter,
  LayoutDashboard,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LandingAuth } from './components/layout/LandingAuth'
import { LaunchScreen } from './components/layout/LaunchScreen'
import { BrandWordmark } from './components/layout/BrandWordmark'
import { NavButton } from './components/ui/NavButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/Select'
import { Label } from './components/ui/label'
import { authTokenKey, initialState, legacyAuthTokenKey, monthNames, today } from './data/constants'
import { Analysis } from './screens/Analysis'
import { AskAi } from './screens/AskAi'
import { Dashboard } from './screens/Dashboard'
import { Ledger } from './screens/Ledger'
import { Profile } from './screens/Profile'
import { YearCalendar } from './screens/YearCalendar'
import {
  authenticate,
  changePassword,
  fetchSession,
  importState,
  logout,
  removeTransaction,
  resetState,
  saveSettings,
  saveTransaction,
  updateProfile,
  type AuthInput,
} from './services/api'
import type { ApiStatus, AppState, SettingsState, Tab, Transaction, User } from './types'
import { downloadFile, escapeCsv, formatMoney } from './utils/format'
import { buildBudgetCycles, buildDailyTrend, buildMonthlyModel, buildSalaryPlans, estimateCycleDaysRemaining } from './utils/models'

function App() {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState<AppState>(initialState)
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    const token = localStorage.getItem(authTokenKey) ?? localStorage.getItem(legacyAuthTokenKey) ?? ''
    if (token && !localStorage.getItem(authTokenKey)) localStorage.setItem(authTokenKey, token)
    return token
  })
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const tab = getTabFromPath(pathname ?? '/')
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedCycleId, setSelectedCycleId] = useState('')
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const [apiMessage, setApiMessage] = useState('Connecting to PostgreSQL')
  const [transactionsVersion, setTransactionsVersion] = useState(0)
  const lastShakeAt = useRef(0)

  useEffect(() => {
    if (!authToken) {
      setAuthChecked(true)
      setApiStatus('offline')
      setApiMessage('Sign in to sync')
      return
    }

    let cancelled = false
    fetchSession(authToken)
      .then((payload) => {
        if (cancelled) return
        setUser(payload.user)
        setState(payload.state)
        setApiStatus('online')
        setApiMessage('Saved')
        setAuthChecked(true)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        localStorage.removeItem(authTokenKey)
        localStorage.removeItem(legacyAuthTokenKey)
        setAuthToken('')
        setUser(null)
        setApiStatus('offline')
        setApiMessage(error instanceof Error ? error.message : 'API unavailable')
        setAuthChecked(true)
      })

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    if (!authToken || !user || !state.settings.shakeToOpenLedger) return

    let motionPermissionAsked = false

    async function requestMotionPermission() {
      if (motionPermissionAsked) return
      motionPermissionAsked = true
      const motionEvent = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
      await motionEvent.requestPermission?.().catch(() => undefined)
    }

    function openLedgerOnShake(event: DeviceMotionEvent) {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration) return
      const force = Math.abs(acceleration.x ?? 0) + Math.abs(acceleration.y ?? 0) + Math.abs(acceleration.z ?? 0)
      const now = Date.now()
      if (force > 34 && now - lastShakeAt.current > 1200) {
        lastShakeAt.current = now
        router.push('/ledger')
      }
    }

    window.addEventListener('pointerdown', requestMotionPermission, { once: true })
    window.addEventListener('devicemotion', openLedgerOnShake)
    return () => {
      window.removeEventListener('pointerdown', requestMotionPermission)
      window.removeEventListener('devicemotion', openLedgerOnShake)
    }
  }, [authToken, router, state.settings.shakeToOpenLedger, user])

  const categoryById = useMemo(() => new Map(state.settings.categories.map((category) => [category.id, category])), [state.settings.categories])
  const years = useMemo(() => Array.from({ length: 5 }, (_, index) => state.settings.startYear + index), [state.settings.startYear])
  const selectedMonthStart = useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedYear, selectedMonth])
  const selectedMonthEnd = useMemo(() => endOfMonth(selectedMonthStart), [selectedMonthStart])
  const budgetCycles = useMemo(() => buildBudgetCycles(state.transactions, categoryById), [categoryById, state.transactions])
  const availableCycles = useMemo(
    () => budgetCycles.filter((cycle) => cycle.startDate <= format(today, 'yyyy-MM-dd')),
    [budgetCycles],
  )
  const activeCycle = availableCycles.at(-1)
  const selectedCycle = availableCycles.find((cycle) => cycle.id === selectedCycleId) ?? activeCycle
  const salaryCycleMode = state.settings.budgetCycleType === 'salary'
  const usingSalaryCycle = salaryCycleMode && Boolean(selectedCycle)
  const periodStart = usingSalaryCycle ? parseISO(selectedCycle!.startDate) : selectedMonthStart
  const periodEnd = usingSalaryCycle && selectedCycle?.endDate ? parseISO(selectedCycle.endDate) : usingSalaryCycle ? today : selectedMonthEnd

  useEffect(() => {
    if (!salaryCycleMode || availableCycles.length === 0) return
    if (!availableCycles.some((cycle) => cycle.id === selectedCycleId)) setSelectedCycleId(availableCycles.at(-1)!.id)
  }, [availableCycles, salaryCycleMode, selectedCycleId])

  const periodTransactions = useMemo(
    () =>
      state.transactions.filter((transaction) => {
        const date = parseISO(transaction.date)
        return isWithinInterval(date, { start: periodStart, end: periodEnd })
      }),
    [periodEnd, periodStart, state.transactions],
  )
  const previousCycleAmountLeft = useMemo(() => {
    if (!usingSalaryCycle || !state.settings.rolloverEnabled || !selectedCycle) return 0
    const index = availableCycles.findIndex((cycle) => cycle.id === selectedCycle.id)
    const previousCycle = index > 0 ? availableCycles[index - 1] : null
    if (!previousCycle?.endDate) return 0
    const previousTransactions = state.transactions.filter((transaction) =>
      isWithinInterval(parseISO(transaction.date), { start: parseISO(previousCycle.startDate), end: parseISO(previousCycle.endDate!) }),
    )
    return buildMonthlyModel(previousTransactions, state.settings, selectedYear, categoryById, previousCycle.income).amountLeft
  }, [availableCycles, categoryById, selectedCycle, selectedYear, state.settings, state.transactions, usingSalaryCycle])
  const monthly = useMemo(
    () =>
      buildMonthlyModel(
        periodTransactions,
        state.settings,
        selectedYear,
        categoryById,
        usingSalaryCycle ? (selectedCycle?.income ?? 0) + previousCycleAmountLeft : undefined,
      ),
    [categoryById, periodTransactions, previousCycleAmountLeft, selectedCycle?.income, selectedYear, state.settings, usingSalaryCycle],
  )
  const dailyTrend = useMemo(
    () => buildDailyTrend(periodStart, periodEnd, periodTransactions, categoryById),
    [categoryById, periodEnd, periodStart, periodTransactions],
  )
  const salaryPlans = useMemo(() => buildSalaryPlans(state.settings), [state.settings])
  const cycleIndicator = useMemo(() => {
    if (!salaryCycleMode) return undefined
    if (!selectedCycle) {
      return {
        message: 'Cycle length unknown yet',
        detail: 'Add an Income entry to begin salary-cycle tracking.',
      }
    }
    if (selectedCycle.id !== activeCycle?.id) {
      return { message: 'Completed salary cycle', detail: `Remaining balance: ${formatMoney(monthly.amountLeft)}` }
    }
    const remainingDays = estimateCycleDaysRemaining(budgetCycles, selectedCycle.id, today)
    return {
      message: remainingDays === null ? "We'll estimate cycle length after 2-3 salary credits" : `${selectedCycle.endDate ? '' : 'Est. '}${remainingDays} days left in this cycle`,
      detail: `Remaining balance: ${formatMoney(monthly.amountLeft)}`,
    }
  }, [activeCycle?.id, budgetCycles, monthly.amountLeft, salaryCycleMode, selectedCycle])
  const periodLabel = usingSalaryCycle && selectedCycle ? formatCycleLabel(selectedCycle.startDate, selectedCycle.endDate) : `${monthNames[selectedMonth]} ${selectedYear}`

  async function updateSettings(patch: Partial<SettingsState>) {
    const nextSettings = { ...state.settings, ...patch }
    setState((current) => ({ ...current, settings: nextSettings }))
    await persist(() => saveSettings(nextSettings))
  }

  async function upsertTransaction(input: Transaction) {
    if (salaryCycleMode && activeCycle && input.date < activeCycle.startDate) {
      toast.info('This entry affects an earlier salary cycle', {
        description: 'It changes totals for a cycle that already ended.',
      })
    }
    const optimistic = (current: AppState): AppState => {
      const exists = current.transactions.some((transaction) => transaction.id === input.id)
      return {
        ...current,
        transactions: exists
          ? current.transactions.map((transaction) => (transaction.id === input.id ? input : transaction))
          : [input, ...current.transactions],
      }
    }
    setState(optimistic)
    await persist(() => saveTransaction(input))
    setTransactionsVersion((version) => version + 1)
  }

  async function deleteTransaction(id: string) {
    setState((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }))
    await persist(() => removeTransaction(id))
    setTransactionsVersion((version) => version + 1)
  }

  async function resetDemo() {
    await persist(resetState, 'Workspace reset')
    setSelectedMonth(today.getMonth())
    setSelectedYear(today.getFullYear())
    setTransactionsVersion((version) => version + 1)
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as AppState
      if (!parsed.settings || !Array.isArray(parsed.transactions)) throw new Error('This is not a valid Track Your Money backup')
      await persist(() => importState(parsed), 'Backup imported')
      setTransactionsVersion((version) => version + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not import backup'
      toast.error('Import failed', { description: message })
    }
  }

  function exportJson() {
    downloadFile(`ledgr-${format(new Date(), 'yyyy-MM-dd')}.json`, JSON.stringify(state, null, 2), 'application/json')
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Description', 'Category', 'Amount', 'Payment Mode', 'Type', 'Notes'],
      ...state.transactions
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((transaction) => {
          const category = categoryById.get(transaction.categoryId)
          return [
            transaction.date,
            transaction.description,
            category?.name ?? 'Uncategorized',
            transaction.amount.toFixed(2),
            transaction.paymentMode,
            category?.type ?? '',
            transaction.notes,
          ]
        }),
    ]
    downloadFile(
      `daily-expense-tracker-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      rows.map((row) => row.map(escapeCsv).join(',')).join('\n'),
      'text/csv',
    )
  }

  async function persist(action: () => Promise<AppState>, successMessage?: string) {
    setApiStatus('saving')
    setApiMessage('Saving')
    try {
      const serverState = await action()
      setState(serverState)
      setApiStatus('online')
      setApiMessage('Saved')
      if (successMessage) toast.success(successMessage)
    } catch (error) {
      setApiStatus('offline')
      setApiMessage(error instanceof Error ? error.message : 'Database sync failed')
      toast.error('Changes were not saved', { description: error instanceof Error ? error.message : 'Database sync failed' })
    }
  }

  async function handleAuth(input: AuthInput) {
    setApiStatus('saving')
    setApiMessage(input.mode === 'signup' ? 'Creating account' : 'Signing in')
    try {
      const payload = await authenticate(input)
      localStorage.setItem(authTokenKey, payload.token)
      localStorage.removeItem(legacyAuthTokenKey)
      setAuthToken(payload.token)
      setUser(payload.user)
      setState(payload.state)
      setApiStatus('online')
      setApiMessage('Saved')
    } catch (error) {
      setApiStatus('offline')
      setApiMessage(error instanceof Error ? error.message : 'Authentication failed')
      toast.error('Could not sign in', { description: error instanceof Error ? error.message : 'Authentication failed' })
      throw error
    }
  }

  async function handleLogout() {
    await logout().catch(() => undefined)
    localStorage.removeItem(authTokenKey)
    localStorage.removeItem(legacyAuthTokenKey)
    setAuthToken('')
    setUser(null)
    setState(initialState)
    setApiStatus('offline')
    setApiMessage('Signed out')
  }

  async function handleUpdateProfile(input: { name: string }) {
    const updatedUser = await updateProfile(input)
    setUser(updatedUser)
  }

  if (!authChecked) {
    return <LaunchScreen />
  }

  if (!authToken || !user) {
    return <LandingAuth message={apiMessage} onAuth={handleAuth} />
  }

  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:sticky md:top-0 md:h-screen md:border-t-0 md:border-r md:p-5">
        <div className="hidden md:flex">
          <BrandWordmark className="text-2xl text-foreground" />
        </div>

        <nav className="grid grid-cols-6 gap-1 md:mt-10 md:grid-cols-1 md:gap-1.5" aria-label="Primary">
          <NavButton icon={<LayoutDashboard size={18} />} label="Dashboard" active={tab === 'dashboard'} onClick={() => router.push('/dashboard')} />
          <NavButton icon={<Filter size={18} />} label="Analysis" active={tab === 'analysis'} onClick={() => router.push('/analysis')} />
          <NavButton icon={<Sparkles size={18} />} label="Ask AI" active={tab === 'ask-ai'} onClick={() => router.push('/ask-ai')} />
          <NavButton icon={<WalletCards size={18} />} label="Ledger" active={tab === 'ledger'} onClick={() => router.push('/ledger')} />
          <NavButton icon={<CalendarDays size={18} />} label="Calendar" active={tab === 'calendar'} onClick={() => router.push('/calendar')} />
          <NavButton icon={<UserRound size={18} />} label="Profile" active={tab === 'profile'} onClick={() => router.push('/profile')} />
        </nav>

        <div className="mt-auto hidden space-y-2 md:block md:absolute md:right-5 md:bottom-5 md:left-5">
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span className={`size-2 rounded-full ${apiStatus === 'online' ? 'bg-foreground' : apiStatus === 'saving' || apiStatus === 'loading' ? 'animate-pulse bg-muted-foreground' : 'bg-destructive'}`} />
            {apiMessage}
          </div>
        </div>
      </aside>

      <section className="min-w-0 px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pt-7 md:pb-8">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-extrabold tracking-[.2em] text-primary uppercase">{tab === 'profile' ? 'Your workspace' : tab === 'ask-ai' ? 'Your financial copilot' : tab === 'dashboard' ? periodLabel : `${monthNames[selectedMonth]} ${selectedYear}`}</p>
            <h1 className="text-3xl font-extrabold  sm:text-4xl">{tab === 'dashboard' && usingSalaryCycle ? 'This Cycle' : getTabTitle(tab)}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Hello, {user.name}!
            </p>
          </div>
          {tab === 'dashboard' && usingSalaryCycle ? (
            <div className="grid gap-1.5">
              <Label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Budget Cycle</Label>
              <Select value={selectedCycle?.id} onValueChange={setSelectedCycleId}>
                <SelectTrigger className="min-w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableCycles.slice().reverse().map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>{formatCycleLabel(cycle.startDate, cycle.endDate)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : tab !== 'profile' && tab !== 'ask-ai' && <div className="flex items-end gap-2">
            <div className="grid gap-1.5">
              <Label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Month</Label>
              <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger className="min-w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{monthNames.map((month, index) => <SelectItem key={month} value={String(index)}>{month}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Year</Label>
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="min-w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>}
        </header>

        {tab === 'dashboard' && (
          <Dashboard
            monthly={monthly}
            dailyTrend={dailyTrend}
            categoryById={categoryById}
            transactions={periodTransactions}
            cycleIndicator={cycleIndicator}
            incomeLabel={usingSalaryCycle ? 'Cycle Income' : 'Monthly Salary'}
          />
        )}
        {tab === 'analysis' && (
          <Analysis
            categoryById={categoryById}
            settings={state.settings}
            selectedMonthStart={selectedMonthStart}
            transactions={state.transactions}
            selectedYear={selectedYear}
            monthly={monthly}
          />
        )}
        {tab === 'ask-ai' && <AskAi />}
        {tab === 'ledger' && (
          <Ledger
            categoryById={categoryById}
            settings={state.settings}
            transactionsVersion={transactionsVersion}
            onUpsert={upsertTransaction}
            onDelete={deleteTransaction}
            onExportCsv={exportCsv}
          />
        )}
        {tab === 'calendar' && <YearCalendar categoryById={categoryById} selectedYear={selectedYear} transactions={state.transactions} />}
        {tab === 'profile' && (
          <Profile
            user={user}
            settings={state.settings}
            salaryPlans={salaryPlans}
            onUpdateUser={handleUpdateProfile}
            onChangePassword={changePassword}
            onImportJson={importJson}
            onUpdateSettings={updateSettings}
            onExportJson={exportJson}
            onReset={() => void resetDemo()}
            onLogout={() => void handleLogout()}
          />
        )}
      </section>
    </main>
  )
}

function getTabTitle(tab: Tab) {
  const titles: Record<Tab, string> = {
    dashboard: 'This Month',
    ledger: 'Daily Expense Tracker',
    analysis: 'Weekly Analysis',
    'ask-ai': 'Ask AI',
    calendar: 'Yearly Calendar',
    profile: 'Profile & Settings',
  }
  return titles[tab]
}

function getTabFromPath(pathname: string): Tab {
  const candidate = pathname.split('/').filter(Boolean)[0]
  return candidate === 'analysis' || candidate === 'ask-ai' || candidate === 'ledger' || candidate === 'calendar' || candidate === 'profile'
    ? candidate
    : 'dashboard'
}

function formatCycleLabel(startDate: string, endDate: string | null) {
  const start = format(parseISO(startDate), 'dd MMM yyyy')
  const end = endDate ? format(parseISO(endDate), 'dd MMM yyyy') : 'Present'
  return `${start} - ${end}`
}

export default App
