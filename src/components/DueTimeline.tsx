import { useEffect, useState } from 'react'
import { calculate, getTodayISODate } from '@/api'
import type { CalculateRequest, TimelineItem } from '@/types'

function getDefaultPayload(): CalculateRequest {
  return {
    rule: {
      type: 'RANGE',
      closingRangeStart: 1,
      closingRangeEnd: 5,
      dueOffsetDays: 30,
    },
    referenceDate: getTodayISODate(),
    months: 6,
  }
}

function daysFromToday(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  d.setHours(12, 0, 0, 0)
  return Math.floor((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

export function DueTimeline() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const payload = getDefaultPayload()
    calculate(payload)
      .then((list) => {
        const arr = Array.isArray(list) ? list : (list as { data?: unknown[] })?.data ?? []
        setItems(arr as TimelineItem[])
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center text-gray-400">
        Loading timeline…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center text-gray-500">
        No due dates in the next 6 months
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const days = daysFromToday(item.dueDate)
        const isSoon = days >= 0 && days < 7
        return (
          <li
            key={`${item.dueDate}-${i}`}
            className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${
              isSoon
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-[var(--border)] bg-[var(--surface-muted)]'
            }`}
          >
            <span className="font-mono text-white">{item.dueDate}</span>
            {isSoon && (
              <span className="text-xs text-amber-400">
                {days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`}
              </span>
            )}
            <span
              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                item.isEstimated
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {item.isEstimated ? 'Estimated' : 'Exact'}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round((item.confidence ?? 0) * 100)}%
            </span>
          </li>
        )
      })}
    </ul>
  )
}
