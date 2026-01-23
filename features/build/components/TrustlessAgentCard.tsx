import {
  Spinner,
  Button,
  Text,
  Chevron,
  IconWrapper,
  useMedia,
  Divider,
} from 'components/ui-blocks'
import React, { useEffect, useState } from 'react'
import { convertFromMicroDenom, convertMicroDenomToDenom } from '../../../util/conversion'
import { useAuthZMsgGrantInfoForUser } from '../../../hooks/useICA'
import { useCreateAuthzGrant } from '../hooks'
import { FlowInput } from '../../../types/trstTypes'
import { TrustlessAgent } from 'intentojs/dist/codegen/intento/intent/v1/trustless_agent'
import { useIBCAssetList } from '../../../hooks/useChainList' // <-- import hook

interface TrustlessAgentCardProps {
  trustlessAgent: TrustlessAgent
  trustlessAgentICAAddress: string
  flowInput: FlowInput
}

export const TrustlessAgentCard = ({
  trustlessAgent,
  trustlessAgentICAAddress,
  flowInput
}: TrustlessAgentCardProps) => {
  const [showICAInfo, setShowICAInfo] = useState(false)
  const isMobile = useMedia('sm')


  const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)

  const { grants: authzGrants, isLoading: isAuthzGrantsLoading } = useAuthZMsgGrantInfoForUser(
    trustlessAgentICAAddress,
    flowInput
  )
  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
    useCreateAuthzGrant({
      grantee: trustlessAgentICAAddress,
      grantInfos: authzGrants
        ? authzGrants.filter((grant) => !grant.hasGrant)
        : [],
      coin: undefined
    }) || {};
  const handleTriggerEffect = (shouldTrigger, handler, resetStateSetter) => {
    if (shouldTrigger) {
      handler(undefined, { onSettled: () => resetStateSetter(false) })
    }
  }
  // Get denom_local from asset list
  const [ibcAssets] = useIBCAssetList();
  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingAuthzGrant && requestedAuthzGrant,
        handleCreateAuthzGrant,
        () => {
          //  setRequestedSendAndAuthzGrant(false)
          setRequestedCreateAuthzGrant(false)
        }
      ),
    [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant]
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
          {showICAInfo ? <span>Hide</span> : <span>View</span>} Execution Details{' '}
        </Text>
      </Button>

      {showICAInfo && (
        <>
          <Text variant="legend">Address</Text>
          {isMobile ? (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {trustlessAgentICAAddress.substring(0, 33) + '..'}
            </Text>
          ) : (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {trustlessAgentICAAddress}
            </Text>
          )}
          <Divider offsetY="$4" />
          <Text variant="legend">Fee Per Execution</Text>


          {trustlessAgent.feeConfig.feeCoinsSupported.map((coin, coinIndex) => {

            const asset = ibcAssets.find(asset => asset.denom_local.toLowerCase() === coin.denom.toLowerCase());
            return (
              <span key={coinIndex}>
                <Text wrap={true} css={{ padding: '$4' }} variant="caption">
                  {convertMicroDenomToDenom(coin.amount, asset?.decimals)}
                  {asset && asset.denom_local && asset.denom_local.toLowerCase() === coin.denom.toLowerCase() ? ` ${asset.symbol}` : convertFromMicroDenom(coin.denom)}
                </Text>
              </span>
            );
          })}


          {
            isAuthzGrantsLoading && (
              <Spinner />
            )
          }

          {!isAuthzGrantsLoading && authzGrants && authzGrants.length > 0 && (
            <>
              <Divider offsetY="$4" />
              <Text variant="legend">Grants</Text>
              {authzGrants.map((grant, index) =>
                grant.hasGrant ? (
                  <Text key={"hkey" + index} css={{ padding: '$4' }} variant="caption">
                    {' '}
                    ✓ Trustless Agent is granted for type: {
                      grant.msgTypeUrl
                    }{' '}
                    {grant.expiration && (
                      <span> and expires on {grant.expiration.toLocaleString()}</span>
                    )}
                  </Text>
                ) : (
                  <Text css={{ padding: '$4' }} variant="caption">
                    {' '}
                    ✘ Trustless Agent is not granted for type:{' '}
                    {grant.msgTypeUrl}{' '}
                  </Text>
                )
              )}
            </>
          )}

        </>
      )}
    </>
  )
}
