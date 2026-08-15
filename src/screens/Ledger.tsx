import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { Download, Pencil, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { budgetTypes } from '../data/constants'
import { fetchTransactionsPage } from '../services/api'
import type { BudgetType, Category, PageInfo, SettingsState, Transaction } from '../types'
import { formatMoney } from '../utils/format'
import { cn } from '../utils/cn'

const PAGE_SIZE = 25

/** "Today", "Yesterday", then "Tue, 12 Aug" — the way you'd say the date out loud. */
function dayHeading(date: string) {
  const parsed = parseISO(date)
  if (isToday(parsed)) return 'Today'
  if (isYesterday(parsed)) return 'Yesterday'
  return format(parsed, 'EEE, dd MMM yyyy')
}

export function Ledger({
  categoryById,
  settings,
  transactionsVersion,
  onUpsert,
  onDelete,
  onExportCsv,
}: {
  categoryById: Map<string, Category>
  settings: SettingsState
  transactionsVersion: number
  onUpsert: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onExportCsv: () => void
}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | BudgetType>('All')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageTransactions, setPageTransactions] = useState<Transaction[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo>({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false })
  const [loadingPage, setLoadingPage] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery, typeFilter])

  const categoryIds = useMemo(
    () => (typeFilter === 'All' ? undefined : settings.categories.filter((category) => category.type === typeFilter).map((category) => category.id)),
    [settings.categories, typeFilter],
  )

  useEffect(() => {
    let cancelled = false
    setLoadingPage(true)
    fetchTransactionsPage({ limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE, search: debouncedQuery || undefined, categoryIds })
      .then((page) => {
        if (cancelled) return
        setPageTransactions(page.transactions)
        setPageInfo(page.pageInfo)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        toast.error('Could not load transactions', { description: error instanceof Error ? error.message : 'Please try again' })
      })
      .finally(() => {
        if (!cancelled) setLoadingPage(false)
      })
    return () => {
      cancelled = true
    }
  }, [categoryIds, currentPage, debouncedQuery, transactionsVersion])

  const totalPages = Math.max(1, Math.ceil(pageInfo.total / PAGE_SIZE))
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  /** A passbook reads day by day, with each day totalled. */
  const days = useMemo(() => {
    const grouped = new Map<string, Transaction[]>()
    for (const transaction of pageTransactions) {
      const bucket = grouped.get(transaction.date) ?? []
      bucket.push(transaction)
      grouped.set(transaction.date, bucket)
    }
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => {
        let spent = 0
        let received = 0
        for (const entry of entries) {
          if (categoryById.get(entry.categoryId)?.type === 'Income') received += entry.amount
          else spent += entry.amount
        }
        return { date, entries, spent, received }
      })
  }, [categoryById, pageTransactions])

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input aria-label="Search ledger" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your ledger" />
          </div>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'All' | BudgetType)}>
            <SelectTrigger aria-label="Filter by type" className="min-w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All types</SelectItem>
              {budgetTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onExportCsv} type="button" variant="outline">
            <Download /> Export
          </Button>
        </CardContent>
      </Card>

      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        {loadingPage && <p className="px-5 py-20 text-center text-sm text-muted-foreground">Loading your entries…</p>}

        {!loadingPage && pageInfo.total === 0 && (
          <div className="px-5 py-20 text-center">
            <p className="text-sm font-medium">No entries match these filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">Clear the search, or press N to add one.</p>
          </div>
        )}

        {!loadingPage &&
          days.map((day) => (
            <section key={day.date}>
              <header className="flex items-baseline justify-between gap-4 border-b bg-muted/40 px-5 py-2.5">
                <h3 className="text-xs font-medium">{dayHeading(day.date)}</h3>
                <span className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
                  {day.received > 0 && <span className="text-positive">+{formatMoney(day.received)}</span>}
                  {day.spent > 0 && <span>−{formatMoney(day.spent)}</span>}
                </span>
              </header>

              <ul>
                {day.entries.map((transaction) => {
                  const category = categoryById.get(transaction.categoryId)
                  const isIncome = category?.type === 'Income'
                  return (
                    <li className="border-b last:border-0" key={transaction.id}>
                      <button
                        aria-label={`Edit ${transaction.description}`}
                        className="group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                        onClick={() => setEditing(transaction)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{transaction.description}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                            <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: category?.color }} />
                            {category?.name ?? 'Uncategorised'}
                            <span aria-hidden>·</span>
                            {transaction.paymentMode}
                            {transaction.notes && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="truncate">{transaction.notes}</span>
                              </>
                            )}
                          </span>
                        </span>

                        <span className={cn('shrink-0 text-sm font-medium tabular-nums', isIncome && 'text-positive')}>
                          {isIncome ? '+' : ''}
                          {formatMoney(transaction.amount)}
                        </span>

                        <Pencil
                          aria-hidden
                          className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-40"
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
      </Card>

      {pageInfo.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs tabular-nums text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, pageInfo.total)} of {pageInfo.total}
          </p>
          <div className="flex items-center gap-2">
            <Button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} size="sm" variant="outline">Previous</Button>
            <span className="px-1 text-xs tabular-nums text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} size="sm" variant="outline">Next</Button>
          </div>
        </div>
      )}

      <EditEntryDialog
        categoryById={categoryById}
        onDelete={onDelete}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={onUpsert}
        settings={settings}
        transaction={editing}
      />
    </div>
  )
}

