export type { LoginRole, LoginSession } from './types'
export { resolveLoginRoleTier, isLoginRoleTier, resolveWorkspaceRoleIdForLogin } from './types'
export { LOGIN_ROLE_PRESETS, getLoginRolePreset, validateLoginCredentials } from './loginPresets'
export {
  clearLoginSession,
  consumePendingRoute,
  ensureDemoSession,
  persistLoginSession,
  readAuthenticated,
  readLoginSession,
} from './session'
export {
  canAccessAppPage,
  getRolePermissions,
  hasAppPermission,
  resolveAuthorizedPage,
  type AppPage,
  type AppPermission,
} from './rbac'
export { useRbac } from './useRbac'
