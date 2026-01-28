import { AppLayout, PageHeader } from 'components'
import { AssetsList, TransferDialog } from 'features/assets'
import { useConnectIBCWallet } from 'hooks/useConnectIBCWallet'

import {
  Button,
  Error,
  IconWrapper,
  styled,
  Toast,
  UpRightArrow,
} from 'components/ui-blocks'
import React, { useEffect, useReducer } from 'react'
import { toast } from 'react-hot-toast'
import { useAtomValue } from 'jotai'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { useIBCAssetInfo } from '../../hooks/useIBCAssetInfo'

export default function Transfer() {
  const [
    { transactionKind, isTransferDialogShowing, selectedToken },
    updateState,
  ] = useReducer((store, updatedStore) => ({ ...store, ...updatedStore }), {
    transactionKind: 'deposit',
    isTransferDialogShowing: false,
    selectedToken: null,
  })

  function handleAssetCardFlowClick({ flowType, tokenSymbol }) {
    updateState({
      transactionKind: flowType,
      selectedToken: tokenSymbol,
      isTransferDialogShowing: true,
    })
  }

  function handleUpdateSelectedToken(tokenSymbol: string) {
    updateState({
      selectedToken: tokenSymbol,
    })
  }

  function handleTransferDialogClose() {
    updateState({ isTransferDialogShowing: false })
  }

  const { chain_id } = useIBCAssetInfo(selectedToken) || {}

  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    chain_id,
    {
      onError(error) {
        toast.custom((t) => (
          <Toast
            icon={<IconWrapper icon={<Error />} color="error" />}
            title={`Cannot get wallet address for ${selectedToken}`}
            body={error?.toString()}
            buttons={
              <Button
                as="a"
                variant="ghost"
                href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
                target="__blank"
                iconRight={<UpRightArrow />}
              >
                Provide feedback
              </Button>
            }
            onClose={() => toast.dismiss(t.id)}
          />
        ))
      },
    }
  )


  const { status } = useAtomValue(walletState)
  useEffect(() => {
    async function connectInternalAndExternalWallets() {
      if (status !== WalletStatusType.connected) {
        console.log('connect internal wallet first')
      }

      connectExternalWallet(null)
    }

    // connect wallet as soon as a token is selected
    if (selectedToken) {
      connectInternalAndExternalWallets()
    }
  }, [connectExternalWallet, selectedToken, status])

  return (
    <>
      <AppLayout>
        <StyledWrapper>
          <PageHeader
            title="IBC Transfer"
            subtitle="Easily transfer assets across IBC."
          />
          <AssetsList onFlowClick={handleAssetCardFlowClick} />
        </StyledWrapper>
      </AppLayout>
      {selectedToken && (
        <TransferDialog
          tokenSymbol={selectedToken}
          transactionKind={transactionKind}
          isShowing={isTransferDialogShowing}
          onTokenSelect={handleUpdateSelectedToken}
          onRequestClose={handleTransferDialogClose}
        />
      )}
    </>
  )
}

const StyledWrapper = styled('section', {
  paddingBottom: '$17',
})
