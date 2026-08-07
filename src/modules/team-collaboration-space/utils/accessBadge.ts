import { resolveAccessBadgeMode } from '../../access-control/utils/accessBadge'
import type { SpaceAccessMode, TeamCollaborationSpaceItem } from '../types'

export function resolveSpaceAccessBadgeMode(
  item: Pick<TeamCollaborationSpaceItem, 'accessMode' | 'copyFromSpaceId' | 'kind'>,
  spaces: TeamCollaborationSpaceItem[],
): SpaceAccessMode {
  if (item.kind === 'shared') {
    if (item.accessMode && item.accessMode !== 'default') {
      return item.accessMode
    }
    return 'shared'
  }
  return resolveAccessBadgeMode(
    { id: 'current', accessMode: item.accessMode, copyFromId: item.copyFromSpaceId },
    spaces.map((space) => ({
      id: space.id,
      accessMode: space.accessMode,
      copyFromId: space.copyFromSpaceId,
    })),
  )
}

export function resolveZoneAccessBadgeMode(
  zone: { id: string; accessMode?: SpaceAccessMode; copyFromZoneId?: string | null },
  zones: Array<{ id: string; accessMode?: SpaceAccessMode; copyFromZoneId?: string | null }>,
): SpaceAccessMode {
  return resolveAccessBadgeMode(
    { id: zone.id, accessMode: zone.accessMode, copyFromId: zone.copyFromZoneId },
    zones.map((entry) => ({
      id: entry.id,
      accessMode: entry.accessMode,
      copyFromId: entry.copyFromZoneId,
    })),
  )
}
