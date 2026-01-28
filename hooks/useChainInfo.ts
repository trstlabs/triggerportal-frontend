import { ChainInfo } from '@keplr-wallet/types'
import { useQuery } from '@tanstack/react-query'
import { queryClient } from '../services/queryClient'

import {
  getExpectedFlowFee,
  getFlowParams,
  getStakeBalanceForAcc,
  getAPR,
  getModuleParams,
} from '../services/chain-info'
import { convertMicroDenomToDenom } from '../util/conversion'
import { cosmos } from 'intentojs'
import {
  DEFAULT_REFETCH_INTERVAL,
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'

import {
  useIntentoRpcClient,
  useCosmosRpcClient,
  useTendermintRpcClient,
} from './useRPCClient'
import { useAtom, useAtomValue } from 'jotai'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'

import {
  paramsStateAtom,
  intentModuleParamsAtom,
} from '../state/atoms/moduleParamsAtoms'
import { useEffect, useMemo } from 'react'
import { FlowInput } from '../types/trstTypes'

const chainInfoQueryKey = '@chain-info'

export const unsafelyReadChainInfoCache = () =>
  queryClient.getQueryCache().find({ queryKey: [chainInfoQueryKey] })?.state?.data as
  | ChainInfo
  | undefined

export const useIBCChainInfo = (chainId: string) => {
  const { data, isPending: isLoading } = useQuery<ChainInfo>({
    queryKey: ['@chain-info'],
    queryFn: async () => {
      const response = await fetch('/chain_info.local' + chainId + '.json')
      return await response.json()
    },
  })
  return [data, isLoading] as const
}

export const useGetExpectedFlowFees = (
  durationSeconds: number,
  flowInput: FlowInput,
  intervalSeconds?: number,
  trustlessAgent?: any
) => {
  const [intentModuleParams, setTriggerModuleData] = useAtom(
    intentModuleParamsAtom
  ) as any
  const client = useIntentoRpcClient()

  // Calculate recurrences based on interval and duration
  let recurrences =
    intervalSeconds && intervalSeconds > 0 && intervalSeconds < durationSeconds
      ? Math.floor(durationSeconds / intervalSeconds)
      : 1

  // Add extra recurrence if there's a startTime
  if (flowInput.startTime && flowInput.startTime > 0) {
    recurrences++
  }

  const stableQueryKey = useMemo(
    () => [
      'expectedFlowFees',
      recurrences,
      flowInput.msgs?.length || 0,
      trustlessAgent?.address ?? null,
      intentModuleParams?.gasFeeCoins?.map((coin) => coin.denom).join(',') ||
      '',
    ],
    [
      recurrences,
      flowInput.msgs,
      trustlessAgent?.address,
      intentModuleParams?.gasFeeCoins,
    ]
  )

  const { data, isPending: isLoading, error } = useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      console.log(intentModuleParams)
      if (!intentModuleParams) {
        try {
          const params = await getFlowParams(client)
          setTriggerModuleData(params)
          return []
        } catch (error) {
          console.error('Error getting flow params:', error)
          return []
        }
      }

      if (!flowInput.msgs || flowInput.msgs.length === 0) {
        console.warn('No messages in flowInput')
        return []
      }

      if (!intentModuleParams.gasFeeCoins?.length) {
        console.warn('No supported denoms found in gasFeeCoins')
        return []
      }

      // Calculate fees for all supported denoms
      const fees = []

      for (const coin of intentModuleParams.gasFeeCoins) {
        try {
          const amount = getExpectedFlowFee(
            intentModuleParams,
            200000, // Default gas used
            flowInput.msgs.length,
            recurrences,
            coin.denom,
            trustlessAgent
          )
          console.log(amount)
          if (amount > 0) {
            fees.push({
              amount: amount.toString(),
              denom: coin.denom,
            })
          }
        } catch (err) {
          console.error(`Error calculating fee for denom ${coin.denom}:`, err)
        }
      }

      return fees
    },
    enabled: Boolean(client?.intento && flowInput?.msgs?.length > 0),
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
  })

  return {
    fees: data || [],
    isLoading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: [stableQueryKey[0] as string] }),
  }
}

