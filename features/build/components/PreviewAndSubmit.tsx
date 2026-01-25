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
  Toast,
  InfoIcon,
  useControlTheme,
  useMedia,
} from 'components/ui-blocks'
import { toast } from 'react-hot-toast'
import React, { useEffect, useState, useRef, useCallback } from 'react'

import { useSubmitFlow, useRegisterAccount, useSendFundsOnHost, useSubmitTx } from '../hooks'
import { useGrantValidation } from '../hooks/useGrantValidation'
import { useSubmitFlowOnHost } from '../hooks/useSubmitFlowOnHost'
import { ChainSelector } from './ChainSelector/ChainSelector'

import {
  useGetTrustlessAgentICAByTrustlessAgentAddress, useGetTrustlessAgentICAAddress,
  useGetICA,
  useAuthZMsgGrantInfoForUser,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { useIBCAssetInfoByChainID } from 'hooks/useIBCAssetInfo'
import { useChainInfoByChainID } from 'hooks/useChainList'
import { FlowInput } from '../../../types/trstTypes'
import { ExecutionConditions, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { GearIcon } from '../../../icons'
import { Configuration } from './Conditions/Configuration'
import { StepIcon } from '../../../icons/StepIcon'
import { Conditions } from './Conditions/Conditions'
import { convertDenomToMicroDenom, formatDenom } from '../../../util/conversion'

import { SchedulingSection } from './SchedulingSection'
import TinyJsonViewer from './Editor/TinyJsonViewer'

import { FlowSummary } from './FlowSummary'

//////////////////////////////////////// Flow message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


type FlowsInputProps = {
  flowInput: FlowInput
  onFlowChange: (flowInput: FlowInput) => void
  initialChainId?: string
  isMobile?: boolean
  bgColor?: string
}

export const PreviewAndSubmit = ({
  flowInput,
  onFlowChange,
  initialChainId,
  isMobile: propIsMobile,
  bgColor,
}: FlowsInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const [useMsgExec, _setUseMsgExec] = useState(false)
  const [feeSymbol, setFeeSymbol] = useState('INTO')

  // Track step numbers based on conditions
  const hasConditions = flowInput.conditions &&
    (flowInput.conditions.comparisons?.length > 0 ||
      flowInput.conditions.feedbackLoops?.length > 0 ||
      flowInput.conditions.stopOnSuccessOf?.length > 0 ||
      flowInput.conditions.stopOnFailureOf?.length > 0 ||
      flowInput.conditions.skipOnSuccessOf?.length > 0 ||
      flowInput.conditions.skipOnFailureOf?.length > 0)

  // Cache for resolved IBC denoms to prevent unnecessary API calls
  const resolvedDenomsCache = useRef<Record<string, { symbol: string; denom: string } | string>>({})

  // Get IBC asset info for the current chain
  const chainInfo = useChainInfoByChainID(initialChainId)
  // Get the base denom from chain info or use an empty string
  // const baseDenom = chainInfo?.denom || chainInfo?.denom_local || ''
  const ibcAssetInfo = useIBCAssetInfoByChainID(initialChainId)

  // Theme controller
  const themeController = useControlTheme()
  // Get current theme
  const theme = themeController.theme.name === 'dark' ? 'dark' : 'light'

  // Check if on mobile - use prop if provided, otherwise use internal check
  const internalIsMobile = useMedia('sm')
  const isMobile = propIsMobile !== undefined ? propIsMobile : internalIsMobile

  // Memoized function to resolve denom with multiple fallback strategies
  // Returns an object with both the display symbol and the original denom
  const resolveDenom = useCallback(async (denom: string): Promise<{ symbol: string; denom: string }> => {
    const lowerDenom = denom.toLowerCase()
    const defaultReturn = { symbol: denom.toUpperCase(), denom };

    // Return cached result if available
    const cached = resolvedDenomsCache.current[lowerDenom];
    if (cached) {
      return typeof cached === 'string'
        ? { symbol: cached, denom }
        : cached;
    }

    // For non-IBC denoms, just format and return
    if (!lowerDenom.startsWith('ibc/')) {
      const formatted = formatDenom(denom)
      const result = { symbol: formatted, denom }
      resolvedDenomsCache.current[lowerDenom] = result
      return result
    }

    // Try to use IBC asset info if available
    if (ibcAssetInfo?.symbol) {
      const formatted = ibcAssetInfo.symbol.toUpperCase()
      const result = { symbol: formatted, denom: ibcAssetInfo.denom || denom }
      resolvedDenomsCache.current[lowerDenom] = result
      return result
    }

    // Then try to use chain info symbol if available
    if (chainInfo?.symbol) {
      const formatted = chainInfo.symbol.toUpperCase()
      const result = { symbol: formatted, denom: chainInfo.denom || denom }
      resolvedDenomsCache.current[lowerDenom] = result
      return result
    }

    // As a last resort, try the API
    try {
      const apiBase = process.env.NEXT_PUBLIC_INTO_API
      if (!apiBase) {
        console.warn('NEXT_PUBLIC_INTO_API is not defined')
        return defaultReturn
      }

      const hash = denom.split('/')[1]
      const url = `${apiBase}/ibc/apps/transfer/v1/denom_traces/${hash}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch denom trace')

      const data = await res.json()
      const baseDenom = data?.denom_trace?.base_denom || denom

      // Format and cache the result
      const symbol = formatDenom(baseDenom)
      const result = { symbol, denom: baseDenom }
      resolvedDenomsCache.current[lowerDenom] = result
      return result
    } catch (err) {
      console.warn(`Failed to resolve IBC denom ${denom}:`, err)
      // Cache the original denom to prevent repeated failed requests
      resolvedDenomsCache.current[lowerDenom] = defaultReturn
      return defaultReturn
    }
  }, [chainInfo, ibcAssetInfo])

  // State to store fee details
  const [feeDetails, setFeeDetails] = useState<{ amount: string; microAmount: string; denom: string }>({
    amount: '0',
    microAmount: '0',
    denom: 'uinto'
  })

  // Memoize the fee calculation handler to prevent unnecessary re-renders
  const handleFeeCalculated = useCallback(async (fee: string, symbol: string, denom: string, microAmount?: string) => {
    try {
      // Resolve the denom to get both symbol and denom
      const { symbol: displaySymbol, denom: resolvedDenom } = await resolveDenom(denom);

      // Convert fee to micro units if not provided
      const feeMicroAmount = microAmount || (parseFloat(fee) * 1000000).toString();

      // Update fee details with the resolved denom and micro amount
      setFeeDetails(prev => {
        if (prev.amount === fee && prev.microAmount === feeMicroAmount && prev.denom === resolvedDenom) return prev;
        return {
          amount: fee,
          microAmount: feeMicroAmount,
          denom: resolvedDenom
        };
      });

      // Update the display symbol if needed
      if (feeSymbol !== displaySymbol) {
        setFeeSymbol(displaySymbol);
      }
    } catch (error) {
      console.warn('Error resolving denom, using fallback values:', error);
      // Fallback to the provided values if resolution fails
      const fallbackMicroAmount = microAmount || (parseFloat(fee) * 1000000).toString();
      setFeeDetails(prev => ({
        amount: fee,
        microAmount: fallbackMicroAmount,
        denom: denom,
        ...(prev.amount === fee && prev.microAmount === fallbackMicroAmount && prev.denom === denom
          ? {}
          : { amount: fee, microAmount: fallbackMicroAmount, denom })
      }));

      const formattedSymbol = formatDenom(symbol);
      if (feeSymbol !== formattedSymbol) {
        setFeeSymbol(formattedSymbol);
      }
    }
  }, [feeSymbol, resolveDenom]);


  const [prefix, setPrefix] = useState('into')
  const [denom, setDenom] = useState('uinto')

  const [chainSymbol, setChainSymbol] = useState('INTO')
  const [chainId, setChainId] = useState(initialChainId || process.env.NEXT_PUBLIC_INTO_CHAIN_ID || "")

  const [_chainHasIAModule, setChainHasIAModule] = useState(true)

  const shouldTransferFromHost = flowInput.trustlessAgent?.feeLimit?.[0]?.denom != 'uinto'
  // Get the ICA address from the flow input
  //const icaAddressForGrants = flowInput.icaAddressForAuthZ;


  // Get authorization grants for the user

  const handleSubmitFlowOnHost = async () => {
    if (!shouldTransferFromHost) {
      toast.error('Host chain fee configuration is missing')
      return
    }

    try {
      await submitFlowOnHost()
    } catch (error) {
      console.error('Error submitting flow on host chain:', error)
      // Error is handled by the mutation
    }
  }

  // Initialize connectionId if not set
  useEffect(() => {
    if (!flowInput.connectionId && chainId) {
      // Find the default connectionId for this chainId
      const defaultConnectionId = "connection-0" // Default value, adjust as needed
      const updatedFlowInput = { ...flowInput, connectionId: defaultConnectionId }
      onFlowChange(updatedFlowInput)
    }
  }, [chainId, flowInput, onFlowChange])


  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, _isIcaLoading] = useGetICA(flowInput.connectionId, '')

  const [trustlessAgent, _istrustlessAgentLoading] = useGetTrustlessAgentICAByTrustlessAgentAddress(flowInput.trustlessAgent?.agentAddress || "")
  const [trustlessAgentICA, _istrustlessAgentICALoading] = useGetTrustlessAgentICAAddress(trustlessAgent?.agentAddress || "", flowInput.connectionId || "")

  const { grants: authzGrants, isLoading: _isAuthzGrantsLoading } = useAuthZMsgGrantInfoForUser(
    trustlessAgentICA || icaAddress,
    flowInput
  )

  // Use the shared grant validation hook to identify missing/expired grants
  const { invalidGrants } = useGrantValidation(
    authzGrants || [],
    { startTime: flowInput.startTime, duration: flowInput.duration }
  )

  const granteeAddress = trustlessAgentICA || icaAddress;
  const { mutate: submitFlowOnHost, isPending: isSubmittingOnHost } = useSubmitFlowOnHost({
    flowInput,
    ibcAssetInfo,
    requiredGrants: invalidGrants || [],
    grantee: granteeAddress,
    fee: {
      denom: feeDetails.denom,
      amount: feeDetails.microAmount
    }
  })

  // Log with proper null check to avoid undefined issues
  // useEffect(() => {
  //   console.log("trustlessAgentICA", trustlessAgentICA, "flowInput.connectionId", flowInput.connectionId || "<not set>")
  // }, [trustlessAgentICA, flowInput.connectionId]) 
  const refetchTrustlessAgentICA = useRefetchQueries([
    `hostInterchainAccount/${trustlessAgent?.agentAddress || ""}/${flowInput.connectionId || ""}`,
  ])
  const refetchAuthZForTrustlessAgentICA = useRefetchQueries([
    `userAuthZGrants / ${trustlessAgentICA}`
  ])
  const refetchICA = useRefetchQueries([
    `ibcTokenBalance / ${denom} / ${icaAddress}`,
    `userAuthZGrants / ${icaAddress}/${icaAddress}/${flowInput?.msgs?.length}`,
    //`interchainAccount / ${ flowInput.connectionId }`,
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

  // Reference to the ChainSelector component
  const chainSelectorRef = useRef<any>(null)

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
    chainId,
    {
      onError: (error: Error) => {
        console.error('Failed to connect wallet:', error)
      },
    }
  )


  const [feeFundsHostChain, _setFeeFundsHostChain] = useState('0.00')
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


  //////////////////////////////////////// Flow message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


  async function handleChainChange(
    chainId: string,
    connectionId: string,
    hostConnectionId: string,
    newPrefix: string,
    newDenom: string,
    chainSymbol: string
  ) {
    // alert(denom + newDenom)
    // Create a deep copy of flowInput to ensure all properties are properly updated
    let updatedFlowInput = JSON.parse(JSON.stringify(flowInput))
    updatedFlowInput.connectionId = connectionId
    updatedFlowInput.hostConnectionId = hostConnectionId
    flowInput.msgs.map((editMsg, editIndex) => {
      if (editMsg.includes(prefix + '1...')) {
        updatedFlowInput.msgs[editIndex] = editMsg.replaceAll(
          prefix + '1...',
          newPrefix + '1...'
        )

      }
      updatedFlowInput.msgs[editIndex] = updatedFlowInput.msgs[
        editIndex
      ].replaceAll(denom, newDenom)
    })

    onFlowChange(updatedFlowInput)
    setDenom(newDenom)

    setChainSymbol(chainSymbol)
    setChainId(chainId)
    setPrefix(newPrefix)

    setChainHasIAModule(chainId === 'INTO')

    await new Promise((resolve) => setTimeout(resolve, 200))
    connectExternalWallet(null)
  }

  useEffect(() => {
    if (icaAddress && icaAddress != "" && denom) {
      refetchICA();
    }
  }, [denom, icaAddress]);

  useEffect(() => {
    if ((trustlessAgent) && chainId) {
      refetchTrustlessAgentICA();
    }

  }, [chainId, trustlessAgent]);

  useEffect(() => {
    if (trustlessAgentICA) {
      refetchAuthZForTrustlessAgentICA()
    }

  }, [trustlessAgentICA]);


  function setConfig(updatedConfig: ExecutionConfiguration, useAndForComparisons: boolean) {
    // Create a deep copy of the flowInput to avoid mutation issues
    const updatedFlowInput = {
      ...flowInput,
      configuration: {
        ...updatedConfig
      },
      conditions: {
        ...flowInput.conditions,
        useAndForComparisons
      }
    }
    onFlowChange(updatedFlowInput)
  }


  function setConditions(updatedConfig: ExecutionConditions) {
    // Create a deep copy of the flowInput to avoid mutation issues
    const updatedFlowInput = {
      ...flowInput,
      conditions: {
        ...updatedConfig,
        // Ensure arrays are properly copied
        comparisons: [...updatedConfig.comparisons],
        feedbackLoops: [...updatedConfig.feedbackLoops],
        stopOnSuccessOf: [...updatedConfig.stopOnSuccessOf],
        stopOnFailureOf: [...updatedConfig.stopOnFailureOf],
        skipOnSuccessOf: [...updatedConfig.skipOnSuccessOf],
        skipOnFailureOf: [...updatedConfig.skipOnFailureOf]
      }
    }
    onFlowChange(updatedFlowInput)
  }




  return (
    <StyledDivForContainer>
      {/* Main container with responsive layout */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '24px'
      }}>
        {/* Left column - Flow configuration */}
        <div style={{ flex: isMobile ? '1' : '3' }}>
          <Inline css={{ margin: '$6', marginTop: '$12', }}>
            <StepIcon step={1} />
            <Text
              align="center"
              variant="body"
              color="tertiary"
              css={{ padding: '0 $15 0 $6' }}
            >
              Chain to execute on
            </Text>
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
                    disabled
                    ref={chainSelectorRef}
                    onChange={(update) => {
                      handleChainChange(
                        update.chainId,
                        update.connectionId,
                        update.hostConnectionId,
                        update.prefix,
                        update.denom,
                        update.symbol
                      )
                    }}
                    initialChainId={initialChainId}
                  />

                </Row>
              </Column>
            </CardContent>
          </Card>
          {flowInput.msgs && flowInput.msgs.length > 0 && (
            <>
              <Inline css={{ margin: '$6', marginTop: '$16' }}>
                <StepIcon step={2} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Messages to be executed
                </Text>
              </Inline>
              <Card
                css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
                variant="secondary"
                disabled
              >
                <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
                  <Column>
                    {flowInput.msgs.map((msg, index) => (
                      <div key={index} style={{ marginBottom: index < flowInput.msgs.length - 1 ? '16px' : '0' }}>
                        <TinyJsonViewer jsonValue={JSON.parse(msg)} bgColor={bgColor} />
                      </div>
                    ))}
                  </Column>
                </CardContent>
              </Card>
            </>
          )}

          <Column>
            <Inline css={{ margin: '$6', marginTop: '$16' }}>
              <StepIcon step={3} />
              <Text
                align="center"
                variant="body"
                color="tertiary"
                css={{ padding: '0 $15 0 $6' }}
              >
                Schedule execution
              </Text>
            </Inline>
            <SchedulingSection
              flowInput={flowInput}
              chainSymbol={chainSymbol}
              onFlowChange={onFlowChange}
              //icaAddress={icaAddress}
              onFeeCalculated={handleFeeCalculated}
              useMsgExec={useMsgExec}
              trustlessAgent={trustlessAgent}
            //setUseMsgExec={setUseMsgExec}
            />
          </Column>

          {hasConditions && (
            <Column>
              <Inline css={{ margin: '$6', marginTop: '$16' }}>
                <StepIcon step={4} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Execution conditions
                </Text>
              </Inline>
              <Conditions
                conditions={flowInput.conditions}
                disabled={false}
                onChange={setConditions}
              />
            </Column>
          )}

          {/* Show configuration in first column when no conditions or on mobile */}
          {((!hasConditions && flowInput.configuration) || (isMobile && flowInput.configuration)) && (
            <Column>
              <Inline css={{ margin: '$6', marginTop: hasConditions ? '$16' : '$16' }}>
                <StepIcon step={hasConditions ? 5 : 4} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Execution configuration
                </Text>
              </Inline>
              <Configuration
                config={flowInput.configuration}
                useAndForComparisons={flowInput.conditions?.useAndForComparisons}
                disabled={false}
                onChange={setConfig}
              />
            </Column>
          )}
        </div>

        {/* Right column - Flow summary, notifications and submit button */}
        <div style={{ flex: isMobile ? '1' : '2' }}>
          {/* Configuration in second column for non-mobile when there are conditions */}
          {!isMobile && hasConditions && flowInput.configuration && (
            <Column>
              <Inline css={{ margin: '$6', marginTop: '$12' }}>
                <StepIcon step={hasConditions ? 5 : 4} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Execution configuration
                </Text>
              </Inline>
              <Configuration
                config={flowInput.configuration}
                useAndForComparisons={flowInput.conditions?.useAndForComparisons}
                disabled={false}
                onChange={setConfig}
              />
            </Column>
          )}

          {/* Summary of conditions, configuration and scheduling */}
          <Column>
            <Inline css={{ margin: '$4', marginTop: isMobile ? '$16' : '$12' }}>
              <StepIcon step={hasConditions ? 6 : 5} />
              <Text
                align="center"
                variant="body"
                color="tertiary"
                css={{ padding: '0 $15 0 $6' }}
              >
                Flow summary
              </Text>
            </Inline>
            <FlowSummary
              flowInput={flowInput}
              displaySymbol={feeSymbol}
              expectedFee={feeDetails.amount}
              useMsgExec={useMsgExec}
            // chainId={chainId}
            // grantee={trustlessAgentICA || icaAddress}
            // authzGrants={authzGrants}
            // isAuthzGrantsLoading={isAuthzGrantsLoading}
            // refetchAuthzGrants={refetchAuthzGrants}
            />
          </Column>

          {/* Email Subscription as a form */}
          <Card variant={"secondary"} disabled css={{
            backgroundColor: '$colors$dark5',
            borderRadius: '12px',
            padding: '$6',
            margin: '$4 0',
            width: '100%',
            maxWidth: '600px',
            '@media (min-width: 768px)': {
              margin: '$6 auto',
              padding: '$8',
            },
            '@media (min-width: 1024px)': {
              maxWidth: '800px',
            },
          }}>
            <Text align="center" color="secondary" style={{ fontSize: '14px', marginBottom: '16px' }}>
              Subscribe to Alerts
            </Text>

            <form

              onSubmit={(e) => {
                e.preventDefault();
                // Form submission is handled by the Schedule button
              }}
            >
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={flowInput.email || ''}
                onChange={(e) => onFlowChange({ ...flowInput, email: e.target.value })}
                style={{
                  padding: '12px',
                  border: `1px solid ${theme === "dark" ? '#444' : '#ccc'}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  transition: 'border-color 0.3s ease-in-out',
                  backgroundColor: '$colors$dark50',
                  color: '$colors$dark',
                  width: '100%',
                  marginBottom: '16px'
                }}
                autoComplete="email"
              />

              <select
                name="alertType"
                value={flowInput.alertType || 'all'}
                onChange={(e) => onFlowChange({ ...flowInput, alertType: e.target.value })}
                style={{
                  padding: '12px',
                  border: `1px solid ${theme === "dark" ? '#444' : '#ccc'}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  transition: 'border-color 0.3s ease-in-out',
                  backgroundColor: '$colors$dark50',
                  color: '$colors$dark',
                  width: '100%',
                  marginBottom: '16px'
                }}
              >
                <option value="triggered">Triggered</option>
                <option value="timeout">Timed Out</option>
                <option value="error">Errors</option>
                <option value="all">All Events</option>
              </select>

              <Text color="tertiary" align="center" style={{ marginTop: '16px', fontSize: '12px' }}>
                You'll receive alerts for matching events. Emails are used solely for flow notifications.
              </Text>
            </form>
          </Card>

          {/* Create Button */}
          <div>
            <StyledPNG src="./img/poweredbyintento.png" css={{
              maxWidth: '180px',
              '@media (min-width: 480px)': {
                maxWidth: '200px',
              },
            }} />
            {shouldTransferFromHost ? (
              <Button
                variant="primary"
                size="large"
                onClick={handleSubmitFlowOnHost}
                disabled={isSubmittingOnHost}
                css={{ width: '100%', marginTop: '$4' }}
              >
                {isSubmittingOnHost ? <Spinner instant /> : 'Submit Flow on ' + chainInfo.name}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="large"
                iconLeft={<GearIcon />}
                onClick={() => {
                  onFlowChange(flowInput);
                  // Remind user about email subscription if not provided
                  if (!flowInput.email) {
                    toast.custom((t) => (
                      <Toast
                        icon={<IconWrapper icon={<InfoIcon />} color="secondary" />}
                        title="Email Notification Reminder"
                        body="You haven't provided an email for notifications. You can still Create the flow, but you won't receive alerts about its execution."
                        onClose={() => toast.dismiss(t.id)}
                      />
                    ), { duration: 5000 });
                  }
                  handleSubmitFlow();
                }}
                disabled={isExecutingSchedule || isExecutingRegisterICA || isExecutingSubmitTx || isExecutingSendFundsOnHost}
                css={{ width: '100%', marginTop: '$4' }}
              >
                {(isExecutingSchedule || isExecutingRegisterICA || isExecutingSubmitTx || isExecutingSendFundsOnHost) ? <Spinner instant /> : 'Submit Flow'}
              </Button>
            )}
          </div>

        </div>
      </div>
    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  padding: '0',
  maxWidth: '1000px',
  margin: '0 auto',
  display: 'block',

  '@media (max-width: 768px)': {
    padding: '$2',
  },
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


const StyledPNG = styled('img', {
  maxWidth: '100%',
  height: 'auto',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
  display: 'block',
  padding: '$2',
  margin: '$2',
  '@media (min-width: 480px)': {
    margin: '0',
  },
})