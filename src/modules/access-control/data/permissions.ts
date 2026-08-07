import type { MemberAssignment, Permission, RolePreset } from '../types'

export const PERMISSIONS = [
  'access.view',
  'access.list_resources',
  'resource.view',
  'resource.edit',
  'resource.create',
  'resource.delete',
  'resource.run',
  'resource.publish',
  'member.view',
  'member.invite',
  'member.remove',
  'member.edit_permission',
  'zone.view',
  'zone.create',
  'zone.edit',
  'zone.delete',
  'space.edit',
  'space.delete',
] as const

export const SHARED_SPACE_PERMISSIONS: Permission[] = [
  'access.view',
  'access.list_resources',
  'resource.view',
  'resource.run',
]

export const ROLE_PRESET_PERMISSIONS: Record<Exclude<RolePreset, 'custom'>, Permission[]> = {
  observer: [
    'access.view',
    'access.list_resources',
    'resource.view',
    'member.view',
    'zone.view',
  ],
  collaborator: [
    'access.view',
    'access.list_resources',
    'resource.view',
    'resource.edit',
    'resource.create',
    'resource.run',
    'resource.publish',
    'member.view',
    'zone.view',
  ],
  space_admin: [...PERMISSIONS],
  no_access: [],
}

/** 工作区级 Manager 等角色的成员权限（与协助者预设一致） */
export const WORKSPACE_MANAGER_MEMBER_PERMISSIONS: Permission[] = [
  ...ROLE_PRESET_PERMISSIONS.collaborator,
]

/** 兼容旧数据：区管理员→管理员，发布者→协助者 */
export function normalizeRolePreset(preset: RolePreset): RolePreset {
  if ((preset as string) === 'zone_admin') return 'space_admin'
  if ((preset as string) === 'publisher') return 'collaborator'
  return preset
}

export function permissionsForPreset(preset: Exclude<RolePreset, 'custom'>): Permission[] {
  return [...ROLE_PRESET_PERMISSIONS[preset]]
}

export function detectRolePreset(permissions: Permission[]): RolePreset {
  const sorted = [...permissions].sort().join(',')
  for (const [preset, perms] of Object.entries(ROLE_PRESET_PERMISSIONS) as Array<
    [Exclude<RolePreset, 'custom'>, Permission[]]
  >) {
    if ([...perms].sort().join(',') === sorted) return preset
  }
  if ([...WORKSPACE_MANAGER_MEMBER_PERMISSIONS].sort().join(',') === sorted) {
    return 'collaborator'
  }
  return 'custom'
}

export function hasPermission(permissions: readonly Permission[], permission: Permission): boolean {
  return permissions.includes(permission)
}

/** 子级权限不得超过父级权限上限 */
export function clampToParentPermissions(
  parentPermissions: readonly Permission[],
  childPermissions: readonly Permission[],
): Permission[] {
  const parentSet = new Set(parentPermissions)
  return childPermissions.filter((p) => parentSet.has(p))
}

/** @deprecated Use clampToParentPermissions */
export const clampToSpacePermissions = clampToParentPermissions

export function assignmentFromPreset(
  memberId: string,
  preset: Exclude<RolePreset, 'custom'>,
): MemberAssignment {
  const permissions = permissionsForPreset(preset)
  return { memberId, rolePreset: preset, permissions }
}
