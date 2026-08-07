import { detectRolePreset } from '../data/permissions'
import type { MemberAssignment, OrgMember } from '../types'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { resolveRoleLabel, type RoleDisplayOverride } from './roleDisplay'

export type MemberRoleGroupEntry = {
  memberId: string
  assignment: MemberAssignment
}

export type MemberRoleGroup = {
  role: WorkspaceRoleRow
  entries: MemberRoleGroupEntry[]
}

export function resolveMemberAssignmentInRole(
  memberId: string,
  role: WorkspaceRoleRow,
  assignmentsById: Map<string, MemberAssignment>,
): MemberAssignment {
  const existing = assignmentsById.get(memberId)
  if (existing) return existing
  return {
    memberId,
    rolePreset: detectRolePreset(role.permissions),
    permissions: [...role.permissions],
  }
}

export function buildMemberRoleGroups(
  roles: readonly WorkspaceRoleRow[],
  members: MemberAssignment[],
): MemberRoleGroup[] {
  const assignmentsById = new Map(members.map((member) => [member.memberId, member]))
  return roles
    .map((role) => ({
      role,
      entries: role.assignedMemberIds.map((memberId) => ({
        memberId,
        assignment: resolveMemberAssignmentInRole(memberId, role, assignmentsById),
      })),
    }))
    .filter((group) => group.entries.length > 0)
}

export function filterMemberRoleGroups(
  groups: MemberRoleGroup[],
  query: string,
  memberMap: Map<string, OrgMember>,
  localizeMember: (member: OrgMember) => string,
  roleOverridesById?: Record<string, RoleDisplayOverride>,
): MemberRoleGroup[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return groups

  return groups
    .map((group) => {
      const roleLabel = resolveRoleLabel(group.role, roleOverridesById?.[group.role.id]).toLowerCase()
      const entries = group.entries.filter(({ memberId }) => {
        const org = memberMap.get(memberId)
        const memberName = org ? localizeMember(org).toLowerCase() : ''
        const haystack = `${memberName} ${roleLabel}`
        return haystack.includes(normalized)
      })
      return { ...group, entries }
    })
    .filter((group) => group.entries.length > 0)
}
