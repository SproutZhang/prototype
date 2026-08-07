import type { TeamCollaborationSpaceItem } from '../types'

/** 团队协作空间（kind=team）仅保留一级：子级空间资源并入空间，zones 清空 */
export function flattenTeamCollaborationSpaces(
  spaces: TeamCollaborationSpaceItem[],
): TeamCollaborationSpaceItem[] {
  return spaces.map((space) => {
    if (space.kind !== 'team') return space
    if (space.zones.length === 0) return { ...space, zones: [] }
    const zoneResourceTotal = space.zones.reduce((sum, zone) => sum + zone.resourceCount, 0)
    return {
      ...space,
      zones: [],
      resourceCount: space.resourceCount + zoneResourceTotal,
    }
  })
}
