import { AppLayout } from 'components'
import {
  ButtonWithDropdownForSorting,
  SortDirections,
  SortParameters,
  useSortFlows,
} from '../features/flows'
import {
  Button,
  Column,
  ConnectIcon,
  IconWrapper,
  Inline,
  Spinner,
  styled,
  Text,
  Card,
  CardContent,
  useMedia,
  useControlTheme,
} from 'components/ui-blocks'
import { useCallback, useMemo, useState } from 'react'
import { useUpdateEffect } from 'react-use'
import { useFlows, useFlowsByOwner } from 'hooks/useFlow'
import { FlowCard } from '../features/flows/components/FlowCard'
import { useChain } from '@interchain-kit/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { APP_NAME } from '../util/constants'
import Head from 'next/head'

export default function Home() {
  const { address } = useChain(process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME)
  const flowsPerPage = 20;
  const [paginationKey, setPaginationKey] = useState<Uint8Array | undefined>(undefined)
  const [paginationHistory, setPaginationHistory] = useState<Uint8Array[]>([])
  const [allFlows, isLoading] = useFlows(Number(flowsPerPage), paginationKey)
  const [flows, isMyFlowsLoading] = useFlowsByOwner(Number(flowsPerPage), undefined)
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } = useSortControllers()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isMobile = useMedia('sm')
  // Handle pagination
  const handleNextPage = useCallback(() => {
    if (allFlows?.pagination?.nextKey) {
      setPaginationHistory(prev => [...prev, paginationKey])
      setPaginationKey(allFlows.pagination.nextKey)
    }
  }, [allFlows?.pagination?.nextKey, paginationKey])

  const handlePrevPage = useCallback(() => {
    if (paginationHistory.length > 0) {
      const newHistory = [...paginationHistory]
      const prevKey = newHistory.pop()
      setPaginationHistory(newHistory)
      setPaginationKey(prevKey)
    }
  }, [paginationHistory])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Clear pagination to go back to first page
    setPaginationKey(undefined)
    setPaginationHistory([])
    // Small delay to show loading state
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  const infoArgs = { infos: flows?.flows || [], address }
  const [myFlows, isSorting] = useSortFlows({
    infoArgs,
    sortBy: useMemo(
      () => ({
        parameter: sortParameter,
        direction: sortDirection,
      }),
      [sortParameter, sortDirection]
    ),
  })

  const shouldShowFetchingState = (isLoading || isRefreshing) && !allFlows?.flows.length && isMyFlowsLoading && !myFlows?.length
  const shouldRenderMyFlows = Boolean(myFlows?.length)
  const hasNextPage = Boolean(allFlows?.pagination?.nextKey)
  const hasPrevPage = paginationHistory.length > 0


  const FeatureBadge = styled('div', {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backdropFilter: 'blur(10px)',

    border: '1px solid rgba(255, 255, 255, 0.1)',
    variants: {
      variant: {
        primary: {
          backgroundColor: 'rgba(111, 168, 220, 0.2)',
          color: '#0369a1',
          '&:hover': {
            backgroundColor: 'rgba(111, 168, 220, 0.3)'
          }
        },
        success: {
          backgroundColor: 'rgba(147, 196, 125, 0.2)',
          color: '#166534',
          '&:hover': {
            backgroundColor: 'rgba(147, 196, 125, 0.3)'
          }
        },
        info: {
          backgroundColor: 'rgba(142, 124, 195, 0.2)',
          color: '#1e40af',
          '&:hover': {
            backgroundColor: 'rgba(142, 124, 195, 0.3)'
          }
        }
      }
    },
    defaultVariants: {
      variant: 'primary'
    },
    transition: 'all 0.2s ease-in-out'
  })

  const themeController = useControlTheme();
  const isDark = themeController.theme.name === 'dark';

  const badgeStyles = {
    primary: {
      light: {
        backgroundColor: 'rgba(111, 168, 220, 0.2)',
        color: '#0369a1',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      dark: {
        backgroundColor: 'rgba(30, 58, 138, 0.22)',
        color: '#e0e7ef',
        border: '1px solid rgba(111, 168, 220, 0.32)',
        boxShadow: '0 2px 10px 0 rgba(30,40,70,0.13)',
      }
    },
    success: {
      light: {
        backgroundColor: 'rgba(147, 196, 125, 0.2)',
        color: '#166534',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      dark: {
        backgroundColor: 'rgba(34,197,94,0.19)',
        color: '#d1fae5',
        border: '1px solid rgba(147, 196, 125, 0.32)',
        boxShadow: '0 2px 10px 0 rgba(34,197,94,0.09)',
      }
    },
    info: {
      light: {
        backgroundColor: 'rgba(142, 124, 195, 0.2)',
        color: '#1e40af',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      dark: {
        backgroundColor: 'rgba(124, 58, 237, 0.17)',
        color: '#ede9fe',
        border: '1px solid rgba(142, 124, 195, 0.32)',
        boxShadow: '0 2px 10px 0 rgba(124,58,237,0.09)',
      }
    }
  };

  const getBadgeStyles = (variant: string) =>
    badgeStyles[variant]?.[isDark ? 'dark' : 'light'] || {};

  const pageHeaderContents = (
    <Card css={{
      padding: '$8', marginBottom: '$10'
    }} variant="secondary" disabled >
      <CardContent>
        {APP_NAME && (
          <Head>
            <title>
              {APP_NAME} - Dashboard
            </title>
          </Head>
        )}
        <Text variant="header" css={{
          marginBottom: '$8',
          marginTop: '$8',
          fontSize: 24,
          fontFamily: '"Oceanwide", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontWeight: 700,
          letterSpacing: '-0.5px'
        }}>
          Orchestrate Anything. Any Action, Anywhere, Anytime.
        </Text>

        <Text variant="body" css={{ marginBottom: '$8', fontWeight: '500', color: '$textColors$secondary', fontSize: 14 }}>
          Supercharge your blockchain workflows with simple templates, real-time notifications, and easy integration.<br />
          Seamlessly connect, manage, and secure actions across any IBC-enabled chain. All in one place.
        </Text>
        <Inline gap={4} css={{ marginBottom: 32 }}>
          <FeatureBadge variant="primary" style={getBadgeStyles('primary')}>
            <span>✨</span> No-Code Automation
          </FeatureBadge>
          <FeatureBadge variant="success" style={getBadgeStyles('success')}>
            <span>🔔</span> Email Alerts
          </FeatureBadge>
          <FeatureBadge variant="info" style={getBadgeStyles('info')}>
            <span>🛡️</span> Self-Custodial
          </FeatureBadge>
          {!isMobile && <FeatureBadge variant="primary" style={getBadgeStyles('primary')}>
            <span>🦾</span> Trustless Agents
          </FeatureBadge>}
        </Inline>

        <Card variant="secondary" disabled css={{
          backgroundColor: '$colors$dark5',
          borderLeft: '4px solid $colors$primary',
          marginTop: '$6',
          marginBottom: '$6'
        }}>
          <CardContent>
            <Inline gap={4} align="flex-start" css={{ alignItems: 'flex-start', width: '100%' }}>
              <Text css={{ color: '$colors$primary' }}>💡</Text>
              <Text variant="caption" css={{ color: '$textColors$secondary', lineHeight: 1.6, marginTop: '$2' }}>
                Tip: Browse around and hit &apos;Copy and Create&apos; to quickly set up common flows like staking rewards,
                liquidity provision, or cross-chain swaps with just a few clicks.
              </Text>
            </Inline>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )

  return (
    <AppLayout>
      {pageHeaderContents}
      {shouldShowFetchingState && (
        <>
          <Column
            justifyContent="center"
            align="center"
            css={{ paddingTop: '$24' }}
          >
            <Spinner size={32} color="primary" />
          </Column>
        </>
      )}

      {shouldRenderMyFlows && (
        <>
          {Boolean(myFlows?.length) && (
            <><Inline>
              <Text variant="caption" css={{ padding: '$4' }}>
                {' '}
                {myFlows.length > 1 ? (
                  <span> Your Flows ({flows.total.toString()})</span>
                ) : (
                  <span> Your Flow (1)</span>
                )}
              </Text>
              <ButtonWithDropdownForSorting
                sortParameter={sortParameter}
                sortDirection={sortDirection}
                onSortParameterChange={setSortParameter}
                onSortDirectionChange={setSortDirection}
              />
            </Inline>
              <StyledDivForFlowsGrid>

                {myFlows.map((flow, index) => (
                  <FlowCard
                    key={index}
                    //structuredClone does not work on ios
                    flow={structuredClone(flow)}
                  />
                ))}
              </StyledDivForFlowsGrid>
            </>
          )}
        </>
      )
      }
      <StyledDivForFlowsGrid>
        <>
          {Boolean(allFlows?.flows.length) && (
            <Inline
              gap={4}
              css={{
                paddingTop: '$8',
                paddingBottom: '$6',
              }}
            >
              <Text variant="primary">
                Recent
                Flows
              </Text>
            </Inline>
          )
          }
          {!Boolean(allFlows?.flows.length) && allFlows?.flows?.length === 0 && !isMyFlowsLoading && !isLoading && !isRefreshing && !isSorting && (
            <Text variant="caption" css={{ padding: '$4' }}>
              {' '}
              No Flows found
            </Text>
          )}
        </>
      </StyledDivForFlowsGrid>
      {
        isMyFlowsLoading || isSorting && (
          <Column
            justifyContent="center"
            align="center"
            css={{ paddingTop: '$24' }}
          >
            <Inline gap={2}>
              <ConnectIcon color="secondary" />
              <Text variant="primary">{'Finding Flows...'}</Text>
            </Inline>
          </Column>
        )
      }
      <Column gap={4}>

        {(hasPrevPage || hasNextPage) && (
          <Inline >

            <Button
              variant="ghost"
              size="large"
              onClick={handleRefresh}
              disabled={isRefreshing}
              iconLeft={
                isRefreshing && (
                  <IconWrapper icon={<Spinner instant />} />
                )
              }
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="large"
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isRefreshing}
              iconLeft={
                isRefreshing ? (
                  <IconWrapper icon={<Spinner instant />} />
                ) : (
                  <IconWrapper icon={<ChevronLeft />} />
                )
              }
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="large"
              onClick={handleNextPage}
              disabled={!hasNextPage || isRefreshing}
              iconRight={
                isRefreshing ? (
                  <IconWrapper icon={<Spinner instant />} />
                ) : (
                  <IconWrapper icon={<ChevronRight />} />
                )
              }
            >
              Next
            </Button>

          </Inline>
        )}

        <StyledDivForFlowsGrid>
          {isLoading || isRefreshing ? (
            // Show placeholders while loading
            Array(16).fill(0).map((_, index) => (
              <FlowCard
                key={`placeholder-${index}`}
                flow={null}
                isMyFlow={false}
              />
            ))
          ) : allFlows?.flows?.length > 0 ? (
            // Show actual flows when loaded
            allFlows.flows.map((flow) => (
              <FlowCard
                key={`${flow.id}`}
                flow={flow}
                isMyFlow={flow.owner === address}
              />
            ))
          ) : (
            allFlows?.flows?.length === 0 && !isMyFlowsLoading && !isLoading && !isRefreshing && !isSorting && (
              // Show message when no flows found (only after loading is complete)
              <Column css={{ gridColumn: '1 / -1', textAlign: 'center', padding: '$12 $6' }}>
                <Text variant="secondary">No flows found</Text>
              </Column>
            )
          )}
        </StyledDivForFlowsGrid>

      </Column>

    </AppLayout >
  )
}

export const useSortControllers = () => {
  const storeKeyForParameter = '@flows/sort/parameter'
  const storeKeyForDirection = '@flows/sort/direction'

  const [sortParameter, setSortParameter] = useState<SortParameters>(
    () =>
      (localStorage.getItem(storeKeyForParameter) as SortParameters) ||
      'end_time'
  )
  const [sortDirection, setSortDirection] = useState<SortDirections>(
    () =>
      (localStorage.getItem(storeKeyForDirection) as SortDirections) || 'desc'
  )

  useUpdateEffect(() => {
    localStorage.setItem(storeKeyForParameter, sortParameter)
  }, [sortParameter])

  useUpdateEffect(() => {
    localStorage.setItem(storeKeyForDirection, sortDirection)
  }, [sortDirection])

  return {
    sortDirection,
    sortParameter,
    setSortDirection,
    setSortParameter,
  }
}

const StyledDivForFlowsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '$8',
  width: '100%',
  maxWidth: '100%',
  padding: '0 $6 $12 $6',
  boxSizing: 'border-box',

  // Default mobile styles (applies to all screen sizes unless overridden)
  '@media (max-width: 639px)': {
    gridTemplateColumns: '1fr',
    gap: '$8',
  },

  // Small screens (mobile) - adjust padding only
  '@media (min-width: 640px) and (max-width: 767px)': {
    padding: '0 $8 $12 $8',
    gridTemplateColumns: '1fr',
    gap: '$8',
  },

  // Medium screens (tablets) - 2 columns
  '@media (min-width: 768px) and (max-width: 1023px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '$8',
  },

  // Large screens (desktops) - 3 columns
  '@media (min-width: 1024px) and (max-width: 1279px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '$10',
  },

  // Extra large screens - 4 columns
  '@media (min-width: 1280px)': {
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '$12',
  },

  '& .spin': {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
})
