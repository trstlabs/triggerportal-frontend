import { useState } from 'react';
import { Link } from '@interchain-ui/react';
import { Tooltip } from 'components/ui-blocks';


type PacketStatusProps = {
    rpc: string;
    packetSequence: string | bigint;
    trustlessAgentAddress: string;
    packetTime?: Date;
};


export const PacketStatus = ({
    rpc,
    packetSequence,
    trustlessAgentAddress,
    packetTime,
}: PacketStatusProps) => {
    const [isReceived, setIsReceived] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const packetSequenceStr = typeof packetSequence === 'bigint' ? packetSequence.toString() : packetSequence;

    const extractIbcError = (events: any[]): string | null => {
        for (const event of events) {
            if (event.type === 'ibccallbackerror-ics27_packet') {
                const errorAttr = event.attributes.find((attr: any) => attr.key === 'ibccallbackerror-error');
                if (errorAttr) {
                    // Extract just the error message part after the last colon
                    const errorParts = errorAttr.value.split(':');
                    return errorParts[errorParts.length - 1].trim();
                }
            }
        }
        return null;
    };

    const checkPacketStatus = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${rpc}/tx_search?query="recv_packet.packet_sequence=${packetSequenceStr} AND recv_packet.packet_src_port='icacontroller-${trustlessAgentAddress}'"`
            );
            const data = await response.json();

            if (data?.result?.total_count === "0") {
                // If packet was sent more than an hour ago and not received
                if (packetTime && (Date.now() - packetTime.getTime()) > 3600000) {
                    setIsReceived(false);
                } else {
                    // Still within the expected time window
                    setIsReceived(null);
                }
            } else {
                // Check for IBC callback errors in the transaction events
                const tx = data?.result?.txs?.[0];
                if (tx) {
                    const ibcError = extractIbcError(tx.tx_result.events);
                    if (ibcError) {
                        setError(ibcError);
                    } else {
                        // No error found, mark as received
                        setIsReceived(true);
                    }
                } else {
                    // No transaction details found, assume received
                    setIsReceived(true);
                }
            }
            setHasChecked(true);
        } catch (error) {
            console.error('Error checking packet status:', error);
            setIsReceived(null);
            setError('Failed to check packet status');
        } finally {
            setIsLoading(false);
        }
    };

    // Determine status text and styling
    let statusText = 'Check Status';
    let statusClass = 'text-blue-500 hover:underline cursor-pointer';
    let tooltipText = 'Click to check packet status';

    if (hasChecked) {
        if (error) {
            statusText = '⚠️ Error ' + error;
            statusClass = 'text-red-600 font-medium';
            tooltipText = `Error: ${error}`;
        } else if (isReceived === true) {
            statusText = '✓ Received';
            statusClass = 'text-green-500';
            tooltipText = 'Packet has been successfully received';
        } else if (isReceived === false) {
            statusText = '✗ Not received';
            statusClass = 'text-red-500 line-through';
            tooltipText = 'Packet not received after 1 hour';
        } else {
            statusText = '⏳ Pending';
            statusClass = 'text-yellow-500';
            tooltipText = 'Packet is still within expected time window';
        }
    }

    return (


        <>
            <Tooltip label={tooltipText}>
                <Link
                    href={`${rpc}/tx_search?query="recv_packet.packet_sequence=${packetSequenceStr} AND recv_packet.packet_src_port='icacontroller-${trustlessAgentAddress}'"`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono hover:underline mr-2"
                >
                    📦 {packetSequenceStr}
                </Link>
            </Tooltip>
            {" "}
            <button
                onClick={checkPacketStatus}
                disabled={isLoading}
                className={`text-sm font-medium ${statusClass} ${!hasChecked ? 'hover:underline' : ''} flex items-center`}
            >
                {isLoading ? 'Checking...' : statusText}
            </button>
        </>

    );
};