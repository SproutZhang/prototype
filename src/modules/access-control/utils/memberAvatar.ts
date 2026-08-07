import type { AppLocale } from '../../../i18n/homeStrings'
import type { OrgMember } from '../types'

function hashMemberId(memberId: string): number {
  let hash = 0
  for (const char of memberId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

function firstLatinInitial(name: string): string | null {
  const words = name.trim().match(/[A-Za-z]+/g)
  if (!words || words.length === 0) return null
  const letter = words[0]?.[0]
  return letter ? letter.toUpperCase() : null
}

export function memberAvatarInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const latin = firstLatinInitial(trimmed)
  if (latin) return latin
  const withoutSuffix = trimmed.replace(/\d+$/, '')
  const base = (withoutSuffix || trimmed).trim()
  if (!base) return '?'
  return base.charAt(0).toUpperCase()
}

export function memberAvatarInitialsForMember(member: OrgMember, locale: AppLocale): string {
  const localized = locale === 'zh' ? member.nameZh : member.nameEn
  return memberAvatarInitials(localized)
}

export function memberAvatarColors(memberId: string): { background: string; color: string } {
  const hue = hashMemberId(memberId) % 360
  return {
    background: `hsl(${hue} 68% 90%)`,
    color: `hsl(${hue} 42% 38%)`,
  }
}
