import {
  ButtonForWrapper,
  Chevron,
  IconWrapper,
  styled,
  Text,
} from 'components/ui-blocks'
import React from 'react'
import { getPropsForInteractiveElement } from '../../../../util/getPropsForInteractiveElement'

type MessageSelectorToggleProps = {
  isSelecting: boolean
  onToggle: () => void
  messageName: string
}

export const MessageSelectorToggle = ({
  isSelecting,
  onToggle,
  messageName,
}: MessageSelectorToggleProps) => {

  const hasMsgSelected = Boolean(messageName)

  return (
    <StyledDivForSelector
      state={isSelecting || !messageName ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {(isSelecting || !hasMsgSelected) && (
        <>
          <Text variant="body">Select a message</Text>
          <IconWrapper
            size="large"
            rotation={messageName ? '90deg' : '-90deg'}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
      {!isSelecting && hasMsgSelected && (
        <>
          <div>
            <Text variant="legend">Selected Message Type</Text>
            <Text variant="secondary">{messageName}</Text>
          </div>
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
  alignItems: 'center',
  justifyContent: 'space-between',
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
