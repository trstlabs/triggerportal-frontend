//import { ethers } from "ethers";

import { replacePlaceholders } from './replacePlaceholders'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { intento } from 'intentojs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { FlowInput } from '../../types/trstTypes'
import { Coin } from 'intentojs/dist/codegen/cosmos/base/v1beta1/coin'
import { MsgExecuteContract } from 'intentojs/dist/codegen/cosmwasm/wasm/v1/tx'
import { MsgExec } from 'intentojs/dist/codegen/cosmos/authz/v1beta1/tx'
import { Any } from 'intentojs/dist/codegen/google/protobuf/any'
import { processDenomFields } from '../../features/build/utils/addressUtils'
import { removeEmptyProperties } from '../../util/conversion'

type ExecuteSubmitFlowArgs = {
  owner: string
  flowInput: FlowInput
  client: SigningStargateClient
  ibcWalletAddress?: string
}

export const executeSubmitFlow = async ({
  client,
  flowInput,
  owner,
  ibcWalletAddress,
}: ExecuteSubmitFlowArgs): Promise<any> => {
  // Handle both relative (small number) and absolute (timestamp) start times
  let startAtInt = 0
  if (flowInput.startTime) {
    // If startTime is less than 1000000000 (about 3 years in seconds), treat it as relative time
    if (flowInput.startTime < 1000000000) {
      startAtInt = Math.floor(Date.now() / 1000) + flowInput.startTime / 1000
    } else {
      // Otherwise, treat it as an absolute timestamp (already in milliseconds)
      startAtInt = Math.floor(flowInput.startTime / 1000)
    }
  }

  // Convert to integer before creating BigInt
  let startAt = startAtInt != 0 ? BigInt(Math.floor(startAtInt)) : BigInt('0')
  console.log('startAt (s)', startAtInt / 1000)
  console.log('duration (s)', flowInput.duration / 1000)
  console.log('interval (s)', flowInput.interval / 1000)
  let duration = flowInput.duration + 'ms'
  let interval = flowInput.interval + 'ms'
  let msgs: any[] = []

  // Adjust condition operands for TWAP accumulators based on interval seconds
  try {
    const intervalSeconds = flowInput.interval
      ? Math.floor(flowInput.interval / 1000)
      : 0
    if (
      intervalSeconds > 0 &&
      flowInput.conditions &&
      Array.isArray((flowInput.conditions as any).comparisons)
    ) {
      const comps: any[] = (flowInput.conditions as any).comparisons
      for (const c of comps) {
        if (
          (c?.responseKey ===
            'osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator' &&
            c?.valueType ===
              'osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator') ||
          (c?.responseKey ===
            'osmosistwapv1beta1.TwapRecord.P1ArithmeticTwapAccumulator' &&
            c?.valueType ===
              'osmosistwapv1beta1.TwapRecord.P1ArithmeticTwapAccumulator')
        ) {
          const opStr: string = c.operand?.toString?.() ?? ''
          const opNum = parseFloat(opStr)
          if (!Number.isNaN(opNum)) {
            const multiplied = opNum * intervalSeconds
            c.operand = multiplied.toString()
          }
        }
      }
    }
  } catch (e) {
    console.warn(
      'Failed to adjust TWAP accumulator operands by interval seconds',
      e
    )
  }

  // Process messages and replace any placeholder addresses
  const inputMsgs = Array.isArray(flowInput.msgs)
    ? flowInput.msgs
    : [flowInput.msgs]
  msgs = transformAndEncodeMsgs({
    flowInputMsgs: inputMsgs,
    client,
    msgs: [],
    ownerAddress: owner,
    ibcWalletAddress,
  })

  console.log('Transformed messages:', msgs)
  if (flowInput.icaAddressForAuthZ && flowInput.icaAddressForAuthZ !== '') {
    // wrap individually
    msgs = msgs.map((msg) => {
      if (process.env.NEXT_PUBLIC_PREFERRED_SIGN_AMINO == 'true') {
        return {
          $typeUrl: '/cosmos.authz.v1beta1.MsgExec',
          typeUrl: '/cosmos.authz.v1beta1.MsgExec',
          msgs: [msg],
          grantee: flowInput.icaAddressForAuthZ,
        }
      } else {
        const execMsg = {
          typeUrl: '/cosmos.authz.v1beta1.MsgExec',
          value: {
            grantee: flowInput.icaAddressForAuthZ,
            msgs: [msg],
          },
        }
        return client.registry.encodeAsAny(execMsg)
      }
    })
  }

  console.log('Processed messages:', msgs)

  let feeFunds: Coin[] = []
  if (Number(flowInput.feeFunds?.amount) > 0) {
    feeFunds = [flowInput.feeFunds]
  }

  let msgSubmitFlow = intento.intent.v1.MessageComposer.withTypeUrl.submitFlow({
    owner,
    msgs,
    label: flowInput.label ? flowInput.label : '',
    duration,
    interval,
    startAt,
    connectionId: /* flowInput.connectionId ? flowInput.connectionId :  */ '',
    configuration: flowInput.configuration
      ? flowInput.configuration
      : {
          saveResponses: false,
          updatingDisabled: false,
          stopOnSuccess: false,
          stopOnFailure: false,
          stopOnTimeout: false,
          walletFallback: true,
        },
    feeFunds,
    conditions: flowInput.conditions,
    trustlessAgent: flowInput.trustlessAgent,
  })

  if (process.env.NEXT_PUBLIC_PREFERRED_SIGN_AMINO == 'true') {
    msgSubmitFlow = removeEmptyProperties(msgSubmitFlow)
  }

  console.log('Submitting MsgSubmitFlow ⬇')
  console.log(msgSubmitFlow)

  const result = await validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitFlow], {
      amount: [],
      gas: '300000',
    })
  )

  return result
}

