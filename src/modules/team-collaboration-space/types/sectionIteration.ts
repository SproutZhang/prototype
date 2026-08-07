export type SectionType = 'workflow' | 'agent' | 'skill' | 'tool'

export type VersionBump = 'major' | 'minor' | 'patch'

export type SectionVersion = {
  major: number
  minor: number
  patch: number
}

export type SectionChangeItem = {
  category: 'trigger' | 'workflow' | 'field' | 'integration' | 'skill' | 'tool' | 'fix' | 'other'
  level: VersionBump
  descriptionZh: string
  descriptionEn: string
}

export type SectionIterationRecord = {
  id: string
  sectionType: SectionType
  sectionId: string
  sectionNameZh: string
  sectionNameEn: string
  version: SectionVersion
  versionLabel: string
  bump: VersionBump
  publishedAt: string
  publisherId: string
  publisherName: string
  summaryZh: string
  summaryEn: string
  changeItems: SectionChangeItem[]
  migrationNoteZh?: string
  migrationNoteEn?: string
  backwardCompatible: boolean
  requiresMigration: boolean
  isCurrent: boolean
  projectGroupId?: string
  projectId?: string
  linkedScenarioRecordId?: string
}

export type SectionIterationSummary = {
  sectionType: SectionType
  sectionId: string
  sectionNameZh: string
  sectionNameEn: string
  currentVersion: SectionVersion
  currentVersionLabel: string
  lastBump: VersionBump
  lastPublishedAt: string
  lastPublisherName: string
  recordCount: number
  requiresMigration: boolean
}

export type ChangelogSortKey = 'name' | 'publishedAt' | 'version' | 'bumpLevel'

export const CHANGELOG_SORT_STORAGE_KEY = 'tcs-changelog-sort'
