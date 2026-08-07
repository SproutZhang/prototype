import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'

export type MockMemberStatus = 'active' | 'inactive' | 'pending'

function hashMemberId(memberId: string): number {
  let hash = 0
  for (const char of memberId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

export function mockMemberStatus(memberId: string): MockMemberStatus {
  const statuses: MockMemberStatus[] = ['active', 'active', 'active', 'pending', 'inactive']
  return statuses[hashMemberId(memberId) % statuses.length]!
}

export function memberStatusLabel(locale: AppLocale, status: MockMemberStatus): string {
  const keyMap = {
    active: 'memberStatusActive',
    inactive: 'memberStatusInactive',
    pending: 'memberStatusPending',
  } as const
  return acT(locale, keyMap[status])
}

export function memberStatusActionButtonLabel(
  locale: AppLocale,
  target: MockMemberStatus,
  current: MockMemberStatus,
): string {
  if (target === 'active') {
    return current === 'inactive'
      ? acT(locale, 'memberStatusActionReactivate')
      : acT(locale, 'memberStatusActionActivate')
  }
  if (target === 'inactive') {
    return acT(locale, 'memberStatusActionDeactivate')
  }
  return memberStatusLabel(locale, target)
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function resolveMemberStatus(
  memberId: string,
  overrides?: Record<string, MockMemberStatus>,
): MockMemberStatus {
  return overrides?.[memberId] ?? mockMemberStatus(memberId)
}

export function mockMemberLastLogin(
  locale: AppLocale,
  memberId: string,
  statusOverride?: MockMemberStatus,
): string {
  const status = statusOverride ?? mockMemberStatus(memberId)
  if (status === 'pending') {
    return acT(locale, 'memberLastLoginNever')
  }

  const hash = hashMemberId(memberId)
  const daysAgo = hash % 28
  const hours = hash % 24
  const minutes = hash % 60
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)

  if (locale === 'zh') {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(hours)}:${pad2(minutes)}`
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
