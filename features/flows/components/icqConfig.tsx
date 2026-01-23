import { useMemo } from 'react'
import {
    Text,
    Tooltip,
} from 'components/ui-blocks'
import React from 'react'

import { ICQConfig } from 'intentojs/dist/codegen/intento/intent/v1/flow'



import { getDuration } from '../../../util/time'

import { TimeoutPolicy } from 'intentojs/dist/codegen/stride/interchainquery/v1/genesis'
import { convertBigIntToString } from '../../../util/conversion'

import { TwapRecord } from '../../../util/conversion/twapRecord'


export function ICQConfigView({ icqConfig }: { icqConfig: ICQConfig }) {
    const response = useMemo(() => {
        if (icqConfig.queryType.includes("twap") && icqConfig.response.length > 0) {
            const twapRecord = TwapRecord.decode(icqConfig.response)
            return JSON.stringify(convertBigIntToString(twapRecord), null, 2)
        }
        return Buffer.from(icqConfig.response).toString('utf-8')
    }, [icqConfig])

    return <>
        <Tooltip
            label={"Perform an interchain query for conditions"}
        >
            <Text variant="body" style={{ fontSize: '14px', marginTop: '16px', fontWeight: '600' }} align="left">
                Interchain Query
            </Text>
        </Tooltip>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Chain ID</Text>    {icqConfig.chainId}
        </Text>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Connection ID</Text>      {icqConfig.connectionId}
        </Text>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Query Type</Text>  {icqConfig.queryType}
        </Text>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Query Key</Text>  {icqConfig.queryKey}
        </Text>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Timeout</Text>  {getDuration(Number(icqConfig.timeoutDuration.seconds))}
        </Text>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Timeout Policy</Text>  {TimeoutPolicy[icqConfig.timeoutPolicy]}
        </Text>
        <Text variant="body">
            <Text style={{ marginTop: '16px' }} variant="legend" color="secondary" align="left">Latest Response</Text>  {response}
        </Text>
    </>
}
