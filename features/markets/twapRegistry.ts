export interface TwapQuery {
  valueType: string
  queryKeyBase64: string
  chainId: 'osmosis-1'
  connectionId: string
  timeoutSeconds: number
}

export const TWAP_KEYS: Record<string, TwapQuery> = {
  'ATOM/USDC@osmosis-1': {
    valueType: 'osmosistwapv1beta1.TwapRecord.P0LastSpotPrice',
    queryKeyBase64: 'cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=',
    chainId: 'osmosis-1',
    connectionId: 'connection-1',
    timeoutSeconds: 120,
  },
  'INTO/USDC@osmosis-1': {
    valueType: 'osmosistwapv1beta1.TwapRecord.P0LastSpotPrice',
    queryKeyBase64: 'cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDMxMzh8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTR8aWJjL0JFMDcyQzAzREE1NDRDRjI4MjQ5OTQxOEU3QkM2NEQzODYxNDg3OUIzRUU5NUY5QUQ5MUU2QzM3MjY3RDQ4MzY=',
    chainId: 'osmosis-1',
    connectionId: 'connection-1',
    timeoutSeconds: 120,
  },
}
