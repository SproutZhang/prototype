import type { SpaceFormDraft, TeamCollaborationSpaceItem } from '../../team-collaboration-space/types'
import { mergeInvitedMembers } from '../../team-collaboration-space/utils/memberInit'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import {
  formatWorkspaceCreatedAt,
  type WorkspaceMemberEntry,
  type WorkspaceRow,
} from '../data/workspacesSeed'
import { buildMemberAssignmentFromWorkspaceEntry } from './workspaceMembers'
import { buildInitialMembersForAccessMode } from './memberInit'
import type { MemberAssignment, RolePreset } from '../types'

const DEFAULT_WORKSPACE_ADMIN_MEMBER_ID = 'member-self'

function createLockedAdminEntry(memberId: string): WorkspaceMemberEntry {
  return {
    memberId,
    roleId: 'admin',
    isLocked: true,
  }
}

function rolePresetToWorkspaceRoleId(preset: RolePreset): string {
  if (preset === 'space_admin') return 'admin'
  return 'user'
}

function memberAssignmentToWorkspaceEntry(assignment: MemberAssignment): WorkspaceMemberEntry {
  return {
    memberId: assignment.memberId,
    roleId: rolePresetToWorkspaceRoleId(assignment.rolePreset),
  }
}

function buildWorkspaceMembersFromDraft(
  draft: SpaceFormDraft,
  copySourceOptions: TeamCollaborationSpaceItem[],
): WorkspaceMemberEntry[] {
  const copySource =
    draft.accessMode === 'copy' && draft.copyFromSpaceId
      ? copySourceOptions.find((item) => item.id === draft.copyFromSpaceId) ?? null
      : null

  let assignments = buildInitialMembersForAccessMode(
    draft.accessMode,
    copySource ? { members: copySource.members } : null,
  )
  assignments = mergeInvitedMembers(
    assignments,
    draft.invitedMemberIds,
    draft.invitedMemberPreset ?? 'collaborator',
  )

  const adminMemberId = DEFAULT_WORKSPACE_ADMIN_MEMBER_ID
  const others = assignments
    .filter((assignment) => assignment.memberId !== adminMemberId)
    .map(memberAssignmentToWorkspaceEntry)

  const seen = new Set<string>()
  const uniqueOthers = others.filter((entry) => {
    if (seen.has(entry.memberId)) return false
    seen.add(entry.memberId)
    return true
  })

  return [createLockedAdminEntry(adminMemberId), ...uniqueOthers]
}

export function workspaceRowsToCopySources(
  rows: WorkspaceRow[],
  roles: readonly WorkspaceRoleRow[],
): TeamCollaborationSpaceItem[] {
  return rows.map((row) => ({
    id: row.id,
    kind: 'team' as const,
    nameZh: row.nameZh,
    nameEn: row.nameEn,
    descriptionZh: row.descriptionZh,
    descriptionEn: row.descriptionEn,
    updatedAtLabelZh: formatWorkspaceCreatedAt(row.createdAt, 'zh'),
    updatedAtLabelEn: formatWorkspaceCreatedAt(row.createdAt, 'en'),
    accent: '#6366f1',
    accessMode: row.accessMode,
    copyFromSpaceId: null,
    members: row.members.map((entry) => buildMemberAssignmentFromWorkspaceEntry(entry, roles)),
    zones: [],
    resourceCount: 0,
  }))
}

export function createWorkspaceRowFromFormDraft(
  draft: SpaceFormDraft,
  copySourceOptions: TeamCollaborationSpaceItem[],
): WorkspaceRow {
  const members = buildWorkspaceMembersFromDraft(draft, copySourceOptions)
  return {
    id: `workspace-custom-${Date.now()}`,
    nameZh: draft.name,
    nameEn: draft.name,
    descriptionZh: draft.description,
    descriptionEn: draft.description,
    accessMode: draft.accessMode,
    members,
    memberCount: members.length,
    createdAt: new Date().toISOString(),
    isBuiltin: false,
  }
}
