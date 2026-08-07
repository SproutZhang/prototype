import { hasPermission } from '../../access-control/data/permissions'
import type { TcsMemberAssignment } from '../types'

export function resolveMemberSpaceAssignment(
  members: readonly TcsMemberAssignment[],
  memberId: string,
): TcsMemberAssignment | undefined {
  return members.find((member) => member.memberId === memberId)
}

export function resolveEffectiveMemberAssignment(
  spaceMembers: readonly TcsMemberAssignment[],
  zoneMembers: readonly TcsMemberAssignment[] | undefined,
  memberId: string,
): TcsMemberAssignment | undefined {
  const zoneMember = zoneMembers?.find((member) => member.memberId === memberId)
  if (zoneMember) return zoneMember
  return resolveMemberSpaceAssignment(spaceMembers, memberId)
}

/** 成员是否可查看空间/子空间内容（无权访问预设无任何权限） */
export function canMemberViewSpaceContent(assignment: TcsMemberAssignment | undefined): boolean {
  if (!assignment) return true
  if (assignment.rolePreset === 'no_access') return false
  return hasPermission(assignment.permissions, 'access.view')
}
