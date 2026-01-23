import { useEffect } from 'react'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useChain } from '@interchain-kit/react'
import { addLocalChainToKeplr } from './useConnectIBCWallet'
export const useAfterConnectWallet = (
  mutationOptions?: UseMutationOptions<void, unknown, void, unknown>,
) => {
  let { connect, getSigningClient, address, username, status: walletStatus } =
    useChain(process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME)

  const [{ status }, setWalletState] = useAtom(walletState)
  const mutation = useMutation<void, unknown, void, unknown>({
    ...mutationOptions,
    mutationFn: async () => {
      setWalletState((value) => ({
        ...value,
        state: WalletStatusType.connecting,
      }))
      console.log("useAfterConnectWallet", username, address, walletStatus)

      try {
        if (address) {


          const chainClient = await getSigningClient()
          if (chainClient) {
            setWalletState({
              key: username,
              address,
              client: chainClient,
              status: WalletStatusType.connected,
              assets: undefined,
            })
          } else {
            // Handle the case where the client could not be obtained
            throw new Error('Failed to obtain the client')
          }
        } else if (process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME.toLowerCase().includes("devnet")) {
          const added = await addLocalChainToKeplr(process.env.NEXT_PUBLIC_INTO_CHAIN_ID);
          if (added) {
            console.log('Chain added to Keplr, waiting for chain to be ready...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        }
      } catch (error) {
        console.error('Error connecting the wallet:', error)
        setWalletState({
          status: WalletStatusType.error,
          address: '',
          client: null,
          assets: undefined,
        })
        throw error
      }
    },
  })

  useEffect(
    function restoreWalletConnectionIfHadBeenConnectedBefore() {
      console.log("restoreWalletConnectionIfHadBeenConnectedBefore", status)
      /* restore wallet connection if the state has been set with the */
      if (status === WalletStatusType.restored || status === WalletStatusType.idle) {
        connect()
        mutation.mutate()
      }
    },
    [status]
  )


  return mutation
}
