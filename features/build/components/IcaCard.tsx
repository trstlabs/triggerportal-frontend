import {
  Card,
  Spinner,
  CardContent,
  Tooltip,
  Button,
  Text,
  Chevron,
  IconWrapper,
  Divider,
  useMedia,
  convertDenomToMicroDenom,
} from 'components/ui-blocks'
import React, { useEffect, useMemo, useState } from 'react'
import { Row, StyledInput } from './BuildComponent'

import { useAuthZMsgGrantInfoForUser } from '../../../hooks/useICA'
import { useCreateAuthzGrant } from '../hooks'
import { FlowInput } from '../../../types/trstTypes'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

interface IcaCardProps {
  icaAddress: string
  chainSymbol: string
  feeFundsHostChain: string
  icaBalance: number
  isIcaBalanceLoading: boolean
  shouldDisableSendHostChainFundsButton: boolean
  isExecutingSendFundsOnHost: boolean
  chainId: string
  hostDenom: string
  flowInput: FlowInput
  setFeeFundsHostChain: (fees: string) => void
  handleSendFundsOnHostClick: () => void
}

export const IcaCard = ({
  icaAddress,
  chainSymbol,
  feeFundsHostChain,
  icaBalance,
  isIcaBalanceLoading,
  shouldDisableSendHostChainFundsButton,
  isExecutingSendFundsOnHost,
  chainId,
  hostDenom,
  flowInput,
  setFeeFundsHostChain,
  handleSendFundsOnHostClick,
}: IcaCardProps) => {
  const [showICAInfo, setShowICAInfo] = useState(false)
  const isMobile = useMedia('sm')

  // ICA funds
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    chainId,
    {
      onError(error) {
        console.log(error)
      },
    },
    false
  )


  const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
  const [requestedSendAndAuthzGrant, setRequestedSendAndAuthzGrant] = useState(false)
  const { grants: icaAuthzGrants, isLoading: isAuthzGrantsLoading } = useAuthZMsgGrantInfoForUser(
    icaAddress,
    flowInput
  )
  const { mutate: handleCreateAuthzGrant, isPending: isExecutingAuthzGrant } =
    useCreateAuthzGrant({
      grantee: icaAddress,
      grantInfos: icaAuthzGrants
        ? icaAuthzGrants.filter((grant) => grant.hasGrant == false)
        : [],
      coin: requestedSendAndAuthzGrant
        ? {
          denom: hostDenom,
          amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString(),
        }
        : undefined,
    })
  const handleTriggerEffect = (shouldTrigger, handler, resetStateSetter) => {
    if (shouldTrigger) {
      handler(undefined, { onSettled: () => resetStateSetter(false) })
    }
  }

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingAuthzGrant && requestedAuthzGrant,
        handleCreateAuthzGrant,
        () => {
          setRequestedSendAndAuthzGrant(false)
          setRequestedCreateAuthzGrant(false)
        }
      ),
    [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant]
  )

  const handleCreateAuthzGrantClick = (withFunds: boolean) => {
    connectExternalWallet(null)
    setRequestedCreateAuthzGrant(true)
    if (withFunds) {
      setRequestedSendAndAuthzGrant(true)
    }
  }


  const shouldDisableAuthzGrantButton = useMemo(
    () => icaAuthzGrants?.every((grant) => grant.hasGrant),
    [icaAuthzGrants]
  )

  return (
    <>
      <Button
        variant="ghost"
        css={{ margin: '$2 $1' }}
        size="medium"
        onClick={() => setShowICAInfo((showICAInfo) => !showICAInfo)}
        iconRight={
          showICAInfo ? (
            <IconWrapper
              size="medium"
              rotation="90deg"
              color="tertiary"
              icon={<Chevron />}
            />
          ) : (
            <IconWrapper
              size="medium"
              rotation="-90deg"
              color="tertiary"
              icon={<Chevron />}
            />
          )
        }
      >
        <Text variant="body">
          {' '}
          {showICAInfo ? <span>Hide</span> : <span>View</span>} Interchain
          Account Details{' '}
        </Text>
      </Button>

      {showICAInfo && (
        <>
          <Divider offsetY="$4" />
          <Text variant="legend"> Address </Text>
          {isMobile ? (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {icaAddress.substring(0, 33) + '..'}
            </Text>
          ) : (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {icaAddress}
            </Text>
          )}
          {icaBalance &&
            (!isIcaBalanceLoading ? (
              <>
                {' '}
                <Text variant="legend"> Balance </Text>{' '}
                <Text css={{ padding: '$4' }} variant="caption">
                  {' '}
                  {icaBalance} {chainSymbol}
                </Text>
              </>
            ) : (
              <Spinner instant />
            ))}
          {icaAuthzGrants != undefined && <><Text variant="legend"> Grants</Text>
            {isAuthzGrantsLoading && !icaAuthzGrants ? (
              <Spinner />
            ) : (
              <>
                {icaAuthzGrants && icaAuthzGrants[0] && icaAuthzGrants.map((grant, index) =>
                  grant.hasGrant ? (
                    <Text key={index} css={{ padding: '$4' }} variant="caption">
                      {' '}
                      ✓ Interchain Account is granted for type: {
                        grant.msgTypeUrl
                      }{' '}
                      {grant.expiration && (
                        <span> and expires on {grant.expiration.toLocaleString()}</span>
                      )}
                    </Text>
                  ) : (
                    <Text css={{ padding: '$4' }} variant="caption">
                      {' '}
                      ✘ Interchain Account is not granted for type:{' '}
                      {grant.msgTypeUrl}{' '}
                    </Text>
                  )
                )}
              </>
            )}
          </>}
          {!shouldDisableAuthzGrantButton && (
            <>
              <Card
                variant="secondary"
                disabled
                css={{ padding: '$4', margin: '$4' }}
              >
                <CardContent>
                  <Tooltip
                    label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution Error."
                    aria-label="Fee Funds"
                  >
                    <Text variant="legend"> Top up</Text>
                  </Tooltip>
                  <Row>
                    <Text variant="caption">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFundsHostChain}
                        onChange={({ target: { value } }) =>
                          setFeeFundsHostChain(value)
                        }
                      />
                      {chainSymbol}
                    </Text>
                    <Button
                      css={{ margin: '$2' }}
                      variant="secondary"
                      size="small"
                      disabled={shouldDisableSendHostChainFundsButton}
                      onClick={() => handleSendFundsOnHostClick()}
                    >
                      {isExecutingSendFundsOnHost ? (
                        <Spinner instant />
                      ) : (
                        'Send'
                      )}
                    </Button>
                  </Row>
                </CardContent>
              </Card>
              <Row>
                {icaAuthzGrants && (
                  <>
                    <Tooltip
                      label="An AuthZ grant allows the Interchain Account to execute a message on behalf of your account. By sending this message you grant the Interchain Account to execute messages for 1 year based on the specified TypeUrls"
                      aria-label="Fee Funds"
                    >
                      <Button
                        css={{ margin: '$2' }}
                        variant="secondary"
                        size="small"
                        disabled={shouldDisableAuthzGrantButton}
                        onClick={() => handleCreateAuthzGrantClick(false)}
                      >
                        {isExecutingAuthzGrant &&
                          !requestedSendAndAuthzGrant ? (
                          <Spinner instant />
                        ) : (
                          'Create AuthZ Grant'
                        )}
                      </Button>
                    </Tooltip>
                    <Button
                      css={{ marginTop: '$8', margin: '$2' }}
                      variant="secondary"
                      size="small"
                      disabled={
                        shouldDisableSendHostChainFundsButton ||
                        (shouldDisableAuthzGrantButton &&
                          Number(feeFundsHostChain) != 0)
                      }
                      onClick={() => handleCreateAuthzGrantClick(true)}
                    >
                      {isExecutingAuthzGrant && requestedSendAndAuthzGrant ? (
                        <Spinner instant />
                      ) : (
                        'AuthZ Grant + Send'
                      )}
                    </Button>
                  </>
                )}
              </Row>
            </>
          )}
        </>
      )}
    </>
  )
}
