import type { DueInstance } from '@/services/api'

interface MarkPaidButtonProps {
  instance: DueInstance
  payingId: string | null
  onMarkPaid: (i: DueInstance) => void
  primary?: boolean
  label?: string
}

export function MarkPaidButton({
  instance,
  payingId,
  onMarkPaid,
  primary = false,
  label = 'Mark as paid',
}: MarkPaidButtonProps) {
  const isPaid = instance.status === 'paid'
  const isPending = payingId === instance.id
  return (
    <button
      type="button"
      disabled={isPaid || isPending}
      onClick={() => onMarkPaid(instance)}
      className={
        primary
          ? 'inline-flex min-w-[7rem] items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-surface shadow-sm transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60'
          : 'rounded-full border border-emerald-400/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      {isPending ? 'Marking…' : label}
    </button>
  )
}
