import {
  Button,
  ErrorIcon,
  formatSdkErrorMessage,
  IconWrapper,
  Toast,
  UpRightArrow,
  Valid,
} from 'components/ui-blocks'
import { toast } from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { executeRegisterAccount, getICA } from '../../../services/build'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { useIntentoRpcClient } from '../../../hooks/useRPCClient'

type UseRegisterAccountParams = {
  connectionId: string
  hostConnectionId: string
}

export const useRegisterAccount = ({
  connectionId,
  hostConnectionId,
}: UseRegisterAccountParams) => {
  const rpcClient = useIntentoRpcClient()
  const { client, address, status } = useAtomValue(walletState)
  const setTransactionState = useSetAtom(transactionStatusState)
  const [_, popConfetti] = useAtom(particleState)

  const refetchQueries = useRefetchQueries([
    'tokenBalance',
  ])

  return useMutation({
    mutationKey: ['registerICA'],
    mutationFn: async () => {
      if (status !== WalletStatusType.connected) {
        throw new Error('Please connect your wallet.')
      }

      if (rpcClient.intento == undefined) {
        throw new Error('client')
      }

      await executeRegisterAccount({
        owner: address,
        connectionId,
        hostConnectionId,
        client,
      })
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Valid />} color="primary" />}
          title="Now registering on destination chain"
          body={`Created an Interchain Account on Intento`}
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      await sleep(30000)
      let acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(20000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(15000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(5000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(5000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      return undefined
    },
    onSuccess(data) {
      console.log(data)
      toast.success('Succesfully registered account on destination chain')
      if (data) {
        popConfetti(true)
      }

      refetchQueries()
    },
    onError(e) {
      const errorMessage = formatSdkErrorMessage(e)

      toast.custom((t) => (
        <Toast
          icon={<ErrorIcon color="error" />}
          title="Oops registering account error!"
          body={errorMessage}
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
    },
    onSettled() {
      setTransactionState(TransactionStatus.IDLE)
    },
  })
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
