import { AppLayout, NavigationSidebar, PageHeader } from 'components'

import {
    Button,
    ChevronIcon,
    useMedia,

} from 'components/ui-blocks'
import Link from 'next/link'

import React from 'react'
import { TokenomicsCard } from '../../features/dashboard/components/TokenomicsCard'

export default function Claim() {
    const isMobile = useMedia('sm')


    const shouldShowAutoCompound = true



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
                <PageHeader
                    title="Statistics"
                    subtitle={<>
                        Statistics on Intento tokenomics, usage and more. {" "} Read more about the INTO token {" "}
                        <Link href="https://docs.intento.zone/getting-started/into-token" as="a" passHref target="_blank" color="primary">
                            <span style={{ fontWeight: 'bold' }}> here.</span>
                        </Link>
                    </>
                    }
                />

                <TokenomicsCard shouldShowAutoCompound={shouldShowAutoCompound} />

            </AppLayout>
        </>
    )
}
