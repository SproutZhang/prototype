import { getCollaborationSpaceOptions } from '../../../data/scenarioPublishSpaces'
import type { AppLocale } from '../../../i18n/homeStrings'
import { TCS_ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import type { UserContentSourceModule } from '../types/userContent'
import {
  markContentActivated,
  markContentPublished,
  removeContentLifecycle,
  USER_CONTENT_DELETED_EVENT,
  type UserContentDeletedDetail,
} from './contentLifecycleSync'
import { getPublicSpaceTargetIds } from './publicSpaceIds'
import { publishContentToSpace, removeResourceFromSpace, subscribePublishSpaceSync } from './publishSpaceSync'
import {
  addUserContentPublishedTarget,
  listAllUserContent,
  removeUserContentByKey,
  removeUserContentPublishedTarget,
  subscribeUserContentSync,
} from './userContentSync'

export type PublicSpaceSharedScope = 'all' | 'mine'

export type PublicSpaceSharedSnapshot = {
  all: PublicSpaceSharedItem[]
  mine: PublicSpaceSharedItem[]
}

export type PublicSpaceSharedItem = {
  contentKey: string
  displayName: string
  desc: string
  meta: string
  kind: 'agent' | 'workflow'
  sourceModule: UserContentSourceModule
  spaceId: string
  spaceLabel: string
  publisherMemberId: string
  publisherLabel: string
  publishedAt: string
  ownerMemberId: string
}

const listeners = new Set<() => void>()
let listCache: { version: number; cacheKey: string; items: PublicSpaceSharedItem[] } | null = null
let snapshotCache: { version: number; cacheKey: string; snapshot: PublicSpaceSharedSnapshot } | null = null
let listVersion = 0

function invalidateListCache() {
  listVersion += 1
  listCache = null
  snapshotCache = null
}

function notifyPublicSpaceShared() {
  invalidateListCache()
  listeners.forEach((listener) => listener())
}

export function subscribePublicSpaceShared(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function localizeMemberName(memberId: string, locale: AppLocale): string {
  const member = TCS_ORG_MEMBERS_SEED.find((entry) => entry.id === memberId)
  if (!member) return memberId
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function resolveSpaceLabel(spaceId: string, locale: AppLocale): string {
  return getCollaborationSpaceOptions(locale).find((option) => option.id === spaceId)?.label ?? spaceId
}

function resolveKind(sourceModule: UserContentSourceModule, tag: string): 'agent' | 'workflow' {
  if (sourceModule === 'agent-library' && tag) return 'agent'
  return 'workflow'
}

function buildPublicSpaceSharedRows(options: {
  locale: AppLocale
  viewerMemberId: string
  scope: PublicSpaceSharedScope
}): PublicSpaceSharedItem[] {
  const publicSpaceIds = getPublicSpaceTargetIds()
  const rows: PublicSpaceSharedItem[] = []

  for (const entry of listAllUserContent()) {
    const sourceModule: UserContentSourceModule = entry.scopes.includes('agent-library')
      ? 'agent-library'
      : 'scenario-config'
    for (const target of entry.publishedTargets) {
      if (!publicSpaceIds.has(target.spaceId)) continue
      if (options.scope === 'mine' && target.publisherMemberId !== options.viewerMemberId) continue

      rows.push({
        contentKey: entry.contentKey,
        displayName: entry.displayName,
        desc: entry.desc,
        meta: entry.meta,
        kind: resolveKind(sourceModule, entry.tag),
        sourceModule,
        spaceId: target.spaceId,
        spaceLabel: resolveSpaceLabel(target.spaceId, options.locale),
        publisherMemberId: target.publisherMemberId,
        publisherLabel: localizeMemberName(target.publisherMemberId, options.locale),
        publishedAt: target.publishedAt,
        ownerMemberId: entry.ownerMemberId,
      })
    }
  }

  return rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function listPublicSpaceSharedContent(options: {
  locale: AppLocale
  viewerMemberId: string
  scope: PublicSpaceSharedScope
}): PublicSpaceSharedItem[] {
  const cacheKey = `${options.locale}|${options.viewerMemberId}|${options.scope}`
  if (listCache && listCache.version === listVersion && listCache.cacheKey === cacheKey) {
    return listCache.items
  }

  const items = buildPublicSpaceSharedRows(options)
  listCache = { version: listVersion, cacheKey, items }
  return items
}

export function getPublicSpaceSharedSnapshot(
  locale: AppLocale,
  viewerMemberId: string,
): PublicSpaceSharedSnapshot {
  const cacheKey = `${locale}|${viewerMemberId}`
  if (snapshotCache && snapshotCache.version === listVersion && snapshotCache.cacheKey === cacheKey) {
    return snapshotCache.snapshot
  }

  const snapshot: PublicSpaceSharedSnapshot = {
    all: listPublicSpaceSharedContent({ locale, viewerMemberId, scope: 'all' }),
    mine: listPublicSpaceSharedContent({ locale, viewerMemberId, scope: 'mine' }),
  }
  snapshotCache = { version: listVersion, cacheKey, snapshot }
  return snapshot
}

export function canManagePublicSharedItem(
  item: PublicSpaceSharedItem,
  viewerMemberId: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true
  return item.publisherMemberId === viewerMemberId
}

/** 发布者或管理员可将共享内容从公共空间移出 */
export function canRemovePublicSharedItem(
  item: PublicSpaceSharedItem,
  viewerMemberId: string,
  isAdmin: boolean,
): boolean {
  return canManagePublicSharedItem(item, viewerMemberId, isAdmin)
}

export function listPublicSharedMoveTargets(
  locale: AppLocale,
  fromSpaceId: string,
): Array<{ id: string; name: string }> {
  const publicSpaceIds = getPublicSpaceTargetIds()
  return getCollaborationSpaceOptions(locale)
    .filter((option) => publicSpaceIds.has(option.id) && option.id !== fromSpaceId)
    .map((option) => ({ id: option.id, name: option.label }))
}

export function movePublicSharedItem(
  item: PublicSpaceSharedItem,
  targetSpaceId: string,
  viewerMemberId: string,
  isAdmin: boolean,
  locale: AppLocale,
): { ok: boolean; title?: string; sub?: string } {
  if (!canManagePublicSharedItem(item, viewerMemberId, isAdmin)) {
    return { ok: false }
  }
  if (targetSpaceId === item.spaceId || !getPublicSpaceTargetIds().has(targetSpaceId)) {
    return { ok: false }
  }

  removeUserContentPublishedTarget(item.contentKey, item.spaceId)
  removeResourceFromSpace(item.spaceId, item.contentKey)

  publishContentToSpace(targetSpaceId, {
    id: item.contentKey,
    kind: item.kind,
    sourceModule: item.sourceModule,
    desc: item.desc,
    meta: item.meta,
  })

  markContentPublished(item.contentKey, targetSpaceId)
  addUserContentPublishedTarget(item.contentKey, {
    spaceId: targetSpaceId,
    publishedAt: item.publishedAt,
    publisherMemberId: item.publisherMemberId,
  })

  notifyPublicSpaceShared()

  return {
    ok: true,
    title: locale === 'zh' ? '移动成功' : 'Moved successfully',
    sub: locale === 'zh' ? '资源已归属到目标空间。' : 'The resource is now assigned to the target space.',
  }
}

export function removePublicSharedItem(
  item: PublicSpaceSharedItem,
  viewerMemberId: string,
  isAdmin: boolean,
  locale: AppLocale,
): { ok: boolean; title?: string; sub?: string } {
  if (!canRemovePublicSharedItem(item, viewerMemberId, isAdmin)) {
    return { ok: false }
  }

  removeUserContentPublishedTarget(item.contentKey, item.spaceId)
  removeResourceFromSpace(item.spaceId, item.contentKey)
  notifyPublicSpaceShared()

  return {
    ok: true,
    title: locale === 'zh' ? '已移除' : 'Removed',
    sub: locale === 'zh' ? '内容已从公共空间移除。' : 'The item was removed from the public space.',
  }
}

export function deletePublicSharedItem(
  item: PublicSpaceSharedItem,
  viewerMemberId: string,
  isAdmin: boolean,
  locale: AppLocale,
): { ok: boolean; title?: string; sub?: string } {
  if (!canManagePublicSharedItem(item, viewerMemberId, isAdmin)) {
    return { ok: false }
  }

  removeUserContentPublishedTarget(item.contentKey, item.spaceId)
  removeResourceFromSpace(item.spaceId, item.contentKey)

  const isOwner = item.ownerMemberId === viewerMemberId || item.publisherMemberId === viewerMemberId
  if (isOwner || isAdmin) {
    removeUserContentByKey(item.contentKey)
    removeContentLifecycle(item.contentKey)
    markContentActivated(item.contentKey)
    window.dispatchEvent(
      new CustomEvent<UserContentDeletedDetail>(USER_CONTENT_DELETED_EVENT, {
        detail: { contentKey: item.contentKey },
      }),
    )
  }

  notifyPublicSpaceShared()

  return {
    ok: true,
    title: locale === 'zh' ? '已删除' : 'Deleted',
    sub:
      locale === 'zh'
        ? isAdmin && !isOwner
          ? '已从公共空间删除该共享内容，并移除原创建者的「我的项目」记录。'
          : '共享内容已删除。'
        : isAdmin && !isOwner
          ? 'The shared item was removed from the public space and the owner\'s My projects.'
          : 'The shared item was deleted.',
  }
}

export function subscribePublicSpaceSharedStores(onChange: () => void): () => void {
  const handleChange = () => {
    invalidateListCache()
    onChange()
  }
  const unsubContent = subscribeUserContentSync(handleChange)
  const unsubPublish = subscribePublishSpaceSync(handleChange)
  return () => {
    unsubContent()
    unsubPublish()
  }
}
