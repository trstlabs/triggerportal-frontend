import {
  ButtonForWrapper,
  ImageForTokenLogo,

  styled,
  Text,
} from 'components/ui-blocks'
import { ComponentPropsWithoutRef } from 'react'


import { getPropsForInteractiveElement } from '../../../util/getPropsForInteractiveElement'
import { SelectChainInfo } from '../../../types/trstTypes';

const StyledDivForScrollContainer = styled('div', {
  overflowY: 'scroll',
})

export class ChannelInfo {
  name: string;
  logoURI: string;
  channelID: string;
  denom: string;
  symbol: string
  connectionID: string;
  denom_local: string;
  prefix: string
}


export type ChannelSelectListProps = {
  activeChannel?: string
  channelList: Array<Pick<SelectChainInfo, 'channel' | 'chain_id' | 'prefix' | 'denom' | 'denom_local' | 'logo_uri' | 'name' | 'symbol' | 'connection_id'>>
  onSelect: (channelInfo: ChannelInfo) => void
  fetchingBalanceMode: 'native' | 'ibc'
  visibleNumberOfTokensInViewport?: number
} & ComponentPropsWithoutRef<typeof StyledDivForScrollContainer>

export const ChannelSelectList = ({
  activeChannel,
  channelList,
  onSelect,
  fetchingBalanceMode = 'native',
  visibleNumberOfTokensInViewport = 2.5,
  ...props
}: ChannelSelectListProps) => {



  function passChannel(selectedInfo) {
    let selectedChannel = new ChannelInfo();
    selectedChannel.channelID = selectedInfo.channel
    selectedChannel.name = selectedInfo.id
    selectedChannel.logoURI = selectedInfo.logo_uri
    selectedChannel.denom = selectedInfo.denom
    selectedChannel.denom_local = selectedInfo.denom_local
    selectedChannel.symbol = selectedInfo.symbol
    selectedChannel.connectionID = selectedInfo.connection_id
    selectedChannel.prefix = selectedInfo.prefix
    console.log(selectedChannel)
    return selectedChannel
  }

  return (
    <>


      <StyledDivForScrollContainer
        {...props}
        css={{
          height: `${visibleNumberOfTokensInViewport * 3.5}rem`,
          ...(props.css ? props.css : {}),
        }}
      >
        {channelList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={chainInfo.name}
              selected={chainInfo.channel === activeChannel}
              {...getPropsForInteractiveElement({
                onClick() {
                  onSelect(passChannel(chainInfo))
                },
              })}
            >
              <StyledDivForColumn kind="token">
                <ImageForTokenLogo
                  logoURI={chainInfo.logo_uri}
                  size="large"
                  alt={chainInfo.symbol}
                  loading="lazy"
                />
                <div data-token-info="">
                  <Text variant="body" >
                    {chainInfo.name}
                  </Text>
                </div>
              </StyledDivForColumn>
            </StyledButtonForRow>
          )
        })}

      </StyledDivForScrollContainer>
    </>
  )
}

const StyledButtonForRow = styled(ButtonForWrapper, {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$2 $4 !important',
  userSelect: 'none',
  cursor: 'pointer',
  marginBottom: '$1',
  '&:last-child': {
    marginBottom: 0,
  },
})

const StyledDivForColumn = styled('div', {
  display: 'grid',
  variants: {
    kind: {
      token: {
        columnGap: '$space$6',
        gridTemplateColumns: '50px 1fr',
        alignItems: 'center',
      },
      balance: {
        textAlign: 'right',
      },
    },
  },
})
