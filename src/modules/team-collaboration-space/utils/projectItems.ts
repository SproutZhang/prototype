import { PROJECT_SPACE_ITEMS_SEED } from '../data/projectSpaceSeed'
import type { ProjectSpaceItem, SpaceFormDraft } from '../types'

/** 演示用：按项目 id 生成稳定哈希 */
function stableItemHash(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (Math.imul(31, hash) + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** 演示用：稳定选出一个项目作为「已失效」演示项 */
export function getDemoExpiredProjectItemId(
  items: readonly Pick<ProjectSpaceItem, 'id'>[] = PROJECT_SPACE_ITEMS_SEED.filter((item) => !item.isCreateCard),
): string | null {
  if (items.length === 0) return null
  return items.reduce((pick, item) =>
    stableItemHash(item.id) < stableItemHash(pick.id) ? item : pick,
  ).id
}

/** 演示用：已失效项目对应的协作空间 id */
export function getDemoExpiredProjectSpaceId(
  items: readonly Pick<ProjectSpaceItem, 'id' | 'spaceId'>[] = PROJECT_SPACE_ITEMS_SEED.filter(
    (item) => !item.isCreateCard,
  ),
): string | null {
  const expiredItemId = getDemoExpiredProjectItemId(items)
  if (!expiredItemId) return null
  return items.find((item) => item.id === expiredItemId)?.spaceId ?? null
}

/** 演示用：仅为一个项目稳定分配「已失效」标签 */
export function withDemoExpiredFlags(items: ProjectSpaceItem[]): ProjectSpaceItem[] {
  if (items.length === 0) return items
  const expiredId = getDemoExpiredProjectItemId(items)!
  return items.map((item) => ({
    ...item,
    isExpired: item.id === expiredId,
  }))
}

const COVER_GRADIENTS: Pick<ProjectSpaceItem, 'coverFrom' | 'coverVia' | 'coverTo'>[] = [
  { coverFrom: '#5b8def', coverVia: '#6b7cff', coverTo: '#8b5cf6' },
  { coverFrom: '#34c3ff', coverVia: '#2d9bf0', coverTo: '#6366f1' },
  { coverFrom: '#ffd36a', coverVia: '#ffb347', coverTo: '#ff8f70' },
  { coverFrom: '#62d6a5', coverVia: '#33c0b8', coverTo: '#3f8cff' },
  { coverFrom: '#6366f1', coverVia: '#818cf8', coverTo: '#a78bfa' },
  { coverFrom: '#f59e0b', coverVia: '#fbbf24', coverTo: '#fb923c' },
  { coverFrom: '#ec4899', coverVia: '#f472b6', coverTo: '#fb7185' },
  { coverFrom: '#14b8a6', coverVia: '#2dd4bf', coverTo: '#5eead4' },
]

export function createProjectSpaceItemFromDraft(
  draft: SpaceFormDraft,
  groupId: string,
  spaceId: string,
  itemIndex: number,
): ProjectSpaceItem {
  const cover = COVER_GRADIENTS[itemIndex % COVER_GRADIENTS.length]!
  return {
    id: `ps-${Date.now()}`,
    groupId,
    nameZh: draft.name,
    nameEn: draft.name,
    spaceId,
    deadlineStart: draft.deadlineStart ?? null,
    deadlineEnd: draft.deadlineEnd ?? null,
    ...cover,
  }
}
