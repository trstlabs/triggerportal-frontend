
import { intento } from 'intentojs'
import { SigningStargateClient } from '@cosmjs/stargate'
import { validateTransactionSuccess } from '../../util/validateTx'

type ExecuteClaimClaimableArgs = {
  address: string
  client: SigningStargateClient
}

export const executeClaimClaimable = async ({
  client,
  address
}: ExecuteClaimClaimableArgs): Promise<any> => {
  const claimMsg =
    intento.claim.v1.MessageComposer.withTypeUrl.claimClaimable({
      sender: address
    })

  return validateTransactionSuccess(
    await client.signAndBroadcast(
      address,
      [claimMsg],
      {
        amount: [],
        gas: '200000',
      },
      'Claim from Intento Portal'
    )
  )
}
