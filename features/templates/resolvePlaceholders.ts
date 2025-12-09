type Json = any

export function resolvePlaceholders(
  obj: Json,
  ctx: { addressPlaceholder: string; validatorPlaceholder?: string }
): Json {
  function walk(value: any): any {
    if (value == null) return value
    if (typeof value === 'string') {
      if (value === '{address:connected}') return ctx.addressPlaceholder
      if (value === '{validator:operatorAddress}') return ctx.validatorPlaceholder ?? '{validator:operatorAddress}'
      return value
    }
    if (Array.isArray(value)) return value.map(walk)
    if (typeof value === 'object') {
      const out: any = Array.isArray(value) ? [] : {}
      for (const k of Object.keys(value)) out[k] = walk(value[k])
      return out
    }
    return value
  }
  return walk(obj)
}
