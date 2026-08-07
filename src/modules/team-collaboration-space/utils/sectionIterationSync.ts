import type { AppLocale } from '../../../i18n/homeStrings'
import {
  SECTION_ITERATION_SEED,
  SECTION_ITERATION_STORAGE_KEY,
} from '../data/sectionIterationSeed'
import type {
  ChangelogSortKey,
  SectionIterationRecord,
  SectionIterationSummary,
  SectionType,
  VersionBump,
} from '../types/sectionIteration'

export function formatSectionVersionLabel(version: { major: number; minor: number; patch: number }): string {
  return `v${version.major}.${version.minor}.${version.patch}`
}

export function compareSectionVersions(
  a: { major: number; minor: number; patch: number },
  b: { major: number; minor: number; patch: number },
): number {
  if (a.major !== b.major) return b.major - a.major
  if (a.minor !== b.minor) return b.minor - a.minor
  return b.patch - a.patch
}

const BUMP_LEVEL_RANK: Record<VersionBump, number> = {
  major: 3,
  minor: 2,
  patch: 1,
}

function readStoredRecords(): SectionIterationRecord[] | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SECTION_ITERATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SectionIterationRecord[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function getAllSectionIterationRecords(): SectionIterationRecord[] {
  return readStoredRecords() ?? SECTION_ITERATION_SEED
}

export function getSectionIterationRecords(
  sectionType: SectionType,
  sectionId: string,
): SectionIterationRecord[] {
  return getAllSectionIterationRecords()
    .filter((record) => record.sectionType === sectionType && record.sectionId === sectionId)
    .sort((a, b) => compareSectionVersions(a.version, b.version) || b.publishedAt.localeCompare(a.publishedAt))
}

/** 当前版本的上一个发布记录（恢复到「最近一次修改之前」） */
export function getPreviousSectionIterationRecord(
  sectionType: SectionType,
  sectionId: string,
): SectionIterationRecord | null {
  const records = getSectionIterationRecords(sectionType, sectionId)
  if (records.length < 2) return null

  const current = records.find((record) => record.isCurrent) ?? records[0]
  const byPublishedAt = [...records].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const currentIndex = byPublishedAt.findIndex((record) => record.id === current.id)
  return byPublishedAt[currentIndex + 1] ?? null
}

export function buildSectionIterationSummaries(records: SectionIterationRecord[]): SectionIterationSummary[] {
  const grouped = new Map<string, SectionIterationRecord[]>()

  for (const record of records) {
    const key = `${record.sectionType}:${record.sectionId}`
    const bucket = grouped.get(key) ?? []
    bucket.push(record)
    grouped.set(key, bucket)
  }

  const summaries: SectionIterationSummary[] = []

  for (const bucket of grouped.values()) {
    const sorted = [...bucket].sort(
      (a, b) => compareSectionVersions(a.version, b.version) || b.publishedAt.localeCompare(a.publishedAt),
    )
    const current = sorted.find((record) => record.isCurrent) ?? sorted[0]
    if (!current) continue

    summaries.push({
      sectionType: current.sectionType,
      sectionId: current.sectionId,
      sectionNameZh: current.sectionNameZh,
      sectionNameEn: current.sectionNameEn,
      currentVersion: current.version,
      currentVersionLabel: current.versionLabel,
      lastBump: current.bump,
      lastPublishedAt: current.publishedAt,
      lastPublisherName: current.publisherName,
      recordCount: bucket.length,
      requiresMigration: current.requiresMigration,
    })
  }

  return summaries
}

export function localizeSectionName(
  summary: Pick<SectionIterationSummary, 'sectionNameZh' | 'sectionNameEn'>,
  locale: AppLocale,
): string {
  return locale === 'zh' ? summary.sectionNameZh : summary.sectionNameEn
}

export function sortSectionIterationSummaries(
  summaries: SectionIterationSummary[],
  sortKey: ChangelogSortKey,
  locale: AppLocale,
): SectionIterationSummary[] {
  const next = [...summaries]

  switch (sortKey) {
    case 'name':
      next.sort((a, b) =>
        localizeSectionName(a, locale).localeCompare(localizeSectionName(b, locale), locale === 'zh' ? 'zh-CN' : 'en'),
      )
      break
    case 'publishedAt':
      next.sort((a, b) => b.lastPublishedAt.localeCompare(a.lastPublishedAt))
      break
    case 'version':
      next.sort((a, b) => compareSectionVersions(a.currentVersion, b.currentVersion))
      break
    case 'bumpLevel':
      next.sort((a, b) => {
        const rankDiff = BUMP_LEVEL_RANK[b.lastBump] - BUMP_LEVEL_RANK[a.lastBump]
        if (rankDiff !== 0) return rankDiff
        return b.lastPublishedAt.localeCompare(a.lastPublishedAt)
      })
      break
  }

  return next
}

export function buildChangelogDetailPath(sectionType: SectionType, sectionId: string): string {
  return `/team/project-space/changelog/${sectionType}/${encodeURIComponent(sectionId)}`
}

export function formatChangelogDate(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatChangelogTime(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function groupRecordsByDate(
  records: SectionIterationRecord[],
  locale: AppLocale,
): Array<{ dateLabel: string; records: SectionIterationRecord[] }> {
  const groups = new Map<string, SectionIterationRecord[]>()

  for (const record of records) {
    const date = new Date(record.publishedAt)
    const dateLabel = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date)
    const bucket = groups.get(dateLabel) ?? []
    bucket.push(record)
    groups.set(dateLabel, bucket)
  }

  return [...groups.entries()].map(([dateLabel, groupedRecords]) => ({
    dateLabel,
    records: groupedRecords.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  }))
}

export function readChangelogSortKey(): ChangelogSortKey {
  if (typeof localStorage === 'undefined') return 'name'
  const raw = localStorage.getItem('tcs-changelog-sort')
  if (raw === 'publishedAt' || raw === 'version' || raw === 'bumpLevel' || raw === 'name') {
    return raw
  }
  return 'name'
}

export function writeChangelogSortKey(sortKey: ChangelogSortKey): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem('tcs-changelog-sort', sortKey)
}
