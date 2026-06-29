export const as_record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {}

export const get_array = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  const item = as_record(raw)
  const candidates = [
    item.data, item.items, item.content, item.questions,
    item.list, item.results, item.stocks,
  ]
  return candidates.find(Array.isArray) as unknown[] ?? []
}
