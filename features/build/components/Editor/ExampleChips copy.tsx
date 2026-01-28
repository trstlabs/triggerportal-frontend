// import React, { useEffect, useState } from 'react'
// import { Inline, Tooltip } from 'components/ui-blocks'
// import { generalExamples, wasmExamples, osmoExamples, elysExamples, intentoExamples } from '../ExampleMsgs'
// import { useValidators } from 'hooks/useValidators'

// import { useControlTheme } from 'components/ui-blocks'
// import { Duration } from 'intentojs/dist/codegen/google/protobuf/duration'
// import { Clock } from 'lucide-react'
// import { useIBCAssetInfo } from '../../../../hooks/useIBCAssetInfo'
// import { ComparisonOperator } from 'intentojs/dist/codegen/intento/intent/v1/flow'

// // Map of chain symbols to their icon URLs
// const chainIcons = {
//   'ATOM': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
//   'OSMO': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg',
//   'INTO': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/intento/images/into.png',
//   'ELYS': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png',
//   'USDC': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/usdc.png',
// } as const

// // Helper function to get icon URL with fallback
// const getChainIcon = (chainSymbol: string): string => {
//   return chainIcons[chainSymbol] || 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg'
// }

// // IntentTemplateChip: visually distinct chip for preset flows
// function IntentTemplateChip({ label, iconUrl, gradient, onClick, soon = false, disabled = false, description, autoParse = false, selected = false }: { label: string; iconUrl?: string; gradient: string; onClick?: () => void; soon?: boolean; disabled?: boolean; description?: string; autoParse?: boolean; selected?: boolean }) {
//   const themeController = useControlTheme();
//   const isDark = themeController.theme.name === 'dark';
//   // State to manage which tooltip to show
//   // track which tooltip should be mounted
//   const [activeTooltip, setActiveTooltip] = useState<"auto" | "description" | null>(null);

//   useEffect(() => {
//     if (autoParse) {
//       setActiveTooltip("auto");
//       const timer = setTimeout(() => setActiveTooltip(null), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [autoParse]);



//   const handleMouseEnter = (tooltipType: 'auto' | 'description') => {
//     setActiveTooltip(tooltipType);
//   };

//   const handleMouseLeave = () => {
//     setActiveTooltip(null);
//   };

