import {
  ButtonForWrapper,
  Chevron,
  IconWrapper,
  ImageForTokenLogo,
  styled,
  Text,
} from 'components/ui-blocks'
import React from 'react'
import { getPropsForInteractiveElement } from 'util/getPropsForInteractiveElement'

type ChainSelectorToggleProps = {
  isSelecting: boolean
  onToggle: () => void
  chainLogoURI: string
  chainName: string
}

export const ChainSelectorToggle = ({
  isSelecting,
  onToggle,
  chainLogoURI,
  chainName,
}: ChainSelectorToggleProps) => {
  const chainSelected = Boolean(chainName) && Boolean(chainLogoURI)
  const iconRotation = chainName ? '90deg' : '-90deg'

  const renderContent = () => {
    if (isSelecting || !chainSelected) {
      return (
        <>
          <Text variant="body">Select a chain</Text>
          <IconWrapper
            size="large"
            rotation={iconRotation}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )
    } else {
      return (
        <>
          <ImageForTokenLogo
            logoURI={chainLogoURI}
            size="big"
            alt={chainName}
          />
          <Text variant="body">{chainName}</Text>
          <IconWrapper
            size="medium"
            rotation="-90deg"
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )
    }
  }

  return (
    <StyledDivForSelector
      state={isSelecting || !chainName ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {renderContent()}
    </StyledDivForSelector>
  )
}

const StyledDivForSelector = styled(ButtonForWrapper, {
  cursor: 'pointer',
  display: 'grid',
  alignItems: 'center',
  backgroundColor: '$colors$dark0',
  borderRadius: '$1',
  transition: 'background-color .1s ease-out',
  userSelect: 'none',
  whiteSpace: 'pre',
  marginTop: '$4',
  marginBottom: '$4',
  variants: {
    state: {
      selected: {
        padding: '$4 $6',
        columnGap: '$space$6',
        gridTemplateColumns: '$space$15 1fr $space$8',
        minWidth: 231,
      },
      selecting: {
        padding: '$space$6 $8',
        columnGap: '$space$4',
        gridTemplateColumns: '1fr $space$8',
      },
    },
  },
})
