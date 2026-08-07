const CUSTOM_ROLE_SELECT_PREFIX = 'custom:'

let customRoleIdCounter = 0

export function createSpaceCustomRoleId(): string {
  customRoleIdCounter += 1
  return `space-role-${Date.now()}-${customRoleIdCounter}`
}

export function isCustomRoleSelectValue(value: string): boolean {
  return value.startsWith(CUSTOM_ROLE_SELECT_PREFIX)
}

export function parseCustomRoleSelectValue(value: string): string {
  return value.slice(CUSTOM_ROLE_SELECT_PREFIX.length)
}

export function formatCustomRoleSelectValue(roleId: string): string {
  return `${CUSTOM_ROLE_SELECT_PREFIX}${roleId}`
}
