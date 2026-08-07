import type { LoginRole } from '../../../auth/types'
import { PERMISSIONS, permissionsForPreset, WORKSPACE_MANAGER_MEMBER_PERMISSIONS } from '../data/permissions'
import type { Permission } from '../types'
import { ORG_MEMBER_IDS } from './orgMembersCatalog'

export type RoleCatalogProfile =
  | 'admin'
  | 'manager'
  | 'user'
  | 'auditor'
  | 'guest'
  | 'ops'
  | 'analyst'
  | 'support'
  | 'knowledge'
  | 'security'
  | 'readonly'
  | 'publish-reviewer'
  | 'bi'
  | 'hr'
  | 'meeting'

export const BUILTIN_ROLE_IDS = new Set(['user', 'admin', 'manager'])

/** 登录演示账户对应的工作区角色（与内置 User/Manager 分离） */
export const LOGIN_DEMO_WORKSPACE_ROLE_IDS = new Set(['user-1', 'manager-1'])

export const ADMIN_WORKSPACE_ROLE_ID = 'admin'
export const MANAGER_WORKSPACE_ROLE_ID = 'manager'
export const USER_WORKSPACE_ROLE_ID = 'user'
export const MANAGER1_WORKSPACE_ROLE_ID = 'manager-1'
export const USER1_WORKSPACE_ROLE_ID = 'user-1'

/** 登录账户不可变更的内置角色（权限层级：Admin > Manager > User） */
const BUILTIN_ROLES_IMMUTABLE_BY: Record<Exclude<LoginRole, 'admin'>, ReadonlySet<string>> = {
  manager: new Set([ADMIN_WORKSPACE_ROLE_ID]),
  'manager-1': new Set([ADMIN_WORKSPACE_ROLE_ID]),
  user: new Set([ADMIN_WORKSPACE_ROLE_ID, MANAGER_WORKSPACE_ROLE_ID]),
  'user-1': new Set([ADMIN_WORKSPACE_ROLE_ID, MANAGER_WORKSPACE_ROLE_ID]),
}

export function isBuiltinWorkspaceRole(roleId: string): boolean {
  return BUILTIN_ROLE_IDS.has(roleId)
}

export function isLoginDemoWorkspaceRole(roleId: string): boolean {
  return LOGIN_DEMO_WORKSPACE_ROLE_IDS.has(roleId)
}

export function canMutateWorkspaceRole(roleId: string, allowBuiltinMutation = false): boolean {
  if (allowBuiltinMutation) return true
  return !isBuiltinWorkspaceRole(roleId)
}

/** 非 Admin 账户不可编辑 / 修改 / 删除更高层级的内置角色 */
export function canActorMutateWorkspaceRole(
  actorRole: LoginRole | undefined,
  targetRoleId: string,
  allowBuiltinMutation = false,
): boolean {
  if (actorRole === 'admin') {
    return canMutateWorkspaceRole(targetRoleId, true)
  }

  if (actorRole && actorRole !== 'admin') {
    const immutableTargets = BUILTIN_ROLES_IMMUTABLE_BY[actorRole]
    if (immutableTargets.has(targetRoleId)) return false
    if (isBuiltinWorkspaceRole(targetRoleId)) {
      return allowBuiltinMutation || !immutableTargets.has(targetRoleId)
    }
    return true
  }

  return canMutateWorkspaceRole(targetRoleId, allowBuiltinMutation)
}

export type WorkspaceRoleRow = {
  id: string
  label: string
  descriptionKey?: 'roleDescUser' | 'roleDescAdmin' | 'roleDescManager'
  description?: { zh: string; en: string }
  catalogProfile: RoleCatalogProfile
  permissions: Permission[]
  assignedMemberIds: string[]
}

/** 演示：共 20 人 · Admin 2 · Manager 4 · User 14 */
const ADMIN_MEMBER_IDS = ORG_MEMBER_IDS.slice(0, 2)
const MANAGER_MEMBER_IDS = ORG_MEMBER_IDS.slice(2, 6)
const USER_MEMBER_IDS = ORG_MEMBER_IDS.slice(6, 20)

function pickMemberIds(start: number, count: number): string[] {
  return ORG_MEMBER_IDS.slice(start, start + count)
}

const EXTRA_WORKSPACE_ROLES: WorkspaceRoleRow[] = [
  {
    id: 'auditor',
    label: '审计员',
    description: {
      zh: '可查看操作日志、登录记录与报表，不具备内容修改权限。',
      en: 'Can view operation logs, login history, and reports without edit access.',
    },
    catalogProfile: 'auditor',
    permissions: permissionsForPreset('observer'),
    assignedMemberIds: pickMemberIds(32, 5),
  },
  {
    id: 'ops-specialist',
    label: '运营专员',
    description: {
      zh: '管理活动、广告与互动模块，支持内容发布与数据查看。',
      en: 'Manages campaigns, ads, and interaction modules with publish and analytics access.',
    },
    catalogProfile: 'ops',
    permissions: [...WORKSPACE_MANAGER_MEMBER_PERMISSIONS],
    assignedMemberIds: pickMemberIds(45, 18),
  },
  {
    id: 'knowledge-admin',
    label: '知识库管理员',
    description: {
      zh: '维护知识库目录、标签与问答内容，支持团队知识沉淀。',
      en: 'Maintains knowledge base catalogs, tags, and Q&A content for the team.',
    },
    catalogProfile: 'knowledge',
    permissions: [...WORKSPACE_MANAGER_MEMBER_PERMISSIONS],
    assignedMemberIds: pickMemberIds(90, 6),
  },
]

export const WORKSPACE_ROLE_ROWS: WorkspaceRoleRow[] = [
  {
    id: 'admin',
    label: 'Admin',
    descriptionKey: 'roleDescAdmin',
    catalogProfile: 'admin',
    permissions: permissionsForPreset('space_admin'),
    assignedMemberIds: ADMIN_MEMBER_IDS,
  },
  {
    id: 'manager',
    label: 'Manager',
    descriptionKey: 'roleDescManager',
    catalogProfile: 'manager',
    permissions: [...WORKSPACE_MANAGER_MEMBER_PERMISSIONS],
    assignedMemberIds: MANAGER_MEMBER_IDS,
  },
  {
    id: 'manager-1',
    label: 'Manager-1',
    descriptionKey: 'roleDescManager',
    catalogProfile: 'manager',
    permissions: [...WORKSPACE_MANAGER_MEMBER_PERMISSIONS],
    assignedMemberIds: ['member-hr-zhang'],
  },
  {
    id: 'user',
    label: 'User',
    descriptionKey: 'roleDescUser',
    catalogProfile: 'user',
    permissions: permissionsForPreset('observer'),
    assignedMemberIds: USER_MEMBER_IDS,
  },
  {
    id: 'user-1',
    label: 'User-1',
    descriptionKey: 'roleDescUser',
    catalogProfile: 'user',
    permissions: permissionsForPreset('observer'),
    assignedMemberIds: ['member-ops-chen'],
  },
  ...EXTRA_WORKSPACE_ROLES,
]
export function isFullPermissionSet(permissions: Permission[]): boolean {
  return permissions.length >= PERMISSIONS.length
}

export const ASSIGNED_USERS_TAG_LIMIT = 3
