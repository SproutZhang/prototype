import type { AppLocale } from '../i18n/homeStrings'
import { TCS_ORG_MEMBERS_SEED } from '../modules/team-collaboration-space/data/orgMembersSeed'
import type { Agent } from '../types/agent'

export type AgentCreatorDisplay = {
  label: string
  variant: 'default' | 'template'
}

const LOGIN_EMAIL_TO_MEMBER_ID: Record<string, string> = {
  'admin@studiox.com': 'member-mgr-wang',
  'manager@studiox.com': 'member-mgr-wang',
  'manager-1@studiox.com': 'member-hr-zhang',
  'user@studiox.com': 'member-it-li',
  'user-1@studiox.com': 'member-ops-chen',
}

/** 演示种子数据中的角色占位 → 组织成员 */
const LEGACY_CREATOR_TO_MEMBER_ID: Record<string, string> = {
  Manager: 'member-mgr-wang',
  Admin: 'member-workspace-admin',
  User: 'member-it-li',
}

function localizeMemberName(memberId: string, locale: AppLocale): string {
  const member = TCS_ORG_MEMBERS_SEED.find((entry) => entry.id === memberId)
  if (!member) return memberId
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function resolveCreatorMemberId(creator: string): string | null {
  const trimmed = creator.trim()
  if (!trimmed) return null
  if (LEGACY_CREATOR_TO_MEMBER_ID[trimmed]) {
    return LEGACY_CREATOR_TO_MEMBER_ID[trimmed]
  }
  if (TCS_ORG_MEMBERS_SEED.some((member) => member.id === trimmed)) {
    return trimmed
  }
  const byName = TCS_ORG_MEMBERS_SEED.find(
    (member) => member.nameZh === trimmed || member.nameEn === trimmed,
  )
  return byName?.id ?? null
}

function resolveCreatorDisplayName(creator: string, locale: AppLocale): string {
  const memberId = resolveCreatorMemberId(creator)
  if (memberId) return localizeMemberName(memberId, locale)
  return creator.trim()
}

export function resolveAgentCreatorName(_roleLabel: string, email: string): string {
  const memberId =
    LOGIN_EMAIL_TO_MEMBER_ID[email.trim().toLowerCase()] ?? 'member-mgr-wang'
  const member = TCS_ORG_MEMBERS_SEED.find((entry) => entry.id === memberId)
  return member?.nameZh ?? '王经理'
}

export function manualAgentAttribution(createdBy: string): Pick<Agent, 'createdBy' | 'provenance'> {
  return { createdBy: createdBy.trim(), provenance: 'manual' }
}

export function appMarketTemplateAttribution(): Pick<Agent, 'provenance'> {
  return { provenance: 'app-market-template' }
}

export function getAgentCreatorDisplay(agent: Agent, locale: AppLocale): AgentCreatorDisplay {
  if (agent.provenance === 'app-market-template') {
    return {
      label: locale === 'zh' ? '模板引入' : 'From template',
      variant: 'template',
    }
  }
  const creator = agent.createdBy?.trim()
  if (creator) {
    const displayName = resolveCreatorDisplayName(creator, locale)
    return {
      label: locale === 'zh' ? `创建者：${displayName}` : `Created by ${displayName}`,
      variant: 'default',
    }
  }
  return {
    label: locale === 'zh' ? '创建者：系统' : 'Created by System',
    variant: 'default',
  }
}
