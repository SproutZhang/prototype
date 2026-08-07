import type { AppLocale } from '../../../i18n/homeStrings'
import type { AppMarketItem } from './types'

function itemText(item: AppMarketItem, locale: AppLocale) {
  return locale === 'zh'
    ? `${item.nameZh} ${item.descriptionZh} ${item.publisher}`
    : `${item.nameEn} ${item.descriptionEn} ${item.publisher}`
}

export function filterAppMarketItems(items: AppMarketItem[], keyword: string, locale: AppLocale) {
  const q = keyword.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => itemText(item, locale).toLowerCase().includes(q))
}
