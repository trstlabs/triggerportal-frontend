// import React from 'react'
// import {
//   Card,
//   CardContent,
//   Text,
//   Button,
//   IconWrapper,
//   Info,
//   Column,
//   Inline,
//   Union,
// } from 'components/ui-blocks'
// import { SubmitFlowDialog } from './SubmitFlowDialog'

// const MessagePreview = ({
//   FlowInput,
//   chainId,
//   icaBalance,
//   shouldDisableAuthzGrants,
//   icaAddress,
//   isSubmitFlowDialogShowing,
//   setSubmitFlowDialogState,
//   isExecutingSchedule,
//   feeFundsHostChain,
//   shouldDisableSendHostChainFundsButton,
//   isExecutingAuthzGrant,
//   isExecutingSendFundsOnHost,
//   showWarning,
//   hideWarning,
//   setFeeFundsHostChain,
//   handleSubmitFlowClick,
//   handleCreateAuthzGrantClick,
//   handleSendFundsOnHostClick,
// }) => {
//   return (
//     <div>
//       {FlowInput.msgs &&
//         FlowInput.msgs[0] &&
//         FlowInput.msgs[0].length > 3 && (
//           <Column>
//             <Card
//               css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
//               variant="secondary"
//               disabled
//             >
//               <CardContent
//                 size="large"
//                 css={{ padding: '$4', marginTop: '$4' }}
//               >
//                 <Text css={{ paddingBottom: '$4' }} align="center">
//                   Preview
//                 </Text>

//                 {showWarning && (
//                   <Card css={{ padding: '$4' }}>
//                     <Inline>
//                       <IconWrapper icon={<Info />} color="primary" />
//                       <Text variant="caption" align="left">
//                         {' '}
//                         Please exercise caution when handling message values, as
//                         incorrect inputs could potentially result in the loss of
//                         funds. It is advisable not to engage in any interflows
//                         if you are uncertain about the flows you are taking.
//                         Always thoroughly review the contents of your messages
//                         before submitting them to mitigate any potential risks.
//                       </Text>
//                       <Button
//                         variant="ghost"
//                         onClick={() => hideWarning(!showWarning)}
//                       >
//                         <Union />
//                       </Button>
//                     </Inline>
//                   </Card>
//                 )}
//               </CardContent>

//               {FlowInput.msgs &&
//                 FlowInput.msgs.map((msgToDisplay, i) => (
//                   <div key={msgToDisplay}>
//                     {' '}
//                     <CardContent
//                       size="medium"
//                       css={{ display: 'inline-block', overflow: 'hidden' }}
//                     >
//                       <Text
//                         variant="legend"
//                         align="left"
//                         css={{ paddingBottom: '$10' }}
//                       >
//                         Message {i + 1}: <pre>{msgToDisplay}
//                         </pre>
//                       </Text>{' '}
//                       <SubmitFlowDialog
//                         chainId={chainId}
//                         icaBalance={icaBalance}
//                         icaAddress={icaAddress}
//                         flowInput={FlowInput}
//                         isDialogShowing={isSubmitFlowDialogShowing}
//                         onRequestClose={() =>
//                           setSubmitFlowDialogState({
//                             isShowing: false,
//                           })
//                         }
//                         isLoading={isExecutingSchedule}
//                         feeFundsHostChain={feeFundsHostChain}
//                         shouldDisableSendHostChainFundsButton={
//                           shouldDisableSendHostChainFundsButton
//                         }
//                         isExecutingAuthzGrant={isExecutingAuthzGrant}
//                         isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
//                         shouldDisableAuthzGrantButton={
//                           !shouldDisableAuthzGrants
//                         }
//                         setFeeFundsHostChain={setFeeFundsHostChain}
//                         handleSubmitFlow={(FlowInput) =>
//                           handleSubmitFlowClick(FlowInput)
//                         }
//                         handleCreateAuthzGrantClick={
//                           handleCreateAuthzGrantClick
//                         }
//                         handleSendFundsOnHostClick={handleSendFundsOnHostClick}
//                       />
//                     </CardContent>
//                   </div>
//                 ))}
//             </Card>
//           </Column>
//         )}
//     </div>
//   )
// }

// export default MessagePreview
