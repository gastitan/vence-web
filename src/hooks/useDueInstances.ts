import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DueInstance, DueInstanceId, PayDueInstanceInput } from '@/services/api'
import { getDueBetween, getNextDue, payDueInstance } from '@/services/api'

export const dueKeys = {
  all: ['dueInstances'] as const,
  next: () => [...dueKeys.all, 'next'] as const,
  range: (from: string, to: string) => [...dueKeys.all, 'range', from, to] as const,
}

export function useNextDue() {
  return useQuery({
    queryKey: dueKeys.next(),
    queryFn: () => getNextDue(),
  })
}

export function useDueBetween(from: string, to: string) {
  return useQuery({
    queryKey: dueKeys.range(from, to),
    queryFn: () => getDueBetween(from, to),
    enabled: Boolean(from && to),
  })
}

export function usePayDueInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { id: DueInstanceId; body: PayDueInstanceInput }) =>
      payDueInstance(variables.id, variables.body),
    onSuccess: (updated: DueInstance) => {
      queryClient.invalidateQueries({ queryKey: dueKeys.all })
      return updated
    },
  })
}

export function useGroupedByDate(instances: DueInstance[] | undefined) {
  return useMemo(() => {
    if (!instances) return []

    const byDate = new Map<string, DueInstance[]>()

    for (const item of instances) {
      const list = byDate.get(item.dueDate) ?? []
      list.push(item)
      byDate.set(item.dueDate, list)
    }

    const entries = Array.from(byDate.entries())
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

    return entries
  }, [instances])
}

