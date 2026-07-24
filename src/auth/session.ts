import type { LoginRole, LoginSession } from './types'
import { getLoginRolePreset } from './loginPresets'

const AUTH_KEY = 'agentdemo-demo-auth'
const SESSION_KEY = 'agentdemo-demo-session'
const PENDING_ROUTE_KEY = 'agentdemo-pending-route'

export function readAuthenticated(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(AUTH_KEY) !== '0'
}

/** 无会话时写入 manager 演示账户，保证首次进入即为 manager 权限 */
export function ensureDemoSession(): LoginSession {
  const existing = readLoginSession()
  if (existing) return existing
  const preset = getLoginRolePreset('manager')
  return persistLoginSession('manager', preset.email)
}

export function readLoginSession(): LoginSession | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LoginSession
    if (parsed?.role && parsed?.defaultPath) return parsed
  } catch {
    return null
  }
  return null
}

export function persistLoginSession(role: LoginRole, email: string): LoginSession {
  const preset = getLoginRolePreset(role)
  const session: LoginSession = {
    role,
    email,
    defaultPath: preset.defaultPath,
  }
  sessionStorage.setItem(AUTH_KEY, '1')
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  sessionStorage.setItem(PENDING_ROUTE_KEY, preset.defaultPath)
  return session
}

export function consumePendingRoute(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  const path = sessionStorage.getItem(PENDING_ROUTE_KEY)
  if (path) sessionStorage.removeItem(PENDING_ROUTE_KEY)
  return path
}

export function clearLoginSession(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(AUTH_KEY, '0')
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(PENDING_ROUTE_KEY)
}
