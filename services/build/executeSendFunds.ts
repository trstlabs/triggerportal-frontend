import { SigningStargateClient } from '@cosmjs/stargate'

import { Coin } from '@cosmjs/stargate'

type ExecuteSendFundsArgs = {
  fromAddress: string
  toAddress: string
  client: SigningStargateClient
  coin: Coin
}

export const executeSendFunds = async ({
  client,
  toAddress,
  fromAddress,
  coin,
}: ExecuteSendFundsArgs): Promise<any> => {

  return await client.sendTokens(fromAddress, toAddress, [coin], { amount: [], gas: "100000" })
}
