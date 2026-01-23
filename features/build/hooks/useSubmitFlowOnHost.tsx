import { useMutation } from '@tanstack/react-query'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'react-hot-toast'
import { Button, IconWrapper, Toast, UpRightArrow, Valid } from 'components/ui-blocks'
import { MsgTransferEncodeObject } from '@cosmjs/stargate'
import { EncodeObject } from '@cosmjs/proto-signing'
import { GrantResponse } from '../../../services/build'

import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { ibcWalletState } from 'state/atoms/walletAtoms'
import { transactionStatusState, TransactionStatus } from 'state/atoms/transactionAtoms'
import { particleState } from 'state/atoms/particlesAtoms'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { formatSdkErrorMessage } from 'util/formatSdkErrorMessage'
import { FlowInput } from '../../../types/trstTypes'

import { validateTransactionSuccess } from '../../../util/validateTx'
import { IBCAssetInfo } from '../../../hooks/useChainList'
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz'


// Helper to convert string to BigInt safely
const toBigInt = (value: string | number | bigint): bigint => {
  try {
    return BigInt(value)
  } catch {
    return BigInt('0')
  }
}

type UseSubmitFlowOnHostArgs = {
  flowInput: FlowInput
  ibcAssetInfo: IBCAssetInfo
  //can add other host denoms here
  requiredGrants?: GrantResponse[]
  grantee?: string // Add grantee to the args type
  fee?: {
    amount: string
    denom: string
  } | null
}

