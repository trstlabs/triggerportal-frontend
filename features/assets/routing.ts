import type { AssetSymbol } from './registry'

export type ChainId = 'cosmoshub-4' | 'osmosis-1' | 'intento-1' | 'elys-1'

export interface IbcPath {
  sourcePort: 'transfer'
  sourceChannel: string
  counterpartyChainId: ChainId
}

export interface DexRouteStep {
  pool: string
  denomIn: string
  denomOut: string
}

export interface DexRoute {
  venue: 'osmosis-poolmanager'
  steps: DexRouteStep[]
}

export const IBC_PATHS: Record<AssetSymbol, Partial<Record<ChainId, IbcPath>>> = {
  ATOM: {
    'osmosis-1': { sourcePort: 'transfer', sourceChannel: 'channel-141', counterpartyChainId: 'osmosis-1' },
  },
  USDC: {
    'osmosis-1': { sourcePort: 'transfer', sourceChannel: 'channel-750', counterpartyChainId: 'osmosis-1' },
  },
  INTO: {
    'osmosis-1': { sourcePort: 'transfer', sourceChannel: 'channel-106076', counterpartyChainId: 'osmosis-1' },
  },
  OSMO: {},
  ELYS: {},
}

export const DEX_ROUTES: Record<string, DexRoute> = {
  'USDC->ATOM@osmosis-1': {
    venue: 'osmosis-poolmanager',
    steps: [
      { pool: '1464', denomIn: 'USDC (transfer/channel-750)', denomOut: 'uosmo' },
      { pool: '1265', denomIn: 'uosmo', denomOut: 'ATOM (transfer/channel-0)' },
    ],
  },
  'USDC->INTO@osmosis-1': {
    venue: 'osmosis-poolmanager',
    steps: [
      { pool: '3138', denomIn: 'USDC (transfer/channel-750)', denomOut: 'INTO (transfer/channel-106076)' },
    ],
  },
}
