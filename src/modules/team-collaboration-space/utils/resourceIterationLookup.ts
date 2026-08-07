import type { AppLocale } from '../../../i18n/homeStrings'
import { getScenarioDisplayName, ONBOARDING_SCENARIO_SOURCE_NAME } from '../../../i18n/scenarioStrings'
import type { TcsResourceCatalogItem } from '../types'
import type { SectionIterationRecord, SectionType } from '../types/sectionIteration'
import { compareSectionVersions, getSectionIterationRecords } from './sectionIterationSync'
import { listAllUserContent } from './userContentSync'

const ITERATION_SECTION_ALIASES: Partial<
  Record<string, { sectionType: SectionType; sectionId: string }>
> = {
  onboarding: { sectionType: 'workflow', sectionId: ONBOARDING_SCENARIO_SOURCE_NAME },
  'HR Onboarding Agent': { sectionType: 'agent', sectionId: 'HR 助手' },
  'skill-resume-parser': { sectionType: 'skill', sectionId: 'skill-resume-parser' },
  'tool-slack-connector': { sectionType: 'tool', sectionId: 'tool-slack-connector' },
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function daysAgoIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export function resolveResourceSectionType(item: TcsResourceCatalogItem): SectionType {
  if (item.kind === 'workflow' || item.sourceModule === 'scenario-config') return 'workflow'

  const entry = listAllUserContent().find((content) => content.contentKey === item.id)
  if (
    entry?.scopes.includes('skills') &&
    !entry.scopes.includes('agent-library') &&
    !entry.scopes.includes('scenario-config')
  ) {
    return 'skill'
  }
  if (
    entry?.scopes.includes('tools') &&
    !entry.scopes.includes('agent-library') &&
    !entry.scopes.includes('scenario-config')
  ) {
    return 'tool'
  }
  return 'agent'
}

export function resolveResourceIterationSection(item: TcsResourceCatalogItem): {
  sectionType: SectionType
  sectionId: string
} {
  const alias = ITERATION_SECTION_ALIASES[item.id]
  if (alias) return alias

  return {
    sectionType: resolveResourceSectionType(item),
    sectionId: item.id,
  }
}

function buildFallbackResourceIterationRecords(
  item: TcsResourceCatalogItem,
  sectionType: SectionType,
  sectionId: string,
): SectionIterationRecord[] {
  const sectionNameZh = getScenarioDisplayName(item.id, 'zh')
  const sectionNameEn = getScenarioDisplayName(item.id, 'en')
  const hash = hashString(`${sectionType}:${sectionId}`)
  const includePatch = hash % 3 !== 0

  const initialRecord: SectionIterationRecord = {
    id: `iter-fallback-${sectionType}-${sectionId}-v100`,
    sectionType,
    sectionId,
    sectionNameZh,
    sectionNameEn,
    version: { major: 1, minor: 0, patch: 0 },
    versionLabel: 'v1.0.0',
    bump: 'minor',
    publishedAt: daysAgoIso(24 + (hash % 12)),
    publisherId: 'member-wang',
    publisherName: '王经理',
    summaryZh: `初始发布「${sectionNameZh}」`,
    summaryEn: `Initial release of ${sectionNameEn}`,
    changeItems: [
      {
        category: sectionType === 'workflow' ? 'workflow' : 'other',
        level: 'minor',
        descriptionZh: '创建基础配置与默认运行参数',
        descriptionEn: 'Created baseline configuration and default runtime parameters',
      },
    ],
    backwardCompatible: true,
    requiresMigration: false,
    isCurrent: !includePatch,
  }

  const records = [initialRecord]

  if (includePatch) {
    records.push({
      id: `iter-fallback-${sectionType}-${sectionId}-v101`,
      sectionType,
      sectionId,
      sectionNameZh,
      sectionNameEn,
      version: { major: 1, minor: 0, patch: 1 },
      versionLabel: 'v1.0.1',
      bump: 'patch',
      publishedAt: daysAgoIso(2 + (hash % 6)),
      publisherId: 'member-wang',
      publisherName: '王经理',
      summaryZh: '修复运行稳定性并优化提示文案',
      summaryEn: 'Fixed runtime stability and refined prompt copy',
      changeItems: [
        {
          category: 'fix',
          level: 'patch',
          descriptionZh: '修复边界条件下的异常退出',
          descriptionEn: 'Fixed abnormal exit under edge conditions',
        },
      ],
      backwardCompatible: true,
      requiresMigration: false,
      isCurrent: true,
    })
  }

  return records.sort(
    (a, b) => compareSectionVersions(a.version, b.version) || b.publishedAt.localeCompare(a.publishedAt),
  )
}

export function getResourceIterationRecords(
  item: TcsResourceCatalogItem,
  _locale: AppLocale,
): SectionIterationRecord[] {
  const { sectionType, sectionId } = resolveResourceIterationSection(item)
  const records = getSectionIterationRecords(sectionType, sectionId)
  if (records.length > 0) return records

  if (sectionId !== item.id) {
    const byResourceId = getSectionIterationRecords(sectionType, item.id)
    if (byResourceId.length > 0) return byResourceId
  }

  return buildFallbackResourceIterationRecords(item, sectionType, sectionId)
}
