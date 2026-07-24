import { isLoginRoleTier, resolveLoginRoleTier, resolveWorkspaceRoleIdForLogin, type LoginRole } from './types'
import {
  hasAnyProjectSpaceCatalogGrantForLoginRole,
  hasProjectSpaceCatalogGrantForLoginRole,
} from './catalogGrantAccess'
import { readCatalogGrantIdsForRole } from './roleCatalogGrantsStorage'
import { WORKSPACE_ROLE_ROWS } from '../modules/access-control/data/workspaceRoles'

/** 应用内页面标识，与 Home activePage 对齐 */
export type AppPage =
  | 'home'
  | 'agent-library'
  | 'scenarios'
  | 'experience'
  | 'app-market'
  | 'knowledge-base'
  | 'tools'
  | 'skills'
  | 'team-collaboration-space'
  | 'analytics'
  | 'access-control'

/**
 * 功能级权限（RBAC 颗粒度）
 *
 * 导航级：nav.*
 * Agent 库：agent.*（高级配置参考 manager 专属能力）
 * 场景配置：scenario.*
 * 分析：analytics.*
 * 团队协作：team.*
 * 知识库：kb.*
 * 工具 / 技能：tools.* / skills.*
 * 应用市场：app_market.*
 * 访问控制：ac.*（manager / admin）
 */
export type AppPermission =
  | 'nav.home'
  | 'nav.agent_library'
  | 'nav.scenarios'
  | 'nav.experience'
  | 'nav.app_market'
  | 'nav.knowledge_base'
  | 'nav.tools'
  | 'nav.skills'
  | 'nav.team'
  | 'nav.analytics'
  | 'nav.access_control'
  | 'agent.view'
  | 'agent.create'
  | 'agent.edit'
  | 'agent.delete'
  | 'agent.publish'
  | 'agent.advanced_config'
  | 'agent.manager_toggle'
  | 'scenario.view'
  | 'scenario.create'
  | 'scenario.edit'
  | 'scenario.delete'
  | 'scenario.publish'
  | 'analytics.view'
  | 'analytics.export'
  | 'analytics.edit_layout'
  | 'team.view'
  | 'team.create_space'
  | 'team.configure_access'
  | 'team.invite_member'
  | 'team.manage_zones'
  | 'team.view_changelog'
  | 'team.changelog_restore'
  | 'kb.view'
  | 'kb.create_folder'
  | 'kb.create'
  | 'kb.upload_documents'
  | 'kb.integrations'
  | 'kb.edit'
  | 'kb.manage_permissions'
  | 'tools.view'
  | 'tools.create'
  | 'tools.edit'
  | 'skills.view'
  | 'skills.create'
  | 'skills.edit'
  | 'app_market.view'
  | 'app_market.install'
  | 'ac.view'
  | 'ac.workspace_manage'
  | 'ac.users_manage'
  | 'ac.roles_manage'
  | 'ac.audit_log_view'

const PAGE_PERMISSION: Record<AppPage, AppPermission> = {
  home: 'nav.home',
  'agent-library': 'nav.agent_library',
  scenarios: 'nav.scenarios',
  experience: 'nav.experience',
  'app-market': 'nav.app_market',
  'knowledge-base': 'nav.knowledge_base',
  tools: 'nav.tools',
  skills: 'nav.skills',
  'team-collaboration-space': 'nav.team',
  analytics: 'nav.analytics',
  'access-control': 'nav.access_control',
}

function hasCatalogNavPermission(role: LoginRole, permission: AppPermission): boolean | null {
  if (!permission.startsWith('nav.')) return null
  /** User 内置账户始终可进入首页与体验 */
  if (isLoginRoleTier(role, 'user') && (permission === 'nav.home' || permission === 'nav.experience')) {
    return true
  }
  /** User 具备项目空间权限（如审批待办）时可进入项目空间 */
  if (isLoginRoleTier(role, 'user') && permission === 'nav.team') {
    return hasAnyProjectSpaceCatalogGrantForLoginRole(role)
  }
  /** Manager / Admin 内置账户始终可进入团队协作（含项目空间） */
  if (permission === 'nav.team' && (isLoginRoleTier(role, 'manager') || role === 'admin')) {
    return true
  }
  const grantIds = readCatalogGrantIdsForRole(resolveWorkspaceRoleIdForLogin(role))
  if (!grantIds) return null
  return grantIds.includes(permission)
}

const TEAM_PERMISSION_TO_PROJECT_SPACE_GRANT: Partial<Record<AppPermission, string>> = {
  'team.create_space': 'project-space.create_space',
  'team.configure_access': 'project-space.configure_access',
  'team.invite_member': 'project-space.invite_member',
  'team.manage_zones': 'project-space.manage_zones',
  'team.view_changelog': 'project-space.changelog_view',
  'team.changelog_restore': 'project-space.changelog_restore',
}

