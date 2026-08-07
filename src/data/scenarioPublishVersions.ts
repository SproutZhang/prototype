import { ONBOARDING_SCENARIO_SOURCE_NAME } from '../i18n/scenarioStrings'
import type { AppLocale } from '../i18n/homeStrings'
import type { SectionIterationRecord, VersionBump } from '../modules/team-collaboration-space/types/sectionIteration'

export type PublishVersionDateKey = 'jun8' | 'may28' | 'today'

export type ScenarioPublishVersion = {
  id: string
  /** @deprecated 保留兼容旧数据 */
  versionNumber?: number
  version: { major: number; minor: number; patch: number }
  versionLabel: string
  bump: VersionBump
  time: string
  publishedAtMs: number
  dateKey: PublishVersionDateKey
  publisherName: string
  publisherInitial: string
  isCurrent: boolean
  summaryZh?: string
  summaryEn?: string
  migrationNoteZh?: string
  migrationNoteEn?: string
  linkedIterationRecordId?: string
}

export type PublishVersionListItem =
  | { type: 'date'; dateKey: PublishVersionDateKey }
  | { type: 'version'; version: ScenarioPublishVersion }

const DEFAULT_VERSIONS: Record<string, ScenarioPublishVersion[]> = {
  [ONBOARDING_SCENARIO_SOURCE_NAME]: [
    {
      id: 'onboarding-v3',
      version: { major: 2, minor: 0, patch: 0 },
      versionLabel: 'v2.0.0',
      bump: 'major',
      time: '17:08',
      publishedAtMs: Date.UTC(2026, 5, 8, 9, 8),
      dateKey: 'jun8',
      publisherName: 'Oak',
      publisherInitial: 'O',
      isCurrent: true,
      summaryZh: '触发条件由定时改为 Webhook，依赖环境需升级',
      summaryEn: 'Trigger changed from cron to webhook; dependent environments must upgrade',
      migrationNoteZh:
        '所有依赖此工作流的下游 Agent 与集成需重新绑定 Webhook 地址；运行中实例不会自动升级，请手动迁移或锁定 v1.1.1。',
      migrationNoteEn:
        'Downstream agents and integrations must re-bind the webhook URL. Running instances will not auto-upgrade—migrate manually or pin v1.1.1.',
      linkedIterationRecordId: 'iter-wf-onboarding-v200',
    },
    {
      id: 'onboarding-v2',
      version: { major: 1, minor: 1, patch: 0 },
      versionLabel: 'v1.1.0',
      bump: 'minor',
      time: '14:20',
      publishedAtMs: Date.UTC(2026, 5, 8, 6, 20),
      dateKey: 'jun8',
      publisherName: 'Oak',
      publisherInitial: 'O',
      isCurrent: false,
      summaryZh: '新增背景调查知识库挂载与可选字段',
      summaryEn: 'Added background-check knowledge base and optional fields',
      linkedIterationRecordId: 'iter-wf-onboarding-v110',
    },
    {
      id: 'onboarding-v1',
      version: { major: 1, minor: 0, patch: 0 },
      versionLabel: 'v1.0.0',
      bump: 'minor',
      time: '14:20',
      publishedAtMs: Date.UTC(2026, 4, 28, 6, 20),
      dateKey: 'may28',
      publisherName: 'Oak',
      publisherInitial: 'O',
      isCurrent: false,
      summaryZh: '初始发布员工入职工作流',
      summaryEn: 'Initial release of employee onboarding workflow',
      linkedIterationRecordId: 'iter-wf-onboarding-v100',
    },
  ],
}

function formatTime(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function getDateKey(date: Date): PublishVersionDateKey {
  const month = date.getMonth()
  const day = date.getDate()
  if (month === 5 && day === 8) return 'jun8'
  if (month === 4 && day === 28) return 'may28'
  return 'today'
}

export function formatPublishVersionLabel(version: ScenarioPublishVersion | number): string {
  if (typeof version === 'number') return `v1.${version}`
  return version.versionLabel
}

export function getPublishVersionsForScenario(
  sourceName: string,
  stored: Record<string, ScenarioPublishVersion[]>,
): ScenarioPublishVersion[] {
  return stored[sourceName] ?? DEFAULT_VERSIONS[sourceName] ?? []
}

export function buildPublishVersionListItems(versions: ScenarioPublishVersion[]): PublishVersionListItem[] {
  const sorted = [...versions].sort((a, b) => b.publishedAtMs - a.publishedAtMs)
  const items: PublishVersionListItem[] = []
  let lastDateKey: PublishVersionDateKey | null = null

  for (const version of sorted) {
    if (version.dateKey !== lastDateKey) {
      items.push({ type: 'date', dateKey: version.dateKey })
      lastDateKey = version.dateKey
    }
    items.push({ type: 'version', version })
  }

  return items
}

export function appendScenarioPublishVersionFromIteration(
  sourceName: string,
  iterationRecord: SectionIterationRecord,
  stored: Record<string, ScenarioPublishVersion[]>,
  locale: AppLocale,
): Record<string, ScenarioPublishVersion[]> {
  const existing = getPublishVersionsForScenario(sourceName, stored)
  const now = new Date()
  const nextVersion: ScenarioPublishVersion = {
    id: `${sourceName}-${iterationRecord.id}`,
    version: { ...iterationRecord.version },
    versionLabel: iterationRecord.versionLabel,
    bump: iterationRecord.bump,
    time: formatTime(now, locale),
    publishedAtMs: now.getTime(),
    dateKey: getDateKey(now),
    publisherName: iterationRecord.publisherName,
    publisherInitial: iterationRecord.publisherName.slice(0, 1).toUpperCase(),
    isCurrent: true,
    summaryZh: iterationRecord.summaryZh,
    summaryEn: iterationRecord.summaryEn,
    migrationNoteZh: iterationRecord.migrationNoteZh,
    migrationNoteEn: iterationRecord.migrationNoteEn,
    linkedIterationRecordId: iterationRecord.id,
  }

  return {
    ...stored,
    [sourceName]: [nextVersion, ...existing.map((item) => ({ ...item, isCurrent: false }))],
  }
}

/** @deprecated 使用 appendScenarioPublishVersionFromIteration */
export function appendPublishVersion(
  sourceName: string,
  stored: Record<string, ScenarioPublishVersion[]>,
  locale: AppLocale,
): Record<string, ScenarioPublishVersion[]> {
  const existing = getPublishVersionsForScenario(sourceName, stored)
  const now = new Date()
  const current = existing.find((item) => item.isCurrent) ?? existing[0]
  const nextVersionNumber = existing.reduce((max, item) => Math.max(max, item.versionNumber ?? 0), 0) + 1
  const nextSemver = current
    ? { major: current.version.major, minor: current.version.minor + 1, patch: 0 }
    : { major: 1, minor: 0, patch: 0 }

  const nextVersion: ScenarioPublishVersion = {
    id: `${sourceName}-v${nextVersionNumber}-${now.getTime()}`,
    versionNumber: nextVersionNumber,
    version: nextSemver,
    versionLabel: `v${nextSemver.major}.${nextSemver.minor}.${nextSemver.patch}`,
    bump: 'minor',
    time: formatTime(now, locale),
    publishedAtMs: now.getTime(),
    dateKey: getDateKey(now),
    publisherName: 'Oak',
    publisherInitial: 'O',
    isCurrent: true,
    summaryZh: '发布了新版本',
    summaryEn: 'Published a new version',
  }

  return {
    ...stored,
    [sourceName]: [nextVersion, ...existing.map((item) => ({ ...item, isCurrent: false }))],
  }
}
