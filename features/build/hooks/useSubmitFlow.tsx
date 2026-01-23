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
import { executeSubmitFlow } from '../../../services/build'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType, ibcWalletState } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { DeliverTxResponse } from '@cosmjs/stargate'
import { FlowInput } from '../../../types/trstTypes'

type UseSubmitFlowArgs = {
  flowInput: FlowInput
}

export const useSubmitFlow = ({ flowInput }: UseSubmitFlowArgs) => {
  const { client, address, status } = useAtomValue(walletState)
  const { address: ibcWalletAddress } = useAtomValue(ibcWalletState)

  const setTransactionState = useSetAtom(transactionStatusState)
  const [_, popConfetti] = useAtom(particleState)

  const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`])

  const validateFlowParameters = (input: FlowInput) => {
    // Check if interval is 0 but start time is set
    if ((input.interval === 0 || input.interval === undefined) && input.startTime > 0) {
      throw new Error('Cannot have a start time when interval is not set')
    }

    // Check if start time is in the past
    const now = Date.now()
    if (input.startTime > 0 && input.startTime < now) {
      throw new Error('Start time cannot be in the past')
    }

  }

  return useMutation({
    mutationKey: ['submitFlow'],
    mutationFn: async () => {
      if (status !== WalletStatusType.connected || client == null) {
        throw new Error('Please retry or connect your wallet.')
      }

      // Validate flow parameters
      validateFlowParameters(flowInput)

      if (flowInput.configuration.walletFallback == false && flowInput.feeFunds?.amount == "0") {
        throw new Error('No funds attached and no fallback to owner balance, can not submit flow.')
      }
      const response: DeliverTxResponse = await executeSubmitFlow({
        owner: address,
        flowInput,
        client,
        ibcWalletAddress,
      })
      return response
    },
    onSuccess(data) {
      console.log(data)
      let flowID = data.events
        .find((event) => event.type == 'flow-created')
        .attributes.find((attr) => attr.key == 'flow-id').value

      console.log(flowID)

      // Subscribe to flow alerts if email is provided
      if (flowInput.email) {
        console.log(`Subscribing email ${flowInput.email} to flow ${flowID}`)
        fetch("/.netlify/functions/flow-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: flowInput.email,
            flowID: flowID,
            type: flowInput.alertType || "all" // Use selected alert type or default to all
          }),
        }).then(response => {
          if (response.ok) {
            console.log('Successfully subscribed to flow alerts')
          } else {
            console.error('Failed to subscribe to flow alerts')
          }
        }).catch(err => {
          console.error('Error subscribing to flow alerts:', err)
        })
      }

      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Valid />} color="primary" />}
          title="Your flow is submitted!"
          body={`The on-chain flow was created succesfully! The ID is ${flowID}${flowInput.email ? ' and notifications will be sent to your email' : ''}`}
          buttons={
            <Button
              as="a"
              variant="ghost"
              href={`/flows/${flowID}`}
              target="__blank"
              rel="noopener noreferrer"
              iconRight={<UpRightArrow />}
            >
              Go to your new flow
            </Button>
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      popConfetti(true)

      refetchQueries()
    },
    onError(e) {
      const errorMessage = formatSdkErrorMessage(e)

      toast.custom((t) => (
        <Toast
          icon={<ErrorIcon color="error" />}
          title="Oops error submitting message!"
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
