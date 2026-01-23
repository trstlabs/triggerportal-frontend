import {
  Button,
  IconWrapper,
  Inline,
  styled,
  Union,
  useOnClickOutside,
} from 'components/ui-blocks'
import React, { useRef, useState } from 'react'

import { QueryInput } from 'components//Input/QueryInput'

type FlowsProps = {
  readOnly?: boolean
  disabled?: boolean
  // codeId: number
  onChange: (token: { codeId; }) => void
  size?: 'small' | 'large'
}

export const Flows = ({
  readOnly,
  // codeId,
  size = 'large',
}: FlowsProps) => {
  const wrapperRef = useRef<HTMLDivElement>()
  const inputRef = useRef<HTMLInputElement>()
  // const infos = useFlows(codeId)
  const [isFlowListShowing, setFlowListShowing] = useState(false)

  // const { balance: availableAmount } = useTokenBalance(tokenSymbol)
  const [tokenSearchQuery, setTokenSearchQuery] = useState('')
  const [isInputForSearchFocused, setInputForSearchFocused] = useState(false)
  const [isInputForAmountFocused, _] = useState(false)


  useOnClickOutside([wrapperRef], () => {
    setFlowListShowing(false)
  })

  if (size === 'small') {
    return (
      <StyledDivForContainer
        selected={isInputForSearchFocused}
        ref={wrapperRef}
      >
        {isFlowListShowing && (
          <Inline justifyContent="space-between" css={{ padding: '$5 $6' }}>
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
            <Button
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              onClick={() => setFlowListShowing(false)}
              iconColor="tertiary"
            />
          </Inline>
        )}

      </StyledDivForContainer>
    )
  }

  return (
    <StyledDivForContainer
      selected={isInputForAmountFocused || isInputForSearchFocused}
      ref={wrapperRef}
    >
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {isFlowListShowing && (
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

        </StyledDivForSelector>
        <StyledDivForAmountWrapper>
          {isFlowListShowing && (
            <Button
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              onClick={() => setFlowListShowing(false)}
              iconColor="tertiary"
            />
          )}


        </StyledDivForAmountWrapper>
        <StyledDivForOverlay
          interactive={readOnly ? false : !isInputForAmountFocused}
          onClick={() => {
            if (!readOnly) {
              if (isFlowListShowing) {
                setFlowListShowing(false)
              } else {
                inputRef.current?.focus()
              }
            }
          }}
        />
      </StyledDivForWrapper>

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
  backgroundColor: '$backgroundColors$base !important',
  transition: 'background-color .1s ease-out',
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '$colors$dark5',
        },
      },
    },
  },
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
  borderRadius: '$4',
  transition: 'box-shadow .1s ease-out',
  variants: {
    selected: selectedVariantForInputWrapper,
  },
})

