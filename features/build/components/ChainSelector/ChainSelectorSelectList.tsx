import {
  ButtonForWrapper,
  ImageForTokenLogo,
  Inline,
  RejectIcon,
  styled,
  Text,
} from 'components/ui-blocks'
import { ComponentPropsWithoutRef, useMemo, useState } from 'react'

import { SelectChainInfo } from '../../../../types/trstTypes'
import { getPropsForInteractiveElement } from '../../../../util/getPropsForInteractiveElement'
import { QueryInput } from './ChainSelectorQueryInput'

const StyledDivForScrollContainer = styled('div', {
  overflowY: 'scroll',
})

export class ChainInfo {
  chainId: string
  name: string
  logoURI: string
  connectionId: string
  hostConnectionId: string
  prefix: string
  denom: string
  trstDenom: string
  symbol: string
  union?: boolean
  universalId?: string
}

export type ChainSelectorListProps = {
  activeChain?: string
  icaChainList: Array<
    Pick<
      SelectChainInfo,
      | 'connection_id'
      | 'counterparty_connection_id'
      | 'chain_id'
      | 'symbol'
      | 'logo_uri'
      | 'name'
      | 'prefix'
      | 'denom'
      | 'denom_local'
      | 'id'
      | 'union'
      | 'universal_id'
    >
  >
  chainList: Array<
    Pick<
      SelectChainInfo,
      | 'connection_id'
      | 'counterparty_connection_id'
      | 'chain_id'
      | 'symbol'
      | 'logo_uri'
      | 'name'
      | 'prefix'
      | 'denom'
      | 'denom_local'
      | 'id'
      | 'union'
      | 'universal_id'
    >
  >
  onSelect: (connectionInfo: ChainInfo) => void
  fetchingBalanceMode: 'native' | 'ibc'
  visibleNumberOfChainsInViewport?: number
} & ComponentPropsWithoutRef<typeof StyledDivForScrollContainer>

