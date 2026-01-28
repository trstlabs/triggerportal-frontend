
import {
  Button,
  IconWrapper,
  Inline,
  styled,
  Union,
  useOnClickOutside,

} from 'components/ui-blocks'
import React, { useRef, useState } from 'react'

import { ChannelSelectorToggle } from './ChannelSelectorToggle'
import { ChannelOptionsList } from './ChannelOptionsList'
import { ChannelInfo } from './ChannelSelectList'


type ChannelSelectorProps = {
  readOnly?: boolean
  disabled?: boolean
  channel: string
  onChange: (channelInfo: ChannelInfo) => void
  size?: 'small' | 'large'
}

export const ChannelSelector = ({
  readOnly,
  disabled,
  channel,
  onChange,
  size = 'large',
}: ChannelSelectorProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isChannelListShowing, setChannelListShowing] = useState(false)

  const [chainLogoURI, setChainLogoURI] = useState('')
  const [chainName, setChainName] = useState('')


  const handleSelectChannel = (channelInfo: ChannelInfo) => {
    setChainLogoURI(channelInfo.logoURI)
    setChainName(channelInfo.name)
    onChange(channelInfo)

    setChannelListShowing(false)
  }

  useOnClickOutside([wrapperRef], () => {
    setChannelListShowing(false)
  })

  if (size === 'small') {
    return (
      <StyledDivForContainer
        ref={wrapperRef}
      >
        {!isChannelListShowing && (
          <Inline css={{ padding: '$6 $4', display: 'grid' }}>
            <ChannelSelectorToggle
              channel={channel}
              chainLogoURI={chainLogoURI}
              chainName={chainName}
              isSelecting={isChannelListShowing}
              onToggle={
                !disabled
                  ? () => setChannelListShowing((isShowing) => !isShowing)
                  : undefined
              }
            />
          </Inline>
        )}
        {isChannelListShowing && (
          <ChannelOptionsList
            activeChannel={channel}
            onSelect={(slct) => handleSelectChannel(slct)}
            css={{ padding: '$4 $6 $12' }}


            visibleNumberOfTokensInViewport={4.5}
          />
        )}
      </StyledDivForContainer>
    )
  }

  return (
    <StyledDivForContainer
      ref={wrapperRef}

    >
      <StyledDivForWrapper>
        <StyledDivForSelector>

          {!isChannelListShowing && (
            <ChannelSelectorToggle
              channel={channel}
              chainLogoURI={chainLogoURI}
              chainName={chainName}
              isSelecting={isChannelListShowing}
              onToggle={
                !disabled
                  ? () => setChannelListShowing((isShowing) => !isShowing)
                  : undefined
              }
            />
          )}

        </StyledDivForSelector>
        <StyledDivForAmountWrapper>
          {isChannelListShowing && (
            <Button css={{ padding: '$0 $0 $0' }}
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              size="small"
              onClick={() => handleSelectChannel(new ChannelInfo)}
              iconColor="tertiary"
            />
          )}
        </StyledDivForAmountWrapper>
        <StyledDivForOverlay
          onClick={() => {
            if (!readOnly) {
              if (isChannelListShowing) {
                setChannelListShowing(false)
              } else {
                inputRef.current?.focus()
              }
            }
          }}
        />
      </StyledDivForWrapper>
      {isChannelListShowing && (
        <ChannelOptionsList
          activeChannel={channel}
          onSelect={(slct) => handleSelectChannel(slct)}
          css={{ padding: '$4 $6 $4' }}
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
  transition: 'background-color .1s ease-out',

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

