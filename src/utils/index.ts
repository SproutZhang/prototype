/** 将任意值转为适合展示的字符串 */
export function formatDisplay(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return String(value)
}
