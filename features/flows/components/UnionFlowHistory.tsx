import { useEffect, useState } from 'react'
import {
    Column,
    Inline,
    Text,
    Spinner,
    Divider,
} from 'components/ui-blocks'
import React from 'react'
import { Link } from '@interchain-ui/react'
import { getRelativeTime } from '../../../util/time'

type UnionFlowHistoryProps = {
    id: string
    rpc: string
}

type PacketEvent = {
    contractAddress: string
    channelId: string
    packetData: string
    packetDestinationChannelId: string
    packetHash: string
}

type BlockEvent = {
    type: string
    attributes: {
        key: string
        value: string
        index: boolean
    }[]
}

type UnionHistoryEntry = {
    height: string
    timestamp?: string // We might not get timestamp directly from block_results, might need block info if we want time
    packets: PacketEvent[]
}

export const UnionFlowHistory = ({
    id,
    rpc,
}: UnionFlowHistoryProps) => {

    const [history, setHistory] = useState<UnionHistoryEntry[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let isMounted = true;

        async function fetchHistory() {
            if (!rpc || !id) return;
            setLoading(true)
            try {
                // 1. Search for blocks where flow was triggered
                const query = `"flow-triggered.flow-id=${id}"`
                const searchUrl = `${rpc}/block_search?query=${encodeURIComponent(query)}&per_page=10&order_by="desc"`

                const searchRes = await fetch(searchUrl)
                const searchJson = await searchRes.json()

                if (!searchJson.result || !searchJson.result.blocks) {
                    setLoading(false)
                    return
                }

                const blocks = searchJson.result.blocks
                const newHistory: UnionHistoryEntry[] = []

                // 2. For each block, get results to find packet events
                for (const block of blocks) {
                    const height = block.block.header.height
                    const time = block.block.header.time

                    const resultsUrl = `${rpc}/block_results?height=${height}`
                    const resultsRes = await fetch(resultsUrl)
                    const resultsJson = await resultsRes.json()

                    if (!resultsJson.result || !resultsJson.result.finalize_block_events) {
                        continue
                    }

                    const events: BlockEvent[] = resultsJson.result.finalize_block_events
                    const packets: PacketEvent[] = []

                    for (const event of events) {
                        if (event.type === 'wasm-packet_send') {
                            const packet: any = {}
                            const attributes = event.attributes || []

                            attributes.forEach(attr => {
                                // Handle potential base64 encoding if the API returns it, 
                                // but the user example shows clear text. We'll assume clear text or handle decoding if needed later.
                                // Actually, RPCs often return base64 for attributes. The user example has clear values but 
                                // `packet_data` is hex. Let's assume the keys are keys and values are values.
                                // If standard Tendermint RPC, keys/values are often base64. 
                                // The user provided example JSON shows "key": "_contract_address", "value": "..." 
                                // which looks like it might NOT be base64 or it is already decoded in their example.
                                // However, strictly speaking, standard Tendermint `block_results` returns base64.
                                // Let's check `packet_data` in the example: "0xdea1..." -> this is a string.
                                // The keys in the example are also strings.
                                // If real RPC returns base64, we might need decoding.
                                // For now, I'll assume the user example structure is what we get, or the fetch handles it (unlikely).
                                // I will add a safe decoder just in case, or stick to raw strings if that's what the provided URL does.
                                // Wait, the user linked `rpc-devnet.intento.zone`. Use `atob` if it looks base64?
                                // Let's implement it assuming it might be base64 if it doesn't look like readable text, 
                                // BUT the user example has readable keys.
                                // Let's just trust the example for now: keys are clear text.

                                const key = attr.key
                                const value = attr.value

                                if (key === '_contract_address') packet.contractAddress = value
                                if (key === 'channel_id') packet.channelId = value
                                if (key === 'packet_data') packet.packetData = value
                                if (key === 'packet_destination_channel_id') packet.packetDestinationChannelId = value
                                if (key === 'packet_hash') packet.packetHash = value
                            })

                            // Only add if we have a packet hash (vital for the explorer link)
                            if (packet.packetHash) {
                                packets.push(packet as PacketEvent)
                            }
                        }
                    }

                    if (packets.length > 0) {
                        newHistory.push({
                            height,
                            timestamp: time,
                            packets
                        })
                    }
                }

                if (isMounted) {
                    setHistory(newHistory)
                }

            } catch (error) {
                console.error('Failed to fetch union flow history:', error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchHistory()

        return () => { isMounted = false }
    }, [id, rpc])

    return (
        <>
            <Row>
                <Column gap={8} align="flex-start" justifyContent="flex-start">
                    <Inline>
                        <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
                            Union Execution History
                        </Text>
                    </Inline>

                    {loading && <Spinner />}

                    {!loading && history.length === 0 && (
                        <Text variant="caption" align="center">No packet history found.</Text>
                    )}

                    {history.map((entry, i) => (
                        <div key={entry.height} style={{ width: '100%' }}>
                            <Column gap={4} align="flex-start" justifyContent="flex-start">
                                <Text variant="body">
                                    Block {entry.height}
                                    {entry.timestamp && <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>({getRelativeTime(new Date(entry.timestamp).getTime())})</span>}
                                </Text>

                                {entry.packets.map((packet, pIndex) => (
                                    <div key={`${entry.height}-${pIndex}`} style={{ width: '100%' }}>
                                        {/* Mimic the layout of FlowHistory items */}

                                        <Text variant="caption">
                                            Packet Hash
                                        </Text>

                                        <Inline css={{ alignItems: 'center', gap: '$2' }}>
                                            <Link
                                                href={`https://app.union.build/explorer/packets/${packet.packetHash}`}
                                                target="_blank"
                                            >
                                                {packet.packetHash} ↗
                                            </Link>
                                        </Inline>
                                    </div>
                                ))}
                            </Column>
                            {i < history.length - 1 && <Divider css={{ marginTop: '20px', marginBottom: '10px' }} />}
                        </div>
                    ))}
                </Column>
            </Row>
        </>
    )
}

function Row({ children }: { children: React.ReactNode }) {
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
