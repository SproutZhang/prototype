import { useRbac } from '../../../auth/useRbac'
import { isLoginRoleTier } from '../../../auth/types'
import {
  PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID,
  PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID,
  PROJECT_SPACE_CREATE_SPACE_GRANT_ID,
  PROJECT_SPACE_INVITE_MEMBER_GRANT_ID,
  PROJECT_SPACE_MANAGE_GROUP_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID,
  PROJECT_SPACE_MANAGE_ZONES_GRANT_ID,
  PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_RESTORE_GRANT_ID,
  PROJECT_SPACE_VIEW_CHANGELOG_GRANT_ID,
  PROJECT_SPACE_VIEW_GRANT_ID,
  hasAnyProjectSpaceCatalogGrantForLoginRole,
  hasProjectSpaceCatalogGrantForLoginRole,
} from '../../../auth/catalogGrantAccess'
import { PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS } from '../../../modules/access-control/data/rolePermissionsCatalog'

/** 团队协作空间能力门控 */
export function useTeamCollaborationCapabilities() {
  const { role, hasCatalogGrant, grantsRevision } = useRbac()
  const isUser = isLoginRoleTier(role, 'user')
  const isManager = isLoginRoleTier(role, 'manager')
  const isAdmin = role === 'admin'

  const hasProjectSpaceGrant = (grantId: string) => {
    void grantsRevision
    return hasProjectSpaceCatalogGrantForLoginRole(role, grantId)
  }

  /** 创建协作空间 · 项目分组下新建项目/子空间 */
  const canProjectSpaceCreateSpace = hasProjectSpaceGrant(PROJECT_SPACE_CREATE_SPACE_GRANT_ID)

  const canCreateSpace = canProjectSpaceCreateSpace
  const canConfigureAccess =
    isAdmin || hasProjectSpaceGrant(PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID)
  const canManageZones = isAdmin || hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_ZONES_GRANT_ID)
  const canInviteMember = hasProjectSpaceGrant(PROJECT_SPACE_INVITE_MEMBER_GRANT_ID)

  /**
   * 左侧主导航 · 项目空间入口：版块内任一项权限勾选即显示。
   * 与「项目管理」（我的项目 + 项目分组）相互独立。
   */
  const canShowProjectSpaceNav = hasAnyProjectSpaceCatalogGrantForLoginRole(role)

  /**
   * 「项目管理」：模块内「我的项目」导航与下方项目分组区域。
   * 由项目管理父项下的任一子权限驱动（含「查看」只读）。
   */
  const canViewProjectSpaceMineAndGroups = (
    PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS as readonly string[]
  ).some((id) => hasProjectSpaceGrant(id))

  /** 我的项目 + 分组 · 只读查看 */
  const canViewProjectSpaceMineAndGroupsReadOnly = hasProjectSpaceGrant(PROJECT_SPACE_VIEW_GRANT_ID)

  /**
   * 编辑/删除/移动已有项目、分组管理等变更操作（不含「创建协作空间」入口）。
   */
  const canProjectSpaceEditProjects =
    hasProjectSpaceGrant(PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID) ||
    hasProjectSpaceGrant(PROJECT_SPACE_INVITE_MEMBER_GRANT_ID) ||
    hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_ZONES_GRANT_ID) ||
    hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_GROUP_GRANT_ID) ||
    hasProjectSpaceGrant(PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID)

  /** 待办审批 · 查看列表 */
  const canViewProjectTasks = hasProjectSpaceGrant(PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID)

  /** 待办审批 · 审批进度（含通过/驳回操作） */
  const canViewApprovalTaskProgress = hasProjectSpaceGrant(PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID)

  /** 待办审批 · 审批详情 */
  const canViewApprovalTaskDetail = hasProjectSpaceGrant(PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID)

  /** 侧栏「待办审批」入口：任一项子权限勾选即显示 */
  const canShowProjectTasksNav =
    canViewProjectTasks || canViewApprovalTaskProgress || canViewApprovalTaskDetail

  const canApproveProjectTask = canViewApprovalTaskProgress
  /** Admin 可查看并编辑全部流程节点 */
  const canManageAllWorkflowInstances = isAdmin

  /** 角色管理 · 查看 */
  const canProjectSpaceViewRoles = hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID)

  /** 角色管理 · 编辑 */
  const canProjectSpaceEditRoles = hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID)

  /** 迭代记录 · 查看 */
  const canProjectSpaceViewChangelog = hasProjectSpaceGrant(PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID)

  /** 迭代记录 · 恢复/回滚 */
  const canProjectSpaceRestoreChangelog = hasProjectSpaceGrant(PROJECT_SPACE_CHANGELOG_RESTORE_GRANT_ID)

  /** @deprecated 使用 canProjectSpaceViewRoles */
  const canManageCustomRoles = canProjectSpaceViewRoles

  /**
   * @deprecated 使用 canViewProjectSpaceMineAndGroups
   * 曾用于模块入口；现左侧导航见 canShowProjectSpaceNav，内容区见 canViewProjectSpaceMineAndGroups
   */
  const canViewProjectSpace = canViewProjectSpaceMineAndGroups

  /**
   * @deprecated 使用 canProjectSpaceCreateSpace / canProjectSpaceEditProjects
   */
  const canManageProjects = canProjectSpaceCreateSpace || canProjectSpaceEditProjects

  /**
   * 一级协作空间（团队区卡片）：需「配置访问权限」+「创建协作空间」。
   */
  const canManageTeamSpaces = canConfigureAccess && canCreateSpace

  /** 子级空间：「创建协作空间」可新建 */
  const canCreateSubSpaces = canProjectSpaceCreateSpace && !isUser

  /** 子级空间：「管理子空间」可编辑/删除 */
  const canManageSubSpaces = hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_ZONES_GRANT_ID) || (isAdmin && canManageZones)

  /** 组织级团队协作空间（团队区一级协作空间） */
  const showOrganizationSpaces = canConfigureAccess

  /** 共享空间：仅 Admin 可编辑、删除、新建 */
  const canManageSharedSpace = isAdmin
  const canCreateSharedSpace = canManageSharedSpace && canCreateSpace

  const canProjectSpaceConfigureAccess = hasProjectSpaceGrant(PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID)
  const canProjectSpaceInviteMember = hasProjectSpaceGrant(PROJECT_SPACE_INVITE_MEMBER_GRANT_ID)
  const canProjectSpaceManageZones = hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_ZONES_GRANT_ID)
  const canProjectSpaceManageGroup = hasProjectSpaceGrant(PROJECT_SPACE_MANAGE_GROUP_GRANT_ID)
  const canProjectSpacePublishContent = hasProjectSpaceGrant(PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID)

  return {
    canCreateSpace,
    canConfigureAccess,
    canManageZones,
    canManageTeamSpaces,
    canManageSubSpaces,
    canCreateSubSpaces,
    canInviteMember,
    showOrganizationSpaces,
    canManageSharedSpace,
    canCreateSharedSpace,
    canShowProjectSpaceNav,
    canViewProjectSpace,
    canViewProjectSpaceMineAndGroups,
    canViewProjectSpaceMineAndGroupsReadOnly,
    canViewProjectTasks,
    canViewApprovalTaskProgress,
    canViewApprovalTaskDetail,
    canShowProjectTasksNav,
    canApproveProjectTask,
    canManageAllWorkflowInstances,
    canManageCustomRoles,
    canProjectSpaceViewRoles,
    canProjectSpaceEditRoles,
    canProjectSpaceViewChangelog,
    canProjectSpaceRestoreChangelog,
    canManageProjects,
    canProjectSpaceCreateSpace,
    canProjectSpaceEditProjects,
    canProjectSpaceConfigureAccess,
    canProjectSpaceInviteMember,
    canProjectSpaceManageZones,
    canProjectSpaceManageGroup,
    canProjectSpacePublishContent,
    isUser,
    isManager,
    isAdmin,
  }
}
