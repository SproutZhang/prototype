/** 根据部门名称生成部门编码：英文/数字转大写标识；中文等使用稳定数字编码 */
export function generateDepartmentCodeFromName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  const compact = trimmed.replace(/\s+/g, ' ')
  const latinChars = compact.replace(/[^a-zA-Z0-9&]/g, '')
  const nonLatinChars = compact.replace(/[\s\-_/]/g, '').replace(/[a-zA-Z0-9&]/g, '')

  if (latinChars.length > 0 && latinChars.length >= nonLatinChars.length) {
    return compact
      .replace(/&/g, ' and ')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase()
      .slice(0, 40)
  }

  let hash = 0
  for (const char of compact) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return String(1000000000 + (hash % 900000000))
}
