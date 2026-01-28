import { SigningStargateClient, assertIsDeliverTxSuccess } from '@cosmjs/stargate'


import { MsgGrantAllowance } from "cosmjs-types/cosmos/feegrant/v1beta1/tx";

type ExecuteCreateFeeGrantArgs = {
  granter: string
  grantee: string
  allowance: any
  client: SigningStargateClient
}

export const executeCreateFeeGrant = async ({
  client,
  grantee,
  granter,
  allowance,
}: ExecuteCreateFeeGrantArgs): Promise<any> => {
  console.log(grantee)
  console.log(granter)

  const msgGrantAllowance = {
    typeUrl: "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
    value: MsgGrantAllowance.fromPartial({
      grantee, granter, allowance
    }),
  };
  // let converters = createFeegrantAminoConverters()
  // let aminoMsg = await msgFeeGrant.toProto()
  let response = await client.signAndBroadcast(granter, [msgGrantAllowance], "auto");
  console.log(response)

  return assertIsDeliverTxSuccess(response)
}
