import React from 'react'
import { Sparkles } from 'lucide-react'
import { useControlTheme } from 'junoblocks'
import { TEMPLATES } from './registry.v2'
import { IntentTemplateChip } from '../ui/chips/IntentTemplateChip'
import { ASSETS, AssetSymbol } from '../assets/registry'
import { resolvePlaceholders } from './resolvePlaceholders'
import { ExecutionConditions } from 'intentojs/dist/codegen/intento/intent/v1/flow'

export function TemplateList({
  asset,
  selectedTemplateLabel,
  setAllMessages,
  addressPlaceholder,
  validatorPlaceholder,
  filterIds,
}: {
  asset: AssetSymbol
  selectedTemplateLabel?: string | null
  setAllMessages: (messages: any[], extra?: { conditions?: ExecutionConditions, configuration?: any }, templateLabel?: string) => void
  addressPlaceholder: string
  validatorPlaceholder?: string
  filterIds?: string[]
}) {
  const themeController = useControlTheme()
  const isDark = themeController.theme.name === 'dark'
  const applicable = TEMPLATES.filter(t => (!filterIds || filterIds.includes(t.id)) && t.assets.includes(asset) && t.availability.state !== 'hidden')

  const selectedTemplate = applicable.find(t => {
    const label = typeof t.ui.label === 'function' ? (t.ui.label as any)(asset) : t.ui.label
    return label === selectedTemplateLabel
  })
  const selectedDescription = selectedTemplate
    ? (typeof (selectedTemplate.ui as any).description === 'function' ? (selectedTemplate.ui as any).description(asset) : selectedTemplate.ui.description)
    : null

  return (
    <div style={{
      marginBottom: '1rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      position: 'relative',
      zIndex: 1
    }}>
      {applicable.map((t) => {
        let label = typeof t.ui.label === 'function' ? (t.ui.label as any)(asset) : t.ui.label
        const iconUrl = ASSETS[t.ui.iconAsset ?? asset]?.iconUrl
        const built = t.build({ asset, nowMs: Date.now() })
        const resolvedMessages = built.messages.map(m => ({
          ...m,
          value: resolvePlaceholders(m.value, { addressPlaceholder, validatorPlaceholder })
        }))
        const gradient = t.ui.gradient ?? 'linear-gradient(90deg,rgb(94, 94, 178) 0%,rgb(123, 134, 218) 100%)'
        const description = typeof (t.ui as any).description === 'function' ? (t.ui as any).description(asset) : t.ui.description
        const disabled = t.availability.state === 'disabled'
        const soon = t.availability.state === 'soon'

        // Provide asset selection dropdown for different template types
        const labelStr = typeof t.ui.label === 'function' ? (t.ui.label as any)(asset) : (t.ui.label ?? '')

        // Check for arbitrage templates
        const isArb = typeof labelStr === 'string' && labelStr.startsWith('Spot vs TWAP arbitrage ')
        // Check for DCA templates (both regular and TWAP)
        const isDCA = t.category === 'dca' && (t.id.startsWith('dca-into-') || t.id.startsWith('twap-dca-'))
        // Check for trend detection templates
        const isTrend = t.category === 'trend' && t.id.startsWith('trend-detection-')

        // Group templates by their type
        const allTemplates = {
          arb: isArb ? applicable.filter(x => {
            const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
            return typeof xl === 'string' && xl.startsWith('Spot vs TWAP arbitrage ')
          }) : [],
          dca: isDCA ? applicable.filter(x => {
            return x.category === 'dca' &&
              (x.id.startsWith('dca-into-') || x.id.startsWith('twap-dca-'))
          }) : [],
          trend: isTrend ? applicable.filter(x => {
            return x.category === 'trend' && x.id.startsWith('trend-detection-')
          }) : []
        }

        // Create menu items for the dropdown
        const templateMenu = (() => {
          if (isArb) {
            return allTemplates.arb.map(x => {
              const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
              const suffix = typeof xl === 'string' ? xl.replace('Spot vs TWAP arbitrage ', '') : x.id
              return { id: x.id, label: suffix }
            })
          } else if (isDCA) {
            return allTemplates.dca.map(x => {
              const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
              // For DCA templates, show the full label as it's more descriptive
              return { id: x.id, label: xl || x.id }
            })
          } else if (isTrend) {
            return allTemplates.trend.map(x => {
              const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
              // Extract asset name from "XXX Positive trend detection"
              const suffix = typeof xl === 'string' ? xl.replace(' Positive trend detection', '') : x.id
              return { id: x.id, label: suffix }
            })
          }
          return undefined
        })()

        // If this is part of a template group, render only one consolidated chip
        if (isArb) {
          const firstTemplate = allTemplates.arb[0]
          if (!firstTemplate) return null
          if (t.id !== firstTemplate.id) return null
          label = 'Spot vs TWAP arbitrage'
        } else if (isDCA) {
          const firstTemplate = allTemplates.dca[0]
          if (!firstTemplate) return null
          if (t.id !== firstTemplate.id) return null
          // Use a more generic label for the consolidated DCA chip
          label = 'Dollar-Cost Average'
        } else if (isTrend) {
          const firstTemplate = allTemplates.trend[0]
          if (!firstTemplate) return null
          if (t.id !== firstTemplate.id) return null
          label = 'Positive Trend Detection'
        }

        const handleMenuSelect = (id: string) => {
          // Handle template selection from dropdown
          const target = TEMPLATES.find(x => x.id === id)
          if (!target) return
          const builtSel = target.build({ asset, nowMs: Date.now() })
          const resolvedSel = builtSel.messages.map(m => ({
            ...m,
            value: resolvePlaceholders(m.value, { addressPlaceholder, validatorPlaceholder })
          }))
          const labelSel = typeof target.ui.label === 'function' ? (target.ui.label as any)(asset) : target.ui.label
          console.log('[TemplateList] Dropdown select', { id: target.id, label: labelSel, conditions: builtSel.conditions, messages: resolvedSel })
          setAllMessages(resolvedSel as any, { conditions: builtSel.conditions as any, configuration: builtSel.configuration }, labelSel)
        }
        // selected state: normal or consolidated template (selected if any template in the group matches)
        const isSelected = (() => {
          if (isArb) {
            return allTemplates.arb.some(x => {
              const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
              return selectedTemplateLabel === xl
            })
          } else if (isDCA) {
            return allTemplates.dca.some(x => {
              const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
              return selectedTemplateLabel === xl
            })
          } else if (isTrend) {
            return allTemplates.trend.some(x => {
              const xl = typeof x.ui.label === 'function' ? (x.ui.label as any)(asset) : x.ui.label
              return selectedTemplateLabel === xl
            })
          }
          return selectedTemplateLabel === label
        })()

        return (
          <IntentTemplateChip
            key={t.id}
            label={label}
            iconUrl={iconUrl}
            gradient={gradient}
            autoParse={!!t.ui.autoParse}
            description={description}
            selected={isSelected}
            disabled={disabled}
            soon={soon}
            onClick={isArb || isDCA || isTrend ? undefined : () => {
              console.log('[TemplateList] Chip click', { id: t.id, label, conditions: built.conditions, messages: resolvedMessages });
              setAllMessages(
                resolvedMessages as any,
                {
                  conditions: built.conditions as any,
                  configuration: built.configuration
                },
                label
              )
            }}
            menuItems={templateMenu}
            onMenuSelect={templateMenu ? handleMenuSelect : undefined}
          />
        )
      })}
      {selectedDescription && (
        <div style={{
          width: '100%',
          marginTop: '0.5rem',
          padding: '1rem',
          background: isDark ? 'rgba(94, 94, 178, 0.1)' : 'rgba(94, 94, 178, 0.05)',
          borderRadius: '12px',
          border: isDark ? '1px solid rgba(94, 94, 178, 0.2)' : '1px solid rgba(94, 94, 178, 0.1)',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'flex-start',
          color: isDark ? '#e1e5f0' : '#4a5568',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          <Sparkles size={20} style={{ flexShrink: 0, marginTop: '2px', color: isDark ? '#a0a0e0' : '#5e5eb2' }} />
          <div>{selectedDescription}</div>
        </div>
      )}
    </div>
  )
}