//   // Optionally darken the gradient for dark mode, or just use the same gradient
//   const darkGradient = gradient.includes('#')
//     ? gradient.replace(/#[0-9a-fA-F]{6}/g, m => {
//       // Darken each hex color by 18%
//       const num = parseInt(m.slice(1), 16);
//       let r = Math.floor(((num >> 16) & 0xff) * 0.82);
//       let g = Math.floor(((num >> 8) & 0xff) * 0.82);
//       let b = Math.floor((num & 0xff) * 0.82);
//       return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
//     })
//     : gradient;
//   const ChipBody = (
//     <div
//       style={{
//         display: 'inline-flex',
//         alignItems: 'center',
//         fontSize: '11px',
//         color: isDark ? '#f0f2f8' : '#fff',
//         borderRadius: '20px',
//         fontWeight: 700,
//         padding: '0.6em 1.3em',
//         margin: '0.3em 0.4em',
//         cursor: soon ? 'not-allowed' : 'pointer',
//         boxShadow: isDark ? '0 2px 16px 0 rgba(30,40,70,0.18)' : '0 2px 12px 0 rgba(80,80,200,0.10)',
//         border: selected ? (isDark ? '1.5px solid #b7c6e7' : ' 1.5px solid #5a6b9a') : 'none',
//         transition: 'all 0.12s cubic-bezier(.4,0,.2,1), transform 0.1s ease',
//         background: isDark ? darkGradient : gradient,
//         transform: 'scale(1)',
//         position: 'relative',
//         overflow: 'hidden',
//         opacity: soon || disabled ? 0.5 : 1,
//         pointerEvents: soon ? 'none' : 'auto',
//         filter: disabled ? 'grayscale(1)' : 'none'
//       }}
//       onClick={() => { onClick && onClick(); }}
//       onMouseOver={e => {
//         (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
//         (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
//           ? '0 4px 20px 0 rgba(30,40,70,0.25)'
//           : '0 4px 16px 0 rgba(80,80,200,0.15)';
//       }}
//       onMouseOut={e => {
//         (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
//         (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
//           ? '0 2px 16px 0 rgba(30,40,70,0.18)'
//           : '0 2px 12px 0 rgba(80,80,200,0.10)';
//       }}
//     >
//       {soon && (
//         <div style={{
//           position: 'absolute',
//           top: 0,
//           right: 0,
//           background: 'rgba(0,0,0,0.6)',
//           color: 'white',
//           fontSize: '0.7em',
//           padding: '0.2em 0.6em',
//           borderBottomLeftRadius: '8px',
//           fontWeight: 600,
//           letterSpacing: '0.5px',
//           transform: 'translateY(-100%)',
//           animation: 'slideDown 0.2s ease-out forwards',
//         }}>
//           SOON
//         </div>
//       )}
//       <Inline>
//         {iconUrl && <img src={iconUrl} alt="Icon" style={{
//           marginRight: '0.7em',
//           height: '2em',
//           borderRadius: '50%',
//           background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(255,255,255,0.2)',
//           filter: soon ? 'grayscale(0.8)' : 'none',
//           opacity: soon ? 0.8 : 1
//         }} />}
//         <span style={{
//           fontWeight: 700,
//           fontSize: '1.1em',
//           letterSpacing: 1,
//           opacity: soon ? 0.8 : 1,
//           display: 'flex',
//           alignItems: 'center',
//           gap: '0.3em'
//         }}>
//           {label}
//           {autoParse && (
//             <Tooltip
//               label="This template includes placeholders like 'Your … address'. On selection, they auto-fill with your connected address."
//               aria-label={`Auto-fill explanation for ${label}`}
//             >
//               <span
//                 style={{
//                   display: 'inline-flex',
//                   alignItems: 'center',
//                   gap: 4,
//                   marginLeft: 8,
//                   padding: '2px 6px',
//                   borderRadius: 10,
//                   background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)',
//                   fontSize: 10,
//                   fontWeight: 700
//                 }}
//                 onMouseEnter={() => handleMouseEnter('auto')}
//                 onMouseLeave={handleMouseLeave}
//               >
//                 ✨ auto
//               </span>
//             </Tooltip>
//           )}
//           {soon && <><Clock size={14} style={{ marginLeft: '0.2em' }} /> <div style={{
//             position: 'absolute',
//             top: 0,
//             right: 0,
//             background: 'rgba(0,0,0,0.7)',
//             color: 'white',
//             fontSize: '0.7em',
//             padding: '0.2em 0.6em',
//             borderBottomLeftRadius: '8px',
//             fontWeight: 600,
//             letterSpacing: '0.5px',
//           }}>
//             SOON
//           </div></>}
//           {disabled && (
//             <div style={{
//               position: 'absolute',
//               top: 0,
//               right: 0,
//               background: 'rgba(0,0,0,0.7)',
//               color: 'white',
//               fontSize: '0.7em',
//               padding: '0.2em 0.6em',
//               borderBottomLeftRadius: '8px',
//               fontWeight: 600,
//               letterSpacing: '0.5px',
//             }}>
//               CURRENTLY NOT AVAILABLE
//             </div>
//           )}
//         </span>
//       </Inline>
//     </div>
//   );

//   // only wrap in description Tooltip if auto one isn't active
//   return description && activeTooltip !== "auto" ? (
//     <Tooltip label={description}>
//       <div style={{ display: "inline-block", maxWidth: "100%" }}>{ChipBody}</div>
//     </Tooltip>
//   ) : (
//     <div style={{ display: "inline-block", maxWidth: "100%" }}>{ChipBody}</div>
//   );
// }



