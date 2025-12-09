
import type { AssetSymbol } from '../assets/registry'
import {
  Comparison,
  ComparisonOperator,
  ExecutionConfiguration,
  FeedbackLoop,
} from 'intentojs/dist/codegen/intento/intent/v1/flow'

export type TemplateId = string

export type TemplateAvailability =
  | { state: 'available' }
  | { state: 'soon' }
  | { state: 'disabled'; reason?: string }
  | { state: 'hidden' }

export type TemplateCategory =
  | 'stream'
  | 'swap'
  | 'staking'
  | 'autocompound'
  | 'dca'
  | 'ibc'
  | 'custom'
  | 'trend'

export interface TemplateUI {
  label: string | ((asset: AssetSymbol) => string)
  description?: string
  gradient?: string
  iconAsset?: AssetSymbol
  autoParse?: boolean
}

export interface TemplateMessage {
  typeUrl: string
  value: unknown
}

export interface ICQConfig {
  connectionId: string
  chainId: string
  timeoutPolicy: number
  timeoutDuration?: { seconds?: bigint; nanos?: number }
  queryType: string
  queryKey: string // base64
}

export interface ICQComparison {
  responseIndex: number
  responseKey: string
  operand: string
  operator: ComparisonOperator | number
  valueType: string
  differenceMode?: boolean
  icqConfig?: ICQConfig
}

export interface IntentTemplate {
  id: TemplateId
  category: TemplateCategory
  availability: TemplateAvailability
  assets: AssetSymbol[]
  ui: TemplateUI
  build: (ctx: {
    asset: AssetSymbol
    addressPrefix?: string
    validators?: { operatorAddress: string }[]
    nowMs: number
  }) => {
    messages: TemplateMessage[]
    conditions?: {
      comparisons?: Comparison[]
      feedbackLoops?: FeedbackLoop[]
      useAndForComparisons?: boolean;
    }
    configuration?: ExecutionConfiguration
  }
}
