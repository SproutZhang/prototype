import type { AppLocale } from '../i18n/homeStrings'

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function subtractDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() - days)
  return next
}

/** 将 Agent 卡片 meta（相对时间或日期串）解析为具体日期 */
export function parseAgentMetaToDate(meta: string): Date | null {
  const trimmed = meta.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const zhDate = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
  if (zhDate) {
    const parsed = new Date(Number(zhDate[1]), Number(zhDate[2]) - 1, Number(zhDate[3]))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const today = startOfToday()

  if (trimmed === 'just now' || trimmed === '刚刚') return today
  if (trimmed === 'yesterday' || trimmed === '昨天') return subtractDays(today, 1)

  const daysAgoEn = trimmed.match(/^(\d+)\s+days?\s+ago$/i)
  if (daysAgoEn) return subtractDays(today, Number(daysAgoEn[1]))

  const daysAgoZh = trimmed.match(/^(\d+)\s*天前$/)
  if (daysAgoZh) return subtractDays(today, Number(daysAgoZh[1]))

  return null
}

/** Agent 卡片 footer 日期：与知识库卡片一致（更新于 YYYY-MM-DD） */
export function formatAgentCardMeta(meta: string, locale: AppLocale): string {
  const trimmed = meta.trim()
  if (!trimmed) return meta

  const updatedPrefix = trimmed.match(/^(?:更新于|Updated)\s+(\d{4}-\d{2}-\d{2})$/)
  if (updatedPrefix) {
    return locale === 'zh'
      ? `更新于 ${updatedPrefix[1]}`
      : `Updated ${updatedPrefix[1]}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return locale === 'zh' ? `更新于 ${trimmed}` : `Updated ${trimmed}`
  }

  const date = parseAgentMetaToDate(trimmed)
  if (!date) return meta

  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return locale === 'zh' ? `更新于 ${iso}` : `Updated ${iso}`
}
