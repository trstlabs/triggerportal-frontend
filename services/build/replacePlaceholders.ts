// Utility to recursively replace placeholders in message values
// Used by transformAndEncodeMsgs and can be reused elsewhere
import { fromBech32, toBech32 } from '@cosmjs/encoding'
import { sha256 } from '@cosmjs/crypto'
import { toHex } from '@cosmjs/encoding'

export interface ReplacePlaceholdersParams {
  value: any
  ownerAddress?: string
  ibcWalletAddress?: string
}

/**
 * Recursively replaces 'Your Intento address' and 'Your Address' placeholders in the provided value.
 * Throws if the required addresses are missing.
 */
export function replacePlaceholders({
  value,
  ownerAddress,
  ibcWalletAddress,
}: ReplacePlaceholdersParams): any {
  if (value === 'Your Intento address') {
    if (!ownerAddress) {
      throw new Error(
        'Your Intento address placeholder found but no owner address provided'
      )
    }
    return ownerAddress
  }

  if (value === 'Your address') {
    if (!ibcWalletAddress) {
      throw new Error(
        'Your address placeholder found but no IBC wallet connected'
      )
    }
    return ibcWalletAddress
  }

  if (typeof value === 'string') {
    const replacedValue = value.replace(/([A-Z]+) \(([^)]+)\)/g, (_, symbol, path) => {
      return pathToIbcDenom(path, symbol);
    });
    if (replacedValue !== value) {
      return replacedValue;
    }
  }
    
  if (
    typeof value === 'string' &&
    value.startsWith('Your ') &&
    value.endsWith(' address')
  ) {
    if (!ibcWalletAddress) {
      throw new Error('Address placeholder found but no IBC wallet connected')
    }

    // Extract the chain symbol from the placeholder
    const prefix = value.replace('Your ', '').replace(' address', '')
    if (!prefix) {
      throw new Error('Invalid address placeholder format')
    }
    const { data } = fromBech32(ibcWalletAddress)
    return toBech32(prefix.toLowerCase(), data)
  }

  if (Array.isArray(value)) {
    return value.map((v) =>
      replacePlaceholders({ value: v, ownerAddress, ibcWalletAddress })
    )
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      // Special handling for memo field which is a JSON string
      if (key === 'memo' && typeof val === 'string') {
        try {
          // Parse the memo as JSON and process any placeholders in it
          const memoObj = JSON.parse(val)
          const processedMemo = replacePlaceholders({
            value: memoObj,
            ownerAddress,
            ibcWalletAddress,
          })
          result[key] = JSON.stringify(processedMemo)
          continue
        } catch (e) {
          // If parsing fails, treat it as a regular string
          console.warn('Failed to parse memo as JSON:', e)
        }
      }

      // Recursively process other object properties
      result[key] = replacePlaceholders({
        value: val,
        ownerAddress,
        ibcWalletAddress,
      })
    }
    return result
  }

  return value
}



/**
 * Convert a denom path into its ibc/<hash> form.
 */
function pathToIbcDenom(tracePath: string, baseDenom: string): string {
  console.log(tracePath, baseDenom)
  const normalizedDenom = baseDenom.trim().toLowerCase();
  const fullTrace = `${tracePath}/u${normalizedDenom}`;
  const encoder = new TextEncoder();
  const hash = sha256(encoder.encode(fullTrace));
  return "ibc/" + toHex(hash).toUpperCase();
}
