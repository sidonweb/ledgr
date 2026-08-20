'use client'

import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Code2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { appName } from '../../data/constants'
import type { AuthInput } from '../../services/api'
import { BrandLockup, BrandMark } from './BrandWordmark'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import Link from 'next/link'

const githubUrl = 'https://github.com/sidonweb/where-did-my-money-go'

const stats = [
  ['50/30/20', 'planning built in'],
  ['0–10', 'money health score'],
  ['6', 'ways to analyse'],
  ['0', 'data sold'],
]

const examples = [
  {
    title: 'Salary lands on the 27th',
    eyebrow: 'Salary cycle',
    status: 'Handled',
    copy: 'Plan from payday to payday instead of forcing your life into a calendar month.',
  },
  {
    title: '₹420 in small UPI spends',
    eyebrow: 'Daily leakage',
    status: 'Visible',
    copy: 'The forgettable payments stay attached to a day, a category, and a payment mode.',
  },
  {
    title: '₹10,000 moved to an SIP',
    eyebrow: 'Future you',
    status: 'Counted',
    copy: 'Savings are part of the plan, not whatever happens to be left at month end.',
  },
  {
    title: 'UPI, cards, cash, transfers',
    eyebrow: 'One ledger',
    status: 'Together',
    copy: 'See the whole money story without stitching together five different apps.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Set your real plan',
    copy: 'Add income, choose a calendar or salary cycle, and shape categories around your life.',
    icon: Target,
  },
  {
    number: '02',
    title: 'Log money in seconds',
    copy: 'Capture expenses, income, and savings with the payment context you will need later.',
    icon: ReceiptText,
  },
  {
    number: '03',
    title: 'See the pattern',
    copy: 'Compare needs, wants, and savings, scan trends, and spot the categories drifting off plan.',
    icon: BarChart3,
  },
  {
    number: '04',
    title: 'Ask a better question',
    copy: 'Use grounded AI analysis to understand your own data without giving it database access.',
    icon: Sparkles,
  },
]

const comparisonRows = [
  ['Planning', 'Calendar or salary cycle', 'Usually calendar only'],
  ['Budget model', 'Needs, wants, and savings', 'One generic spend limit'],
  ['Context', 'Category, payment mode, notes', 'Amount and merchant'],
  ['Analysis', 'Weekly to yearly, plus Ask AI', 'Basic monthly totals'],
  ['Privacy', 'Private account workspace', 'Often ad or aggregation driven'],
  ['Price', 'Free to start', 'Paywall before clarity'],
]

const faqs = [
  {
    question: 'How is this different from a bank app?',
    answer: 'A bank app tells you what cleared. This workspace lets you decide what it meant, how it fits your plan, and what the pattern says across accounts and payment modes.',
  },
  {
    question: 'Does salary-cycle budgeting really work?',
    answer: 'Yes. Add income entries and the app can treat each payday as the start of a new budget cycle, while calendar-month mode stays available whenever it suits you better.',
  },
  {
    question: 'What happens with irregular income?',
    answer: 'You can log income as it arrives and use categories, notes, and custom analysis ranges to keep the story accurate. The tool is flexible, but it does not forecast income you have not entered.',
  },
  {
    question: 'How is the 0–10 score calculated?',
    answer: 'It compares spending against your needs, wants, and savings plan, then applies penalties for going over budget or falling short on savings. It is a directional signal, not a credit score.',
  },
  {
    question: 'What does 50/30/20 mean?',
    answer: 'It is a starting framework: roughly 50% of income for needs, 30% for wants, and 20% for savings. You can customise the underlying categories to match your life.',
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. The product helps you organise and understand the information you enter. It does not replace a qualified financial adviser, tax professional, or accountant.',
  },
  {
    question: 'How much does it cost, and who made it?',
    answer: 'You can start free. This is an independent, open-source project built to make everyday money decisions easier to see and less exhausting to manage.',
  },
]

const scoreBands = [
  { range: '0–4.9', title: 'Reset the plan', copy: 'Spending has moved well beyond the current income plan. Start with the biggest category, not every small purchase.' },
  { range: '5–7.9', title: 'Getting steadier', copy: 'The plan is working in parts. A few categories or a savings gap need attention before the cycle closes.' },
  { range: '8–10', title: 'On track', copy: 'Needs, wants, and savings are close to plan. Keep the rhythm and protect what is already working.' },
]

