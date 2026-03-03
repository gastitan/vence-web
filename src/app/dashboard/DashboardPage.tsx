import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addDays, endOfMonth, format, startOfMonth, startOfToday, subDays } from 'date-fns'
import type { DueInstance } from '@/services/api'
import { getDueBetween, getNextDue } from '@/services/api'
import { usePayDueInstance } from '@/hooks/useDueInstances'
import { MarkPaidButton } from '@/components/MarkPaidButton'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/utils/format'
import { daysFromToday, getUrgencyVariant } from '@/utils/dates'

function computeMonthlyTotals(now: Date, instances: DueInstance[] | undefined) {
  if (!instances || instances.length === 0) {
    return { thisMonthPending: 0, nextMonthEstimated: 0 }
  }

  const startThisMonth = startOfMonth(now)
  const endThisMonth = endOfMonth(now)
  const startNextMonth = startOfMonth(addDays(endThisMonth, 1))
  const endNextMonth = endOfMonth(startNextMonth)

  let thisMonthPending = 0
  let nextMonthEstimated = 0

  for (const item of instances) {
    const date = new Date(item.dueDate + 'T12:00:00')

    if (date >= startThisMonth && date <= endThisMonth) {
      if (item.status !== 'paid') {
        thisMonthPending += item.amount
      }
    } else if (date >= startNextMonth && date <= endNextMonth) {
      if (item.status === 'estimated') {
        nextMonthEstimated += item.amount
      }
    }
  }

  return { thisMonthPending, nextMonthEstimated }
}

export function DashboardPage() {
  const today = startOfToday()
  const todayIso = format(today, 'yyyy-MM-dd')
  const [payingId, setPayingId] = useState<string | null>(null)
  const { mutateAsync: markPaid } = usePayDueInstance()

  const todayRange = useMemo(() => ({ from: todayIso, to: todayIso }), [todayIso])
  const overdueRange = useMemo(() => ({
    from: format(subDays(today, 31), 'yyyy-MM-dd'),
    to: format(subDays(today, 1), 'yyyy-MM-dd'),
  }), [today])

  const todayQuery = useQuery({
    queryKey: ['dueInstances', 'range', todayRange.from, todayRange.to],
    queryFn: () => getDueBetween(todayRange.from, todayRange.to),
  })

  const overdueQuery = useQuery({
    queryKey: ['dueInstances', 'range', overdueRange.from, overdueRange.to],
    queryFn: () => getDueBetween(overdueRange.from, overdueRange.to),
  })

  const nextDueQuery = useQuery({
    queryKey: ['dueInstances', 'next'],
    queryFn: () => getNextDue(),
  })

  const next7Range = useMemo(() => {
    const to = addDays(today, 7)
    return {
      from: format(today, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    }
  }, [today])

  const monthlyRange = useMemo(() => {
    const start = startOfMonth(today)
    const end = endOfMonth(addDays(endOfMonth(today), 31))
    return {
      from: format(start, 'yyyy-MM-dd'),
      to: format(end, 'yyyy-MM-dd'),
    }
  }, [today])

  const next7Query = useQuery({
    queryKey: ['dueInstances', 'range', next7Range.from, next7Range.to],
    queryFn: () => getDueBetween(next7Range.from, next7Range.to),
  })

  const monthlyQuery = useQuery({
    queryKey: ['dueInstances', 'monthlyTotals', monthlyRange.from, monthlyRange.to],
    queryFn: () => getDueBetween(monthlyRange.from, monthlyRange.to),
  })

  const monthlyTotals = useMemo(
    () => computeMonthlyTotals(today, monthlyQuery.data),
    [monthlyQuery.data, today]
  )

  const handleMarkPaid = async (instance: DueInstance) => {
    setPayingId(instance.id)
    try {
      await markPaid({ id: instance.id, body: {} })
    } finally {
      setPayingId(null)
    }
  }

  const nextDue = nextDueQuery.data
  const dueTodayUnpaid = (todayQuery.data ?? []).filter((i) => i.status !== 'paid')
  const overdueUnpaid = (overdueQuery.data ?? []).filter((i) => i.status !== 'paid').sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  const todayViewEmpty = dueTodayUnpaid.length === 0 && overdueUnpaid.length === 0

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Today
        </h2>
        <div className="rounded-xl border border-border bg-surface-muted p-4 md:p-6">
          {todayQuery.isLoading || overdueQuery.isLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : todayViewEmpty ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">All clear for today.</p>
          ) : (
            <ul className="space-y-2">
              {overdueUnpaid.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm transition-all duration-200"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-300">{item.dueDate}</span>
                      <StatusBadge variant="overdue" />
                    </div>
                    <p className="truncate font-medium text-white">
                      {item.billName} <span className="text-xs font-normal text-gray-400">· {item.accountName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</span>
                    <MarkPaidButton instance={item} payingId={payingId} onMarkPaid={handleMarkPaid} />
                  </div>
                </li>
              ))}
              {dueTodayUnpaid.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm transition-all duration-200"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-300">{item.dueDate}</span>
                      <StatusBadge variant="due-today" />
                    </div>
                    <p className="truncate font-medium text-white">
                      {item.billName} <span className="text-xs font-normal text-gray-400">· {item.accountName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</span>
                    <MarkPaidButton instance={item} payingId={payingId} onMarkPaid={handleMarkPaid} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Next due
        </h2>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 md:p-6">
          {nextDue ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-emerald-300/80">
                  Upcoming bill
                </p>
                <h3 className="text-lg font-semibold text-white md:text-xl">
                  {nextDue.billName}
                </h3>
                <p className="text-sm text-gray-300">
                  {nextDue.accountName} ·{' '}
                  <span className="font-mono text-emerald-200">{nextDue.dueDate}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Status: <StatusBadge variant={getUrgencyVariant(nextDue.dueDate, nextDue.status)} />
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Amount</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(nextDue.amount)}
                  </p>
                </div>
                <MarkPaidButton instance={nextDue} payingId={payingId} onMarkPaid={handleMarkPaid} primary />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300">
              You&apos;re all set. No upcoming dues in the next few days.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Next 7 days
          </h2>
          <p className="text-xs text-gray-500">
            Showing from {next7Range.from} to {next7Range.to}
          </p>
        </div>

        {next7Query.isLoading ? (
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-400">
            Loading upcoming dues…
          </div>
        ) : !next7Query.data || next7Query.data.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-500">
            No dues in the next 7 days.
          </div>
        ) : (
          <ul className="space-y-2">
            {next7Query.data
              .slice()
              .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
              .map((item) => {
                const days = daysFromToday(item.dueDate)
                const variant = getUrgencyVariant(item.dueDate, item.status)

                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm transition-all duration-200"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-gray-300">{item.dueDate}</span>
                        <StatusBadge variant={variant} />
                      </div>
                      <p className="truncate font-medium text-white">
                        {item.billName}{' '}
                        <span className="text-xs font-normal text-gray-400">
                          · {item.accountName}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {days === 0
                          ? 'Today'
                          : days === 1
                            ? 'In 1 day'
                            : days > 1
                              ? `In ${days} days`
                              : `${Math.abs(days)} days ago`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      <MarkPaidButton instance={item} payingId={payingId} onMarkPaid={handleMarkPaid} />
                    </div>
                  </li>
                )
              })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Monthly totals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-muted px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Pending this month</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatCurrency(monthlyTotals.thisMonthPending)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Estimated next month
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatCurrency(monthlyTotals.nextMonthEstimated)}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

