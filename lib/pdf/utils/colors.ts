export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.trim()
  if (!normalized.startsWith("#")) return hex

  const raw = normalized.slice(1)
  const expanded =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw

  if (expanded.length !== 6) return hex

  const r = parseInt(expanded.slice(0, 2), 16)
  const g = parseInt(expanded.slice(2, 4), 16)
  const b = parseInt(expanded.slice(4, 6), 16)

  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

