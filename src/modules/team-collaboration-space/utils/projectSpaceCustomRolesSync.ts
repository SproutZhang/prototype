import { permissionsForPreset } from '../../access-control/data/permissions'
import type { SpaceCustomRole, SpaceCustomRoleDraft, TcsPermission, TcsRolePreset } from '../types'
import { createSpaceCustomRoleId } from './spaceRoles'

export type ProjectSpaceBuiltinPreset = Exclude<TcsRolePreset, 'custom' | 'no_access'>

const BUILTIN_PRESETS: ProjectSpaceBuiltinPreset[] = ['observer', 'collaborator', 'space_admin']

const listeners = new Set<() => void>()
const customRoles: SpaceCustomRole[] = []
const builtinRoleOverrides = new Map<ProjectSpaceBuiltinPreset, SpaceCustomRole['permissions']>()
let storeVersion = 0

export type ProjectSpaceRolesStoreSnapshot = {
  version: number
  customRoles: readonly SpaceCustomRole[]
  builtinRolePermissions: Record<ProjectSpaceBuiltinPreset, SpaceCustomRole['permissions']>
}

function cloneRole(role: SpaceCustomRole): SpaceCustomRole {
  return {
    ...role,
    permissions: [...role.permissions],
  }
}

function buildSnapshot(): ProjectSpaceRolesStoreSnapshot {
  const builtinRolePermissions = {} as Record<ProjectSpaceBuiltinPreset, SpaceCustomRole['permissions']>
  for (const preset of BUILTIN_PRESETS) {
    const override = builtinRoleOverrides.get(preset)
    builtinRolePermissions[preset] = override
      ? [...override]
      : [...permissionsForPreset(preset)]
  }
  return {
    version: storeVersion,
    customRoles: customRoles.map(cloneRole),
    builtinRolePermissions,
  }
}

let cachedSnapshot: ProjectSpaceRolesStoreSnapshot | null = null
let cachedVersion = -1

function notifyProjectSpaceCustomRoles() {
  storeVersion += 1
  cachedSnapshot = null
  listeners.forEach((listener) => listener())
}

export function subscribeProjectSpaceCustomRoles(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getProjectSpaceRolesStoreSnapshot(): ProjectSpaceRolesStoreSnapshot {
  if (cachedSnapshot && cachedVersion === storeVersion) {
    return cachedSnapshot
  }
  cachedSnapshot = buildSnapshot()
  cachedVersion = storeVersion
  return cachedSnapshot
}

/** @deprecated 使用 getProjectSpaceRolesStoreSnapshot */
export function getProjectSpaceCustomRolesSnapshot(): readonly SpaceCustomRole[] {
  return getProjectSpaceRolesStoreSnapshot().customRoles
}

export function resolveProjectSpacePresetPermissions(
  preset: ProjectSpaceBuiltinPreset,
): SpaceCustomRole['permissions'] {
  const override = builtinRoleOverrides.get(preset)
  return override ? [...override] : [...permissionsForPreset(preset)]
}

export function resolveSpaceMemberPresetPermissions(
  preset: Exclude<TcsRolePreset, 'custom'>,
): TcsPermission[] {
  if (preset === 'no_access') return [...permissionsForPreset('no_access')]
  return resolveProjectSpacePresetPermissions(preset)
}

export function addProjectSpaceCustomRoleRecord(draft: SpaceCustomRoleDraft): string {
  const roleId = createSpaceCustomRoleId()
  customRoles.push({
    id: roleId,
    nameZh: draft.nameZh.trim() || '自定义角色',
    nameEn: draft.nameEn.trim() || draft.nameZh.trim() || 'Custom role',
    permissions: [...draft.permissions],
  })
  notifyProjectSpaceCustomRoles()
  return roleId
}

export function updateProjectSpaceCustomRoleRecord(
  roleId: string,
  draft: SpaceCustomRoleDraft,
): SpaceCustomRole | null {
  const index = customRoles.findIndex((role) => role.id === roleId)
  if (index < 0) return null
  const nextRole: SpaceCustomRole = {
    id: roleId,
    nameZh: draft.nameZh.trim() || customRoles[index].nameZh,
    nameEn: draft.nameEn.trim() || draft.nameZh.trim() || customRoles[index].nameEn,
    permissions: [...draft.permissions],
  }
  customRoles[index] = nextRole
  notifyProjectSpaceCustomRoles()
  return cloneRole(nextRole)
}

export function updateProjectSpaceBuiltinRolePermissions(
  preset: ProjectSpaceBuiltinPreset,
  permissions: SpaceCustomRole['permissions'],
): SpaceCustomRole['permissions'] {
  const next = [...permissions]
  builtinRoleOverrides.set(preset, next)
  notifyProjectSpaceCustomRoles()
  return next
}

export function removeProjectSpaceCustomRoleRecord(roleId: string): boolean {
  const index = customRoles.findIndex((role) => role.id === roleId)
  if (index < 0) return false
  customRoles.splice(index, 1)
  notifyProjectSpaceCustomRoles()
  return true
}
