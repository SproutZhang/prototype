import type { AppLocale } from '../../../i18n/homeStrings'
import type { OrgMember } from '../types'

export type MemberChatGroup = {
  id: string
  nameZh: string
  nameEn: string
  members: OrgMember[]
}

const CHAT_GROUP_SEEDS = [
  { id: 'chat-product', nameZh: '产品协作群', nameEn: 'Product Squad', size: 8 },
  { id: 'chat-engineering', nameZh: '研发冲刺群', nameEn: 'Engineering Sprint', size: 7 },
  { id: 'chat-ops', nameZh: '运营增长群', nameEn: 'Growth Ops', size: 6 },
  { id: 'chat-support', nameZh: '客户支持群', nameEn: 'Customer Support', size: 5 },
  { id: 'chat-leadership', nameZh: '管理层沟通群', nameEn: 'Leadership Sync', size: 4 },
  { id: 'chat-cross', nameZh: '跨部门项目群', nameEn: 'Cross-team Project', size: 9 },
] as const

export function buildMemberChatGroups(candidates: readonly OrgMember[]): MemberChatGroup[] {
  if (candidates.length === 0) return []

  const groups: MemberChatGroup[] = []
  let offset = 0

  for (const seed of CHAT_GROUP_SEEDS) {
    if (offset >= candidates.length) break
    const members = candidates.slice(offset, offset + seed.size)
    offset += seed.size
    if (members.length === 0) continue
    groups.push({
      id: seed.id,
      nameZh: seed.nameZh,
      nameEn: seed.nameEn,
      members,
    })
  }

  return groups
}

export function localizeChatGroupName(group: MemberChatGroup, locale: AppLocale): string {
  return locale === 'zh' ? group.nameZh : group.nameEn
}

export function filterMemberChatGroups(
  groups: readonly MemberChatGroup[],
  query: string,
  locale: AppLocale,
): MemberChatGroup[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...groups]

  return groups
    .map((group) => {
      const groupName = localizeChatGroupName(group, locale).toLowerCase()
      if (groupName.includes(normalized)) return group

      const members = group.members.filter((member) => {
        const name = (locale === 'zh' ? member.nameZh : member.nameEn).toLowerCase()
        const dept = (locale === 'zh' ? member.departmentZh : member.departmentEn).toLowerCase()
        return (
          name.includes(normalized) ||
          dept.includes(normalized) ||
          member.email.toLowerCase().includes(normalized)
        )
      })
      if (members.length === 0) return null
      return { ...group, members }
    })
    .filter((group): group is MemberChatGroup => group != null)
}
