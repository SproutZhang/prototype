import { PERMISSIONS } from '../data/permissions'
import type { Permission } from '../types'

export type PermissionGroupId = 'access' | 'space' | 'resource' | 'member' | 'zone'

export const PERMISSION_GROUP_ORDER: PermissionGroupId[] = [
  'access',
  'space',
  'resource',
  'member',
  'zone',
]

function buildGroups(): Record<PermissionGroupId, Permission[]> {
  const groups: Record<PermissionGroupId, Permission[]> = {
    access: [],
    space: [],
    resource: [],
    member: [],
    zone: [],
  }
  for (const perm of PERMISSIONS) {
    const group = perm.split('.')[0] as PermissionGroupId
    if (group in groups) groups[group].push(perm)
  }
  return groups
}

export const PERMISSIONS_BY_GROUP = buildGroups()

export function permissionBelongsToGroup(permission: Permission): PermissionGroupId {
  return permission.split('.')[0] as PermissionGroupId
}
