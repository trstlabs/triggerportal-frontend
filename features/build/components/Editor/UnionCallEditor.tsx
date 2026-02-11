import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { styled, Text, Column, Inline, Button, Tooltip, Card } from 'components/ui-blocks'
import { parseAbi, encodeFunctionData, AbiFunction, keccak256, encodeAbiParameters } from 'viem'
import { Call, Ucs03, Ucs05, Utils, ZkgmInstruction, TokenOrder } from '@unionlabs/sdk'
import { Effect, Schema, Match, pipe, ParseResult, Cause, Array as A } from 'effect'
import { useChain } from '@interchain-kit/react'
import { useChainInfoByChainID } from '../../../../hooks/useChainList'
import { useAtomValue } from 'jotai'
import { walletState } from '../../../../state/atoms/walletAtoms'
import { ChannelId } from '@unionlabs/sdk/schema/channel'
import { Edit, Info } from 'lucide-react'
import { predictProxyAccount } from './predictUnionProxy'

const StyledTextArea = styled('textarea', {
    width: '100%',
    minHeight: '100px',
    backgroundColor: '$colors$dark10',
    color: '$colors$dark50',
    padding: '$2',
    borderRadius: '$2',
    border: '1px solid $colors$dark20',
    fontFamily: 'monospace',
    fontSize: '12px',
})

const StyledInput = styled('input', {
    width: '100%',
    backgroundColor: '$colors$dark10',
    color: '$colors$dark50',
    padding: '$2',
    borderRadius: '$2',
    border: '1px solid $colors$dark20',
    fontSize: '12px',
})

const ZKGM_CONTRACT = "into1sq2ze6rq64jg8fkcedpxukfzw0apkxk8t7x7uhava8w9xfz69uyqcypvhk"


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


const AddressDisplay = ({ label, address, tooltip }: { label: string, address: string, tooltip: string }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Column css={{ gap: '$1' }}>
            <Inline css={{ gap: '$2', alignItems: 'center' }}>
                <Text variant="caption">{label}</Text>
                <Tooltip label={tooltip}>
                    <Info size={14} style={{ color: '#888', cursor: 'help' }} />
                </Tooltip>
            </Inline>
            <Text
                variant="caption"
                color="tertiary"
                css={{
                    cursor: 'pointer',
                    '&:hover': { color: '$textColors$primary' },
                    transition: 'color 0.2s',
                    wordBreak: 'break-all'
                }}
                onClick={handleCopy}
            >
                {address} {copied && <span style={{ color: '#4CAF50', marginLeft: '8px' }}>(Copied!)</span>}
            </Text>
        </Column>
    )
}

