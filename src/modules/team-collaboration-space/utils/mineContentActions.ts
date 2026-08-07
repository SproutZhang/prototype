import { formatAgentPublishedToastSub } from '../../../i18n/agentLibraryStrings'
import type { AppLocale } from '../../../i18n/homeStrings'
import { resolveCurrentMemberId } from './currentMember'
import {
  markContentActivated,
  markContentFrozen,
  markContentPublished,
  removeContentLifecycle,
  USER_CONTENT_DELETED_EVENT,
  type UserContentDeletedDetail,
  getContentLifecycleSnapshot,
} from './contentLifecycleSync'
import { publishContentToSpace } from './publishSpaceSync'
import {
  resolvePublishGroupIdFromTargetId,
  resolvePublishGroupLabel,
  resolvePublishSpaceIdFromTargetId,
} from './publishProjectGroupTargets'
import type { UserContentItem } from '../types/userContent'
import {
  addUserContentPublishedTarget,
  removeUserContentByKey,
  updateUserContentLifecycle,
} from './userContentSync'

function resolvePublishKind(item: UserContentItem): 'agent' | 'workflow' {
  if (item.scopes.includes('agent-library') && item.tag !== '') {
    return 'agent'
  }
  return 'workflow'
}

function resolveSourceModule(item: UserContentItem): 'agent-library' | 'scenario-config' {
  if (item.scopes.includes('agent-library')) return 'agent-library'
  return 'scenario-config'
}

export function publishMineContentItem(
  item: UserContentItem,
  targetId: string,
  locale: AppLocale,
): { title: string; sub?: string } {
  const spaceId = resolvePublishSpaceIdFromTargetId(targetId)
  if (!spaceId) {
    return {
      title: locale === 'zh' ? '无法发布' : 'Unable to publish',
      sub:
        locale === 'zh'
          ? '该分组下暂无项目空间，请先创建项目后再发布。'
          : 'No project space in this group yet. Create one first.',
    }
  }

  const groupId = resolvePublishGroupIdFromTargetId(targetId)
  const kind = resolvePublishKind(item)
  const sourceModule = resolveSourceModule(item)

  publishContentToSpace(spaceId, {
    id: item.contentKey,
    kind,
    sourceModule,
    desc: item.desc,
    meta: item.meta,
  })

  markContentPublished(item.contentKey, spaceId)
  addUserContentPublishedTarget(item.contentKey, {
    spaceId,
    publishedAt: new Date().toISOString(),
    publisherMemberId: resolveCurrentMemberId(),
  })
  updateUserContentLifecycle(item.contentKey, 'published', { hasUnpublishedChanges: false })

  const spaceLabel = resolvePublishGroupLabel(groupId, locale)

  return {
    title: locale === 'zh' ? '发布成功' : 'Published',
    sub: formatAgentPublishedToastSub(locale, spaceLabel),
  }
}

export function freezeMineContentItem(item: UserContentItem, locale: AppLocale): { title: string; sub?: string } {
  markContentFrozen(item.contentKey)
  updateUserContentLifecycle(item.contentKey, 'frozen', { hasUnpublishedChanges: false })
  return {
    title: locale === 'zh' ? '已冻结' : 'Frozen',
    sub: locale === 'zh' ? '该内容已暂停使用。' : 'This item has been paused.',
  }
}

export function activateMineContentItem(item: UserContentItem, locale: AppLocale): { title: string; sub?: string } {
  markContentActivated(item.contentKey)
  const lifecycle = getContentLifecycleSnapshot()
  const published =
    lifecycle.publishedAgentNames.has(item.contentKey) ||
    lifecycle.publishedScenarioSourceNames.has(item.contentKey) ||
    item.publishedTargets.length > 0
  const nextStatus = published ? 'published' : 'draft'
  updateUserContentLifecycle(item.contentKey, nextStatus, {
    hasUnpublishedChanges: lifecycle.agentPublishDirtyNames.has(item.contentKey),
  })
  return {
    title: locale === 'zh' ? '已激活' : 'Activated',
    sub: locale === 'zh' ? '该内容已恢复使用。' : 'This item is available again.',
  }
}

export function deleteMineContentItem(item: UserContentItem, locale: AppLocale): { title: string; sub?: string } {
  removeUserContentByKey(item.contentKey)
  removeContentLifecycle(item.contentKey)
  window.dispatchEvent(
    new CustomEvent<UserContentDeletedDetail>(USER_CONTENT_DELETED_EVENT, {
      detail: { contentKey: item.contentKey },
    }),
  )
  return {
    title: locale === 'zh' ? '已删除' : 'Deleted',
    sub: locale === 'zh' ? '内容已从「我的项目」移除。' : 'The item has been removed from My projects.',
  }
}
