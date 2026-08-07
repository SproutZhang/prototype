import {
  PROJECT_SPACE_APPROVE_TASKS_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID,
  PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID,
  PROJECT_SPACE_CREATE_SPACE_GRANT_ID,
  PROJECT_SPACE_INVITE_MEMBER_GRANT_ID,
  PROJECT_SPACE_MANAGE_GROUP_GRANT_ID,
  PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID,
  PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS,
  PROJECT_SPACE_MANAGE_ROLES_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID,
  PROJECT_SPACE_MANAGE_ZONES_GRANT_ID,
  PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_RESTORE_GRANT_ID,
  PROJECT_SPACE_VIEW_CHANGELOG_GRANT_ID,
  PROJECT_SPACE_VIEW_GRANT_ID,
  getProjectSpaceParentGrantId,
  getProjectSpaceSectionGrantIds,
  resolveCatalogGrantsForRole,
} from '../modules/access-control/data/rolePermissionsCatalog'
import { WORKSPACE_ROLE_ROWS } from '../modules/access-control/data/workspaceRoles'
import { readCatalogGrantIdsForRole, readCatalogGrantsSnapshot } from './roleCatalogGrantsStorage'
import { resolveWorkspaceRoleIdForLogin, type LoginRole } from './types'

export {
  PROJECT_SPACE_APPROVE_TASKS_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID,
  PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID,
  PROJECT_SPACE_CREATE_SPACE_GRANT_ID,
  PROJECT_SPACE_INVITE_MEMBER_GRANT_ID,
  PROJECT_SPACE_MANAGE_GROUP_GRANT_ID,
  PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID,
  PROJECT_SPACE_MANAGE_ZONES_GRANT_ID,
  PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_RESTORE_GRANT_ID,
  PROJECT_SPACE_VIEW_CHANGELOG_GRANT_ID,
  PROJECT_SPACE_VIEW_GRANT_ID,
}

function resolveLoginRoleCatalogGrantIds(role: LoginRole): readonly string[] {
  const workspaceRoleId = resolveWorkspaceRoleIdForLogin(role)
  const workspaceRole = WORKSPACE_ROLE_ROWS.find((item) => item.id === workspaceRoleId)
  if (!workspaceRole) return []

  const snapshot = readCatalogGrantsSnapshot()
  const stored = readCatalogGrantIdsForRole(workspaceRoleId)
  return resolveCatalogGrantsForRole(
    workspaceRole,
    stored,
    snapshot?.previousCatalogIds,
  )
}

export function hasCatalogGrantForLoginRole(role: LoginRole, grantId: string): boolean {
  return resolveLoginRoleCatalogGrantIds(role).includes(grantId)
}

/** 项目空间子权限需同时满足对应父权限 */
export function hasProjectSpaceCatalogGrantForLoginRole(role: LoginRole, grantId: string): boolean {
  const parentId = getProjectSpaceParentGrantId(grantId)
  if (parentId && !hasCatalogGrantForLoginRole(role, parentId)) return false
  return hasCatalogGrantForLoginRole(role, grantId)
}

/** 项目空间版块任一项权限 → 显示左侧「项目空间」主导航 */
export function hasAnyProjectSpaceCatalogGrantForLoginRole(role: LoginRole): boolean {
  const grantIds = resolveLoginRoleCatalogGrantIds(role)
  return getProjectSpaceSectionGrantIds().some((id) => grantIds.includes(id))
}

/** 侧栏「审批待办」：任一项子权限勾选即显示 */
export function canShowProjectTasksNavForLoginRole(role: LoginRole): boolean {
  return (
    hasProjectSpaceCatalogGrantForLoginRole(role, PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID) ||
    hasProjectSpaceCatalogGrantForLoginRole(role, PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID) ||
    hasProjectSpaceCatalogGrantForLoginRole(role, PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID)
  )
}

/** 「我的项目」+ 项目分组 */
export function canViewProjectSpaceMineAndGroupsForLoginRole(role: LoginRole): boolean {
  return (PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS as readonly string[]).some((id) =>
    hasProjectSpaceCatalogGrantForLoginRole(role, id),
  )
}

/** 进入项目空间时的默认路由（按权限优先级） */
export function resolveProjectSpaceLandingPath(role: LoginRole): string {
  if (canViewProjectSpaceMineAndGroupsForLoginRole(role)) {
    return '/team/project-space/mine'
  }
  if (canShowProjectTasksNavForLoginRole(role)) {
    return '/team/project-space/tasks'
  }
  if (hasProjectSpaceCatalogGrantForLoginRole(role, PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID)) {
    return '/team/project-space/roles'
  }
  if (hasProjectSpaceCatalogGrantForLoginRole(role, PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID)) {
    return '/team/project-space/changelog'
  }
  return '/team/project-space/mine'
}
