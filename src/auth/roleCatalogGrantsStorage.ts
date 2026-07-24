import { getAllCatalogGrantIds } from '../modules/access-control/data/rolePermissionsCatalog'

/** 访问控制 · 角色权限清单持久化（演示） */
export const ROLE_CATALOG_GRANTS_STORAGE_KEY = 'agentdemo-role-catalog-grants'

export const ROLE_CATALOG_GRANTS_CHANGED_EVENT = 'agentdemo-role-catalog-grants-changed'

export type RoleCatalogGrantsByRoleId = Record<string, string[]>

type StoredCatalogGrantsPayload = {
  catalogIds: string[]
  grants: RoleCatalogGrantsByRoleId
}

export type CatalogGrantsSnapshot = {
  grants: RoleCatalogGrantsByRoleId
  previousCatalogIds: Set<string>
}

function isLegacyGrantsPayload(value: unknown): value is RoleCatalogGrantsByRoleId {
  if (!value || typeof value !== 'object') return false
  if ('catalogIds' in value || 'grants' in value) return false
  return true
}

function isVersionedGrantsPayload(value: unknown): value is StoredCatalogGrantsPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as StoredCatalogGrantsPayload
  return Array.isArray(payload.catalogIds) && payload.grants && typeof payload.grants === 'object'
}

export function readCatalogGrantsSnapshot(): CatalogGrantsSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(ROLE_CATALOG_GRANTS_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (isVersionedGrantsPayload(parsed)) {
      return {
        grants: parsed.grants,
        previousCatalogIds: new Set(parsed.catalogIds),
      }
    }
    if (isLegacyGrantsPayload(parsed)) {
      return {
        grants: parsed,
        previousCatalogIds: new Set(),
      }
    }
  } catch {
    return null
  }
  return null
}

export function readCatalogGrantsByRoleId(): RoleCatalogGrantsByRoleId | null {
  return readCatalogGrantsSnapshot()?.grants ?? null
}

export function writeCatalogGrantsByRoleId(grants: RoleCatalogGrantsByRoleId): void {
  if (typeof localStorage === 'undefined') return
  const payload: StoredCatalogGrantsPayload = {
    catalogIds: [...getAllCatalogGrantIds()],
    grants,
  }
  localStorage.setItem(ROLE_CATALOG_GRANTS_STORAGE_KEY, JSON.stringify(payload))
  notifyRoleCatalogGrantsChanged()
}

export function readCatalogGrantIdsForRole(roleId: string): string[] | null {
  const grants = readCatalogGrantsByRoleId()
  if (!grants || !Object.prototype.hasOwnProperty.call(grants, roleId)) return null
  return grants[roleId] ?? null
}

export function notifyRoleCatalogGrantsChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ROLE_CATALOG_GRANTS_CHANGED_EVENT))
}
