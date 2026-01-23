import { useQuery } from '@tanstack/react-query'

import {
  /*   DEFAULT_REFETCH_INTERVAL, */
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'
import { useIntentoRpcClient } from './useRPCClient'
import { QueryFlowsResponse } from 'intentojs/dist/codegen/intento/intent/v1/query'
import { GlobalDecoderRegistry } from 'intentojs'
import { PageRequest } from 'intentojs/dist/codegen/cosmos/base/query/v1beta1/pagination'
import { useAtomValue } from 'jotai'
import { walletState } from '../state/atoms/walletAtoms'

export const useFlows = (limit: number, key: any) => {
  const client = useIntentoRpcClient()

  const { data, isPending: isLoading } = useQuery({
    queryKey: [`useFlows/${key}`],
    queryFn: async () => {
      const pageRequest = PageRequest.fromPartial({
        limit: BigInt(limit),
        key,
        reverse: true,
        countTotal: true,
      })
      let resp: QueryFlowsResponse = await client.intento.intent.v1.flows({
        pagination: pageRequest,
      })

      // Transform each msg in flows
      const flows = resp.flows.map((flow) => {
        return {
          ...flow,
          msgs: flow.msgs.map((msg) => {
            //GlobalDecoderRegistry.unwrapAny(msg.value)
            // let wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
            // wrappedMsg.typeUrl =
            //   wrappedMsg.typeUrl ==
            //     '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
            //     ? '/cosmos.authz.v1beta1.MsgExec'
            //     : wrappedMsg.typeUrl

            // wrappedMsg.typeUrl = wrappedMsg.typeUrl == '/cosmos.distribution.v1beta1.QueryValidatorOutstandingRewardsRequest' ? 'Delegate'
            //   : wrappedMsg.typeUrl
            const wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
            wrappedMsg.typeUrl =
              wrappedMsg.typeUrl ==
                '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
                ? '/cosmos.authz.v1beta1.MsgExec'
                : wrappedMsg.typeUrl

            return {
              value: msg.value,
              valueDecoded: msg,
              typeUrl: msg.typeUrl || wrappedMsg.typeUrl,
            }
          }),
        }
      })

      return { flows: flows, pagination: resp.pagination, total: resp.pagination.total }
    },
    enabled: Boolean(client && client.intento),
    refetchOnMount: false,
    staleTime: 60000, // Cache data for 60 seconds
    gcTime: 300000, // Cache data for 5 minutes
    //refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
    //refetchIntervalInBackground: true,
  })

  return [data, isLoading] as const
}

export const useFlowsByOwner = (limit: number, key: any, address?: string) => {
  const client = useIntentoRpcClient()
  // Always call hooks unconditionally
  const wallet = useAtomValue(walletState)
  const owner = address ?? wallet?.address
  const { data, isPending: isLoading } = useQuery({
    queryKey: ['useFlowsByOwner', owner, limit, key],
    queryFn: async () => {
      const pageRequest = PageRequest.fromPartial({
        limit: BigInt(limit),
        key,
        reverse: true,
        countTotal: true,
      })

      let resp: QueryFlowsResponse =
        await client.intento.intent.v1.flowsForOwner({
          owner: owner,
          pagination: pageRequest,
        })

      // Transform each msg in flows
      const flows = resp.flows.map((flow) => {
        return {
          ...flow,
          msgs: flow.msgs.map((msg) => {
            //GlobalDecoderRegistry.unwrapAny(msg.value)
            const wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
            wrappedMsg.typeUrl =
              wrappedMsg.typeUrl ==
                '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
                ? '/cosmos.authz.v1beta1.MsgExec'
                : wrappedMsg.typeUrl
            return {
              value: msg.value,
              valueDecoded: msg,
              typeUrl: msg.typeUrl || wrappedMsg.typeUrl,
            }
          }),
        }
      })

      return { flows: flows, pagination: resp.pagination, total: resp.pagination.total }
    },
    enabled: Boolean(client && client.intento && owner),
    refetchOnMount: 'always',
    staleTime: 10000,
    gcTime: 60000,
  })

  return [data, isLoading] as const
}

export const useFlow = (id) => {
  const client = useIntentoRpcClient()
  const { data, isPending: isLoading } = useQuery({
    queryKey: [`flowId/${id}`],
    queryFn: async () => {
      if (!id || !client || !client.intento) {
        throw new Error('Invalid ID or client not available')
      }
      const flow = (await client.intento.intent.v1.flow({ id })).flow
      return {
        ...flow,
        msgs: flow.msgs.map((msg) => {
          const wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
          wrappedMsg.typeUrl =
            wrappedMsg.typeUrl ==
              '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
              ? '/cosmos.authz.v1beta1.MsgExec'
              : wrappedMsg.typeUrl
          return {
            value: wrappedMsg.value,
            valueDecoded: msg,
            typeUrl: /* msg.typeUrl ||  */ wrappedMsg.typeUrl,
          }
        }),
      }
    },
    enabled: !!id && !!client?.intento,
    refetchOnMount: 'always',
    refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
  })

  return [data, isLoading] as const
}

export const useFlowHistory = (id, limit: number, key: Uint8Array) => {
  const client = useIntentoRpcClient()
  const { data, isPending: isLoading } = useQuery({
    queryKey: [`flowHistory/${id}/${key}`],
    queryFn: async () => {
      if (!id || !client || !client.intento) {
        throw new Error('Invalid ID or client not available')
      }

      const pageRequest = PageRequest.fromPartial({
        limit: BigInt(limit),
        key,
        reverse: true,
        countTotal: true,
      })

      const flowHistoryResponse = await client.intento.intent.v1.flowHistory({
        id: id,
        pagination: pageRequest,
      })
      return flowHistoryResponse
    },
    enabled: !!id && !!client?.intento,
    refetchOnMount: false, // Prevent refetch on remount
    staleTime: 60000, // Cache data for 60 seconds
    gcTime: 300000, // Cache data for 5 minutes
  })

  return [data, isLoading] as const
}
