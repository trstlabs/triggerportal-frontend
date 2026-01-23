import {
  Inline,
  Card,
  Spinner,
  CardContent,
  media,
  IconWrapper,
  PlusIcon,
  Union,
  CopyIcon,
  Button,
  styled,
  Text,
  Column,
  convertDenomToMicroDenom,
  ImageForTokenLogo,
} from 'components/ui-blocks'

import React, { HTMLProps, useEffect, useState, useRef } from 'react'

import { useTokenSend } from '../hooks'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { ChannelSelector } from './ChannelSelector'
import { useAtomValue } from 'jotai'
import { SubmitFlowDialog } from '../../build/components/SubmitFlowDialog'
import { ChannelInfo } from './ChannelSelectList'
import { useSubmitFlow } from '../../build/hooks'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'
import { FlowInput } from '../../../types/trstTypes'
import { Configuration } from '../../build/components/Conditions/Configuration'
import { ExecutionConditions, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1/flow'


export class RecipientInfo {
  recipient: string
  amount: string | number
  channelID: string
  memo: string
}

type RecipientsInputProps = {
  recipients: RecipientInfo[]
  tokenSymbol: string
  onRecipientsChange: (recipients: RecipientInfo[]) => void
  onRemoveRecipient: (recipient: RecipientInfo) => void
} & HTMLProps<HTMLInputElement>

export const RecipientList = ({
  recipients,
  tokenSymbol,
  onRecipientsChange,
  onRemoveRecipient,
}: RecipientsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('into')
  const [requestedSend, setRequestedSend] = useState(false)
  const [requestedSchedule, setRequestedSchedule] = useState(false)
  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  // set default fields
  let data = new FlowInput()
  data.duration = 14 * 86400000
  data.interval = 86400000
  data.msgs = ['']
  const initConfig: ExecutionConfiguration = {
    saveResponses: false,
    updatingDisabled: false,
    stopOnFailure: false,
    stopOnSuccess: false,
    stopOnTimeout: false,
    walletFallback: true,
  }
  data.configuration = initConfig
  const initConditions: ExecutionConditions = {
    stopOnSuccessOf: [],
    stopOnFailureOf: [],
    skipOnFailureOf: [],
    skipOnSuccessOf: [],
    feedbackLoops: [],
    comparisons: [],
    useAndForComparisons: false,
  }
  data.conditions = initConditions
  const [flowInput, setflowInput] = useState(data)
  const { address, status } = useAtomValue(walletState)

  const { mutate: handleSend, isLoading: isExecutingTransaction } =
    useTokenSend({ ibcAsset, recipientInfos: recipients })
  const { mutate: handleSchedule, isLoading: isExecutingSchedule } =
    useSubmitFlow({ flowInput })

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  /* proceed with send*/
  useEffect(() => {
    const shouldTriggerDirectTx = !isExecutingTransaction && requestedSend
    if (shouldTriggerDirectTx) {
      handleSend(undefined, { onSettled: () => setRequestedSend(false) })
    }
  }, [isExecutingTransaction, requestedSend, handleSend])

  /* proceed with schedule*/
  useEffect(() => {
    const shouldTriggerScheduledTx = !isExecutingSchedule && requestedSchedule
    if (shouldTriggerScheduledTx) {
      handleSchedule(undefined, {
        onSettled: () => setRequestedSchedule(false),
      })
    }
  }, [isExecutingSchedule, requestedSchedule, handleSchedule])

  const handleSendClick = () => {
    if (status === WalletStatusType.connected) {
      return setRequestedSend(true)
    }
  }

  const handleScheduleClick = (flowInput: FlowInput) => {
    if (status === WalletStatusType.connected) {
      let msgs = []
      // Calculate timeout timestamp as 1 day after (startTime + duration)
      const startTime = flowInput.startTime || 0;
      const duration = flowInput.duration || 0;
      const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      const timeoutTimestamp = Math.floor((Date.now() + startTime + duration + oneDayInMs) / 1000) * 1000000000;

      for (let recipient of recipients) {
        let sendMsg
        if (recipient.channelID) {
          sendMsg = transferObject
          sendMsg.value.token = {
            amount: convertDenomToMicroDenom(recipient.amount, 6).toString(),
            denom: ibcAsset.denom_local,
          }
          sendMsg.value.sender = address
          sendMsg.value.receiver = recipient.recipient
          sendMsg.value.sourceChannel = recipient.channelID
          sendMsg.value.timeoutTimestamp = timeoutTimestamp
        } else {
          sendMsg = sendObject
          sendMsg.value.fromAddress = address
          sendMsg.value.toAddress = recipient.recipient
          sendMsg.value.amount = [
            {
              amount: convertDenomToMicroDenom(recipient.amount, 6).toString(),
              denom: ibcAsset.denom_local,
            },
          ]
        }

        msgs.push(JSON.stringify(sendMsg, null, 2))
      }
      flowInput.msgs = msgs
      setflowInput(flowInput)

      return setRequestedSchedule(true)
    }
  }


  const handleConfigClick = (config: ExecutionConfiguration, useAndForComparisons: boolean) => {

    let newData = data
    newData.configuration = config
    newData.conditions = {
      ...newData.conditions,
      useAndForComparisons
    }
    setflowInput(newData)
    console.log(newData)
  }

  const handleChange =
    (index: number, key: keyof RecipientInfo) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRecipients = [...recipients]
        newRecipients[index] = {
          ...newRecipients[index],
          [key]: event.target.value,
        }
        console.log(newRecipients)

        onRecipientsChange(newRecipients)
      }

  const handleChannelChange = (index: number, channelInfo: ChannelInfo) => {
    const newRecipients = [...recipients]
    newRecipients[index] = {
      ...newRecipients[index],
      channelID: channelInfo.channelID,
    }
    console.log(newRecipients)

    setPrefix(channelInfo.prefix)
    //onTokenSymbolChange(channelInfo.symbol)

    onRecipientsChange(newRecipients)
  }

  //  a function to handle clicks on the "Add recipient" button
  function handleAddRecipient() {
    // Create a new RecipientInfo object
    const newRecipients = [...recipients]
    let newRecipient = new RecipientInfo()
    console.log(newRecipients.length)
    if (newRecipients[newRecipients.length - 1].recipient != '') {
      // Add the new recipient to the recipients array
      console.log('adding to', newRecipients[newRecipients.length - 1])
      console.log(newRecipients)
      newRecipients.push(newRecipient)
      onRecipientsChange(newRecipients)
    }
  }

  //  a function to handle clicks on the "Add recipient" button
  function handleRemoveRecipient(index) {
    console.log('removing', index)
    if (index == 0) {
      const newRecipients = [...recipients]
      let newRecipient = new RecipientInfo()
      newRecipients[index] = newRecipient
      console.log(newRecipients)
      onRecipientsChange(newRecipients)

      return
    }
    if (index == 10) {
      alert('Maximum recipients reached, provide feedback to the developers')
      return
    }
    onRemoveRecipient(recipients[index])
  }

  function handlePaste(index: number, key: keyof RecipientInfo) {
    return navigator.clipboard
      .readText()
      .then((clipText) => {
        // Get the text from the clipboard
        const newRecipients = [...recipients]
        newRecipients[index] = {
          ...newRecipients[index],
          [key]: clipText,
        }
        onRecipientsChange(newRecipients)
      })
      .catch((error) => {
        // Handle any errors that may occur when reading from the clipboard
        console.error(error)
      })
  }

  const [
    { isShowing: isScheduleDialogShowing /* , flowType  */ },
    setScheduleDialogState,
  ] = useState({
    isShowing:
      false /* , flowType: 'recurrence' as 'recurrence' | "occurrence" } */,
  })

  const shouldDisableSubmissionButton =
    isExecutingTransaction ||
    status !== WalletStatusType.connected ||
    !recipients[0].recipient ||
    (recipients[0].recipient && recipients[0].recipient.length < 40) ||
    Number(recipients[0].amount) == 0

  return (
    <div>
      <Card variant="secondary" disabled css={{ margin: '$2' }}>
        {recipients.map((recipient, index) => (
          <div key={index}>
            <Card variant="secondary" disabled css={{ marginBottom: '$2' }}>
              <CardContent size="medium" css={{ paddingTop: '$2' }}>
                <Column>
                  <Row>
                    <Text align="center" variant="caption">
                      Recipient
                    </Text>
                    <Text>
                      {' '}
                      <StyledInput
                        placeholder={prefix + '1...'}
                        value={recipient.recipient}
                        onChange={handleChange(index, 'recipient')}
                      />
                    </Text>
                    {/*  <Text align="right" variant="caption" color="secondary" >
                    Tip: You can paste an address using paste button
                  </Text>  */}
                    <Button
                      variant="ghost"
                      icon={<CopyIcon />}
                      onClick={() => handlePaste(index, 'recipient')}
                    />{' '}
                    {index != 0 && recipient.recipient != '' && (
                      <Button
                        icon={<IconWrapper icon={<Union />} />}
                        variant="ghost"
                        iconColor="tertiary"
                        onClick={() => handleRemoveRecipient(index)}
                      />
                    )}
                  </Row>
                  <Row>
                    <Column>
                      {' '}
                      <Text align="center" variant="caption">
                        Amount
                      </Text>
                    </Column>
                    <Column>
                      <Text>
                        <StyledTokenInput
                          placeholder="0"
                          type="number"
                          value={recipient.amount}
                          onChange={handleChange(index, 'amount')}
                        />
                      </Text>
                    </Column>{' '}
                    <Column>
                      {ibcAsset && (
                        <ImageForTokenLogo logoURI={ibcAsset.logo_uri} />
                      )}
                    </Column>
                  </Row>
                  <Row>
                    <Text align="center" variant="caption">
                      Memo (optional){' '}
                    </Text>
                    <Text>
                      {' '}
                      <StyledInput
                        placeholder="for your hard work"
                        value={recipient.memo}
                        onChange={handleChange(index, 'memo')}
                      />
                    </Text>
                  </Row>
                </Column>

                <Column>
                  <Inline
                    css={{
                      alignItems: 'start',
                      margin: '$3',
                      columnGap: '$space$1',
                    }}
                  >
                    {' '}
                    <Column>
                      <Text variant="caption">To chain (optional)</Text>
                    </Column>
                    <Column>
                      <ChannelSelector
                        channel={recipient.channelID}
                        onChange={(updateChannel) => {
                          handleChannelChange(index, updateChannel)
                        }}
                        size={'large'}
                      />
                    </Column>
                  </Inline>
                </Column>
              </CardContent>
            </Card>

            <Column>
              <Button
                css={{ display: 'end', margin: '$2' }}
                icon={<IconWrapper icon={<PlusIcon />} />}
                variant="ghost"
                iconColor="tertiary"
                onClick={handleAddRecipient}
              />
            </Column>
          </div>
        ))}
      </Card>
      <Configuration config={flowInput.configuration} useAndForComparisons={flowInput.conditions?.useAndForComparisons} onChange={handleConfigClick} />
      <Inline
        css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'end' }}
      >
        <Button
          css={{ marginRight: '$4' }}
          variant="secondary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={!isExecutingTransaction ? handleSendClick : undefined}
        >
          {isExecutingTransaction ? <Spinner instant /> : 'Send'}
        </Button>
        <Button
          variant="secondary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={() =>
            setScheduleDialogState({
              isShowing: true,
            })
          }
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Schedule Recurrence'}
        </Button>
      </Inline>
      <SubmitFlowDialog
        isLoading={isExecutingSchedule}
        flowInput={{ ...flowInput, label: "Send Flow" }}
        isDialogShowing={isScheduleDialogShowing}
        chainId={process.env.NEXT_PUBLIC_INTO_CHAIN_ID}
        onRequestClose={() =>
          setScheduleDialogState({
            isShowing: false,
          })
        }
        handleSubmitFlow={(flowInput) => handleScheduleClick(flowInput)}
      />
    </div>
  )
}

