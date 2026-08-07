import type { AppLocale } from '../../../i18n/homeStrings'
import { ONBOARDING_SCENARIO_SOURCE_NAME } from '../../../i18n/scenarioStrings'
import type { TcsResourceCatalogItem } from '../types'
import type { UserContentItem } from '../types/userContent'
import { listAllUserContent } from './userContentSync'

const MANAGERIAL_NAME_FORCE = new Set<string>([
  ONBOARDING_SCENARIO_SOURCE_NAME,
  '入职流程编排Agent',
  '入职工作流画布',
])

function pickScenarioCategory(seed: string): NonNullable<UserContentItem['category']> {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0
  const v = h % 4
  return v === 0 ? 'medical' : v === 1 ? 'finance' : v === 2 ? 'tech' : 'accounting'
}

function pickAgentTag(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % 4 === 0 ? 'Managerial Agent' : 'Single Agent'
}

function getAgentCardTagLabel(tag: string, locale: AppLocale): string {
  if (locale === 'zh') return tag === 'Managerial Agent' ? '管理 Agent' : '单 Agent'
  return tag === 'Managerial Agent' ? 'Manager Agent' : 'Agent'
}

function getCategoryLabel(category: UserContentItem['category'], locale: AppLocale): string {
  if (locale === 'zh') {
    if (category === 'medical') return '医疗'
    if (category === 'finance') return '金融'
    if (category === 'tech') return '科技'
    if (category === 'accounting') return '会计'
    return '场景'
  }
  if (category === 'medical') return 'Medical'
  if (category === 'finance') return 'Finance'
  if (category === 'tech') return 'Tech'
  if (category === 'accounting') return 'Accounting'
  return 'Scenario'
}

function isScenarioResource(item: TcsResourceCatalogItem): boolean {
  return item.sourceModule === 'scenario-config' || item.kind === 'workflow'
}

function resolveAgentTag(resourceId: string, entry: UserContentItem | undefined): string {
  if (entry?.tag) return entry.tag
  if (MANAGERIAL_NAME_FORCE.has(resourceId)) return 'Managerial Agent'
  return pickAgentTag(resourceId)
}

/** 与「我的内容」卡片底部标签一致：Agent 显示单/管理 Agent，场景显示行业分类 */
export function resolveResourceCardTagLabel(item: TcsResourceCatalogItem, locale: AppLocale): string {
  const entry = listAllUserContent().find((content) => content.contentKey === item.id)

  if (isScenarioResource(item)) {
    return getCategoryLabel(entry?.category ?? pickScenarioCategory(item.id), locale)
  }

  return getAgentCardTagLabel(resolveAgentTag(item.id, entry), locale)
}
