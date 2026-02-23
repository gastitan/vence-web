import type { PreviewResultItem } from '@/types'

interface DueDatePreviewProps {
  data: PreviewResultItem | null
  loading: boolean
  error: string | null
}

export function DueDatePreview({ data, loading, error }: DueDatePreviewProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-gray-400">
        Calculating…
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-gray-500">
        Fill the rule to see preview
      </div>
    )
  }

  const confidencePercent = Math.round(data.confidence * 100)

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-lg font-medium text-white">
          {data.calculatedDate}
        </span>
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
            data.isEstimated
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {data.isEstimated ? 'Estimated' : 'Exact'}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-400">
        Confidence: {confidencePercent}%
      </p>
    </div>
  )
}
