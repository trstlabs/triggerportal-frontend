import { SigningStargateClient } from '@cosmjs/stargate'
// import { MsgUpdateFlow } from "intentojs/dist/codegen/intento/intent/v1/tx"
import { validateTransactionSuccess } from '../../util/validateTx'
import { getIntentoSigningClientOptions, intento } from 'intentojs'
import { MsgUpdateFlowParams } from '../../types/trstTypes'
import { transformAndEncodeMsgs } from './executeSubmitFlow'
import { removeEmptyProperties } from '../../util/conversion'

type executeUpdateFlowArgs = {
  flowParams: MsgUpdateFlowParams
  client: SigningStargateClient
  ibcWalletAddress?: string
}

export const executeUpdateFlow = async ({
  client,
  flowParams,
  ibcWalletAddress,
}: executeUpdateFlowArgs): Promise<any> => {
  console.log(flowParams)
  let msgs: any[] = []
  if (flowParams.msgs) {
    // IBC wallet address is passed as a parameter
    const inputMsgs = Array.isArray(flowParams.msgs) ? flowParams.msgs : [flowParams.msgs];
    const { registry } = getIntentoSigningClientOptions()
    // Process and encode messages, replacing placeholders
    msgs = transformAndEncodeMsgs({
      flowInputMsgs: inputMsgs,
      registry,
      msgs: [],
      ownerAddress: flowParams.owner,
      ibcWalletAddress: ibcWalletAddress || undefined
    });

    console.log('Encoded messages:', msgs);
  }

  const msgUpdateFlow =
    intento.intent.v1.MessageComposer.withTypeUrl.updateFlow({
      id: BigInt(flowParams.id),
      owner: flowParams.owner,
      connectionId: flowParams.connectionId ? flowParams.connectionId : '',
      msgs: msgs,
      endTime: flowParams.endTime
        ? BigInt(Number(flowParams.endTime / 1000).toFixed(0))
        : BigInt(0),
      label: flowParams.label ? flowParams.label : '',
      interval: flowParams.interval ? flowParams.interval.toString() + 'ms' : '',
      startAt: flowParams.startAt
        ? BigInt(Number(flowParams.startAt / 1000).toFixed(0))
        : BigInt(0),
      configuration: flowParams.configuration
        ? flowParams.configuration
        : undefined,
      feeFunds: flowParams.feeFunds ? flowParams.feeFunds : [],
      conditions: flowParams.conditions ? flowParams.conditions : undefined,
    })
  console.log('Submitting MsgUpdateFlow ⬇')
  console.log(msgUpdateFlow)
  return validateTransactionSuccess(
    await client.signAndBroadcast(flowParams.owner, [removeEmptyProperties(msgUpdateFlow)], {
      amount: [],
      gas: '200000',
    })
  )
}
