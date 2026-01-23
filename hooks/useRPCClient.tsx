import { intento, cosmos, tendermint } from 'intentojs'

import { useQuery } from '@tanstack/react-query'

import { StargateClient } from '@cosmjs/stargate'

export const useIntentoRpcClient = () => {
  const { data } = useQuery({
    queryKey: ['@intento-querier'],
    queryFn: async () => {
      return intento.ClientFactory.createRPCQueryClient({
        rpcEndpoint: process.env.NEXT_PUBLIC_INTO_RPC,
      })
    },
    enabled: true
  })

  return data
}

export const useCosmosRpcClient = () => {
  const { data } = useQuery({
    queryKey: ['@cosmos-querier'],
    queryFn: () => {
      return cosmos.ClientFactory.createRPCQueryClient({
        rpcEndpoint: process.env.NEXT_PUBLIC_INTO_RPC,
      })
    },
    enabled: cosmos != undefined
  })

  return data
}



export const useTendermintRpcClient = () => {
  const { data } = useQuery({
    queryKey: ['@client-querier'],
    queryFn: () => {
      return StargateClient.connect(
        process.env.NEXT_PUBLIC_INTO_RPC,
      )
    },
    enabled: tendermint != undefined
  })

  return data
}

