import { detectRolePreset, permissionsForPreset } from '../data/permissions'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import type { WorkspaceMemberEntry } from '../data/workspacesSeed'
import type { MemberAssignment } from '../types'

export function buildMemberAssignmentFromWorkspaceEntry(
  entry: WorkspaceMemberEntry,
  roles: readonly WorkspaceRoleRow[],
): MemberAssignment {
  const role = roles.find((item) => item.id === entry.roleId)
  if (!role) {
    return {
      memberId: entry.memberId,
      rolePreset: 'observer',
      permissions: permissionsForPreset('observer'),
    }
  }

  const detected = detectRolePreset(role.permissions)
  const rolePreset = detected === 'custom' ? 'observer' : detected
  return {
    memberId: entry.memberId,
    rolePreset,
    permissions: [...role.permissions],
  }
}
