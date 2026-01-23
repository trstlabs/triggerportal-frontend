import { useEffect, useState, useCallback } from 'react'
import {
  Button,
  ChevronIcon,
  Column,
  WalletIcon,
  Inline,
  Text,
  ImageForTokenLogo,
  Card,
  CardContent,

  Spinner,
  Tooltip,

  IconWrapper,
  Chevron,
  useMedia,
} from 'components/ui-blocks'
import Link from 'next/link'
import React from 'react'

import { MsgUpdateFlowParams } from '../../../types/trstTypes'
import { Flow, ExecutionConfiguration, Comparison } from 'intentojs/dist/codegen/intento/intent/v1/flow'

import {
  useGetICA,
} from '../../../hooks/useICA'
import { useGetBalancesForAcc } from 'hooks/useTokenBalance'
import { IBCAssetInfo, useIBCAssetList } from '../../../hooks/useChainList'
import { getDuration, getRelativeTime } from '../../../util/time'

import { FlowHistory } from './FlowHistory'
import { FlowTransformButton, transformFlowMsgs } from './FlowTransformButton'
import { ComparisonForm, ComparisonOperatorLabels } from '../../build/components/Conditions/ComparisonForm'

import { Configuration } from '../../build/components/Conditions/Configuration'
import { JsonFormWrapper } from '../../build/components/Editor/JsonFormWrapper'
import JsonViewer from '../../build/components/Editor/JsonViewer'
import { Alert } from '../../../icons/Alert'
import { Share } from 'lucide-react'
import { EditSchedulingSection } from './EditSchedulingSection'
import { convertMicroDenomToDenom, resolveDenomSync } from '../../../util/conversion'
import { XTwitter } from '../../../icons/XTwitter'
import { AuthzGrantCheck } from '../../build/components/AuthzGrantCheck'
import { FeedbackLoopForm } from '../../build/components/Conditions/FeedbackLoopForm'
import { ICQConfigView } from './icqConfig'
import { useUpdateFlow } from '../../build/hooks'


type FlowBreakdownProps = {
  flow: Flow
  ibcInfo: IBCAssetInfo
}

