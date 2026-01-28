import { AppLayout, NavigationSidebar } from 'components'
import { FlowBreakdown } from '../../features/flows'
import {
  Button,
  ChevronIcon,
  Inline,
  Spinner,
  styled,
  useMedia,
  Text,
} from 'components/ui-blocks'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { APP_NAME } from 'util/constants'
import { useFlow } from '../../hooks/useFlow'
import { useIBCAssetInfoFromConnection } from '../../hooks/useIBCAssetInfo'
import { useGetTrustlessAgentICAByTrustlessAgentAddress } from '../../hooks/useICA'

export default function Flow() {
  const {
    query: { id },
  } = useRouter()

  const isMobile = useMedia('sm')

  const [flow, isLoading] = useFlow(id)
  const [trustlessAgentICA, _isTrustlessAgentICALoading] = useGetTrustlessAgentICAByTrustlessAgentAddress(flow?.trustlessAgent?.agentAddress)

  const connectionId = flow ? (
    flow.selfHostedIca?.connectionId && flow.selfHostedIca.connectionId !== ''
      ? flow.selfHostedIca.connectionId
      : flow.trustlessAgent && trustlessAgentICA?.icaConfig?.connectionId
        ? trustlessAgentICA.icaConfig.connectionId
        : ''
  ) : ''

  //can speed up connection id retrieval or display
  // const connectionId = flow ? (
  //   flow.trustlessAgent?.connectionId && flow.trustlessAgent.connectionId !== ''
  //     ? flow.trustlessAgent.connectionId
  //     : flow.selfHostedIca?.connectionId && flow.selfHostedIca.connectionId !== ''
  //       ? flow.selfHostedIca.connectionId
  //       : trustlessAgentICA?.icaConfig?.connectionId || ''

  const ibcInfo = useIBCAssetInfoFromConnection(connectionId)

  if (!id) {
    return (
      <Inline
        align="center"
        justifyContent="center"
        css={{ padding: '$10', height: '100vh' }}
      >
        {' '}
        <title>Flow</title>
        {/*  {isLoading && (
          <Text variant="header">
            {"Oops, we've messed up. Please try again later."}
          </Text>
        ) : ( */}
        <Spinner color="primary" />
        {/*      )} */}
      </Inline>
    )
  }

  return (
    <>
      <AppLayout
        navigationSidebar={
          <NavigationSidebar
            shouldRenderBackButton={isMobile}
            backButton={
              <Link href="#" passHref>
                <Button as="a" variant="ghost" icon={<ChevronIcon />} />
              </Link>
            }
          />
        }
      >
        {APP_NAME && flow != undefined && (
          <Head>
            <title>
              {APP_NAME} — Flow {flow.label || flow.id}
            </title>
          </Head>
        )}

        {(isLoading) && (
          <StyledDiv>
            <Spinner color="primary" size={32} />
          </StyledDiv>
        )}

        {!isLoading && flow && flow.feeAddress &&
          <FlowBreakdown flow={flow} ibcInfo={ibcInfo} />
        }
        {!isLoading && !flow && (
          <StyledDiv>
            <Text variant="legend">
              <>Flow not found yet in this space continuum 🌌 </>
            </Text>{' '}
          </StyledDiv>
        )}
      </AppLayout>
    </>
  )
}

const StyledDiv = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 143,
})
