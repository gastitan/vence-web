import { FormEvent, useState } from 'react'
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts'
import type { AccountType } from '@/services/api'
import { ACCOUNT_TYPE_LABELS } from '@/services/api'

const ACCOUNT_TYPES: AccountType[] = ['BANK', 'CREDIT', 'SERVICE', 'OTHER']

export function AccountsPage() {
  const { data, isLoading } = useAccounts()
  const { mutateAsync: createAccount, isPending } = useCreateAccount()

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [type, setType] = useState<AccountType | ''>('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Account name is required.')
      return
    }
    if (!type) {
      setError('Account type is required.')
      return
    }

    await createAccount({
      name: trimmedName,
      institution: institution.trim() || undefined,
      type,
    })

    setName('')
    setInstitution('')
    setType('')
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Accounts</h2>
        <p className="text-sm text-gray-400">
          Your funding sources (checking, credit cards, etc). Link bills to accounts to see cash
          impact.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface-muted p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Create account
        </h3>
        <form className="grid gap-3 sm:grid-cols-[2fr,2fr,1fr,auto]" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Checking, Amex Gold"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Type</label>
            <select
              value={type}
              onChange={(e) => setType((e.target.value || '') as AccountType | '')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              required
            >
              <option value="">Select type</option>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACCOUNT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">Institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Optional – Bank or issuer"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-surface shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add account
            </button>
          </div>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Existing accounts
        </h3>
        {isLoading ? (
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-400">
            Loading accounts…
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-500">
            No accounts yet. Create one above to get started.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-muted">
            {data.map((account) => (
              <li key={account.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium text-white">{account.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {account.institution && (
                      <span className="text-xs text-gray-400">{account.institution}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                    </span>
                  </div>
                  {account.last4 && (
                    <p className="text-xs text-gray-500">•••• {account.last4}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

