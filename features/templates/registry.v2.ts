import { IntentTemplate } from './types'
import { TWAP_KEYS } from '../markets/twapRegistry'
import { DEX_ROUTES } from '../assets/routing'
import { ComparisonOperator } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { createOsmosisTwapQueryKey } from '../build/components/Conditions/ICQConfigForm'

export const TEMPLATES: IntentTemplate[] = [
  {
    id: 'stream-1',
    category: 'stream',
    availability: { state: 'available' },
    assets: ['ATOM', 'OSMO', 'INTO', 'USDC'],
    ui: {
      label: (asset: any) => `Stream 1 ${asset}`,
      description: (asset: any) =>
        `Streams one ${asset} from your address to another address. You can adjust the amount after selecting.` as unknown as string,
      gradient:
        'linear-gradient(90deg,rgb(94, 94, 178) 0%,rgb(123, 134, 218) 100%)',
      autoParse: true,
    } as any,
    build: ({ asset }) => ({
      messages: [
        {
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value: {
            fromAddress: '{address:connected}',
            toAddress: '{address:connected}',
            amount: [{ denom: asset, amount: '1' }],
          },
        },
      ],
    }),
  },
  {
    id: 'atom-to-btc-if-atom-lt-5',
    category: 'swap',
    availability: {
      state:
        process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true'
          ? 'available'
          : 'hidden',
    },
    assets: ['ATOM'],
    ui: {
      label: 'Swap ATOM for BTC if ATOM < $5',
      description:
        'Swaps 1 ATOM for BTC via Osmosis if ATOM < $5. Uses a TWAP ICQ to check price off-chain.',
      gradient: 'linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)',
      autoParse: true,
    },
    build: ({ nowMs }) => {
      const timeoutTimestamp = (
        BigInt(nowMs + 5 * 60 * 1000) * BigInt(1000000)
      ).toString()
      return {
        messages: [
          {
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            value: {
              sourcePort: 'transfer',
              sourceChannel: 'channel-141',
              token: { denom: 'ATOM', amount: '1' },
              sender: '{address:connected}',
              receiver:
                'osmo10a3k4hvk37cc4hnxctw4p95fhscd2z6h2rmx0aukc6rm8u9qqx9smfsh7u',
              timeoutHeight: { revisionNumber: '0', revisionHeight: '0' },
              timeoutTimestamp,
              memo: `{"wasm":{"contract":"osmo10a3k4hvk37cc4hnxctw4p95fhscd2z6h2rmx0aukc6rm8u9qqx9smfsh7u","msg":{"swap_and_action":{"user_swap":{"swap_exact_asset_in":{"swap_venue_name":"osmosis-poolmanager","operations":[{"pool":"611","denom_in":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","denom_out":"ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4"},{"pool":"1096","denom_in":"ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4","denom_out":"uosmo"},{"pool":"712","denom_in":"uosmo","denom_out":"ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F"},{"pool":"1868","denom_in":"ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F","denom_out":"ibc/2F4258D6E1E01B203D6CA83F2C7E4959615053A21EC2C2FC196F7911CAC832EF"}]}},"min_asset":{"native":{"denom":"ibc/2F4258D6E1E01B203D6CA83F2C7E4959615053A21EC2C2FC196F7911CAC832EF","amount":"1"}},"timeout_timestamp":${timeoutTimestamp},"post_swap_action":{"transfer":{"to_address":"Your osmo address"}},"affiliates":[]}}}}`,
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey: '',
              operand: '5.0',
              operator: ComparisonOperator.SMALLER_THAN,
              valueType: 'osmosistwapv1beta1.TwapRecord.P0LastSpotPrice',
              differenceMode: false,
              icqConfig: {
                connectionId: 'connection-1',
                chainId: 'osmosis-1',
                timeoutPolicy: 2,
                timeoutDuration: { seconds: BigInt(120), nanos: 0 },
                queryType: 'store/twap/key',
                queryKey:
                  createOsmosisTwapQueryKey(
                    1251,
                    'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                    'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
                  ),
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
  {
    id: 'twap-dca-atom-p1',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'DCA into ATOM when avg. < $2.10 (beta)',
      description:
        'Periodically swaps USDC into ATOM on Osmosis only when the TWAP is below your configured threshold in the comparison operand, so buys are executed on TWAP dips instead of every interval.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => {
      const route = DEX_ROUTES['USDC->ATOM@osmosis-1']
      const twap = TWAP_KEYS['ATOM/USDC@osmosis-1']
      return {
        messages: [
          {
            typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
            value: {
              sender: '{address:connected}',
              tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
              tokenOutMinAmount: '1',
              routes: route?.steps?.map((s: any) => ({
                poolId: s.pool,
                tokenOutDenom: s.denomOut,
              })) 
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey:
                'osmosistwapv1beta1.TwapRecord.P1ArithmeticTwapAccumulator',
              operand: '2.1',
              operator: 3,
              differenceMode: true,
              valueType:
                'osmosistwapv1beta1.TwapRecord.P1ArithmeticTwapAccumulator',
              icqConfig: {
                connectionId: twap.connectionId,
                chainId: twap.chainId,
                timeoutPolicy: 2,
                timeoutDuration: {
                  seconds: BigInt(twap.timeoutSeconds),
                  nanos: 0,
                },
                queryType: 'store/twap/key',
                queryKey: twap.queryKeyBase64,
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
   {
    id: 'twap-dca-into-p0',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'DCA into INTO when avg. < $0.0009 (beta)',
      description:
        'Periodically swaps USDC into INTO on Osmosis only when the TWAP is below your configured threshold in the comparison operand, so buys are executed on TWAP dips instead of every interval.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => {
      const route = DEX_ROUTES['USDC->INTO@osmosis-1']
      const twap = TWAP_KEYS['INTO/USDC@osmosis-1']
      return {
        messages: [
          {
            typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
            value: {
              sender: '{address:connected}',
              tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
              tokenOutMinAmount: '1',
              routes: route?.steps?.map((s: any) => ({
                poolId: s.pool,
                tokenOutDenom: s.denomOut,
              })) 
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey:
                'osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator',
              operand: '0.0009',
              operator: 3,
              differenceMode: true,
              valueType:
                'osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator',
              icqConfig: {
                connectionId: twap.connectionId,
                chainId: twap.chainId,
                timeoutPolicy: 2,
                timeoutDuration: {
                  seconds: BigInt(twap.timeoutSeconds),
                  nanos: 0,
                },
                queryType: 'store/twap/key',
                queryKey: twap.queryKeyBase64,
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
  {
    id: 'dca-into-into-threshold',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'DCA into INTO if < $0.01',
      description:
        'Swaps 1 USDC into INTO with a price check. You can adjust tokenIn/routes after selecting.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 0%,rgb(56, 95, 249) 100%)',
      autoParse: true,
    },
    build: () => {
      const route = DEX_ROUTES['USDC->INTO@osmosis-1']
      const twap = TWAP_KEYS['INTO/USDC@osmosis-1']
      return {
        messages: [
          {
            typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
            value: {
              sender: '{address:connected}',
              tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
              tokenOutMinAmount: '1',
              routes: route?.steps?.map((s: any) => ({
                poolId: s.pool,
                tokenOutDenom: s.denomOut,
              })) ?? [
                {
                  poolId: '3138',
                  tokenOutDenom: 'INTO (transfer/channel-106076)',
                },
              ],
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey: '',
              operand: '0.01',
              operator: ComparisonOperator.SMALLER_THAN,
              valueType: twap.valueType,
              differenceMode: false,
              icqConfig: {
                connectionId: twap.connectionId,
                chainId: twap.chainId,
                timeoutPolicy: 2,
                timeoutDuration: {
                  seconds: BigInt(twap.timeoutSeconds),
                  nanos: 0,
                },
                queryType: 'store/twap/key',
                queryKey: twap.queryKeyBase64,
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
  {
    id: 'autocompound-if-rewards-gt-1',
    category: 'autocompound',
    availability: { state: 'available' },
    assets: ['ATOM', 'OSMO', 'INTO'],
    ui: {
      label: (asset: any) => `Autocompound if rewards > 1 ${asset}`,
      description: () =>
        `Autocompound if rewards > 1. Uses a feedback loop to check if rewards are more than 1 and compound them. Will stop when rewards are less than 1. You can change these inputs. Validator address should start with {prefix}1.` as unknown as string,
      gradient: 'linear-gradient(90deg, #9C27B0 0%, #673AB7 100%)',
      autoParse: true,
    } as any,
    build: ({ asset }) => ({
      messages: [
        {
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value: {
            delegatorAddress: '{address:connected}',
            validatorAddress: '{validator:operatorAddress}',
          },
        },
        {
          typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
          value: {
            delegatorAddress: '{address:connected}',
            validatorAddress: '{validator:operatorAddress}',
            amount: { denom: `${asset}`, amount: '1' },
          },
        },
      ],
      conditions: {
        feedbackLoops: [
          {
            flowId: BigInt(0),
            differenceMode: false,
            responseIndex: 0,
            responseKey: 'Amount.[-1]',
            msgsIndex: 1,
            msgKey: 'Amount',
            valueType: 'sdk.Coin',
          },
        ],
        comparisons: [
          {
            flowId: BigInt(0),
            responseIndex: 0,
            responseKey: 'Amount.[-1]',
            operator: ComparisonOperator.GREATER_EQUAL,
            differenceMode: false,
            operand: (asset
              ? `1000000u${String(asset).toLowerCase()}`
              : '1000000') as string,
            valueType: 'sdk.Coin',
          },
        ],
      },
    }),
  },
  {
    id: 'dca-into-atom',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'DCA into ATOM',
      description:
        'Swaps 1 USDC into ATOM with no additional conditions. You can adjust tokenIn and routes after selecting.',
      gradient: 'linear-gradient(90deg, #5a4fcf 0%, #8a7aff 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
          value: {
            sender: '{address:connected}',
            routes: [
              { poolId: '1464', tokenOutDenom: 'uosmo' },
              { poolId: '1265', tokenOutDenom: 'ATOM (transfer/channel-0)' },
            ],
            tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
            tokenOutMinAmount: '1',
          },
        },
      ],
    }),
  },
  {
    id: 'dca-into-into-simple',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'DCA into INTO',
      description:
        'Swaps 1 USDC into INTO with no additional conditions. You can adjust the tokenIn and routes after selecting.',
      gradient: 'linear-gradient(90deg, #0c76af 0%, #38aff9 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
          value: {
            sender: '{address:connected}',
            tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
            tokenOutMinAmount: '1',
            routes: [
              {
                poolId: '3138',
                tokenOutDenom: 'INTO (transfer/channel-106076)',
              },
            ],
          },
        },
      ],
    }),
  },
  {
    id: 'dca-into-streamswap',
    category: 'custom',
    availability: { state: 'disabled', reason: 'Streaming contract disabled' },
    assets: ['ATOM'],
    ui: {
      label: 'DCA into StreamSwap',
      description:
        'DCA into StreamSwap to average your entry into the streaming event.',
      gradient: 'linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
          value: {
            sender: '{address:connected}',
            contract:
              'osmo1994s0ea4z2lqrh5gl8l5s0cw6hwz92s3pn2yhkamfh57j9yh7lxssnr80s',
            msg: { subscribe: { stream_id: 8 } },
            funds: [],
          },
        },
      ],
    }),
  },
  {
    id: 'dca-into-streamswap-cosmos',
    category: 'custom',
    availability: { state: 'available' },
    assets: ['ATOM'],
    ui: {
      label: 'DCA into StreamSwap',
      description:
        'DCA into StreamSwap to average your entry into the streaming event.',
      gradient: 'linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
          value: {
            sender: '{address:connected}',
            contract:
              'cosmos1gzz44pdc87r8vfdktum8285j2aghtcg56qultynjzqy75ft3czxsux5xec',
            msg: { subscribe: { stream_id: 3 } },
            funds: [{ denom: 'ATOM', amount: '1' }],
          },
        },
      ],
    }),
  },
  {
    id: 'trend-detection-btc',
    category: 'trend',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'BTC Positive trend detection (beta)',
      description: 'Swaps when the BTC/OSMO TWAP is above a configured threshold of 0 indicating a positive trend.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
          value: {
            sender: '{address:connected}',
            tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
            tokenOutMinAmount: '1',
            routes: [
              {
                poolId: '1943',
                tokenOutDenom:
                  'factory/osmo1z6r6qdknhgsc0zeracktgpcxf43j6sekq07nw8sxduc9lg0qjjlqfu25e3/alloyed/allBTC',
              },
            ],
          },
        },
      ],
      conditions: {
        comparisons: [
          {
            flowId: BigInt(0),
            responseIndex: 0,
            responseKey:
              'osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator',
            operand: '0',
            operator: ComparisonOperator.GREATER_EQUAL,
            differenceMode: true,
            valueType:
              'osmosistwapv1beta1.TwapRecord.P0ArithmeticTwapAccumulator',
            icqConfig: {
              response: undefined,
              connectionId: 'connection-1',
              chainId: 'osmosis-1',
              timeoutPolicy: 2,
              timeoutDuration: { seconds: BigInt(120), nanos: 0 },
              queryType: 'store/twap/key',
              queryKey: createOsmosisTwapQueryKey(
                1251,
                'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
              ),
            },
          },
        ],
        feedbackLoops: [],
      },
    }),
  },
  {
    id: 'arbitrage-btc-spot-vs-twap',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'Spot vs TWAP arbitrage BTC Buy (beta)',
      description:
        'Swaps 1 USDC into BTC every time when the spot price is lower than the time-weighted average price.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
          value: {
            sender: '{address:connected}',
            tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
            tokenOutMinAmount: '1',
            routes: [
              {
                poolId: '1943',
                tokenOutDenom:
                  'factory/osmo1z6r6qdknhgsc0zeracktgpcxf43j6sekq07nw8sxduc9lg0qjjlqfu25e3/alloyed/allBTC',
              },
            ],
          },
        },
      ],
      conditions: {
        comparisons: [
          {
            flowId: BigInt(0),
            responseIndex: 0,
            responseKey: 'P0LastSpotPrice',
            operand: 'osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator',
            operator: ComparisonOperator.SMALLER_THAN,
            differenceMode: false,
            valueType: 'osmosistwapv1beta1.TwapRecord',
            icqConfig: {
              connectionId: 'connection-1',
              chainId: 'osmosis-1',
              timeoutPolicy: 2,
              timeoutDuration: { seconds: BigInt(120), nanos: 0 },
              response: undefined,
              queryType: 'store/twap/key',
              queryKey:
                'cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDE5NDN8ZmFjdG9yeS9vc21vMXo2cjZxZGtuaGdzYzB6ZXJhY2t0Z3BjeGY0M2o2c2VrcTA3bnc4c3hkdWM5bGcwcWpqbHFmdTI1ZTMvYWxsb3llZC9hbGxCVEN8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=',
            },
          },
        ],
        feedbackLoops: [],
      },
    }),
  },
  {
    id: 'arbitrage-atom-spot-vs-twap',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'Spot vs TWAP arbitrage ATOM Buy (beta)',
      description:
        'Swaps 1 USDC into ATOM every time when the spot price is lower than the time-weighted average price.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
          value: {
            sender: '{address:connected}',
            tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
            tokenOutMinAmount: '1',
            routes: [
              { poolId: '1464', tokenOutDenom: 'uosmo' },
              { poolId: '1265', tokenOutDenom: 'ATOM (transfer/channel-0)' },
            ],
          },
        },
      ],
      conditions: {
        comparisons: [
          {
            flowId: BigInt(0),
            responseIndex: 0,
            responseKey: 'P0LastSpotPrice',
            operand: 'osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator',
            operator: ComparisonOperator.SMALLER_THAN,
            differenceMode: false,
            valueType: 'osmosistwapv1beta1.TwapRecord',
            icqConfig: {
              connectionId: 'connection-1',
              chainId: 'osmosis-1',
              timeoutPolicy: 2,
              timeoutDuration: { seconds: BigInt(120), nanos: 0 },
              queryType: 'store/twap/key',
              queryKey: createOsmosisTwapQueryKey(
                1251,
                'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
              ),
              response: undefined,
            },
          },
        ],
        feedbackLoops: [],
      },
    }),
  },
  {
    id: 'arbitrage-btc-spot-vs-twap-sell',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'Spot vs TWAP arbitrage BTC Sell (beta)',
      description:
        'Swaps 1 BTC into USDC every time when the spot price is higher than the time-weighted average price.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => ({
      messages: [
        {
          typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
          value: {
            sender: '{address:connected}',
            tokenIn: {
              denom:
                'factory/osmo1z6r6qdknhgsc0zeracktgpcxf43j6sekq07nw8sxduc9lg0qjjlqfu25e3/alloyed/allBTC',
              amount: '1',
            },
            tokenOutMinAmount: '1',
            routes: [
              {
                poolId: '1943',
                tokenOutDenom:
                  'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
              },
            ],
          },
        },
      ],
      conditions: {
        comparisons: [
          {
            flowId: BigInt(0),
            responseIndex: 0,
            responseKey: 'P0LastSpotPrice',
            operand: 'osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator',
            operator: ComparisonOperator.LARGER_THAN,
            differenceMode: false,
            valueType: 'osmosistwapv1beta1.TwapRecord',
            icqConfig: {
              connectionId: 'connection-1',
              chainId: 'osmosis-1',
              timeoutPolicy: 2,
              timeoutDuration: { seconds: BigInt(120), nanos: 0 },
              response: undefined,
              queryType: 'store/twap/key',
              queryKey:
                'cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDE5NDN8ZmFjdG9yeS9vc21vMXo2cjZxZGtuaGdzYzB6ZXJhY2t0Z3BjeGY0M2o2c2VrcTA3bnc4c3hkdWM5bGcwcWpqbHFmdTI1ZTMvYWxsb3llZC9hbGxCVEN8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=',
            },
          },
        ],
        feedbackLoops: [],
      },
    }),
  },
  {
    id: 'arbitrage-into-spot-vs-twap-buy',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'Spot vs TWAP arbitrage INTO Buy (beta)',
      description:
        'Swaps 1 USDC into INTO every time when the spot price is lower than the time-weighted average price.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => {
      const twap = TWAP_KEYS['INTO/USDC@osmosis-1']
      return {
        messages: [
          {
            typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
            value: {
              sender: '{address:connected}',
              tokenIn: { denom: 'USDC (transfer/channel-750)', amount: '1' },
              tokenOutMinAmount: '1',
              routes: [
                {
                  poolId: '3138',
                  tokenOutDenom: 'INTO (transfer/channel-106076)',
                },
              ],
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey: 'P0LastSpotPrice',
              operand: 'osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator',
              operator: ComparisonOperator.SMALLER_THAN,
              differenceMode: false,
              valueType: 'osmosistwapv1beta1.TwapRecord',
              icqConfig: {
                connectionId: twap.connectionId,
                chainId: twap.chainId,
                timeoutPolicy: 2,
                timeoutDuration: {
                  seconds: BigInt(twap.timeoutSeconds),
                  nanos: 0,
                },
                queryType: 'store/twap/key',
                queryKey: twap.queryKeyBase64,
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
  {
    id: 'arbitrage-into-spot-vs-twap-sell',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'Spot vs TWAP arbitrage INTO Sell (beta)',
      description:
        'Swaps 1 INTO into USDC every time when the spot price is higher than the time-weighted average price.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => {
      const twap = TWAP_KEYS['INTO/USDC@osmosis-1']
      return {
        messages: [
          {
            typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
            value: {
              sender: '{address:connected}',
              tokenIn: {
                denom: 'INTO (transfer/channel-106076)',
                amount: '1',
              },
              tokenOutMinAmount: '1',
              routes: [
                {
                  poolId: '3138',
                  tokenOutDenom:
                    'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
                },
              ],
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey: 'P0LastSpotPrice',
              operand: 'osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator',
              operator: ComparisonOperator.LARGER_THAN,
              differenceMode: false,
              valueType: 'osmosistwapv1beta1.TwapRecord',
              icqConfig: {
                connectionId: twap.connectionId,
                chainId: twap.chainId,
                timeoutPolicy: 2,
                timeoutDuration: {
                  seconds: BigInt(twap.timeoutSeconds),
                  nanos: 0,
                },
                queryType: 'store/twap/key',
                queryKey: twap.queryKeyBase64,
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
  {
    id: 'arbitrage-atom-spot-vs-twap-sell',
    category: 'dca',
    availability: { state: 'available' },
    assets: ['OSMO'],
    ui: {
      label: 'Spot vs TWAP arbitrage ATOM Sell (beta)',
      description:
        'Swaps 1 ATOM into USDC every time when the spot price is higher than the time-weighted average price.',
      gradient:
        'linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)',
      autoParse: true,
    },
    build: () => {
      const twap = TWAP_KEYS['ATOM/USDC@osmosis-1']
      return {
        messages: [
          {
            typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
            value: {
              sender: '{address:connected}',
              tokenIn: { denom: 'ATOM (transfer/channel-0)', amount: '1' },
              tokenOutMinAmount: '1',
              routes: [
                { poolId: '1265', tokenOutDenom: 'uosmo' },
                {
                  poolId: '1464',
                  tokenOutDenom:
                    'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
                },
              ],
            },
          },
        ],
        conditions: {
          comparisons: [
            {
              flowId: BigInt(0),
              responseIndex: 0,
              responseKey: 'P0LastSpotPrice',
              operand: 'osmosistwapv1beta1.TwapRecord.GeometricTwapAccumulator',
              operator: ComparisonOperator.LARGER_THAN,
              differenceMode: false,
              valueType: 'osmosistwapv1beta1.TwapRecord',
              icqConfig: {
                connectionId: twap.connectionId,
                chainId: twap.chainId,
                timeoutPolicy: 2,
                timeoutDuration: {
                  seconds: BigInt(twap.timeoutSeconds),
                  nanos: 0,
                },
                queryType: 'store/twap/key',
                queryKey: createOsmosisTwapQueryKey(
                  1251,
                  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                  'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
                ),
                response: undefined,
              },
            },
          ],
          feedbackLoops: [],
        },
      }
    },
  },
]
