import { getDefaultProjectGroupId, PROJECT_GROUPS_SEED, PUBLIC_PROJECT_GROUP_ID } from '../data/projectSpaceSeed'
import { buildInitialMembersForAccessMode, buildMembersForSpaceDraft, applyExcludedMembers, mergeInvitedMemberAssignments, resolveInvitedMemberAssignments } from './memberInit'
import type {
  ProjectGroup,
  ProjectGroupFormDraft,
  SpaceAccessMode,
  TeamCollaborationSpaceItem,
} from '../types'

export function createInitialProjectGroups(): ProjectGroup[] {
  return [...PROJECT_GROUPS_SEED]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({
      ...group,
      descriptionZh: '',
      descriptionEn: '',
      accessMode: (group.isPublicSpace ? 'shared' : 'default') as SpaceAccessMode,
      members: buildInitialMembersForAccessMode(group.isPublicSpace ? 'shared' : 'default', null),
    }))
}

export function isPublicProjectGroup(group: Pick<ProjectGroup, 'id' | 'isPublicSpace'>): boolean {
  return group.isPublicSpace === true || group.id === PUBLIC_PROJECT_GROUP_ID
}

/** 待办审批分组筛选不包含组织级公共空间 */
export function filterGroupsForTaskApproval(groups: ProjectGroup[]): ProjectGroup[] {
  return groups.filter((group) => !isPublicProjectGroup(group))
}

/** 无效或缺失的分组 ID 回退到默认分组，避免空白页 */
export function resolveProjectGroupId(groupId: string | undefined, groups: ProjectGroup[]): string {
  if (!groupId) return getDefaultProjectGroupId()
  return groups.some((group) => group.id === groupId) ? groupId : getDefaultProjectGroupId()
}

export function createProjectGroupFromDraft(
  draft: ProjectGroupFormDraft,
  copySourceOptions: TeamCollaborationSpaceItem[],
  sortOrder: number,
): ProjectGroup {
  const baseGroup: ProjectGroup = {
    id: `pg-${Date.now()}`,
    nameZh: draft.name,
    nameEn: draft.name,
    sortOrder,
    descriptionZh: '',
    descriptionEn: '',
    accessMode: draft.accessMode,
    copyFromSpaceId: draft.accessMode === 'copy' ? draft.copyFromSpaceId ?? null : null,
    permissionsCustomized: false,
    members: [],
  }
  return applyProjectGroupFormDraft(baseGroup, draft, copySourceOptions)
}

export function applyProjectGroupFormDraft(
  group: ProjectGroup,
  draft: ProjectGroupFormDraft,
  copySourceOptions: TeamCollaborationSpaceItem[],
): ProjectGroup {
  const copySource =
    draft.accessMode === 'copy' && draft.copyFromSpaceId
      ? copySourceOptions.find((item) => item.id === draft.copyFromSpaceId) ?? null
      : null

  const accessModeChanged =
    !group.permissionsCustomized &&
    (draft.accessMode !== (group.accessMode ?? 'default') ||
      draft.copyFromSpaceId !== (group.copyFromSpaceId ?? null))

  const invitedAssignments = resolveInvitedMemberAssignments(draft)

  let members = group.members ?? []
  if (accessModeChanged) {
    members = buildMembersForSpaceDraft(draft.accessMode, copySource, draft)
  } else {
    if (invitedAssignments?.length) {
      members = mergeInvitedMemberAssignments(members, invitedAssignments)
    }
    members = applyExcludedMembers(members, draft.excludedMemberIds)
  }

  return {
    ...group,
    nameZh: draft.name,
    nameEn: draft.name,
    accessMode: draft.accessMode,
    copyFromSpaceId: draft.accessMode === 'copy' ? draft.copyFromSpaceId ?? null : null,
    permissionsCustomized:
      group.permissionsCustomized ||
      (invitedAssignments?.length ?? 0) > 0 ||
      (draft.excludedMemberIds?.length ?? 0) > 0 ||
      accessModeChanged,
    members,
  }
}
