import 'normalize.css'
import 'styles/globals.scss'
import 'focus-visible'
import '@interchain-ui/react/styles'
import '../features/build/components/Editor/rjsfform.css'
import { ErrorBoundary } from 'components/ErrorBoundary'
import { TestnetDialog } from 'components/TestnetDialog'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from 'services/queryClient'
// Try-catch for JSON import to catch any parsing errors
let ibcAssetList: IBCAssetInfo[] = [];
try {
  const assetList = require('public/ibc_assets.json');

  ibcAssetList = assetList;
} catch (error) {
  console.error('Failed to load ibc_assets.json:', error);
}

import { NextJsAppRoot } from '../components/NextJsAppRoot'
import { __TEST_MODE__ } from '../util/constants'

import { ChainProvider, InterchainWalletModal } from '@interchain-kit/react'

import { keplrWallet } from "@interchain-kit/keplr-extension";
import { metaMaskWallet } from "@interchain-kit/metamask-extension";

import { ledgerWallet } from "@interchain-kit/ledger";

import { assetLists, chains } from 'chain-registry'
import {
  GlobalDecoderRegistry,
} from 'intentojs'

// import { GasPrice } from '@cosmjs/stargate';
import { css, media } from 'components/ui-blocks'
import { SignerOptions, WCWallet } from '@interchain-kit/core'
import { useEffect, useState, Suspense } from 'react';

import Head from 'next/head';
import { IBCAssetInfo } from '../hooks/useChainList'
import { InfoDialog } from '../components/InfoDialog'


// FOR AMINO SIGNING Workaround
// Message type detection patterns
const MESSAGE_PATTERNS = [
  {
    typeUrl: "/cosmos.authz.v1beta1.MsgExec",
    detect: (obj: any) => obj.grantee && Array.isArray(obj.msgs)
  },
  {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    detect: (obj: any) => obj.fromAddress && obj.toAddress && Array.isArray(obj.amount)
  },
  {
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    detect: (obj: any) => obj.delegatorAddress && obj.validatorAddress && obj.amount
  },
  {
    typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    detect: (obj: any) => obj.delegatorAddress && obj.validatorAddress && !obj.amount
  },
  // Add more patterns as needed
];

function addTypeUrlIfMissing(obj: any): void {
  if (!obj || typeof obj !== 'object' || obj.$typeUrl) {
    return;
  }

  for (const pattern of MESSAGE_PATTERNS) {
    if (pattern.detect(obj)) {
      obj.$typeUrl = pattern.typeUrl;
      console.log(`Added $typeUrl: ${pattern.typeUrl}`);

      // Recursively handle nested msgs arrays
      if (Array.isArray(obj.msgs)) {
        obj.msgs.forEach(addTypeUrlIfMissing);
      }
      break;
    }
  }
}

// Patch fromPartial
const originalFromPartial = GlobalDecoderRegistry.fromPartial;
GlobalDecoderRegistry.fromPartial = function (object: any) {
  addTypeUrlIfMissing(object);
  return originalFromPartial.call(this, object);
};

// Patch getDecoderByInstance
const originalGetDecoderByInstance = GlobalDecoderRegistry.getDecoderByInstance;
GlobalDecoderRegistry.getDecoderByInstance = function (obj: any) {
  addTypeUrlIfMissing(obj);
  return originalGetDecoderByInstance.call(this, obj);
};

// END FOR AMINO SIGNING Workaround

const toasterClassName = css({
  [media.sm]: {
    width: '100%',
    padding: 0,
    bottom: '$6 !important',
  },
}).toString();

// Initialize WalletConnect (optional)
const walletConnect = new WCWallet(undefined, {
  metadata: {
    name: "Intento Portal",
    description: "Intento Portal",
    url: "https://intento.zone",
    icons: ["https://intento.zone/assets/images/icon.png"],
  },
});