interface TransformAndEncodeMsgsParams {
  flowInputMsgs: string[]
  client: SigningStargateClient
  msgs?: Any[]
  ownerAddress?: string
  ibcWalletAddress?: string
}

export function transformAndEncodeMsgs({
  flowInputMsgs,
  client,
  msgs = [],
  ownerAddress,
  ibcWalletAddress,
}: TransformAndEncodeMsgsParams): Any[] {
  function encodeMsg(typeUrl: string, value: any): Any {
    // CosmWasm MsgExecuteContract
    if (typeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract') {
      const msgObject = value['msg']
      const msgBytes: Uint8Array = toUtf8(JSON.stringify(msgObject))
      const wasmMsg = MsgExecuteContract.fromPartial({
        sender: value.sender,
        contract: value.contract,
        msg: msgBytes,
        funds: value.funds || [],
      })
      return Any.fromPartial({
        typeUrl,
        value: MsgExecuteContract.encode(wasmMsg).finish(),
      })
    }
    // MsgExec (authz)
    if (typeUrl === '/cosmos.authz.v1beta1.MsgExec') {
      const innerMsgs = value.msgs.map((authzMsg: any) => {
        return encodeMsg(authzMsg.typeUrl, authzMsg.value)
      })
      const msgExec = MsgExec.fromPartial({
        grantee: value.grantee,
        msgs: innerMsgs,
      })
      return Any.fromPartial({
        typeUrl,
        value: MsgExec.encode(msgExec).finish(),
      })
    }

    return client.registry.encodeAsAny({
      typeUrl,
      value,
    })
  }

  for (let msgJSON of flowInputMsgs) {
    let parsedMsg = JSON.parse(msgJSON)
    let value = processDenomFields(parsedMsg['value'])
    value = replacePlaceholders({
      value,
      ownerAddress,
      ibcWalletAddress,
    })
    console.log('Transformed message value:', value)

    // Validate address fields
    const validateAddresses = (obj: any, path = '') => {
      for (const [key, val] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        if (typeof val === 'string' && key.toLowerCase().includes('address')) {
          if (val.length <= 30) {
            throw new Error(
              `Address validation failed for ${currentPath}: must have more than 30 characters, got ${val.length}`
            )
          }
          if (!val.substring(0, 15).includes('1')) {
            throw new Error(
              `Address validation failed for ${currentPath}: must include '1' in first 15 characters`
            )
          }
        } else if (typeof val === 'object' && val !== null) {
          validateAddresses(val, currentPath)
        }
      }
    }
    validateAddresses(value)

    let typeUrl: string = parsedMsg['typeUrl'].toString()
    msgs.push(encodeMsg(typeUrl, value))
  }

  return msgs
}
