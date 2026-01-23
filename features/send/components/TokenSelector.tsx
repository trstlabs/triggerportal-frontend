import { useTokenBalance } from 'hooks/useTokenBalance'
import {
  Button,
  IconWrapper,
  styled,
  Union,
  useOnClickOutside,

} from 'components/ui-blocks'
import React, { useRef, useState } from 'react'

import { QueryInput } from 'components//Input/QueryInput'

import { TokenSelectorToggle } from './TokenSelectorToggle'
import { TokenOptionsList } from './TokenOptionsList'

type TokenSelectorProps = {
  readOnly?: boolean
  disabled?: boolean
  tokenSymbol: string
  onChange: (token: { tokenSymbol }) => void
  size?: 'small' | 'large'
}

export const TokenSelector = ({
  readOnly,
  disabled,
  tokenSymbol,
  onChange,
  size = 'large',
}: TokenSelectorProps) => {
  const wrapperRef = useRef<HTMLDivElement>()
  const inputRef = useRef<HTMLInputElement>()

  const [isTokenListShowing, setTokenListShowing] = useState(false)

  const { balance: availableAmount } = useTokenBalance(tokenSymbol)
  const [tokenSearchQuery, setTokenSearchQuery] = useState('')
  const [isInputForSearchFocused, setInputForSearchFocused] = useState(false)


  const handleSelectToken = (selectedTokenSymbol) => {
    onChange({ tokenSymbol: selectedTokenSymbol })
    setTokenListShowing(false)
  }

  useOnClickOutside([wrapperRef], () => {
    setTokenListShowing(false)
  })

  if (size === 'small') {
    return (
      <div
      >
        <StyledDivForWrapper>
          <StyledDivForSelector>
            {isTokenListShowing && (
              <QueryInput
                searchQuery={tokenSearchQuery}
                onQueryChange={setTokenSearchQuery}
                onFocus={() => {
                  setInputForSearchFocused(true)
                }}
                onBlur={() => {
                  setInputForSearchFocused(false)
                }}
              />
            )}
            {!isTokenListShowing && (
              <TokenSelectorToggle
                availableAmount={availableAmount}
                tokenSymbol={tokenSymbol}
                isSelecting={isTokenListShowing}
                onToggle={
                  !disabled
                    ? () => setTokenListShowing((isShowing) => !isShowing)
                    : undefined
                }
              />
            )}

          </StyledDivForSelector>
          <StyledDivForAmountWrapper>
            {isTokenListShowing && (
              <Button
                icon={<IconWrapper icon={<Union />} />}
                variant="ghost"
                onClick={() => setTokenListShowing(false)}
                iconColor="tertiary"
              />
            )}
          </StyledDivForAmountWrapper>
          <StyledDivForOverlay

            onClick={() => {
              if (!readOnly) {
                if (isTokenListShowing) {
                  setTokenListShowing(false)
                } else {
                  inputRef.current?.focus()
                }
              }
            }}
          />
        </StyledDivForWrapper>
        {isTokenListShowing && (
          <TokenOptionsList
            activeTokenSymbol={tokenSymbol}
            onSelect={handleSelectToken}
            queryFilter={tokenSearchQuery}
            css={{ padding: '$4 $6 $12' }}
            emptyStateLabel={`No result for “${tokenSearchQuery}”`}
          />
        )}
      </div>
    )
  }

  return (
    <StyledDivForContainer
      selected={isInputForSearchFocused}
      ref={wrapperRef}
    >
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {isTokenListShowing && (
            <QueryInput
              searchQuery={tokenSearchQuery}
              onQueryChange={setTokenSearchQuery}
              onFocus={() => {
                setInputForSearchFocused(true)
              }}
              onBlur={() => {
                setInputForSearchFocused(false)
              }}
            />
          )}
          {!isTokenListShowing && (
            <TokenSelectorToggle
              availableAmount={availableAmount}
              tokenSymbol={tokenSymbol}
              isSelecting={isTokenListShowing}
              onToggle={
                !disabled
                  ? () => setTokenListShowing((isShowing) => !isShowing)
                  : undefined
              }
            />
          )}

        </StyledDivForSelector>
        <StyledDivForAmountWrapper>
          {isTokenListShowing && (
            <Button
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              onClick={() => setTokenListShowing(false)}
              iconColor="tertiary"
            />
          )}
        </StyledDivForAmountWrapper>
        <StyledDivForOverlay

          onClick={() => {
            if (!readOnly) {
              if (isTokenListShowing) {
                setTokenListShowing(false)
              } else {
                inputRef.current?.focus()
              }
            }
          }}
        />
      </StyledDivForWrapper>
      {isTokenListShowing && (
        <TokenOptionsList
          activeTokenSymbol={tokenSymbol}
          onSelect={handleSelectToken}
          queryFilter={tokenSearchQuery}
          css={{ padding: '$4 $6 $12' }}
          emptyStateLabel={`No result for “${tokenSearchQuery}”`}
        />
      )}
    </StyledDivForContainer>
  )
}

const StyledDivForWrapper = styled('div', {
  padding: '$5 $15 $5 $7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  zIndex: 0,
})

const StyledDivForSelector = styled('div', {
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
})

const StyledDivForAmountWrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  position: 'relative',
  zIndex: 1,
})

const StyledDivForOverlay = styled('div', {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  backgroundColor: '$colors$dark0',


})


const selectedVariantForInputWrapper = {
  true: {
    boxShadow: '0 0 0 $space$1 $borderColors$selected',
  },
  false: {
    boxShadow: '0 0 0 $space$1 $colors$dark0',
  },
}


const StyledDivForContainer = styled('div', {
  borderRadius: '$2',
  transition: 'box-shadow .1s ease-out',
  variants: {
    selected: selectedVariantForInputWrapper,
  },
})

