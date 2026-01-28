import { CSS } from '@stitches/react'
import { Logo } from 'icons'
import { ConnectIcon, IconWrapper, styled, Text } from 'components/ui-blocks'
import { useAtomValue } from 'jotai'
import { ibcWalletState, walletState } from 'state/atoms/walletAtoms'

export const WalletInfo = ({ label, icon, address, css }) => {
  return (
    <StyledDivForWrapper css={css}>
      {icon}
      <div>
        <Text variant="primary">{label}</Text>
        <StyledDivForAddressRow>
          <ConnectIcon color="secondary" size="medium" />
          <Text truncate={true} variant="legend">
            {address || "address wasn't identified yet"}
          </Text>
        </StyledDivForAddressRow>
      </div>
    </StyledDivForWrapper>
  )
}

type WalletInfoProps = {
  css?: CSS
  depositing?: boolean
}

export const KeplrWalletInfo = ({ css, depositing }: WalletInfoProps) => {
  const { address: ibcWalletAddress } = useAtomValue(ibcWalletState)

  return (
    <WalletInfo
      css={css}
      label={`${depositing ? 'To ' : ''}Keplr wallet`}
      icon={<StyledImgForIcon src="/img/keplr-icon.png" alt="Keplr wallet" />}
      address={ibcWalletAddress}
    />
  )
}

export const AppWalletInfo = ({ css, depositing }: WalletInfoProps) => {
  const { address: walletAddress } = useAtomValue(walletState)

  return (
    <WalletInfo
      css={css}
      label={`${depositing ? 'To ' : ''} Intento`}
      icon={<IconWrapper color="secondary" size="big" icon={<Logo />} />}
      address={walletAddress}
    />
  )
}

const StyledDivForWrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  columnGap: '$space$10',
})

const StyledDivForAddressRow = styled('div', {
  columnGap: '$space$2',
  display: 'flex',
  alignItems: 'center',
})

const StyledImgForIcon = styled('img', {
  width: 32,
  height: 32,
})
