import type { AppLocale } from '../../../i18n/homeStrings'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'

export type RoleDisplayOverride = {
  label?: string
  description?: string
}

export function resolveRoleLabel(role: WorkspaceRoleRow, override?: RoleDisplayOverride): string {
  const custom = override?.label?.trim()
  return custom || role.label
}

export function resolveRoleDescription(
  locale: AppLocale,
  role: WorkspaceRoleRow,
  override?: RoleDisplayOverride,
): string {
  const custom = override?.description?.trim()
  if (custom) return custom
  if (role.description) {
    return locale === 'zh' ? role.description.zh : role.description.en
  }
  if (role.descriptionKey) {
    return acT(locale, role.descriptionKey)
  }
  return ''
}
