import { AppLayout, NavigationSidebar } from 'components'

import {
    Button,
    ChevronIcon,
    Spinner,
    styled,
    useMedia,
    Text
} from 'components/ui-blocks'
import Head from 'next/head'
import Link from 'next/link'

import React from 'react'
import { APP_NAME } from 'util/constants'

import { useClaimRecord, useTotalClaimable } from '../../hooks/useClaimRecord'
// import ViewAirdropEligibility from '../../features/claim/components/eligibility'

export default function Claim() {
    const isMobile = useMedia('sm')

    const [claimRecord, isLoading] = useClaimRecord()

    const [total] = useTotalClaimable()
    if (isLoading) {
        return (
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
                {' '}
                <title>Claim</title>
                <StyledDiv>
                    <Spinner color="primary" size={32} />
                </StyledDiv>
            </AppLayout>
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
                {APP_NAME && claimRecord != "" && (
                    <Head>
                        <title>
                            {APP_NAME} — Airdrop
                        </title>
                    </Head>
                )}


                {claimRecord == "" && (
                    <StyledDiv>
                        <Text variant="legend">
                            <>Claiming currently not available for connected address. </>
                        </Text>{' '}

                    </StyledDiv>

                )}
                {claimRecord != "" && !claimRecord &&
                    <StyledDiv>
                        <Text variant="legend">
                            <>Connect an address to view your claim amount. </>
                        </Text>{' '}
                    </StyledDiv>

                }

                {claimRecord && total && (
                    process.env.NEXT_PUBLIC_AIRDROP_ENABLED == "true" &&

                    {/* <ViewAirdropEligibility claimRecord={claimRecord} claimRecordLoaded={!isLoading && !isTotalLoading} total={Number(total)} /> */ }


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
