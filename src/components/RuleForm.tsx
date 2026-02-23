import { useCallback, useEffect, useState } from 'react'
import { getTodayISODate, previewRule } from '@/api'
import { DueDatePreview } from '@/components/DueDatePreview'
import type { PreferredWeekday, PreviewRequest, PreviewResultItem, PreviewRule, RuleType } from '@/types'

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'FixedDay', label: 'Fixed day' },
  { value: 'Range', label: 'Range' },
]

const WEEKDAYS: { value: PreferredWeekday; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const DEBOUNCE_MS = 400

function toNum(s: string): number | undefined {
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? undefined : n
}

function buildRule(
  ruleType: RuleType,
  rangeStart: string,
  rangeEnd: string,
  offsetDays: string,
  preferredWeekday: PreferredWeekday | '',
  fixedDay: string
): PreviewRule | null {
  if (ruleType === 'Range') {
    const start = toNum(rangeStart)
    const end = toNum(rangeEnd)
    const offset = toNum(offsetDays)
    if (start === undefined || end === undefined || offset === undefined) return null
    return {
      type: 'RANGE',
      closingRangeStart: start,
      closingRangeEnd: end,
      dueOffsetDays: offset,
      ...(preferredWeekday !== '' && { preferredWeekday }),
    }
  }
  const day = toNum(fixedDay)
  if (day === undefined) return null
  return { type: 'FIXED', day }
}

export function RuleForm() {
  const [ruleType, setRuleType] = useState<RuleType>('Range')
  const [closingRangeStart, setClosingRangeStart] = useState('')
  const [closingRangeEnd, setClosingRangeEnd] = useState('')
  const [dueOffsetDays, setDueOffsetDays] = useState('')
  const [preferredWeekday, setPreferredWeekday] = useState<PreferredWeekday | ''>('')
  const [day, setDay] = useState('')

  const [preview, setPreview] = useState<PreviewResultItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runPreview = useCallback(() => {
    const rule = buildRule(
      ruleType,
      closingRangeStart,
      closingRangeEnd,
      dueOffsetDays,
      preferredWeekday,
      day
    )
    if (rule === null) {
      setPreview(null)
      setError(null)
      return
    }

    const payload: PreviewRequest = {
      rule,
      referenceDate: getTodayISODate(),
      months: 1,
    }

    setLoading(true)
    setError(null)
    previewRule(payload)
      .then((res) => {
        const first = res.results?.length ? res.results[0] : null
        setPreview(first ?? null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [ruleType, closingRangeStart, closingRangeEnd, dueOffsetDays, preferredWeekday, day])

  useEffect(() => {
    const t = setTimeout(runPreview, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [runPreview])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Rule type
          </label>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as RuleType)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-white focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {RULE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {ruleType === 'Range' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Preferred weekday
            </label>
            <select
              value={preferredWeekday}
              onChange={(e) =>
                setPreferredWeekday(e.target.value === '' ? '' : (Number(e.target.value) as PreferredWeekday))
              }
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-white focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="">—</option>
              {WEEKDAYS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {ruleType === 'Range' && (
        <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Closing range start
          </label>
          <input
            type="number"
            value={closingRangeStart}
            onChange={(e) => setClosingRangeStart(e.target.value)}
            placeholder="e.g. 1"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Closing range end
          </label>
          <input
            type="number"
            value={closingRangeEnd}
            onChange={(e) => setClosingRangeEnd(e.target.value)}
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Due offset (days)
          </label>
          <input
            type="number"
            value={dueOffsetDays}
            onChange={(e) => setDueOffsetDays(e.target.value)}
            placeholder="e.g. 30"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        </div>
      )}

      {ruleType === 'FixedDay' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Day of month
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="e.g. 15"
            className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Preview
        </label>
        <DueDatePreview data={preview} loading={loading} error={error} />
      </div>
    </div>
  )
}
