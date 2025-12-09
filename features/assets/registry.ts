export type AssetSymbol = 'ATOM' | 'OSMO' | 'INTO' | 'ELYS' | 'USDC'

export interface AssetMeta {
  symbol: AssetSymbol
  iconUrl: string
  chainId?: string
  denom?: string
  decimals?: number
  addressPrefix?: string
}

export const ASSETS: Record<AssetSymbol, AssetMeta> = {
  ATOM: {
    symbol: 'ATOM',
    iconUrl: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
    chainId: 'cosmoshub-4',
    denom: 'uatom',
    decimals: 6,
    addressPrefix: 'cosmos',
  },
  OSMO: {
    symbol: 'OSMO',
    iconUrl: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg',
    chainId: 'osmosis-1',
    denom: 'uosmo',
    decimals: 6,
    addressPrefix: 'osmo',
  },
  INTO: {
    symbol: 'INTO',
    iconUrl: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/intento/images/into.png',
    chainId: 'intento-1',
    denom: 'uinto',
    decimals: 6,
    addressPrefix: 'into',
  },
  ELYS: {
    symbol: 'ELYS',
    iconUrl: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png',
    chainId: 'elys-1',
    denom: 'uelys',
    decimals: 6,
    addressPrefix: 'elys',
  },
  USDC: {
    symbol: 'USDC',
    iconUrl: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/usdc.png',
  },
}