// function Chip({ label, onClick, icon }) {
//   const themeController = useControlTheme();
//   const isDark = themeController.theme.name === 'dark';
//   const baseBg = isDark
//     ? 'linear-gradient(90deg, #22242a 0%, #2a2d36 100%)'
//     : 'linear-gradient(90deg, #f7fafc 0%, #e3e7ee 100%)';
//   const hoverBg = isDark
//     ? 'linear-gradient(90deg, #282a33 0%, #32343e 100%)'
//     : 'linear-gradient(90deg, #f7fafc 0%, #e9f0fa 100%)';
//   const border = isDark ? '1.2px solid #353846' : '1.2px solid #e3e7ee';
//   const hoverBorder = isDark ? '1.2px solid #5a6b9a' : '1.2px solid #b7c6e7';
//   const color = isDark ? '#f0f2f8' : '#222';
//   const boxShadow = isDark
//     ? '0 1px 4px 0 rgba(30,40,70,0.12)'
//     : '0 1px 4px 0 rgba(80,80,200,0.05)';
//   const hoverBoxShadow = isDark
//     ? '0 2px 10px 0 rgba(30,40,70,0.18)'
//     : '0 2px 10px 0 rgba(80,80,200,0.09)';

//   return (
//     <div
//       style={{
//         display: 'inline-flex',
//         alignItems: 'center with',
//         fontSize: '11px',
//         color,
//         borderRadius: '13px',
//         background: baseBg,
//         padding: '0.35em 0.7em',
//         margin: '0.2em 0.3em',
//         cursor: 'pointer',
//         border,
//         boxShadow,
//         fontWeight: 600,
//         letterSpacing: '0.01em',
//         transition: 'all 0.12s cubic-bezier(.4,0,.2,1)',
//       }}
//       onClick={onClick}
//       onMouseOver={e => {
//         (e.currentTarget as HTMLDivElement).style.background = hoverBg;
//         (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
//         (e.currentTarget as HTMLDivElement).style.border = hoverBorder;
//         (e.currentTarget as HTMLDivElement).style.boxShadow = hoverBoxShadow;
//       }}
//       onMouseOut={e => {
//         (e.currentTarget as HTMLDivElement).style.background = baseBg;
//         (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
//         (e.currentTarget as HTMLDivElement).style.border = border;
//         (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadow;
//       }}
//     >
//       <Inline>
//         <img
//           src={icon}
//           alt="Icon"
//           style={{ marginRight: '0.45em', height: '1.2em', borderRadius: '50%', background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(200,200,255,0.10)' }}
//         />
//         <span style={{ fontWeight: 600 }}>{label}</span>
//       </Inline>
//     </div>
//   );
// }



// const AutoCompoundChip = ({ chainSymbol, setAllMessages, IBCAssetInfo, selectedTemplateLabel }) => {
//   const { validators } = useValidators(chainSymbol)
//   const validatorAddress = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])

//   const handleClick = () => {
//     setAllMessages(
//       [
//         {
//           typeUrl: `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`,
//           value: {
//             delegatorAddress: chainSymbol === 'INTO' ? 'Your Intento address' : `Your ${IBCAssetInfo.prefix} address`,
//             validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
//           },
//         },
//         {
//           typeUrl: `/cosmos.staking.v1beta1.MsgDelegate`,
//           value: {
//             delegatorAddress: chainSymbol === 'INTO' ? 'Your Intento address' : `Your ${IBCAssetInfo.prefix} address`,
//             validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
//             amount: {
//               denom: `${chainSymbol}`,
//               amount: '1', // This will be replaced by the feedback loop
//             },
//           },
//         },
//       ],

//       {
//         conditions: {
//           feedbackLoops: [
//             {
//               responseIndex: 0,
//               responseKey: 'Amount.[-1]',
//               msgsIndex: 1,
//               msgKey: 'Amount',
//               valueType: 'sdk.Coin',
//             }
//           ],
//           comparisons: [{
//             responseIndex: 0,
//             responseKey: 'Amount.[-1]',
//             operator: 4,
//             operand: `1000000u${chainSymbol.toLowerCase()}`,
//             valueType: 'sdk.Coin',
//           }
//           ],
//         }
//       }, `Autocompound if rewards > 1 ${chainSymbol}`
//     )
//   }

//   return (
//     <IntentTemplateChip
//       label={`Autocompound if rewards > 1 ${chainSymbol}`}
//       autoParse
//       description={`Autocompound if rewards > 1. Uses a feedback loop to check if rewards are more than 1 and compound them. Will stop when rewards are less than 1. You can change these inputs. Validator address should start with ${IBCAssetInfo?.prefix}1.`}
//       iconUrl={getChainIcon(chainSymbol)}
//       gradient="linear-gradient(90deg, #9C27B0 0%, #673AB7 100%)"
//       selected={selectedTemplateLabel === `Autocompound if rewards > 1 ${chainSymbol}`}
//       onClick={handleClick}
//     />
//   )
// }





