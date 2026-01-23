import {
  Inline,
  Card,
  Spinner,
  CardContent,
  Button,
  Text,
  Column,
  styled,
  IconWrapper,
  PlusIcon,

} from 'components/ui-blocks'
import React, { HTMLProps, useEffect, useState, useRef, useMemo, useCallback } from 'react'
import {
  useSubmitFlow,
  useRegisterAccount,
  useSendFundsOnHost,
  useSubmitTx,
} from '../hooks'
import { ChainSelector } from './ChainSelector/ChainSelector'

import {
  useGetTrustlessAgentICAByConnectionID, useGetTrustlessAgentICAAddress,
  useGetICA,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
import { JsonFormWrapper } from './Editor/JsonFormWrapper'
import { FlowInput } from '../../../types/trstTypes'
import { ExecutionConditions, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { GearIcon } from '../../../icons'
import { SubmitFlowDialog } from './SubmitFlowDialog'
import { Configuration } from './Conditions/Configuration'
import { StepIcon } from '../../../icons/StepIcon'
import { Conditions } from './Conditions/Conditions'
import { convertDenomToMicroDenom } from '../../../util/conversion'
import { TrustlessAgentCard } from './TrustlessAgentCard'
import { processFlowInput } from '../utils/addressUtils'



type FlowsInputProps = {
  flowInput: FlowInput
  onFlowChange: (flowInput: FlowInput) => void
} & HTMLProps<HTMLInputElement>

export const BuildComponent = ({
  flowInput,
  onFlowChange,
}: FlowsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('into')
  const [denom, setDenom] = useState('uinto')
  const [chainName, setChainName] = useState('')
  const [chainSymbol, setChainSymbol] = useState('INTO')

  const [hasConnectionID, setHasConnectionID] = useState(false)
  const [chainHasIAModule, setChainHasIAModule] = useState(true)
  const [universalId, setUniversalId] = useState('')
  const [_isJsonValid, setIsJsonValid] = useState(true)
  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(flowInput.connectionId, '')

  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    flowInput?.chainId,
    icaAddress,
    hasConnectionID
  )
  const [trustlessAgent, _istrustlessAgentLoading] = useGetTrustlessAgentICAByConnectionID(flowInput.connectionId)
  const [trustlessAgentICA, _istrustlessAgentICALoading] = useGetTrustlessAgentICAAddress(trustlessAgent?.agentAddress || "", flowInput.connectionId)

  const refetchTrustlessAgentICA = useRefetchQueries([
    `hostInterchainAccount/${trustlessAgent?.agentAddress || ""}/${flowInput.connectionId}`,
  ])
  const refetchAuthZForTrustlessAgentICA = useRefetchQueries(
    `userAuthZGrants / ${trustlessAgentICA}`
  )
  const refetchICA = useRefetchQueries([
    `ibcTokenBalance / ${denom} / ${icaAddress}`,
    `userAuthZGrants / ${icaAddress}/${icaAddress}/${flowInput?.msgs?.length}`,
  ])



  const { mutate: handleSubmitFlow, isPending: isExecutingSchedule } =
    useSubmitFlow({ flowInput })
  const { mutate: handleRegisterICA, isPending: isExecutingRegisterICA } =
    useRegisterAccount({
      connectionId: flowInput.connectionId,
      hostConnectionId: flowInput.hostConnectionId,
    })

  const handleTriggerEffect = (shouldTrigger, handler, resetStateSetter) => {
    if (shouldTrigger) {
      handler(undefined, { onSettled: () => resetStateSetter(false) })
    }
  }

  useEffect(() => inputRef.current?.focus(), [])

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingRegisterICA && requestedRegisterICA,
        handleRegisterICA,
        setRequestedRegisterICA
      ),
    [isExecutingRegisterICA, requestedRegisterICA, handleRegisterICA]
  )

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingSchedule && requestedSubmitFlow,
        handleSubmitFlow,
        setRequestedSubmitFlow
      ),
    [isExecutingSchedule, requestedSubmitFlow, handleSubmitFlow]
  )

  const handleSendFundsOnHostClick = () => {
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const { mutate: handleSubmitTx, isPending: isExecutingSubmitTx } =
    useSubmitTx({ flowInput })

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingSubmitTx && requestedSubmitTx,
        handleSubmitTx,
        setRequestedSubmitTx
      ),
    [isExecutingSubmitTx, requestedSubmitTx, handleSubmitTx]
  )

  // ICA funds
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    flowInput.chainId,
    {
      onError(error) {
        console.log(error)
      },
    },
    !hasConnectionID
  )


  const [feeFundsHostChain, setFeeFundsHostChain] = useState('0.00')
  const [requestedSendFunds, setRequestedSendFunds] = useState(false)

  const {
    mutate: handleSendFundsOnHost,
    isPending: isExecutingSendFundsOnHost,
  } = useSendFundsOnHost({
    toAddress: icaAddress,
    coin: {
      denom,
      amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString(),
    },
  })

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingSendFundsOnHost && requestedSendFunds,
        handleSendFundsOnHost,
        setRequestedSendFunds
      ),
    [isExecutingSendFundsOnHost, requestedSendFunds, handleSendFundsOnHost]
  )

  const shouldDisableSendHostChainFundsButton = useMemo(
    () =>
      !icaAddress ||
      (flowInput.msgs && flowInput.msgs.length === 0) ||
      Number(feeFundsHostChain) === 0,
    [icaAddress, flowInput.msgs, feeFundsHostChain]
  )

  // const handleRegisterAccountClick = () => {
  //   return setRequestedRegisterICA(true)
  // }

  const handleSubmitFlowClick = (flowInput: FlowInput) => {
    onFlowChange(flowInput)
    return setRequestedSubmitFlow(true)
  }

  //////////////////////////////////////// Flow message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const handleChangeMsg = (index: number) => (msg: string) => {
    flowInput.label = ""
    const newMsgs = [...flowInput.msgs];
    newMsgs[index] = msg;
    const updatedFlowInput = {
      ...flowInput,
      msgs: newMsgs,
    };
    onFlowChange(updatedFlowInput);
  };

  const handleChainChange = useCallback(async (
    connectionId: string,
    hostConnectionId: string,
    newChainId: string,
    newPrefix: string,
    newDenom: string,
    name: string,
    chainSymbol: string,
    universalId: string
  ) => {
    // Create a new flow input with updated connection details
    const updatedFlowInput = {
      ...flowInput,
      connectionId,
      hostConnectionId,
      msgs: [...flowInput.msgs]
    };

    const isIntoChain = newChainId === process.env.NEXT_PUBLIC_INTO_CHAIN_ID;
    // Process messages with new prefix and denom
    updatedFlowInput.msgs = updatedFlowInput.msgs.map((msg) => {
      try {
        let processedMsg = msg;

        // Handle prefix replacement
        if (processedMsg.includes(prefix + "1...")) {
          processedMsg = processedMsg.replaceAll(
            prefix + "1...",
            newPrefix + "1..."
          );

          const processedInput = processFlowInput(
            { ...updatedFlowInput, msgs: [processedMsg] },
            isIntoChain
          );

          processedMsg = processedInput.msgs[0].replaceAll(denom, newDenom);
        }

        // Handle address placeholder replacement
        const oldAddress = isIntoChain ? "Your Intento address" : "Your address";
        const newAddress = isIntoChain ? "Your Intento address" : "Your address";
        // In case you need to normalize from one to the other
        processedMsg = processedMsg.replaceAll(oldAddress, newAddress);

        return processedMsg;
      } catch (e) {
        console.error("Error processing message:", e);
        return msg; // Fallback to original
      }
    });

    const hasConnectionId = Boolean(connectionId);
    updatedFlowInput.chainId = newChainId;
    // Batch state updates to minimize re-renders
    Promise.resolve().then(() => {
      setDenom(newDenom);
      setChainName(name);
      setChainSymbol(chainSymbol);
      setPrefix(newPrefix);
      setHasConnectionID(hasConnectionId);
      setChainHasIAModule(isIntoChain);
      setUniversalId(universalId);
    });

    // Update the flow with the new values
    onFlowChange(updatedFlowInput);

    // Connect external wallet if needed
    if (hasConnectionId) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (connectExternalWallet) {
          console.log(updatedFlowInput.chainId)
          connectExternalWallet(null);
        }
      } catch (e) {
        console.error('Error connecting external wallet:', e);
      }
    }
  }, [prefix, denom, connectExternalWallet, flowInput, onFlowChange]);

  const prevDenomRef = useRef(denom);
  const prevIcaAddressRef = useRef(icaAddress);
  const prevChainIdRef = useRef(flowInput.chainId);
  const prevTrustlessAgentRef = useRef(trustlessAgent);
  const prevTrustlessAgentICARef = useRef(trustlessAgentICA);

  useEffect(() => {
    if (icaAddress && icaAddress !== "" && denom &&
      (icaAddress !== prevIcaAddressRef.current || denom !== prevDenomRef.current)) {
      refetchICA();
      prevIcaAddressRef.current = icaAddress;
      prevDenomRef.current = denom;
    }
  }, [denom, icaAddress, refetchICA]);

  useEffect(() => {
    if (trustlessAgent && flowInput.chainId &&
      (trustlessAgent !== prevTrustlessAgentRef.current || flowInput.chainId !== prevChainIdRef.current)) {
      refetchTrustlessAgentICA();
      prevTrustlessAgentRef.current = trustlessAgent;
      prevChainIdRef.current = flowInput.chainId;
    }
  }, [flowInput.chainId, trustlessAgent, refetchTrustlessAgentICA]);

  useEffect(() => {
    if (trustlessAgentICA && trustlessAgentICA !== prevTrustlessAgentICARef.current) {
      refetchAuthZForTrustlessAgentICA();
      prevTrustlessAgentICARef.current = trustlessAgentICA;
    }
  }, [trustlessAgentICA, refetchAuthZForTrustlessAgentICA]);

  function setExample(index: number, msgObject: any) {
    try {
      const msg = JSON.stringify(msgObject, null, '\t')
      let newMsg = msg.replaceAll('uinto', denom)
      newMsg = newMsg.replaceAll('into', prefix)
      let processedMsg: string

      if (flowInput.chainId === process.env.NEXT_PUBLIC_INTO_CHAIN_ID) {
        const newInput = processFlowInput({ ...flowInput, msgs: [newMsg] }, true)
        processedMsg = newInput.msgs[0]
      } else {
        const newInput = processFlowInput({ ...flowInput, msgs: [newMsg] }, false)
        processedMsg = newInput.msgs[0]
      }

      // Create a new copy of flowInput and msgs array
      const updatedFlowInput = {
        ...flowInput,
        msgs: [...(flowInput.msgs || [])],
        label: '' // Clear the label when selecting an example
      }
      updatedFlowInput.msgs[index] = processedMsg

      // Remove any undefined values in msgs array
      updatedFlowInput.msgs = updatedFlowInput.msgs.filter((msg) => msg !== undefined)

      onFlowChange(updatedFlowInput)
    } catch (e) {
      alert(e)
    }
  }

  function setAllMessages(
    msgObjects: any[],
    extra?: { conditions?: ExecutionConditions, configuration?: ExecutionConfiguration },
    templateLabel?: string
  ) {
    try {
      const processedMsgs = msgObjects.map((msgObject) => {
        let msg = JSON.stringify(msgObject, null, '\t');
        msg = msg.replaceAll('uinto', denom);
        msg = msg.replaceAll('into', prefix);
        return msg;
      });
      console.log('setAllMessages extra:', extra);
      // Always ensure conditions is an object, even if empty
      const conditions = extra?.conditions || {
        feedbackLoops: [],
        comparisons: [],
        stopOnSuccessOf: [],
        stopOnFailureOf: [],
        skipOnSuccessOf: [],
        skipOnFailureOf: [],
        useAndForComparisons: false
      };

      console.log('setAllMessages conditions:', conditions);

      const configuration: ExecutionConfiguration = extra?.configuration || {
        saveResponses: true,
        updatingDisabled: false,
        stopOnSuccess: false,
        stopOnFailure: false,
        stopOnTimeout: false,
        walletFallback: true,
      };
      console.log('setAllMessages configuration:', configuration);
      let updatedFlowInput = {
        ...flowInput,
        msgs: processedMsgs,
        conditions,
        configuration
      };

      console.log('setAllMessages updatedFlowInput:', updatedFlowInput);
      // Set selected template label if provided
      if (templateLabel !== undefined) {
        updatedFlowInput.label = templateLabel;
      }
      onFlowChange(updatedFlowInput);


    } catch (e) {
      console.error('Error in setAllMessages:', e);
      alert(`Error setting messages: ${e.message}`);
    }
  }

  function setConfig(updatedConfig: ExecutionConfiguration, useAndForComparisons: boolean) {
    let updatedFlowInput = flowInput
    updatedFlowInput.configuration = updatedConfig
    updatedFlowInput.conditions = {
      ...updatedFlowInput.conditions,
      useAndForComparisons
    }
    onFlowChange(updatedFlowInput)
  }


  function setConditions(updatedConfig: ExecutionConditions) {
    let updatedFlowInput = flowInput
    updatedFlowInput.conditions = updatedConfig
    onFlowChange(updatedFlowInput)
  }

  function handleAddMsg() {
    let newMsgs = [...flowInput.msgs]
    let emptyMsg = ''
    newMsgs.push(emptyMsg)
    let updatedFlowInput = flowInput
    updatedFlowInput.msgs = newMsgs
    onFlowChange(updatedFlowInput)
  }
  function handleRemoveMsg(index: number) {
    let updatedFlowInput = flowInput

    const newMsgs = updatedFlowInput.msgs.filter(
      (msg) => msg !== updatedFlowInput.msgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = ''
    }
    updatedFlowInput.msgs = newMsgs
    onFlowChange(updatedFlowInput)
  }

  const [
    { isShowing: isSubmitFlowDialogShowing },
    setSubmitFlowDialogState,
  ] = useState({ isShowing: false })

  const shouldDisableSubmitButton =

    (flowInput.msgs?.[0] &&
      flowInput.msgs[0].length == 0 &&
      JSON.parse(flowInput.msgs[0])['typeUrl'].length < 5)

  const shouldDisableBuildButton =
    shouldDisableSubmitButton


  return (
    <StyledDivForContainer>
      <Inline css={{ margin: '$6', marginTop: '$12', }}>
        <StepIcon step={1} />
        <Text
          align="center"
          variant="body"
          color="tertiary"
          css={{ padding: '0 $15 0 $6' }}
        >
          Choose where to execute
        </Text>{' '}
      </Inline>

      <Card
        css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$1' }}
        variant="secondary"
        disabled
      >
        <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
          <Column>

            <Row>
              <Text align="center" variant="caption">
                Chain
              </Text>{' '}
              <ChainSelector
                initialChainId={flowInput.chainId}
                onChange={(update) => {
                  handleChainChange(
                    update.connectionId,
                    update.hostConnectionId,
                    update.chainId,
                    update.prefix,
                    update.denom,
                    update.name,
                    update.symbol,
                    update.universalId
                  )
                }}
              />{' '}

            </Row>
            {chainName &&
              hasConnectionID &&
              (isIcaLoading ? (
                <Spinner size={18} style={{ margin: 0 }} />
              ) : (
                <>
                  {!icaAddress ? (<>  {trustlessAgent && <TrustlessAgentCard
                    trustlessAgent={trustlessAgent}
                    trustlessAgentICAAddress={trustlessAgentICA}
                    flowInput={flowInput}
                  />}
                    {/* <Text variant="caption">
                      No Self-hosted Interchain Account for selected chain: {chainName}.
                    </Text> */}</>
                  ) : (
                    <IcaCard
                      icaAddress={icaAddress}
                      chainSymbol={chainSymbol}
                      feeFundsHostChain={feeFundsHostChain}
                      icaBalance={icaBalance}
                      isIcaBalanceLoading={isIcaBalanceLoading}
                      shouldDisableSendHostChainFundsButton={
                        shouldDisableSendHostChainFundsButton
                      }
                      hostDenom={denom}
                      chainId={flowInput.chainId}
                      flowInput={flowInput}
                      isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                      setFeeFundsHostChain={(fees) =>
                        setFeeFundsHostChain(fees)
                      }
                      handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                    />
                  )}
                </>
              ))}
          </Column>
        </CardContent>
      </Card>
      <Inline css={{ margin: '$6', marginTop: '$16' }}>
        <StepIcon step={2} />
        <Text
          align="center"
          variant="body"
          color="tertiary"
          css={{ padding: '0 $15 0 $6' }}
        >
          Define what to execute
        </Text>{' '}
      </Inline>
      {flowInput.msgs?.map((msg, index) => (
        <div key={index}>
          <JsonFormWrapper
            index={index}
            chainSymbol={chainSymbol}
            universalId={universalId}
            msg={msg}
            setExample={setExample}
            setAllMessages={setAllMessages}
            handleRemoveMsg={handleRemoveMsg}
            handleChangeMsg={handleChangeMsg}
            setIsJsonValid={setIsJsonValid}
            selectedTemplateLabel={flowInput?.label}
          />
        </div>
      ))}{' '}
      <Card variant="secondary" disabled css={{ margin: '$6' }}>
        {
          <Column>
            <Button
              css={{ margin: '$2' }}
              icon={<IconWrapper icon={<PlusIcon />} />}
              variant="ghost"
              iconColor="tertiary"
              onClick={handleAddMsg}
            />
          </Column>
        }
      </Card>
      <SubmitFlowDialog
        icaAddress={icaAddress || trustlessAgentICA}
        flowInput={flowInput}
        isDialogShowing={isSubmitFlowDialogShowing}
        chainName={chainName}
        onRequestClose={() =>
          setSubmitFlowDialogState({
            isShowing: false,
          })
        }
        isLoading={isExecutingSchedule}
        handleSubmitFlow={(flowInput) =>
          handleSubmitFlowClick(flowInput)
        }
        trustlessAgent={trustlessAgent}
        chainId={flowInput.chainId}
      />
      <Column>
        <Inline css={{ margin: '$6', marginTop: '$16' }}>
          <StepIcon step={3} />
          <Text
            align="center"
            variant="body"
            color="tertiary"
            css={{ padding: '0 $15 0 $6' }}
          >
            Specify conditions {(flowInput.conditions?.comparisons?.length > 0 || flowInput.conditions?.feedbackLoops?.length > 0) ? '- injected from template' : '(optional)'}
          </Text>
        </Inline>
        <Conditions conditions={flowInput.conditions}
          disabled={!flowInput.conditions}
          onChange={setConditions}
        />
      </Column>
      <Column>
        <Inline css={{ margin: '$6', marginTop: '$16' }}>
          <StepIcon step={4} />
          <Text
            align="center"
            variant="body"
            color="tertiary"
            css={{ padding: '0 $15 0 $6' }}
          >
            Configure execution
          </Text>{' '}
        </Inline>
        <Configuration
          config={flowInput.configuration}
          useAndForComparisons={flowInput.conditions?.useAndForComparisons}
          disabled={!icaAddress && !chainHasIAModule}
          onChange={setConfig}
        />
      </Column>
      <Inline
        css={{
          margin: '$4 $6 $8',
          padding: '$5 $5 $8',
          justifyContent: 'end',
        }}
      >
        {/* <Button
          css={{ margin: '$4', columnGap: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableSubmitButton && chainHasIAModule}//ia module need  endpoint specified for this
          onClick={() => handleSubmitTxClick()}
          iconLeft={<TransferIcon />}
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Send messages now'}
        </Button> */}
        <Button
          css={{ margin: '$4', columnGap: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableBuildButton}
          onClick={() =>
            setSubmitFlowDialogState({
              isShowing: true,
            })
          }
          iconLeft={<GearIcon />}
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Schedule'}
        </Button>
      </Inline>
    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  padding: '$4',
})

export function Row({ children }) {
  const baseCss = { padding: '$2 $4' }
  return (
    <Inline
      css={{
        ...baseCss,
        display: 'flex',
        justifyContent: 'start',
        marginBottom: '$4',
        columnGap: '$space$1',
      }}
    >
      {children}
    </Inline>
  )
}


export const StyledInput = styled('input', {
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})
