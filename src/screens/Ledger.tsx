import { Check, Download, Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { PanelHeader } from '../components/ui/PanelHeader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { budgetTypes, emptyDraft } from '../data/constants'
import type { BudgetType, Category, SettingsState, Transaction } from '../types'
import { formatDate, formatMoney } from '../utils/format'
import { createId } from '../utils/id'

export function Ledger({
  categoryById,
  settings,
  transactions,
  onUpsert,
  onDelete,
  onExportCsv,
}: {
  categoryById: Map<string, Category>
  settings: SettingsState
  transactions: Transaction[]
  onUpsert: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onExportCsv: () => void
}) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | BudgetType>('All')
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const PAGE_SIZE = 10
  const [currentPage, setCurrentPage] = useState(1)
  useEffect(() => {
    setCurrentPage(1)
  }, [query, typeFilter])

  const incomeCategories = settings.categories.filter((category) => category.type === 'Income')
  const spendingCategories = settings.categories.filter((category) => category.type !== 'Income')
  const isIncomeDraft = categoryById.get(draft.categoryId)?.type === 'Income'

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return transactions
      .filter((transaction) => {
        const category = categoryById.get(transaction.categoryId)
        if (typeFilter !== 'All' && category?.type !== typeFilter) return false
        if (!normalizedQuery) return true
        return [transaction.description, transaction.notes, transaction.paymentMode, category?.name, category?.type]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [categoryById, query, transactions, typeFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(draft.amount)
    const description = draft.description.trim() || (isIncomeDraft ? 'Income' : '')
    if (!description || !draft.categoryId || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Check the entry', { description: `${isIncomeDraft ? 'A date and' : 'Description, category, and'} an amount greater than zero are required.` })
      return
    }
    onUpsert({
      id: editingId ?? createId(),
      date: draft.date,
      description,
      categoryId: draft.categoryId,
      amount,
      paymentMode: draft.paymentMode || settings.paymentModes[0] || 'Bank Transfer',
      notes: draft.notes.trim(),
    })
    setDraft({ ...emptyDraft, categoryId: spendingCategories[0]?.id ?? settings.categories[0]?.id ?? '', paymentMode: settings.paymentModes[0] ?? '' })
    setEditingId(null)
  }

  function changeEntryType(value: string) {
    const categoryId = value === 'income' ? incomeCategories[0]?.id : spendingCategories[0]?.id
    setDraft({ ...draft, categoryId: categoryId ?? draft.categoryId })
  }

  function edit(transaction: Transaction) {
    setEditingId(transaction.id)
    setDraft({
      date: transaction.date,
      description: transaction.description,
      categoryId: transaction.categoryId,
      amount: String(transaction.amount),
      paymentMode: transaction.paymentMode,
      notes: transaction.notes,
    })
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[350px_minmax(0,1fr)]">
      <Card>
        <CardHeader><PanelHeader title={editingId ? 'Edit Entry' : 'New Entry'} action="Daily tracker" /></CardHeader>
        <CardContent><form className="grid gap-4" onSubmit={submit}>
          <Field label="Entry Type">
            <Select value={isIncomeDraft ? 'income' : 'spending'} onValueChange={changeEntryType}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="spending">Expense / Saving</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent></Select>
          </Field>
          <Field label="Date" htmlFor="entry-date"><Input id="entry-date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></Field>
          <Field label={isIncomeDraft ? 'Description (optional)' : 'Description'} htmlFor="entry-description"><Input id="entry-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={isIncomeDraft ? 'e.g. Monthly salary' : 'e.g. Groceries'} /></Field>
          {!isIncomeDraft && <Field label="Category">
            <Select value={draft.categoryId} onValueChange={(value) => setDraft({ ...draft, categoryId: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              {spendingCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent></Select>
          </Field>}
          <Field label="Amount" htmlFor="entry-amount"><Input id="entry-amount" min="0" step="0.01" type="number" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} /></Field>
          {!isIncomeDraft && <Field label="Payment Mode">
            <Select value={draft.paymentMode} onValueChange={(value) => setDraft({ ...draft, paymentMode: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              {settings.paymentModes.map((mode) => (
                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
              ))}
            </SelectContent></Select>
          </Field>}
          <Field label="Notes" htmlFor="entry-notes"><Input id="entry-notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Optional" /></Field>
          <div className="flex justify-end gap-2 pt-1">
            {editingId && (
              <Button variant="outline" type="button" onClick={() => setEditingId(null)}>Cancel</Button>
            )}
            <Button type="submit">
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              {editingId ? 'Save' : 'Add'}
            </Button>
          </div>
        </form></CardContent>
      </Card>

      <Card className="min-w-0"><CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input aria-label="Search ledger" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger" />
          </div>
          <div className="grid gap-1.5"><Label>Type</Label><Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'All' | BudgetType)}><SelectTrigger className="min-w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem>
            {budgetTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent></Select></div>
          <Button aria-label="Export CSV" size="icon" variant="outline" type="button" onClick={onExportCsv} title="Export CSV"><Download size={18} /></Button>
        </div>
        <Table className="mt-5 min-w-[820px]">
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead className="w-24"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => {
              const category = categoryById.get(transaction.categoryId)
              return (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="max-w-72">
                    <strong className="block truncate font-semibold">{transaction.description}</strong>
                    <small className="block truncate text-xs text-muted-foreground">{transaction.notes}</small>
                  </TableCell>
                  <TableCell><Badge variant="outline" style={{ borderColor: category?.color, background: `${category?.color}18` }}>
                    {category?.name ?? 'Uncategorized'}
                  </Badge></TableCell>
                  <TableCell>{formatMoney(transaction.amount)}</TableCell>
                  <TableCell>{transaction.paymentMode}</TableCell>
                  <TableCell><div className="flex gap-1.5">
                    <Button aria-label={`Edit ${transaction.description}`} size="icon-sm" variant="outline" type="button" onClick={() => edit(transaction)} title="Edit entry"><Edit3 size={16} /></Button>
                    <ConfirmDialog
                      destructive
                      title="Delete this transaction?"
                      description={`${transaction.description} (${formatMoney(transaction.amount)}) will be permanently removed.`}
                      confirmLabel="Delete transaction"
                      onConfirm={() => onDelete(transaction.id)}
                      trigger={<Button aria-label={`Delete ${transaction.description}`} className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive" size="icon-sm" variant="outline" type="button" title="Delete entry"><Trash2 size={16} /></Button>}
                    />
                  </div></TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No transactions match these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {filtered.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)}
            {" of "}
            {filtered.length}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent></Card>
    </div>
  )
}

function Field({ children, htmlFor, label }: { children: ReactNode; htmlFor?: string; label: string }) {
  return <div className="grid gap-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>
}
