import { AssetList } from '@chain-registry/types'
import { atomWithStorage, RESET } from 'jotai/utils'
import { WritableAtom } from 'jotai'
import { SigningClient } from '@interchain-kit/react'

export enum WalletStatusType {
  /* nothing happens to the wallet */
  idle = '@wallet-state/idle',
  /* restored wallets state from the cache */
  restored = '@wallet-state/restored',
  /* the wallet is fully connected */
  connected = '@wallet-state/connected',
  /* connecting to the wallet */
  connecting = '@wallet-state/connecting',
  /* error when tried to connect */
  error = '@wallet-state/error',
}

type GeneratedWalletState<
  TClient extends any,
  TStateExtension extends {}
> = TStateExtension & {
  client: TClient | null
  status: WalletStatusType
  address: string
  assets?: AssetList | undefined
}

type CreateWalletStateArgs<TState = {}> = {
  key: string
  default: TState
}

function createWalletState<TClient = any, TState = {}>({
  key,
  default: defaultState,
}: CreateWalletStateArgs<TState>) {
  const CACHE_KEY = `@triggerportal/wallet-state/type-${key}`

  const storage = {
    getItem: (key: string, initialValue: GeneratedWalletState<TClient, TState>) => {
      if (typeof window === 'undefined') return initialValue
      try {
        const savedValue = localStorage.getItem(key)
        if (savedValue) {
          const parsedSavedState = JSON.parse(savedValue)
          if (parsedSavedState?.address) {
            return {
              ...parsedSavedState,
              client: null,
              status: WalletStatusType.restored,
            }
          }
        }
      } catch (e) { }
      return initialValue
    },
    setItem: (key: string, newValue: GeneratedWalletState<TClient, TState>) => {
      const isReset = !newValue.address
      if (isReset) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(
          key,
          /* let's not store the client in the cache */
          JSON.stringify({ ...newValue, client: null, status: null })
        )
      }
    },
    removeItem: (key: string) => localStorage.removeItem(key),
  }

  return atomWithStorage<GeneratedWalletState<TClient, TState>>(
    CACHE_KEY,
    {
      status: WalletStatusType.idle,
      client: null,
      address: '',
      assets: undefined,
      ...defaultState,
    },
    storage as any
  ) as WritableAtom<
    GeneratedWalletState<TClient, TState>,
    [GeneratedWalletState<TClient, TState> | typeof RESET | ((prev: GeneratedWalletState<TClient, TState>) => GeneratedWalletState<TClient, TState>)],
    void
  >
}

type LocalWalletState = GeneratedWalletState<SigningClient, { key?: string | null }>;
type IbcWalletState = GeneratedWalletState<SigningClient, { chainId?: string | null }>;

export const walletState: WritableAtom<
  LocalWalletState,
  [LocalWalletState | ((prev: LocalWalletState) => LocalWalletState) | typeof RESET],
  void
> = createWalletState<
  SigningClient,
  { key?: string | null }
>({
  key: 'internal-wallet',
  default: {
    key: null,
  },
})

export const ibcWalletState: WritableAtom<
  IbcWalletState,
  [IbcWalletState | ((prev: IbcWalletState) => IbcWalletState) | typeof RESET],
  void
> = createWalletState<
  SigningClient,
  {
    /* ibc wallet is connected */
    chainId?: string | null
  }
>({
  key: 'ibc-wallet',
  default: {
    chainId: null,
  },
})
