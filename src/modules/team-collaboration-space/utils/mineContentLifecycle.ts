import type { UserContentItem } from '../types/userContent'

/** 未发布，或已发布但有未发布变更 → 可再次发布 */
export function canPublishMineContent(item: UserContentItem): boolean {
  if (item.lifecycleStatus === 'frozen') return false
  if (item.lifecycleStatus === 'draft') return true
  return item.lifecycleStatus === 'published' && Boolean(item.hasUnpublishedChanges)
}

/** 已发布且无待发布变更 → 可冻结 */
export function canFreezeMineContent(item: UserContentItem): boolean {
  return (
    item.lifecycleStatus === 'published' &&
    !item.hasUnpublishedChanges
  )
}

/** 已冻结 → 可激活 */
export function canActivateMineContent(item: UserContentItem): boolean {
  return item.lifecycleStatus === 'frozen'
}
