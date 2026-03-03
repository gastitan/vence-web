import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BillId, CreateBillInput } from '@/services/api'
import { createBill, deleteBill, getBills } from '@/services/api'

export const billKeys = {
  all: ['bills'] as const,
  byAccount: (accountId: string) => ['bills', accountId] as const,
}

export function useBills(accountId: string | undefined) {
  return useQuery({
    queryKey: billKeys.byAccount(accountId ?? ''),
    queryFn: () => getBills(accountId!),
    enabled: Boolean(accountId),
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBillInput) => createBill(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.byAccount(variables.accountId) })
      queryClient.invalidateQueries({ queryKey: billKeys.all })
    },
  })
}

export function useDeleteBill(accountId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: BillId) => deleteBill(id),
    onSuccess: () => {
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: billKeys.byAccount(accountId) })
      }
      queryClient.invalidateQueries({ queryKey: billKeys.all })
    },
  })
}

