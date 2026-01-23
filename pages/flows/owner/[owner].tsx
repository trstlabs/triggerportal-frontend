import { AppLayout, PageHeader } from 'components'
import { Button, Column, IconWrapper, Inline, media, Spinner, styled, Text } from 'components/ui-blocks'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { useFlowsByOwner } from 'hooks/useFlow'
import { FlowCard } from '../../../features/flows/components/FlowCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'


export default function FlowsByOwner() {
  const router = useRouter()
  const { owner } = router.query
  const flowsPerPage = 20
  const [paginationKey, setPaginationKey] = useState<Uint8Array | undefined>(undefined)
  const [paginationHistory, setPaginationHistory] = useState<Uint8Array[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [allFlows, isLoading] = useFlowsByOwner(flowsPerPage, paginationKey, owner as string)
  const filteredFlows = allFlows?.flows || []

  const shouldShowFetchingState = (isLoading || isRefreshing) && filteredFlows.length === 0
  const hasNextPage = Boolean(allFlows?.pagination?.nextKey && allFlows.pagination.nextKey.length > 0 && filteredFlows.length > 0)
  const hasPrevPage = paginationHistory.length > 0

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
    setPaginationKey(undefined)
    setPaginationHistory([])
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  return (
    <AppLayout>
      <PageHeader
        title="Your Flows"
        subtitle={
          <>
            View all flows created by {typeof owner === 'string' ? `${owner.substring(0, 10)}...${owner.slice(-4)}` : '...'}
          </>
        }
      />

      {shouldShowFetchingState ? (
        <Column justifyContent="center" align="center" css={{ paddingTop: '$24' }}>
          <Spinner size={32} color="primary" />
        </Column>
      ) : (
        <>
          {(hasPrevPage || hasNextPage) && (
            <Inline gap={4} css={{ marginBottom: '$8' }}>
              <Button
                variant="ghost"
                size="large"
                onClick={handleRefresh}
                disabled={isRefreshing}
                iconLeft={
                  isRefreshing ? (
                    <IconWrapper icon={<Spinner instant />} />
                  ) : null
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
              Array(8).fill(0).map((_, index) => (
                <FlowCard
                  key={`placeholder-${index}`}
                  flow={null}
                />
              ))
            ) : filteredFlows.length > 0 ? (
              filteredFlows.map((flow, index) => (
                <FlowCard
                  key={`${flow.id}-${index}`}
                  flow={flow}
                />
              ))
            ) : (
              <Column css={{ gridColumn: '1 / -1', textAlign: 'center', padding: '$12 $6' }}>
                <Text variant="secondary">No flows found for this address</Text>
              </Column>
            )}
          </StyledDivForFlowsGrid>
        </>
      )}
    </AppLayout>
  )
}

const StyledDivForFlowsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  gap: '$8',
  width: '100%',
  '@media (max-width: 1360px)': {
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  },
  [media.sm]: {
    gridTemplateColumns: '1fr',
  },
})