// type ExampleChipsProps = {
//   chainSymbol: string
//   setExample: (index: number, example: any) => void
//   messageIndex: number
// }

// export function ExampleChips({ chainSymbol, setExample, messageIndex = 0 }: ExampleChipsProps) {
//   return (
//     <>
//       {setExample && (
//         <Inline css={{ display: 'inline', paddingTop: '$4' }}>

//           {/* ELYS examples */}
//           {chainSymbol === 'ELYS' && elysExamples.map((example, ei) => (
//             <span key={`elys-${ei}`}>
//               <Chip
//                 label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
//                 icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
//                 onClick={() => setExample(messageIndex, example)}
//               />
//             </span>
//           ))}
//           {/* OSMO examples */}
//           {chainSymbol === 'OSMO' && osmoExamples.map((example, ei) => (
//             <span key={`osmo-${ei}`}>
//               <Chip
//                 label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
//                 icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                 onClick={() => setExample(messageIndex, example)}
//               />
//             </span>
//           ))}
//           {/* WASM examples (INTO chain) */}
//           {chainSymbol === 'OSMO' && wasmExamples.map((example, ei) => (
//             <span key={`wasm-${ei}`}>
//               <Chip
//                 label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
//                 icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/cosmwasmtestnet/images/cosmwasm.svg"
//                 onClick={() => setExample(messageIndex, example)}
//               />
//             </span>
//           ))}
//           {/* General examples always shown */}
//           {generalExamples.map((example, ei) => (
//             <span key={`general-${ei}`}>
//               <Chip
//                 label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
//                 icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
//                 onClick={() => setExample(messageIndex, example)}
//               />
//             </span>
//           ))}
//           {chainSymbol === 'INTO' && intentoExamples.map((example, ei) => (
//             <span key={`intento-${ei}`}>
//               <Chip
//                 label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
//                 icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/intento/images/into.svg"
//                 onClick={() => setExample(messageIndex, example)}
//               />
//             </span>
//           ))}
//         </Inline>
//       )}
//     </>
//   )
// }

// interface FlowInput {
//   startTime?: number;
//   duration?: number;
// }

// interface ExampleFlowChipsProps {
//   chainSymbol: string;
//   setAllMessages?: (messages: any[], conditions?: any, templateLabel?: string) => void;
//   index: number;
//   flowInput?: FlowInput;
//   onCustom?: () => void;
//   selectedTemplateLabel?: string | null;
// }

// export function ExampleFlowChips({ chainSymbol, setAllMessages, index, flowInput = {}, onCustom, selectedTemplateLabel }: ExampleFlowChipsProps) {
//   const { validators } = useValidators(chainSymbol)
//   const validatorAddress = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])
//   const IBCAssetInfo = useIBCAssetInfo(chainSymbol)
//   // Calculate flow end time in nanoseconds since epoch
//   const nowInMilliseconds = Date.now()
//   const flowStartTime = flowInput?.startTime ?? nowInMilliseconds
//   const flowDuration = flowInput?.duration ?? 24 * 60 * 60 * 1_000 * 31 // 24 hours in milliseconds * 31 days //temporary workaround
//   const flowEndTimeInMilliseconds = flowStartTime + flowDuration
//   // Convert to nanoseconds by multiplying by 1,000,000 and add 1 hour buffer (in nanoseconds)
//   const oneHourInNanos = BigInt(60 * 60 * 1_000_000_000) // 1 hour in nanoseconds
//   const flowEndTimeInNanos = BigInt(flowEndTimeInMilliseconds) * BigInt(1_000_000) + oneHourInNanos
//   const timeoutTimestamp = flowEndTimeInNanos.toString()
//   return (
//     <>
//       {setAllMessages && index === 0 && (
//         <Inline css={{ marginBottom: '$4', flexWrap: 'wrap', gap: '$2' }}>
//           {(() => {
//             const templateLabel = `Stream 1 ${chainSymbol}`;
//             return (
//               <IntentTemplateChip
//                 label={templateLabel}
//                 iconUrl={getChainIcon(chainSymbol)}
//                 gradient="linear-gradient(90deg,rgb(94, 94, 178) 0%,rgb(123, 134, 218) 100%)"
//                 autoParse
//                 description={`Streams one ${chainSymbol} from your address to another address. You can adjust the amount after selecting.`}
//                 selected={selectedTemplateLabel === templateLabel}
//                 onClick={() => setAllMessages([
//                   {
//                     typeUrl: '/cosmos.bank.v1beta1.MsgSend',
//                     value: {
//                       fromAddress: chainSymbol === 'INTO' ? 'Your Intento address' : `Your ${IBCAssetInfo.prefix} address`,
//                       toAddress: chainSymbol === 'INTO' ? 'Your Intento address' : `Your ${IBCAssetInfo.prefix} address`,
//                       amount: [{
//                         denom: `${chainSymbol}`,
//                         amount: '1'
//                       }]
//                     }
//                   }
//                 ], undefined, templateLabel)}
//               />
//             );
//           })()}
//           {(chainSymbol === 'ATOM' || chainSymbol === 'OSMO' || chainSymbol === 'INTO') && (
//             <AutoCompoundChip chainSymbol={chainSymbol} IBCAssetInfo={IBCAssetInfo} setAllMessages={setAllMessages} selectedTemplateLabel={selectedTemplateLabel} />
//           )}

