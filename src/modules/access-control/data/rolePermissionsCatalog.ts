import type { AppLocale } from '../../../i18n/homeStrings'
import { APP_SIDEBAR_NAV_SECTIONS } from '../../../config/appNavConfig'
import { acT } from '../i18n/strings'
import {
  ACCESS_CONTROL_NAV_SECTIONS,
  ENABLE_DEPARTMENTS_NAV_SECTION,
  ENABLE_USERS_NAV_SECTION,
} from '../nav/navConfig'
import type { RoleCatalogProfile, WorkspaceRoleRow } from './workspaceRoles'
import { isFullPermissionSet } from './workspaceRoles'

export type RolePermissionCatalogItem = {
  id: string
  labelZh: string
  labelEn: string
}

export type RolePermissionCatalogSection = {
  id: string
  titleZh: string
  titleEn: string
  items: RolePermissionCatalogItem[]
}

function section(
  id: string,
  titleZh: string,
  titleEn: string,
  items: Array<[string, string, string]>,
): RolePermissionCatalogSection {
  return {
    id,
    titleZh,
    titleEn,
    items: items.map(([itemId, labelZh, labelEn]) => ({
      id: `${id}.${itemId}`,
      labelZh,
      labelEn,
    })),
  }
}

function isAccessControlNavSectionInRolePermissions(
  section: (typeof ACCESS_CONTROL_NAV_SECTIONS)[number]['section'],
): boolean {
  if (section === 'departments' && !ENABLE_DEPARTMENTS_NAV_SECTION) return false
  if (section === 'users' && !ENABLE_USERS_NAV_SECTION) return false
  return true
}

/** 与主侧栏导航（appNavConfig）一一对应，用于配置各角色可见导航 */
function appSidebarNavCatalogSection(): RolePermissionCatalogSection {
  return {
    id: 'nav',
    titleZh: '导航',
    titleEn: 'Navigation',
    items: APP_SIDEBAR_NAV_SECTIONS.map((config) => ({
      id: `nav.${config.slug}`,
      labelZh: config.labelZh,
      labelEn: config.labelEn,
    })),
  }
}

/** 与访问控制侧栏导航（navConfig）一一对应 */
function accessControlNavCatalogSection(): RolePermissionCatalogSection {
  return {
    id: 'ac-nav',
    titleZh: acT('zh', 'pageTitle'),
    titleEn: acT('en', 'pageTitle'),
    items: ACCESS_CONTROL_NAV_SECTIONS.filter((config) =>
      isAccessControlNavSectionInRolePermissions(config.section),
    ).map((config) => ({
      id: `ac-nav.${config.section}`,
      labelZh: acT('zh', config.labelKey),
      labelEn: acT('en', config.labelKey),
    })),
  }
}

const AGENT_MODULE_PERMISSION_ITEMS: Array<[string, string, string]> = [
  ['view', '看法', 'View'],
  ['create', '创造', 'Create'],
  ['copy', '复制', 'Copy'],
  ['export', '出口', 'Export'],
  ['edit_config', '编辑配置', 'Edit configuration'],
  ['show_menu', '显示菜单', 'Show menu'],
  ['update', '更新', 'Update'],
  ['delete', '删除', 'Delete'],
  ['import', '进口', 'Import'],
  ['allowed_domains', '允许的域名', 'Allowed domains'],
]

const PROJECT_SPACE_PERMISSION_ITEMS: Array<[string, string, string]> = [
  ['approve_tasks', '审批待办', 'Approve tasks'],
  ['approve_tasks_view', '查看', 'View'],
  ['approve_tasks_progress', '审批进度', 'Approval progress'],
  ['approve_tasks_detail', '审批详情', 'Approval details'],
  ['manage_roles', '角色管理', 'Manage roles'],
  ['manage_roles_view', '查看', 'View'],
  ['manage_roles_edit', '编辑', 'Edit'],
  ['manage_projects', '项目管理', 'Manage projects'],
  ['view', '查看', 'View'],
  ['create_space', '创建协作空间', 'Create space'],
  ['configure_access', '配置访问权限', 'Configure access'],
  ['invite_member', '邀请成员', 'Invite members'],
  ['manage_zones', '管理子空间', 'Manage sub-spaces'],
  ['manage_group', '管理项目分组', 'Manage project groups'],
  ['publish_content', '发布内容', 'Publish content'],
  ['changelog', '迭代记录', 'Version history'],
  ['changelog_view', '查看', 'View'],
  ['changelog_restore', '恢复', 'Restore'],
]

export const PROJECT_SPACE_SECTION_ID = 'project-space'

export const PROJECT_SPACE_VIEW_GRANT_ID = 'project-space.view'

export const PROJECT_SPACE_CREATE_SPACE_GRANT_ID = 'project-space.create_space'

export const PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID = 'project-space.configure_access'

export const PROJECT_SPACE_INVITE_MEMBER_GRANT_ID = 'project-space.invite_member'

