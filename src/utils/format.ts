export const to_num = (v: unknown): number => {
  const n = typeof v === 'string'
    ? Number(v.replaceAll(',', '').replace('%', '').trim())
    : Number(v)
  return Number.isNaN(n) ? 0 : n
}

export const fmt_price = (v: unknown): string => {
  const n = to_num(v)
  return n > 0 ? `${n.toLocaleString()}원` : '-'
}

export const fmt_rate = (v: unknown): string => {
  const n = to_num(v)
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
}

export const fmt_val = (v: unknown, unit = ''): string => {
  const n = to_num(v)
  return n !== 0 ? `${n.toLocaleString()}${unit}` : '-'
}

export const fmt_indicator = (v: unknown, unit = ''): string => {
  const n = to_num(v)
  return n !== 0 ? `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}` : '-'
}

export const fmt_market_cap = (v: unknown): string => {
  const n = to_num(v)
  return n > 0 ? `${Math.round(n / 100000000).toLocaleString()}억` : '-'
}

export const price_of = (row: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const value = to_num(row[key])
    if (value > 0) return value
  }
  return 0
}

export const date_of = (row: Record<string, unknown>): string =>
  String(row.tradeDate ?? row.date ?? row.baseDate ?? '')
