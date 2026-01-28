import React, { useState, useEffect, useMemo } from 'react'
import { styled, Text, Column, Inline, Button, Tooltip } from 'components/ui-blocks'
import { parseAbi, encodeFunctionData, AbiFunction, keccak256, encodeAbiParameters } from 'viem'
import { Call, Ucs03, Ucs05, Utils, ZkgmInstruction, TokenOrder } from '@unionlabs/sdk'
import { Effect, Schema, Match, pipe, ParseResult, Cause, Array as A } from 'effect'
import { useChain } from '@interchain-kit/react'
import { useChainInfoByChainID } from '../../../../hooks/useChainList'
import { useAtomValue } from 'jotai'
import { walletState } from '../../../../state/atoms/walletAtoms'
import { ChannelId } from '@unionlabs/sdk/schema/channel'


const StyledContainer = styled('div', {
    padding: '$4',
    backgroundColor: '$colors$dark5',
    borderRadius: '$4',
    border: '1px solid $colors$dark10',
})

const StyledTextArea = styled('textarea', {
    width: '100%',
    minHeight: '100px',
    backgroundColor: '$colors$dark10',
    color: 'inherit',
    padding: '$2',
    borderRadius: '$2',
    border: '1px solid $colors$dark20',
    fontFamily: 'monospace',
    fontSize: '12px',
})

const StyledInput = styled('input', {
    width: '100%',
    backgroundColor: '$colors$dark10',
    color: 'inherit',
    padding: '$2',
    borderRadius: '$2',
    border: '1px solid $colors$dark20',
    fontSize: '14px',
})

const ZKGM_CONTRACT = "into1sq2ze6rq64jg8fkcedpxukfzw0apkxk8t7x7uhava8w9xfz69uyqcypvhk"
const PROXY_ADDRESS = "0xb47133de8336f2264c1dA84094F413aCd29332a6" // Hardcoded for now


const encodeInstruction: (
    u: ZkgmInstruction.ZkgmInstruction,
) => Effect.Effect<
    Ucs03.Ucs03,
    ParseResult.ParseError | Cause.TimeoutException
> = pipe(
    Match.type<ZkgmInstruction.ZkgmInstruction>(),
    Match.tagsExhaustive({
        Batch: (batch) =>
            pipe(
                batch.instructions,
                A.map(encodeInstruction),
                Effect.allWith({ concurrency: "unbounded" }),
                Effect.map((operand) =>
                    new Ucs03.Batch({
                        opcode: batch.opcode,
                        version: batch.version,
                        operand,
                    })
                ),
            ),
        TokenOrder: TokenOrder.encodeV2,
        Call: Call.encode,
    }),
)

export const predictProxy = Effect.fn(
    function* (options: { path: bigint; channel: ChannelId; sender: Ucs05.AnyDisplay }) {
        const sender = yield* Ucs05.anyDisplayToZkgm(options.sender)
        const abi = [
            {
                name: "path",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "channelId",
                type: "uint32",
                internalType: "uint32",
            },
            {
                name: "sender",
                type: "bytes",
                internalType: "bytes",
            },
        ] as const

        const salt = yield* pipe(
            Effect.try(() =>
                encodeAbiParameters(
                    abi,
                    [
                        options.path,
                        options.channel,
                        sender,
                    ] as const,
                )
            ),
            Effect.map((encoded) => keccak256(encoded, "bytes")),
        )
        return salt
    }
)


