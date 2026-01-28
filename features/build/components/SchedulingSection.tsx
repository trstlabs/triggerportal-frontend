import {
  Inline,
  Card,
  CardContent,
  Button,
  Text,
  Column,
  styled,
  IconWrapper,
  Toast,
  Error,
  Tooltip,
} from 'components/ui-blocks'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { FlowInput } from '../../../types/trstTypes'
import { Chip, ChipSelected } from '../../../components/Layout/Chip'
import { useGetExpectedFlowFee } from '../../../hooks/useChainInfo'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'

interface SchedulingSectionProps {
  flowInput: FlowInput
  chainSymbol?: string
  onFlowChange: (flowInput: FlowInput) => void
  onFeeCalculated?: (fee: string, symbol: string, denom: string, microAmount?: string) => void
  useMsgExec?: boolean
  //setUseMsgExec?: (value: boolean) => void
  trustlessAgent?: any // Add trustlessAgent prop
}

export const SchedulingSection = ({ flowInput, chainSymbol, onFlowChange, onFeeCalculated, useMsgExec: propUseMsgExec, trustlessAgent }: SchedulingSectionProps) => {
  // Time constants in milliseconds
  const HOUR_MS = 60 * 60 * 1000
  const DAY_MS = 24 * HOUR_MS

  // State for scheduling parameters (all in milliseconds for flowInput)
  const [startTime, setStartTime] = useState(flowInput.startTime || 0)
  const [duration, setDuration] = useState(flowInput.duration || 24 * 60 * 60 * 1000) // 
  const [interval, setInterval] = useState(flowInput.interval || 60 * 60 * 1000) // 
  const [txLabel, _setLabel] = useState(flowInput.label || '')
  // Use the chainSymbol directly instead of storing it in state to ensure it updates when the prop changes
  const feeFundsSymbol = chainSymbol || 'INTO'

  // Get the denom_local for the current chain symbol
  const ibcAssetInfo = useIBCAssetInfo(feeFundsSymbol)

  const denomLocal = ibcAssetInfo?.denom_local || `u${feeFundsSymbol.toLowerCase()}`

  // Use parent's state if provided, otherwise use local state
  const [localUseMsgExec, _setLocalUseMsgExec] = useState(flowInput.msgs[0]?.includes("authz.v1beta1.MsgExec") || false)

  // Use the prop values if provided, otherwise use local state
  const useMsgExec = propUseMsgExec !== undefined ? propUseMsgExec : localUseMsgExec
  //const setUseMsgExec = propSetUseMsgExec || setLocalUseMsgExec

  // Display states
  const [displayInterval, setDisplayInterval] = useState(
    flowInput.interval ? formatTimeDisplay(flowInput.interval) : '1 hour'
  )
  const [editInterval, setEditInterval] = useState(false)
  const [editIntervalValue, setEditIntervalValue] = useState('1 day')

  const [displayDuration, setDisplayDuration] = useState(
    flowInput.duration ? formatTimeDisplay(flowInput.duration) : '24 hours'
  )
  const [editDuration, setEditDuration] = useState(false)
  const [editDurationValue, setEditDurationValue] = useState('30 days')

  const [displayStartTime, setDisplayStartTime] = useState(
    flowInput.startTime && flowInput.startTime > 0 ? formatTimeDisplay(flowInput.startTime) : 'On First Run'
  )
  const [editStartTime, setEditStartTime] = useState(false)
  const [editStartTimeValue, setEditStartTimeValue] = useState('1 hour')

  // Predefined time options
  const timeLabels = [
    'None',
    '1 hour',
    '3 hours',
    '6 hours',
    '12 hours',
    '24 hours',
    '2 days',
    '3 days',
    '5 days',
    '1 week',
    '2 weeks',
    '30 days',
    '90 days',
    'Custom',
  ]

  // Time values in milliseconds
  const timeMsValues = [
    0,                          // None
    HOUR_MS,                    // 1 hour
    3 * HOUR_MS,                // 3 hours
    6 * HOUR_MS,                // 6 hours
    12 * HOUR_MS,               // 12 hours
    DAY_MS,                     // 1 day
    2 * DAY_MS,                 // 2 days
    3 * DAY_MS,                 // 3 days
    5 * DAY_MS,                 // 5 days
    7 * DAY_MS,                 // 1 week
    14 * DAY_MS,                // 2 weeks
    30 * DAY_MS,                // 30 days
    90 * DAY_MS,                // 90 days
    -1,                         // Custom value indicator
  ]

  // Fee calculation with current values
  const [expectedFeeAmount, _, feeDenom] = useGetExpectedFlowFee(
    duration,
    {
      ...flowInput,
      interval,
      duration,
      startTime,
      msgs: useMsgExec && flowInput.msgs[0] && !flowInput.msgs[0].includes("authz.v1beta1.MsgExec") ?
        [`authz.v1beta1.MsgExec${flowInput.msgs[0]}`] :
        flowInput.msgs
    },
    denomLocal,
    interval,
    trustlessAgent
  )

  // Always use the symbol from the fee calculation, defaulting to 'INTO' if not available
  const displaySymbol = feeDenom === 'uinto' ? 'INTO' : (feeDenom ? feeDenom.toUpperCase().replace('U', '') : feeDenom)

  // Calculate the micro amount (convert to base units)
  const microAmount = typeof expectedFeeAmount === 'number'
    ? Math.round(expectedFeeAmount * 1000000).toString()
    : '0';

  // Notify parent component about fee calculation
  useEffect(() => {
    if (onFeeCalculated) {
      onFeeCalculated(
        expectedFeeAmount.toString(),
        displaySymbol,
        denomLocal,
        microAmount
      )
    }
  }, [expectedFeeAmount, displaySymbol, denomLocal, onFeeCalculated, microAmount])

  // Update flowInput when scheduling parameters change
  useEffect(() => {
    const updatedFlowInput = {
      ...flowInput,
      label: txLabel,
      // Store all times in milliseconds for executeSubmitFlow
      startTime: startTime > 0 ? startTime : 0,
      interval: interval > 0 ? interval : 0,
      duration: duration > 0 ? duration : 0,
      msgs: useMsgExec && flowInput.msgs[0] && !flowInput.msgs[0].includes("authz.v1beta1.MsgExec") ?
        [`authz.v1beta1.MsgExec${flowInput.msgs[0]}`] :
        flowInput.msgs
    }
    onFlowChange(updatedFlowInput)
  }, [startTime, interval, duration, txLabel, useMsgExec, onFlowChange, flowInput.msgs])

  // Format time display based on milliseconds
  function formatTimeDisplay(ms: number): string {
    if (ms === 0) return 'On First Run'

    const seconds = Math.floor(ms / 1000)

    if (seconds < 60) {
      return seconds === 1 ? '1 second' : `${seconds} seconds`
    } else if (seconds < 60 * 60) {
      const minutes = Math.floor(seconds / 60)
      return minutes === 1 ? '1 minute' : `${minutes} minutes`
    } else if (seconds < 60 * 60 * 24 * 2) { // Less than 2 days, show in hours
      const hours = Math.floor(seconds / (60 * 60))
      return hours === 1 ? '1 hour' : `${hours} hours`
    } else if (seconds < 60 * 60 * 24 * 7) { // Less than 1 week, show in days
      const days = Math.floor(seconds / (60 * 60 * 24))
      return days === 1 ? '1 day' : `${days} days`
    } else if (seconds < 60 * 60 * 24 * 30) { // Less than 1 month, show in weeks
      const weeks = Math.floor(seconds / (60 * 60 * 24 * 7))
      return weeks === 1 ? '1 week' : `${weeks} weeks`
    } else if (seconds < 60 * 60 * 24 * 365) { // Less than 1 year, show in months
      const months = Math.floor(seconds / (60 * 60 * 24 * 30))
      return months === 1 ? '1 month' : `${months} months`
    } else {
      const years = Math.floor(seconds / (60 * 60 * 24 * 365))
      return years === 1 ? '1 year' : `${years} years`
    }
  }

  // Handler functions
  function handleInterval(label: string, value: number) {
    if (value > duration && duration > 0) {
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Error />} color="error" />}
          title={
            "Can't set interval longer than the duration of " +
            displayDuration
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      return
    }
    setInterval(value)
    setDisplayInterval(label)
  }

  function handleRemoveInterval() {
    setInterval(0)
    setDisplayInterval('None Selected')
  }

  function handleDuration(label: string, value: number) {
    if (value >= interval || interval === 0) {
      setDuration(value)
      setDisplayDuration(label)
      return
    }

    toast.custom((t) => (
      <Toast
        icon={<IconWrapper icon={<Error />} color="error" />}
        title={
          "Can't set duration shorter than the interval of " +
          displayInterval
        }
        onClose={() => toast.dismiss(t.id)}
      />
    ))
  }

  function handleRemoveDuration() {
    setDuration(0)
    setDisplayDuration('None Selected')
  }

  function handleStartTime(label: string, value: number) {
    setStartTime(value)
    setDisplayStartTime(label)
  }

  function handleRemoveStartTime() {
    setStartTime(0)
    setDisplayStartTime('On First Run')
  }

  function convertTime(input: string): number {
    // If input is just a number, assume it's in hours
    if (/^\d+$/.test(input.trim())) {
      return Number(input.trim()) * 60 * 60 * 1000 // Convert hours to ms
    }

    const numberMatch = input.match(/\d+/g)
    if (!numberMatch) return 0

    const number = Number(numberMatch[0])
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes('second') || lowerInput.includes('sec')) {
      return number * 1000
    } else if (lowerInput.includes('minute') || lowerInput.includes('min')) {
      return number * 60 * 1000
    } else if (lowerInput.includes('hour')) {
      return number * 60 * 60 * 1000
    } else if (lowerInput.includes('day')) {
      return number * 24 * 60 * 60 * 1000
    } else if (lowerInput.includes('week')) {
      return number * 7 * 24 * 60 * 60 * 1000
    } else if (lowerInput.includes('month')) {
      return number * 30 * 24 * 60 * 60 * 1000
    } else if (lowerInput.includes('year')) {
      return number * 365 * 24 * 60 * 60 * 1000
    }

    // If we can't determine the unit but have a number, default to hours
    return number * 60 * 60 * 1000
  }

  function cleanCustomInputForDisplay(input: string) {
    // If input is just a number, format as hours
    if (/^\d+$/.test(input.trim())) {
      const number = Number(input.trim())
      return number === 1 ? '1 hour' : number + ' hours'
    }

    const numberMatch = input.match(/\d+/g)
    if (!numberMatch) return input

    const number = Number(numberMatch[0])
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes('hour')) {
      return number === 1 ? '1 hour' : number + ' hours'
    } else if (lowerInput.includes('day')) {
      return number === 1 ? '1 day' : number + ' days'
    } else if (lowerInput.includes('minute') || lowerInput.includes('min')) {
      return number === 1 ? '1 minute' : number + ' minutes'
    } else if (lowerInput.includes('week')) {
      return number === 1 ? '1 week' : number + ' weeks'
    } else if (lowerInput.includes('month')) {
      return number === 1 ? '1 month' : number + ' months'
    } else if (lowerInput.includes('year')) {
      return number === 1 ? '1 year' : number + ' years'
    }

    // If we can't determine the unit but have a number, default to hours
    return number === 1 ? '1 hour' : number + ' hours'
  }

  return (
    <Column>
      <Card
        css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
        variant="secondary"
        disabled
      >
        <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
          <Column css={{ gap: 24 }}>

            <div style={{ width: '100%', backgroundColor: '$colors$dark5', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
              <Column css={{ width: '100%' }}>
                {/* Start Time Section */}
                <Inline justifyContent="space-between" align="center" css={{ marginBottom: 16 }}>
                  <Inline align="center">
                    <Text css={{ fontSize: '20px', marginRight: '8px' }}>📅</Text>
                    <Text css={{ fontWeight: '500' }} variant="body">Start Time</Text>
                  </Inline>

                  {!editStartTime ? (
                    <Inline css={{ gap: 8 }}>
                      <Inline css={{ gap: 8 }}>
                        {timeLabels.slice(1, 7).map((label) => {
                          const isSelected = displayStartTime === label;
                          return isSelected ? (
                            <ChipSelected
                              key={label}
                              label={label}
                              onClick={() =>
                                handleStartTime(
                                  label,
                                  timeMsValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          ) : (
                            <Chip
                              key={label}
                              label={label}
                              onClick={() =>
                                handleStartTime(
                                  label,
                                  timeMsValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          );
                        })}
                        {displayStartTime === 'Custom' ? (
                          <ChipSelected label="Custom" onClick={() => setEditStartTime(true)} />
                        ) : (
                          <Chip label="Custom" onClick={() => setEditStartTime(true)} />
                        )}
                      </Inline>
                      {startTime > 0 && (
                        <Button size="small" variant="ghost" onClick={handleRemoveStartTime}>
                          Clear
                        </Button>
                      )}
                    </Inline>
                  ) : (
                    <Inline css={{ gap: 8 }}>

                      <StyledInputWithBorder
                        placeholder="e.g. 1 hour"
                        value={editStartTimeValue}
                        onChange={({ target: { value } }) => setEditStartTimeValue(value)}
                        autoFocus
                        disabled={false}
                      />
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          const time = convertTime(editStartTimeValue)
                          if (time > 0) {
                            handleStartTime('Custom', time)
                            setDisplayStartTime('Custom')
                          }
                          setEditStartTime(false)
                        }}
                      >
                        Set
                      </Button>

                      <Button size="small" variant="ghost" onClick={() => setEditStartTime(false)}>
                        Cancel
                      </Button>
                    </Inline>
                  )}
                </Inline>

                {/* Interval Section */}
                <Inline justifyContent="space-between" align="center" css={{ marginBottom: 16, marginTop: 24 }}>
                  <Inline align="center">
                    <Text css={{ fontSize: '20px', marginRight: '8px' }}>🔁</Text>
                    <Tooltip label="How often to repeat this flow">
                      <Text css={{ fontWeight: '500' }} variant="body">Interval (Optional)</Text>
                    </Tooltip>
                  </Inline>

                  {!editInterval ? (
                    <Inline css={{ gap: 8 }}>
                      <Inline css={{ gap: 8 }}>
                        {timeLabels.slice(1, 7).map((label) => {
                          const isSelected = displayInterval === label;
                          return isSelected ? (
                            <ChipSelected
                              key={label}
                              label={label}
                              onClick={() =>
                                handleInterval(
                                  label,
                                  timeMsValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          ) : (
                            <Chip
                              key={label}
                              label={label}
                              onClick={() =>
                                handleInterval(
                                  label,
                                  timeMsValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          );
                        })}
                        <Chip label="Custom" onClick={() => setEditInterval(true)} />
                      </Inline>
                      {interval > 0 && (
                        <Button size="small" variant="ghost" onClick={handleRemoveInterval}>
                          Clear
                        </Button>
                      )}
                    </Inline>
                  ) : (
                    <Inline css={{ gap: 8 }}>
                      <StyledInputWithBorder
                        placeholder="e.g. 3 days"
                        value={editIntervalValue}
                        onChange={({ target: { value } }) => setEditIntervalValue(value)}
                      />
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          const time = convertTime(editIntervalValue)
                          if (time > 0) {
                            handleInterval(cleanCustomInputForDisplay(editIntervalValue), time)
                          }
                          setEditInterval(false)
                        }}
                      >
                        Set
                      </Button>
                      <Button size="small" variant="ghost" onClick={() => setEditInterval(false)}>
                        Cancel
                      </Button>
                    </Inline>
                  )}
                </Inline>

                {/* Duration Section */}
                <Inline justifyContent="space-between" align="center" css={{ marginBottom: 16, marginTop: 24 }}>
                  <Inline align="center">
                    <Text css={{ fontSize: '20px', marginRight: '8px' }}>⏰</Text>
                    <Tooltip label="How long this flow should run for">
                      <Text css={{ fontWeight: '500' }} variant="body">Duration</Text>
                    </Tooltip>
                  </Inline>

                  {!editDuration ? (
                    <Inline css={{ gap: 8 }}>
                      <Inline css={{ gap: 8 }}>
                        {timeLabels.slice(5, 12).map((label) => {
                          const isSelected = displayDuration === label;
                          return isSelected ? (
                            <ChipSelected
                              key={label}
                              label={label}
                              onClick={() =>
                                handleDuration(
                                  label,
                                  timeMsValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          ) : (
                            <Chip
                              key={label}
                              label={label}
                              onClick={() =>
                                handleDuration(
                                  label,
                                  timeMsValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          );
                        })}
                        <Chip label="Custom" onClick={() => setEditDuration(true)} />
                      </Inline>
                      {duration > 0 && (
                        <Button size="small" variant="ghost" onClick={handleRemoveDuration}>
                          Clear
                        </Button>
                      )}
                    </Inline>
                  ) : (
                    <Inline css={{ gap: 8 }}>
                      <StyledInputWithBorder
                        placeholder="e.g. 45 days"
                        value={editDurationValue}
                        onChange={({ target: { value } }) => setEditDurationValue(value)}
                      />
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          const time = convertTime(editDurationValue)
                          if (time > 0) {
                            handleDuration(cleanCustomInputForDisplay(editDurationValue), time)
                          }
                          setEditDuration(false)
                        }}
                      >
                        Set
                      </Button>
                      <Button size="small" variant="ghost" onClick={() => setEditDuration(false)}>
                        Cancel
                      </Button>
                    </Inline>
                  )}
                </Inline>
              </Column>
            </div>
          </Column>
        </CardContent >
      </Card >
    </Column >
  )
}

const StyledInputWithBorder = styled('input', {
  fontSize: '14px',
  color: '$textColors$primary',
  borderRadius: '$2',
  border: '1px solid $borderColors$inactive',
  padding: '12px 16px',
  margin: 0,
  width: '100%',
  maxWidth: '220px',
  transition: 'border-color 0.2s ease',
  '&::placeholder': {
    color: '$textColors$tertiary'
  },
  '&:focus': {
    outline: 'none',
    borderColor: '$borderColors$active'
  }
})
