import { PUBLIC_PROJECT_GROUP_ID, PROJECT_SPACE_ITEMS_SEED } from '../data/projectSpaceSeed'
import { SHARED_SPACE_ID } from '../data/sharedSpace'
import { getPublishCreatedProjectItems } from './publishSpaceSync'

/** 公共空间可发布目标：组织共享空间 + 公共空间分组下的协作空间 */
export function getPublicSpaceTargetIds(): Set<string> {
  const ids = new Set<string>([SHARED_SPACE_ID])
  for (const item of PROJECT_SPACE_ITEMS_SEED) {
    if (item.groupId === PUBLIC_PROJECT_GROUP_ID && item.spaceId) {
      ids.add(item.spaceId)
    }
  }
  for (const item of getPublishCreatedProjectItems()) {
    if (item.groupId === PUBLIC_PROJECT_GROUP_ID && item.spaceId) {
      ids.add(item.spaceId)
    }
  }
  return ids
}

export function isPublicSpaceTargetId(spaceId: string): boolean {
  return getPublicSpaceTargetIds().has(spaceId)
}
