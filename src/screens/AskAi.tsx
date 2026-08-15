import { LoaderCircle, Send, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import type { AiChatMessage, AiUsage } from '../types'
import { fetchAiUsage, streamAskAi } from '../services/api'
import { cn } from '../utils/cn'

const EXAMPLE_QUESTIONS = [
  'How much did I spend on Wants this cycle?',
  'Am I on track for my savings goal?',
  'Which category am I overspending in?',
  'How did this week compare with my weekly limit?',
]

type ChatEntry = AiChatMessage & {
  id: string
  isError?: boolean
}

export function AskAi() {
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [question, setQuestion] = useState('')
  const [usage, setUsage] = useState<AiUsage | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [usageError, setUsageError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAiUsage()
      .then(setUsage)
      .catch(() => setUsageError('Usage unavailable'))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [isStreaming, messages])

  const atLimit = Boolean(usage && usage.used >= usage.limit)

  async function ask(nextQuestion = question) {
    const trimmed = nextQuestion.trim()
    if (!trimmed || isStreaming || atLimit) return

    const history = messages
      .filter((message) => !message.isError && message.content)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }))
    const userMessage: ChatEntry = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const answerId = crypto.randomUUID()
    setMessages((current) => [...current, userMessage, { id: answerId, role: 'assistant', content: '' }])
    setQuestion('')
    setIsStreaming(true)

    try {
      await streamAskAi(
        { question: trimmed, history },
        {
          onUsage: setUsage,
          onDelta: (delta) => {
            setMessages((current) => current.map((message) => message.id === answerId ? { ...message, content: message.content + delta } : message))
          },
        },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't get an answer right now, try again"
      setMessages((current) => current.map((entry) => entry.id === answerId ? { ...entry, content: message, isError: true } : entry))
      void fetchAiUsage().then(setUsage).catch(() => undefined)
    } finally {
      setIsStreaming(false)
    }
  }

  function clearConversation() {
    if (isStreaming) return
    setMessages([])
    setQuestion('')
  }

  const remaining = usage ? Math.max(0, usage.limit - usage.used) : null

  return (
    <Card className="mx-auto min-h-[min(760px,calc(100vh-12rem))] gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_var(--primary)]">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-[-.015em]">Ask about your money</h2>
            <p className="truncate text-xs text-muted-foreground">Grounded in your own Ledgr data, never the whole database</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:inline tnum">
            {usage ? `${remaining} of ${usage.limit} left today` : usageError || 'Loading usage…'}
          </span>
          <Button aria-label="Clear conversation" disabled={messages.length === 0 || isStreaming} onClick={clearConversation} size="icon-sm" title="Clear conversation" type="button" variant="ghost">
            <Trash2 size={15} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col px-0">
        <div aria-live="polite" className="min-h-[380px] flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="grid min-h-[340px] place-items-center text-center">
              <div className="max-w-md">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-accent text-primary">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold tracking-[-.025em]">What would you like to understand?</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Ask about spending, categories, budget cycles, savings, or weekly limits. Answers come from a small set of safe, read-only summaries of your own data.
                </p>
              </div>
            </div>
          ) : messages.map((message) => (
            <div className={cn('flex rise-in', message.role === 'user' ? 'justify-end' : 'justify-start')} key={message.id}>
              <div className={cn(
                'max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 sm:max-w-[78%]',
                message.role === 'user'
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm bg-muted text-foreground',
                message.isError && 'bg-negative-muted text-negative',
              )}>
                {message.role === 'assistant' && !message.content && isStreaming ? (
                  <span className="flex items-center gap-2 text-muted-foreground"><LoaderCircle className="animate-spin" size={15} /> Reading your numbers…</span>
                ) : <p className="whitespace-pre-wrap">{message.content}</p>}
                {message.role === 'assistant' && message.content && !message.isError && (
                  <p className="mt-3 border-t border-border pt-2 text-[10px] leading-4 text-muted-foreground">
                    Generated from your data. Always verify important figures in the Ledger.
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border bg-muted/40 px-5 py-4 sm:px-6">
          {atLimit ? (
            <div className="mb-3 rounded-md bg-warning-muted px-3.5 py-2.5 text-xs leading-5 text-warning">
              <strong className="font-bold">{usage?.plan === 'pro' ? 'Pro' : 'Free'} daily limit reached.</strong>{' '}
              You get {usage?.limit} questions per day. Resets at {formatReset(usage!.resetAt)}.
              {usage?.plan === 'free' && ' Pro includes 12 questions per day.'}
            </div>
          ) : (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {EXAMPLE_QUESTIONS.map((example) => (
                <button
                  className="shrink-0 rounded-full bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground border transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  disabled={isStreaming}
                  key={example}
                  onClick={() => void ask(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
          <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void ask() }}>
            <textarea
              aria-label="Ask a question about your finances"
              className="max-h-32 min-h-12 flex-1 resize-none rounded-md border border-input bg-card px-3.5 py-3 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isStreaming || atLimit}
              maxLength={1_000}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void ask()
                }
              }}
              placeholder={atLimit ? 'Daily limit reached' : 'Ask about your spending…'}
              rows={1}
              value={question}
            />
            <Button aria-label="Send question" disabled={!question.trim() || isStreaming || atLimit} size="icon-lg" type="submit">
              {isStreaming ? <LoaderCircle className="animate-spin" /> : <Send />}
            </Button>
          </form>
          <p className="mt-2.5 text-center text-[10px] text-muted-foreground">
            Daily limits reset at midnight UTC. Conversation history stays only in this browser tab.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatReset(resetAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(resetAt))
}
