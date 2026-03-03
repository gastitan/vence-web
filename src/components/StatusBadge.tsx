import type { UrgencyVariant } from '@/utils/dates'

interface StatusBadgeProps {
  variant: UrgencyVariant
  className?: string
}

const variantStyles: Record<UrgencyVariant, string> = {
  paid: 'bg-emerald-500/20 text-emerald-300',
  overdue: 'bg-red-500/20 text-red-300 font-semibold',
  'due-today': 'bg-amber-500/20 text-amber-300',
  urgent: 'bg-red-500/20 text-red-300',
  estimated: 'bg-amber-500/20 text-amber-300',
  confirmed: 'bg-sky-500/20 text-sky-300',
}

const variantLabels: Record<UrgencyVariant, string> = {
  paid: 'Paid',
  overdue: 'Overdue',
  'due-today': 'Due Today',
  urgent: 'Urgent',
  estimated: 'Estimated',
  confirmed: 'Confirmed',
}

export function StatusBadge({ variant, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {variantLabels[variant]}
    </span>
  )
}
