import {
  Inline,
  Spinner,
  Button,
  Text,
  Column,
  styled,
  Tooltip,
  media,
  InfoIcon,
  formatTokenBalance,
} from 'components/ui-blocks'
import React, { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { intentModuleParamsAtom } from '../../../state/atoms/moduleParamsAtoms'
import { walletState } from '../../../state/atoms/walletAtoms'
import { convertMicroDenomToDenom, resolveDenomSync } from '../../../util/conversion'

import { SubmitFlowDialog } from '../../build/components/SubmitFlowDialog'
import { useSubmitFlow } from '../../build/hooks'
import { useSetModuleParams } from '../../../hooks/useChainInfo'
import {
  useGetAPR,
  useGetAPY,
  useGetStakeBalanceForAcc,
  useGetAPYWithFees,
  useGetTotalSupply,
  useGetCirculatingSupply,
  useGetAirdropClawback,
  useGetTotalBurned,
} from '../../../hooks/useChainInfo'
import { useFlowStats } from '../../../hooks/useFlowStats'
import { useTokenBalance } from '../../../hooks/useTokenBalance'
import { useIBCAssetList } from '../../../hooks/useChainList'
import { Alert } from '../../../icons/Alert'
import { FlowWaveIcon } from '../../../icons/FlowWaveIcon'
import { FlowInput } from '../../../types/trstTypes'
import { __TEST_MODE__ } from '../../../util/constants'

// Import icons for visual enhancement
import { Database, TrendingUp, Clock, DollarSign, Info, Compass, Flame } from 'lucide-react'
import { FeedbackLoop } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { useINTOPrice } from '../../../hooks/useINTOPrice'

type TokenomicsCardProps = {
  shouldShowAutoCompound: Boolean
}

export const TokenomicsCard = ({ shouldShowAutoCompound }: TokenomicsCardProps) => {
  const [params, _] = useSetModuleParams()
  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  const intentParams = useAtomValue(intentModuleParamsAtom)
  let data = new FlowInput()
  data.msgs = ['']
  const initConfig = {
    saveResponses: true,
    updatingDisabled: false,
    stopOnFailure: false,
    stopOnSuccess: false,
    stopOnTimeout: false,
    walletFallback: true,
  }
  data.configuration = initConfig
  const initConditions = {
    stopOnSuccessOf: [],
    stopOnFailureOf: [],
    skipOnFailureOf: [],
    skipOnSuccessOf: [],
    feedbackLoops: [],
    comparisons: [],
    useAndForComparisons: false,
  }
  data.label = "Autocompound"
  data.conditions = initConditions
  const [flowInput, setFlowInput] = useState(data)
  const [APR, isAPRLoading] = useGetAPR()
  const week = 60 * 60 * 24 * 7

  const [weeklyAPY, ___] = useGetAPY(week)
  const [stakeBalance, isStakeBalanceLoading] = useGetStakeBalanceForAcc()
  const [APYWFees, isAPYWFeesLoading] = useGetAPYWithFees(
    week * 52,
    week,
    stakeBalance ? stakeBalance.stakingBalanceAmount : 0,
    stakeBalance ? stakeBalance.validators.length : 1
  )
  const [totalSupply, isTotalSupplyLoading] = useGetTotalSupply()
  const [circulatingSupply, isCirculatingSupplyLoading] = useGetCirculatingSupply()
  const [airdropClawback, isAirdropClawbackLoading] = useGetAirdropClawback()
  const [totalBurned, isTotalBurnedLoading] = useGetTotalBurned()

  const { balance, isLoading } = useTokenBalance('INTO')
  const [ibcAssetList] = useIBCAssetList()
  const { totalFlows, flowIncrease, isLoading: isFlowStatsLoading } = useFlowStats()
  const { price, isLoading: isPriceLoading } = useINTOPrice()
  const wallet = useAtomValue(walletState)
  const { mutate: handleSubmitFlow, isLoading: isExecutingSchedule } =
    useSubmitFlow({ flowInput })

  useEffect(() => {
    const shouldTriggerSubmitFlow =
      !isExecutingSchedule && requestedSubmitFlow
    if (shouldTriggerSubmitFlow) {
      handleSubmitFlow(undefined, {
        onSettled: () => setRequestedSubmitFlow(false),
      })
    }
  }, [isExecutingSchedule, requestedSubmitFlow, handleSubmitFlow])

  const handleSubmitFlowClick = (newFlowInput: FlowInput) => {
    const msgs = []
    const feedbackLoops = []

    for (let i = 0; i < stakeBalance.validators.length; i++) {
      const validator = stakeBalance.validators[i]

      // Create claim message for this validator
      let claimMsg = claimRewardSDKMessage
      claimMsg.value.delegatorAddress = stakeBalance.address
      claimMsg.value.validatorAddress = validator
      msgs.push(JSON.stringify(claimMsg))

      // Create delegate message for this validator
      let delegateMsg = delegateSDKMessage
      delegateMsg.value.delegatorAddress = stakeBalance.address
      delegateMsg.value.validatorAddress = validator
      msgs.push(JSON.stringify(delegateMsg))

      // Create feedback loop for this validator's messages
      // Connect the claim message (2*i) to delegate message (2*i + 1)
      const feedbackLoop: FeedbackLoop = {
        msgsIndex: 2 * i, // Index of claim message for this validator
        msgKey: 'Amount',
        responseIndex: 0,
        responseKey: "Amount.[-1]",
        valueType: 'sdk.Coin',
        flowId: BigInt(0),
        differenceMode: false,
      }
      feedbackLoops.push(feedbackLoop)
    }

    const flow = {
      ...data,
      ...newFlowInput,
      msgs,
      conditions: {
        ...data.conditions,
        feedbackLoops: feedbackLoops
      }
    }

    setFlowInput(flow)
    return setRequestedSubmitFlow(true)
  }

  const [
    { isShowing: isSubmitFlowDialogShowing },
    setSubmitFlowDialogState,
  ] = useState({ isShowing: false })

  return (
    <StyledDivForContainer>
      <StyledDivForInfoGrid>

        <Column css={{
          paddingBottom: '$6',
          display: 'flex',
          flexDirection: 'column',
          gap: '$4',
        }}>
          <Text
            variant="title"
            css={{ paddingLeft: '$4', paddingBottom: '$8' }}
          >
            <Tooltip label="Staking allows you to earn INTO by securing the Intento network">
              <span> Staking</span>
            </Tooltip>
          </Text>
          {!isAPRLoading && APR ? (
            <>
              <Card css={{
                padding: '$12',
                margin: '$4',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.15)',
                  borderColor: 'rgba(34, 197, 94, 0.4)',
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #22c55e, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                  }}>
                    <TrendingUp size={20} color="white" />
                  </div>
                  <div>
                    <Inline>
                      <Text variant="legend" css={{ fontWeight: '600', color: '#22c55e' }}>Nominal APR</Text>
                      <Tooltip label="Nominal APR refers to the annual percentage rate that doesn't take into account compounding interest. It's the simple staking reward rate over the course of a year.">
                        <Button
                          variant="ghost"
                          size="small"
                          icon={<InfoIcon />}
                        />
                      </Tooltip>
                    </Inline>
                  </div>
                </div>
                <Text css={{
                  padding: '$8',
                  fontSize: '2rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #34d399, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} variant="title">
                  {APR.estimatedApr.toPrecision(3)}%
                </Text>
              </Card>


              {(balance > 0 || weeklyAPY) &&
                <>
                  <Card css={{
                    padding: '$12',
                    margin: '$4',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                    }
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}>
                        <Database size={20} color="white" />
                      </div>
                      <div>
                        <Inline>
                          <Text variant="legend" css={{ fontWeight: '600', color: '#3b82f6' }}>APY (Weekly Compound)</Text>
                          <Tooltip label="Annual Percentage Yield (APY) represents the effective annual rate of return of staked INTO that is compounded for a year, where rewards are calculated and added to your staking balance every week.">
                            <Button
                              variant="ghost"
                              size="small"
                              icon={<InfoIcon />}
                            />
                          </Tooltip>
                        </Inline>
                      </div>
                    </div>
                    {weeklyAPY && <Text css={{
                      padding: '$8',
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }} variant="title">
                      {weeklyAPY.toPrecision(3).toString()}%
                      {!isAPYWFeesLoading && APYWFees < weeklyAPY && (
                        <Text css={{
                          paddingTop: '$1',
                          fontSize: '1rem',

                        }} variant="caption">
                          {' '}
                          {APYWFees.toPrecision(3).toString()}%
                          with fees applied
                        </Text>
                      )}
                    </Text>}

                    {!isLoading && balance > 0 && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Info size={14} color="white" />
                          </div>
                          <Text variant="legend" css={{ fontWeight: '600', color: '#3b82f6' }}>
                            Balance Status
                          </Text>
                        </div>
                        <Text variant="caption" css={{ color: 'rgba(59, 130, 246, 0.8)', lineHeight: '1.4' }}>
                          {!isStakeBalanceLoading &&
                            stakeBalance &&
                            stakeBalance.stakingBalanceAmount > 0 ? (
                            <>
                              Stake Balance is{' '}
                              <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                                {formatTokenBalance(stakeBalance.stakingBalanceAmount, {
                                  includeCommaSeparation: true,
                                })}
                              </span>{' '}
                              with {stakeBalance.validators.length} validator
                              {stakeBalance.validators.length > 1 && <>s</>}{' '}
                            </>
                          ) : (
                            <>
                              You hold{' '}
                              <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                                {formatTokenBalance(balance)}
                              </span>{' '}
                              INTO and have not staked tokens yet, stake to secure the network and earn
                              staking rewards. Staking rewards can be compounded to
                              earn additional yield.
                            </>
                          )}
                        </Text>
                      </div>
                    )}
                  </Card></>}
            </>
          ) : (
            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)',
              border: '1px solid rgba(156, 163, 175, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(156, 163, 175, 0.15)',
                borderColor: 'rgba(156, 163, 175, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(156, 163, 175, 0.3)'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#9ca3af' }}>Staking Info</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '$8' }}>
                <Text css={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#9ca3af'
                }}>Retrieving staking info...</Text>
                <Spinner size={40} style={{ margin: 0, marginTop: '$4' }} />
              </div>
            </Card>
          )}
          {shouldShowAutoCompound ? (
            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#3b82f6' }}>Staking Actions</Text>
              </div>

              <StyledDivForButtons>
                <Button
                  css={{
                    marginLeft: '$8',
                    background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                    }
                  }}
                  variant="primary"
                  size="large"
                  disabled={isStakeBalanceLoading}
                  as="a"
                  href={'https://explorer.intento.zone/intento-' + (__TEST_MODE__ ? 'devnet' : 'mainnet') + '/staking'}
                  target="__blank"
                >
                  {' Stake'}
                </Button>
                <Button
                  css={{
                    marginLeft: '$8',
                    background: 'linear-gradient(135deg, #10b981, #22c55e)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                    }
                  }}
                  variant="primary"
                  size="large"
                  disabled={
                    isStakeBalanceLoading ||
                    (stakeBalance && stakeBalance.stakingBalanceAmount == 0)
                  }
                  onClick={() =>
                    setSubmitFlowDialogState({
                      isShowing: true,
                    })
                  }
                >
                  {isExecutingSchedule ? <Spinner instant /> : 'Autocompound'}
                </Button>
                {wallet?.address && (
                  <Button
                    css={{
                      marginLeft: '$8',
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)',
                      }
                    }}
                    variant="primary"
                    size="large"
                    as="a"
                    href={`/alert?owner=${wallet.address}`}
                    target="__blank"

                    iconRight={<Alert />}
                  >
                    Flow Alerts
                  </Button>
                )}
              </StyledDivForButtons>
            </Card>
          ) : (
            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.15)',
                borderColor: 'rgba(34, 197, 94, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #22c55e, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#22c55e' }}>Autocompounding Active</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '$8' }}>
                <StyledPNG src="./img/pot_full.png" />
                <Text css={{
                  marginTop: '$4',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#3b82f6'
                }}>You are autocompounding</Text>
                <Text variant="caption" css={{
                  color: 'rgba(59, 130, 246, 0.8)',
                  marginTop: '$2'
                }}>
                  Your staking rewards are automatically being restaked to maximize your yield.
                </Text>
              </div>
            </Card>
          )}
          {intentParams && (
            <Column css={{
              display: 'flex',
              flexDirection: 'column',
              gap: '$4',
              height: '100%',
            }}>
              <Text variant="title" css={{ padding: '$8' }}>
                <span> Intent Engine</span>
              </Text>

              <Card css={{
                padding: '$12',
                margin: '$4',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(217, 70, 239, 0.05) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(168, 85, 247, 0.15)',
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7, #d946ef)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                  }}>
                    <FlowWaveIcon size={20} color="white" />
                  </div>
                  <div>
                    <Text variant="legend" css={{ fontWeight: '600', color: '#a855f7' }}>Total Flows</Text>
                    {flowIncrease && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#22c55e',
                        fontWeight: '600',
                        marginTop: '0.125rem'
                      }}>
                        +{flowIncrease} new flows!
                      </div>
                    )}
                  </div>
                </div>
                <Text css={{
                  padding: '$8',
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} variant="title">
                  {!isFlowStatsLoading && totalFlows !== undefined
                    ? totalFlows.toLocaleString()
                    : 'Loading...'
                  }{' '}
                  <span style={{ fontSize: '1rem', opacity: 0.8 }}>flows</span>
                </Text>
                <Text variant="caption" css={{
                  display: 'block',
                  color: 'rgba(168, 85, 247, 0.8)',
                  fontSize: '0.875rem',
                  marginTop: '$2'
                }}>
                  Total flows on Intento
                </Text>
              </Card>
              <Card css={{
                padding: '$12',
                margin: '$4',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(139, 92, 246, 0.15)',
                  borderColor: 'rgba(139, 92, 246, 0.4)',
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}>
                    <Compass size={20} color="white" />
                  </div>
                  <Text variant="legend" css={{ fontWeight: '600', color: '#8b5cf6' }}>Flow Fees</Text>
                </div>
                <>

                  <div>
                    <Tooltip label="The gas fee multiplier is the multiplier that is applied to the gas fee of a flow.">
                      <Text variant="legend" css={{ marginBottom: '0.5rem', display: 'block' }}>Gas Fee Multiplier</Text></Tooltip>
                    <Text css={{
                      padding: '$6',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'block'
                    }} variant="title">
                      {
                        Number(intentParams.flowFlexFeeMul)} {" "}
                    </Text>
                  </div>
                  {intentParams.gasFeeCoins && intentParams.gasFeeCoins.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <Text variant="legend" css={{ marginBottom: '0.5rem', display: 'block' }}>Supported Gas Coins</Text>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {intentParams.gasFeeCoins.map((coin, index) => (
                          <div key={index} style={{
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            color: '#a78bfa',
                            fontWeight: '500'
                          }}>
                            {resolveDenomSync(coin.denom, ibcAssetList)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: '1rem' }}>
                    <Text variant="legend" css={{ marginBottom: '0.5rem', display: 'block' }}>INTO Burn Per Execution</Text>
                    <Text css={{
                      padding: '$6',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'block'
                    }} variant="title">
                      {convertMicroDenomToDenom(
                        Number(intentParams.burnFeePerMsg),
                        6
                      )}{' '}
                      INTO{' '}
                    </Text>
                  </div>
                </>
              </Card>
              {/* INTO Burned Card */}
              <Card css={{
                padding: '$12',
                margin: '$4',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}>
                    <Flame size={20} color="white" />
                  </div>
                  <div>
                    <Text variant="legend" css={{ fontWeight: '600', color: '#ef4444' }}>INTO Burned</Text>
                  </div>
                </div>
                <Text css={{
                  padding: '$8',
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} variant="title">
                  {!isTotalBurnedLoading ?
                    convertMicroDenomToDenom(totalBurned, 6) + " INTO"
                    : <Spinner size={24} />
                  }
                </Text>

              </Card>
            </Column>
          )}</Column>
        {process.env.NEXT_PUBLIC_SHOW_DISTRIBUTION && params && (
          <Column css={{
            display: 'flex',
            flexDirection: 'column',
            gap: '$4',
            height: '100%',
          }}>
            <Text
              variant="title"
              css={{ paddingLeft: '$4', paddingBottom: '$8' }}
            >
              <span> Distribution</span>
            </Text>

            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <Database size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#3b82f6' }}>Total Supply</Text>
              </div>
              <Text css={{
                padding: '$8',
                fontSize: '1.75rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }} variant="title">
                {!isTotalSupplyLoading && totalSupply
                  ? `${(convertMicroDenomToDenom(totalSupply, 6) / 1000000).toFixed(1)}M`
                  : 'Loading...'
                }
                <span style={{ fontSize: '1rem' }}> {" "}INTO</span>
              </Text>
            </Card>

            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #22c55e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <Tooltip label="The total amount of $INTO currently in circulation — calculated as the total supply minus tokens held in non-circulating wallets or module accounts as well as airdrop tokens that are not circulating and to-be clawed back.">
                  <Text variant="legend" css={{ fontWeight: '600', color: '#10b981' }}>Circulating Supply</Text>
                </Tooltip>
              </div>
              <Text css={{
                padding: '$8',
                fontSize: '1.75rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #34d399, #4ade80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }} variant="title">
                {!isCirculatingSupplyLoading && circulatingSupply
                  ? `${(convertMicroDenomToDenom(circulatingSupply, 6) / 1000000).toFixed(1)}M`
                  : 'Loading...'
                }
                <span style={{ fontSize: '1rem' }}> {" "}INTO</span>
              </Text>
            </Card>
            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <DollarSign size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#f59e0b' }}>INTO Price</Text>
              </div>
              <Text css={{
                padding: '$8',
                fontSize: '1.75rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #fbbf24, #facc15)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }} variant="title">
                {!isPriceLoading && price > 0
                  ? `$${price.toFixed(6)}`
                  : 'Loading...'
                }{' '}
                <span style={{ fontSize: '1rem', opacity: 0.8 }}>USDC</span>
              </Text>
              <Text variant="caption" css={{
                display: 'block',
                color: 'rgba(245, 158, 11, 0.8)',
                fontSize: '0.875rem',
                marginTop: '$2'
              }}>
                Live price from Osmosis pool (INTO/USDC)
              </Text>
            </Card>

            {process.env.NEXT_PUBLIC_CLAWBACK_ENABLED === 'true' && <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <Clock size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#f59e0b' }}>Airdrop Clawback</Text>
              </div>
              {!isAirdropClawbackLoading && airdropClawback ? (
                <>
                  <div style={{
                    height: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    margin: '0.75rem 0',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${100 - airdropClawback.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #facc15)',
                      borderRadius: '6px',
                      transition: 'width 0.8s ease',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        animation: 'shine 2s infinite'
                      }} />
                    </div>
                  </div>
                  <Text css={{
                    padding: '$8',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#f59e0b'
                  }} variant="title">
                    {100 - Number((airdropClawback?.percentage || 0).toFixed(3))}% will be clawed back
                  </Text>
                  <Text variant="caption" css={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'rgba(245, 158, 11, 0.8)',
                    fontSize: '0.875rem'
                  }}>
                    Note: This does not account for tokens that are vested but not yet claimed by users.
                  </Text>
                  <Text variant="caption" css={{
                    display: 'block',
                    color: 'rgba(245, 158, 11, 0.7)',
                    fontSize: '0.8rem',
                    lineHeight: '1.4'
                  }}>
                    These tokens may be used for growth initiatives or burned, increasing the scarcity of INTO.
                  </Text>
                </>
              ) : (
                <Text css={{
                  padding: '$8',
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #fbbf24, #facc15)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} variant="title">
                  Loading...
                </Text>
              )}
            </Card>
            }
            <Card css={{
              padding: '$12',
              margin: '$4',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.4)',
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <Info size={20} color="white" />
                </div>
                <Text variant="legend" css={{ fontWeight: '600', color: '#3b82f6' }}>Maximum Supply</Text>
              </div>
              <Text css={{
                padding: '$8',
                fontSize: '1.75rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }} variant="title">
                560M  <span style={{ fontSize: '1rem' }}> {" "}INTO</span>
              </Text>
              <Text variant="caption" css={{
                padding: '0 $8 $8',
                color: 'rgba(59, 130, 246, 0.8)',
                fontSize: '0.875rem',
                lineHeight: '1.4'
              }}>
                Projected over 20 years with 400M initial supply, 10% initial inflation, and 25% yearly inflation reduction.
              </Text>
            </Card>

          </Column>
        )}
        <SubmitFlowDialog
          isLoading={isExecutingSchedule}
          flowInput={{ ...flowInput, label: "Autocompound" }}
          isDialogShowing={isSubmitFlowDialogShowing}
          chainId={process.env.NEXT_PUBLIC_INTO_CHAIN_ID}
          onRequestClose={() =>
            setSubmitFlowDialogState({
              isShowing: false,
            })
          }
          handleSubmitFlow={(flowInput) =>
            handleSubmitFlowClick(flowInput)
          }
          executionParams={{
            startAt: 0,
            interval: 86400000 * 7, // Weekly compounding
            endTime: Date.now() + 365 * 86400000 + 900000, // 1 year from now + 15 minutes
          }}
        />
      </StyledDivForInfoGrid>
    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  display: 'inline-block',
})

const claimRewardSDKMessage = {
  typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  value: {
    delegatorAddress: 'into1....',
    validatorAddress: 'intovaloper1...',
  },
}

const delegateSDKMessage = {
  typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
  value: {
    delegatorAddress: 'into1....',
    validatorAddress: 'intovaloper1...',
    amount: {
      amount: '1000000',
      denom: 'uinto',
    },
  },
}

const StyledPNG = styled('img', {
  width: '50%',
  maxWidth: '200px',
  maxHeight: '400px',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
  display: 'block',
})

const StyledDivForButtons = styled('div', {
  columnGap: '$space$4',
  display: 'flex',
  alignItems: 'center',
})

const StyledDivForInfoGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: '1fr',
  columnGap: '$12',
  rowGap: '$16',
  alignItems: 'start',
  minHeight: '100%',

  // Ensure both columns take equal height
  '& > *': {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  '@media (max-width: 860px)': {
    gridTemplateColumns: '1fr',
    columnGap: '$10',
    rowGap: '$20',

    '& > *': {
      minHeight: 'auto',
    },
  },

  [media.sm]: {
    gridTemplateColumns: '1fr',
    rowGap: '$16',
  },
})

const Card = styled('div', {
  background: '$colors$dark10',
  borderRadius: '18px',
  padding: '$12 $16',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '$light',
  border: '1px solid $borderColors$default',
  backgroundColor: '$base',

})