//           {chainSymbol === 'ATOM' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true' && (
//             <>
//               {(() => {
//                 const templateLabel = "Swap ATOM for BTC if ATOM < $5";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     autoParse
//                     description="Swaps 1 ATOM for BTC if ATOM < $5 via Osmosis. Uses a query to check the price of ATOM, this saves gas. "
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
//                     gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
//                         value: {
//                           sourcePort: "transfer",
//                           sourceChannel: "channel-141",
//                           token: {
//                             denom: "ATOM",
//                             amount: "1"
//                           },
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           receiver: "osmo10a3k4hvk37cc4hnxctw4p95fhscd2z6h2rmx0aukc6rm8u9qqx9smfsh7u",
//                           timeoutHeight: {
//                             revisionNumber: "0",
//                             revisionHeight: "0"
//                           },
//                           timeoutTimestamp: timeoutTimestamp,
//                           memo: `{"wasm":{"contract":"osmo10a3k4hvk37cc4hnxctw4p95fhscd2z6h2rmx0aukc6rm8u9qqx9smfsh7u","msg":{"swap_and_action":{"user_swap":{"swap_exact_asset_in":{"swap_venue_name":"osmosis-poolmanager","operations":[{"pool":"611","denom_in":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","denom_out":"ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4"},{"pool":"1096","denom_in":"ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4","denom_out":"uosmo"},{"pool":"712","denom_in":"uosmo","denom_out":"ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F"},{"pool":"1868","denom_in":"ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F","denom_out":"ibc/2F4258D6E1E01B203D6CA83F2C7E4959615053A21EC2C2FC196F7911CAC832EF"}]}},"min_asset":{"native":{"denom":"ibc/2F4258D6E1E01B203D6CA83F2C7E4959615053A21EC2C2FC196F7911CAC832EF","amount":"1"}},"timeout_timestamp":${timeoutTimestamp},"post_swap_action":{"transfer":{"to_address":"Your osmo address"}},"affiliates":[]}}}}`
//                         }
//                       }
//                     ],
//                       {
//                         conditions: {
//                           comparisons: [
//                             {
//                               responseIndex: 0,
//                               responseKey: "",
//                               operand: "5.0",
//                               operator: 3,
//                               valueType: "osmosistwapv1beta1.TwapRecord.P0LastSpotPrice",
//                               icqConfig: {
//                                 connectionId: "connection-1",
//                                 chainId: "osmosis-1",
//                                 timeoutPolicy: 2,
//                                 timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                                 queryType: "store/twap/key",
//                                 queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
//                               }
//                             }
//                           ],
//                           feedbackLoops: []
//                         }
//                       }, templateLabel
//                     )}
//                     soon={false}
//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "Compound if ATOM < $5";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     autoParse
//                     description={`Compounds all withdrawn rewards ATOM if ATOM < $5. Uses a query to check the price of ATOM, this saves gas. Validator address should start with ${IBCAssetInfo.prefix}1.`}
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
//                     gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages(
//                       [
//                         {
//                           typeUrl: `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`,
//                           value: {
//                             delegatorAddress: `Your ${IBCAssetInfo.prefix} address`,
//                             validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
//                           },
//                         },
//                         {
//                           typeUrl: `/cosmos.staking.v1beta1.MsgDelegate`,
//                           value: {
//                             delegatorAddress: `Your ${IBCAssetInfo.prefix} address`,
//                             validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
//                             amount: {
//                               denom: `${chainSymbol}`,
//                               amount: '1', // This will be replaced by the feedback loop
//                             },
//                           },
//                         },
//                       ],
//                       {
//                         conditions: {
//                           feedbackLoops: [
//                             {
//                               responseIndex: 0,
//                               responseKey: 'Amount.[-1]',
//                               msgsIndex: 1,
//                               msgKey: 'Amount',
//                               valueType: 'sdk.Coin',
//                             }
//                           ],
//                           comparisons: [
//                             {
//                               responseIndex: 0,
//                               responseKey: "",
//                               operand: "5.0",
//                               operator: 3,
//                               valueType: "osmosistwapv1beta1.TwapRecord.P0LastSpotPrice",
//                               icqConfig: {
//                                 connectionId: "connection-1",
//                                 chainId: "osmosis-1",
//                                 timeoutPolicy: 2,
//                                 timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                                 queryType: "store/twap/key",
//                                 queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
//                               }
//                             }
//                           ]
//                         }
//                       }, templateLabel
//                     )}
//                   />
//                 );
//               })()}

