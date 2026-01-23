import { Button, IconWrapper, styled, Union } from 'components/ui-blocks'
import React, { useRef, useState, useEffect, forwardRef } from 'react'
import { useAtomValue } from 'jotai'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { useConnectIBCWallet } from '../../../../hooks/useConnectIBCWallet'

import { ChainSelectorToggle } from './ChainSelectorToggle'
import { ChainSelectorDialog } from './ChainSelectorDialog'
import { ChainInfo } from './ChainSelectorSelectList'
import { useIBCAssetList } from '../../../../hooks/useChainList'


type ChainSelectorProps = {
  disabled?: boolean
  onChange: (ChainInfo: ChainInfo) => void
  initialChainId?: string
  chainId?: string
}

export const ChainSelector = forwardRef<HTMLDivElement, ChainSelectorProps>((
  {
    disabled,
    onChange,
    initialChainId,
  }, ref
) => {
  const ibcWallet = useAtomValue(ibcWalletState)

  const [isChainListShowing, setChainListShowing] = useState(false)
  const [selectedChain, setSelectedChain] = useState(new ChainInfo())
  const { mutate: connectExternalWallet } = useConnectIBCWallet(selectedChain?.chainId, {})
  const wrapperRef = useRef()

  const [icaAssetList] = useIBCAssetList() // This uses ibc_assets.json

  // Replace the chainRegistryList with icaAssetList for the initial selection
  useEffect(() => {
    if (initialChainId && !selectedChain.logoURI && icaAssetList.length > 0) {
      const matchingChain = icaAssetList.find(
        chain => chain.chain_id === initialChainId
      )

      if (matchingChain) {
        const chainInfo = new ChainInfo()
        chainInfo.chainId = matchingChain.chain_id
        chainInfo.connectionId = matchingChain.connection_id || ''
        chainInfo.hostConnectionId =/*  matchingChain.host_connection_id ||  */''
        chainInfo.name = matchingChain.name
        chainInfo.logoURI = matchingChain.logo_uri
        chainInfo.denom = matchingChain.denom
        chainInfo.symbol = matchingChain.symbol
        chainInfo.prefix = matchingChain.prefix
        chainInfo.trstDenom = matchingChain.denom_local || ''

        setSelectedChain(chainInfo)
        onChange(chainInfo)
      }
    }
  }, [initialChainId, icaAssetList, onChange])

  const handleSelectChain = (chainInfo: ChainInfo) => {
    setSelectedChain(chainInfo)
    onChange(chainInfo)
    setChainListShowing(false)
  }

  const toggleChainList = () => {
    if (!disabled) setChainListShowing(!isChainListShowing)
  }

  // Show connect button if there's an error with the IBC wallet
  if (ibcWallet.status === WalletStatusType.error && ibcWallet.chainId) {
    return (
      <StyledDivForContainer ref={ref || wrapperRef}>
        <Button
          variant="ghost"
          size="large"
          onClick={() => connectExternalWallet()}
          css={{ width: '100%' }}
        >
          Connect to {selectedChain.name || 'Chain'}
        </Button>
      </StyledDivForContainer>
    )
  }

  return (
    <StyledDivForContainer ref={ref || wrapperRef}>
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {!isChainListShowing && (
            <ChainSelectorToggle
              chainLogoURI={selectedChain.logoURI}
              chainName={selectedChain.name}
              isSelecting={isChainListShowing}
              onToggle={toggleChainList}
            />
          )}
        </StyledDivForSelector>
        <StyledDivForButton>
          {isChainListShowing && (
            <Button
              css={{ padding: '$0 $0 $0' }}
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              size="small"
              onClick={() => handleSelectChain(new ChainInfo())}
              iconColor="tertiary"
            />
          )}
        </StyledDivForButton>
      </StyledDivForWrapper>
      {isChainListShowing && (
        <ChainSelectorDialog
          activeChain={selectedChain.name}
          onSelect={(slct) => handleSelectChain(slct)}
          css={{ padding: '$2 $4 $2' }}
        />
      )}
    </StyledDivForContainer>
  )
})

const sharedStyles = {
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
}

const StyledDivForWrapper = styled('div', {
  padding: '$4 $10 $4 $6',
  justifyContent: 'space-between',
  ...sharedStyles,
})

const StyledDivForSelector = styled('div', sharedStyles)

const StyledDivForButton = styled('div', {
  justifyContent: 'flex-end',
  ...sharedStyles,
})

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  transition: 'box-shadow .1s ease-out',
})
