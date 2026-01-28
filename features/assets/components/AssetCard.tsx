import { useIBCAssetInfo } from 'hooks/useIBCAssetInfo'
// import { useTokenDollarValue } from 'hooks/useTokenDollarValue'
import {
  ArrowUpIcon,
  Button,
  // dollarValueFormatterWithDecimals,
  ImageForTokenLogo,
  styled,
  Text,
} from 'components/ui-blocks'
import { HTMLProps, useState } from 'react'
import { __TRANSFERS_ENABLED__ } from 'util/constants'

import { DepositRedirectDialog } from './DepositRedirectDialog'

export enum AssetCardState {
  fetching = 'FETCHING',
  active = 'ACTIVE',
}

type AssetCardProps = Exclude<HTMLProps<HTMLDivElement>, 'children'> & {
  tokenSymbol?: string
  onFlowClick?: (args: {
    tokenSymbol: string
    flowType: 'deposit' | 'withdraw'
  }) => void
  balance?: number
  state?: AssetCardState
}

export const AssetCard = ({
  tokenSymbol,
  onFlowClick,
  balance,
  state,
  ...htmlProps
}: AssetCardProps) => {
  const { symbol, logo_uri, external_deposit_uri } =
    useIBCAssetInfo(tokenSymbol) || {}
  const [showingRedirectDepositDialog, setShowingRedirectDepositDialog] =
    useState(false)

  //const [dollarValue] = useTokenDollarValue(tokenSymbol)

  const shouldPerformDepositOutsideApp = Boolean(external_deposit_uri)

  const handleDepositClick = () => {
    // bail early if redirecting the user to perform deposit externally
    if (shouldPerformDepositOutsideApp) {
      return setShowingRedirectDepositDialog(true)
    }

    onFlowClick({
      tokenSymbol: symbol,
      flowType: 'deposit',
    })
  }

  const handleWithdrawClick = () =>
    onFlowClick({
      tokenSymbol: symbol,
      flowType: 'withdraw',
    })

  if (state === AssetCardState.fetching) {
    return (
      <StyledElementForCard {...(htmlProps as any)} kind="wrapper">
        <StyledElementForCard kind="content">
          <StyledElementForToken>
            <ImageForTokenLogo size="big" />
          </StyledElementForToken>
        </StyledElementForCard>
        <div />
      </StyledElementForCard>
    )
  }

  const rendersActiveAppearance = balance > 0

  return (
    <>
      <StyledElementForCard
        active={rendersActiveAppearance}
        {...(htmlProps as any)}
        kind="wrapper"
      >
        <StyledElementForCard kind="content">
          <StyledElementForToken>
            <ImageForTokenLogo logoURI={logo_uri} size="big" />
            <div>
              <Text variant="primary">
                {rendersActiveAppearance ? balance : null} {tokenSymbol}
              </Text>
              {/* {rendersActiveAppearance && (
                <Text variant="caption" css={{ paddingTop: '$1' }}>
                  $
                  {dollarValueFormatterWithDecimals(dollarValue * balance, {
                    includeCommaSeparation: true,
                  })}
                </Text>
              )} */}
            </div>
          </StyledElementForToken>
        </StyledElementForCard>

        <StyledElementForCard kind="flows">
          {shouldPerformDepositOutsideApp ? (
            <Button
              disabled={!__TRANSFERS_ENABLED__}
              onClick={handleDepositClick}
              iconRight={<ArrowUpIcon />}
              variant="ghost"
            >
              Transfer
            </Button>
          ) : (
            <>
              {balance > 0 && (
                <Button
                  disabled={!__TRANSFERS_ENABLED__}
                  onClick={
                    __TRANSFERS_ENABLED__ ? handleWithdrawClick : undefined
                  }
                  iconRight={<ArrowUpIcon />}
                  variant="ghost"
                >
                  Withdraw
                </Button>
              )}
              <Button
                disabled={!__TRANSFERS_ENABLED__}
                onClick={__TRANSFERS_ENABLED__ ? handleDepositClick : undefined}
                iconRight={<ArrowUpIcon />}
                variant="ghost"
              >
                Deposit
              </Button>
            </>
          )}
        </StyledElementForCard>
      </StyledElementForCard>

      {shouldPerformDepositOutsideApp && (
        <DepositRedirectDialog
          isShowing={showingRedirectDepositDialog}
          onRequestClose={() => setShowingRedirectDepositDialog(false)}
          tokenSymbol={tokenSymbol}
          href={external_deposit_uri}
        />
      )}
    </>
  )
}

const StyledElementForCard = styled('div', {
  variants: {
    kind: {
      wrapper: {
        background: '$colors$dark10',
        borderRadius: '18px',
        padding: '$12 $16',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      },
      content: {
        display: 'grid',
        gridAutoFlow: 'column',
        columnGap: '$space$10',
        position: 'relative',
        zIndex: 1,
      },
      flows: {
        display: 'grid',
        gridAutoFlow: 'column',
        columnGap: '$space$6',
        position: 'relative',
        zIndex: 1,
      },
    },
    active: {
      true: {
        boxShadow: '$light',
        border: '1px solid $borderColors$default',
        backgroundColor: '$base',
      },
    },
  },
})

const StyledElementForToken = styled('div', {
  display: 'grid',
  gridAutoFlow: 'column',
  columnGap: '$6',
  alignItems: 'center',
})
