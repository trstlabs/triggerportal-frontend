// import { TrustlessChainClient, MsgTransfer, Tx,  } from 'intentojs'
import { Coin } from '@cosmjs/stargate'
import { Height } from 'intentojs/dist/codegen/ibc/core/client/v1/client'
import { ibc } from 'intentojs'
import { IBCAssetInfo } from '../../../../hooks/useChainList'
import { SigningStargateClient, DeliverTxResponse } from '@cosmjs/stargate'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { ibcWalletState, walletState } from 'state/atoms/walletAtoms'
import { convertDenomToMicroDenom } from 'util/conversion'

import { TransactionKind } from './types'

import { UseMutationOptions } from '@tanstack/react-query'

type UseTransferAssetMutationArgs = {
  transactionKind: TransactionKind
  tokenAmount: number
  ibcAssetInfo: IBCAssetInfo
} & Omit<UseMutationOptions<DeliverTxResponse, Error, void, unknown>, 'mutationFn'>

// const sendIbcTokens = (
//   senderAddress: string,
//   recipientAddress: string,
//   transferAmount: Coin,
//   sourcePort: string,
//   sourceChannel: string,
//   timeoutHeight: Height | undefined,
//   /** timeout in seconds */
//   timeoutTimestamp: number | undefined,
//   memo = '',
//   client: TrustlessChainClient
// ): Promise<DeliverTxResponse> => {
//   const timeoutTimestampNanoseconds = timeoutTimestamp
//     ? BigInt(timeoutTimestamp).multiply(1_000_000_000)
//     : undefined
//   const transferMsg = MsgTransfer.fromPartial({

//       sourcePort: sourcePort,
//       sourceChannel: sourceChannel,
//       sender: senderAddress,
//       receiver: recipientAddress,
//       token: transferAmount,
//       timeoutHeight: timeoutHeight,
//       timeoutTimestamp: timeoutTimestampNanoseconds,

//   })
//   return client.signAndBroadcast([transferMsg])
// }

const sendIbcTokens = (
  senderAddress: string,
  recipientAddress: string,
  transferAmount: Coin,
  sourcePort: string,
  sourceChannel: string,
  timeoutHeight: Height | undefined,
  /** timeout in seconds */
  timeoutTimestamp: number | undefined,
  // memo = '',
  client: SigningStargateClient
): Promise<DeliverTxResponse> => {
  // const timeoutTimestampNanoseconds = timeoutTimestamp
  //   ? BigInt(timeoutTimestamp).multiply(1_000_000_000)
  //   : undefined

  const transferMsg =
    ibc.applications.transfer.v1.MessageComposer.withTypeUrl.transfer({
      sourcePort,
      sourceChannel,
      sender: senderAddress,
      receiver: recipientAddress,
      token: transferAmount,
      timeoutHeight: timeoutHeight,
      timeoutTimestamp: BigInt(timeoutTimestamp),
    })
  return client.signAndBroadcast(senderAddress, [transferMsg], 'auto')
}

export const useTransferAssetMutation = ({
  transactionKind,
  tokenAmount,
  ibcAssetInfo,
  ...mutationArgs
}: UseTransferAssetMutationArgs) => {
  const { address, client } = useAtomValue(walletState)
  const { address: ibcAddress, client: ibcClient } =
    useAtomValue(ibcWalletState)

  return useMutation({
    mutationFn: async () => {
      const timeout = Math.floor(new Date().getTime() / 1000) + 600

      if (transactionKind == 'deposit') {
        return await ibcClient.sendIbcTokens(
          ibcAddress,
          address,
          {
            amount: convertDenomToMicroDenom(
              tokenAmount,
              ibcAssetInfo.decimals
            ).toString(),
            denom: ibcAssetInfo.denom,
          },
          'transfer',
          ibcAssetInfo.channel,
          undefined,
          timeout,
          'auto'
        )
      }

      if (transactionKind == 'withdraw') {
        return await sendIbcTokens(
          address,
          ibcAddress,
          {
            amount: convertDenomToMicroDenom(
              tokenAmount,
              ibcAssetInfo.decimals
            ).toString(),
            denom: ibcAssetInfo.denom_local,
          },
          'transfer',
          ibcAssetInfo.channel_to_intento,
          undefined,
          timeout,
          //'',
          client
        )
      }
    },
    ...mutationArgs
  })
}
