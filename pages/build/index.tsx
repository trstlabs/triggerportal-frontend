import { AppLayout, PageHeader } from 'components'
import React from 'react'
import { Text, styled } from 'components/ui-blocks'
import { BuildWrapper } from '../../features/build'

const StyledContainer = styled('div', {
  //maxWidth: '53.75rem',
  margin: '0 auto',
})

function getInitialExampleFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const example = params.get('example')
  return example ? (example as string) : undefined
}

function getInitialMessageFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const message = params.get('message')
  return message ? (message as string) : undefined
}

export default function Build() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Build"
          subtitle={
            <>
              Create Intento Flows on connected chains with condition-based logic.{' '}
              <Text as="a" href="https://docs.intento.zone/guides/portal/overview" target="_blank" variant="body" color="secondary">
                Learn more in the docs here.
              </Text>
            </>
          }
        />
        <BuildWrapper
          initialExample={getInitialExampleFromSearchParams()}
          initialMessage={getInitialMessageFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}
