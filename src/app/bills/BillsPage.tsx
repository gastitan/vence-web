import { FormEvent, useMemo, useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { useAccounts } from '@/hooks/useAccounts'
import { useBills, useCreateBill, useDeleteBill } from '@/hooks/useBills'
import {
  BILL_RULE_TYPE_FIXED_DAY,
  BILL_CURRENCIES,
  CURRENCY_ARS,
  buildFixedDayRule,
  type BillCurrency,
} from '@/services/api'
import { formatCurrency } from '@/utils/format'
import type { UrgencyVariant } from '@/utils/dates'

export function BillsPage() {
  const { data: accounts } = useAccounts()
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const { data: bills, isLoading } = useBills(selectedAccountId || undefined)
  const { mutateAsync: createBill, isPending: creating } = useCreateBill()
  const { mutateAsync: deleteBillMutation, isPending: deleting } = useDeleteBill(
    selectedAccountId || undefined
  )

  const [name, setName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<BillCurrency>(CURRENCY_ARS)
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [error, setError] = useState<string | null>(null)

  const accountById = useMemo(() => {
    const map = new Map<string, string>()
    if (accounts) {
      for (const account of accounts) {
        map.set(account.id, account.name)
      }
    }
    return map
  }, [accounts])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Bill name is required.')
      return
    }

    if (!accountId) {
      setError('Account is required.')
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.')
      return
    }

    if (!BILL_CURRENCIES.includes(currency)) {
      setError('Currency is required.')
      return
    }

    const parsedDay = dayOfMonth.trim() ? Number(dayOfMonth) : NaN
    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setError('Day of month is required (1–31).')
      return
    }

    await createBill({
      name: trimmedName,
      accountId,
      amount: parsedAmount,
      currency,
      rule: buildFixedDayRule(parsedDay),
    })

    setName('')
    setAccountId('')
    setAmount('')
    setDayOfMonth('')
  }

  const handleDelete = async (id: string) => {
    await deleteBillMutation(id)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Bills</h2>
        <p className="text-sm text-gray-400">
          Define recurring bills and link them to accounts. Vence will project upcoming due
          instances for you.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface-muted p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Account
        </h3>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value="">Select account…</option>
          {accounts?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {!selectedAccountId && (
          <p className="mt-3 text-sm text-gray-500">Select an account to view bills.</p>
        )}
      </section>

      {!selectedAccountId ? null : (
        <>
          <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Create bill
            </h3>
            <form
              className="grid gap-3 sm:grid-cols-[2fr,2fr,1fr,auto,auto,auto]"
              onSubmit={handleSubmit}
            >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent, Internet, Amex"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="">Select account…</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as BillCurrency)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              {BILL_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">
              Day of month
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              placeholder="e.g. 15"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-surface shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add bill
            </button>
          </div>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Existing bills
            </h3>
            {isLoading ? (
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-400">
                Loading bills…
              </div>
            ) : !bills || bills.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-500">
                No bills yet. Create one above to start seeing projections.
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface-muted">
                {bills.map((bill) => (
                  <li key={bill.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-white">{bill.name}</p>
                        {bill.status && (
                          <StatusBadge
                            variant={(bill.status === 'paid' ? 'paid' : bill.status === 'estimated' ? 'estimated' : 'confirmed') as UrgencyVariant}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {bill.accountName ?? accountById.get(bill.accountId) ?? 'Unknown account'}
                      </p>
                      {bill.rule?.type === BILL_RULE_TYPE_FIXED_DAY && (
                        <p className="text-xs text-gray-500">
                          Day {bill.rule.fixedDay} each month
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(bill.amount)}
                      </span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => handleDelete(bill.id)}
                        className="rounded-full border border-red-500/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