export const PROJECT_SPACE_MANAGE_ZONES_GRANT_ID = 'project-space.manage_zones'

export const PROJECT_SPACE_MANAGE_GROUP_GRANT_ID = 'project-space.manage_group'

export const PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID = 'project-space.manage_projects'

export const PROJECT_SPACE_MANAGE_ROLES_GRANT_ID = 'project-space.manage_roles'

export const PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID = 'project-space.manage_roles_view'

export const PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID = 'project-space.manage_roles_edit'

const LEGACY_MANAGE_ROLES_CREATE_GRANT_ID = 'project-space.manage_roles_create'

const LEGACY_MANAGE_ROLES_DELETE_GRANT_ID = 'project-space.manage_roles_delete'

export const PROJECT_SPACE_APPROVE_TASKS_GRANT_ID = 'project-space.approve_tasks'

export const PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID = 'project-space.approve_tasks_view'

export const PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID = 'project-space.approve_tasks_progress'

export const PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID = 'project-space.approve_tasks_detail'

export const PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID = 'project-space.publish_content'

export const PROJECT_SPACE_CHANGELOG_GRANT_ID = 'project-space.changelog'

export const PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID = 'project-space.changelog_view'

export const PROJECT_SPACE_CHANGELOG_RESTORE_GRANT_ID = 'project-space.changelog_restore'

/** @deprecated 已迁移为 project-space.changelog_view */
const LEGACY_VIEW_CHANGELOG_GRANT_ID = 'project-space.view_changelog'

/** @deprecated 使用 PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID */
export const PROJECT_SPACE_VIEW_CHANGELOG_GRANT_ID = PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID

/** 「项目管理」的子权限；仅当父项勾选后才可配置 */
export const PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS = [
  PROJECT_SPACE_VIEW_GRANT_ID,
  PROJECT_SPACE_CREATE_SPACE_GRANT_ID,
  PROJECT_SPACE_CONFIGURE_ACCESS_GRANT_ID,
  PROJECT_SPACE_INVITE_MEMBER_GRANT_ID,
  PROJECT_SPACE_MANAGE_ZONES_GRANT_ID,
  PROJECT_SPACE_MANAGE_GROUP_GRANT_ID,
  PROJECT_SPACE_PUBLISH_CONTENT_GRANT_ID,
] as const

export function isProjectSpaceManageProjectsChildGrant(itemId: string): boolean {
  return (PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS as readonly string[]).includes(itemId)
}

/** 「审批待办」的子权限；仅当父项勾选后才可配置 */
export const PROJECT_SPACE_APPROVE_TASKS_CHILD_GRANT_IDS = [
  PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_PROGRESS_GRANT_ID,
  PROJECT_SPACE_APPROVE_TASKS_DETAIL_GRANT_ID,
] as const

export function isProjectSpaceApproveTasksChildGrant(itemId: string): boolean {
  return (PROJECT_SPACE_APPROVE_TASKS_CHILD_GRANT_IDS as readonly string[]).includes(itemId)
}

/** 「角色管理」的子权限；仅当父项勾选后才可配置 */
export const PROJECT_SPACE_MANAGE_ROLES_CHILD_GRANT_IDS = [
  PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID,
] as const

export function isProjectSpaceManageRolesChildGrant(itemId: string): boolean {
  return (PROJECT_SPACE_MANAGE_ROLES_CHILD_GRANT_IDS as readonly string[]).includes(itemId)
}

/** 「迭代记录」的子权限；仅当父项勾选后才可配置 */
export const PROJECT_SPACE_CHANGELOG_CHILD_GRANT_IDS = [
  PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID,
  PROJECT_SPACE_CHANGELOG_RESTORE_GRANT_ID,
] as const

export function isProjectSpaceChangelogChildGrant(itemId: string): boolean {
  return (PROJECT_SPACE_CHANGELOG_CHILD_GRANT_IDS as readonly string[]).includes(itemId)
}

/** 项目空间父权限 → 子权限 */
export const PROJECT_SPACE_PARENT_CHILD_GRANTS: Record<string, readonly string[]> = {
  [PROJECT_SPACE_APPROVE_TASKS_GRANT_ID]: PROJECT_SPACE_APPROVE_TASKS_CHILD_GRANT_IDS,
  [PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID]: PROJECT_SPACE_MANAGE_PROJECTS_CHILD_GRANT_IDS,
  [PROJECT_SPACE_MANAGE_ROLES_GRANT_ID]: PROJECT_SPACE_MANAGE_ROLES_CHILD_GRANT_IDS,
  [PROJECT_SPACE_CHANGELOG_GRANT_ID]: PROJECT_SPACE_CHANGELOG_CHILD_GRANT_IDS,
}

export function getProjectSpaceParentGrantId(itemId: string): string | null {
  for (const [parentId, childIds] of Object.entries(PROJECT_SPACE_PARENT_CHILD_GRANTS)) {
    if ((childIds as readonly string[]).includes(itemId)) return parentId
  }
  return null
}

