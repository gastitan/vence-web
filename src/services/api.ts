const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export interface ApiErrorShape {
  status: number
  message: string
}

export class ApiError extends Error implements ApiErrorShape {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }

  const response = await fetch(`${BASE_URL}${path}`, init)
  const rawText = await response.text()

  let parsedJson: unknown
  if (rawText.length > 0) {
    try {
      parsedJson = JSON.parse(rawText) as unknown
    } catch {
      parsedJson = undefined
    }
  }

  if (!response.ok) {
    const fallbackMessage = rawText || `Request failed with status ${response.status}`
    const data = typeof parsedJson === 'object' && parsedJson !== null ? (parsedJson as Record<string, unknown>) : null
    const messageCandidate =
      (data?.message as string | undefined) ??
      (data?.error as string | undefined) ??
      (data?.detail as string | undefined) ??
      fallbackMessage

    throw new ApiError(messageCandidate, response.status)
  }

  if (!rawText.length) {
    return undefined as T
  }

  if (parsedJson === undefined) {
    return JSON.parse(rawText) as T
  }

  return parsedJson as T
}

export type AccountId = string
export type BillId = string
export type DueInstanceId = string

export type AccountType = 'BANK' | 'CREDIT' | 'SERVICE' | 'OTHER'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Bank',
  CREDIT: 'Credit Card',
  SERVICE: 'Service',
  OTHER: 'Other',
}

export interface Account {
  id: AccountId
  name: string
  institution?: string
  type: AccountType
  last4?: string
}

export interface CreateAccountInput {
  name: string
  institution?: string
  type: AccountType
}

export type DueStatus = 'estimated' | 'confirmed' | 'paid'

export type ApiBillRule =
  | {
      type: 'FIXED'
      dayOfMonth: number
    }
  | {
      type: 'RANGE'
      rangeStart: number
      rangeEnd: number
      offsetDays: number
    }

export interface Bill {
  id: BillId
  name: string
  accountId: AccountId
  accountName?: string
  amount: number
  currency: BillCurrency
  rule?: ApiBillRule
  status?: DueStatus
}

export const CURRENCY_ARS = 'ARS' as const
export const CURRENCY_USD = 'USD' as const
export type BillCurrency = typeof CURRENCY_ARS | typeof CURRENCY_USD
export const BILL_CURRENCIES: readonly BillCurrency[] = [CURRENCY_ARS, CURRENCY_USD]

export interface CreateBillInput {
  name: string
  accountId: AccountId
  amount: number
  currency: string
  rule: ApiBillRule
}

/** Account nested inside due-instance bill (from GET /due-instances). */
export interface DueInstanceAccount {
  id: string
  name: string
  type: string
}

/** Bill nested inside due-instance (from GET /due-instances). */
export interface DueInstanceBill {
  id: string
  name: string
  currency: 'ARS' | 'USD'
  account: DueInstanceAccount
}

export interface DueInstance {
  id: DueInstanceId
  dueDate: string
  estimatedAmount: number | null
  confirmedAmount: number | null
  status: string
  bill: DueInstanceBill
}

/**
 * Raw shape that the backend may return (nested or flat).
 * We normalize to DueInstance so the UI always receives a consistent shape.
 */
interface RawDueInstance {
  id: DueInstanceId
  dueDate: string
  estimatedAmount?: number | null
  confirmedAmount?: number | null
  status?: string | null
  /** Nested format (if backend sends it) */
  bill?: DueInstanceBill | null
  /** Flat format (legacy) */
  billId?: string
  billName?: string | null
  accountId?: string
  accountName?: string | null
  amount?: number | null
  currency: 'ARS' | 'USD'
}

function normalizeDueInstance(raw: RawDueInstance): DueInstance {
  if (raw.bill && typeof raw.bill === 'object' && raw.bill.name && raw.bill.account) {
    return {
      id: raw.id,
      dueDate: raw.dueDate,
      estimatedAmount: raw.estimatedAmount ?? null,
      confirmedAmount: raw.confirmedAmount ?? null,
      status: raw.status ?? 'estimated',
      bill: raw.bill,
    }
  }
  return {
    id: raw.id,
    dueDate: raw.dueDate,
    estimatedAmount: raw.estimatedAmount ?? (raw.amount ?? null),
    confirmedAmount: raw.confirmedAmount ?? (raw.amount ?? null),
    status: (raw.status ?? 'estimated').toString(),
    bill: {
      id: raw.billId ?? '',
      name: raw.billName ?? 'Unknown bill',
      currency: raw.currency,
      account: {
        id: raw.accountId ?? '',
        name: raw.accountName ?? 'Unknown account',
        type: 'OTHER',
      },
    },
  }
}

/** Display amount: confirmedAmount ?? estimatedAmount ?? 0 */
export function getDueInstanceAmount(instance: DueInstance): number {
  const n =
    instance.confirmedAmount ?? instance.estimatedAmount ?? 0
  return Number.isFinite(n) ? n : 0
}

/** Normalize backend status string for UI (e.g. StatusBadge, getUrgencyVariant). */
export function getDueInstanceStatus(
  instance: DueInstance
): 'estimated' | 'confirmed' | 'paid' {
  const s = (instance.status ?? '').toLowerCase()
  if (s === 'paid') return 'paid'
  if (s === 'confirmed') return 'confirmed'
  return 'estimated'
}

export interface PayDueInstanceInput {
  paidAt?: string
  amount?: number
}

export function getAccounts(): Promise<Account[]> {
  return request<Account[]>('/accounts', { method: 'GET' })
}

export function createAccount(input: CreateAccountInput): Promise<Account> {
  return request<Account>('/accounts', { method: 'POST', body: input })
}

export function getBills(accountId: string): Promise<Bill[]> {
  const params = new URLSearchParams({ accountId }).toString()
  return request<Bill[]>(`/bills?${params}`, { method: 'GET' })
}

export function createBill(input: CreateBillInput): Promise<Bill> {
  return request<Bill>('/bills', { method: 'POST', body: input })
}

export function deleteBill(id: BillId): Promise<void> {
  return request<void>(`/bills/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getNextDue(): Promise<DueInstance | null> {
  return request<RawDueInstance | null>('/due-instances/next', { method: 'GET' }).then((raw) =>
    raw ? normalizeDueInstance(raw) : null
  )
}

export function getDueBetween(from: string, to: string): Promise<DueInstance[]> {
  const params = new URLSearchParams({ from, to }).toString()
  return request<RawDueInstance[]>(`/due-instances?${params}`, { method: 'GET' }).then((list) =>
    list.map(normalizeDueInstance)
  )
}

export function payDueInstance(id: DueInstanceId, body: PayDueInstanceInput): Promise<DueInstance> {
  return request<RawDueInstance>(`/due-instances/${encodeURIComponent(id)}/pay`, {
    method: 'POST',
    body,
  }).then(normalizeDueInstance)
}