export const ChainSelectorList = ({
  activeChain,
  chainList,
  icaChainList,
  onSelect,
  fetchingBalanceMode = 'native',
  visibleNumberOfChainsInViewport = 8.5,
  ...props
}: ChainSelectorListProps) => {
  const [queryFilter, setChainSearchQuery] = useState('')
  const [_isInputForSearchFocused, setInputForSearchFocused] = useState(false)

  function passChainInfo(selectedInfo) {
    let selectedChain = new ChainInfo()
    selectedChain.connectionId = selectedInfo.connection_id
    selectedChain.chainId = selectedInfo.chain_id
    selectedChain.hostConnectionId =
      selectedInfo.counterparty_connection_id
    selectedChain.name = selectedInfo.name
    selectedChain.logoURI = selectedInfo.logo_uri
    selectedChain.denom = selectedInfo.denom
    selectedChain.symbol = selectedInfo.symbol
    selectedChain.prefix = selectedInfo.prefix
    selectedChain.trstDenom = selectedInfo.denom_local
    selectedChain.union = selectedInfo.union
    selectedChain.universalId = selectedInfo.universal_id
    return selectedChain
  }

  const filteredChainList = useMemo(() => {
    if (!chainList || isQueryEmpty(queryFilter)) {
      return chainList
    }
    const lowerCasedQueryFilter = queryFilter.toLowerCase()
    return chainList
      .filter(({ denom, name }) => {
        return (
          denom.toLowerCase().search(lowerCasedQueryFilter) >= 0 ||
          name.toLowerCase().search(lowerCasedQueryFilter) >= 0
        )
      })
      .sort((chainA, chainB) => {
        if (
          chainA.denom.toLowerCase().startsWith(lowerCasedQueryFilter) ||
          chainA.name.toLowerCase().startsWith(lowerCasedQueryFilter)
        ) {
          return -1
        }
        if (
          chainB.denom.toLowerCase().startsWith(lowerCasedQueryFilter) ||
          chainB.name.toLowerCase().startsWith(lowerCasedQueryFilter)
        ) {
          return 1
        }
        return 0
      })
  }, [chainList, queryFilter])

  const filteredIcaChainList = useMemo(() => {
    if (!icaChainList || isQueryEmpty(queryFilter)) {
      return icaChainList
    }
    const lowerCasedQueryFilter = queryFilter.toLowerCase()
    return icaChainList
      .filter(({ denom, name }) => {
        return (
          denom.toLowerCase().search(lowerCasedQueryFilter) >= 0 ||
          name.toLowerCase().search(lowerCasedQueryFilter) >= 0
        )
      })
      .sort((chainA, chainB) => {
        if (
          chainA.denom.toLowerCase().startsWith(lowerCasedQueryFilter) ||
          chainA.name.toLowerCase().startsWith(lowerCasedQueryFilter)
        ) {
          return -1
        }
        if (
          chainB.denom.toLowerCase().startsWith(lowerCasedQueryFilter) ||
          chainB.name.toLowerCase().startsWith(lowerCasedQueryFilter)
        ) {
          return 1
        }
        return 0
      })
  }, [icaChainList, queryFilter])

  return (
    <>
      <QueryInput
        searchQuery={queryFilter}
        onQueryChange={setChainSearchQuery}
        onFocus={() => {
          setInputForSearchFocused(true)
        }}
        onBlur={() => {
          setInputForSearchFocused(false)
        }}
      />
      <StyledDivForScrollContainer
        {...props}
        css={{
          height: `${visibleNumberOfChainsInViewport * 2.5}rem`,
          ...(props.css ? props.css : {}),
        }}
      >
        <Text variant="legend" color="primary">
          Union Chains (ZKGM)
        </Text>{' '}
        {filteredIcaChainList
          .filter((chainInfo) => chainInfo.union)
          .map((chainInfo) => {
            return (
              <StyledButtonForRow
                role="listitem"
                variant="ghost"
                key={'unionChainList' + (chainInfo.connection_id || chainInfo.chain_id)}
                selected={chainInfo.name === activeChain}
                {...getPropsForInteractiveElement({
                  onClick() {
                    onSelect(passChainInfo(chainInfo))
                  },
                })}
              >
                <StyledDivForColumn>
                  <ImageForTokenLogo
                    logoURI={chainInfo.logo_uri}
                    size="large"
                    alt={chainInfo.denom}
                    loading="lazy"
                  />
                  <div data-chain-info="">
                    <Text variant="body">{chainInfo.name}</Text>
                  </div>
                </StyledDivForColumn>
              </StyledButtonForRow>
            )
          })}

        <div style={{ marginTop: '16px' }}>
          <Text variant="legend" color="primary">
            IBC Chains
          </Text>
        </div>{' '}
        {filteredIcaChainList
          .filter((chainInfo) => !chainInfo.union)
          .map((chainInfo) => {
            return (
              <StyledButtonForRow
                role="listitem"
                variant="ghost"
                key={'icaChainList' + chainInfo.connection_id}
                selected={chainInfo.name === activeChain}
                {...getPropsForInteractiveElement({
                  onClick() {
                    onSelect(passChainInfo(chainInfo))
                  },
                })}
              >
                <StyledDivForColumn>
                  <ImageForTokenLogo
                    logoURI={chainInfo.logo_uri}
                    size="large"
                    alt={chainInfo.denom}
                    loading="lazy"
                  />
                  <div data-chain-info="">
                    <Text variant="body">{chainInfo.name}</Text>
                  </div>
                </StyledDivForColumn>
              </StyledButtonForRow>
            )
          })}
        {/* <Text variant="legend">
          Other chains - send messages directly only
        </Text>{' '}
        {filteredChainList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={'chainList' + chainInfo.chain_id}
              selected={chainInfo.name === activeChain}
              {...getPropsForInteractiveElement({
                onClick() {
                  onSelect(passChainInfo(chainInfo))
                },
              })}
            >
              <StyledDivForColumn>
                <ImageForTokenLogo
                  logoURI={chainInfo.logo_uri}
                  size="large"
                  alt={chainInfo.denom}
                  loading="lazy"
                />
                <div data-chain-info="">
                  <Text variant="body">{chainInfo.name}</Text>
                </div>
              </StyledDivForColumn>
            </StyledButtonForRow>
          )
        })} */}
        {(filteredChainList?.length || filteredChainList?.length) === 0 && (
          <Inline gap={6} css={{ padding: '$5 $6' }}>
            <ImageForTokenLogo size="big">
              <RejectIcon color="tertiary" />
            </ImageForTokenLogo>
            <Text variant="secondary">not found</Text>
          </Inline>
        )}
      </StyledDivForScrollContainer>
    </>
  )
}

function isQueryEmpty(query: string) {
  return !query || !query.replace(new RegExp(' ', 'g'), '')
}

const StyledButtonForRow = styled(ButtonForWrapper, {
  //display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$4 $6 !important',
  userSelect: 'none',
  cursor: 'pointer',
  marginTop: '$4',
  marginBottom: '$4',
  '&:last-child': {
    marginBottom: 0,
  },
  fontSize: '33px',
})

const StyledDivForColumn = styled('div', {
  display: 'grid',
  columnGap: '$space$2',
  gridTemplateColumns: '50px 1fr',
  alignItems: 'center',
})