export function isProjectSpaceNestedChildGrant(itemId: string): boolean {
  return getProjectSpaceParentGrantId(itemId) != null
}

export function isProjectSpaceParentGrant(itemId: string): boolean {
  return itemId in PROJECT_SPACE_PARENT_CHILD_GRANTS
}

/** 各父权限对应的「查看」子项；取消查看时同步取消父项 */
const PROJECT_SPACE_PARENT_PRIMARY_VIEW_GRANT: Record<string, string> = {
  [PROJECT_SPACE_APPROVE_TASKS_GRANT_ID]: PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID,
  [PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID]: PROJECT_SPACE_VIEW_GRANT_ID,
  [PROJECT_SPACE_MANAGE_ROLES_GRANT_ID]: PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID,
  [PROJECT_SPACE_CHANGELOG_GRANT_ID]: PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID,
}

function removeProjectSpaceParentGrant(next: Set<string>, parentId: string): void {
  next.delete(parentId)
  for (const childId of PROJECT_SPACE_PARENT_CHILD_GRANTS[parentId] ?? []) {
    next.delete(childId)
  }
}

function syncProjectSpaceParentAfterChildRevoked(next: Set<string>, itemId: string): void {
  const parentId = getProjectSpaceParentGrantId(itemId)
  if (!parentId) return

  const childIds = PROJECT_SPACE_PARENT_CHILD_GRANTS[parentId] ?? []
  const primaryViewId = PROJECT_SPACE_PARENT_PRIMARY_VIEW_GRANT[parentId]
  const revokedPrimaryView = primaryViewId != null && itemId === primaryViewId
  const hasAnyChild = childIds.some((id) => next.has(id))

  if (revokedPrimaryView || !hasAnyChild) {
    removeProjectSpaceParentGrant(next, parentId)
  }
}

function syncProjectSpaceParentsWithoutPrimaryView(next: Set<string>): void {
  for (const [parentId, viewId] of Object.entries(PROJECT_SPACE_PARENT_PRIMARY_VIEW_GRANT)) {
    if (next.has(parentId) && !next.has(viewId)) {
      removeProjectSpaceParentGrant(next, parentId)
    }
  }
}

export function getProjectSpaceSectionGrantIds(): readonly string[] {
  const sectionDef = ROLE_PERMISSION_CATALOG.find((section) => section.id === PROJECT_SPACE_SECTION_ID)
  return sectionDef?.items.map((item) => item.id) ?? []
}

export function hasAnyProjectSpaceSectionGrant(grantedIds: ReadonlySet<string>): boolean {
  return getProjectSpaceSectionGrantIds().some((id) => grantedIds.has(id))
}