export const useSubmitFlowOnHost = ({
  flowInput,
  ibcAssetInfo,
  requiredGrants = [],
  grantee: propGrantee,
  fee: propFee,
}: UseSubmitFlowOnHostArgs) => {
  const { address = '', client, status } = useAtomValue(ibcWalletState) || {}
  const intoWallet = useAtomValue(walletState)

  const setTransactionState = useSetAtom(transactionStatusState)
  const [_, popConfetti] = useAtom(particleState)
  const refetchQueries = useRefetchQueries([`ibcTokenBalance/${ibcAssetInfo?.chain_id}/${address}`])

  // Helper function to process values and replace placeholders
  const processValue = (value: any): any => {
    if (value === 'Your Intento address') {
      if (!intoWallet?.address) {
        throw new Error('Your Intento address placeholder found but no owner address provided');
      }
      return intoWallet.address;
    }

    if (value === 'Your Address') {
      if (!address) {
        throw new Error('Your Address placeholder found but no IBC wallet connected');
      }
      return address;
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = processValue(val);
      }
      return result;
    }

    return value;
  };

  return useMutation({
    mutationKey: ['submitFlowOnHost'],
    mutationFn: async () => {
      if (status !== WalletStatusType.connected) {
        throw new Error('Please connect your IBC wallet.')
      }

      if (!intoWallet?.address) {
        throw new Error('Please connect your INTO wallet.')
      }

      if (!client) {
        throw new Error('Wallet client is not available')
      }
      console.log(requiredGrants)

      // Initialize an array to hold all messages
      const allMessages: EncodeObject[] = [];

      // Add grant messages if needed
      if (requiredGrants?.length > 0) {
        // Calculate expiration based on flow's start time and duration
        const now = Math.floor(Date.now() / 1000);
        const flowStartTime = flowInput.startTime ? Math.floor(flowInput.startTime / 1000) : now;
        const flowDuration = flowInput.duration ? Math.ceil(flowInput.duration / 1000) : 0;
        // Set expiration to flow end time + 1 days buffer (in seconds)
        const expirationTime = flowStartTime + flowDuration + (24 * 60 * 60);

        // Determine grantee address - use propGrantee if provided, otherwise fall back to flowInput values
        const granteeAddress = propGrantee ||
          flowInput.icaAddressForAuthZ ||
          flowInput.trustlessAgent?.agentAddress;

        if (!granteeAddress) {
          const errorMsg = 'No grantee address available for authz grants. Please check your connection and try again.';
          console.warn(errorMsg);
          throw new Error(errorMsg);
        }

        for (const grant of requiredGrants) {
          // Skip if grant doesn't have required properties
          if (!grant.msgTypeUrl) continue;

          const grantMsg: EncodeObject = {
            typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
            value: {
              granter: address,
              grantee: granteeAddress,
              grant: {
                authorization: {
                  typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization",
                  value: GenericAuthorization.encode(
                    GenericAuthorization.fromPartial({
                      msg: grant.msgTypeUrl,
                    }),
                  ).finish(),
                },
                expiration: {
                  seconds: BigInt(expirationTime),
                  nanos: 0,
                },
              },
            },
          };
          allMessages.push(grantMsg);

          console.log('Adding authz grant:', {
            typeUrl: grant.msgTypeUrl,
            grantee: granteeAddress,
            expirationTime: new Date(expirationTime * 1000).toISOString()
          });
        }
      }
      // Transform messages to the required format
      const transformMessages = (messages: string[]) => {
        return messages.map(msgStr => {
          try {
            const msg = typeof msgStr === 'string' ? JSON.parse(msgStr) : msgStr;

            // Handle nested messages in MsgExec
            if (msg.typeUrl === '/cosmos.authz.v1beta1.MsgExec' && msg.value?.msgs) {
              return {
                '@type': msg.typeUrl,
                ...msg.value,
                msgs: transformMessages(msg.value.msgs),
              };
            }

            // Process the message to replace any placeholders
            const processedMsg = processValue(msg);

            // If the message is already in the correct format, return it as is
            if (processedMsg['@type'] || processedMsg.typeUrl) {
              // Ensure typeUrl is replaced with @type if needed
              if (processedMsg.typeUrl && !processedMsg['@type']) {
                const { typeUrl, value, ...rest } = processedMsg;
                return {
                  '@type': typeUrl,
                  ...value,
                  ...rest
                };
              }
              return processedMsg;
            }

            // Otherwise, transform it from the old format
            const { typeUrl, value } = processedMsg;
            return {
              '@type': typeUrl,
              ...value
            };
          } catch (e) {
            console.error('Error parsing message:', e);
            return msgStr; // Return as is if parsing fails
          }
        });
      };

      const memo = JSON.stringify({
        flow: {
          owner: intoWallet.address,
          msgs: transformMessages(flowInput.msgs),
          duration: flowInput.duration ? `${Math.ceil(flowInput.duration / 1000)}s` : '0',
          start_at: flowInput.startTime && flowInput.startTime > 0
            ? Math.floor((Date.now() + flowInput.startTime) / 1000)
            : "0",
          interval: flowInput.interval ? `${Math.ceil(flowInput.interval / 1000)}s` : '0',
          trustless_agent: flowInput.trustlessAgent?.agentAddress || "",
          cid: flowInput.connectionId || "",
          stop_on_fail: flowInput.configuration.stopOnFailure.toString(),
          stop_on_timeout: flowInput.configuration.stopOnTimeout.toString(),
          stop_on_success: flowInput.configuration.stopOnSuccess.toString(),
          fallback: flowInput.configuration.walletFallback.toString(),
          update_disabled: flowInput.configuration.updatingDisabled.toString(),
          save_responses: flowInput.configuration.saveResponses.toString(),
          conditions: flowInput.conditions,
          fee_limit: flowInput.trustlessAgent?.feeLimit
            ?.map(f => `${f.amount}${f.denom}`)
            .join(','),
          label: flowInput.label,
        },
      })

      // Use provided fee or fallback to the one from flowInput
      const feeAmount = propFee?.amount || flowInput.trustlessAgent?.feeLimit?.[0]?.amount?.toString() || '0'
      const feeDenom = propFee?.denom || ibcAssetInfo.denom

      // Create MsgTransfer to send tokens to the host chain
      const msgTransfer: MsgTransferEncodeObject = {
        typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
        value: {
          sourcePort: 'transfer',
          sourceChannel: ibcAssetInfo.channel_to_intento,
          sender: address,
          receiver: "Intento Flows",
          token: {
            denom: feeDenom,
            amount: feeAmount,
          },
          timeoutHeight: {
            revisionNumber: toBigInt(0), // 0 for current version
            revisionHeight: toBigInt(0), // 0 for no timeout
          },
          // 10 minutes from now in nanoseconds
          timeoutTimestamp: toBigInt(Math.floor(Date.now() / 1000) + 600) * toBigInt(1000000000),
          memo: memo,
        },
      };
      console.log(memo)
      // Add the transfer message
      allMessages.push(msgTransfer);

      // Create a registry and add your custom type
      // const registry = new Registry();
      // registry.register("/ibc.applications.transfer.v1.MsgTransfer", MsgTransfer);
      // registry.register("/cosmos.authz.v1beta1.MsgGrant", MsgGrant);

      const result = await validateTransactionSuccess(
        await client.signAndBroadcast(address, allMessages, {
          amount: [],
          gas: '300000',
        })
      )
      // // Execute all messages in a single transaction
      // const result = await executeSubmitTx({ client, allMessages })
      return result
    },
    onSuccess(data) {
      console.log(data)

      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Valid />} color="primary" />}
          title="Flow submitted on host chain!"
          body={`Successfully transferred tokens to host chain with transaction hash: ${data.transactionHash}${requiredGrants.length > 0 ? ' and created required authz grants' : ''}`}
          buttons={
            <Button
              as="a"
              variant="ghost"
              href={`#`}
              target="__blank"
              iconRight={<UpRightArrow />}
            >
              View on explorer
            </Button>
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))

      popConfetti(true)
      setTransactionState(TransactionStatus.IDLE)
      refetchQueries()
    },
    onError(e) {
      const errorMessage = formatSdkErrorMessage(e)
      toast.error(errorMessage)
      setTransactionState(TransactionStatus.IDLE)
    },
    onSettled() {
      setTransactionState(TransactionStatus.IDLE)
    },
  })
}
