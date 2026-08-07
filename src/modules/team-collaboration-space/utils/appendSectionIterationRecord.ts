import { readLoginSession } from '../../../auth/session'
import { isLoginRoleTier } from '../../../auth/types'
import { ORG_MEMBERS_SEED } from '../../access-control/data/orgMembersSeed'
import type { AppLocale } from '../../../i18n/homeStrings'
import {
  SECTION_ITERATION_SEED,
  SECTION_ITERATION_STORAGE_KEY,
} from '../data/sectionIterationSeed'
import type {
  SectionChangeItem,
  SectionIterationRecord,
  SectionType,
  VersionBump,
} from '../types/sectionIteration'
import { formatSectionVersionLabel } from './sectionIterationSync'
import { resolveCurrentMemberId } from './currentMember'

export const SECTION_ITERATION_CHANGED_EVENT = 'tcs-section-iteration-changed'

export type SectionIterationPublishPayload = {
  bump: VersionBump
  summaryZh: string
  summaryEn: string
  migrationNoteZh?: string
  migrationNoteEn?: string
  changeItems?: SectionChangeItem[]
}

export type AppendSectionIterationInput = {
  sectionType: SectionType
  sectionId: string
  sectionNameZh: string
  sectionNameEn: string
} & SectionIterationPublishPayload

function readAllRecords(): SectionIterationRecord[] {
  if (typeof localStorage === 'undefined') return [...SECTION_ITERATION_SEED]
  try {
    const raw = localStorage.getItem(SECTION_ITERATION_STORAGE_KEY)
    if (!raw) return [...SECTION_ITERATION_SEED]
    const parsed = JSON.parse(raw) as SectionIterationRecord[]
    return Array.isArray(parsed) ? parsed : [...SECTION_ITERATION_SEED]
  } catch {
    return [...SECTION_ITERATION_SEED]
  }
}

function writeAllRecords(records: SectionIterationRecord[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SECTION_ITERATION_STORAGE_KEY, JSON.stringify(records))
  window.dispatchEvent(new CustomEvent(SECTION_ITERATION_CHANGED_EVENT))
}

export function resolveCurrentPublisherName(locale: AppLocale): string {
  const memberId = resolveCurrentMemberId()
  const member = ORG_MEMBERS_SEED.find((row) => row.id === memberId)
  if (member) return locale === 'zh' ? member.nameZh : member.nameEn
  const session = readLoginSession()
  if (session?.role === 'admin' || isLoginRoleTier(session?.role, 'manager')) {
    return locale === 'zh' ? '王经理' : 'Manager Wang'
  }
  return locale === 'zh' ? '李工' : 'Li Gong'
}

function getCurrentRecord(
  records: SectionIterationRecord[],
  sectionType: SectionType,
  sectionId: string,
): SectionIterationRecord | undefined {
  return records
    .filter((record) => record.sectionType === sectionType && record.sectionId === sectionId && record.isCurrent)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]
}

function computeNextVersion(current: SectionIterationRecord | undefined, bump: VersionBump) {
  if (!current) {
    return { major: 1, minor: 0, patch: 0 }
  }
  const { major, minor, patch } = current.version
  if (bump === 'major') return { major: major + 1, minor: 0, patch: 0 }
  if (bump === 'minor') return { major, minor: minor + 1, patch: 0 }
  return { major, minor, patch: patch + 1 }
}

export function validateSectionIterationPublish(payload: SectionIterationPublishPayload): boolean {
  if (payload.bump !== 'major') return true
  return Boolean(payload.migrationNoteZh?.trim())
}

export function appendSectionIterationRecord(input: AppendSectionIterationInput): SectionIterationRecord {
  if (!validateSectionIterationPublish(input)) {
    throw new Error('Major version publish requires migration notes.')
  }

  const records = readAllRecords()
  const current = getCurrentRecord(records, input.sectionType, input.sectionId)
  const version = computeNextVersion(current, input.bump)
  const versionLabel = formatSectionVersionLabel(version)
  const now = new Date().toISOString()
  const publisherId = resolveCurrentMemberId()
  const publisherName = resolveCurrentPublisherName('zh')

  const nextRecord: SectionIterationRecord = {
    id: `iter-${input.sectionType}-${input.sectionId}-${Date.now()}`,
    sectionType: input.sectionType,
    sectionId: input.sectionId,
    sectionNameZh: input.sectionNameZh,
    sectionNameEn: input.sectionNameEn,
    version,
    versionLabel,
    bump: input.bump,
    publishedAt: now,
    publisherId,
    publisherName,
    summaryZh: input.summaryZh.trim(),
    summaryEn: input.summaryEn.trim(),
    changeItems: input.changeItems ?? [],
    migrationNoteZh: input.bump === 'major' ? input.migrationNoteZh?.trim() : undefined,
    migrationNoteEn: input.bump === 'major' ? input.migrationNoteEn?.trim() : undefined,
    backwardCompatible: input.bump !== 'major',
    requiresMigration: input.bump === 'major',
    isCurrent: true,
  }

  const nextRecords = records.map((record) =>
    record.sectionType === input.sectionType && record.sectionId === input.sectionId
      ? { ...record, isCurrent: false }
      : record,
  )
  nextRecords.push(nextRecord)
  writeAllRecords(nextRecords)
  return nextRecord
}

export function recordInitialSectionIteration(input: Omit<AppendSectionIterationInput, 'bump'> & { bump?: VersionBump }): SectionIterationRecord | null {
  const records = readAllRecords()
  const exists = records.some(
    (record) => record.sectionType === input.sectionType && record.sectionId === input.sectionId,
  )
  if (exists) return null

  return appendSectionIterationRecord({
    ...input,
    bump: input.bump ?? 'minor',
    summaryZh: input.summaryZh || '初始发布',
    summaryEn: input.summaryEn || 'Initial release',
  })
}

export function rollbackSectionIterationRecord(recordId: string): SectionIterationRecord | null {
  const records = readAllRecords()
  const target = records.find((record) => record.id === recordId)
  if (!target) return null

  const nextRecords = records.map((record) => {
    if (record.sectionType === target.sectionType && record.sectionId === target.sectionId) {
      return { ...record, isCurrent: record.id === recordId }
    }
    return record
  })
  writeAllRecords(nextRecords)
  return target
}
