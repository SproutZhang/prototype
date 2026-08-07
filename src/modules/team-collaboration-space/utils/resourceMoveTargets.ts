import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeSpaceName } from '../i18n/strings'
import { PROJECT_SPACE_ITEMS_SEED } from '../data/projectSpaceSeed'
import type { TeamCollaborationSpaceItem } from '../types'

const seedGroupBySpaceId = new Map(
  PROJECT_SPACE_ITEMS_SEED.filter((item) => item.spaceId).map((item) => [item.spaceId!, item.groupId]),
)

const runtimeGroupBySpaceId: Record<string, string> = {}

export function registerSpaceProjectGroup(spaceId: string, groupId: string) {
  runtimeGroupBySpaceId[spaceId] = groupId
}

function resolveProjectGroupId(spaceId: string): string | undefined {
  return runtimeGroupBySpaceId[spaceId] ?? seedGroupBySpaceId.get(spaceId)
}

function resolveSiblingSpaceIdsInGroup(groupId: string, fromSpaceId: string): Set<string> {
  const siblingSpaceIds = new Set<string>()

  for (const item of PROJECT_SPACE_ITEMS_SEED) {
    if (item.spaceId && item.groupId === groupId && item.spaceId !== fromSpaceId) {
      siblingSpaceIds.add(item.spaceId)
    }
  }

  for (const [spaceId, registeredGroupId] of Object.entries(runtimeGroupBySpaceId)) {
    if (registeredGroupId === groupId && spaceId !== fromSpaceId) {
      siblingSpaceIds.add(spaceId)
    }
  }

  return siblingSpaceIds
}

/** 资源移动目标：同级项目空间内的其他项目，或组织级共享空间之间的互移 */
export function resolveResourceMoveTargetSpaces(
  fromSpaceId: string,
  spaces: TeamCollaborationSpaceItem[],
  locale: AppLocale,
): Array<{ id: string; name: string }> {
  const fromSpace = spaces.find((space) => space.id === fromSpaceId)
  if (!fromSpace) return []

  if (fromSpace.kind === 'shared') {
    return spaces
      .filter((space) => space.id !== fromSpaceId && space.kind === 'shared')
      .map((space) => ({ id: space.id, name: localizeSpaceName(space, locale) }))
  }

  const groupId = resolveProjectGroupId(fromSpaceId)
  if (!groupId) return []

  const siblingSpaceIds = resolveSiblingSpaceIdsInGroup(groupId, fromSpaceId)
  return spaces
    .filter((space) => siblingSpaceIds.has(space.id))
    .map((space) => ({ id: space.id, name: localizeSpaceName(space, locale) }))
}
