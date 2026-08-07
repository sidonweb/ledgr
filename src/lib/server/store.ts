import crypto from 'node:crypto'
import type { AppState, SettingsState, Transaction, User } from '@/types'
import { pool } from './database'
import { buildEmptyState } from './default-state'
import { normalizeSettings } from '@/utils/settings'

type TransactionRow = {
  id: string
  transaction_date: string
  description: string
  category_id: string
  amount: number | string
  payment_mode: string
  notes: string
}

export async function getState(userId: string): Promise<AppState> {
  const settingsResult = await pool.query<{ data: SettingsState }>('select data from user_settings where user_id = $1', [userId])
  const transactionsResult = await pool.query<TransactionRow>(
    `
      select id, transaction_date::text as transaction_date, description, category_id, amount, payment_mode, notes
      from transactions
      where user_id = $1
      order by transaction_date desc, created_at desc
    `,
    [userId],
  )

  return {
    settings: normalizeSettings(settingsResult.rows[0]?.data ?? buildEmptyState().settings),
    transactions: transactionsResult.rows.map((row) => ({
      id: row.id,
      date: toDateString(row.transaction_date),
      description: row.description,
      categoryId: row.category_id,
      amount: Number(row.amount),
      paymentMode: row.payment_mode,
      notes: row.notes,
    })),
  }
}

export async function listTransactionsPage(
  userId: string,
  { limit, offset, search, categoryIds }: { limit: number; offset: number; search: string | null; categoryIds: string[] | null },
): Promise<{ transactions: Transaction[]; total: number }> {
  const result = await pool.query<TransactionRow & { total_count: string }>(
    `
      select id, transaction_date::text as transaction_date, description, category_id, amount, payment_mode, notes,
             count(*) over() as total_count
      from transactions
      where user_id = $1
        and ($2::text is null or description ilike '%' || $2 || '%' or notes ilike '%' || $2 || '%' or payment_mode ilike '%' || $2 || '%')
        and ($3::text[] is null or category_id = any($3))
      order by transaction_date desc, created_at desc
      limit $4 offset $5
    `,
    [userId, search, categoryIds, limit, offset],
  )

  return {
    transactions: result.rows.map((row) => ({
      id: row.id,
      date: toDateString(row.transaction_date),
      description: row.description,
      categoryId: row.category_id,
      amount: Number(row.amount),
      paymentMode: row.payment_mode,
      notes: row.notes,
    })),
    total: result.rows.length > 0 ? Number(result.rows[0].total_count) : 0,
  }
}

export async function saveSettings(userId: string, settings: unknown) {
  validateSettings(settings)
  const normalizedSettings = normalizeSettings(settings)
  await pool.query(
    `
      insert into user_settings (user_id, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (user_id)
      do update set data = excluded.data, updated_at = now()
    `,
    [userId, JSON.stringify(normalizedSettings)],
  )
}

export async function upsertTransaction(userId: string, transaction: unknown) {
  validateTransaction(transaction)
  await pool.query(
    `
      insert into transactions (id, user_id, transaction_date, description, category_id, amount, payment_mode, notes)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id)
      do update set
        transaction_date = excluded.transaction_date,
        description = excluded.description,
        category_id = excluded.category_id,
        amount = excluded.amount,
        payment_mode = excluded.payment_mode,
        notes = excluded.notes,
        updated_at = now()
      where transactions.user_id = excluded.user_id
    `,
    [
      transaction.id,
      userId,
      transaction.date,
      transaction.description.trim(),
      transaction.categoryId,
      Number(transaction.amount),
      transaction.paymentMode,
      transaction.notes ?? '',
    ],
  )
}

export async function deleteTransaction(userId: string, id: string) {
  await pool.query('delete from transactions where id = $1 and user_id = $2', [id, userId])
}