export const UnionCallEditor = ({ destinationChainId, onChange, onDiscard }: { destinationChainId: string, onChange: (msg: string) => void, onDiscard: () => void }) => {
    console.log("destinationChainId", destinationChainId)
    const destChainInfo = useChainInfoByChainID(destinationChainId) as any
    const { address, evmAddress } = useAtomValue(walletState)
    const [contractAddress, setContractAddress] = useState('')
    const [abiString, setAbiString] = useState('function transferFrom(address from, address to, uint256 amount) returns (bool)')
    const [selectedFunctionName, setSelectedFunctionName] = useState('')
    const [argsState, setArgsState] = useState<string[]>([])
    const [encodingError, setEncodingError] = useState<string | null>(null)
    const { connect } = useChain('intento')
    const [isLocked, setIsLocked] = useState(false)
    const router = useRouter()
    const autoGenRef = useRef(false)

    useEffect(() => {
        if (!router.isReady) return
        const { target, abi: urlAbi, method, args: urlArgs } = router.query

        if (target && typeof target === 'string' && !contractAddress) {
            setContractAddress(target)
        }
        if (urlAbi && typeof urlAbi === 'string' && urlAbi !== abiString) {
            setAbiString(urlAbi)
        }
        // Method and Args handling
        if (method && typeof method === 'string' && !selectedFunctionName) {
            setSelectedFunctionName(method)
        }
        if (urlArgs && typeof urlArgs === 'string' && urlArgs.length > 0) {
            try {
                const parsedArgs = JSON.parse(urlArgs)
                if (Array.isArray(parsedArgs)) {
                    // Start checking if we have populated args (state) yet
                    if (argsState.length === 0 || (argsState.length > 0 && argsState[0] === ''))
                        setArgsState(parsedArgs)
                }
            } catch (e) {
                console.error("Failed to parse args from URL", e)
            }
        }
    }, [router.isReady, router.query, contractAddress, abiString, selectedFunctionName, argsState])



    const functions = useMemo(() => {
        try {
            const parsed = parseAbi([abiString]) as any[]
            return parsed.filter((item): item is AbiFunction => item.type === 'function')
        } catch (e) {
            return []
        }
    }, [abiString])

    const DEPLOYER_ADDRESS = "0x5fbe74a283f7954f10aa04c2edf55578811aeb03"

    const predictedProxy = useMemo(() => {
        if (!address || !destChainInfo?.channel_to_intento || !DEPLOYER_ADDRESS) return null;
        try {
            return predictProxyAccount(
                0n, // path
                Number(destChainInfo.channel_to_intento), // channelId
                address, // sender (bech32)
                DEPLOYER_ADDRESS // deployer
            )
        } catch (e) {
            console.error("Failed to predict proxy account", e)
            return null
        }
    }, [address, destChainInfo?.channel])

    useEffect(() => {
        if (functions.length > 0 && !selectedFunctionName) {
            setSelectedFunctionName(functions[0].name)
            setArgsState(new Array(functions[0].inputs.length).fill(''))
        }
    }, [functions, selectedFunctionName])

    const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const func = functions.find(f => f.name === e.target.value)
        setSelectedFunctionName(e.target.value)
        if (func) {
            setArgsState(new Array(func.inputs.length).fill(''))
        }
    }

    const handleArgChange = (index: number, value: string) => {
        const newArgs = [...argsState]
        newArgs[index] = value
        setArgsState(newArgs)
    }

    const generateMessage = async () => {
        setEncodingError(null)
        try {
            const func = functions.find(f => f.name === selectedFunctionName)
            if (!func || !contractAddress) return

            if (!evmAddress) {
                throw new Error(`Please connect your Ethereum wallet first.`)
            }

            if (!predictedProxy?.address) {
                throw new Error(`Could not predict proxy address.`)
            }

            // 1. Encode Inner Call Data (User's Logic)
            const processedArgs = argsState.map((arg, i) => {
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
            console.log(innerCallData)
            const executeData = ("0x" + encodeFunctionData({
                abi: proxyAbi,
                functionName: "execute",
                args: [
                    contractAddress as `0x${string}`, // Target (User's Contract)
                    0n, // Value (0 Ether)
                    innerCallData, // Payload (User's Call)
                ],
            }).slice(10)) as `0x${string}`
            console.log(executeData)

            // 3. Create Union Call Object
            const call = Call.make({
                sender: Ucs05.CosmosDisplay.make({
                    address: address as `into1${string}`,
                }),
                eureka: false,
                contractAddress: Ucs05.EvmDisplay.make({
                    address: predictedProxy.address as `0x${string}`, // Proxy Address
                }),
                contractCalldata: executeData,
            })
            console.log("call", call)

            // 4. Encode to Hex (mimicking script logic)
            const program = Effect.gen(function* () {
                const salt = yield* Utils.generateSalt("cosmos")
                const instruction = yield* pipe(
                    encodeInstruction(call), //
                    Effect.flatMap(Schema.encode(Ucs03.Ucs03WithInstructionFromHex)),
                )
                console.log("instruction", instruction)
                const tenHoursInNs = BigInt(10) * BigInt(60) * BigInt(60) * BigInt(1000) * BigInt(1000000);
                const nowInNs = BigInt(Date.now()) * BigInt(1000000);

                const timeout_timestamp = (nowInNs + tenHoursInNs).toString();
                return {
                    send: {
                        channel_id: ChannelId.make(Number(destChainInfo.channel)),
                        timeout_height: "0",//Date.now().toString(),
                        timeout_timestamp,
                        salt: salt as `0x${string}`,
                        instruction,
                    }
                }
            })
            console.log("program", program)
            const encodedUcs03 = await Effect.runPromise(program)
            console.log("encodedUcs03", encodedUcs03)

            const finalMsg = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                    sender: "Your Intento address",
                    contract: ZKGM_CONTRACT,
                    msg: encodedUcs03,
                    funds: []
                }
            }
            console.log("finalMsg", finalMsg)

            onChange(JSON.stringify(finalMsg, null, 2))
            setIsLocked(true)
        } catch (e: any) {
            setEncodingError(e.message || "Failed to encode message")
            console.error(e)
        }
    }

    // Auto-generate effect
    useEffect(() => {
        if (!router.isReady) return
        const { auto } = router.query

        // Check if auto is requested, not locked, not already attempted
        if (auto === 'true' && !isLocked && !autoGenRef.current) {
            // Check if all necessary data is present
            const func = functions.find(f => f.name === selectedFunctionName)
            const isConnected = !!evmAddress
            const isProxyReady = !!predictedProxy?.address
            const isContractReady = !!contractAddress

            if (func && isConnected && isProxyReady && isContractReady) {
                // Trigger generation
                // We need to wait a tick? No, state should be consistent.
                // However, generateMessage is dependent on state values from scope.
                // Since generateMessage closes over state from render, and this effect runs when dependencies change...
                // We should ensure generateMessage uses latest state? 
                // generateMessage uses state variables directly.
                // So we simply call it.
                generateMessage()
                autoGenRef.current = true
            }
        }
    }, [router.isReady, router.query, functions, selectedFunctionName, evmAddress, predictedProxy, contractAddress, isLocked])


    const selectedFunction = functions.find(f => f.name === selectedFunctionName)

    return (

        <Card
            css={{ margin: '$4', padding: '$8', width: '100%' }}
            variant="secondary"
            disabled
        >
            <Column css={{ gap: '$4' }}>
                <Inline css={{ justifyContent: 'space-between' }}>
                    <Text variant="body" css={{ fontWeight: 'bold' }}>Union Cross-Chain Call</Text>
                    <Button variant="ghost" size="small" onClick={onDiscard}>Discard</Button>
                </Inline>


                <div style={{ position: 'relative' }}>
                    {isLocked && (
                        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
                            <Button variant="ghost" size="small" onClick={() => setIsLocked(false)}>
                                <Edit size={16} style={{ marginRight: '4px' }} /> Unlock
                            </Button>
                        </div>
                    )}
                    <Column css={{ gap: '$2', opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                        {/* <Text variant="caption">Destination Chain: {destinationChainId} (via Union)</Text> */}

                        {!evmAddress ? (
                            <Button variant="secondary" size="small" onClick={async () => await connect()}>
                                {evmAddress ? 'Connected' : 'Connect Ethereum Wallet'}
                            </Button>
                        ) : (
                            <AddressDisplay
                                label="EVM Sender (Metamask)"
                                address={evmAddress}
                                tooltip="Your connected Ethereum wallet address that will initiate the transaction."
                            />
                        )}

                        {predictedProxy?.address && (
                            <AddressDisplay
                                label="Proxy Account"
                                address={predictedProxy.address}
                                tooltip="This is the account that will execute the call on the destination chain. Use this address to give allowance/permits for the cross-chain call."
                            />
                        )}

                        <Text variant="caption">Target EVM Contract Address</Text>
                        <StyledInput
                            placeholder="0x..."
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                        />
                    </Column>
                    <Column css={{ gap: '$2', opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                        <Inline css={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Inline css={{ gap: '$2', alignItems: 'center' }}>
                                <Text variant="caption">ABI</Text>
                                <Tooltip label="The ABI (Application Binary Interface) defines the interface for interacting with the smart contract. It specifies the functions, their parameters, and the expected return values. This information is crucial for encoding the function calls correctly.  (e.g. function transfer(address to, uint256 amount))">
                                    <Info size={14} style={{ color: '#888', cursor: 'help' }} />
                                </Tooltip>
                            </Inline>
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText()
                                        if (text) setAbiString(text)
                                    } catch (e) {
                                        console.error('Failed to read clipboard', e)
                                    }
                                }}
                            >
                                Paste
                            </Button>
                        </Inline>
                        <StyledTextArea
                            value={abiString}
                            onChange={(e) => setAbiString(e.target.value)}
                        />
                    </Column>

                    {functions.length > 0 && (
                        <Column css={{ gap: '$2', opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
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
                                        value={argsState[i] || ''}
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
                        disabled={!contractAddress || !selectedFunctionName || !evmAddress || isLocked}
                    >
                        {isLocked ? 'Generated' : 'Generate Union Call'}
                    </Button>
                </div>
            </Column>
        </Card>
    )
}