export function LandingAuth({ message, onAuth }: { message: string; onAuth: (input: AuthInput) => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [authOpen, setAuthOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function openAuth(nextMode: 'login' | 'signup') {
    setMode(nextMode)
    setError('')
    setAuthOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onAuth({ email, name, password, mode })
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not continue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <a className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground" href="#main-content">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a className="mr-auto" href="#top" aria-label={`${appName} home`}>
            <BrandLockup wordmarkClassName="text-2xl" />
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
            <a className="transition-colors hover:text-foreground" href="#idea">The idea</a>
            <a className="transition-colors hover:text-foreground" href="#features">How it works</a>
            <a className="transition-colors hover:text-foreground" href="#comparison">Compare</a>
            <a className="transition-colors hover:text-foreground" href="#faq">FAQ</a>
          </div>

          <a className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex" href={githubUrl} target="_blank" rel="noreferrer">
            <Code2 size={17} /> GitHub
          </a>
          <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => openAuth('login')}>Sign in</Button>
          <Button onClick={() => openAuth('signup')}>Start free <ArrowRight /></Button>
        </nav>
      </header>

      <div id="main-content">
        {/* Hero */}
        <section id="top" className="relative scroll-mt-24">
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pt-16 pb-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pt-28 lg:pb-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold tracking-[.1em] text-primary uppercase">
                <Sparkles size={13} /> Personal finance, made clear
              </span>
              <h1 className="mt-6 max-w-2xl text-[2.75rem] leading-[.98] font-extrabold tracking-[-.05em] sm:text-6xl lg:text-[4.25rem]">
                Know where your money went <span className="text-primary">before</span> the month ends.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Track daily spending, plan around your real payday, and turn a pile of transactions into one clear next decision.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => openAuth('signup')}>Create your free account <ArrowRight /></Button>
                <Button size="lg" variant="ghost" onClick={() => openAuth('login')}>Sign in instead</Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-2"><ShieldCheck className="text-positive" size={15} /> Private workspace</span>
                <span className="flex items-center gap-2"><Check className="text-positive" size={15} /> Free to start</span>
                <span className="flex items-center gap-2"><LockKeyhole className="text-positive" size={15} /> Your data is never sold</span>
              </div>
            </div>

            <HeroPreview />
          </div>

          <div className="mx-auto grid max-w-7xl gap-3 px-4 pb-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {stats.map(([value, label]) => (
              <div className="rounded-lg bg-card px-5 py-5 shadow-sm border" key={value}>
                <strong className="block text-2xl leading-none font-extrabold tracking-[-.04em] text-primary tnum sm:text-3xl">{value}</strong>
                <span className="mt-2 block text-xs font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* The idea */}
        <Section id="idea">
          <div className="grid gap-8 lg:grid-cols-[.35fr_1fr]">
            <p className="eyebrow text-primary">01 / The idea</p>
            <div>
              <h2 className="max-w-4xl text-3xl leading-[1.08] font-extrabold tracking-[-.045em] sm:text-5xl">
                Most money apps record the past. This one helps you understand it.
              </h2>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground">
                A clean ledger is only the beginning. Your spending is organised around the way you are paid, measured against a simple plan, and turned into patterns you can actually act on, without asking you to become a spreadsheet person.
              </p>
            </div>
          </div>
        </Section>

        {/* Money score */}
        <Section tinted>
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">Your money score</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">One signal. The detail behind it.</h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              A 0–10 score makes the month readable at a glance. Then you can open the categories and daily trend to see exactly what moved it.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {scoreBands.map((band, index) => (
              <article
                className={`rounded-xl p-7 ${index === 2 ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card shadow-sm border'}`}
                key={band.range}
              >
                <span className={`block text-3xl leading-none font-extrabold tracking-[-.04em] tnum ${index === 2 ? '' : 'text-primary'}`}>{band.range}</span>
                <h3 className="mt-8 text-lg font-bold tracking-[-.02em]">{band.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${index === 2 ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{band.copy}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* Real-life proof */}
        <Section>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="eyebrow text-primary">Real-life proof</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Built for how money actually moves.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted-foreground lg:justify-self-end">
              Not just neat monthly charts. The awkward dates, tiny payments, intentional savings, and mixed payment modes all stay visible.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {examples.map((example) => (
              <article className="rounded-xl bg-card p-7 shadow-sm border transition-shadow duration-200 hover:shadow-md" key={example.title}>
                <div className="flex items-center justify-between gap-4">
                  <span className="eyebrow">{example.eyebrow}</span>
                  <span className="rounded-full bg-positive-muted px-2.5 py-1 text-[11px] font-bold text-positive">{example.status}</span>
                </div>
                <h3 className="mt-8 text-xl font-bold tracking-[-.03em]">{example.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{example.copy}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section id="features" tinted>
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">02 / How it works</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Plan. Log. See. Decide.</h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <article className="overflow-hidden rounded-xl bg-card shadow-sm border" key={step.number}>
                  <div className="flex min-h-64 items-center justify-center bg-accent/60 p-8">
                    <div className="w-full max-w-sm rounded-lg bg-card p-5 shadow-md">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Icon size={17} /></span>
                        <span className="text-[10px] font-bold tracking-[.1em] text-muted-foreground uppercase">Step {step.number}</span>
                      </div>
                      <StepPreview index={index} />
                    </div>
                  </div>
                  <div className="p-7">
                    <span className="text-xs font-bold text-primary tnum">{step.number}</span>
                    <h3 className="mt-3 text-xl font-bold tracking-[-.025em]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </Section>

        {/* Compare */}
        <Section id="comparison">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">03 / Compare</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Clarity beats another spending chart.</h2>
          </div>
          <div className="mt-12 overflow-x-auto rounded-xl bg-card p-2 shadow-sm border">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="p-4 text-[11px] font-bold tracking-[.09em] text-muted-foreground uppercase sm:p-5">What matters</th>
                  <th className="rounded-t-lg bg-accent p-4 text-sm font-bold text-primary sm:p-5">{appName}</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground sm:p-5">Typical tracker</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, ours, typical], index) => (
                  <tr key={label}>
                    <th className="border-t border-border p-4 text-sm font-semibold sm:p-5">{label}</th>
                    <td className={`bg-accent p-4 sm:p-5 ${index === comparisonRows.length - 1 ? 'rounded-b-lg' : ''}`}>
                      <span className="flex items-start gap-2.5 font-medium">
                        <Check className="mt-0.5 shrink-0 text-primary" size={15} />
                        {ours}
                      </span>
                    </td>
                    <td className="border-t border-border p-4 text-muted-foreground sm:p-5">{typical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Quote */}
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <figure className="mx-auto max-w-7xl rounded-2xl bg-primary px-6 py-20 text-center text-primary-foreground shadow-md sm:px-12 sm:py-24">
            <blockquote className="mx-auto max-w-4xl text-3xl leading-[1.1] font-extrabold tracking-[-.045em] sm:text-5xl">
              “Money clarity shouldn’t require becoming a spreadsheet person.”
            </blockquote>
            <Link href="https://sidonweb.com" target="_blank" rel="noreferrer">
              <figcaption className="mt-8 text-[11px] font-bold tracking-[.12em] text-primary-foreground/75 uppercase transition-colors hover:text-primary-foreground">
                Siddharth Singh
              </figcaption>
            </Link>
          </figure>
        </section>

        {/* FAQ */}
        <Section id="faq">
          <div className="grid gap-12 lg:grid-cols-[.6fr_1fr]">
            <div>
              <p className="eyebrow text-primary">04 / FAQ</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">The sensible questions.</h2>
              <p className="mt-5 max-w-md leading-7 text-muted-foreground">
                What it does, what it does not do, and how to tell if it fits your money routine.
              </p>
            </div>
            <div className="rounded-xl bg-card px-6 shadow-sm border">
              {faqs.map((faq) => (
                <details className="group border-b border-border last:border-0" key={faq.question}>
                  <summary className="flex list-none cursor-pointer items-center gap-5 py-5 font-bold [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <ChevronRight className="ml-auto shrink-0 text-primary transition-transform duration-200 group-open:rotate-90" size={18} />
                  </summary>
                  <p className="max-w-2xl pb-6 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        {/* Closing CTA */}
        <section className="px-4 pt-8 pb-24 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-card px-6 py-16 shadow-md border sm:px-12 lg:px-20 lg:py-20">
            <div className="relative max-w-3xl">
              <BrandMark className="size-12 rounded-[1rem]" />
              <h2 className="mt-7 text-4xl leading-[1.05] font-extrabold tracking-[-.05em] sm:text-6xl">
                Know where your money went before the month ends.
              </h2>
              <p className="mt-6 max-w-2xl leading-7 text-muted-foreground">
                Create your workspace, set the plan, and make the next money decision with the full picture in front of you.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => openAuth('signup')}>Start free <ArrowRight /></Button>
                <Button size="lg" variant="outline" onClick={() => openAuth('login')}>Sign in</Button>
              </div>
              <p className="mt-8 max-w-xl text-xs leading-5 text-muted-foreground">
                For organisation and informational use only. Not financial, tax, or investment advice.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-card px-4 pt-16 pb-10 border sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <BrandLockup />
              <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
                Know where your money went before the month ends.
              </p>
            </div>
            <FooterLinks title="Product" links={[['The idea', '#idea'], ['How it works', '#features'], ['Compare', '#comparison'], ['FAQ', '#faq']]} />
            <FooterLinks title="Project" links={[['GitHub', githubUrl], ['Contributing', `${githubUrl}#contributing`], ['README', `${githubUrl}#readme`]]} />
            <FooterLinks title="Built with" links={[['Next.js', 'https://nextjs.org'], ['React', 'https://react.dev'], ['PostgreSQL', 'https://www.postgresql.org']]} />
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t border-border pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} {appName}</span>
            <span>Independent · open source · built for everyday money</span>
          </div>
        </div>
      </footer>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <BrandMark />
            <DialogTitle className="mt-4 text-2xl tracking-tight">
              {mode === 'signup' ? 'Create your workspace' : 'Welcome back'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'signup' ? 'Start turning transactions into a plan.' : 'Your money story is right where you left it.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={mode} onValueChange={(value) => { setMode(value as 'login' | 'signup'); setError('') }}>
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signup">Sign up</TabsTrigger><TabsTrigger value="login">Log in</TabsTrigger></TabsList>
          </Tabs>
          <form className="grid gap-4" onSubmit={submit}>
            {mode === 'signup' && (
              <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></div>
            )}
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" autoFocus={mode === 'login'} autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /></div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
              {!busy && <ArrowRight />}
            </Button>
          </form>
          <p className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <LockKeyhole className="shrink-0 text-positive" size={13} /> Secure account access · {message}
          </p>
        </DialogContent>
      </Dialog>
    </main>
  )
}

/** A light preview of the real dashboard, so the promise matches the product. */
function HeroPreview() {
  const splits: [string, string, string, string][] = [
    ['Needs', '42%', '50%', 'var(--chart-2)'],
    ['Wants', '24%', '30%', 'var(--chart-3)'],
    ['Savings', '21%', '20%', 'var(--chart-1)'],
  ]

  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      <div className="overflow-hidden rounded-2xl bg-card shadow-lg border">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="flex items-center gap-2 text-[11px] font-bold tracking-[.1em] text-muted-foreground uppercase">
            <span className="size-2 rounded-full bg-positive" /> April overview
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground tnum">27 Mar – 26 Apr</span>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Left this cycle</p>
              <strong className="mt-2.5 block text-[2.5rem] leading-none font-extrabold tracking-[-.05em] tnum">₹18,240</strong>
            </div>
            <div className="text-right">
              <p className="eyebrow">Money score</p>
              <strong className="mt-2.5 block text-2xl leading-none font-extrabold text-positive tnum">
                8.6<span className="text-sm font-bold text-muted-foreground"> / 10</span>
              </strong>
            </div>
          </div>
          <div className="mt-8 grid gap-4">
            {splits.map(([label, value, target, color]) => (
              <div key={label}>
                <div className="mb-2 flex items-center text-xs">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                  <span className="ml-auto font-bold tnum">
                    {value} <span className="font-medium text-muted-foreground">/ {target}</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: value, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-2.5 rounded-lg bg-positive-muted px-4 py-3 text-xs font-semibold text-positive">
            <BarChart3 size={15} /> On track for this salary cycle
          </div>
        </div>
      </div>
    </div>
  )
}

function StepPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <>
        <p className="text-xs font-bold">Budget cycle</p>
        <div className="mt-3 flex rounded-full bg-muted p-1 text-[11px] font-semibold">
          <span className="flex-1 rounded-full px-3 py-2 text-center text-muted-foreground">Calendar</span>
          <span className="flex-1 rounded-full bg-primary px-3 py-2 text-center text-primary-foreground">Salary cycle</span>
        </div>
      </>
    )
  }

  if (index === 1) {
    return (
      <div className="grid gap-2">
        {[['Dinner out', '₹2,180'], ['Metro recharge', '₹930'], ['April SIP', '₹10,000']].map(([item, amount]) => (
          <div className="flex items-center rounded-md bg-muted px-3.5 py-2.5 text-xs" key={item}>
            <span className="font-medium">{item}</span>
            <span className="ml-auto font-bold tnum">{amount}</span>
          </div>
        ))}
      </div>
    )
  }

  if (index === 2) {
    return (
      <div className="grid gap-3">
        {([['Needs', 68, 'var(--chart-2)'], ['Wants', 44, 'var(--chart-3)'], ['Savings', 82, 'var(--chart-1)']] as [string, number, string][]).map(([item, value, color]) => (
          <div key={item}>
            <div className="mb-1.5 flex text-[11px] font-semibold">
              <span>{item}</span>
              <span className="ml-auto tnum">{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg rounded-bl-sm bg-muted p-3.5 text-xs leading-5">Where did I overspend this cycle?</div>
      <div className="mt-2 ml-6 rounded-lg rounded-br-sm bg-accent p-3.5 text-xs leading-5">
        <span className="text-[10px] font-bold tracking-[.08em] text-primary uppercase">Grounded answer</span>
        <br />
        Lifestyle was ₹2,840 over plan, led by dining and weekend travel.
      </div>
    </>
  )
}

function Section({ children, id, tinted = false }: { children: ReactNode; id?: string; tinted?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8 ${tinted ? 'bg-muted/50' : ''}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  )
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold tracking-[.1em] text-foreground uppercase">{title}</h3>
      <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
        {links.map(([label, href]) => <li key={label}><a className="transition-colors hover:text-primary" href={href}>{label}</a></li>)}
      </ul>
    </div>
  )
}
