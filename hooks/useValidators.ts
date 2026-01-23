import { useQuery } from '@tanstack/react-query'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo } from './useChainList'
import { ibcWalletState, walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useAtomValue } from 'jotai'
import { cosmos } from 'intentojs'

export const useValidators = (chainSymbol: string) => {
    // Get the IBC asset info for the chain
    const assetInfo = useIBCAssetInfo(chainSymbol) as IBCAssetInfo | undefined
    const { address: ibcAddress, status: ibcStatus } = useAtomValue(ibcWalletState)
    const { address: intoAddress, status: intoStatus } = useAtomValue(walletState)
    // Get the RPC endpoint from the asset info
    const rpcEndpoint = assetInfo?.rpc || process.env.NEXT_PUBLIC_INTO_RPC
    let address = intoAddress
    if (chainSymbol !== 'INTO') {
        address = ibcAddress
    }

    const { data, isPending: isLoading } = useQuery({
        queryKey: ['validators', chainSymbol, address],
        queryFn: async () => {
            if (!rpcEndpoint) {
                console.error(`No RPC endpoint found for chain: ${chainSymbol}`)
                return []
            }

            const client = await cosmos.ClientFactory.createRPCQueryClient({
                rpcEndpoint,
            })
            const response = await client.cosmos.staking.v1beta1.delegatorValidators({
                delegatorAddr: address,
                pagination: undefined,
            })
            const validators = response.validators.sort((a, b) => {
                return Number(a.tokens) - Number(b.tokens)
            })

            return validators
        },
        enabled: Boolean(assetInfo && rpcEndpoint && address && (intoStatus === WalletStatusType.connected || ibcStatus === WalletStatusType.connected)),
        refetchOnMount: 'always',
        refetchInterval: 60000,
    })

    return {
        validators: data || [],
        isLoading,
        getFirstValidator: () => data?.[0]?.operatorAddress
    }
}
