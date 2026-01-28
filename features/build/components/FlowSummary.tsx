import {
    Text,
    Column,
    Inline,
    Card,
    CardContent,
    Tooltip,
} from 'components/ui-blocks'
import React from 'react'
// We don't directly use these types, but they're needed for the FlowInput type
// which includes conditions and configuration
import { FlowInput } from '../../../types/trstTypes'
import { GrantResponse } from '../../../services/build'
import { formatTimeDisplay } from '../../../util/conversion'

interface FlowSummaryProps {
    flowInput: FlowInput
    displaySymbol?: string
    expectedFee?: string
    useMsgExec?: boolean
    chainId?: string
    grantee?: string
    authzGrants?: GrantResponse[]
    isAuthzGrantsLoading?: boolean
    refetchAuthzGrants?: () => void
    chainName?: string
}

export const FlowSummary: React.FC<FlowSummaryProps> = ({
    flowInput,
    displaySymbol = 'INTO',
    expectedFee = '0',
}) => {
    // Calculate scheduling info (all values are in milliseconds)
    const interval = flowInput.interval || 0
    const duration = flowInput.duration || 0
    const startTime = flowInput.startTime || 0
    let recurrences = interval > 0 ? Math.floor(duration / interval) : 1
    if (startTime > 0) {
        recurrences++
    }


    // For start time, show relative time from now
    const displayStartTime = startTime > 0
        ? formatTimeDisplay(startTime)
        : startTime === 0 ? 'On First Run' : "Invalid"

    const displayInterval = interval > 0 ? formatTimeDisplay(interval) : 'None'
    const displayDuration = duration > 0 ? formatTimeDisplay(duration) : 'None'

    return (
        <Card
            css={{ margin: '$3', borderRadius: '12px' }}
            variant="secondary" disabled
        >
            <CardContent size="large" css={{ padding: '$3' }}>
                <Column css={{ gap: '$6' }}>
                    {/* Scheduling Summary */}
                    <Column css={{ gap: '$2', padding: '$4', background: '$colors$dark5', borderRadius: '8px', fontSize: '12px' }}>

                        <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                            <Text variant="body">Start</Text>
                            <Text variant="body" color="tertiary">{displayStartTime}</Text>
                        </Inline>

                        {interval > 0 && <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                            <Text variant="body">Duration</Text>
                            <Text variant="body" color="tertiary">{displayDuration}</Text>
                        </Inline>}
                        <Tooltip label="The number of times the flow will run. This is calculated based on the start time, interval, and duration. If no interval and start time is set, the flow will run only once.">
                            <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                                <Text variant="body">Runs</Text>
                                <Text variant="body" color="tertiary">{recurrences} time{recurrences > 1 && "s"}</Text>
                            </Inline>
                        </Tooltip>
                        {interval > 0 && (
                            <>
                                <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                                    <Text variant="body">Interval</Text>
                                    <Text variant="body" color="tertiary">{displayInterval}</Text>
                                </Inline>

                            </>
                        )}
                        <Tooltip label="The estimated fee for the flow. This is an estimate including the Trustless Agent fees that cover execution fees on the host chain, assuming every message will get executed.">
                            <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                                <Text variant="body">Fee</Text>
                                <Text variant="body" color="tertiary">~ {expectedFee} {displaySymbol}</Text>
                            </Inline>
                        </Tooltip>

                        {/* {useMsgExec != false && (
                            <Tooltip label="Wrap the flow for the execution so the Trustless Agent can securely execute your message">
                                <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                                    <Text variant="body">Wrap for Trustless Agent</Text>
                                    <Text variant="body" color="tertiary">{useMsgExec ? 'Yes' : 'No'}</Text>
                                </Inline>
                            </Tooltip>
                        )} */}

                        {flowInput.label && (
                            <Inline justifyContent="space-between" css={{ paddingLeft: '$4' }}>
                                <Text variant="body">Label </Text>
                                <Text variant="body" color="tertiary">{flowInput.label}</Text>
                            </Inline>
                        )}
                    </Column>
                </Column>
            </CardContent>
        </Card>
    );
};