export const FlowBreakdown = ({
  flow,
  ibcInfo,
}: //size = 'large',
  FlowBreakdownProps) => {

  const [icaAddress, _] = useGetICA(ibcInfo?.connection_id, flow.trustlessAgent?.agentAddress)


  const chainId = ibcInfo ? ibcInfo.chain_id : ''


  const [feeBalances, isFeeBalancesLoading] = useGetBalancesForAcc(
    flow.feeAddress
  )
  const [createGrants, setCreateGrants] = useState(false)
  const isActive =
    flow.endTime &&
    flow.execTime &&
    flow.endTime.getTime() >= flow.execTime.getTime() && flow.endTime.getTime() > Date.now()

  const [editingComparisonIndex, setEditingComparisonIndex] = useState<number | null>(null)
  const [pendingComparison, setPendingComparison] = useState<Comparison | null>(null)




  const [transformedMsgs, setTransformedMsgs] = useState<string[]>([])

  const [expandedFlowSections, setExpandedFlowSections] = useState<Set<string>>(new Set())

  // Function to toggle admin section expansion
  const toggleFlowSectionExpansion = (sectionName: string) => {
    setExpandedFlowSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName)
      } else {
        newSet.add(sectionName)
      }
      return newSet
    })
  }
  const safeJsonParse = useCallback((jsonString: string | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    async function fetchMsgs() {
      const msgs = await transformFlowMsgs(flow)
      if (msgs != undefined) {
        setTransformedMsgs(msgs)
      }
    }
    fetchMsgs()
  }, []) // Empty dependency array means this effect runs once on mount

  //////////////////////////////////////// Flow message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [editorIndex, setEditorIndex] = useState(-1)
  const [editConfig, setEditConfig] = useState(false)
  const [editExecution, setEditExecution] = useState(false)
  const [editMsgs, setEditMsgs] = useState([''])
  const flowParams: MsgUpdateFlowParams = {
    id: Number(flow.id),
    owner: flow.owner,
    endTime: flow.endTime.getTime(),
    startAt: flow.startTime ? flow.startTime.getTime() : 0,
    interval: Number(flow.interval.seconds),

  }

  const [updatedFlowParams, setUpdatedFlowParams] = useState<MsgUpdateFlowParams>({
    ...flowParams,
    msgs: [] // Initialize with empty messages array
  })

  async function showEditor(show: boolean, index: number) {
    setEditorIndex(index)

    if (show) {
      setEditorIndex(index)
      if (transformedMsgs.length) {
        setEditMsgs(transformedMsgs)
      } else {
        setEditMsgs(["{}"])
      }

      return
    }
    setEditorIndex(-1)
    setEditMsgs([])
  }
  const [requestedUpdateFlow, setRequestedUpdateFlow] = useState(false)
  const { mutate: handleUpdateFlow, isLoading: isExecutingUpdateFlow } =
    useUpdateFlow({ flowParams: updatedFlowParams }) || {};
  useEffect(() => {
    const shouldflowUpdateFlow =
      !isExecutingUpdateFlow && requestedUpdateFlow
    if (shouldflowUpdateFlow) {
      handleUpdateFlow(undefined, {
        onSettled: () => setRequestedUpdateFlow(false),
      })
    }
  }, [isExecutingUpdateFlow, requestedUpdateFlow, handleUpdateFlow])


  // Update flow with new messages
  const handleUpdateFlowClick = () => {
    if (!isJsonValid) {
      console.log('Invalid JSON in messages:', editMsgs);
      return;
    }

    // Create the updated params with the latest messages
    const updatedParams = {
      // ...flowParams,
      msgs: editMsgs,
      owner: flow.owner,
      id: Number(flow.id)
    };

    console.log('Updating flow with params:', updatedParams);

    // Update the state and flow the update
    setUpdatedFlowParams(updatedParams);
    setRequestedUpdateFlow(true);
  }

  function handleUpdateFlowConfigClick(config: ExecutionConfiguration, useAndForComparisons: boolean) {
    const params: MsgUpdateFlowParams = {
      id: Number(flow.id),
      configuration: config,
      owner: flow.owner,
    }

    setUpdatedFlowParams({
      ...params,
      configuration: config,
      conditions: {
        ...flow.conditions,
        useAndForComparisons
      }
    })
    setRequestedUpdateFlow(true);
  }

  function handleComparisonChange(updatedComparison: Comparison) {
    setPendingComparison(updatedComparison);
  }

  function handleSaveComparison(index: number) {
    if (!pendingComparison) return;

    const updatedComparisons = [...(flow.conditions.comparisons || [])];
    updatedComparisons[index] = pendingComparison;

    // Create a new conditions object with the updated comparisons
    const updatedConditions = {
      ...flow.conditions,
      comparisons: updatedComparisons,
    };
    const params: MsgUpdateFlowParams = {
      id: Number(flow.id),
      owner: flow.owner,
      msgs: transformedMsgs,//TODO: remove this
    }

    // Update the flow parameters with the new conditions
    setUpdatedFlowParams({
      ...params,
      conditions: updatedConditions,
    });

    setRequestedUpdateFlow(true);
    setPendingComparison(null);
    setEditingComparisonIndex(null);
  }

  function setUpdateFlow(params: { startAt?: number | Date; interval?: number; endTime?: number | Date }) {

    // Only update the specific fields that changed
    let updateParams: MsgUpdateFlowParams = {
      id: Number(flow.id),
      owner: flow.owner,
    };

    // Copy over the fields that are being updated
    if (params.interval !== flowParams.interval) {
      updateParams.interval = Number(params.interval);
      // Convert interval to seconds if needed
      if (params.interval < 1000000000) { // Assuming if it's less than 31 years in seconds, it's in seconds
        updateParams.interval = Number(params.interval);
      }
    }
    if (params.endTime !== flowParams.endTime) {
      updateParams.endTime = params.endTime instanceof Date
        ? params.endTime.getTime()
        : params.endTime;
    }
    if (params.startAt !== flowParams.startAt) {
      updateParams.startAt = params.startAt instanceof Date
        ? params.startAt.getTime()
        : params.startAt;
    }

    console.log('Updating flow with params:', updateParams);
    setUpdatedFlowParams(updateParams);
    setRequestedUpdateFlow(true);
  }
  const isMobile = useMedia('sm')
  const shouldDisableUpdateFlowButton = false // !updatedFlowParams || !updatedFlowParams.id

  // Debounce timer reference
  const debounceTimerRef = React.useRef<NodeJS.Timeout>();

  // Handle message changes in the editor with debouncing
  const handleChangeMsg = (index: number) => {
    return (msg: string) => {
      // Skip if the message hasn't changed
      if (editMsgs[index] === msg) {
        return;
      }

      // Update local state immediately for responsive UI
      setEditMsgs(prevMsgs => {
        const newMsgs = [...prevMsgs];

        // Ensure we have enough slots in the array
        while (newMsgs.length <= index) {
          newMsgs.push('{}');
        }

        // Only update if the message has actually changed
        if (newMsgs[index] !== msg) {
          newMsgs[index] = msg;
        }

        return newMsgs;
      });

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        // Only validate JSON when user stops typing for a bit
        if (!isJsonValid) {
          try {
            JSON.parse(msg);
            setIsJsonValid(true);
          } catch (e) {
            console.error('Invalid JSON:', e);
            return;
          }
        }

        // Update flow params after debounce
        setEditMsgs(currentMsgs => {
          setUpdatedFlowParams(prevParams => ({
            ...prevParams,
            id: Number(flow.id),
            msgs: [...currentMsgs],
            owner: flow.owner,
            endTime: flow.endTime.getTime(),
            interval: Number(flow.interval.seconds)
          }));
          return currentMsgs;
        });
      }, 500); // 500ms debounce
    };
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const [ibcAssetList] = useIBCAssetList()

  function handleRemoveMsg(index: number) {


    const newMsgs = editMsgs.filter(
      (msg) => msg !== editMsgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = null
    }


    let params: MsgUpdateFlowParams = {
      id: Number(flow.id),
      msgs: newMsgs,
      owner: flow.owner,
    }

    setUpdatedFlowParams(params)
  }

  return (
    <>
      <InfoHeader
        id={flow.id.toString()}
        owner={flow.owner}
        good={isActive}
      />
      <Card
        variant="secondary"
        disabled
        active={isActive}
        css={{
          margin: '$6',
          padding: '$6',
          border: '1px solid $borderColors$default',
          borderRadius: '18px',
        }}
      >
        <CardContent>
          <Column align="center">
            {ibcInfo && (
              <ImageForTokenLogo
                size="big"
                logoURI={ibcInfo.logo_uri}
                alt={ibcInfo.symbol}
              />
            )}
            <Text variant="title" align="center" css={{ padding: '$8' }}>
              {' '}
              {isActive && <>🟢 </>}
            </Text>
            <Text variant="legend">
              {flow.label != '' ? (
                <> {flow.label}</>
              ) : (
                <>Flow {flow.id.toString()}</>
              )}{' '}
            </Text>
            <Column align="center">
              {' '}
              <Text variant="secondary">
                <>
                  {' '}
                  {
                    flow.msgs[0]?.typeUrl?.split('.')
                      .find((msgSection) => msgSection.includes('Msg'))?.split(',')[0] ||
                    (transformedMsgs?.length > 0 ? safeJsonParse(transformedMsgs[0])?.typeUrl : 'Unknown Type') || 'Unknown Type'

                  }
                </>
              </Text>
            </Column>
          </Column>
        </CardContent>
      </Card>
      {/* </FlowBreakdownSection> */}
      <>
        <Inline
          css={{
            margin: '$6',
            gap: '$4'
          }}
          justifyContent="flex-end"
        >
          <Button
            as="a"
            variant="secondary"
            target="__blank"
            rel="noopener noreferrer"
            iconRight={<Alert />}
            href={`/alert?flowID=${flow.id}`}
          >
            Alerts
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const flowDetails = `Check out this flow on INTO Protocol: Flow ${flow.label ? flow.label : `Flow ${flow.id}`}`;
              const shareUrl = `${window.location.origin}/flows/${flow.id}`;

              if (navigator.share) {
                try {
                  await navigator.share({
                    title: `Flow ${flow.label ? flow.label : `Flow ${flow.id}`}`,
                    text: flowDetails,
                    url: shareUrl,
                  });
                } catch (err) {
                  console.error('Error sharing:', err);
                }
              } else {
                await navigator.clipboard.writeText(`${flowDetails}\n${shareUrl}`);
                alert('Link copied to clipboard!');
              }
            }}

          >
            Share <Share size={16} />
          </Button>
          {isMobile ? null : <Button
            variant="secondary"
            onClick={() => {
              const flowDetails = `Check out this flow on Intento: Flow ${flow.label ? flow.label : `Flow ${flow.id}`}`;
              const shareUrl = `${window.location.origin}/flows/${flow.id}`;

              const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(flowDetails)}&url=${encodeURIComponent(shareUrl)}`;
              window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            Post <XTwitter width="16" height="16" />
          </Button>}
          <FlowTransformButton flow={flow} initialChainID={chainId} />
        </Inline>


        <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion('trustlessAgent')} isExpanded={expandedFlowSections.has('trustlessAgent')}>
          <Column
            css={{ padding: '$3' }}
            gap={8}
            align="flex-start"
            justifyContent="flex-start"
          >
            <Text variant="legend" color="secondary" align="left">
              Owner
            </Text>

            <Text variant="body">{flow.owner} </Text>

            {!isFeeBalancesLoading && feeBalances && feeBalances.length > 0 && (
              <>  <Tooltip
                label={
                  "Address that can be funded to pay for execution fees."
                }
              >
                <Inline>
                  <Text variant="legend" color="secondary" align="left">
                    Flow Address
                  </Text>

                </Inline>
              </Tooltip>

                <Inline gap={2}>
                  <Text css={{ wordBreak: 'break-all' }} variant="body">
                    {flow.feeAddress}{' '}
                  </Text>
                </Inline>
                {feeBalances.map((balance) => (
                  <Text variant="legend">
                    {' '}
                    Balance: <Text variant="caption"> {convertMicroDenomToDenom(Number(balance.amount), 6)} {resolveDenomSync(balance.denom)}</Text>{' '}
                  </Text>
                ))}
              </>
            )}

            {flow.trustlessAgent.agentAddress && (
              /* (icaActive && !isIcaActiveLoading ?  */
              <>
                <Tooltip
                  label={
                    "Address of the Trustless Agent that is used to execute flows on the target chain. A Trustless Agent is an Interchain Account with a fee configuration."
                  }
                >
                  <Inline>
                    <Text variant="legend" color="secondary" align="left">
                      Trustless Agent
                    </Text>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => toggleFlowSectionExpansion('trustlessAgent')}
                      disabled={!expandedFlowSections.has('trustlessAgent')}
                      icon={
                        <IconWrapper
                          size="medium"
                          rotation={expandedFlowSections.has('trustlessAgent') ? "90deg" : "-90deg"}
                          color="tertiary"
                          icon={<Chevron />}
                        />
                      }
                    />
                  </Inline>
                </Tooltip>

                {expandedFlowSections.has('trustlessAgent') && (
                  <>
                    <Text css={{ wordBreak: 'break-all' }} variant="body">
                      {flow.trustlessAgent.agentAddress}{' '}<a
                        target={'_blank'}
                        href={`${process.env.NEXT_PUBLIC_INTO_API}/intento/intent/v1/trustless-agent/${flow.trustlessAgent.agentAddress}`}
                        rel="noopener noreferrer"
                      >
                        <b>View Configuration</b>
                      </a>
                    </Text>
                    {flow.trustlessAgent.feeLimit && flow.trustlessAgent.feeLimit.length > 0 && <Tooltip label="Setting a Fee Limit limits the fee charged for your execution on the host chain by the Trustless Agent"><Text variant="legend" color="secondary"> Fee Limit </Text></Tooltip>}
                    {flow.trustlessAgent.feeLimit?.length > 0 && flow.trustlessAgent.feeLimit.map((feeLimit: any) => (
                      <Text variant="caption" > {convertMicroDenomToDenom(feeLimit.amount, 6)} {resolveDenomSync(feeLimit.denom, ibcAssetList)}</Text>
                    ))}
                    <Text variant="legend" color="secondary" align="left">
                      Interchain Account
                    </Text>

                    <Text variant="body">{icaAddress} </Text>
                  </>
                )}
              </>
            )}
          </Column>
        </FlowBreakdownSection>

        {/* {icaAddress && icaBalance != 0 && flow.selfHostedIca?.connectionId !== undefined && (
          <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion('ibcPort')} isExpanded={expandedFlowSections.has('ibcPort')}>
            <Column
              style={{
                display: 'inline-block',
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                float: 'left',
              }}
              gap={8}
              align="flex-start"
              justifyContent="flex-start"
            >
              {flow.selfHostedIca.portId && (
                <Column
                  css={{ padding: '$3' }}
                  gap={8}
                  align="flex-start"
                  justifyContent="flex-start"
                >
                  <Inline>
                    <Text variant="legend" color="secondary" align="left">
                      IBC Port
                    </Text>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => toggleFlowSectionExpansion('ibcPort')}
                      disabled={!expandedFlowSections.has('ibcPort')}
                      icon={
                        <IconWrapper
                          size="medium"
                          rotation={expandedFlowSections.has('ibcPort') ? "90deg" : "-90deg"}
                          color="tertiary"
                          icon={<Chevron />}
                        />
                      }
                    />
                  </Inline>

                  {expandedFlowSections.has('ibcPort') && (
                    <Text variant="body">{flow.selfHostedIca.portId} </Text>
                  )}
                </Column>
              )}
              <Text variant="legend" color="secondary" align="left">
                Interchain Account
              </Text>

              <Text variant="body">{icaAddress} </Text>

              {!isIcaBalanceLoading && (
                <>
                  <Text variant="legend" color="secondary" align="left">
                    Balance
                  </Text>
                  <Text variant="body">
                    {icaBalance} {ibcInfo.symbol}
                  </Text>
                </>
              )}
              <Button
                css={{ justifyContent: 'flex-end !important' }}
                variant="ghost"
                onClick={() => setShowICAHostButtons(!showICAHostButtons)}
                icon={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={showICAHostButtons ? <Union /> : <Chevron />}
                  />
                }
              />
              {showICAHostButtons && (
                <FlowBreakdownSection>
                  <Column
                    gap={8}
                    align="flex-start"
                    justifyContent="flex-start"
                  >
                    <Text variant="legend">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFundsHostChain}
                        onChange={({ target: { value } }) =>
                          setFeeFundsHostChain(value)
                        }
                      />
                      {ibcInfo.symbol}
                    </Text>

                    <Tooltip
                      label="Fund the interchain account on the host chain. Only use this for fees. The tokens may be lost on the interchain account."
                      aria-label="Fee Funds "
                    >
                      <Text variant="legend" color="disabled">
                        {' '}
                        Top up balance of {icaBalance} {ibcInfo.symbol}{' '}
                      </Text>
                    </Tooltip>

                    {feeFundsHostChain != '0.00' &&
                      feeFundsHostChain != '0' &&
                      feeFundsHostChain != '0.00' &&
                      feeFundsHostChain != '0' &&
                      feeFundsHostChain != '' && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleSendFundsOnHostClick()}
                        >
                          {isExecutingSendFundsOnHost && <Spinner instant />}{' '}
                          {'Send'}
                        </Button>
                      )}
                  </Column>
                </FlowBreakdownSection>
              )}
            </Column>
          </FlowBreakdownSection>
        )} */}

        {flow.msgs.map((msg: any, msgIndex) => (
          <div key={msgIndex}>
            <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion(`message-${msgIndex}`)} isExpanded={expandedFlowSections.has(`message-${msgIndex}`)}>
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                <Text variant="legend" color="secondary" align="left">
                  Message {msgIndex + 1} Type
                </Text>
                <Inline gap={2}>
                  <Text variant="body">{transformedMsgs[msgIndex] ? safeJsonParse(transformedMsgs[msgIndex])?.typeUrl : msg.typeUrl} </Text>
                </Inline>

                <>
                  <Inline>
                    <Text variant="legend" color="secondary" align="left">
                      Message Value
                    </Text>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => toggleFlowSectionExpansion(`message-${msgIndex}`)}
                      disabled={!expandedFlowSections.has(`message-${msgIndex}`)}
                      icon={
                        <IconWrapper
                          size="medium"
                          rotation={expandedFlowSections.has(`message-${msgIndex}`) ? "90deg" : "-90deg"}
                          color="tertiary"
                          icon={<Chevron />}
                        />
                      }
                    />
                    {expandedFlowSections.has(`message-${msgIndex}`) &&
                      <> {msg.typeUrl != '/cosmos.authz.v1beta1.MsgExec' ? (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => showEditor(editorIndex != msgIndex, msgIndex)}
                        >
                          {editorIndex != msgIndex ? 'Edit' : 'Discard Edit'}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            showEditor(editorIndex != msgIndex, msgIndex)
                          }}
                        >
                          {editorIndex != msgIndex ? 'Edit' : 'Discard Edit'}
                        </Button>
                      )}
                      </>
                    }
                  </Inline>
                  {expandedFlowSections.has(`message-${msgIndex}`) && <Inline gap={2}>
                    {editorIndex == msgIndex && editMsgs && editMsgs[msgIndex] ? (
                      <div style={{ width: '100%' }}>
                        <JsonFormWrapper
                          index={msgIndex}
                          chainSymbol={"INTO"}
                          msg={editMsgs[msgIndex]}
                          handleRemoveMsg={handleRemoveMsg}
                          handleChangeMsg={handleChangeMsg}
                          setIsJsonValid={setIsJsonValid}
                        />
                        <Button
                          css={{ marginTop: '$8', margin: '$2' }}
                          variant="secondary"
                          size="small"
                          disabled={shouldDisableUpdateFlowButton}
                          onClick={handleUpdateFlowClick}
                        >
                          {isExecutingUpdateFlow && <Spinner instant />}{' '}
                          {'Update Message'}
                        </Button>
                      </div>
                    ) : (
                      <div style={{ width: '100%' }}>
                        <JsonViewer
                          jsonValue={
                            transformedMsgs[msgIndex]
                              ? safeJsonParse(transformedMsgs[msgIndex])?.value
                              : msg.valueDecoded
                          }
                        />
                      </div>
                    )}
                  </Inline>}
                </>


              </Column>
            </FlowBreakdownSection>

          </div>
        ))}

        {flow.startTime.getTime() > 0 && (
          <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion('scheduling')} isExpanded={expandedFlowSections.has('scheduling')}>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              <Inline css={{ justifyContent: 'space-between' }} >
                <Text variant="title" align="left" style={{ fontWeight: '600' }}>
                  Scheduling
                </Text>

                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => toggleFlowSectionExpansion('scheduling')}
                  disabled={!expandedFlowSections.has('scheduling')}
                  icon={
                    <IconWrapper
                      size="medium"
                      rotation={expandedFlowSections.has('scheduling') ? "90deg" : "-90deg"}
                      color="tertiary"
                      icon={<Chevron />}
                    />
                  }
                />
              </Inline>

              {expandedFlowSections.has('scheduling') && (
                <>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setEditExecution(!editExecution)}
                  >
                    {!editExecution ? 'Edit' : 'Discard'}
                  </Button>
                  {!editExecution && <> {flow.startTime && (
                    <>
                      <Tooltip
                        label={
                          'Start time is the time the flow starts. Execution starts at start time when a custom start time in the future is provided at submission'
                        }
                      >
                        <Text variant="legend" color="secondary" align="left">
                          Start Time
                        </Text>
                      </Tooltip>
                      <Inline gap={2}>
                        <Text variant="body">
                          {getRelativeTime(flow.startTime.getTime())}
                        </Text>
                      </Inline>
                    </>
                  )}
                    <Tooltip
                      label={
                        'Execution time is the time the next execution takes place. In case a flow has ended, the execution time is the time of the last execution'
                      }
                    >
                      <Text variant="legend" color="secondary" align="left">
                        Execution Time
                      </Text>
                    </Tooltip>
                    <Inline gap={2}>
                      <Text variant="body">
                        {getRelativeTime(flow.execTime.getTime())}
                      </Text>
                    </Inline>
                    {flow.interval.seconds.toString() != '0' && (
                      <>
                        {' '}
                        <Tooltip
                          label={'Interval is the fixed time between 2 executions'}
                        >
                          <Text variant="legend" color="secondary" align="left">
                            Interval
                          </Text>
                        </Tooltip>
                        <Inline gap={2}>
                          <Text variant="body">
                            {getDuration(Number(flow.interval.seconds))}
                          </Text>
                        </Inline>
                      </>
                    )}
                    {flow.endTime.getTime() && (
                      <>
                        <Tooltip
                          label={'End time is the time execution ends'}
                        >
                          <Text variant="legend" color="secondary" align="left">
                            End Time
                          </Text>
                        </Tooltip>
                        <Inline gap={2}>
                          <Text variant="body">
                            {getRelativeTime(flow.endTime.getTime())}
                          </Text>
                        </Inline>
                      </>
                    )}
                  </>}
                  {editExecution && (
                    <EditSchedulingSection
                      updatedFlowParams={updatedFlowParams}
                      setUpdateFlow={setUpdateFlow}
                      updateOnButtonClick={true}
                    />
                  )}
                </>
              )}
            </Column>

          </FlowBreakdownSection>
        )}


        {flow.conditions.comparisons && flow.conditions.comparisons.map((comparison: Comparison, index: number) => (
          <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion(`comparison-${index}`)} isExpanded={expandedFlowSections.has(`comparison-${index}`)}>


            <div style={{ width: '100%' }}>
              {editingComparisonIndex === index ? (
                <div style={{ display: 'flex', flexDirection: 'column', }}>
                  <ComparisonForm
                    comparison={pendingComparison || comparison}
                    onChange={handleComparisonChange}
                    setDisabled={() => setEditingComparisonIndex(null)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingComparisonIndex(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleSaveComparison(index)}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Inline>
                    <Tooltip label="Compare message responses or query responses to determine if execution should take place">
                      <Text variant="title" align="left" style={{ fontWeight: '600' }}>
                        Comparison
                      </Text>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => toggleFlowSectionExpansion(`comparison-${index}`)}
                      disabled={!expandedFlowSections.has(`comparison-${index}`)}
                      icon={
                        <IconWrapper
                          size="medium"
                          rotation={expandedFlowSections.has(`comparison-${index}`) ? "90deg" : "-90deg"}
                          color="tertiary"
                          icon={<Chevron />}
                        />
                      }
                    />
                  </Inline>

                  {expandedFlowSections.has(`comparison-${index}`) && (
                    <>
                      {/* <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setEditingComparisonIndex(index)}
                      >
                        Edit
                      </Button> */}

                      <>
                        {comparison.flowId.toString() !== "0" && (
                          <Text variant="body">
                            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">ID</Text> {comparison.flowId.toString()}
                          </Text>
                        )}
                        {comparison.responseIndex !== undefined && comparison.responseIndex !== 0 && (
                          <Text variant="body">
                            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Response Index</Text> {comparison.responseIndex}
                          </Text>
                        )}
                        {comparison.responseKey && (
                          <Text variant="body">
                            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Response Key</Text> {comparison.responseKey}
                          </Text>
                        )}
                        <Text variant="body">
                          <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Comparison Operator</Text> {ComparisonOperatorLabels[comparison.operator]}
                        </Text>
                        <Text variant="body">
                          <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Comparison Operand</Text> {comparison.operand}
                        </Text>
                        <Text variant="body">
                          <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Value Type</Text> {comparison.valueType}
                        </Text>
                      </>
                      {comparison.icqConfig && <ICQConfigView icqConfig={comparison.icqConfig} />}
                    </>
                  )}
                </>
              )}
            </div>


          </FlowBreakdownSection>
        ))}
        {flow.conditions.feedbackLoops && flow.conditions.feedbackLoops.map((feedbackLoop, index) => {
          const [isEditing, setIsEditing] = useState(false)
          const [editedFeedbackLoop, setEditedFeedbackLoop] = useState(feedbackLoop)

          const handleSave = () => {
            const updatedConditions = { ...flow.conditions }

            // Update the specific feedback loop
            const updatedFeedbackLoops = [...(updatedConditions.feedbackLoops || [])]
            updatedFeedbackLoops[index] = editedFeedbackLoop
            console.log(updatedFeedbackLoops)
            // Prepare the update parameters
            const updateParams: MsgUpdateFlowParams = {
              id: Number(flow.id),
              owner: flow.owner,
              msgs: transformedMsgs,
              conditions: {
                ...updatedConditions,
                feedbackLoops: updatedFeedbackLoops
              }
            }

            // Update the local state
            setUpdatedFlowParams(updateParams)

            // Trigger the update
            setRequestedUpdateFlow(true)
            setIsEditing(false)
          }

          const handleCancel = () => {
            setEditedFeedbackLoop(feedbackLoop)
            setIsEditing(false)
          }

          return (
            <div key={`feedback-${index}`}>
              {!isEditing ? (
                <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion(`feedback-${index}`)} isExpanded={expandedFlowSections.has(`feedback-${index}`)}>
                  <Column gap={4} align="flex-start" justifyContent="flex-start">
                    <Tooltip
                      label={
                        "Use a response value or query response as a value for a message"
                      }
                    >
                      <Inline css={{ width: '100%', justifyContent: 'space-between' }}>
                        <Inline>
                          <Text variant="title" align="left" style={{ fontWeight: '600' }}>
                            Feedback Loop
                          </Text>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFlowSectionExpansion(`feedback-${index}`)
                            }}
                            disabled={!expandedFlowSections.has(`feedback-${index}`)}
                            icon={
                              <IconWrapper
                                size="medium"
                                rotation={expandedFlowSections.has(`feedback-${index}`) ? "90deg" : "-90deg"}
                                color="tertiary"
                                icon={<Chevron />}
                              />
                            }
                          />
                        </Inline>
                        {/* {expandedFlowSections.has(`feedback-${index}`) && (
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsEditing(true)
                            }}
                          >
                            Edit
                          </Button>
                        )} */}
                      </Inline>
                    </Tooltip>

                    {expandedFlowSections.has(`feedback-${index}`) && (
                      <>
                        {feedbackLoop.flowId.toString() != "0" && (
                          <Text variant="body">
                            <Text variant="legend" color="secondary" align="left">ID</Text>  {feedbackLoop.flowId.toString()}
                          </Text>)}
                        {feedbackLoop.responseIndex != 0 &&
                          <Text variant="body">
                            <Text variant="legend" color="secondary" align="left">Response Index (optional)</Text>    {feedbackLoop.responseIndex}
                          </Text>
                        }
                        {feedbackLoop.responseKey != "" &&
                          <Text variant="body">
                            <Text variant="legend" color="secondary" align="left">Response Key (optional)</Text>      {feedbackLoop.responseKey}
                          </Text>}
                        <Text variant="body">
                          <Text variant="legend" color="secondary" align="left">Index in messages</Text>  {feedbackLoop.msgsIndex}
                        </Text>
                        <Text variant="body">
                          <Text variant="legend" color="secondary" align="left">Key in message to replace</Text>  {feedbackLoop.msgKey}
                        </Text>
                        <Text variant="body">
                          <Text variant="legend" color="secondary" align="left">Value Type</Text>   {feedbackLoop.valueType}
                        </Text>
                        {feedbackLoop.icqConfig && <ICQConfigView icqConfig={feedbackLoop.icqConfig} />}
                      </>
                    )}
                  </Column>
                </FlowBreakdownSection>
              ) : (
                <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '8px 0' }}>
                  <FeedbackLoopForm
                    feedbackLoop={editedFeedbackLoop}
                    onChange={(updated) => setEditedFeedbackLoop(updated)}
                    setDisabled={() => { }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {flow.configuration && (
          showConfiguration()

        )}
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.skipOnFailureOf.length != 0 && (
            <FlowBreakdownSection>
              <Tooltip
                label={
                  "Skip execution when dependent flows fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on Error Od
                </Text>
              </Tooltip>

              <Text variant="body">
                {flow.conditions.skipOnFailureOf}
              </Text>
            </FlowBreakdownSection>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.skipOnSuccessOf.length != 0 && (
            <FlowBreakdownSection>
              <Tooltip
                label={
                  "Skip execution when dependent flows succeed"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on Success Of
                </Text>
              </Tooltip>

              <Text variant="body">
                {flow.conditions.skipOnSuccessOf}
              </Text>
            </FlowBreakdownSection>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.stopOnFailureOf.length != 0 && (
            <FlowBreakdownSection>
              <Tooltip
                label={
                  "Stop execution when dependent flows fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on Failure Of
                </Text>
              </Tooltip>

              <Text variant="body">
                {flow.conditions.stopOnFailureOf}
              </Text>
            </FlowBreakdownSection>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.stopOnSuccessOf.length != 0 && (
            <FlowBreakdownSection>
              <Tooltip
                label={
                  "Stop execution when dependent flows succeed"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on Success Of
                </Text>
              </Tooltip>

              <Text variant="body">
                {flow.conditions.stopOnSuccessOf}
              </Text>
            </FlowBreakdownSection>
          )}
        </Column>





        {
          flow.updateHistory.length != 0 && (
            <>
              {' '}
              <FlowBreakdownSection>
                {' '}
                <Column gap={8} align="flex-start" justifyContent="flex-start">
                  {' '}
                  <Inline>
                    <Text variant="legend" color="secondary" align="left">
                      Update History
                    </Text>
                  </Inline>
                  {flow.updateHistory?.length ? (
                    flow.updateHistory.map((entry: any, ei) => {
                      const date = new Date(Number(entry.seconds) * 1000);  // Convert seconds to milliseconds
                      return (
                        <div key={ei}>
                          <Column gap={2} align="flex-start" justifyContent="flex-start">
                            <Text variant="body">
                              At {date.toLocaleString()}
                            </Text>
                          </Column>
                        </div>
                      );
                    })
                  ) : (
                    <Text>No update history available</Text>
                  )}


                </Column>
              </FlowBreakdownSection>
            </>
          )
        }
        {createGrants && <AuthzGrantCheck
          flowInput={{
            msgs: transformedMsgs || [],
            duration: flow.endTime.getTime() - (flow.startTime ? flow.startTime.getTime() : Number(flow.interval?.seconds) * 1000),
            startTime: flow.startTime ? flow.startTime.getTime() : 0,
            interval: flow.interval ? Number(flow.interval.seconds) * 1000 : undefined,
            configuration: flow.configuration,
            conditions: flow.conditions,
            trustlessAgent: flow.trustlessAgent,
            // icaAddressForAuthZ: flow.icaAddressForAuthZ,
            connectionId: ibcInfo?.connection_id,
            // hostConnectionId: flow.trustlessAgent?.connectionId,
            chainId: chainId,
          }}
          grantee={icaAddress}
          chainId={chainId}
          isAuthzGrantsLoading={false}
        />
        }
        <FlowHistory
          rpc={ibcInfo?.rpc || process.env.NEXT_PUBLIC_INTO_RPC}
          id={flow.id.toString()}
          transformedMsgs={transformedMsgs}
          trustlessAgentAddress={flow?.trustlessAgent?.agentAddress || ""}
          showCreateGrants={(show: boolean) => setCreateGrants(show)}
          ibcAssetList={ibcAssetList}
        />


      </>
    </>
  )

  function showConfiguration() {
    return <FlowBreakdownSection expandable onClick={() => toggleFlowSectionExpansion('configuration')} isExpanded={expandedFlowSections.has('configuration')}>
      {' '}
      <Column gap={4} align="flex-start" justifyContent="flex-start">
        <Inline css={{ justifyContent: 'space-between' }} >
          <Text variant="title" align="left" style={{ fontWeight: '600' }}>
            Configuration
          </Text>
          <Button
            variant="ghost"
            size="small"
            onClick={() => toggleFlowSectionExpansion('configuration')}
            disabled={!expandedFlowSections.has('configuration')}
            icon={
              <IconWrapper
                size="medium"
                rotation={expandedFlowSections.has('configuration') ? "90deg" : "-90deg"}
                color="tertiary"
                icon={<Chevron />}
              />
            }
          />
        </Inline>
        {expandedFlowSections.has('configuration') && (
          <>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setEditConfig(!editConfig)}
            >
              {!editConfig ? 'Edit' : 'Discard'}
            </Button>
            {editConfig ?
              <Configuration config={flow.configuration}
                useAndForComparisons={flow.conditions?.useAndForComparisons}
                disabled={false}
                onChange={handleUpdateFlowConfigClick} />
              :
              <> <>
                <Tooltip
                  label={'If set to true, message responses i.e. outputs may be used as inputs for new flows'}
                >
                  <Text variant="legend" color="secondary" align="left">
                    Save Responses
                  </Text>
                </Tooltip>

                <Text variant="header">
                  {flow.configuration.saveResponses ? '✔' : '✖'}
                </Text>
              </>
                <>
                  <Tooltip
                    label={'If set to true, the flow settings can not be updated'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Updating Disabled
                    </Text>
                  </Tooltip>
                  <Text variant="header">
                    {flow.configuration.updatingDisabled ? '✔' : '✖'}
                  </Text>
                </>
                <>
                  <Tooltip
                    label={'If set to true, stops on any errors that occur'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Stop on Failure
                    </Text>
                  </Tooltip>
                  <Text variant="header">
                    {flow.configuration.stopOnFailure ? '✔' : '✖'}
                  </Text>
                </>
                <>
                  <Tooltip
                    label={'If set to true, stops when execution of the messages was succesful'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Stop On Success
                    </Text>
                  </Tooltip>
                  <Text variant="header">
                    {flow.configuration.stopOnSuccess ? '✔' : '✖'}
                  </Text>
                </>
                <>
                  <Tooltip
                    label={'If set to true, stops on any timeout that occurs'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Stop on Timeout
                    </Text>
                  </Tooltip>
                  <Text variant="header">
                    {flow.configuration.stopOnTimeout ? '✔' : '✖'}
                  </Text>
                </>
                <>
                  <Tooltip
                    label={'If set to true, as a fallback, the owner balance is used to pay for local fees'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Wallet Fallback
                    </Text>
                  </Tooltip>
                  <Text variant="header">
                    {flow.configuration.walletFallback ? '✔' : '✖'}
                  </Text>
                </>
                <>
                  <Tooltip
                    label={'If set to true, will use AND for comparisons. On default execution happends when any condition returns true.'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Use AND for Comparisons
                    </Text>
                  </Tooltip>
                  <Text variant="header">
                    {flow.conditions.useAndForComparisons ? '✔' : '✖'}
                  </Text>
                </>
              </>
            }
          </>
        )}
      </Column>
    </FlowBreakdownSection>
  }
}

function FlowBreakdownSection({ children, onClick, expandable = false, isExpanded = false }: { children: React.ReactNode; onClick?: () => void; expandable?: boolean; isExpanded?: boolean }) {
  const baseCss = { padding: '$10 $10' }
  return (
    <Inline
      css={{
        ...baseCss,
        margin: '$4',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: '$light',
        borderRadius: '18px',
        border: '1px solid $borderColors$default',
        backgroundColor: '$base',
        cursor: expandable ? 'pointer' : 'default',
      }}
      onClick={expandable && onClick && !isExpanded ? onClick : undefined}
    >
      {children}
    </Inline>
  )
}


type InfoHeaderProps = {
  id: string
  owner: string
  good: boolean
}


const InfoHeader = ({ id, good }: InfoHeaderProps) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 0', width: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <Link href="/flows" passHref>
        <Button as="a" variant="ghost" size="large" iconLeft={<WalletIcon />}>
          <span style={{ paddingLeft: '1rem' }}>All Flows</span>
        </Button>
      </Link>
      <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
      <Text variant="caption" color="secondary">
        {good && <>🟢</>} Flow {id}
      </Text>
    </div>
  </div>
)
