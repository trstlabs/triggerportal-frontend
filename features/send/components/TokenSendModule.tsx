
import { styled, useMedia, } from 'components/ui-blocks'
import { useEffect, useRef, useState } from 'react'

import { useAtomValue } from 'jotai'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'


import { RecipientInfo, RecipientList } from './RecipientList'

import { TokenSelector } from './TokenSelector'
import { useIBCAssetList } from '../../../hooks/useChainList'


type TokenSendModuleProps = {
  /* will be used if provided on first render instead of internal state */
  initialToken?: string
}

export const TokenSendModule = ({ initialToken }: TokenSendModuleProps) => {
  /* connect to recoil */
  const [tokenSymbol, setToken] = useState('')

  const transactionStatus = useAtomValue(transactionStatusState)

  const [tokenRecipientList, setTokenRecipientList] = useState([new RecipientInfo()])

  /* fetch token list and set initial state */
  const [tokenList, isTokenListLoading] = useIBCAssetList()
  useEffect(() => {
    const shouldSetDefaultTokenState =
      !tokenSymbol && tokenList
    if (shouldSetDefaultTokenState) {
      setToken("INTO")
    }
  }, [tokenList, setToken])

  const initialTokenValue = useRef(initialToken).current
  useEffect(
    function setInitialTokenIfProvided() {
      if (initialTokenValue) {
        const tokenSymbol = initialTokenValue
        setToken(
          tokenSymbol,

        )
      }
    },
    [initialTokenValue, setToken]
  )

  const isUiDisabled =
    transactionStatus === TransactionStatus.EXECUTING || isTokenListLoading
  const uiSize = useMedia('sm') ? 'small' : 'large'


  return (
    <> <StyledDivForWrapper>
      <StyledDivForWrapper>
        <TokenSelector
          tokenSymbol={tokenSymbol}
          onChange={(updateToken) => {
            setToken(updateToken.tokenSymbol)
          }}
          disabled={isUiDisabled}
          size={uiSize}
        />

      </StyledDivForWrapper>
      <RecipientList recipients={tokenRecipientList} tokenSymbol={tokenSymbol}
        // onTokenSymbolChange={(symbol) => setToken(symbol)}
        onRecipientsChange={((newRecipients) => setTokenRecipientList(newRecipients))}
        onRemoveRecipient={(recipient) => setTokenRecipientList(tokenRecipientList.filter(item => item !== recipient))}
      />
    </StyledDivForWrapper>
    </>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
