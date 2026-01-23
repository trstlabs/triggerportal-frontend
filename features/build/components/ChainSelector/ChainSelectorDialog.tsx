import {
  ChainSelectorList,
  ChainSelectorListProps,
} from './ChainSelectorSelectList'
import {
  useIBCAssetList,
  useChainRegistryList,
} from '../../../../hooks/useChainList'

import { Dialog } from 'components/ui-blocks'

export const ChainSelectorDialog = ({
  activeChain,
  onSelect,
  ...props
}: Omit<
  ChainSelectorListProps,
  'chainList' | 'icaChainList' | 'fetchingBalanceMode'
>) => {
  const chainList = useChainRegistryList()

  const [icaChainList] = useIBCAssetList()
  //useConnectChains(chainList)

  return (
    <Dialog isShowing={true} onRequestClose={undefined}>

      <ChainSelectorList
        {...props}
        icaChainList={
          icaChainList && icaChainList.filter((chain) => chain.chain_id)
        }
        chainList={
          chainList &&
          chainList.filter(
            (chain) =>
              chain.id &&
              !icaChainList.find(
                (icaChain) => chain.chain_id == icaChain.chain_id
              )
          )
        }
        activeChain={activeChain}
        onSelect={onSelect}
        fetchingBalanceMode="native"
      />
    </Dialog>
  )
}
