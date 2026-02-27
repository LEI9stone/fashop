/**
 * 分转元，保留两位小数
 * 100 → "1.00"
 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}

/**
 * 元转分
 * "1.00" → 100
 */
export function yuanToFen(yuan: string | number): number {
  return Math.round(Number(yuan) * 100)
}

/**
 * 格式化价格显示
 * 100 → "¥1.00"
 */
export function formatPrice(fen: number): string {
  return `¥${fenToYuan(fen)}`
}

/**
 * 格式化价格范围
 * (100, 200) → "¥1.00 ~ ¥2.00"
 * (100, 100) → "¥1.00"
 */
export function formatPriceRange(minFen: number, maxFen: number): string {
  if (minFen === maxFen) return formatPrice(minFen)
  return `${formatPrice(minFen)} ~ ${formatPrice(maxFen)}`
}