function EditEntryDialog({
  categoryById,
  onDelete,
  onOpenChange,
  onSave,
  settings,
  transaction,
}: {
  categoryById: Map<string, Category>
  onDelete: (id: string) => void
  onOpenChange: (open: boolean) => void
  onSave: (transaction: Transaction) => void
  settings: SettingsState
  transaction: Transaction | null
}) {
  const [draft, setDraft] = useState<Transaction | null>(transaction)

  useEffect(() => setDraft(transaction), [transaction])

  if (!draft) return <Dialog open={false} onOpenChange={onOpenChange}><DialogContent /></Dialog>

  const isIncome = categoryById.get(draft.categoryId)?.type === 'Income'
  const spendingCategories = settings.categories.filter((category) => category.type !== 'Income')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft) return
    if (!draft.description.trim() || draft.amount <= 0) {
      toast.error('Check the entry', { description: 'A description and an amount greater than zero are required.' })
      return
    }
    onSave(draft)
    toast.success('Entry updated')
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit entry</DialogTitle>
          <DialogDescription>Changes save to your ledger immediately.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                className="pl-7 tabular-nums"
                id="edit-amount"
                min="0"
                onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })}
                step="0.01"
                type="number"
                value={draft.amount}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input id="edit-description" onChange={(event) => setDraft({ ...draft, description: event.target.value })} value={draft.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input id="edit-date" onChange={(event) => setDraft({ ...draft, date: event.target.value })} type="date" value={draft.date} />
          </div>
          {!isIncome && (
            <>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={draft.categoryId} onValueChange={(value) => setDraft({ ...draft, categoryId: value })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {spendingCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: category.color }} />
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Payment mode</Label>
                <Select value={draft.paymentMode} onValueChange={(value) => setDraft({ ...draft, paymentMode: value })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {settings.paymentModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Input id="edit-notes" onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Optional" value={draft.notes} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ConfirmDialog
              destructive
              title="Delete this transaction?"
              description={`${draft.description} (${formatMoney(draft.amount)}) will be permanently removed.`}
              confirmLabel="Delete transaction"
              onConfirm={() => {
                onDelete(draft.id)
                onOpenChange(false)
              }}
              trigger={
                <Button className="text-muted-foreground hover:text-destructive" size="icon" title="Delete entry" type="button" variant="ghost">
                  <Trash2 />
                </Button>
              }
            />
            <Button className="ml-auto" onClick={() => onOpenChange(false)} type="button" variant="ghost">Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
