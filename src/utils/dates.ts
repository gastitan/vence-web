import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth, startOfToday } from 'date-fns'

export function isoToday(): string {
  return format(startOfToday(), 'yyyy-MM-dd')
}

export function isoRangeNextDays(daysAhead: number): { from: string; to: string } {
  const today = startOfToday()
  const to = addDays(today, daysAhead)
  return {
    from: format(today, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

export function isoMonthRange(date: Date): { from: string; to: string } {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return {
    from: format(start, 'yyyy-MM-dd'),
    to: format(end, 'yyyy-MM-dd'),
  }
}

export function isoThisAndNextMonthRanges(reference: Date = new Date()): {
  thisMonth: { from: string; to: string }
  nextMonth: { from: string; to: string }
} {
  const thisMonth = isoMonthRange(reference)
  const firstOfNextMonth = startOfMonth(addDays(endOfMonth(reference), 1))
  const nextMonth = isoMonthRange(firstOfNextMonth)
  return { thisMonth, nextMonth }
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), 'MMM d')
}

export function formatLongDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy')
}

export function formatMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export function daysFromToday(iso: string): number {
  const target = parseISO(iso)
  return differenceInCalendarDays(target, startOfToday())
}

export function isDueSoon(iso: string, thresholdDays = 3): boolean {
  const diff = daysFromToday(iso)
  return diff >= 0 && diff < thresholdDays
}

export function isOverdue(dueDate: string): boolean {
  return daysFromToday(dueDate) < 0
}

export function isDueToday(dueDate: string): boolean {
  return daysFromToday(dueDate) === 0
}

/** Urgency display order: paid > overdue > due-today > urgent (< 3 days) > normal (estimated/confirmed) */
export type UrgencyVariant =
  | 'paid'
  | 'overdue'
  | 'due-today'
  | 'urgent'
  | 'estimated'
  | 'confirmed'

export function getUrgencyVariant(
  dueDate: string,
  status: 'estimated' | 'confirmed' | 'paid'
): UrgencyVariant {
  if (status === 'paid') return 'paid'
  if (isOverdue(dueDate)) return 'overdue'
  if (isDueToday(dueDate)) return 'due-today'
  if (isDueSoon(dueDate, 3)) return 'urgent'
  return status === 'estimated' ? 'estimated' : 'confirmed'
}

