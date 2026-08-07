import { authTokenKey } from '../data/constants'
import type { AiChatMessage, AiUsage, AppState, SettingsState, Transaction, TransactionsPage, User } from '../types'

export type AuthInput = { email: string; name?: string; password: string; mode: 'login' | 'signup' }

export async function fetchSession(token: string) {
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Please sign in again')
  return readJson<{ user: User; state: AppState }>(response)
}

export async function authenticate(input: AuthInput) {
  const response = await fetch(`/api/auth/${input.mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      name: input.name,
      password: input.password,
    }),
  })
  if (!response.ok) {
    const payload = await readJson<{ error?: string }>(response)
    throw new Error(payload?.error ?? 'Authentication failed')
  }
  return readJson<{ token: string; user: User; state: AppState }>(response)
}

export async function logout() {
  const token = localStorage.getItem(authTokenKey)
  if (!token) return
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateProfile(input: { name: string }) {
  return request<User>('/api/profile', { method: 'PUT', body: JSON.stringify(input) })
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  await request<{ success: true }>('/api/profile/password', { method: 'PUT', body: JSON.stringify(input) })
}

export async function saveSettings(settings: SettingsState) {
  return requestState('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function saveTransaction(transaction: Transaction) {
  return requestState(`/api/transactions${transaction.id ? `/${transaction.id}` : ''}`, {
    method: transaction.id ? 'PUT' : 'POST',
    body: JSON.stringify(transaction),
  })
}

export async function removeTransaction(id: string) {
  return requestState(`/api/transactions/${id}`, { method: 'DELETE' })
}

export async function fetchTransactionsPage(input: { limit: number; offset: number; search?: string; categoryIds?: string[] }) {
  const params = new URLSearchParams({ limit: String(input.limit), offset: String(input.offset) })
  if (input.search) params.set('search', input.search)
  if (input.categoryIds?.length) params.set('categoryIds', input.categoryIds.join(','))
  return request<TransactionsPage>(`/api/transactions?${params.toString()}`)
}

export async function importState(state: AppState) {
  return requestState('/api/import', {
    method: 'POST',
    body: JSON.stringify(state),
  })
}

export async function resetState() {
  return requestState('/api/reset', { method: 'POST' })
}

export async function fetchAiUsage() {
  return request<AiUsage>('/api/ask-ai')
}

export async function streamAskAi(
  input: { question: string; history: AiChatMessage[] },
  handlers: { onDelta: (delta: string) => void; onUsage: (usage: AiUsage) => void },
) {
  const token = localStorage.getItem(authTokenKey)
  const response = await fetch('/api/ask-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const payload = await readJson<{ error?: string }>(response)
    throw new Error(payload.error ?? `Request failed with ${response.status}`)
  }
  if (!response.body) throw new Error("Couldn't get an answer right now, try again")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const block of events) {
      const eventName = block.match(/^event:\s*(.+)$/m)?.[1]
      const dataLine = block.match(/^data:\s*(.+)$/m)?.[1]
      if (!eventName || !dataLine) continue
      const data = JSON.parse(dataLine) as { delta?: string; message?: string } | AiUsage
      if (eventName === 'usage') handlers.onUsage(data as AiUsage)
      if (eventName === 'delta') handlers.onDelta((data as { delta?: string }).delta ?? '')
      if (eventName === 'error') throw new Error((data as { message?: string }).message ?? "Couldn't get an answer right now, try again")
      if (eventName === 'done') completed = true
    }
    if (done) break
  }
  if (!completed) throw new Error("Couldn't get an answer right now, try again")
}

async function requestState(path: string, init: RequestInit = {}) {
  return request<AppState>(path, init)
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem(authTokenKey)
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (!response.ok) {
    const payload = await readJson<{ error?: string }>(response)
    throw new Error(payload?.error ?? `Request failed with ${response.status}`)
  }
  return readJson<T>(response)
}

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('The API returned HTML instead of JSON. Start the full application with `npm run dev`.')
  }
  return (await response.json()) as T
}
