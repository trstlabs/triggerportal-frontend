import { Coin } from '@cosmjs/stargate'
import { SigningClient } from '@interchain-kit/react'
// import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
// import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import { EncodeObject } from 'intentojs'

type ExecuteCreateAuthzGrantArgs = {
  granter: string
  grantee: string
  typeUrls: string[]
  expirationDurationMs?: number
  client: SigningClient
  coin?: Coin
}

export const executeCreateAuthzGrant = async ({
  client,
  grantee,
  granter,
  typeUrls,
  expirationDurationMs,
  coin,
}: ExecuteCreateAuthzGrantArgs): Promise<any> => {
  const msgObjects: EncodeObject[] = []
  if (!expirationDurationMs) {
    throw new Error('expirationDurationMs must be provided')
  }

  const expirationMs = Date.now() + expirationDurationMs
  console.log(expirationMs / 1000 / 60)
  for (const typeUrl of typeUrls) {
    // Amino path: expiration is Date, authorization is plain JS object
    msgObjects.push({
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
      value: {
        granter,
        grantee,
        grant: {
          authorization: {
            '@type': '/cosmos.authz.v1beta1.GenericAuthorization',
            msg: typeUrl,
          },
          expiration: new Date(expirationMs),
        },
      },
    })
  }

  // Optional MsgSend
  if (coin && Number(coin.amount) > 0) {
    msgObjects.push({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.fromPartial({
        fromAddress: granter,
        toAddress: grantee,
        amount: [coin],
      }),
    })
  }

  return client.signAndBroadcast(granter, msgObjects, {
    gas: msgObjects.length === 0 ? '100000' : '150000',
    amount: [],
  })
}
