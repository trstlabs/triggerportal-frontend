import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { convertMicroDenomToDenom } from 'util/conversion'
import { SigningStargateClient } from '@cosmjs/stargate'
// import { CW20 } from '../services/cw20'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { getIBCAssetInfoFromList, useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo, useIBCAssetList } from './useChainList'

import { getBalanceForAcc } from '../services/chain-info'
import { useCosmosRpcClient } from './useRPCClient'
import { QueryAllBalancesResponse } from 'intentojs/dist/codegen/cosmos/bank/v1beta1/query'

async function fetchTokenBalance({
  client,
  token: { denom_local, decimals },
  address,
}: {
  client: SigningStargateClient
  token: {
    decimals?: number
    denom_local?: string
  }
  address: string
}) {
  if (!denom_local) {
    throw new Error(
      `No denom provided to fetch the balance.`
    )
  }

  /*
   * if this is a native asset or an ibc asset that has denom_local
   *  */

  const resp = await client.getBalance(address, denom_local)
  const amount = resp ? Number(resp.amount) : 0
  return convertMicroDenomToDenom(amount, decimals)

  //  (denom_local) {
  //   const resp = await client.getBalance(address, denom_local)
  //   const amount = resp ? Number(resp.amount) : 0
  //   return convertMicroDenomToDenom(amount, decimals)
  // }


}

const mapIbcTokenToNative = (ibcToken?: IBCAssetInfo) => {
  if (ibcToken?.denom_local) {
    return {
      ...ibcToken,
      native: true,
      denom: ibcToken.denom_local,
    }
  }
  return undefined
}

export const useTokenBalance = (tokenSymbol: string) => {
  const { address, status, client } = useAtomValue(walletState)
  const ibcAssetInfo = useIBCAssetInfo(tokenSymbol)

  const { data: balance = 0, isPending: isLoading } = useQuery({
    queryKey: [`tokenBalance/${tokenSymbol}/${address}`],
    // ['tokenBalance'],
    queryFn: async ({ queryKey: [symbol] }) => {
      if (symbol && client && ibcAssetInfo) {
        return await fetchTokenBalance({
          client,
          address,
          token: ibcAssetInfo,
        })
      }
    },
    enabled: Boolean(
      tokenSymbol && status === WalletStatusType.connected && client && ibcAssetInfo
    ),
    refetchOnMount: 'always', // Refetch when the component mounts
    refetchInterval: 30000,    // Refetch every 30 seconds
    staleTime: 5000,           // Cache expires after 5 seconds
    gcTime: 300000,         // Cache data for 5 minutes
    refetchOnWindowFocus: true,
  })
  return { balance, isLoading }
}

export const useMultipleTokenBalance = (tokenSymbols?: Array<string>) => {
  const { address, status, client } = useAtomValue(walletState)

  const [ibcAssetsList] = useIBCAssetList()

  const queryKey = useMemo(
    () => `multipleTokenBalances / ${tokenSymbols?.join('+')}`,
    [tokenSymbols]
  )

  const { data, isPending: isLoading } = useQuery({
    queryKey: [queryKey, address],
    queryFn: async () => {
      const balances = await Promise.all(
        tokenSymbols.map((tokenSymbol) =>
          fetchTokenBalance({
            client,
            address,
            token:
              mapIbcTokenToNative(
                getIBCAssetInfoFromList(tokenSymbol, ibcAssetsList)
              ) ||
              {},
          })
        )
      )

      return tokenSymbols.map((tokenSymbol, index) => ({
        tokenSymbol,
        balance: balances[index],
      }))
    },
    enabled: Boolean(
      status === WalletStatusType.connected &&
      tokenSymbols?.length &&
      ibcAssetsList
    ),

    refetchOnMount: 'always', // Refetch when the component mounts
    refetchInterval: 30000,    // Refetch every 30 seconds
    staleTime: 5000,           // Cache expires after 5 seconds
    gcTime: 300000,         // Cache data for 5 minutes
    refetchOnWindowFocus: true,
  })

  return [data, isLoading] as const
}

export const useGetBalancesForAcc = (address: string) => {
  const client = useCosmosRpcClient()
  const enabled = !!address && !!client

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['address', address],
    queryFn: async () => {
      const resp: QueryAllBalancesResponse = await getBalanceForAcc({ address, client })
      return resp.balances
    },
    enabled
  })

  return [data, isLoading] as const
}
