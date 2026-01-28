import axios from 'axios'
import { camelCase, isObject } from 'lodash'

///temporary solution as typeUrls get lost in retrieving from intentojs/telescope as the objects are unwrapped there with the GlobalRegistry. We cannnot transpile without that setting becasue then we loose the full registry  needed to unwrap/wrap ourselves and  osmosis.gamm.v1beta1.load(registry) is unavailable without the useGlobalDecoderRegistry setting
export const fetchFlowMsgs = async (id) => {
  const { data } = await axios.get(
    process.env.NEXT_PUBLIC_INTO_API + '/intento/intent/v1/flow/' + id
  )
  return toCamelCaseWithValues(data.flow.msgs)
}

const toCamelCaseWithValues = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCaseWithValues(v))
  } else if (isObject(obj)) {
    let result: any = {}
    let valueObj: any = {}

    for (const key of Object.keys(obj)) {
      const newKey = key === '@type' ? 'typeUrl' : camelCase(key)
      if (newKey === 'typeUrl') {
        result[newKey] = toCamelCaseWithValues(obj[key])
      } else {
        valueObj[newKey] = toCamelCaseWithValues(obj[key])
      }
    }

    if (Object.keys(valueObj).length > 0) {
      result.value = valueObj
    }

    return result
  }
  return obj
}

//in the future we want to unwrap anys ourselves so we also get the typeurl
// code for creating/returning a registry:
// import { useAtom, useAtomValue } from 'jotai'
// import { intento, osmosis } from 'intentojs'
// import { walletState } from '../state/atoms/walletAtoms'
// import { getIntentoSigningStargateClientOptions } from 'intentojs'
// import { defaultRegistryTypes } from '@cosmjs/stargate'
// import { Registry } from '@cosmjs/proto-signing';
// export const useGetRegistry = () => {
//   //const { client } = useRecoilValue(walletState)
//   const registry = new Registy(defaultRegistryTypes)
//   osmosis.gamm.v1beta1.load(registry)
//   intento.intent.v1.load(registry)

//   return client.registry
// }
