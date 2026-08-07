import { useEffect, useState } from 'react'

import { getLoginRolePreset } from './loginPresets'
import { hasCatalogGrantForLoginRole } from './catalogGrantAccess'
import { canAccessAppPage, hasAppPermission, type AppPage, type AppPermission } from './rbac'
import { ROLE_CATALOG_GRANTS_CHANGED_EVENT } from './roleCatalogGrantsStorage'
import { readLoginSession } from './session'
import type { LoginRole } from './types'

export function useRbac() {
  const [grantsRevision, setGrantsRevision] = useState(0)
  const session = readLoginSession()
  const role: LoginRole = session?.role ?? 'manager'
  const email = session?.email ?? getLoginRolePreset('manager').email
  const roleLabel = getLoginRolePreset(role).label

  useEffect(() => {
    const onGrantsChanged = () => setGrantsRevision((value) => value + 1)
    window.addEventListener(ROLE_CATALOG_GRANTS_CHANGED_EVENT, onGrantsChanged)
    return () => window.removeEventListener(ROLE_CATALOG_GRANTS_CHANGED_EVENT, onGrantsChanged)
  }, [])

  const can = (permission: AppPermission) => hasAppPermission(role, permission)
  const canAccessPage = (page: AppPage) => canAccessAppPage(role, page)
  const hasCatalogGrant = (grantId: string) => {
    void grantsRevision
    return hasCatalogGrantForLoginRole(role, grantId)
  }

  return { role, email, roleLabel, can, canAccessPage, hasCatalogGrant, grantsRevision }
}
