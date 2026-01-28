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
import { executeUpdateFlow } from '../../../services/build'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType, ibcWalletState } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'

import { MsgUpdateFlowParams } from '../../../types/trstTypes'

const validateFlowParameters = (params: MsgUpdateFlowParams) => {
    // Only validate if the parameter is being updated

    // Check if interval is being set to 0 while startAt is set
    if (params.interval !== undefined) {
        if (params.interval < 0) {
            throw new Error('Interval cannot be negative')
        }

        // If interval is being set to 0, ensure startAt is not set
        if (params.interval === 0 && params.startAt !== undefined && params.startAt > 0) {
            throw new Error('Cannot have a start time when interval is set to 0')
        }
    }

    // Validate startAt if it's being updated
    if (params.startAt !== undefined) {
        const now = Math.floor(Date.now() / 1000) // Current time in seconds

        // Check if start time is in the past
        if (params.startAt > 0 && params.startAt < now) {
            throw new Error('Start time cannot be in the past')
        }

        // If startAt is being set, ensure interval is also set and not 0
        if (params.startAt > 0 && (params.interval === 0 || params.interval === undefined)) {
            throw new Error('Cannot set a start time without a valid interval')
        }
    }
}


type UseUpdateFlowArgs = {
    flowParams: MsgUpdateFlowParams
}

export const useUpdateFlow = ({
    flowParams,
}: UseUpdateFlowArgs) => {
    const { client, status, address } = useAtomValue(walletState)
    const ibcWalletStateValue = useAtomValue(ibcWalletState)
    const ibcWalletAddress = ibcWalletStateValue?.address
    const setTransactionState = useSetAtom(transactionStatusState)
    const [_, popConfetti] = useAtom(particleState)

    const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`, `flowId/${flowParams.id}`])
    return useMutation({
        mutationKey: ['updateFlow'],
        mutationFn: async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
            if (address !== flowParams.owner) {
                throw new Error('This feature will only work for the owner: ' + flowParams.owner)
            }

            // Validate flow parameters
            validateFlowParameters(flowParams)

            return await executeUpdateFlow({
                flowParams,
                client,
                ibcWalletAddress
            })

        },
        onSuccess(data) {
            console.log(data)

            toast.custom((t) => (
                <Toast
                    icon={<IconWrapper icon={<Valid />} color="primary" />}
                    title="Your flow is updated!"
                    body={`An on-chain flow was updated succesfully`}

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
                    title="Oops error updating message!"
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
