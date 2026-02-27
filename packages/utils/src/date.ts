/**
 * 格式化日期时间
 * "2024-01-01T00:00:00.000Z" → "2024-01-01 08:00:00"
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
  ].join('-') + ' ' + [
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join(':')
}

/**
 * 格式化日期
 * "2024-01-01T00:00:00.000Z" → "2024-01-01"
 */
export function formatDate(date: string | Date): string {
  return formatDateTime(date).slice(0, 10)
}

/**
 * 相对时间
 * 1分钟内 → "刚刚"
 * 1小时内 → "x分钟前"
 * 24小时内 → "x小时前"
 * 超过24小时 → 完整日期
 */
export function formatRelativeTime(date: string | Date): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  return formatDate(date)
}
