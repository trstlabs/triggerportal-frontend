import { useQuery } from '@tanstack/react-query'

// Osmosis LCD endpoint
const LCD = "https://lcd.osmosis.zone"
const POOL_ID = 3138

/**
 * Fetches pool 3138 and calculates INTO price in USDC
 */
async function fetchINTOPrice(): Promise<number> {
  try {
    // fetch pool data
    const res = await fetch(`${LCD}/osmosis/gamm/v1beta1/pools/${POOL_ID}`)
    if (!res.ok) throw new Error(`Failed to fetch pool: ${res.statusText}`)
    const data = await res.json()

    const pool = data.pool

    if (!pool?.current_sqrt_price) throw new Error("Invalid CL pool data");

    const sqrtPrice = parseFloat(pool.current_sqrt_price);

    // token0 = INTO, token1 = USDC
    const priceToken1PerToken0 = sqrtPrice ** 2; // price of 1 INTO in USDC

    return priceToken1PerToken0;

  } catch (error) {
    console.error('Error fetching INTO price:', error)
    throw error
  }
}

/**
 * Hook to fetch INTO price from Osmosis pool 3138
 */
export const useINTOPrice = () => {
  const { data: price, isPending: isLoading, error } = useQuery({
    queryKey: ['intoPrice'],
    queryFn: fetchINTOPrice,
    refetchInterval: 60000,    // Refetch every minute
    staleTime: 30000,          // Cache for 30 seconds
    gcTime: 300000,         // Cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    price: price || 0,
    isLoading,
    error
  }
}
