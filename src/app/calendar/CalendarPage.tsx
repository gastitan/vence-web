import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
import type { DueInstance } from '@/services/api'
import { getDueInstanceAmount, getDueInstanceStatus } from '@/services/api'
import { MarkPaidButton } from '@/components/MarkPaidButton'
import { StatusBadge } from '@/components/StatusBadge'
import { useDueBetween, useGroupedByDate, usePayDueInstance } from '@/hooks/useDueInstances'
import { formatCurrency } from '@/utils/format'
import { formatLongDate, formatMonthLabel, getUrgencyVariant, isoMonthRange } from '@/utils/dates'

const MONTH_PARAM = 'month'

function parseMonthParam(value: string | null): Date {
  if (!value) return startOfMonth(new Date())
  try {
    const d = parseISO(value + '-01')
    return isNaN(d.getTime()) ? startOfMonth(new Date()) : startOfMonth(d)
  } catch {
    return startOfMonth(new Date())
  }
}

export function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const monthParam = searchParams.get(MONTH_PARAM)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => parseMonthParam(monthParam))
  const [payingId, setPayingId] = useState<string | null>(null)

  useEffect(() => {
    const param = searchParams.get(MONTH_PARAM)
    if (param) {
      setCurrentMonth(parseMonthParam(param))
    } else {
      const now = startOfMonth(new Date())
      setSearchParams({ [MONTH_PARAM]: format(now, 'yyyy-MM') }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { from, to } = isoMonthRange(currentMonth)
  const { data, isLoading } = useDueBetween(from, to)
  const groups = useGroupedByDate(data)

  const { mutateAsync: markPaid } = usePayDueInstance()

  const handleMarkPaid = useCallback(
    async (instance: DueInstance) => {
      setPayingId(instance.id)
      try {
        await markPaid({ id: instance.id, body: {} })
      } finally {
        setPayingId(null)
      }
    },
    [markPaid]
  )

  const goToMonth = useCallback(
    (delta: number) => {
      const next = startOfMonth(addMonths(currentMonth, delta))
      setCurrentMonth(next)
      setSearchParams({ [MONTH_PARAM]: format(next, 'yyyy-MM') }, { replace: true })
    },
    [currentMonth, setSearchParams]
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Calendar</h2>
          <p className="text-sm text-gray-400">
            See your bills laid out over the month. Mark instances as paid when you clear them.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-muted px-2 py-1 text-sm">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="rounded-full px-2 py-1 text-gray-300 hover:bg-white/10"
          >
            ‹
          </button>
          <span className="px-2 text-sm font-medium text-white">
            {formatMonthLabel(currentMonth)}
          </span>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="rounded-full px-2 py-1 text-gray-300 hover:bg-white/10"
          >
            ›
          </button>
        </div>
      </header>

      <p className="text-xs text-gray-500">
        Range: {from} → {to}
      </p>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-400">
          Loading due instances…
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-gray-500">
          No due instances for this month.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([date, instances]) => {
            const totalsByCurrency = instances.reduce<Record<string, number>>((acc, item) => {
              const amount = getDueInstanceAmount(item)
              const currency = item.bill.currency
              acc[currency] = (acc[currency] ?? 0) + amount
              return acc
            }, {})

            return (
              <div
                key={date}
                className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {formatLongDate(date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-gray-300">
                    {Object.entries(totalsByCurrency)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([currency, sum]) => (
                        <span key={currency} className="font-semibold text-white">
                          {formatCurrency(sum, currency)}
                        </span>
                      ))}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {instances.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-2 transition-all duration-200"
                    >
                      <StatusBadge variant={getUrgencyVariant(item.dueDate, getDueInstanceStatus(item))} />
                      <span className="text-sm font-medium text-white">{item.bill.name}</span>
                      <span className="text-xs text-gray-400">{item.bill.account.name}</span>
                      <span className="ml-auto text-sm font-semibold text-white">
                        {formatCurrency(getDueInstanceAmount(item), item.bill.currency)}
                      </span>
                      <MarkPaidButton
                        instance={item}
                        payingId={payingId}
                        onMarkPaid={handleMarkPaid}
                        label="Mark paid"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

