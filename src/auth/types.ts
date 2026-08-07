export type LoginRole = 'admin' | 'manager' | 'manager-1' | 'user' | 'user-1'

export type LoginSession = {
  role: LoginRole
  email: string
  defaultPath: string
}

export type LoginRoleTier = 'admin' | 'manager' | 'user'

/** 权限层级（各登录账户独立，仅权限模板与 User/Manager 同级） */
export function resolveLoginRoleTier(role: LoginRole): LoginRoleTier {
  switch (role) {
    case 'admin':
      return 'admin'
    case 'manager':
    case 'manager-1':
      return 'manager'
    case 'user':
    case 'user-1':
      return 'user'
  }
}

export function isLoginRoleTier(
  role: LoginRole | undefined,
  tier: LoginRoleTier,
): boolean {
  return role != null && resolveLoginRoleTier(role) === tier
}

/** 登录账户 → 访问控制工作区角色 ID（一一对应，不做别名映射） */
export function resolveWorkspaceRoleIdForLogin(role: LoginRole): LoginRole {
  return role
}