export async function replaceState(userId: string, state: unknown) {
  validateState(state)
  const normalizedSettings = normalizeSettings(state.settings)
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('delete from transactions where user_id = $1', [userId])
    await client.query(
      `
        insert into user_settings (user_id, data, updated_at)
        values ($1, $2::jsonb, now())
        on conflict (user_id)
        do update set data = excluded.data, updated_at = now()
      `,
      [userId, JSON.stringify(normalizedSettings)],
    )
    for (const transaction of state.transactions) {
      await client.query(
        `
          insert into transactions (id, user_id, transaction_date, description, category_id, amount, payment_mode, notes)
          values ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          transaction.id,
          userId,
          transaction.date,
          transaction.description.trim(),
          transaction.categoryId,
          Number(transaction.amount),
          transaction.paymentMode,
          transaction.notes ?? '',
        ],
      )
    }
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

export async function createUser({ email, password, name }: { email: unknown; password: unknown; name?: unknown }): Promise<User> {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPassword = validatePassword(password)
  const displayName = String(name ?? '').trim() || normalizedEmail.split('@')[0]
  const userId = crypto.randomUUID()
  const passwordHash = await hashPassword(normalizedPassword)

  try {
    const result = await pool.query<User>(
      `insert into users (id, email, name, password_hash) values ($1, $2, $3, $4) returning id, email, name, plan`,
      [userId, normalizedEmail, displayName, passwordHash],
    )
    await replaceState(userId, buildEmptyState())
    return result.rows[0]
  } catch (error) {
    if (hasDatabaseCode(error, '23505')) throw new Error('An account with this email already exists')
    throw error
  }
}

export async function verifyLogin(email: unknown, password: unknown): Promise<User> {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPassword = String(password ?? '')
  const result = await pool.query<User & { password_hash: string }>('select id, email, name, plan, password_hash from users where email = $1', [normalizedEmail])
  const row = result.rows[0]
  if (!row || !(await verifyPassword(normalizedPassword, row.password_hash))) throw new Error('Invalid email or password')
  return { id: row.id, email: row.email, name: row.name, plan: row.plan }
}

export async function updateProfile(userId: string, { name }: { name: unknown }): Promise<User> {
  const displayName = String(name ?? '').trim()
  if (displayName.length < 2 || displayName.length > 60) throw new Error('Name must be between 2 and 60 characters')

  const result = await pool.query<User>(
    'update users set name = $2 where id = $1 returning id, email, name, plan',
    [userId, displayName],
  )
  return result.rows[0]
}

export async function changePassword(userId: string, currentPassword: unknown, newPassword: unknown) {
  const result = await pool.query<{ password_hash: string }>('select password_hash from users where id = $1', [userId])
  const row = result.rows[0]
  if (!row || !(await verifyPassword(String(currentPassword ?? ''), row.password_hash))) throw new Error('Current password is incorrect')
  const normalizedPassword = validatePassword(newPassword)
  await pool.query('update users set password_hash = $2 where id = $1', [userId, await hashPassword(normalizedPassword)])
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  await pool.query('insert into user_sessions (token, user_id, expires_at) values ($1, $2, now() + interval \'30 days\')', [token, userId])
  return token
}

export async function deleteSession(token: string) {
  await pool.query('delete from user_sessions where token = $1', [token])
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  return deriveKey(password, salt).then((derived) => `${salt}:${derived.toString('hex')}`)
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = String(storedHash ?? '').split(':')
  if (!salt || !hash) return false
  const derived = await deriveKey(password, salt)
  const stored = Buffer.from(hash, 'hex')
  return stored.length === derived.length && crypto.timingSafeEqual(stored, derived)
}

function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key))
  })
}

export function validateState(state: unknown): asserts state is AppState {
  if (!isRecord(state)) throw new Error('Invalid state payload')
  validateSettings(state.settings)
  if (!Array.isArray(state.transactions)) throw new Error('Transactions must be an array')
  for (const transaction of state.transactions) validateTransaction(transaction)
}

function validateSettings(settings: unknown): asserts settings is SettingsState {
  if (!isRecord(settings)) throw new Error('Invalid settings payload')
  if (!Number.isFinite(Number(settings.startYear))) throw new Error('Start year is required')
  if (!Number.isFinite(Number(settings.salary))) throw new Error('Salary is required')
  if (!Number.isFinite(Number(settings.salaryGrowth))) throw new Error('Salary growth is required')
  if (!Number.isFinite(Number(settings.weeklyLimit))) throw new Error('Weekly limit is required')
  if (settings.budgetCycleType !== undefined && settings.budgetCycleType !== 'calendar' && settings.budgetCycleType !== 'salary') {
    throw new Error('Budget cycle type must be Calendar Month or Salary Cycle')
  }
  if (settings.shakeToOpenLedger !== undefined && typeof settings.shakeToOpenLedger !== 'boolean') {
    throw new Error('Shake to open Ledger must be enabled or disabled')
  }
  if (settings.rolloverEnabled !== undefined && typeof settings.rolloverEnabled !== 'boolean') {
    throw new Error('Carry over must be enabled or disabled')
  }
  if (!Array.isArray(settings.categories) || settings.categories.length === 0) throw new Error('At least one category is required')
  if (!Array.isArray(settings.paymentModes) || settings.paymentModes.length === 0) throw new Error('At least one payment mode is required')
  for (const category of settings.categories) {
    if (!isRecord(category) || !String(category.id ?? '').trim() || !String(category.name ?? '').trim()) throw new Error('Invalid category')
    if (category.type !== 'Need' && category.type !== 'Want' && category.type !== 'Saving' && category.type !== 'Income') {
      throw new Error('Invalid category type')
    }
  }
}

function validateTransaction(transaction: unknown): asserts transaction is Transaction {
  if (!isRecord(transaction)) throw new Error('Invalid transaction payload')
  if (!isUuid(transaction.id)) throw new Error('Transaction id must be a UUID')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(transaction.date))) throw new Error('Transaction date must be yyyy-mm-dd')
  if (!String(transaction.description ?? '').trim()) throw new Error('Description is required')
  if (!String(transaction.categoryId ?? '').trim()) throw new Error('Category is required')
  if (!Number.isFinite(Number(transaction.amount)) || Number(transaction.amount) < 0) throw new Error('Amount must be a positive number')
  if (!String(transaction.paymentMode ?? '').trim()) throw new Error('Payment mode is required')
}

function normalizeEmail(email: unknown) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('A valid email is required')
  return normalized
}

function validatePassword(password: unknown) {
  const normalized = String(password ?? '')
  if (normalized.length < 8) throw new Error('Password must be at least 8 characters')
  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))
}

function hasDatabaseCode(error: unknown, code: string) {
  return isRecord(error) && error.code === code
}

function toDateString(value: string) {
  return value.slice(0, 10)
}
