import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Column,
  Inline,
  Text,
  Spinner,
  Card,
  Divider,
} from 'components/ui-blocks'

import React from 'react'

import { GlobalDecoderRegistry } from 'intentojs'
import { convertBigIntToString, convertMicroDenomToDenom, resolveDenomSync } from 'util/conversion'
import { useFlowHistory } from '../../../hooks/useFlow'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { getRelativeTime } from '../../../util/time'

import { __TEST_MODE__ } from '../../../util/constants'
import { FlowHistoryEntry } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { Link } from '@interchain-ui/react'
import { IBCAssetInfo } from '../../../hooks/useChainList'

import { TwapRecord } from '../../../util/conversion/twapRecord'
import { PacketStatus } from './PacketStatus'

type FlowHistoryProps = {
  id: string
  transformedMsgs?: string[]
  rpc?: string
  trustlessAgentAddress?: string
  showCreateGrants?: (show: boolean) => void
  ibcAssetList: IBCAssetInfo[]
}

export const FlowHistory = ({
  id,
  transformedMsgs,
  rpc,
  trustlessAgentAddress,
  showCreateGrants,
  ibcAssetList
}: FlowHistoryProps) => {



  const [flowHistory, setFlowHistory] = useState<FlowHistoryEntry[]>([]);
  const [historyLimit] = useState(5);
  const [fetchNext, setFetchNext] = useState(false);
  const [paginationKey, setPaginationKey] = useState(undefined);
  const [fetchedHistory, isHistoryLoading] = useFlowHistory(id.toString(), historyLimit, paginationKey);
  const refetchQueries = useRefetchQueries([`flowHistory/${id.toString()}/${paginationKey}`], 15);

  // Track which query response index is expanded
  const [openQueryIdx, setOpenQueryIdx] = useState<number | null>(null)

  // Clear flowHistory when id changes
  useEffect(() => {
    if (paginationKey == undefined) {
      setFlowHistory([]);
    }
  }, [fetchedHistory]);


  const uniqueFetchedHistory = useMemo(() => {
    if (fetchedHistory && fetchedHistory.history && fetchedHistory.history.length > 0) {
      const existingIds = new Set(flowHistory.map(entry => entry.scheduledExecTime));

      const uniqueEntries = fetchedHistory.history.filter(entry => !existingIds.has(entry.scheduledExecTime));

      return uniqueEntries;
    }
    return [];
  }, [fetchedHistory, flowHistory]);

  useEffect(() => {
    if (uniqueFetchedHistory.length > 0) {
      console.log('Unique Fetched History:', uniqueFetchedHistory);
      setFlowHistory(prevHistory => {
        const combinedHistory = [...prevHistory, ...uniqueFetchedHistory];
        const uniqueCombinedHistory = combinedHistory.reduce((acc, current) => {
          const x = acc.find(item => item.scheduledExecTime === current.scheduledExecTime); // Ensure this 'id' is unique and reliable
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        return uniqueCombinedHistory;
      });
    }
  }, [uniqueFetchedHistory]);

  //  fetching next page
  const fetchNextPage = () => {
    setFetchNext(prev => !prev)
    const nextKey = fetchedHistory.pagination?.nextKey;
    setPaginationKey(nextKey);
    refetchQueries()
    setFetchNext(prev => !prev)

  };

  return (

    <>


      <Row>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          <Inline>

            <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
              Execution History
            </Text>
          </Inline>
          {flowHistory
            ?.slice(0).filter((entry, index, self) => self.findIndex(e => e.scheduledExecTime === entry.scheduledExecTime) === index)
            .map(
              (
                {
                  execFee,
                  actualExecTime,
                  scheduledExecTime,
                  msgResponses,
                  executed,
                  errors,
                  timedOut,
                  queryResponses,
                  packetSequences
                },
                index
              ) => (

                <div key={index}>
                  <Column
                    gap={4}
                    align="flex-start"
                    justifyContent="flex-start"
                  >
                    <Column>
                      <Text variant="body">
                        At {getRelativeTime(actualExecTime.getTime())}{' '}
                      </Text>
                    </Column>
                    {actualExecTime.getTime() -
                      scheduledExecTime.getTime() >=
                      120000 && (
                        <Column>
                          <Text variant="caption" style={{ fontStyle: 'italic' }}>
                            Planned for {scheduledExecTime.toLocaleString()}. Execution was delayed (possibly due to a halt in block production or IBC relayer downtime).
                          </Text>
                        </Column>
                      )}
                    {execFee && execFee.length > 0 && execFee.map((fee) => (
                      <Column>
                        <Text variant="caption">
                          Fee:
                          {' '} {convertMicroDenomToDenom(fee.amount, 6)} {resolveDenomSync(fee.denom, ibcAssetList)}
                        </Text>
                      </Column>
                    ))}




                    <Text variant="caption">
                      Executed: {executed ? <>🟢</> :
                        (Date.now() - actualExecTime.valueOf() >
                          60000 && !timedOut ? (
                            <>🔴</>
                          ) || errors[0] : (timedOut ?
                            <>⏱️</> : <>⌛</>
                        ))}
                    </Text>
                    {errors.map((err, i) => {
                      // Check for AuthZ permission errors
                      const isAuthZError = err.includes('error handling packet on host chain') &&
                        (err.includes('ABCI code: 2:'));
                      const isWasmError = err.includes('error handling packet on host chain') && transformedMsgs?.find((msg) => msg.includes('.wasm.')) &&
                        (err.includes('ABCI code: 5:'));

                      return (
                        <Column key={i}>
                          <Text variant="legend" style={{ paddingTop: '4px' }}>
                            {isAuthZError ? 'AuthZ authorization lacking' : isWasmError ? 'CosmWasm contract did not execute with a succesful result' : err}
                          </Text>
                          {isAuthZError && index === 0 && (
                            <Inline css={{ marginTop: '$2' }}>
                              <Button size="small" variant="secondary" onClick={() => showCreateGrants?.(true)}>
                                Authorization
                              </Button>
                            </Inline>
                          )}
                        </Column>
                      );
                    })}
                    {timedOut && (
                      <Text variant="legend">
                        Timed out relaying IBC packets for this execution
                      </Text>
                    )}

                    {packetSequences != undefined && packetSequences.length > 0 && <Text variant="caption"> Packet{packetSequences.length > 1 ? 's' : ''} Received: {packetSequences != undefined && packetSequences.length > 0 && packetSequences.map((packetSequence, i) => (
                      <>

                        {i < packetSequences.length - 1 ? ', ' : ' '} <PacketStatus
                          rpc={rpc}
                          packetSequence={packetSequence}
                          trustlessAgentAddress={trustlessAgentAddress}
                          packetTime={actualExecTime}
                        /> </>
                    ))}</Text>}
                    {packetSequences != undefined && packetSequences.length > 0 && <Text variant="caption"> Packet{packetSequences.length > 1 ? 's' : ''} Acknowledgement{packetSequences.length > 1 ? 's' : ''}: {packetSequences != undefined && packetSequences.length > 0 && packetSequences.map((packetSequence, i) => (
                      <Link key={i} href={process.env.NEXT_PUBLIC_INTO_RPC + `/tx_search?query="acknowledge_packet.packet_sequence=${packetSequence}"`} target="_blank">
                        🆗 {Number(packetSequence)}
                        {i < packetSequences.length - 1 ? ', ' : ''}
                      </Link>

                    ))}</Text>}


                    {queryResponses.map((queryResponse, i) => (
                      <Column key={i}>
                        <Inline css={{ alignItems: 'center', gap: '$2' }}>
                          <Text
                            variant="caption"
                            css={{ overflowWrap: 'anywhere', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                          >
                            Query Response:  {(() => {
                              if (queryResponse.length > 120) {
                                const buffer = Buffer.from(queryResponse, 'base64')


                                const responseBytes = new Uint8Array(buffer)


                                const twapRecord = TwapRecord.decode(responseBytes)
                                return JSON.stringify(convertBigIntToString(twapRecord), null, 2)
                              } else {
                                const str = Buffer.from(queryResponse, 'base64').toString('binary');
                                return str && str.length > 60 ? str.slice(0, 60) + '...' : str;
                              }
                            })()}
                          </Text>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => setOpenQueryIdx(openQueryIdx === i ? null : i)}
                          >
                            {openQueryIdx === i ? 'Hide Encoded' : 'Show Encoded'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(queryResponse, null, 2))}
                          >
                            Copy
                          </Button>
                        </Inline>
                        {openQueryIdx === i && (
                          <Card css={{ padding: '$4', marginTop: '$2', maxHeight: '320px', overflow: 'auto' }}>
                            <Text variant="caption"> <pre style={{ margin: 0, fontSize: '8px', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {JSON.stringify(queryResponse, null, 2)}
                            </pre></Text>
                          </Card>
                        )}
                      </Column>
                    ))}


                    {msgResponses.map((msg: any, i) => (
                      <div key={i}>
                        <Card css={{ padding: '$6', marginTop: '$4' }} variant="secondary" disabled>
                          <Column gap={8} align="flex-start" justifyContent="flex-start">
                            <Text variant="legend" color="secondary" align="left">
                              Message Response
                            </Text>
                            <Text variant="caption" >{msg.typeUrl} ✓ </Text>

                            {msg.value.length != 0 && (
                              <>
                                <Text variant="legend" color="secondary" align="left">
                                  Message Response Value
                                </Text>
                                <Text variant="caption">
                                  {JSON.stringify(GlobalDecoderRegistry.unwrapAny(msg), (_key, value) =>
                                    typeof value === 'bigint'
                                      ? value.toString()
                                      : value // return everything else unchanged
                                    , 2)}
                                </Text>
                              </>
                            )}
                          </Column>
                        </Card>

                      </div>))}
                  </Column>

                  {index !== flowHistory.length - 1 && (
                    <Divider css={{ marginTop: '20px', marginBottom: '10px' }} />
                  )}
                </div>
              )
            )}
          {
            !flowHistory.length && (
              <Text variant="caption" align="center">No history found (yet). Executions will show up here.</Text>
            )
          }
          {fetchedHistory && fetchedHistory.pagination && fetchedHistory.pagination.nextKey.length > 1 && (<Button onClick={fetchNextPage} variant="ghost" size="large"> {fetchNext || isHistoryLoading ? <Spinner instant /> : <>View more</>}</Button>)}
        </Column>
      </Row>

    </>

  )
}

function Row({ children }) {
  const baseCss = { padding: '$10 $10' }
  return (
    <Inline
      css={{
        ...baseCss,
        margin: '$4',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '$light',
        borderRadius: '18px',
        border: '1px solid $borderColors$default',
        backgroundColor: '$base',
      }}
    >
      {children}
    </Inline>
  )
}

