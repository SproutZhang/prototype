import type { AppLocale } from '../../i18n/homeStrings'
import type { Agent } from '../../types/agent'
import { appMarketTemplateAttribution } from '../../utils/agentCardAttribution'
import type { AppMarketItem } from './shared/types'

export function makeUniqueWorkspaceName(baseName: string, usedNames: Set<string>) {
  const trimmed = baseName.trim()
  const fallback = trimmed || 'Untitled'
  if (!usedNames.has(fallback)) return fallback
  let index = 1
  while (usedNames.has(`${fallback} (${index})`)) {
    index += 1
  }
  return `${fallback} (${index})`
}

export function buildWorkspaceAgentFromTemplate(
  item: AppMarketItem,
  locale: AppLocale,
  usedNames: Set<string>,
): Agent {
  const label = locale === 'zh' ? item.nameZh : item.nameEn
  const name = makeUniqueWorkspaceName(label, usedNames)
  return {
    name,
    label,
    desc: locale === 'zh' ? item.descriptionZh : item.descriptionEn,
    meta: 'just now',
    ...appMarketTemplateAttribution(),
  }
}

export function isManagerialMarketAgentItem(item: AppMarketItem) {
  return (item.subAgents?.length ?? 0) > 0
}

export function resolveMarketTemplateModalDescription(item: AppMarketItem, locale: AppLocale) {
  return locale === 'zh'
    ? (item.modalDescriptionZh ?? item.descriptionZh)
    : (item.modalDescriptionEn ?? item.descriptionEn ?? item.descriptionZh)
}