/** 权限抽屉展示目录（对齐 CMS 权限面板结构） */
export const ROLE_PERMISSION_CATALOG: RolePermissionCatalogSection[] = [
  appSidebarNavCatalogSection(),
  section('chat-flow', '聊天流程', 'Chat flow', AGENT_MODULE_PERMISSION_ITEMS),
  section('agent-library', 'Agent库', 'Agents', AGENT_MODULE_PERMISSION_ITEMS),
  section('scenarios', '场景配置', 'Scenarios', AGENT_MODULE_PERMISSION_ITEMS),
  section('experience', '体验', 'Experience', AGENT_MODULE_PERMISSION_ITEMS),
  section('project-space', '项目空间', 'Project Space', PROJECT_SPACE_PERMISSION_ITEMS),
  section('app-market', '应用市场', 'App Marketplace', AGENT_MODULE_PERMISSION_ITEMS),
  section('knowledge-base', '知识库', 'Knowledge Base', AGENT_MODULE_PERMISSION_ITEMS),
  section('file-library', '文件库', 'File library', [
    ['view', '看法', 'View'],
    ['create', '创造', 'Create'],
    ['delete_doc_storage', '删除文档存储', 'Delete document storage'],
    ['delete_doc_loader', '删除文档加载器', 'Delete document loader'],
    ['update_config', '更新配置', 'Update configuration'],
    ['show_menu', '显示菜单', 'Show menu'],
    ['update', '更新', 'Update'],
    ['add_doc_loader', '添加文档加载器', 'Add document loader'],
    ['preview_process_blocks', '预览和处理文档块', 'Preview and process document blocks'],
  ]),
  section('tools-directory', '工具', 'Tools', AGENT_MODULE_PERMISSION_ITEMS),
  section('skills-library', '技能库', 'Skills', AGENT_MODULE_PERMISSION_ITEMS),
  accessControlNavCatalogSection(),
  section('basic', '基础设置', 'Basic settings', [
    ['role', '角色', 'Roles'],
    ['permission', '工作区', 'Workspace'],
    ['org', '部门管理', 'Department management'],
    ['user', '用户', 'Users'],
    ['menu', '菜单', 'Menus'],
  ]),
  section('search', '搜索', 'Search', [
    ['keyword', '关键词', 'Keywords'],
    ['record', '搜索记录', 'Search records'],
    ['suggest', '联想词', 'Suggestions'],
    ['hot', '热搜', 'Hot search'],
  ]),
  section('app', '应用', 'Applications', [
    ['app', '应用', 'Applications'],
    ['center', '应用中心', 'App center'],
    ['category', '应用分类', 'App categories'],
    ['plugin', '插件', 'Plugins'],
    ['store', '应用商店', 'App store'],
  ]),
  section('history-records', '历史记录', 'History records', [
    ['all', '全部内容', 'All content'],
    ['chat', '历史对话记录', 'Chat history'],
    ['scenario', '场景历史记录', 'Scenario history'],
    ['agent', 'Agent历史记录', 'Agent history'],
  ]),
  section('analytics', '统计分析', 'Analytics', [
    ['traffic', '流量', 'Traffic'],
    ['visitor', '访客', 'Visitors'],
    ['source', '来源', 'Sources'],
    ['visited', '受访', 'Visited pages'],
    ['search', '搜索', 'Search'],
  ]),
  section('workflow-mgmt', '工作流管理', 'Workflow management', [
    ['process', '流程', 'Processes'],
    ['task', '任务管理', 'Task management'],
    ['node', '节点', 'Nodes'],
    ['history', '历史', 'History'],
    ['proxy', '代理', 'Delegation'],
    ['design', '模型设计', 'Model design'],
    ['deploy', '部署', 'Deployment'],
    ['instance', '流程实例', 'Instances'],
    ['running', '运行中任务', 'Running tasks'],
    ['done', '已办任务', 'Completed tasks'],
  ]),
  section('log', '日志', 'Logs', [
    ['login', '登录', 'Login'],
    ['operation', '操作日志', 'Operation log'],
    ['exception', '异常', 'Exceptions'],
  ]),
  section('knowledge', '知识库', 'Knowledge base', [
    ['catalog', '目录', 'Catalog'],
    ['manage', '知识库管理', 'Management'],
    ['qa', '问答', 'Q&A'],
    ['tag', '标签', 'Tags'],
  ]),
  section('other', '其它', 'Others', [
    ['cache', '缓存管理', 'Cache'],
    ['api-doc', '接口文档', 'API docs'],
  ]),
]

const ALL_CATALOG_ITEM_IDS = new Set(
  ROLE_PERMISSION_CATALOG.flatMap((s) => s.items.map((item) => item.id)),
)

/** 基础设置 · 菜单管理；选中后才可配置「导航」版块 */
export const BASIC_MENU_MANAGEMENT_GRANT_ID = 'basic.menu'

export const BASIC_ROLE_MANAGEMENT_GRANT_ID = 'basic.role'

export const BASIC_WORKSPACE_MANAGEMENT_GRANT_ID = 'basic.permission'

export const BASIC_ORG_MANAGEMENT_GRANT_ID = 'basic.org'

export const BASIC_USER_MANAGEMENT_GRANT_ID = 'basic.user'

export const NAV_SECTION_ID = 'nav'

/** 导航 · 访问控制入口；选中后才可配置「访问控制」子版块 */
export const NAV_ACCESS_CONTROL_GRANT_ID = 'nav.access_control'

export const ACCESS_CONTROL_SUBNAV_SECTION_ID = 'ac-nav'

export const BASIC_SECTION_ID = 'basic'

/** 基础设置各项 → 依赖的可配置权限（与访问控制侧栏 / 导航一一对应） */
const BASIC_SETTING_DEPENDENT_GRANTS: Record<string, readonly string[]> = {
  [BASIC_MENU_MANAGEMENT_GRANT_ID]: [], // 导航项在 sanitize 中单独处理
  [BASIC_ROLE_MANAGEMENT_GRANT_ID]: ['ac-nav.roles'],
  [BASIC_WORKSPACE_MANAGEMENT_GRANT_ID]: ['ac-nav.workspace'],
  [BASIC_ORG_MANAGEMENT_GRANT_ID]: ['ac-nav.departments'],
  [BASIC_USER_MANAGEMENT_GRANT_ID]: ['ac-nav.users'],
}

/** 权限项 → 所需的基础设置开关 */
const CATALOG_GRANT_BASIC_GATE: Record<string, string> = {
  'ac-nav.roles': BASIC_ROLE_MANAGEMENT_GRANT_ID,
  'ac-nav.workspace': BASIC_WORKSPACE_MANAGEMENT_GRANT_ID,
  'ac-nav.departments': BASIC_ORG_MANAGEMENT_GRANT_ID,
  'ac-nav.users': BASIC_USER_MANAGEMENT_GRANT_ID,
}

