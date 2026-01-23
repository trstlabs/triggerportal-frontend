import { AppLayout, PageHeader } from 'components'

import {
  Card,
  CardContent,
  Column,
  ImageForTokenLogo,
  Inline,
  Text,
  styled,
} from 'components/ui-blocks'
import React from 'react'
import { TokenSendModule } from 'features/send'
// import Link from 'next/link'

import { useIBCAssetList } from '../../hooks/useChainList'

function getInitialTokenFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const token = params.get('token')
  return token ? (token as string) : undefined
}

const StyledContainer = styled('div', {
  maxWidth: '53.75rem',
  margin: '0 auto',
})

export default function Send() {
  const [ibcInfos, isLoading] = useIBCAssetList()
  //console.log("ibcInfos", ibcInfos.tokens[0].logoURI)
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Coin Streamer"
          subtitle={`Stream tokens, schedule ahead and make recurring transfers from Intento.`}
        />
        <TokenSendModule initialToken={getInitialTokenFromSearchParams()} />

        <a href={`/build?example=0`} target={'_blank'} rel="noreferrer">
          <Card variant="secondary" css={{ padding: '$8' }}>
            {' '}
            <CardContent size="medium">
              <Column align="center">
                <StyledText
                  variant="title"
                  align="center"
                  css={{ padding: '$8' }}
                >
                  Advanced{' '}
                </StyledText>
                <Column align="center">
                  <Inline css={{ justifyContent: 'center' }}>
                    {' '}
                    {!isLoading &&
                      ibcInfos.map((ibcInfo, index) => (
                        <div key={'x' + index}>
                          <StyledDivForTokenLogos>
                            <ImageForTokenLogo
                              size="big"
                              logoURI={ibcInfo.logo_uri}
                              alt={ibcInfo.symbol}
                            />
                          </StyledDivForTokenLogos>
                        </div>
                      ))}
                  </Inline>
                  <StyledText css={{ padding: '$8' }} variant="caption">
                    Build payment flows from your wallet on another
                    chain.
                    <br /> You control the flow on Intento using an
                    Interchain Account.
                  </StyledText>
                </Column>
              </Column>
            </CardContent>
          </Card>
        </a>
      </StyledContainer>
    </AppLayout>
  )
}

export const StyledDivForTokenLogos = styled('div', {
  display: 'flex',
  [`& ${ImageForTokenLogo}`]: {
    position: 'relative',
    zIndex: '$2',
    backgroundColor: '$transparent',

    marginLeft: '1.25rem',
  },
})

const StyledText: typeof Text = styled(Text, {
  paddingTop: '$3',
  paddingBottom: '$2',
  display: 'flex',
  alignItems: 'center',
  '& span': {
    width: 4,
    height: 4,
    margin: '0 $3',
    borderRadius: '50%',
    backgroundColor: '$textColors$primary',
  },
})
