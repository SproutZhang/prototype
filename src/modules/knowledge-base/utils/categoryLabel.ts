import type { AppLocale } from '../../../i18n/homeStrings'
import type { KnowledgeBaseCategoryDef } from '../types'

export function getKnowledgeBaseCategoryLabel(
  categories: readonly KnowledgeBaseCategoryDef[],
  categoryId: string,
  locale: AppLocale,
): string {
  const found = categories.find((c) => c.id === categoryId)
  if (!found) return categoryId
  return locale === 'zh' ? found.nameZh : found.nameEn
}
