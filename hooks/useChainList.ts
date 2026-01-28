import { chains } from 'chain-registry'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export type IBCAssetInfo = {
  id: string
  name: string
  registry_name: string
  symbol: string
  chain_id: string
  rpc: string
  denom: string
  decimals: number
  denom_local: string
  channel_to_intento: string
  channel: string
  logo_uri: string
  connection_id?: string
  deposit_gas_fee?: number
  external_deposit_uri?: string
  prefix: string
  union?: boolean
  universal_id?: string
}

export const useIBCAssetList = () => {
  const { data, isPending, isError, error } = useQuery<IBCAssetInfo[]>({
    queryKey: ['@ibc-asset-list'],
    queryFn: async () => {
      const url = process.env.NEXT_PUBLIC_IBC_ASSETS_URL

      if (!url) {
        console.error('IBC_ASSETS_URL is not defined')
        throw new Error('IBC_ASSETS_URL is not defined')
      }

      const response = await fetch(url)

      if (!response.ok) {
        console.error(`Failed to fetch IBC Asset List: ${response.statusText}`)
        throw new Error(
          `Failed to fetch IBC Asset List: ${response.statusText}`
        )
      }

      try {
        const data = await response.json()

        if (!Array.isArray(data)) {
          console.error('IBC Asset List is not in the expected array format')
          throw new Error('IBC Asset List is not in the expected array format')
        }

        return data
      } catch (e) {
        console.error('Error parsing IBC Asset List JSON:', e)
        throw new Error('Failed to parse IBC Asset List JSON')
      }
    },
    enabled: Boolean(process.env.NEXT_PUBLIC_IBC_ASSETS_URL),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 3, // Retry failed queries up to 3 times
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (isError) {
    console.warn('Failed to load IBC Asset List:', error)
  }

  // Return a consistent and safe output
  return [data ?? [], isPending] as const
}

//useIBCAssetInfoBySymbol
export const useChainInfoByChainID = (chainId: string) => {
  // First try to get chain info from local ibc_assets.json
  const [ibcAssets] = useIBCAssetList()
  if (ibcAssets && ibcAssets.length > 0) {
    const unionChain = ibcAssets.find(asset => asset.universal_id === chainId)
    if (unionChain) {
      return unionChain
    }


    const localChain = ibcAssets.find(asset => asset.chain_id === chainId)
    if (localChain) {
      return localChain
    }
  }
  // Fallback to chain registry if not found in local assets
  const chainRegistyChain = chains.find((chain) => chain.chainId === chainId)
  if (chainRegistyChain) {
    return transformChain(chainRegistyChain)
  }

  // As a last resort, try to find by chain name (for backward compatibility)
  const fallbackChain = chains.find((chain) => chain.chainName.toLowerCase().includes('intento'))
  if (fallbackChain) {
    console.warn(`Chain with ID ${chainId} not found, falling back to intento`)
    return transformChain(fallbackChain)
  }

  console.error(`No chain found for ID: ${chainId} and no fallback available`)
  return null
}

export const useChainRegistryList = () => {
  const [chainList, setChainList] = useState<IBCAssetInfo[]>([])

  useEffect(() => {
    const transformedData = chains
      .map(transformChain)
      .filter((chain) => chain !== null)

    setChainList(transformedData)
  }, []) // Added empty dependency array to run useEffect only once

  return chainList
}

function transformChain(chain: any) {
  // Check for missing logo URIs and other conditions
  if (!chain) {
    return null
  }
  const symbol =
    chain.fees && chain.fees.feeTokens[0]
      ? chain.fees.feeTokens[0].denom.slice(1).toUpperCase()
      : ''

  return {
    id: chain.chain_id,
    name: chain.pretty_name,
    registry_name: chain.chain_name,
    symbol: symbol,
    chain_id: chain.chain_id,
    rpc:
      chain.apis && chain.apis.rpc && chain.apis.rpc[0]
        ? chain.apis.rpc[0].address
        : '',
    denom:
      chain.fees && chain.fees.feeTokens[0]
        ? chain.fees.feeTokens[0].denom
        : '',
    decimals: 6, // Standard, TODO: Adjust as needed
    denom_local: '', // TODO: Find in ibc assets
    channel_to_intento: '', // TODO: Find in ibc assets
    channel: '', // TODO: Find in ibc assets
    logo_uri: chain.logo_URIs
      ? chain.logo_URIs.png || chain.logo_URIs.svg || chain.logo_URIs.jpeg
      : chain.images
        ? chain.images.png || chain.images.svg || chain.images.jpeg
        : '',
    connection_id: '',
    prefix: chain.bech32_prefix,
    status: chain.status,
  }
}
