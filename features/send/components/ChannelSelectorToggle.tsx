
import {
  ButtonForWrapper,
  Chevron,

  IconWrapper,
  ImageForTokenLogo,
  styled,
} from 'components/ui-blocks'
import React from 'react'
import { getPropsForInteractiveElement } from 'util/getPropsForInteractiveElement'

type ChannelSelectorToggleProps = {
  isSelecting: boolean
  onToggle: () => void
  channel: string
  chainLogoURI: string
  chainName: string
  /*   availableAmount: number */
}

export const ChannelSelectorToggle = ({
  isSelecting,
  onToggle,
  chainLogoURI,
  chainName,
  /*   availableAmount, */
  channel,
}: ChannelSelectorToggleProps) => {

  const hasTokenSelected = Boolean(channel)

  return (
    <StyledDivForSelector
      state={isSelecting || !channel ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {(isSelecting || !hasTokenSelected) && (
        <>
          Select a Chain
          <IconWrapper
            size="large"
            rotation={channel ? '90deg' : '-90deg'}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
      {!isSelecting && hasTokenSelected && (
        <>
          <ImageForTokenLogo logoURI={chainLogoURI} size="big" alt={channel} />
          {chainName}
          <IconWrapper
            size="medium"
            rotation="-90deg"
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
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

  variants: {
    state: {
      selected: {
        padding: '$4 $6',
        columnGap: '$space$6',
        gridTemplateColumns: '$space$15 1fr $space$8',
        minWidth: 231,
      },
      selecting: {
        margin: '$space$1 0',
        padding: '$space$6 $8',
        columnGap: '$space$4',
        gridTemplateColumns: '1fr $space$8',
      },
    },
  },
})