export const useGetExpectedFlowFee = (
  durationSeconds: number,
  flowInput: FlowInput,
  denom: string,
  intervalSeconds?: number,
  trustlessAgent?: any // Add trustlessAgent parameter
) => {
  let [intentModuleParams, setTriggerModuleData] = useAtom(
    intentModuleParamsAtom
  ) as any
  // Calculate recurrences based on interval and duration
  let recurrences =
    intervalSeconds && intervalSeconds > 0 && intervalSeconds < durationSeconds
      ? Math.floor(durationSeconds / intervalSeconds)
      : 1

  // Add extra recurrence if there's a startTime
  if (flowInput.startTime && flowInput.startTime > 0) {
    recurrences++
  }
  const client = useIntentoRpcClient()

  const stableQueryKey = useMemo(
    () => [
      'expectedFlowFee',
      recurrences,
      denom,
      flowInput.msgs?.length || 0,
      trustlessAgent?.address ?? null,
    ],
    [recurrences, denom, flowInput.msgs, trustlessAgent?.address]
  )

  const { data, isPending: isLoading } = useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      // Make sure client exists and has the intento property before proceeding
      if (!client || !client.intento) {
        console.warn('RPC client not ready or missing intento property')
        return { fee: 0, symbol: denom }
      }

      if (!intentModuleParams) {
        try {
          intentModuleParams = await getFlowParams(client)
          setTriggerModuleData(intentModuleParams)
        } catch (error) {
          console.error('Error getting flow params:', error)
          return { fee: 0, symbol: denom }
        }
      }

      // Validate inputs
      if (!flowInput.msgs || flowInput.msgs.length === 0) {
        console.warn('No messages in flowInput')
        return { fee: 0, symbol: denom }
      }

      try {
        // Ensure we have valid parameters before calling getExpectedFlowFee
        if (!intentModuleParams || !denom) {
          console.warn('Missing required parameters for fee calculation')
          return { fee: 0, symbol: denom }
        }

        // Get the actual denom to use based on the symbol
        // Always use denom_local from ibcAssetInfo if available

        //console.log('Using denom for fee calculation:', denom)

        // Log the denoms we're using
        console.log('Fee calculation:', {
          denom,
          recurrences,
          lenMsgs: flowInput.msgs.length,
          trustlessAgent,
        })

        // First try with the actual denom (denom_local)
        let fee = getExpectedFlowFee(
          intentModuleParams,
          200000, // Default gas used
          flowInput.msgs.length,
          recurrences,
          denom,
          trustlessAgent // Pass hosted account for fee calculation
        )

        // Always calculate the fee in uinto for comparison
        const intoFee = getExpectedFlowFee(
          intentModuleParams,
          200000, // Default gas used
          flowInput.msgs.length,
          recurrences,
          'uinto', // Use the native token for comparison
          trustlessAgent // Pass hosted account for fee calculation
        )

        console.log(`Fee in denom: ${fee}, Fee in INTO: ${intoFee}`)

        // If fee is 0 but intoFee is not, it means the provided denom isn't supported
        // In this case, use the intoFee but keep the original symbol for display
        if (fee === 0 && intoFee > 0) {
          console.log(
            `No fee found for ${denom}, using INTO fee instead:`,
            intoFee
          )
          fee = intoFee
          denom = 'uinto'
        }

        // Hosted account fee is now handled in getExpectedFlowFee

        return { fee, denom }
      } catch (error) {
        console.error('Error calculating fee:', error)
        return { fee: 0, symbol: denom }
      }
    },
    enabled: Boolean(
      durationSeconds &&
      flowInput.msgs &&
      flowInput.msgs.length > 0 &&
      denom &&
      client
    ),
    refetchOnMount: true,
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 30000, // Keep in cache for 30 seconds
    retry: 1, // Limit retries to avoid excessive error messages
  })

  return [data?.fee || 0, isLoading, data?.symbol || denom] as const
}

