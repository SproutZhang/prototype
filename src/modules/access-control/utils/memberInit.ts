import { ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import {
  assignmentFromPreset,
  clampToParentPermissions,
  detectRolePreset,
  permissionsForPreset,
  SHARED_SPACE_PERMISSIONS,
} from '../data/permissions'
import type { AccessMode, MemberAssignment } from '../types'

export type MemberCopySource = {
  members: MemberAssignment[]
}

export function buildSharedSpaceMembers(): MemberAssignment[] {
  return ORG_MEMBERS_SEED.map((member) => ({
    memberId: member.id,
    rolePreset: 'observer' as const,
    permissions: [...SHARED_SPACE_PERMISSIONS],
  }))
}

export function buildInitialMembersForAccessMode(
  accessMode: AccessMode,
  copySource: MemberCopySource | null,
): MemberAssignment[] {
  switch (accessMode) {
    case 'open':
      return ORG_MEMBERS_SEED.map((member) => assignmentFromPreset(member.id, 'observer'))
    case 'private':
      return [assignmentFromPreset('member-self', 'space_admin')]
    case 'shared':
      return buildSharedSpaceMembers()
    case 'copy':
      if (copySource?.members.length) {
        return copySource.members.map((m) => ({
          memberId: m.memberId,
          rolePreset: m.rolePreset,
          permissions: [...m.permissions],
        }))
      }
      return buildDefaultMembers()
    case 'default':
    default:
      return buildDefaultMembers()
  }
}

function buildDefaultMembers(): MemberAssignment[] {
  return [
    assignmentFromPreset('member-self', 'space_admin'),
    assignmentFromPreset('member-hr-zhang', 'collaborator'),
    assignmentFromPreset('member-mgr-wang', 'collaborator'),
    assignmentFromPreset('member-it-li', 'collaborator'),
    assignmentFromPreset('member-intern-lin', 'observer'),
  ]
}

function clampChildMember(
  parentMembers: MemberAssignment[],
  assignment: MemberAssignment,
  fallbackPreset: Exclude<import('../types').RolePreset, 'custom'> = 'collaborator',
): MemberAssignment | null {
  const parentMember = parentMembers.find((m) => m.memberId === assignment.memberId)
  if (!parentMember) return null
  const perms = clampToParentPermissions(
    parentMember.permissions,
    assignment.permissions.length ? assignment.permissions : permissionsForPreset(fallbackPreset),
  )
  return { memberId: assignment.memberId, rolePreset: detectRolePreset(perms), permissions: perms }
}

function buildDefaultChildMembers(parentMembers: MemberAssignment[]): MemberAssignment[] {
  const self = parentMembers.find((m) => m.memberId === 'member-self')
  if (self) {
    const clamped = clampChildMember(parentMembers, assignmentFromPreset('member-self', 'space_admin'))
    return clamped ? [clamped] : []
  }
  const first = parentMembers[0]
  if (!first) return []
  const clamped = clampChildMember(parentMembers, assignmentFromPreset(first.memberId, 'space_admin'))
  return clamped ? [clamped] : []
}

/** 子级创建时的初始成员（受父级成员池约束） */
export function buildInitialChildMembersForAccessMode(
  accessMode: AccessMode,
  parentMembers: MemberAssignment[],
  copySource: MemberCopySource | null,
): MemberAssignment[] {
  switch (accessMode) {
    case 'open':
      return parentMembers.flatMap((parentMember) => {
        const perms = clampToParentPermissions(parentMember.permissions, permissionsForPreset('observer'))
        return [{ memberId: parentMember.memberId, rolePreset: detectRolePreset(perms), permissions: perms }]
      })
    case 'private': {
      const clamped = clampChildMember(parentMembers, assignmentFromPreset('member-self', 'space_admin'))
      return clamped ? [clamped] : []
    }
    case 'shared':
      return parentMembers.flatMap((parentMember) => {
        const perms = clampToParentPermissions(parentMember.permissions, permissionsForPreset('observer'))
        return [{ memberId: parentMember.memberId, rolePreset: detectRolePreset(perms), permissions: perms }]
      })
    case 'copy':
      if (copySource?.members.length) {
        return copySource.members
          .map((member) => clampChildMember(parentMembers, member))
          .filter((m): m is MemberAssignment => m != null)
      }
      return buildDefaultChildMembers(parentMembers)
    case 'default':
    default:
      return buildDefaultChildMembers(parentMembers)
  }
}

export function rolePresetPermissionsSummary(
  preset: Exclude<import('../types').RolePreset, 'custom'>,
): number {
  return permissionsForPreset(preset).length
}

export function buildInitialZoneMembersForAccessMode(
  accessMode: AccessMode,
  parentScope: { members: MemberAssignment[] },
  copySource: MemberCopySource | null,
): MemberAssignment[] {
  return buildInitialChildMembersForAccessMode(accessMode, parentScope.members, copySource)
}
