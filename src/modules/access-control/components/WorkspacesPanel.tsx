import { useMemo } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  formatWorkspaceCreatedAt,
  isDeletableWorkspace,
  isDefaultWorkspace,
  isWorkspaceLockedMember,
  localizeWorkspaceRowDescription,
  localizeWorkspaceRowName,
  type WorkspaceRow,
} from '../data/workspacesSeed'
import { resolveOrgMemberName } from '../data/orgMembersCatalog'
import { acT, accessControlSectionTitle, accessModeBadgeLabel } from '../i18n/strings'
import type { AccessMode } from '../types'
import { AccessModeBadgeSelect } from './AccessModeBadgeSelect'
import { DeleteIcon, EditIcon } from './RowActionIcons'

type WorkspacesPanelProps = {
  locale: AppLocale
  workspaces: WorkspaceRow[]
  searchQuery?: string
  readOnly?: boolean
  onEdit?: (workspace: WorkspaceRow) => void
  onRemove?: (workspace: WorkspaceRow) => void
  onOpenMembers?: (workspace: WorkspaceRow) => void
  onAccessModeChange?: (workspaceId: string, accessMode: AccessMode) => void
}

function workspaceMemberSummary(
  locale: AppLocale,
  count: number,
): string {
  return acT(locale, 'workspaceMemberCount').replace('{count}', String(count))
}

function workspaceAdminLabel(locale: AppLocale, workspace: WorkspaceRow): string {
  const adminEntry = workspace.members.find((entry) => isWorkspaceLockedMember(entry))
  if (!adminEntry) return '—'
  return resolveOrgMemberName(adminEntry.memberId, locale) ?? '—'
}

export function WorkspacesPanel({
  locale,
  workspaces,
  searchQuery = '',
  readOnly,
  onEdit,
  onRemove,
  onOpenMembers,
  onAccessModeChange,
}: WorkspacesPanelProps) {
  const filteredWorkspaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return workspaces
    return workspaces.filter((workspace) => {
      const haystack = [
        localizeWorkspaceRowName(workspace, locale),
        localizeWorkspaceRowDescription(workspace, locale),
        workspaceAdminLabel(locale, workspace),
        workspaceMemberSummary(locale, workspace.memberCount),
        accessModeBadgeLabel(locale, workspace.accessMode),
        formatWorkspaceCreatedAt(workspace.createdAt, locale),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [locale, searchQuery, workspaces])

  if (filteredWorkspaces.length === 0) {
    return (
      <div className="ac-members-panel">
        <div className="skills-empty">{acT(locale, 'noWorkspaces')}</div>
      </div>
    )
  }

  return (
    <div className="ac-members-panel">
      <div className="ac-members-table ac-members-table--workspaces" role="table">
        <div className="ac-members-table-head" role="row">
          <span role="columnheader" className="ac-workspaces-name-col">
            {accessControlSectionTitle(locale, 'workspace')}
          </span>
          <span role="columnheader" className="ac-workspaces-desc-col">
            {acT(locale, 'workspaceColumnDescription')}
          </span>
          <span role="columnheader" className="ac-workspaces-admin-col">
            {acT(locale, 'workspaceColumnAdmin')}
          </span>
          <span role="columnheader" className="ac-workspaces-members-col">
            {acT(locale, 'workspaceColumnMembers')}
          </span>
          <span role="columnheader" className="ac-workspaces-access-col">
            {acT(locale, 'workspaceColumnAccessPermission')}
          </span>
          <span role="columnheader" className="ac-workspaces-created-col">
            {acT(locale, 'workspaceColumnCreatedAt')}
          </span>
          <span role="columnheader" className="ac-members-table-actions-col">
            {acT(locale, 'roleColumnActions')}
          </span>
        </div>
        <ul className="ac-members-table-body" role="rowgroup">
          {filteredWorkspaces.map((workspace) => {
            const name = localizeWorkspaceRowName(workspace, locale)
            const description = localizeWorkspaceRowDescription(workspace, locale)
            const adminLabel = workspaceAdminLabel(locale, workspace)
            const memberSummary = workspaceMemberSummary(locale, workspace.memberCount)
            const accessLabel = accessModeBadgeLabel(locale, workspace.accessMode)
            const createdLabel = formatWorkspaceCreatedAt(workspace.createdAt, locale)
            const canDelete = !readOnly && onRemove != null && isDeletableWorkspace(workspace)
            const accessModeLocked = isDefaultWorkspace(workspace)

            return (
              <li key={workspace.id} className="ac-members-row" role="row">
                <span role="cell" className="ac-members-name ac-workspaces-name-col">
                  {name}
                </span>
                <span role="cell" className="ac-workspaces-desc" title={description}>
                  {description}
                </span>
                <span role="cell" className="ac-workspaces-admin" title={adminLabel}>
                  {adminLabel}
                </span>
                <span role="cell" className="ac-workspaces-members" title={memberSummary}>
                  {onOpenMembers && workspace.memberCount > 0 ? (
                    <button
                      type="button"
                      className="ac-workspaces-members-btn"
                      title={memberSummary}
                      onClick={() => onOpenMembers(workspace)}
                    >
                      {memberSummary}
                    </button>
                  ) : (
                    memberSummary
                  )}
                </span>
                <span role="cell" className="ac-workspaces-access" title={accessLabel}>
                  <AccessModeBadgeSelect
                    locale={locale}
                    value={workspace.accessMode}
                    disabled={readOnly || !onAccessModeChange || accessModeLocked}
                    onChange={(mode) => onAccessModeChange?.(workspace.id, mode)}
                  />
                </span>
                <span role="cell" className="ac-workspaces-created" title={createdLabel}>
                  {createdLabel}
                </span>
                <span role="cell" className="ac-members-row-actions">
                  {!readOnly && onEdit ? (
                    <button
                      type="button"
                      className="ac-row-icon-btn"
                      aria-label={acT(locale, 'editWorkspace')}
                      onClick={() => onEdit(workspace)}
                    >
                      <EditIcon />
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      className="ac-row-icon-btn ac-row-icon-btn--danger"
                      aria-label={acT(locale, 'removeWorkspace')}
                      onClick={() => onRemove(workspace)}
                    >
                      <DeleteIcon />
                    </button>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
