import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'
import type { OrgMember } from '../types'
import type { MockMemberStatus } from './memberTableDisplay'

export type MockAccountType = 'formal' | 'intern' | 'outsource'

const POSITIONS_ZH = ['产品经理', '工程师', '运营专员', '主管', '总监', '分析师', '专员']
const POSITIONS_EN = [
  'Product Manager',
  'Engineer',
  'Operations Specialist',
  'Supervisor',
  'Director',
  'Analyst',
  'Specialist',
]

function hashMemberId(memberId: string): number {
  let hash = 0
  for (const char of memberId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

export function mockAccountType(memberId: string): MockAccountType {
  const types: MockAccountType[] = ['formal', 'formal', 'formal', 'intern', 'outsource']
  return types[hashMemberId(memberId) % types.length]!
}

export function accountTypeLabel(locale: AppLocale, accountType: MockAccountType): string {
  const keyMap = {
    formal: 'memberAccountTypeFormal',
    intern: 'memberAccountTypeIntern',
    outsource: 'memberAccountTypeOutsource',
  } as const
  return acT(locale, keyMap[accountType])
}

export function mockMemberPosition(member: OrgMember, locale: AppLocale): string {
  if (locale === 'zh' && member.positionZh) return member.positionZh
  if (locale === 'en' && member.positionEn) return member.positionEn
  const hash = hashMemberId(member.id)
  const index = hash % POSITIONS_ZH.length
  if (locale === 'zh') return POSITIONS_ZH[index]!
  return POSITIONS_EN[index]!
}

export function mockEmployeeId(memberId: string, member?: OrgMember): string {
  if (member?.employeeId) return member.employeeId
  const hash = hashMemberId(memberId)
  return `E${String(100000 + (hash % 900000))}`
}

export function mockEmployeeUserId(memberId: string, member?: OrgMember): string {
  if (member?.staffUserId) return member.staffUserId
  const hash = hashMemberId(memberId)
  return `ou_${hash.toString(16).padStart(16, '0').slice(0, 16)}`
}

export const ALL_ACCOUNT_TYPES: MockAccountType[] = ['formal', 'intern', 'outsource']

export const ALL_MEMBER_STATUSES: MockMemberStatus[] = ['active', 'inactive', 'pending']