function hasCatalogProjectSpacePermission(role: LoginRole, permission: AppPermission): boolean | null {
  const grantId = TEAM_PERMISSION_TO_PROJECT_SPACE_GRANT[permission]
  if (!grantId) return null
  if (!WORKSPACE_ROLE_ROWS.some((item) => item.id === role)) return null
  return hasProjectSpaceCatalogGrantForLoginRole(role, grantId)
}

/** user / manager 共享的导航与基础查看权限 */
const SHARED_NAV_AND_VIEW: AppPermission[] = [
  'nav.home',
  'nav.agent_library',
  'nav.scenarios',
  'nav.experience',
  'nav.app_market',
  'nav.knowledge_base',
  'nav.tools',
  'nav.skills',
  'nav.team',
  'nav.analytics',
  'agent.view',
  'agent.create',
  'agent.edit',
  'scenario.view',
  'analytics.view',
  'team.view',
  'kb.view',
  'tools.view',
  'skills.view',
  'app_market.view',
  'app_market.install',
]

/** user：首页、体验；历史记录为侧栏固定区块（无独立 nav 权限） */
const USER_NAV_AND_VIEW: AppPermission[] = [
  'nav.home',
  'nav.experience',
]

/** manager 知识库：完整管理能力（创建 / 编辑 / 上传 / 集成 / 权限分配） */
const MANAGER_KB_EXTRA: AppPermission[] = [
  'kb.create_folder',
  'kb.create',
  'kb.upload_documents',
  'kb.integrations',
  'kb.edit',
  'kb.manage_permissions',
]

/** 访问控制：Manager 可进入的子版块（含角色管理、审计日志，与 Admin 对齐） */
const ACCESS_CONTROL_MANAGER_PERMISSIONS: AppPermission[] = [
  'nav.access_control',
  'ac.view',
  'ac.workspace_manage',
  'ac.users_manage',
  'ac.roles_manage',
  'ac.audit_log_view',
]

/** Admin 额外治理权限（与 Manager 访问控制子版块已对齐，保留扩展位） */
const ACCESS_CONTROL_ADMIN_EXTRA: AppPermission[] = [
  'ac.roles_manage',
  'ac.audit_log_view',
]

/** manager 在 user 基础上增加的运营与配置权限 */
const MANAGER_EXTRA: AppPermission[] = [
  'agent.delete',
  'agent.publish',
  'agent.advanced_config',
  'agent.manager_toggle',
  'scenario.create',
  'scenario.edit',
  'scenario.delete',
  'scenario.publish',
  'analytics.export',
  'analytics.edit_layout',
  'team.create_space',
  'team.configure_access',
  'team.invite_member',
  'team.manage_zones',
  'team.view_changelog',
  'team.changelog_restore',
  'tools.create',
  'tools.edit',
  'skills.create',
  'skills.edit',
  ...ACCESS_CONTROL_MANAGER_PERMISSIONS,
]

/** Admin 在 Manager 基础上增加的治理权限 */
const ADMIN_EXTRA: AppPermission[] = [...ACCESS_CONTROL_ADMIN_EXTRA]

const USER_PERMISSIONS = new Set<AppPermission>(USER_NAV_AND_VIEW)

const MANAGER_PERMISSIONS = new Set<AppPermission>([
  ...SHARED_NAV_AND_VIEW,
  ...MANAGER_EXTRA,
  ...MANAGER_KB_EXTRA,
])

const ADMIN_PERMISSIONS = new Set<AppPermission>([
  ...SHARED_NAV_AND_VIEW,
  ...MANAGER_EXTRA,
  ...MANAGER_KB_EXTRA,
  ...ADMIN_EXTRA,
])

const ROLE_PERMISSION_SET: Record<LoginRole, Set<AppPermission>> = {
  user: USER_PERMISSIONS,
  'user-1': USER_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  'manager-1': MANAGER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
}

export function hasAppPermission(role: LoginRole, permission: AppPermission): boolean {
  const catalogNav = hasCatalogNavPermission(role, permission)
  if (catalogNav !== null) return catalogNav
  const catalogProjectSpace = hasCatalogProjectSpacePermission(role, permission)
  if (catalogProjectSpace !== null) return catalogProjectSpace
  return ROLE_PERMISSION_SET[role].has(permission)
}

export function canAccessAppPage(role: LoginRole, page: AppPage): boolean {
  return hasAppPermission(role, PAGE_PERMISSION[page])
}

export function getRolePermissions(role: LoginRole): ReadonlySet<AppPermission> {
  return ROLE_PERMISSION_SET[role]
}

export function resolveAuthorizedPage(role: LoginRole, page: AppPage): AppPage {
  return canAccessAppPage(role, page) ? page : 'home'
}
