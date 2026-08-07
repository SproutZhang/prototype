import { readLoginSession } from '../../../auth/session'
import type { LoginRole } from '../../../auth/types'

/** 演示：登录邮箱 → 组织成员 ID */
const LOGIN_EMAIL_TO_MEMBER_ID: Record<string, string> = {
  'admin@studiox.com': 'member-mgr-wang',
  'manager@studiox.com': 'member-mgr-wang',
  'manager-1@studiox.com': 'member-hr-zhang',
  'user@studiox.com': 'member-it-li',
  'user-1@studiox.com': 'member-ops-chen',
}

export function resolveCurrentMemberId(): string {
  const session = readLoginSession()
  if (!session?.email) return 'member-mgr-wang'
  return LOGIN_EMAIL_TO_MEMBER_ID[session.email] ?? 'member-mgr-wang'
}

export function resolveCurrentRole(): LoginRole {
  const session = readLoginSession()
  return session?.role ?? 'manager'
}
