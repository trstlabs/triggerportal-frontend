import React from 'react'
import { Inline } from 'components/ui-blocks'
import { generalExamples, wasmExamples, osmoExamples, elysExamples, intentoExamples } from '../ExampleMsgs'

import { useControlTheme } from 'components/ui-blocks'
import { useIBCAssetInfo } from '../../../../hooks/useIBCAssetInfo'
import { useValidators } from 'hooks/useValidators'

import { AssetSymbol } from '../../../assets/registry'
import { IntentTemplateChip } from '../../../ui/chips/IntentTemplateChip'
import { TemplateList } from '../../../templates/TemplateList'



function Chip({ label, onClick, icon }) {
  const themeController = useControlTheme();
  const isDark = themeController.theme.name === 'dark';
  const baseBg = isDark
    ? 'linear-gradient(90deg, #22242a 0%, #2a2d36 100%)'
    : 'linear-gradient(90deg, #f7fafc 0%, #e3e7ee 100%)';
  const hoverBg = isDark
    ? 'linear-gradient(90deg, #282a33 0%, #32343e 100%)'
    : 'linear-gradient(90deg, #f7fafc 0%, #e9f0fa 100%)';
  const border = isDark ? '1.2px solid #353846' : '1.2px solid #e3e7ee';
  const hoverBorder = isDark ? '1.2px solid #5a6b9a' : '1.2px solid #b7c6e7';
  const color = isDark ? '#f0f2f8' : '#222';
  const boxShadow = isDark
    ? '0 1px 4px 0 rgba(30,40,70,0.12)'
    : '0 1px 4px 0 rgba(80,80,200,0.05)';
  const hoverBoxShadow = isDark
    ? '0 2px 10px 0 rgba(30,40,70,0.18)'
    : '0 2px 10px 0 rgba(80,80,200,0.09)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center with',
        fontSize: '11px',
        color,
        borderRadius: '13px',
        background: baseBg,
        padding: '0.35em 0.7em',
        margin: '0.2em 0.3em',
        cursor: 'pointer',
        border,
        boxShadow,
        fontWeight: 600,
        letterSpacing: '0.01em',
        transition: 'all 0.12s cubic-bezier(.4,0,.2,1)',
      }}
      onClick={onClick}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.background = hoverBg;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
        (e.currentTarget as HTMLDivElement).style.border = hoverBorder;
        (e.currentTarget as HTMLDivElement).style.boxShadow = hoverBoxShadow;
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.background = baseBg;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.border = border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadow;
      }}
    >
      <Inline>
        <img
          src={icon}
          alt="Icon"
          style={{ marginRight: '0.45em', height: '1.2em', borderRadius: '50%', background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(200,200,255,0.10)' }}
        />
        <span style={{ fontWeight: 600 }}>{label}</span>
      </Inline>
    </div>
  );
}

type ExampleChipsProps = {
  chainSymbol: string
  setExample: (index: number, example: any) => void
  messageIndex: number
}

export function ExampleChips({ chainSymbol, setExample, messageIndex = 0 }: ExampleChipsProps) {
  return (
    <>
      {setExample && (
        <Inline css={{ display: 'inline', paddingTop: '$4' }}>

          {/* ELYS examples */}
          {chainSymbol === 'ELYS' && elysExamples.map((example, ei) => (
            <span key={`elys-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {/* OSMO examples */}
          {chainSymbol === 'OSMO' && osmoExamples.map((example, ei) => (
            <span key={`osmo-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {/* WASM examples (INTO chain) */}
          {chainSymbol === 'OSMO' && wasmExamples.map((example, ei) => (
            <span key={`wasm-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/cosmwasmtestnet/images/cosmwasm.svg"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {/* General examples always shown */}
          {generalExamples.map((example, ei) => (
            <span key={`general-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {chainSymbol === 'INTO' && intentoExamples.map((example, ei) => (
            <span key={`intento-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/intento/images/into.svg"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
        </Inline>
      )}
    </>
  )
}

interface ExampleFlowChipsProps {
  chainSymbol: string;
  setAllMessages?: (messages: any[], conditions?: any, templateLabel?: string) => void;
  index: number;
  onCustom?: () => void;
  onUnionCall?: () => void;
  selectedTemplateLabel?: string | null;
}

export function ExampleFlowChips({ chainSymbol, setAllMessages, index, onCustom, onUnionCall, selectedTemplateLabel }: ExampleFlowChipsProps) {
  const IBCAssetInfo = useIBCAssetInfo(chainSymbol)
  const { validators } = useValidators(chainSymbol)
  const validatorPlaceholder = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])
  return (
    <>
      {setAllMessages && index === 0 && (
        <Inline css={{ marginBottom: '$4', flexWrap: 'wrap', gap: '$2' }}>
          <TemplateList
            asset={chainSymbol as AssetSymbol}
            selectedTemplateLabel={selectedTemplateLabel}
            setAllMessages={setAllMessages}
            addressPlaceholder={chainSymbol === 'INTO' ? 'Your Intento address' : `Your ${IBCAssetInfo.prefix} address`}
            validatorPlaceholder={validatorPlaceholder}
          // filterIds={[
          //   'stream-1',
          //   'dca-into-atom',
          //   'dca-into-into-simple',
          //   'dca-into-into-threshold',
          //   'twap-dca-into-p0',
          //   'dca-into-streamswap',
          //   'dca-into-streamswap-cosmos',
          //   'btc-positive-trend',
          //   'arbitrage-btc-spot-vs-twap',
          //   'arbitrage-atom-spot-vs-twap',
          //   'autocompound-if-rewards-gt-1',
          //   'atom-to-btc-if-atom-lt-5',
          // ]}
          />
          {chainSymbol === 'ATOM' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true' && (<></>)}
          {chainSymbol === 'OSMO' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true' && (<></>)}
          {/* Custom builder entry */}
        </Inline>
      )}
      {/* Always show Custom chip (available for any index) */}
      <Inline css={{ marginBottom: '$2', flexWrap: 'wrap', gap: '$2' }}>

        {chainSymbol === undefined && (
          <IntentTemplateChip
            label="Union Call"
            gradient="linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)"
            description="Build a cross-chain contract call via Union ZKGM."
            onClick={() => onUnionCall && onUnionCall()}
          />
        )}
        <IntentTemplateChip
          label="Custom"
          gradient="linear-gradient(90deg, #4a5568 0%, #2d3748 100%)"
          description="Start with a custom message type and fields."
          onClick={() => onCustom && onCustom()}
        />
      </Inline>
    </>
  )
}
