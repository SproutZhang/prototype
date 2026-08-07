export type AccessControlSection =
  | 'workspace'
  | 'users'
  | 'roles'
  | 'departments'
  | 'members'
  | 'audit-log'
  | 'work-log'
  | 'api-keys'
  | 'model-management'

export const MEMBER_ADD_APPLY_RECORDS_PATH = '/access-control/members/records'

export function accessControlSectionPath(section: AccessControlSection): string {
  if (section === 'users') return '/access-control/users'
  if (section === 'roles') return '/access-control/roles'
  if (section === 'departments') return '/access-control/departments'
  if (section === 'members') return '/access-control/members'
  if (section === 'audit-log') return '/access-control/audit-log'
  if (section === 'work-log') return '/access-control/work-log'
  if (section === 'api-keys') return '/access-control/api-keys'
  if (section === 'model-management') return '/access-control/model-management'
  return '/access-control'
}

export function accessControlSectionFromPath(path: string): AccessControlSection {
  if (path.startsWith('/access-control/users')) return 'users'
  if (path.startsWith('/access-control/roles')) return 'roles'
  if (path.startsWith('/access-control/departments')) return 'departments'
  if (path.startsWith('/access-control/members')) return 'members'
  if (path.startsWith('/access-control/audit-log')) return 'audit-log'
  if (path.startsWith('/access-control/work-log')) return 'work-log'
  if (path.startsWith('/access-control/api-keys')) return 'api-keys'
  if (path.startsWith('/access-control/model-management')) return 'model-management'
  return 'workspace'
}

export function isAccessControlPath(path: string): boolean {
  return path === '/access-control' || path.startsWith('/access-control/')
}

export function isMemberAddApplyRecordsPath(path: string): boolean {
  return path.startsWith(MEMBER_ADD_APPLY_RECORDS_PATH)
}

export function navigateScenarioTrace(workflowKey: string, sessionId?: string): void {
  if (typeof window === 'undefined') return
  const base = `/access-control/work-log/scenario/${encodeURIComponent(workflowKey)}`
  const target = sessionId ? `${base}?session=${encodeURIComponent(sessionId)}` : base
  if (window.location.pathname + window.location.search === target) return
  window.history.pushState({ page: 'access-control' }, '', target)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export type ScenarioTraceRoute = {
  workflowKey: string
  sessionId?: string
}

export function parseScenarioTraceRoute(pathname: string, search: string): ScenarioTraceRoute | null {
  const match = pathname.match(/^\/access-control\/work-log\/scenario\/([^/]+)$/)
  if (!match) return null
  const workflowKey = decodeURIComponent(match[1])
  const sessionId = new URLSearchParams(search).get('session') ?? undefined
  return { workflowKey, sessionId }
}

/** 在访问控制模块内切换子页面（成员 / 部门等），与 Home 侧栏导航一致 */
export function navigateAccessControlSection(section: AccessControlSection): void {
  if (typeof window === 'undefined') return
  const target = accessControlSectionPath(section)
  if (window.location.pathname === target) return
  window.history.pushState({ page: 'access-control' }, '', target)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function navigateMemberAddApplyRecords(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname === MEMBER_ADD_APPLY_RECORDS_PATH) return
  window.history.pushState({ page: 'access-control' }, '', MEMBER_ADD_APPLY_RECORDS_PATH)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}