export type RolePermissionGateHintKey =
  | 'rolePermissionsNavMenuRequired'
  | 'rolePermissionsAccessControlNavRequired'
  | 'rolePermissionsBasicRoleRequired'
  | 'rolePermissionsBasicWorkspaceRequired'
  | 'rolePermissionsBasicOrgRequired'
  | 'rolePermissionsBasicUserRequired'
  | 'rolePermissionsProjectSpaceManageProjectsRequired'
  | 'rolePermissionsProjectSpaceManageRolesRequired'
  | 'rolePermissionsProjectSpaceChangelogRequired'
  | 'rolePermissionsProjectSpaceApproveTasksRequired'

const BASIC_GRANT_HINT_KEYS: Record<string, RolePermissionGateHintKey> = {
  [BASIC_MENU_MANAGEMENT_GRANT_ID]: 'rolePermissionsNavMenuRequired',
  [BASIC_ROLE_MANAGEMENT_GRANT_ID]: 'rolePermissionsBasicRoleRequired',
  [BASIC_WORKSPACE_MANAGEMENT_GRANT_ID]: 'rolePermissionsBasicWorkspaceRequired',
  [BASIC_ORG_MANAGEMENT_GRANT_ID]: 'rolePermissionsBasicOrgRequired',
  [BASIC_USER_MANAGEMENT_GRANT_ID]: 'rolePermissionsBasicUserRequired',
}

export function getNavSectionGrantIds(): string[] {
  const sectionDef = ROLE_PERMISSION_CATALOG.find((section) => section.id === NAV_SECTION_ID)
  return sectionDef?.items.map((item) => item.id) ?? []
}

export function getAccessControlSubnavGrantIds(): string[] {
  const sectionDef = ROLE_PERMISSION_CATALOG.find(
    (section) => section.id === ACCESS_CONTROL_SUBNAV_SECTION_ID,
  )
  return sectionDef?.items.map((item) => item.id) ?? []
}

export function isNavSectionConfigurationEnabled(grantedIds: ReadonlySet<string>): boolean {
  return grantedIds.has(BASIC_MENU_MANAGEMENT_GRANT_ID)
}

export function isAccessControlSubnavSectionEnabled(grantedIds: ReadonlySet<string>): boolean {
  return grantedIds.has(NAV_ACCESS_CONTROL_GRANT_ID)
}

function getBasicGateGrantId(itemId: string): string | null {
  if (itemId.startsWith('nav.')) return BASIC_MENU_MANAGEMENT_GRANT_ID
  return CATALOG_GRANT_BASIC_GATE[itemId] ?? null
}

export function isCatalogGrantItemConfigurable(
  grantedIds: ReadonlySet<string>,
  itemId: string,
): boolean {
  const basicGate = getBasicGateGrantId(itemId)
  if (basicGate && !grantedIds.has(basicGate)) return false
  if (itemId.startsWith('ac-nav.') && !isAccessControlSubnavSectionEnabled(grantedIds)) return false
  const projectSpaceParent = getProjectSpaceParentGrantId(itemId)
  if (projectSpaceParent && !grantedIds.has(projectSpaceParent)) return false
  return true
}

export function getCatalogGrantItemConfigurationHintKey(
  itemId: string,
): RolePermissionGateHintKey | null {
  const basicGate = getBasicGateGrantId(itemId)
  if (basicGate) return BASIC_GRANT_HINT_KEYS[basicGate] ?? null
  if (itemId.startsWith('ac-nav.')) return 'rolePermissionsAccessControlNavRequired'
  const projectSpaceParent = getProjectSpaceParentGrantId(itemId)
  if (projectSpaceParent === PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID) {
    return 'rolePermissionsProjectSpaceManageProjectsRequired'
  }
  if (projectSpaceParent === PROJECT_SPACE_MANAGE_ROLES_GRANT_ID) {
    return 'rolePermissionsProjectSpaceManageRolesRequired'
  }
  if (projectSpaceParent === PROJECT_SPACE_CHANGELOG_GRANT_ID) {
    return 'rolePermissionsProjectSpaceChangelogRequired'
  }
  if (projectSpaceParent === PROJECT_SPACE_APPROVE_TASKS_GRANT_ID) {
    return 'rolePermissionsProjectSpaceApproveTasksRequired'
  }
  return null
}

function filterConfigurableGrantIds(
  grantedIds: ReadonlySet<string>,
  itemIds: readonly string[],
): string[] {
  return itemIds.filter((itemId) => isCatalogGrantItemConfigurable(grantedIds, itemId))
}

function removeDependentsForRevokedBasicGrant(
  grantedIds: Set<string>,
  basicGrantId: string,
): void {
  if (basicGrantId === BASIC_MENU_MANAGEMENT_GRANT_ID) {
    for (const id of getNavSectionGrantIds()) grantedIds.delete(id)
    for (const id of getAccessControlSubnavGrantIds()) grantedIds.delete(id)
    return
  }
  for (const dependentId of BASIC_SETTING_DEPENDENT_GRANTS[basicGrantId] ?? []) {
    grantedIds.delete(dependentId)
  }
}

