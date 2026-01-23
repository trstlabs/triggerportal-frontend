import {
  ButtonForWrapper,
  Chevron,
  formatTokenBalance,
  IconWrapper,
  ImageForTokenLogo,
  styled,
  Text,
} from 'components/ui-blocks'
import React from 'react'
import { getPropsForInteractiveElement } from 'util/getPropsForInteractiveElement'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'

type TokenSelectorToggleProps = {
  isSelecting: boolean
  onToggle: () => void
  tokenSymbol: string
  availableAmount: number
}

export const TokenSelectorToggle = ({
  isSelecting,
  onToggle,
  availableAmount,
  tokenSymbol,
}: TokenSelectorToggleProps) => {
  const { logo_uri } = useIBCAssetInfo(tokenSymbol) || {}

  const formattedAvailableAmount = formatTokenBalance(availableAmount, {
    includeCommaSeparation: true,
  })

  const hasTokenSelected = Boolean(tokenSymbol)

  return (<><Text css={{ marginRight: '$4' }}>Token</Text>
    <StyledDivForSelector
      state={isSelecting || !tokenSymbol ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {(isSelecting || !hasTokenSelected) && (
        <>
          <Text variant="body">Select a token</Text>
          <IconWrapper
            size="large"
            rotation={tokenSymbol ? '90deg' : '-90deg'}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
      {!isSelecting && hasTokenSelected && (
        <>
          <ImageForTokenLogo logoURI={logo_uri} size="big" alt={tokenSymbol} />
          <div>
            <Text variant="body">{tokenSymbol}</Text>
            <Text variant="secondary">
              {formattedAvailableAmount} available
            </Text>
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
  </>)
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
