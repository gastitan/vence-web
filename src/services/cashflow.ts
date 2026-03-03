/**
 * Placeholder for future cashflow summary endpoint.
 * Do not call from UI until backend is ready.
 */

export interface CashflowSummary {
  from: string
  to: string
  /** Reserved for future fields (e.g. totalIn, totalOut, balance) */
}

/** Placeholder: not implemented. For future backend endpoint. */
export function getCashflowSummary(_from: string, _to: string): Promise<CashflowSummary> {
  return Promise.reject(new Error('Cashflow summary endpoint not implemented'))
}