export function sanitizeRolePermissionGrantIds(ids: Iterable<string>): Set<string> {
  const next = new Set(ids)
  if (next.has(LEGACY_VIEW_CHANGELOG_GRANT_ID)) {
    next.add(PROJECT_SPACE_CHANGELOG_GRANT_ID)
    next.add(PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID)
    next.delete(LEGACY_VIEW_CHANGELOG_GRANT_ID)
  }
  if (
    next.has(LEGACY_MANAGE_ROLES_CREATE_GRANT_ID) ||
    next.has(LEGACY_MANAGE_ROLES_DELETE_GRANT_ID)
  ) {
    next.add(PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID)
    next.add(PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID)
    next.delete(LEGACY_MANAGE_ROLES_CREATE_GRANT_ID)
    next.delete(LEGACY_MANAGE_ROLES_DELETE_GRANT_ID)
  }
  if (
    next.has(PROJECT_SPACE_APPROVE_TASKS_GRANT_ID) &&
    !PROJECT_SPACE_APPROVE_TASKS_CHILD_GRANT_IDS.some((id) => next.has(id))
  ) {
    for (const id of PROJECT_SPACE_APPROVE_TASKS_CHILD_GRANT_IDS) {
      next.add(id)
    }
  }
  if (!next.has(BASIC_MENU_MANAGEMENT_GRANT_ID)) {
    for (const id of getNavSectionGrantIds()) next.delete(id)
  }
  if (!next.has(NAV_ACCESS_CONTROL_GRANT_ID)) {
    for (const id of getAccessControlSubnavGrantIds()) next.delete(id)
  }
  for (const [basicGrantId, dependentIds] of Object.entries(BASIC_SETTING_DEPENDENT_GRANTS)) {
    if (basicGrantId === BASIC_MENU_MANAGEMENT_GRANT_ID) continue
    if (!next.has(basicGrantId)) {
      for (const dependentId of dependentIds) next.delete(dependentId)
    }
  }
  for (const [parentId, childIds] of Object.entries(PROJECT_SPACE_PARENT_CHILD_GRANTS)) {
    if (!next.has(parentId)) {
      for (const id of childIds) next.delete(id)
    }
  }
  syncProjectSpaceParentsWithoutPrimaryView(next)
  return next
}

export function applySectionGrantToggle(
  grantedIds: ReadonlySet<string>,
  itemIds: readonly string[],
): Set<string> {
  const next = new Set(grantedIds)
  const allSelected = itemIds.length > 0 && itemIds.every((id) => next.has(id))
  for (const id of itemIds) {
    if (allSelected) next.delete(id)
    else next.add(id)
  }
  return next
}

export function applyPermissionSectionGrantToggle(
  grantedIds: ReadonlySet<string>,
  sectionId: string,
  itemIds: readonly string[],
): Set<string> {
  const configurableIds = filterConfigurableGrantIds(grantedIds, itemIds)
  if (configurableIds.length === 0) return new Set(grantedIds)
  if (sectionId === NAV_SECTION_ID && !isNavSectionConfigurationEnabled(grantedIds)) {
    return new Set(grantedIds)
  }
  if (
    sectionId === ACCESS_CONTROL_SUBNAV_SECTION_ID &&
    !isAccessControlSubnavSectionEnabled(grantedIds)
  ) {
    return new Set(grantedIds)
  }
  return applySectionGrantToggle(grantedIds, configurableIds)
}

export function applyPermissionGrantToggle(
  grantedIds: ReadonlySet<string>,
  itemId: string,
): Set<string> {
  const next = new Set(grantedIds)
  if (next.has(itemId)) {
    next.delete(itemId)
    if (itemId === NAV_ACCESS_CONTROL_GRANT_ID) {
      for (const id of getAccessControlSubnavGrantIds()) next.delete(id)
    } else if (itemId in PROJECT_SPACE_PARENT_CHILD_GRANTS) {
      for (const id of PROJECT_SPACE_PARENT_CHILD_GRANTS[itemId]) next.delete(id)
    } else if (itemId in BASIC_SETTING_DEPENDENT_GRANTS || itemId === BASIC_MENU_MANAGEMENT_GRANT_ID) {
      removeDependentsForRevokedBasicGrant(next, itemId)
    } else {
      syncProjectSpaceParentAfterChildRevoked(next, itemId)
    }
  } else {
    next.add(itemId)
    if (itemId === PROJECT_SPACE_MANAGE_PROJECTS_GRANT_ID) {
      next.add(PROJECT_SPACE_VIEW_GRANT_ID)
    } else if (itemId === PROJECT_SPACE_CHANGELOG_GRANT_ID) {
      next.add(PROJECT_SPACE_CHANGELOG_VIEW_GRANT_ID)
    } else if (itemId === PROJECT_SPACE_APPROVE_TASKS_GRANT_ID) {
      next.add(PROJECT_SPACE_APPROVE_TASKS_VIEW_GRANT_ID)
    }
  }
  return next
}

