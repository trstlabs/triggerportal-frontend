import {
  Button,
  ErrorIcon,
  formatSdkErrorMessage,
  Toast,
  UpRightArrow,
} from 'components/ui-blocks'
import { toast } from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { executeCreateAuthzGrant, GrantResponse } from '../../../services/build'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { Coin } from '@cosmjs/stargate'
import { useChain } from '@interchain-kit/react'
import { useChainInfoByChainID } from '../../../hooks/useChainList'

type UseCreateAuthzGrantParams = {
  grantee: string
  grantInfos: GrantResponse[]
  coin?: Coin
  expirationDurationMs?: number
  onSuccess?: () => void
}

export const useCreateAuthzGrant = ({
  grantee,
  grantInfos,
  expirationDurationMs,
  coin,
  onSuccess,
}: UseCreateAuthzGrantParams) => {
  const { address, status, chainId } = useAtomValue(ibcWalletState)
  const chainInfo = useChainInfoByChainID(chainId)
  const { getSigningStargateClient } = useChain(chainInfo?.registry_name)


  const setTransactionState = useSetAtom(transactionStatusState)

  const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`, `userAuthZGrants/${grantee}/${address}/${grantInfos.length}`])

  let typeUrls = []
  for (const grant of grantInfos) {
    typeUrls.push(grant.msgTypeUrl)
  }

  return useMutation({
    mutationKey: ['createAuthzGrant'],
    mutationFn: async () => {
      if (status !== WalletStatusType.connected) {
        throw new Error('Please connect your wallet.')
      }
      const client = await getSigningStargateClient()
      console.log(client)
      return await executeCreateAuthzGrant({
        client,
        grantee,
        granter: address,
        typeUrls,
        expirationDurationMs,
        coin,
      })
    },
    onSuccess(data) {
      console.log(data)
      //popConfetti(true)
      //
      toast.success('Successfully created AuthZ grant')
      if (coin?.amount && coin.amount !== '0') {
        toast.success('Successfully sent funds')
      }
      refetchQueries()
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    },
    onError(e) {
      const errorMessage = formatSdkErrorMessage(e)
      console.log(errorMessage)
      // Optional prompt to reload on RPC/signer-related errors
      if (errorMessage.includes('from signer')) {
        const shouldReload = window.confirm(`RPC error: ${errorMessage}\n\nReload the page now?`)
        if (shouldReload) {
          window.location.reload()
          return
        }
      }
      if (!errorMessage.includes('invalid granter address')) {
        toast.custom((t) => (
          <Toast
            icon={<ErrorIcon color="error" />}
            title="Oops creating authz grant error!"
            body={errorMessage + " .Please check you have funds on your wallet address on this chain."}
            buttons={
              <Button
                as="a"
                variant="ghost"
                href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
                target="__blank"
                iconRight={<UpRightArrow />}
              >
                Provide feedback
              </Button>
            }
            onClose={() => toast.dismiss(t.id)}
          />
        ))
      }
    },
    onSettled() {
      setTransactionState(TransactionStatus.IDLE)
    },
  })
}
