/**
 * 验证手机号（中国大陆）
 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证价格输入（正数，最多两位小数）
 */
export function isValidPrice(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0
}

/**
 * 验证正整数（库存、数量等）
 */
export function isPositiveInt(value: string | number): boolean {
  return Number.isInteger(Number(value)) && Number(value) > 0
}