export const useGetTotalBurned = () => {
  const client = useIntentoRpcClient()
  const { data, isPending: isLoading } = useQuery({
    queryKey: ['useGetTotalBurned'],
    queryFn: async () => {
      //base value is approximate from total flow message executions pre block 3455000
      if (!client) return 200000000 // Default base value

      try {
        // Call the totalBurnt query from the intent module
        const response = await client.intento.intent.v1.totalBurnt({})

        // The response should have an amount field with the total burned tokens in microunits
        return Number(response.totalBurnt.amount) + 200000000
      } catch (e) {
        console.error('Error getting total burned tokens:', e)
        return 200000000 // Fallback to base value if there's an error
      }
    },
    enabled: Boolean(client?.intento?.intent?.v1?.totalBurnt),
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchOnMount: 'always',
  })
  return [data || 1043 * 10000, isLoading] as const
}

export const useGetAllValidators = () => {
  const client = useCosmosRpcClient()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getAllValidators'],
    queryFn: async () => {
      return client.cosmos.staking.v1beta1.validators({
        status: cosmos.staking.v1beta1.bondStatusToJSON(
          cosmos.staking.v1beta1.BondStatus.BOND_STATUS_BONDED
        ),
        pagination: undefined,
      })
    },
    enabled: Boolean(client),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}

export const useGetStakeBalanceForAcc = () => {
  const { address, status } = useAtomValue(walletState)
  const client = useIntentoRpcClient()
  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getStakeBalanceForAcc'],
    queryFn: async () => {
      const resp = await getStakeBalanceForAcc({ address, client })
      resp.stakingBalanceAmount = convertMicroDenomToDenom(
        resp.stakingBalanceAmount,
        6
      )

      return resp
    },
    enabled: Boolean(
      client && address && status === WalletStatusType.connected
    ),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}

export const useGetAPR = () => {
  const cosmosClient = useCosmosRpcClient()
  const client = useTendermintRpcClient()
  const paramsState = useAtomValue(paramsStateAtom)

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getAPR'],
    queryFn: async () => {
      const resp = await getAPR(cosmosClient, client, paramsState)
      return resp
    },
    enabled: Boolean(client && paramsState),
    refetchOnMount: false,
    staleTime: 60000, // Cache data for 60 seconds
    gcTime: 300000, // Cache data for 5 minutes
  })

  return [data, isLoading] as const
}

export const useSetModuleParams = () => {
  const trstClient = useIntentoRpcClient()
  const cosmosClient = useCosmosRpcClient()
  const [paramsState, setParamsState] = useAtom(paramsStateAtom) as any

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getModuleParams'],
    queryFn: async () => {
      const resp = await getModuleParams(cosmosClient, trstClient)
      setParamsState(resp)
      return resp
    },
    enabled: Boolean(cosmosClient && trstClient),
    refetchOnMount: 'always',
  })
  useEffect(() => {
    if (paramsState) {
    }
  }, [paramsState])

  return [data, isLoading] as const
}

export const useGetAPYWithFees = (
  duration: number,
  interval: number,
  stakingBalance: number,
  nrMessages: number
) => {
  const [intentModuleParams, setTriggerModuleData] = useAtom(
    intentModuleParamsAtom
  ) as any
  const paramsState = useAtomValue(paramsStateAtom)

  const trstClient = useIntentoRpcClient()
  const { client } = useAtomValue(walletState)

  // Use useAPR instead of getAPR
  const [APR, isLoadingAPR] = useGetAPR()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['useGetAPYWithFees'],
    queryFn: async () => {
      const intentModuleParams = await getFlowParams(trstClient)
      setTriggerModuleData(intentModuleParams)
      const recurrences =
        interval && interval < duration ? Math.floor(duration / interval) : 1

      // Calculate the APY percentage first (same as useGetAPY)
      const periodsPerYear = (60 * 60 * 24 * 365) / interval
      const baseAPY =
        ((1 + APR.estimatedApr / 100 / periodsPerYear) ** periodsPerYear - 1) *
        100

      // Calculate fees for the entire period
      const expectedFees = getExpectedFlowFee(
        intentModuleParams,
        200000,
        nrMessages,
        recurrences,
        'uinto'
      )

      // Convert fees from micro units to INTO tokens
      const feesInINTO = convertMicroDenomToDenom(expectedFees, 6)

      // Calculate the effective APY by reducing the staking rewards by the fees
      // This is a simplified calculation - in reality, fees would be deducted periodically
      const feesAsPercentageOfStakingBalance =
        (feesInINTO / stakingBalance) * 100

      // Reduce the APY by the fee percentage
      return Math.max(0, baseAPY - feesAsPercentageOfStakingBalance)
    },
    enabled: Boolean(client && APR && paramsState && stakingBalance > 0), // Ensure apr is available before executing
    refetchOnMount: false,
    staleTime: 60000, // Cache data for 60 seconds
    gcTime: 300000, // Cache data for 5 minutes
  })
  useEffect(() => {
    if (intentModuleParams && intentModuleParams.flowFlexFeeMul) {
    }
  }, [intentModuleParams])

  return [data, isLoading || isLoadingAPR] as const
}

