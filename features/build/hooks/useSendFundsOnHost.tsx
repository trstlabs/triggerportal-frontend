import {
    formatSdkErrorMessage,
} from 'components/ui-blocks'
import { toast } from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { executeSendFunds } from '../../../services/build'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { Coin } from '@cosmjs/stargate'

import { validateTransactionSuccess } from '../../../util/validateTx'


type UseSendFundsParams = {
    toAddress: string
    coin?: Coin
}


export const useSendFundsOnHost = ({
    toAddress, coin
}: UseSendFundsParams
) => {
    const { address, client, status } =
        useAtomValue(ibcWalletState)

    const setTransactionState = useSetAtom(transactionStatusState)

    const refetchQueries = useRefetchQueries([`ibcTokenBalance/${coin.denom}/${address}`])

    return useMutation({
        mutationKey: ['SendFunds'],
        mutationFn: async () => {
            if (status !== WalletStatusType.connected || client == null) {
                throw new Error('Please retry or connect your wallet.')
            }
            if (coin.amount == "0") {
                coin = undefined
            }

            return validateTransactionSuccess(await executeSendFunds({
                client,
                toAddress,
                fromAddress: address,
                coin,

            }))

        },
        onSuccess(data) {
            console.log(data)
            //popConfetti(true)
            //
            toast.success("Succesfully sent")
            refetchQueries()
        },
        onError(e) {
            const errorMessage = formatSdkErrorMessage(e)

            toast.error("Oops, error sending funds to Interchain Account! " + errorMessage)
        },
        onSettled() {
            setTransactionState(TransactionStatus.IDLE)
        },
    })
}
