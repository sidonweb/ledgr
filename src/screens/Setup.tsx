import { Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { PanelHeader } from '../components/ui/panel-header'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { budgetTypes } from '../data/constants'
import type { BudgetType, Category, SettingsState } from '../types'
import { formatMoney } from '../utils/format'
import { slugify } from '../utils/id'
import { buildSalaryPlans } from '../utils/models'

export function Setup({
  settings,
  salaryPlans,
  onUpdateSettings,
}: {
  settings: SettingsState
  salaryPlans: ReturnType<typeof buildSalaryPlans>
  onUpdateSettings: (settings: Partial<SettingsState>) => void
}) {
  function updateCategory(id: string, patch: Partial<Category>) {
    onUpdateSettings({
      categories: settings.categories.map((category) => (category.id === id ? { ...category, ...patch } : category)),
    })
  }

  function addCategory() {
    onUpdateSettings({
      categories: [
        ...settings.categories,
        {
          id: slugify(`category-${Date.now()}`),
          name: 'New category',
          type: 'Need',
          color: '#5B4BE8',
        },
      ],
    })
  }

  function removeCategory(id: string) {
    if (settings.categories.length <= 1) return
    onUpdateSettings({ categories: settings.categories.filter((category) => category.id !== id) })
  }

  function addPaymentMode() {
    onUpdateSettings({ paymentModes: [...settings.paymentModes, 'New Mode'] })
  }

  function updatePaymentMode(index: number, value: string) {
    onUpdateSettings({ paymentModes: settings.paymentModes.map((mode, currentIndex) => (currentIndex === index ? value : mode)) })
  }

  function removePaymentMode(index: number) {
    if (settings.paymentModes.length <= 1) return
    onUpdateSettings({ paymentModes: settings.paymentModes.filter((_, currentIndex) => currentIndex !== index) })
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,.8fr)_minmax(0,1.2fr)]">
      <Card><CardHeader><PanelHeader title="Income plan" action="5 years" /></CardHeader><CardContent className="grid gap-4">
          <SetupField id="budget-cycle-type" label="Budget cycle">
            <Select value={settings.budgetCycleType} onValueChange={(value) => onUpdateSettings({ budgetCycleType: value as SettingsState['budgetCycleType'] })}>
              <SelectTrigger id="budget-cycle-type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">Calendar month</SelectItem>
                <SelectItem value="salary">Salary cycle (payday to payday)</SelectItem>
              </SelectContent>
            </Select>
          </SetupField>
          <SetupField id="start-year" label="Start year"><Input id="start-year" type="number" value={settings.startYear} onChange={(event) => onUpdateSettings({ startYear: Number(event.target.value) })} /></SetupField>
          <SetupField id="salary" label="Salary"><MoneyInput id="salary" value={settings.salary} onChange={(value) => onUpdateSettings({ salary: value })} /></SetupField>
          <SetupField id="growth" label="Annual growth %"><Input id="growth" type="number" value={settings.salaryGrowth} onChange={(event) => onUpdateSettings({ salaryGrowth: Number(event.target.value) })} /></SetupField>
          <SetupField id="weekly-limit" label="Weekly limit"><MoneyInput id="weekly-limit" value={settings.weeklyLimit} onChange={(value) => onUpdateSettings({ weeklyLimit: value })} /></SetupField>
      </CardContent></Card>

      <Card className="min-w-0"><CardHeader><PanelHeader title="50 / 30 / 20 projection" action="Next 5 years" /></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Year</TableHead><TableHead className="text-right">Salary</TableHead><TableHead className="text-right">Needs</TableHead><TableHead className="text-right">Wants</TableHead><TableHead className="text-right">Savings</TableHead></TableRow></TableHeader><TableBody>
          {salaryPlans.map((plan) => (
            <TableRow key={plan.year}><TableCell className="text-sm font-semibold">{plan.year}</TableCell><TableCell className="text-right text-sm font-bold">{formatMoney(plan.salary)}</TableCell><TableCell className="text-right text-sm text-muted-foreground">{formatMoney(plan.need)}</TableCell><TableCell className="text-right text-sm text-muted-foreground">{formatMoney(plan.want)}</TableCell><TableCell className="text-right text-sm text-muted-foreground">{formatMoney(plan.saving)}</TableCell></TableRow>
          ))}
        </TableBody></Table>
      </CardContent></Card>

      <Card className="min-w-0"><CardHeader><PanelHeader
          title="Categories"
          action={
            <Button size="sm" type="button" onClick={addCategory}><Plus size={14} /> Add</Button>
          }
        /></CardHeader><CardContent className="grid gap-3">
          {settings.categories.map((category) => (
            <div className="grid grid-cols-[44px_minmax(0,1fr)_130px_36px] items-center gap-2 max-sm:grid-cols-[44px_minmax(0,1fr)]" key={category.id}>
              <Input aria-label={`${category.name} color`} className="w-11 cursor-pointer p-1" type="color" value={category.color} onChange={(event) => updateCategory(category.id, { color: event.target.value })} />
              <Input aria-label="Category name" value={category.name} onChange={(event) => updateCategory(category.id, { name: event.target.value })} />
              <Select value={category.type} onValueChange={(value) => updateCategory(category.id, { type: value as BudgetType })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
                {budgetTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent></Select>
              <Button aria-label={`Delete ${category.name}`} className="hover:bg-negative-muted hover:text-negative" size="icon-sm" variant="ghost" type="button" onClick={() => removeCategory(category.id)} title="Delete category"><Trash2 size={16} /></Button>
            </div>
          ))}
        </CardContent></Card>

      <Card><CardHeader><PanelHeader
          title="Payment modes"
          action={
            <Button size="sm" type="button" onClick={addPaymentMode}><Plus size={14} /> Add</Button>
          }
        /></CardHeader><CardContent className="grid gap-3">
          {settings.paymentModes.map((mode, index) => (
            <div className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2" key={`${mode}-${index}`}>
              <Input aria-label="Payment mode" value={mode} onChange={(event) => updatePaymentMode(index, event.target.value)} />
              <Button aria-label={`Delete ${mode}`} className="hover:bg-negative-muted hover:text-negative" size="icon-sm" variant="ghost" type="button" onClick={() => removePaymentMode(index)} title="Delete payment mode"><Trash2 size={16} /></Button>
            </div>
          ))}
        </CardContent></Card>
    </div>
  )
}

function MoneyInput({ id, onChange, value }: { id: string; onChange: (value: number) => void; value: number }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
      <Input className="pl-8 font-semibold tnum" id={id} min="0" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  )
}

function SetupField({ children, id, label }: { children: ReactNode; id: string; label: string }) {
  return <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>
}