//               {(() => {
//                 const templateLabel = "DCA into StreamSwap";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     autoParse
//                     description="DCA into StreamSwap to average your entry into the streaming event."
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png"
//                     gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           contract: 'cosmos1gzz44pdc87r8vfdktum8285j2aghtcg56qultynjzqy75ft3czxsux5xec',
//                           msg: {
//                             subscribe: {
//                               stream_id: 3
//                             }
//                           },
//                           funds: [
//                             {
//                               denom: 'ATOM',
//                               amount: '1'
//                             }
//                           ]
//                         }
//                       }
//                     ], undefined, templateLabel)}
//                     disabled={true}
//                   />
//                 );
//               })()}
//             </>
//           )}
//           {chainSymbol === 'OSMO' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true' && (
//             <>
//               {(() => {
//                 const templateLabel = "DCA into ATOM";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     autoParse
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     description="Swaps 1 USDC into ATOM with no additional conditions. You can adjust the tokenIn and routes after selecting."
//                     gradient="linear-gradient(90deg, #5a4fcf 0%, #8a7aff 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       // Example: DCA flow: swap, send
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           routes: [{ poolId: '1464', tokenOutDenom: 'uosmo' }, { poolId: '1265', tokenOutDenom: 'ATOM (transfer/channel-0)' }],
//                           tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
//                           tokenOutMinAmount: '1',
//                         },
//                       }
//                     ], undefined, templateLabel)}
//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "DCA into INTO";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg, #0c76af 0%, #38aff9 100%)"
//                     autoParse
//                     description="Swaps 1 USDC into INTO with no additional conditions. You can adjust the tokenIn and routes after selecting."
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           tokenIn: {
//                             denom: 'USDC (transfer/channel-750)', // USDC IBC denom
//                             amount: '1', // 1 USDC in micro units
//                           },
//                           tokenOutMinAmount: '1', // price < 0.01 USDC
//                           routes: [
//                             { poolId: '3138', tokenOutDenom: 'INTO (transfer/channel-106076)' } // token1 denom
//                           ]
//                         }
//                       }
//                     ], undefined, templateLabel)}
//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "DCA into INTO if price < 0.01";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     autoParse
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg,rgb(67, 142, 233) 0%,rgb(56, 95, 249) 100%)"
//                     description="Swaps 1 USDC into INTO with a query for the last price. You can adjust the tokenIn and routes after selecting."
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           tokenIn: {
//                             denom: 'USDC (transfer/channel-750)', // USDC IBC denom
//                             amount: '1', // 1 USDC in micro units
//                           },
//                           tokenOutMinAmount: '1',
//                           routes: [
//                             { poolId: '3138', tokenOutDenom: 'INTO (transfer/channel-106076)' } // token1 denom
//                           ]
//                         }
//                       }
//                     ], {
//                       conditions: {
//                         comparisons: [
//                           {
//                             responseIndex: 0,
//                             responseKey: "",
//                             operand: "0.01",
//                             operator: 3,
//                             valueType: "osmosistwapv1beta1.TwapRecord.P0LastSpotPrice",
//                             icqConfig: {
//                               connectionId: "connection-1",
//                               chainId: "osmosis-1",
//                               timeoutPolicy: 2,
//                               timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                               queryType: "store/twap/key",
//                               queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDMxMzh8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTR8aWJjL0JFMDcyQzAzREE1NDRDRjI4MjQ5OTQxOEU3QkM2NEQzODYxNDg3OUIzRUU5NUY5QUQ5MUU2QzM3MjY3RDQ4MzY=",
//                             }
//                           }
//                         ],
//                         feedbackLoops: []
//                       }
//                     }, templateLabel)}
//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "BTC Positive trend detection";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           tokenIn: {
//                             denom: 'USDC (transfer/channel-750)', // USDC IBC denom
//                             amount: '1', // 1 USDC in micro units
//                           },
//                           tokenOutMinAmount: '1', // price < 0.01 USDC
//                           routes: [
//                             { poolId: '1943', tokenOutDenom: 'factory/osmo1z6r6qdknhgsc0zeracktgpcxf43j6sekq07nw8sxduc9lg0qjjlqfu25e3/alloyed/allBTC' } // token1 denom
//                           ]
//                         }
//                       }
//                     ], {
//                       conditions: {
//                         comparisons: [
//                           {
//                             responseIndex: 0,
//                             responseKey: "osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator",
//                             operand: "0",//delta zero
//                             operator: ComparisonOperator.GREATER_EQUAL,
//                             differenceMode: true,
//                             valueType: "osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator",
//                             icqConfig: {
//                               connectionId: "connection-1",
//                               chainId: "osmosis-1",
//                               timeoutPolicy: 2,
//                               timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                               queryType: "store/twap/key",
//                               queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDE5NDN8ZmFjdG9yeS9vc21vMXo2cjZxZGtuaGdzYzB6ZXJhY2t0Z3BjeGY0M2o2c2VrcTA3bnc4c3hkdWM5bGcwcWpqbHFmdTI1ZTMvYWxsb3llZC9hbGxCVEN8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
//                             }
//                           }
//                         ],
//                         feedbackLoops: []
//                       }
//                     }, templateLabel)}

//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "Spot vs TWAP arbitrage BTC";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           tokenIn: {
//                             denom: 'USDC (transfer/channel-750)', // USDC IBC denom
//                             amount: '1', // 1 USDC in micro units
//                           },
//                           tokenOutMinAmount: '1',
//                           routes: [
//                             { poolId: '1943', tokenOutDenom: 'factory/osmo1z6r6qdknhgsc0zeracktgpcxf43j6sekq07nw8sxduc9lg0qjjlqfu25e3/alloyed/allBTC' } // token1 denom
//                           ]
//                         }
//                       }
//                     ], {
//                       conditions: {
//                         comparisons: [
//                           {
//                             responseIndex: 0,
//                             responseKey: "P0LastSpotPrice",
//                             operand: "osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator",
//                             operator: ComparisonOperator.SMALLER_THAN,
//                             differenceMode: false,
//                             valueType: "osmosistwapv1beta1.TwapRecord",
//                             icqConfig: {
//                               connectionId: "connection-1",
//                               chainId: "osmosis-1",
//                               timeoutPolicy: 2,
//                               timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                               queryType: "store/twap/key",
//                               queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDE5NDN8ZmFjdG9yeS9vc21vMXo2cjZxZGtuaGdzYzB6ZXJhY2t0Z3BjeGY0M2o2c2VrcTA3bnc4c3hkdWM5bGcwcWpqbHFmdTI1ZTMvYWxsb3llZC9hbGxCVEN8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
//                             }
//                           }
//                         ],
//                         feedbackLoops: []
//                       }
//                     }, templateLabel)}

//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "Spot vs TWAP arbitrage ATOM";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           tokenIn: {
//                             denom: 'USDC (transfer/channel-750)', // USDC IBC denom
//                             amount: '1', // 1 USDC in micro units
//                           },
//                           tokenOutMinAmount: '1',
//                           routes: [{ poolId: '1464', tokenOutDenom: 'uosmo' }, { poolId: '1265', tokenOutDenom: 'ATOM (transfer/channel-0)' }],
//                         }
//                       }
//                     ], {
//                       conditions: {
//                         comparisons: [
//                           {
//                             responseIndex: 0,
//                             responseKey: "P0LastSpotPrice",
//                             operand: "osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator",
//                             operator: ComparisonOperator.SMALLER_THAN,
//                             differenceMode: false,
//                             valueType: "osmosistwapv1beta1.TwapRecord",
//                             icqConfig: {
//                               connectionId: "connection-1",
//                               chainId: "osmosis-1",
//                               timeoutPolicy: 2,
//                               timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                               queryType: "store/twap/key",
//                               queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
//                             }
//                           }
//                         ],
//                         feedbackLoops: []
//                       }
//                     }, templateLabel)}

//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "TWAP-based DCA ATOM";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
//                     description="periodically swaps USDC into the target asset on Osmosis only when the TWAP is below your configured threshold in the comparison operand, so buys are executed on TWAP dips instead of every interval."
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           tokenIn: {
//                             denom: 'USDC (transfer/channel-750)', // USDC IBC denom
//                             amount: '1', // 1 USDC in micro units
//                           },
//                           tokenOutMinAmount: '1',
//                           routes: [
//                             { poolId: '3138', tokenOutDenom: 'INTO (transfer/channel-106076)' } // token1 denom
//                           ]
//                         }
//                       }
//                     ], {
//                       conditions: {
//                         comparisons: [
//                           {
//                             responseIndex: 0,
//                             responseKey: "osmosistwapv1beta1.TwapRecord.P1ArithmeticTwapAccumulator",
//                             operand: Number(2.27).toString(),//depends on interval.  in executeSubmitFlow rewrite thresholds so the condition compares the accumulator to a correctly scaled number.
//                             operator: ComparisonOperator.SMALLER_THAN,
//                             differenceMode: true,
//                             valueType: "osmosistwapv1beta1.TwapRecord.P1ArithmeticTwapAccumulator",
//                             icqConfig: {
//                               connectionId: "connection-1",
//                               chainId: "osmosis-1",
//                               timeoutPolicy: 2,
//                               timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
//                               queryType: "store/twap/key",
//                               queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
//                             }
//                           }
//                         ],
//                         feedbackLoops: []
//                       }
//                     }, templateLabel)}
//                   />
//                 );
//               })()}
//               {(() => {
//                 const templateLabel = "DCA into StreamSwap";
//                 return (
//                   <IntentTemplateChip
//                     label={templateLabel}
//                     autoParse
//                     disabled
//                     description="DCA into StreamSwap to average your entry into the streaming event."
//                     iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
//                     gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
//                     selected={selectedTemplateLabel === templateLabel}
//                     onClick={() => setAllMessages([
//                       {
//                         typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
//                         value: {
//                           sender: `Your ${IBCAssetInfo.prefix} address`,
//                           contract: 'osmo1994s0ea4z2lqrh5gl8l5s0cw6hwz92s3pn2yhkamfh57j9yh7lxssnr80s',
//                           msg: {
//                             subscribe: {
//                               stream_id: 8
//                             }
//                           },
//                           funds: [
//                             {
//                               denom: 'USDC (transfer/channel-750)', amount: '1'
//                             }
//                           ]
//                         }
//                       }
//                     ], undefined, templateLabel)}
//                   />
//                 );
//               })()}
//             </>
//           )}
//           {/* Custom builder entry */}
//         </Inline>
//       )}
//       {/* Always show Custom chip (available for any index) */}
//       <Inline css={{ marginBottom: '$2', flexWrap: 'wrap', gap: '$2' }}>
//         <IntentTemplateChip
//           label="Custom"
//           gradient="linear-gradient(90deg, #4a5568 0%, #2d3748 100%)"
//           description="Start with a custom message type and fields."
//           onClick={() => onCustom && onCustom()}
//         />
//       </Inline>
//     </>
//   )
// }
