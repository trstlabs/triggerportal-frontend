import { Coin } from 'intentojs/dist/codegen/cosmos/base/v1beta1/coin'
import { useIBCAssetList } from '../../hooks/useChainList'

export const protectAgainstNaN = (value: number) => (isNaN(value) ? 0 : value)

export function convertMicroDenomToDenom(
  value: number | string,
  decimals: number
): number {
  if (decimals === 0) return Number(value)

  return protectAgainstNaN(Number(value) / Math.pow(10, decimals))
}

export function convertDenomToMicroDenom(
  value: number | string,
  decimals: number
): number {
  if (decimals === 0) return Number(value)

  return protectAgainstNaN(
    parseInt(String(Number(value) * Math.pow(10, decimals)), 10)
  )
}

export function convertFromMicroDenom(denom: string) {
  if (denom?.startsWith('i')) {
    return denom?.toUpperCase()
  }
  return denom?.substring(1).toUpperCase()
}

export function convertToFixedDecimals(value: number | string): string {
  const amount = Number(value)
  return amount > 0.01 ? amount.toFixed(2) : String(amount)
}

export const formatTokenName = (name: string) => {
  if (name) {
    return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
  }
  return ''
}

// Format denom by removing 'u' prefix and capitalizing
export const formatDenom = (denom: string): string => {
  // For non-IBC denoms, handle the 'u' prefix if it exists
  if (/^u[a-z]+$/.test(denom)) {
    return denom.slice(1).toUpperCase()
  }
  return denom.toUpperCase()
}

interface IBCAssetInfo {
  denom: string
  denom_local: string
  symbol: string
  [key: string]: any
}

export function resolveDenomSync(
  denom: string,
  ibcAssets?: IBCAssetInfo[]
): string {
  if (!denom.toLowerCase().startsWith('ibc/')) return formatDenom(denom)
  // If IBC assets list is provided, try to find a match
  if (ibcAssets?.length) {
    const matchingAsset = ibcAssets.find(
      (asset) =>
        asset.denom &&
        (asset.denom === denom ||
          asset.denom_local === denom ||
          (denom.startsWith('ibc/') &&
            asset.denom.endsWith(denom.split('/').pop()!)))
    )
    if (matchingAsset) {
      return matchingAsset.symbol
    }
  }
  // Fallback to just formatting the denom if no match found
  return formatDenom(denom)
}

export async function resolveDenom(denom: string): Promise<string> {
  if (!denom.toLowerCase().startsWith('ibc/')) return formatDenom(denom)
  // First check if we have the denom in our IBC asset list
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_IBC_ASSETS_URL)
    if (response.ok) {
      const assets: Array<{
        denom: string
        denom_local: string
        symbol: string
        [key: string]: any
      }> = await response.json()

      // Try to find a matching denom in the asset list
      const matchingAsset = assets.find(
        (asset) =>
          asset.denom === denom ||
          asset.denom_local === denom ||
          (denom.startsWith('ibc/') &&
            asset.denom.endsWith(denom.split('/').pop()!))
      )

      if (matchingAsset) {
        return matchingAsset.symbol
      }
    }
  } catch (error) {
    console.warn('Failed to fetch IBC asset list:', error)
  }

  const hash = denom.split('/')[1]
  const apiBase = process.env.NEXT_PUBLIC_INTO_API
  const url = `${apiBase}/ibc/apps/transfer/v1/denom_traces/${hash}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch denom trace')
    const data = await res.json()
    const base = data?.denom_trace?.base_denom || denom
    const path = data?.denom_trace?.path || ''
    return `${formatDenom(base)}${path ? ` (${path})` : ''}`
  } catch (err) {
    console.warn(`Failed to resolve denom ${denom}:`, err)
    return formatDenom(denom)
  }
}

export function resolveDenoms(coins: Coin[]): Coin[] {
  const ibcAssets = useIBCAssetList()[0]
  coins.map((coin) => (coin.denom = resolveDenomSync(coin.denom, ibcAssets)))
  return coins
}

export function removeEmptyProperties(obj: any): any {
  const newObj = {}
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
      continue
    }
    if (Array.isArray(obj[key]) && obj[key].length === 0) {
      continue
    }
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      const nested = removeEmptyProperties(obj[key])
      if (Object.keys(nested).length > 0) {
        newObj[key] = nested
      }
    } else {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

export const convertBigIntToString = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString)
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'bigint') {
        return [key, value.toString()]
      }

      // // Special handling to avoid wrapping amount/denom objects
      // if (typeof value === 'object' && value !== null && 'denom' in value && 'amount' in value) {
      //     return [key, { denom: String(value.denom), amount: String(value.amount) }];
      // }

      return [key, convertBigIntToString(value)]
    })
  )
}

// Format time display
export const formatTimeDisplay = (ms: number, hideOne?: boolean): string => {
  if (ms === 0) return 'None'

  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) {
    return seconds === 1 ? hideOne ? 'second' : '1 second' : `${seconds} seconds`
  } else if (seconds < 60 * 60) {
    const minutes = Math.floor(seconds / 60)
    return minutes === 1 ? hideOne ? 'minute' : '1 minute' : `${minutes} minutes`
  } else if (seconds < 60 * 60 * 24 * 2) {
    // Less than 2 days, show in hours
    const hours = Math.floor(seconds / (60 * 60))
    return hours === 1 ? hideOne ? 'hour' : '1 hour' : `${hours} hours`
  } else if (seconds < 60 * 60 * 24 * 7) {
    // Less than 1 week, show in days
    const days = Math.floor(seconds / (60 * 60 * 24))
    return days === 1 ? hideOne ? 'day' : '1 day' : `${days} days`
  } else if (seconds < 60 * 60 * 24 * 30) {
    // Less than 1 month, show in weeks
    const weeks = Math.floor(seconds / (60 * 60 * 24 * 7))
    return weeks === 1 ? hideOne ? 'week' : '1 week' : `${weeks} weeks`
  } else if (seconds < 60 * 60 * 24 * 365) {
    // Less than 1 year, show in months
    const months = Math.floor(seconds / (60 * 60 * 24 * 30))
    return months === 1 ? hideOne ? 'month' : '1 month' : `${months} months`
  } else {
    const years = Math.floor(seconds / (60 * 60 * 24 * 365))
    return years === 1 ? hideOne ? 'year' : '1 year' : `${years} years`
  }
}
