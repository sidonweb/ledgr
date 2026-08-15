import { BookOpen, CalendarCheck, PieChart, ReceiptText, WalletCards } from 'lucide-react'
import { PanelHeader } from '../components/ui/panel-header'
import { Card, CardContent, CardHeader } from '../components/ui/card'

const steps = [
  {
    icon: <WalletCards size={18} />,
    title: 'Set your income plan',
    text: 'Add salary, expected growth, and a weekly comfort limit in Setup. The app turns that into monthly guardrails.',
  },
  {
    icon: <ReceiptText size={18} />,
    title: 'Log every transaction',
    text: 'Use Ledger for spends, savings transfers, payment modes, categories, and notes. Small entries create the real picture.',
  },
  {
    icon: <PieChart size={18} />,
    title: 'Review the month',
    text: 'Dashboard compares actual spending with your planned needs, wants, and savings so you can see what changed.',
  },
  {
    icon: <CalendarCheck size={18} />,
    title: 'Spot patterns',
    text: 'Analysis and Calendar show weekly spikes, payment-mode habits, and high-spend days across the year.',
  },
]

const splits = [
  { share: '50', label: 'Needs', text: 'Rent, groceries, bills, commute, health, and the rest of the life infrastructure you have to pay for.' },
  { share: '30', label: 'Wants', text: 'Food delivery, shopping, subscriptions, trips, entertainment, gifts, and the choices that make life good.' },
  { share: '20', label: 'Savings', text: 'SIPs, emergency fund, debt payoff, investments, and money you intentionally keep for future you.' },
]

export function Guide() {
  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden rounded-xl bg-primary p-7 text-primary-foreground shadow-md sm:p-9">
        <div className="relative grid gap-8 md:grid-cols-[1fr_280px] md:items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[.12em] text-primary-foreground/70 uppercase">How it works</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-[1.05] font-extrabold tracking-[-.04em] md:text-[2.75rem]">
              Track money by behaviour, not guilt.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/80">
              Your daily ledger stays connected to a simple budget framework, so every entry teaches you a little more about where the money actually goes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {splits.map((split) => (
              <span className="grid aspect-square place-content-center rounded-lg bg-white/12 text-center backdrop-blur" key={split.share}>
                <strong className="block text-2xl leading-none font-extrabold tracking-[-.04em] tnum">{split.share}</strong>
                <span className="mt-1.5 block text-[10px] font-bold tracking-[.08em] text-primary-foreground/70 uppercase">{split.label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <PanelHeader title="The 50 / 30 / 20 rule" action={<BookOpen size={14} />} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {splits.map((split) => (
            <div className="rounded-lg bg-muted/60 p-5" key={split.label}>
              <strong className="block text-sm font-bold">{split.share}% {split.label}</strong>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{split.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelHeader title="Using the app" action="Daily flow" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {steps.map((step) => (
            <div className="flex gap-3.5 rounded-lg bg-muted/60 p-5" key={step.title}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">{step.icon}</span>
              <div>
                <strong className="mb-1.5 block text-sm font-bold">{step.title}</strong>
                <p className="text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
