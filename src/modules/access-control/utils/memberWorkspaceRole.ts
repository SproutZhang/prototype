import type { AppLocale } from '../../../i18n/homeStrings'
import { normalizeRolePreset } from '../data/permissions'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'
import type { RolePreset } from '../types'
import { resolveRoleLabel, type RoleDisplayOverride } from './roleDisplay'

export const PRESET_FALLBACK_ROLE_ID: Record<RolePreset, string> = {
  observer: 'user',
  collaborator: 'user',
  space_admin: 'admin',
  no_access: 'user',
  custom: 'user',
}

const ROLE_MATCH_PRIORITY = [
  'admin',
  'manager',
  'knowledge-admin',
  'ops-specialist',
  'auditor',
  'user',
] as const

export function findWorkspaceRoleForMember(
  memberId: string,
  roles: readonly WorkspaceRoleRow[],
): WorkspaceRoleRow | null {
  const matches = roles.filter((role) => role.assignedMemberIds.includes(memberId))
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]!
  for (const roleId of ROLE_MATCH_PRIORITY) {
    const hit = matches.find((role) => role.id === roleId)
    if (hit) return hit
  }
  return matches[0]!
}

export function resolveMemberWorkspaceRoleLabel(
  locale: AppLocale,
  memberId: string,
  rolePreset: RolePreset,
  roles: readonly WorkspaceRoleRow[],
  roleOverridesById?: Record<string, RoleDisplayOverride>,
): string {
  const matched = findWorkspaceRoleForMember(memberId, roles)
  if (matched) {
    return resolveRoleLabel(matched, roleOverridesById?.[matched.id])
  }

  const normalized = normalizeRolePreset(rolePreset)
  const fallbackId = PRESET_FALLBACK_ROLE_ID[normalized]
  const fallbackRole = roles.find((role) => role.id === fallbackId)
  if (fallbackRole) {
    return resolveRoleLabel(fallbackRole, roleOverridesById?.[fallbackId])
  }

  const keyMap: Record<
    RolePreset,
    'roleObserver' | 'roleCollaborator' | 'roleSpaceAdmin' | 'roleNoAccess' | 'roleCustom'
  > = {
    observer: 'roleObserver',
    collaborator: 'roleCollaborator',
    space_admin: 'roleSpaceAdmin',
    no_access: 'roleNoAccess',
    custom: 'roleCustom',
  }
  return acT(locale, keyMap[normalized])
}