export const UnionCallEditor = ({ destinationChainId, onChange, onDiscard }: { destinationChainId: string, onChange: (msg: string) => void, onDiscard: () => void }) => {
    console.log("destinationChainId", destinationChainId)
    const destChainInfo = useChainInfoByChainID(destinationChainId) as any
    const { address, evmAddress } = useAtomValue(walletState)
    const [contractAddress, setContractAddress] = useState('')
    const [abiString, setAbiString] = useState('function transferFrom(address from, address to, uint256 amount) returns (bool)')
    const [selectedFunctionName, setSelectedFunctionName] = useState('')
    const [args, setArgs] = useState<string[]>([])
    const [encodingError, setEncodingError] = useState<string | null>(null)
    const { connect } = useChain('intento')


    const functions = useMemo(() => {
        try {
            const parsed = parseAbi([abiString]) as any[]
            return parsed.filter((item): item is AbiFunction => item.type === 'function')
        } catch (e) {
            return []
        }
    }, [abiString])

    useEffect(() => {
        if (functions.length > 0 && !selectedFunctionName) {
            setSelectedFunctionName(functions[0].name)
            setArgs(new Array(functions[0].inputs.length).fill(''))
        }
    }, [functions, selectedFunctionName])

    const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const func = functions.find(f => f.name === e.target.value)
        setSelectedFunctionName(e.target.value)
        if (func) {
            setArgs(new Array(func.inputs.length).fill(''))
        }
    }

    const handleArgChange = (index: number, value: string) => {
        const newArgs = [...args]
        newArgs[index] = value
        setArgs(newArgs)
    }

    const generateMessage = async () => {
        setEncodingError(null)
        try {
            const func = functions.find(f => f.name === selectedFunctionName)
            if (!func || !contractAddress) return

            if (!evmAddress) {
                throw new Error(`Please connect your Ethereum wallet first.`)
            }

            // 1. Encode Inner Call Data (User's Logic)
            const processedArgs = args.map((arg, i) => {
                const type = func.inputs[i].type
                if (type.includes('int') && !type.includes('[]')) return BigInt(arg)
                if (type === 'bool') return arg.toLowerCase() === 'true'
                return arg
            })

            const innerCallData = encodeFunctionData({
                abi: [func],
                functionName: selectedFunctionName,
                args: processedArgs,
            })

            // 2. Encode Outer Execute Call (Proxy Logic)
            // function execute(address target, uint256 value, bytes memory payload) public
            const proxyAbi = parseAbi([
                "function execute(address target, uint256 value, bytes memory payload) public",
            ])

            const executeData = encodeFunctionData({
                abi: proxyAbi,
                functionName: "execute",
                args: [
                    contractAddress as `0x${string}`, // Target (User's Contract)
                    0n, // Value (0 Ether)
                    innerCallData, // Payload (User's Call)
                ],
            })

            // 3. Create Union Call Object
            const call = Call.make({
                sender: Ucs05.CosmosDisplay.make({
                    address: address as `into1${string}`,
                }),
                eureka: false,
                contractAddress: Ucs05.EvmDisplay.make({
                    address: PROXY_ADDRESS as `0x${string}`, // Proxy Address
                }),
                contractCalldata: executeData,
            })


            // 4. Encode to Hex (mimicking script logic)
            const program = Effect.gen(function* () {
                const salt = yield* Utils.generateSalt("cosmos")
                const instruction = yield* pipe(
                    encodeInstruction(call), //
                    Effect.flatMap(Schema.encode(Ucs03.Ucs03WithInstructionFromHex)),
                )
                const tenHoursInNs = BigInt(10) * BigInt(60) * BigInt(60) * BigInt(1000) * BigInt(1000000);
                const nowInNs = BigInt(Date.now()) * BigInt(1000000);

                const timeout_timestamp = (nowInNs + tenHoursInNs).toString();
                return {
                    send: {
                        channel_id: ChannelId.make(Number(destChainInfo.channel)),
                        timeout_height: "0",//Date.now().toString(),
                        timeout_timestamp,
                        salt: salt as `0x${string}`,
                        instruction: instruction,
                    }
                }
            })

            const encodedUcs03 = await Effect.runPromise(program)

            const finalMsg = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                    sender: "Your Intento address",
                    contract: ZKGM_CONTRACT,
                    msg: encodedUcs03,
                    funds: []
                }
            }

            onChange(JSON.stringify(finalMsg, null, 2))
        } catch (e: any) {
            setEncodingError(e.message || "Failed to encode message")
            console.error(e)
        }
    }

    const selectedFunction = functions.find(f => f.name === selectedFunctionName)

    return (
        <StyledContainer>
            <Column css={{ gap: '$4' }}>
                <Inline css={{ justifyContent: 'space-between' }}>
                    <Text variant="body" css={{ fontWeight: 'bold' }}>Union Cross-Chain Call</Text>
                    <Button variant="ghost" size="small" onClick={onDiscard}>Discard</Button>
                </Inline>

                <Column css={{ gap: '$2' }}>
                    <Text variant="caption">Destination Chain: {destinationChainId} (via Union)</Text>

                    <Text variant="caption">Sender Address (Metamask)</Text>
                    {!evmAddress ? (
                        <Button variant="secondary" size="small" onClick={async () => await connect()}>
                            {evmAddress ? 'Connected' : 'Connect Ethereum Wallet'}
                        </Button>
                    ) : (
                        <Text variant="caption" color="tertiary">
                            Sender: {evmAddress}
                        </Text>
                    )}

                    <Text variant="caption">Target EVM Contract Address</Text>
                    <StyledInput
                        placeholder="0x..."
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                    />
                </Column>
                <Column css={{ gap: '$2' }}>
                    <Tooltip content="The ABI (Application Binary Interface) defines the interface for interacting with the smart contract. It specifies the functions, their parameters, and the expected return values. This information is crucial for encoding the function calls correctly.  (e.g. function transfer(address to, uint256 amount))">
                        <Text variant="caption">ABI</Text>
                    </Tooltip>
                    <StyledTextArea
                        value={abiString}
                        onChange={(e) => setAbiString(e.target.value)}
                    />
                </Column>

                {functions.length > 0 && (
                    <Column css={{ gap: '$2' }}>
                        <Text variant="caption">Select Function</Text>
                        <select
                            value={selectedFunctionName}
                            onChange={handleFunctionChange}
                            style={{ backgroundColor: '#1a1b1f', color: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #353846' }}
                        >
                            {functions.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                        </select>

                        {selectedFunction?.inputs.map((input, i) => (
                            <Column key={i} css={{ gap: '$1' }}>
                                <Text variant="caption">{input.name || `Arg ${i}`} ({input.type})</Text>
                                <StyledInput
                                    value={args[i] || ''}
                                    onChange={(e) => handleArgChange(i, e.target.value)}
                                    placeholder={input.type}
                                />
                            </Column>
                        ))}
                    </Column>
                )}

                {encodingError && (
                    <Text color="error" variant="caption">{encodingError}</Text>
                )}

                <Button
                    variant="primary"
                    onClick={generateMessage}
                    disabled={!contractAddress || !selectedFunctionName || !evmAddress}
                >
                    Generate Union Call
                </Button>
            </Column>
        </StyledContainer>
    )
}
