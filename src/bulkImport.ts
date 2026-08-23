export interface TdcjParseResult {
  valid: string[]
  dropped: string[]
}

export function parseTdcjList(text: string): TdcjParseResult {
  const tokens = text
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const valid: string[] = []
  const dropped: string[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    if (/^\d{8}$/.test(token)) {
      if (seen.has(token)) {
        dropped.push(token)
      } else {
        seen.add(token)
        valid.push(token)
      }
    } else {
      dropped.push(token)
    }
  }
  return { valid, dropped }
}