export const useGetAPY = (intervalSeconds: number) => {
  const { client } = useAtomValue(walletState)
  const paramsState = useAtomValue(paramsStateAtom)

  // Use useAPR instead of getAPR
  const [APR, isLoadingAPR] = useGetAPR()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['useGetAPY'],
    queryFn: async () => {
      const periodsPerYear = (60 * 60 * 24 * 365) / intervalSeconds

      return (
        ((1 + APR.estimatedApr / 100 / periodsPerYear) ** periodsPerYear - 1) *
        100
      )
    },
    enabled: Boolean(client && intervalSeconds > 0 && APR && paramsState),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading || isLoadingAPR] as const
}

export const useGetTotalSupply = () => {
  const client = useIntentoRpcClient()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getTotalSupply'],
    queryFn: async () => {
      const { getTotalSupply } = await import('../services/chain-info')
      return getTotalSupply({ client })
    },
    enabled: Boolean(client),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}

export const useGetCommunityPool = () => {
  const client = useIntentoRpcClient()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getCommunityPool'],
    queryFn: async () => {
      const { getCommunityPool } = await import('../services/chain-info')
      return getCommunityPool({ client })
    },
    enabled: Boolean(client),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}

export const useGetChainAndTeamWalletsBalance = () => {
  const client = useIntentoRpcClient()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getChainAndTeamWalletsBalance'],
    queryFn: async () => {
      const { getChainAndTeamWalletsBalance } = await import(
        '../services/chain-info'
      )
      return getChainAndTeamWalletsBalance({ client })
    },
    enabled: Boolean(client),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}

export const useGetCirculatingSupply = () => {
  const [totalSupply, isTotalSupplyLoading] = useGetTotalSupply()
  const [communityPool, isCommunityPoolLoading] = useGetCommunityPool()
  const [chainAndTeamWallets, isChainAndTeamWalletsLoading] =
    useGetChainAndTeamWalletsBalance()

  const circulatingSupply = useMemo(() => {
    if (
      totalSupply &&
      communityPool &&
      Number(totalSupply) &&
      Number(communityPool) &&
      Number(chainAndTeamWallets)
    ) {
      return totalSupply - communityPool - chainAndTeamWallets
    }
    return null
  }, [totalSupply, communityPool, chainAndTeamWallets])

  const isLoading =
    isTotalSupplyLoading ||
    isCommunityPoolLoading ||
    isChainAndTeamWalletsLoading

  return [circulatingSupply, isLoading] as const
}

export const useGetAirdropClawback = () => {
  const client = useIntentoRpcClient()

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['getAirdropClawback'],
    queryFn: async () => {
      if (!client) return { percentage: 0, amount: 0 }

      try {
        const initialModuleBalance = 89973272000000 // 89,973,272,000,000 in micro units
        const moduleAccAddress = 'into1m5dncvfv7lvpvycr23zja93fecun2kcvdnvuvq'

        const coin = await client.cosmos.bank.v1beta1.balance({
          address: moduleAccAddress,
          denom: 'uinto',
        })

        if (coin?.balance) {
          const diff = initialModuleBalance - Number(coin.balance.amount)
          const percentage = (diff / initialModuleBalance) * 100
          return {
            percentage: Number(percentage.toFixed(3)),
            amount: diff,
          }
        }
        return { percentage: 0, amount: 0 }
      } catch (error) {
        console.error('Error fetching airdrop clawback:', error)
        return { percentage: 0, amount: 0 }
      }
    },
    enabled: Boolean(client),
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}
