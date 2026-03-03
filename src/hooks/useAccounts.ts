import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateAccountInput } from '@/services/api'
import { createAccount, getAccounts } from '@/services/api'

export const accountKeys = {
  all: ['accounts'] as const,
}

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => getAccounts(),
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}