const wallets = [keplrWallet, walletConnect, metaMaskWallet, ledgerWallet]
var chainList = chains
function IntentoPortalApp({ Component, pageProps }: AppProps) {
  const [dataPushed, setDataPushed] = useState(false);





  useEffect(() => {
    if (!dataPushed && ibcAssetList && ibcAssetList.length > 0) {
      // Push your data to assets and chains arrays here
      assetLists.push({
        chainName: process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME,
        assets: [
          {
            name: 'Intento INTO',
            typeAsset: "sdk.coin",
            display: 'INTO',
            symbol: 'INTO',
            denomUnits: [
              { denom: 'uinto', exponent: 0 },
              { denom: 'INTO', exponent: 6 },
            ],
            base: 'uinto',
            logoURIs: {
              png: 'https://intento.zone/assets/images/icon.png',
              svg: 'https://intento.zone/assets/images/icon.svg',
            },
          },
        ],
      })

      for (let asset of ibcAssetList) {
        if (asset.registry_name.toLowerCase().includes("dev")) {

          const { rpcEndpoint, apiEndpoint } = getEnvVarForSymbol(asset.symbol)
          chains.push({
            chainType: 'cosmos',
            chainName: asset.registry_name,
            status: 'live',
            networkType: 'testnet',
            prettyName: asset.name,
            chainId: asset.chain_id,
            bech32Prefix: asset.prefix,
            logoURIs: { svg: asset.logo_uri },
            slip44: 118,
            fees: {
              feeTokens: [
                {
                  denom: asset.denom,
                  lowGasPrice: 0.025,
                  averageGasPrice: 0.05,
                  highGasPrice: 0.1,
                },
              ],
            },
            apis: {
              rpc: [
                {
                  address: rpcEndpoint,
                  provider: '',
                },
              ],
              rest: [
                {
                  address: apiEndpoint,
                  provider: '',
                },
              ],
            },
          })

          // console.log(chains[chains.length - 1])
        }
        console.log(chains.find((i) => i.chainName == 'intentodevnet'))
      }
      // Mark the data as pushed
      setDataPushed(true)
    }
  }, [dataPushed])

  const signerOptions: SignerOptions = {
    // signing:{
    //   return getIntentoSigningClientOptions({ defaultTypes })
    //   } else {
    //     return getSigningCosmosClientOptions()
    //   }
    // },
    // signing: (chain: any) => {
    //   return {
    //     broadcast: {
    //       checkTx: true,
    //       deliverTx: true,
    //     },
    //   };
    // },
    preferredSignType: (_chain: any) => {
      // `preferredSignType` determines which signer is preferred for `getOfflineSigner` method. By default `amino`. It might affect the `OfflineSigner` used in `signingStargateClient` and `signingCosmwasmClient`. But if only one signer is provided, `getOfflineSigner` will always return this signer, `preferredSignType` won't affect anything.
      return process.env.NEXT_PUBLIC_PREFERRED_SIGN_AMINO ? 'amino' : 'direct'
    },
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />

        {/* Primary Meta Tags */}
        <title>Intento Portal</title>
        <meta name="title" content="Intento Portal" />
        <meta name="description" content="The portal for on-chain intent-based workflows" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://intento.zone/" />
        <meta property="og:title" content="Intento Portal" />
        <meta property="og:description" content="The portal for on-chain intent-based workflows" />
        <meta property="og:image" content="https://intento.zone/assets/images/og-portal.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://intento.zone/" />
        <meta property="twitter:title" content="Intento Portal" />
        <meta property="twitter:description" content="The portal for on-chain intent-based workflows" />
        <meta property="twitter:image" content="https://intento.zone/assets/images/og-portal.png" />

        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          {dataPushed && <ChainProvider
            // throwErrors="connect_only"
            // logLevel="DEBUG"
            chains={[...chainList]}
            assetLists={[...assetLists]}
            wallets={wallets}
            signerOptions={signerOptions}
            // walletConnectOptions={{
            //   signClient: {
            //     projectId: 'fa03e8566efb5455b17a0e1f888f0e14',
            //   },
            // }}

            //isLazy = true, no validation because these are not part of the chain registry
            endpointOptions={{
              endpoints: {
                [process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME]: {
                  // isLazy: true,
                  rpc: [process.env.NEXT_PUBLIC_INTO_RPC],
                  rest: [process.env.NEXT_PUBLIC_INTO_API],
                },
                cosmosdev: {
                  // isLazy: true,
                  rpc: [process.env.NEXT_PUBLIC_ATOM_RPC],
                  rest: [process.env.NEXT_PUBLIC_ATOM_API],
                },
                osmosisdev: {
                  // isLazy: true,
                  rpc: [process.env.NEXT_PUBLIC_OSMO_RPC],
                  rest: [process.env.NEXT_PUBLIC_OSMO_API],
                }
              },
            }}
          >  <InterchainWalletModal />
            <NextJsAppRoot>
              <ErrorBoundary>
                <Component {...pageProps} />
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    className: toasterClassName,
                    style: {
                      borderRadius: '8px',
                      background: '#2C2C2E',
                      color: '#fff',
                      padding: '16px',
                      fontSize: '14px',
                      maxWidth: '500px',
                      width: '100%',
                    },
                  }}
                />
                {__TEST_MODE__ ? <TestnetDialog /> : <InfoDialog />}
              </ErrorBoundary>
            </NextJsAppRoot>
          </ChainProvider>}
        </Suspense>
      </QueryClientProvider>
    </>
  );
}

export default IntentoPortalApp;

//workaround for typescript to know symbol at compile time
function getEnvVarForSymbol(asset: any): {
  rpcEndpoint: string | undefined
  apiEndpoint: string | undefined
} {
  switch (asset.symbol) {
    case 'INTO':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_INTO_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_INTO_API,
      }
    case 'ATOM':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_ATOM_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_ATOM_API,
      }
    case 'OSMO':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_OSMO_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_OSMO_API,
      }
    case 'COSM':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_COSM_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_COSM_API,
      }

    // Add more cases as needed for other symbols
    default:
      return { rpcEndpoint: asset.rpc, apiEndpoint: asset.api }
  }
}