function catalogIdsMatching(...prefixes: string[]): Set<string> {
  return new Set([...ALL_CATALOG_ITEM_IDS].filter((id) => prefixes.some((prefix) => id.startsWith(prefix))))
}

/** User：仅基础查看类权限（知识库不含管理/权限分配） */
const USER_GRANTED_IDS = new Set<string>([
  'nav.home',
  'nav.experience',
  'chat-flow.view',
  'agent-library.view',
  'scenarios.view',
  'experience.view',
  'app-market.view',
  'knowledge-base.view',
  'file-library.view',
  'tools-directory.view',
  'skills-library.view',
  'search.keyword',
  'search.record',
  'analytics.traffic',
  'analytics.visitor',
  'log.login',
  'knowledge.catalog',
  'history-records.chat',
  PROJECT_SPACE_APPROVE_TASKS_GRANT_ID,
])

/** Manager：除系统/安全/基础权限外的绝大部分；不含项目空间 · 角色管理 */
const MANAGER_DENIED_IDS = new Set<string>([
  'ac-nav.users',
  'basic.permission',
  'basic.role',
  'other.cache',
  'other.api-doc',
  PROJECT_SPACE_MANAGE_ROLES_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_VIEW_GRANT_ID,
  PROJECT_SPACE_MANAGE_ROLES_EDIT_GRANT_ID,
])

const CATALOG_PROFILE_GRANTS: Record<RoleCatalogProfile, Set<string>> = {
  admin: ALL_CATALOG_ITEM_IDS,
  manager: new Set([...ALL_CATALOG_ITEM_IDS].filter((id) => !MANAGER_DENIED_IDS.has(id))),
  user: USER_GRANTED_IDS,
  auditor: catalogIdsMatching(
    'basic.menu',
    'log.',
    'analytics.',
    'nav.home',
    'nav.analytics',
    'nav.access_control',
    'ac-nav.workspace',
    'ac-nav.audit-log',
  ),
  guest: new Set(['knowledge.catalog']),
  ops: catalogIdsMatching('basic.menu', 'nav.', 'ac-nav.', 'analytics.', 'search.'),
  analyst: catalogIdsMatching(
    'basic.menu',
    'analytics.',
    'bi.',
    'nav.home',
    'nav.analytics',
    'nav.access_control',
    'ac-nav.workspace',
    'ac-nav.audit-log',
  ),
  support: catalogIdsMatching('basic.menu', 'nav.', 'ac-nav.'),
  knowledge: catalogIdsMatching('basic.menu', 'nav.', 'ac-nav.', 'knowledge.'),
  security: catalogIdsMatching(
    'basic.menu',
    'basic.role',
    'basic.permission',
    'basic.user',
    'log.',
    'nav.access_control',
  ),
  readonly: new Set([
    'basic.menu',
    'nav.home',
    'nav.access_control',
    'ac-nav.workspace',
    'knowledge.catalog',
  ]),
  'publish-reviewer': catalogIdsMatching(
    'basic.menu',
    'nav.',
    'ac-nav.',
    'workflow-mgmt.task',
    'workflow-mgmt.done',
    'log.operation',
  ),
  bi: catalogIdsMatching('basic.menu', 'nav.', 'ac-nav.', 'bi.', 'analytics.'),
  hr: catalogIdsMatching(
    'basic.menu',
    'nav.',
    'ac-nav.',
    'basic.org',
    'basic.user',
    'basic.role',
    'workflow-mgmt.task',
  ),
  meeting: catalogIdsMatching('basic.menu', 'nav.', 'ac-nav.'),
}

export function catalogItemLabel(
  locale: AppLocale,
  item: RolePermissionCatalogItem,
): string {
  return locale === 'zh' ? item.labelZh : item.labelEn
}

export function catalogSectionTitle(
  locale: AppLocale,
  sectionDef: RolePermissionCatalogSection,
): string {
  return locale === 'zh' ? sectionDef.titleZh : sectionDef.titleEn
}

export function isRolePermissionCatalogItemGranted(
  role: WorkspaceRoleRow,
  itemId: string,
): boolean {
  if (isFullPermissionSet(role.permissions)) return true
  return CATALOG_PROFILE_GRANTS[role.catalogProfile]?.has(itemId) ?? false
}

export function getAllCatalogGrantIds(): readonly string[] {
  return [...ALL_CATALOG_ITEM_IDS]
}

export function shouldRoleHaveFullCatalogGrants(role: WorkspaceRoleRow): boolean {
  return role.catalogProfile === 'admin' || isFullPermissionSet(role.permissions)
}

export function shouldRoleUseManagerBuiltinCatalogDefaults(role: WorkspaceRoleRow): boolean {
  return role.catalogProfile === 'manager' && (role.id === 'manager' || role.id === 'manager-1')
}