const StyledInput = styled('input', {
  minWidth: '330px',
  fontSize: `11px`,
  padding: '$2',
  margin: '$2',
  [media.sm]: {
    minWidth: '130px !important',
  },
})

const StyledTokenInput = styled('input', {
  minWidth: '10px',
  maxWidth: '50px',
  fontSize: `11px`,
  padding: '$2',
  margin: '$2',
})

function Row({ children }) {
  const baseCss = { padding: '$2 $4' }

  return (
    <Inline
      css={{
        ...baseCss,
        display: 'flex',
        justifyContent: 'start',
        marginBottom: '$3',
        columnGap: '$space$1',
        // border: '1px solid $borderColors$default',
        // borderRadius: '$2'
      }}
    >
      {children}
    </Inline>
  )
}

const sendObject = {
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: {
    amount: [
      {
        amount: '70',
        denom: 'uinto',
      },
    ],
    fromAddress: 'into1....',
    toAddress: 'into1...',
  },
}

const transferObject = {
  typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
  value: {
    token: {},
    sender: 'into1....',
    receiver: 'into1...',
    sourcePort: 'transfer',
    sourceChannel: '',
    timeoutHeight: {
      revisionNumber: '0',
      revisionHeight: '0',
    },
    timeoutTimestamp: '0',
  },
}
