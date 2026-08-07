import type { AppLocale } from '../../../i18n/homeStrings'
import { TCS_ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import { listAllUserContent } from './userContentSync'

export type ResourceCreatorDisplay = {
  label: string
  variant: 'default' | 'template'
}

const DEMO_DEFAULT_PUBLISHER_MEMBER_ID = 'member-mgr-wang'

function localizeMemberName(memberId: string, locale: AppLocale): string {
  const member = TCS_ORG_MEMBERS_SEED.find((entry) => entry.id === memberId)
  if (!member) return memberId
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function formatCreatorLabel(name: string, locale: AppLocale): string {
  return locale === 'zh' ? `创建者：${name}` : `Created by ${name}`
}

function formatSharedByLabel(name: string, locale: AppLocale): string {
  return locale === 'zh' ? `共享者：${name}` : `Shared by ${name}`
}

function resolveSharedByDisplay(
  resourceId: string,
  locale: AppLocale,
  spaceId: string,
): ResourceCreatorDisplay {
  const entry = listAllUserContent().find((item) => item.contentKey === resourceId)
  const publisherId =
    entry?.publishedTargets.find((target) => target.spaceId === spaceId)?.publisherMemberId ??
    entry?.ownerMemberId ??
    DEMO_DEFAULT_PUBLISHER_MEMBER_ID

  return {
    label: formatSharedByLabel(localizeMemberName(publisherId, locale), locale),
    variant: 'default',
  }
}

/** 协作空间内资源展示共享者；无 spaceId 时展示创建者（如独立列表） */
export function resolveResourceCreatorDisplay(
  resourceId: string,
  locale: AppLocale,
  spaceId?: string,
): ResourceCreatorDisplay | null {
  if (spaceId) {
    return resolveSharedByDisplay(resourceId, locale, spaceId)
  }

  const entry = listAllUserContent().find((item) => item.contentKey === resourceId)
  if (!entry) return null

  if (entry.creatorLabel?.trim()) {
    return {
      label: entry.creatorLabel.trim(),
      variant: entry.creatorVariant ?? 'default',
    }
  }

  return {
    label: formatCreatorLabel(localizeMemberName(entry.ownerMemberId, locale), locale),
    variant: 'default',
  }
}
