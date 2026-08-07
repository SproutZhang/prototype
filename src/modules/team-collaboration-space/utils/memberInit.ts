import { permissionsForPreset } from '../data/permissions'
import {
  buildInitialMembersForAccessMode,
  buildInitialZoneMembersForAccessMode,
  buildSharedSpaceMembers,
} from '../../access-control/utils/memberInit'
import { resolveProjectSpacePresetPermissions } from './projectSpaceCustomRolesSync'
import type {
  CollaborationZone,
  InvitedMemberAssignment,
  SpaceAccessMode,
  TeamCollaborationSpaceItem,
  TcsMemberAssignment,
  TcsRolePreset,
} from '../types'

type MemberCopySource = {
  members: TcsMemberAssignment[]
}

function presetPermissions(preset: Exclude<TcsRolePreset, 'custom'>) {
  if (preset === 'no_access') return permissionsForPreset('no_access')
  return resolveProjectSpacePresetPermissions(preset)
}

/** 将创建时手动引入的成员合并进访问权限自动生成的成员列表（去重，已有成员保留原权限） */
export function mergeInvitedMembers(
  baseMembers: TcsMemberAssignment[],
  invitedMemberIds: string[] | undefined,
  preset: Exclude<TcsRolePreset, 'custom'> = 'collaborator',
): TcsMemberAssignment[] {
  if (!invitedMemberIds?.length) return baseMembers
  const existing = new Set(baseMembers.map((member) => member.memberId))
  const permissions = presetPermissions(preset)
  const additions = invitedMemberIds
    .filter((id) => !existing.has(id))
    .map((memberId) => ({ memberId, rolePreset: preset, permissions: [...permissions] }))
  if (additions.length === 0) return baseMembers
  return [...baseMembers, ...additions]
}

export function resolveInvitedMemberAssignments(draft: {
  invitedMemberAssignments?: InvitedMemberAssignment[]
  invitedMemberIds?: string[]
  invitedMemberPreset?: Exclude<TcsRolePreset, 'custom'>
}): InvitedMemberAssignment[] | undefined {
  if (draft.invitedMemberAssignments?.length) return draft.invitedMemberAssignments
  if (!draft.invitedMemberIds?.length) return undefined
  const preset = draft.invitedMemberPreset ?? 'collaborator'
  return draft.invitedMemberIds.map((memberId) => ({ memberId, preset }))
}

/** 按角色分批合并手动引入的成员 */
export function mergeInvitedMemberAssignments(
  baseMembers: TcsMemberAssignment[],
  invited: InvitedMemberAssignment[] | undefined,
): TcsMemberAssignment[] {
  if (!invited?.length) return baseMembers
  let result = baseMembers
  for (const preset of [...new Set(invited.map((item) => item.preset))]) {
    const memberIds = invited.filter((item) => item.preset === preset).map((item) => item.memberId)
    result = mergeInvitedMembers(result, memberIds, preset)
  }
  return result
}

export function applyExcludedMembers(
  members: TcsMemberAssignment[],
  excludedMemberIds?: string[],
): TcsMemberAssignment[] {
  if (!excludedMemberIds?.length) return members
  const excluded = new Set(excludedMemberIds)
  return members.filter((member) => !excluded.has(member.memberId))
}

export function buildPreviewMemberAssignments(
  baseMembers: TcsMemberAssignment[],
  invited: InvitedMemberAssignment[] | undefined,
  excludedMemberIds?: string[],
): TcsMemberAssignment[] {
  return applyExcludedMembers(mergeInvitedMemberAssignments(baseMembers, invited), excludedMemberIds)
}

/** 根据访问权限与手动引入成员生成空间成员列表（默认模式无引入时为 0） */
export function buildMembersForSpaceDraft(
  accessMode: SpaceAccessMode | undefined,
  copySource: MemberCopySource | null,
  draft: {
    invitedMemberAssignments?: InvitedMemberAssignment[]
    invitedMemberIds?: string[]
    invitedMemberPreset?: Exclude<TcsRolePreset, 'custom'>
    excludedMemberIds?: string[]
  },
): TcsMemberAssignment[] {
  const mode = accessMode ?? 'default'
  let baseMembers: TcsMemberAssignment[]

  if (mode === 'default') {
    baseMembers = []
  } else if (mode === 'copy' && !copySource?.members.length) {
    baseMembers = []
  } else {
    baseMembers = buildInitialMembersForAccessMode(mode, copySource)
  }

  return buildPreviewMemberAssignments(
    baseMembers,
    resolveInvitedMemberAssignments(draft),
    draft.excludedMemberIds,
  )
}

export {
  buildInitialMembersForAccessMode,
  buildInitialZoneMembersForAccessMode,
  buildSharedSpaceMembers,
}

/** 将完整角色预设映射为创建表单展示的三类：管理员 / 协助者 / 使用者 */
export function mapRolePresetToInviteCategory(
  rolePreset: TcsRolePreset,
): 'observer' | 'collaborator' | 'space_admin' {
  switch (rolePreset) {
    case 'space_admin':
      return 'space_admin'
    case 'collaborator':
      return 'collaborator'
    case 'no_access':
      return 'observer'
    default:
      return 'observer'
  }
}

export function memberCountForSpace(space: TeamCollaborationSpaceItem): number {
  return space.members.length
}

export function memberCountForZone(zone: { members: TcsMemberAssignment[] }): number {
  return zone.members.length
}

export function rolePresetPermissionsSummary(preset: Exclude<TcsRolePreset, 'custom'>): number {
  return presetPermissions(preset).length
}

export type { CollaborationZone, TeamCollaborationSpaceItem }
