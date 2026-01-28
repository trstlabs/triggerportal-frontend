import { AppLayout } from 'components'
import { Button, Column, IconWrapper, Inline, media, Spinner, styled, Text } from 'components/ui-blocks'
import { useCallback, useState } from 'react'
import { useFlows } from 'hooks/useFlow'
import { FlowCard } from '../../features/flows/components/FlowCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Flows() {
  const flowsPerPage = 20;
  const [paginationKey, setPaginationKey] = useState<Uint8Array | undefined>(undefined)
  const [paginationHistory, setPaginationHistory] = useState<Uint8Array[]>([])
  const [allFlows, isLoading] = useFlows(flowsPerPage, paginationKey)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const shouldShowFetchingState = (isLoading || isRefreshing) && !allFlows?.flows.length

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

  const hasNextPage = Boolean(allFlows?.pagination?.nextKey)
  const hasPrevPage = paginationHistory.length > 0

  return (
    <AppLayout>
      <Column css={{ paddingBottom: '$16' }}>
        <Text variant="header" css={{ marginBottom: '$8', fontSize: 24 }}>
          Recent Flows
        </Text>
        <Text variant="body" css={{ marginBottom: '$12', color: '$textColors$secondary' }}>
          View all flows on the Intento blockchain
        </Text>
      </Column>

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
              // Show placeholders while loading
              Array(8).fill(0).map((_, index) => (
                <FlowCard
                  key={`placeholder-${index}`}
                  flow={null}
                />
              ))
            ) : allFlows?.flows?.length > 0 ? (
              // Show actual flows when loaded
              allFlows.flows.map((flow, index) => (
                <FlowCard
                  key={`${flow.id}-${index}`}
                  flow={structuredClone(flow)}
                />
              ))
            ) : (
              // Show message when no flows found
              <Column css={{ gridColumn: '1 / -1', textAlign: 'center', padding: '$12 $6' }}>
                <Text variant="secondary">No flows found</Text>
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
