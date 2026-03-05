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

/** Backend RuleType enum value for fixed day-of-month rules */
export const BILL_RULE_TYPE_FIXED_DAY = 'FIXED_DAY' as const
export type BillRuleTypeFixedDay = typeof BILL_RULE_TYPE_FIXED_DAY

export type ApiBillRule =
  | {
      type: BillRuleTypeFixedDay
      fixedDay: number
    }

export function buildFixedDayRule(dayOfMonth: number): ApiBillRule {
  return {
    type: BILL_RULE_TYPE_FIXED_DAY,
    fixedDay: dayOfMonth,
  }
}

export interface Bill {
  id: BillId
  name: string
  accountId: AccountId
  accountName?: string
  amount: number
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
  return request<DueInstance | null>('/due-instances/next', { method: 'GET' })
}

export function getDueBetween(from: string, to: string): Promise<DueInstance[]> {
  const params = new URLSearchParams({ from, to }).toString()
  return request<DueInstance[]>(`/due-instances?${params}`, { method: 'GET' })
}

export function payDueInstance(id: DueInstanceId, body: PayDueInstanceInput): Promise<DueInstance> {
  return request<DueInstance>(`/due-instances/${encodeURIComponent(id)}/pay`, {
    method: 'POST',
    body,
  })
}

