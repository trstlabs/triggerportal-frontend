import { CSS } from '@stitches/react'
import { useTokenBalance } from 'hooks/useTokenBalance'
import { useBaseTokenInfo } from 'hooks/useTokenInfo'
import {
  Button,
  Column,
  Copy,
  CopyTextTooltip,
  formatTokenBalance,
  IconWrapper,
  Logout,
  media,
  styled,
  Text,
  Tooltip,
  Valid, Connect,
} from 'components/ui-blocks'
import React from 'react'


import { useGetIBCAssetsBalances } from '../../features/assets/hooks/useGetSupportedAssetsBalances'

type WalletButtonProps = { css?: CSS } & {
  walletName?: string
  address: string
  onConnect: (sync) => void
  onClick: () => void
  onDisconnect: () => void
  connected: boolean
}

export const WalletButton = ({
  walletName,
  connected,
  address,
  onConnect,
  onClick,
  onDisconnect,
  ...props
}: WalletButtonProps) => {
  const baseToken = useBaseTokenInfo()

  const { balance } = useTokenBalance(baseToken?.symbol)



  const [loadingBalances, [ibcBalances, _]] =
    useGetIBCAssetsBalances()

  if (!connected) {
    return (
      <Column css={{ paddingBottom: '$6' }}>
        <Button onClick={onConnect} size="large" variant="secondary" {...props}>
          Connect Intento Wallet
        </Button>
      </Column>
    )
  }

  return (
    <StyledWalletButton {...props} role="button">
      <IconWrapper size="medium" css={{ color: '#4da1ff' }} icon={<Connect />} />
      <div data-content="" onClick={onClick} style={{ cursor: "pointer" }} >
        <Text variant="link" color="body">
          {walletName}
        </Text>
        <Text
          variant="legend"
          css={{
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            backgroundImage:
              'linear-gradient(90deg, #4da1ff, #7fc7ff, #4da1ff)'
          }}
        >
          {formatTokenBalance(balance.toFixed(2), { includeCommaSeparation: true })}{' '}
          {baseToken?.symbol}
        </Text>
        {!loadingBalances && ibcBalances?.map((balance, i) =>
          <Text key={"bal" + i}
            variant="legend"
            css={{
              '-webkit-background-clip': 'text',
              '-webkit-text-fill-color': 'transparent',
              backgroundImage:
                'linear-gradient(90deg, #4da1ff, #7fc7ff, #4da1ff)'
            }}
          >
            {formatTokenBalance(balance.balance.toFixed(2), { includeCommaSeparation: true })}{' '}
            {balance.tokenSymbol}
          </Text>
        )}
      </div>
      <StyledDivForFlows>
        <StyledDivForInlineFlows>
          <CopyTextTooltip
            label="Copy wallet address"
            successLabel="Wallet address copied!"
            ariaLabel="Copy wallet address"
            value={address}
          >
            {({ copied, ...bind }) => (
              <Button
                variant="ghost"
                size="small"
                icon={<IconWrapper icon={copied ? <Valid /> : <Copy />} />}
                {...bind}
              />
            )}
          </CopyTextTooltip>
          <Tooltip
            label="Disconnect your wallet"
            aria-label="Disconnect your wallet"
          >
            <Button
              variant="ghost"
              size="small"
              onClick={onDisconnect}
              icon={<IconWrapper icon={<Logout />} />}
            />
          </Tooltip>
        </StyledDivForInlineFlows>
      </StyledDivForFlows>
    </StyledWalletButton >
  )
}

const StyledDivForFlows = styled('div', {
  position: 'absolute',
  right: 0,
  top: 0,
  padding: '0 $6 0 $8',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  borderRadius: '$2',
  transition: 'opacity .1s ease-out',
})

const StyledDivForInlineFlows = styled('div', {
  display: 'flex',
  columnGap: '$space$2',
})

const StyledWalletButton = styled('div', {
  position: 'relative',
  transition: 'background-color .1s ease-out, border .1s ease-out',
  display: 'flex',
  alignItems: 'center',
  columnGap: '$space$6',
  padding: '$4 $6 $5',
  borderRadius: '$2',
  backgroundColor: '$colors$dark5',
  textAlign: 'left',

  '&:hover': {
    border: '1px solid $borderColors$selected',
    [`${StyledDivForFlows}`]: {
      opacity: 10,
    },
  },
  [media.sm]: {
    border: '1px solid $borderColors$selected',
    [`${StyledDivForFlows}`]: {
      opacity: 1,
    },
  },
})
