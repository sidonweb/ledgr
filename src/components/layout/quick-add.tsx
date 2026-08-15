'use client'

import { format, subDays } from 'date-fns'
import { Check, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import type { SettingsState, Transaction } from '../../types'
import { cn } from '../../utils/cn'
import { createId } from '../../utils/id'

const today = () => format(new Date(), 'yyyy-MM-dd')

/**
 * Logging a spend is the thing people do every day, so it should never require
 * navigating anywhere. This opens over whatever screen you are on, from the
 * sidebar button or the "n" key, and leads with the amount because that is the
 * part you actually remember.
 */
export function QuickAdd({
  onUpsert,
  open,
  onOpenChange,
  settings,
}: {
  onUpsert: (transaction: Transaction) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: SettingsState
}) {
  const spendingCategories = useMemo(
    () => settings.categories.filter((category) => category.type !== 'Income'),
    [settings.categories],
  )
  const incomeCategory = settings.categories.find((category) => category.type === 'Income')

  const [kind, setKind] = useState<'spending' | 'income'>('spending')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(spendingCategories[0]?.id ?? '')
  const [paymentMode, setPaymentMode] = useState(settings.paymentModes[0] ?? 'UPI')
  const [date, setDate] = useState(today)

  // A fresh sheet every time it opens, so yesterday's entry never lingers.
  useEffect(() => {
    if (!open) return
    setKind('spending')
    setAmount('')
    setDescription('')
    setCategoryId(spendingCategories[0]?.id ?? '')
    setPaymentMode(settings.paymentModes[0] ?? 'UPI')
    setDate(today())
  }, [open, spendingCategories, settings.paymentModes])

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter an amount greater than zero')
      return
    }
    const isIncome = kind === 'income'
    const resolvedCategory = isIncome ? incomeCategory?.id : categoryId
    if (!resolvedCategory) {
      toast.error('Pick a category first')
      return
    }
    onUpsert({
      id: createId(),
      date,
      description: description.trim() || (isIncome ? 'Income' : 'Untitled'),
      categoryId: resolvedCategory,
      amount: value,
      paymentMode: isIncome ? 'Bank Transfer' : paymentMode,
      notes: '',
    })
    toast.success(`${isIncome ? 'Income' : 'Entry'} added`, { description: `₹${value.toLocaleString('en-IN')} on ${format(new Date(date), 'dd MMM')}` })
    onOpenChange(false)
  }

  const dateShortcuts: [string, string][] = [
    ['Today', today()],
    ['Yesterday', format(subDays(new Date(), 1), 'yyyy-MM-dd')],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an entry</DialogTitle>
          <DialogDescription>Amount first. Everything else is optional.</DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(value) => setKind(value as 'spending' | 'income')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="spending">Expense / Saving</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
        </Tabs>

        <form className="grid gap-5" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="quick-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-medium text-muted-foreground">₹</span>
              <Input
                autoFocus
                className="h-16 pl-10 text-3xl font-medium tabular-nums md:text-3xl"
                id="quick-amount"
                inputMode="decimal"
                min="0"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                step="0.01"
                type="number"
                value={amount}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quick-description">Description</Label>
            <Input
              id="quick-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder={kind === 'income' ? 'e.g. Monthly salary' : 'e.g. Groceries'}
              value={description}
            />
          </div>

          {kind === 'spending' && (
            <>
              <div className="grid gap-2">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {spendingCategories.map((category) => {
                    const selected = category.id === categoryId
                    return (
                      <Button
                        className={cn('h-8 gap-2 rounded-full px-3 text-xs font-normal', selected && 'font-medium')}
                        key={category.id}
                        onClick={() => setCategoryId(category.id)}
                        size="sm"
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                      >
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: selected ? 'currentColor' : category.color }}
                        />
                        {category.name}
                        {selected && <Check className="size-3" />}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Paid with</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.paymentModes.map((mode) => (
                    <Button
                      className="h-8 rounded-full px-3 text-xs font-normal"
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      size="sm"
                      type="button"
                      variant={mode === paymentMode ? 'default' : 'outline'}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="quick-date">Date</Label>
            <div className="flex flex-wrap items-center gap-2">
              {dateShortcuts.map(([label, value]) => (
                <Button
                  className="h-8 rounded-full px-3 text-xs font-normal"
                  key={label}
                  onClick={() => setDate(value)}
                  size="sm"
                  type="button"
                  variant={date === value ? 'default' : 'outline'}
                >
                  {label}
                </Button>
              ))}
              <Input
                className="h-8 w-auto text-xs"
                id="quick-date"
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="submit">
              <Plus /> Add entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
