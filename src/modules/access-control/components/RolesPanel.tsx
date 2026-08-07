import { useMemo } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { AssignedUsersTags, resolveAssignedUserNames } from './AssignedUsersTags'
import { AddIcon, DeleteIcon, EditIcon } from './RowActionIcons'
import { catalogGrantsDisplayText } from '../data/rolePermissionsCatalog'
import { WORKSPACE_ROLE_ROWS, canMutateWorkspaceRole, isFullPermissionSet, type WorkspaceRoleRow } from '../data/workspaceRoles'
import {
  acT,
  accessControlSectionTitle,
  permissionLabel,
} from '../i18n/strings'
import {
  resolveRoleDescription,
  resolveRoleLabel,
  type RoleDisplayOverride,
} from '../utils/roleDisplay'

export type { WorkspaceRoleRow }
export { WORKSPACE_ROLE_ROWS }

type RolesPanelProps = {
  locale: AppLocale
  roles: WorkspaceRoleRow[]
  searchQuery?: string
  catalogGrantsByRoleId?: Record<string, string[]>
  roleOverridesById?: Record<string, RoleDisplayOverride>
  readOnly?: boolean
  /** Admin 可编辑 User / Admin / Manager 等内置角色 */
  allowBuiltinRoleMutation?: boolean
  canMutateRole?: (role: WorkspaceRoleRow) => boolean
  onEdit?: (role: WorkspaceRoleRow) => void
  onRemove?: (roleId: string) => void
  onOpenPermissions?: (role: WorkspaceRoleRow) => void
  onOpenAssignedUsers?: (role: WorkspaceRoleRow) => void
  onAddUser?: (role: WorkspaceRoleRow) => void
}

function roleDescription(
  locale: AppLocale,
  role: WorkspaceRoleRow,
  roleOverridesById?: Record<string, RoleDisplayOverride>,
): string {
  return resolveRoleDescription(locale, role, roleOverridesById?.[role.id])
}

function rolePermissionsSummary(
  locale: AppLocale,
  role: WorkspaceRoleRow,
  catalogGrantsByRoleId?: Record<string, string[]>,
): string {
  const grantedIds = catalogGrantsByRoleId?.[role.id]
  if (grantedIds) return catalogGrantsDisplayText(locale, grantedIds)
  if (isFullPermissionSet(role.permissions)) return acT(locale, 'rolePermissionsAll')
  return role.permissions
    .map((permission) => permissionLabel(locale, permission))
    .join(locale === 'zh' ? '、' : ', ')
}

function roleAssignedUsersSummary(locale: AppLocale, memberIds: string[]): string {
  const names = resolveAssignedUserNames(locale, memberIds)
  if (names.length === 0) return acT(locale, 'roleNoAssignedUsers')
  return names.join(locale === 'zh' ? '、' : ', ')
}

export function RolesPanel({
  locale,
  roles,
  searchQuery = '',
  catalogGrantsByRoleId,
  roleOverridesById,
  readOnly,
  allowBuiltinRoleMutation = false,
  canMutateRole: canMutateRoleRow,
  onEdit,
  onRemove,
  onOpenPermissions,
  onOpenAssignedUsers,
  onAddUser,
}: RolesPanelProps) {
  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return roles
    return roles.filter((role) => {
      const haystack = [
        resolveRoleLabel(role, roleOverridesById?.[role.id]),
        roleDescription(locale, role, roleOverridesById),
        rolePermissionsSummary(locale, role, catalogGrantsByRoleId),
        roleAssignedUsersSummary(locale, role.assignedMemberIds),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [locale, searchQuery, catalogGrantsByRoleId, roleOverridesById, roles])

  if (filteredRoles.length === 0) {
    return (
      <div className="ac-members-panel">
        <div className="skills-empty">{acT(locale, 'noRoles')}</div>
      </div>
    )
  }

  const showActionsColumn = onEdit != null || onRemove != null || onAddUser != null

  return (
    <div className="ac-members-panel">
      <div className="ac-members-table ac-members-table--roles" role="table">
        <div className="ac-members-table-head" role="row">
          <span role="columnheader" className="ac-roles-name-col">
            {accessControlSectionTitle(locale, 'roles')}
          </span>
          <span role="columnheader" className="ac-roles-desc-col">
            {acT(locale, 'roleColumnDescription')}
          </span>
          <span role="columnheader" className="ac-roles-permissions-col">
            {acT(locale, 'roleColumnPermissions')}
          </span>
          <span role="columnheader" className="ac-roles-assigned-col">
            {acT(locale, 'roleColumnAssignedUsers')}
          </span>
          {showActionsColumn ? (
            <span role="columnheader" className="ac-members-table-actions-col">
              {acT(locale, 'roleColumnActions')}
            </span>
          ) : null}
        </div>
        <ul className="ac-members-table-body" role="rowgroup">
          {filteredRoles.map((role) => {
            const label = resolveRoleLabel(role, roleOverridesById?.[role.id])
            const description = roleDescription(locale, role, roleOverridesById)
            const permissionsSummary = rolePermissionsSummary(locale, role, catalogGrantsByRoleId)
            const rowCanMutate =
              canMutateRoleRow?.(role) ??
              canMutateWorkspaceRole(role.id, allowBuiltinRoleMutation)

            return (
              <li key={role.id} className="ac-members-row" role="row">
                <span role="cell" className="ac-members-name ac-roles-name-col">
                  {label}
                </span>
                <span role="cell" className="ac-roles-desc" title={description}>
                  {description}
                </span>
                {onOpenPermissions && rowCanMutate ? (
                  <button
                    type="button"
                    role="cell"
                    className="ac-roles-permissions ac-roles-permissions-btn"
                    title={permissionsSummary}
                    onClick={() => onOpenPermissions(role)}
                  >
                    {permissionsSummary}
                  </button>
                ) : (
                  <span
                    role="cell"
                    className="ac-roles-permissions"
                    title={permissionsSummary}
                  >
                    {permissionsSummary}
                  </span>
                )}
                <span role="cell" className="ac-roles-assigned-users">
                  <AssignedUsersTags
                    locale={locale}
                    memberIds={role.assignedMemberIds}
                    onOpen={
                      onOpenAssignedUsers && rowCanMutate
                        ? () => onOpenAssignedUsers(role)
                        : undefined
                    }
                  />
                </span>
                {showActionsColumn ? (
                  <span role="cell" className="ac-members-row-actions">
                    {!readOnly && onEdit ? (
                      <button
                        type="button"
                        className="ac-row-icon-btn"
                        aria-label={acT(locale, 'editRole')}
                        disabled={!rowCanMutate}
                        onClick={() => onEdit(role)}
                      >
                        <EditIcon />
                      </button>
                    ) : null}
                    {onAddUser ? (
                      <button
                        type="button"
                        className="ac-row-icon-btn"
                        aria-label={acT(locale, 'addMember')}
                        title={acT(locale, 'addMember')}
                        disabled={!rowCanMutate}
                        onClick={() => onAddUser(role)}
                      >
                        <AddIcon />
                      </button>
                    ) : null}
                    {!readOnly && onRemove ? (
                      <button
                        type="button"
                        className="ac-row-icon-btn ac-row-icon-btn--danger"
                        aria-label={acT(locale, 'removeRole')}
                        disabled={!rowCanMutate}
                        onClick={() => onRemove(role.id)}
                      >
                        <DeleteIcon />
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
