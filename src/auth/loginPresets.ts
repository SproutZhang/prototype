import type { LoginRole } from './types'

export type LoginRolePreset = {
  role: LoginRole
  label: string
  email: string
  password: string
  defaultPath: string
}

export const LOGIN_ROLE_PRESETS: readonly LoginRolePreset[] = [
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@studiox.com',
    password: 'admin123',
    defaultPath: '/',
  },
  {
    role: 'manager',
    label: 'Manager',
    email: 'manager@studiox.com',
    password: 'mgr123',
    defaultPath: '/',
  },
  {
    role: 'manager-1',
    label: 'Manager1',
    email: 'manager-1@studiox.com',
    password: 'mgr123',
    defaultPath: '/',
  },
  {
    role: 'user',
    label: 'User',
    email: 'user@studiox.com',
    password: 'user123',
    defaultPath: '/',
  },
  {
    role: 'user-1',
    label: 'User1',
    email: 'user-1@studiox.com',
    password: 'user123',
    defaultPath: '/',
  },
] as const

export function getLoginRolePreset(role: LoginRole): LoginRolePreset {
  const preset = LOGIN_ROLE_PRESETS.find((item) => item.role === role)
  if (!preset) return LOGIN_ROLE_PRESETS[1]
  return preset
}

export function validateLoginCredentials(
  role: LoginRole,
  email: string,
  password: string,
): boolean {
  const preset = getLoginRolePreset(role)
  return email.trim().toLowerCase() === preset.email.toLowerCase() && password === preset.password
}
