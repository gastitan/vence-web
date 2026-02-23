import type {
  CalculateRequest,
  DueResult,
  PreviewRequest,
  PreviewResponse,
} from './types'

const BASE = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL ?? '/api/v1')

/** Returns today's date in YYYY-MM-DD format */
export function getTodayISODate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: object }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options
  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** POST /preview – get due date for current rule (no persistence) */
export function previewRule(payload: PreviewRequest): Promise<PreviewResponse> {
  return request<PreviewResponse>('/preview', { method: 'POST', body: payload })
}

/** POST /calculate – get due dates (e.g. for next 6 months) */
export function calculate(payload: CalculateRequest): Promise<DueResult[]> {
  return request<DueResult[]>('/calculate', { method: 'POST', body: payload })
}

/** POST /rules/validate – validate rule payload only */
export function validateRule(payload: PreviewRequest): Promise<{ errors?: { path?: string; message: string }[] }> {
  return request('/rules/validate', { method: 'POST', body: payload })
}

/** GET /health */
export function health(): Promise<{ status?: string }> {
  return request('/health', { method: 'GET' })
}