/** 合并持久化权限与角色默认权限；新 catalog 项按角色默认自动补全 */
export function resolveCatalogGrantsForRole(
  role: WorkspaceRoleRow,
  storedGrants?: string[] | null,
  previousCatalogIds?: ReadonlySet<string>,
): string[] {
  const defaults = buildInitialCatalogGrantsForRole(role)

  /** Admin 等全权限角色：无持久化配置时使用完整 catalog；保存后以持久化为准 */
  if (shouldRoleHaveFullCatalogGrants(role)) {
    if (storedGrants != null) {
      return [...sanitizeRolePermissionGrantIds(storedGrants)].filter((id) =>
        ALL_CATALOG_ITEM_IDS.has(id),
      )
    }
    return [...sanitizeRolePermissionGrantIds([...ALL_CATALOG_ITEM_IDS])]
  }

  /** 内置 Manager：无持久化配置时使用默认全集；保存后以持久化为准，并补全新 catalog 项 */
  if (shouldRoleUseManagerBuiltinCatalogDefaults(role)) {
    if (storedGrants == null) {
      return defaults
    }
    const defaultSet = new Set(defaults)
    const merged = new Set(sanitizeRolePermissionGrantIds(storedGrants))
    const knownCatalogIds = previousCatalogIds ?? ALL_CATALOG_ITEM_IDS
    for (const id of ALL_CATALOG_ITEM_IDS) {
      if (!knownCatalogIds.has(id) && defaultSet.has(id)) {
        merged.add(id)
      }
    }
    return [...merged].filter((id) => ALL_CATALOG_ITEM_IDS.has(id))
  }

  const defaultSet = new Set(defaults)

  if (storedGrants == null) {
    return defaults
  }

  const merged = new Set(sanitizeRolePermissionGrantIds(storedGrants))
  const knownCatalogIds = previousCatalogIds ?? ALL_CATALOG_ITEM_IDS

  for (const id of ALL_CATALOG_ITEM_IDS) {
    if (!knownCatalogIds.has(id) && defaultSet.has(id)) {
      merged.add(id)
    }
  }

  return [...merged].filter((id) => ALL_CATALOG_ITEM_IDS.has(id))
}

export function buildCatalogGrantsByRoleId(
  roles: readonly WorkspaceRoleRow[],
  stored?: Record<string, string[]> | null,
  previousCatalogIds?: ReadonlySet<string>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const role of roles) {
    result[role.id] = resolveCatalogGrantsForRole(role, stored?.[role.id], previousCatalogIds)
  }
  if (stored) {
    for (const [roleId, grants] of Object.entries(stored)) {
      if (result[roleId]) continue
      result[roleId] = [...sanitizeRolePermissionGrantIds(grants)].filter((id) =>
        ALL_CATALOG_ITEM_IDS.has(id),
      )
    }
  }
  return result
}

export function buildInitialCatalogGrantsForRole(role: WorkspaceRoleRow): string[] {
  const grants = ROLE_PERMISSION_CATALOG.flatMap((sectionDef) =>
    sectionDef.items
      .filter((item) => isRolePermissionCatalogItemGranted(role, item.id))
      .map((item) => item.id),
  )
  return [...sanitizeRolePermissionGrantIds(grants)]
}

/** 新建角色权限表单默认勾选（基础设置 · 菜单；导航 · 首页、体验） */
export const DEFAULT_NEW_ROLE_CATALOG_GRANT_IDS = [
  BASIC_MENU_MANAGEMENT_GRANT_ID,
  'nav.home',
  'nav.experience',
] as const

export function buildDefaultNewRoleCatalogGrants(): Set<string> {
  return sanitizeRolePermissionGrantIds(DEFAULT_NEW_ROLE_CATALOG_GRANT_IDS)
}

export function isFullCatalogGrantSet(grantedIds: readonly string[]): boolean {
  return grantedIds.length >= ALL_CATALOG_ITEM_IDS.size
}

export function catalogGrantsDisplayText(locale: AppLocale, grantedIds: readonly string[]): string {
  if (isFullCatalogGrantSet(grantedIds)) {
    return acT(locale, 'rolePermissionsAll')
  }
  const granted = new Set(grantedIds)
  const labels: string[] = []
  for (const sectionDef of ROLE_PERMISSION_CATALOG) {
    for (const item of sectionDef.items) {
      if (granted.has(item.id)) {
        labels.push(catalogItemLabel(locale, item))
      }
    }
  }
  return labels.join(locale === 'zh' ? '、' : ', ')
}

export function catalogGrantsSummary(locale: AppLocale, grantedIds: readonly string[]): string {
  if (isFullCatalogGrantSet(grantedIds)) {
    return acT(locale, 'rolePermissionsAll')
  }
  const count = grantedIds.length
  return locale === 'zh' ? `${count} 项权限` : `${count} permissions`
}

export const ROLE_PERMISSION_CATALOG_ITEM_COUNT = ALL_CATALOG_ITEM_IDS.size
