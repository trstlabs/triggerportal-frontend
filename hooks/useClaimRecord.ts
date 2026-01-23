import { useQuery } from '@tanstack/react-query'


import { useIntentoRpcClient } from './useRPCClient'
import { useAtomValue } from 'jotai'
import { walletState } from '../state/atoms/walletAtoms'


export const useClaimRecord = () => {
  const client = useIntentoRpcClient()
  const { address } = useAtomValue(walletState)
  const { data, isPending: isLoading } = useQuery({
    queryKey: [`claimRecord/${address}`],
    queryFn: async () => {
      if (!address || !client || !client.intento) {
        throw new Error('Invalid address or wallet not connected')
      }
      try {
        const claimRecordResp = await client.intento.claim.v1.claimRecord({
          address,
        })
        const claimRecord = claimRecordResp ? claimRecordResp.claimRecord : ''
        return claimRecord
      } catch (error) {
        console.error('Error fetching claim record:', error)
        return '' // Return empty string in case of error
      }
    },
    enabled: !!address && !!client?.intento,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: 60000, // Cache data for 60 seconds
    gcTime: 300000, // Cache data for 5 minutes
  })

  return [data, isLoading] as const
}

export const useTotalClaimable = () => {
  const client = useIntentoRpcClient()
  const { address } = useAtomValue(walletState)
  const { data, isPending: isLoading } = useQuery({
    queryKey: ['claim_total', address],
    queryFn: async () => {
      if (!address || !client || !client.intento) {
        throw new Error('Invalid address or wallet not connected')
      }
      const total = (
        await client.intento.claim.v1.totalClaimable({ address })
      ).total.amount

      return total
    },
    enabled: !!address && !!client?.intento,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: 120000, // Cache data for 120 seconds
    gcTime: 300000, // Cache data for 5 minutes
  })

  return [data, isLoading] as const
}
