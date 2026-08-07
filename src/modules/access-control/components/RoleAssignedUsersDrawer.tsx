import { useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { resolveMemberWorkspaceLabel, resolveOrgMemberName } from '../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'
import { DeleteIcon } from './RowActionIcons'

type RoleAssignedUsersDrawerProps = {
  locale: AppLocale
  role: WorkspaceRoleRow
  onClose: () => void
  onAddUser?: () => void
  onRemoveUser?: (memberId: string) => void
}

type AssignedUserRow = {
  id: string
  userLabel: string
  workspaceLabel: string
}

type WorkspaceSortDirection = 'asc' | 'desc'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.8 16.8 21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SortIcon({ direction }: { direction: WorkspaceSortDirection }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      {direction === 'asc' ? (
        <path d="M8 4l3 4H5l3-4z" fill="currentColor" />
      ) : (
        <path d="M8 12L5 8h6L8 12z" fill="currentColor" />
      )}
    </svg>
  )
}

export function RoleAssignedUsersDrawer({
  locale,
  role,
  onClose,
  onAddUser,
  onRemoveUser,
}: RoleAssignedUsersDrawerProps) {
  const headingId = useId()
  const [searchQuery, setSearchQuery] = useState('')
  const [workspaceSort, setWorkspaceSort] = useState<WorkspaceSortDirection>('asc')

  useEffect(() => {
    setSearchQuery('')
  }, [role.id])

  const rows = useMemo<AssignedUserRow[]>(() => {
    const items = role.assignedMemberIds
      .map((id) => {
        const userLabel = resolveOrgMemberName(id, locale)
        if (!userLabel) return null
        return {
          id,
          userLabel,
          workspaceLabel: resolveMemberWorkspaceLabel(id, locale),
        }
      })
      .filter((row): row is AssignedUserRow => row != null)

    items.sort((a, b) => {
      const workspaceCompare = a.workspaceLabel.localeCompare(
        b.workspaceLabel,
        locale === 'zh' ? 'zh-CN' : 'en',
      )
      if (workspaceCompare !== 0) {
        return workspaceSort === 'asc' ? workspaceCompare : -workspaceCompare
      }
      return a.userLabel.localeCompare(b.userLabel, locale === 'zh' ? 'zh-CN' : 'en')
    })

    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (row) =>
        row.userLabel.toLowerCase().includes(q) || row.workspaceLabel.toLowerCase().includes(q),
    )
  }, [locale, role.assignedMemberIds, searchQuery, workspaceSort])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleWorkspaceSort = () => {
    setWorkspaceSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const showActionsColumn = onRemoveUser != null

  return (
    <aside className="scenario-collect-drawer ac-assigned-users-drawer" aria-labelledby={headingId}>
      <div className="scenario-collect-drawer-header">
        <h2 id={headingId} className="scenario-collect-drawer-title">
          {acT(locale, 'roleAssignedUsersDrawerTitle')}
        </h2>
        <button
          type="button"
          className="scenario-collect-drawer-close"
          aria-label={acT(locale, 'roleAssignedUsersDrawerClose')}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="scenario-collect-drawer-body">
        <div className="scenario-collect-drawer-field">
          <div className="ac-assigned-users-toolbar">
            <div className="agents-search skills-page-search ac-page-search ac-assigned-users-search">
              <span className="agents-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                type="search"
                className="agents-search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={acT(locale, 'searchPlaceholder')}
                aria-label={acT(locale, 'searchPlaceholder')}
              />
            </div>
            {onAddUser ? (
              <button type="button" className="agents-btn agents-btn-primary" onClick={onAddUser}>
                {acT(locale, 'inviteUser')}
              </button>
            ) : null}
          </div>
          <div
            className={`ac-assigned-users-table${showActionsColumn ? ' ac-assigned-users-table--with-actions' : ''}`}
            role="table"
          >
          <div className="ac-assigned-users-table-head" role="row">
            <span role="columnheader">{acT(locale, 'roleAssignedUsersColumnUser')}</span>
            <button
              type="button"
              role="columnheader"
              className="ac-assigned-users-sort-btn"
              aria-label={
                workspaceSort === 'asc' ? acT(locale, 'sortAscending') : acT(locale, 'sortDescending')
              }
              onClick={toggleWorkspaceSort}
            >
              {acT(locale, 'roleAssignedUsersColumnWorkspace')}
              <SortIcon direction={workspaceSort} />
            </button>
            {showActionsColumn ? (
              <span role="columnheader" className="ac-assigned-users-actions-col">
                {acT(locale, 'roleColumnActions')}
              </span>
            ) : null}
          </div>
          <ul className="ac-assigned-users-table-body" role="rowgroup">
            {rows.map((row) => (
              <li key={row.id} className="ac-assigned-users-row" role="row">
                <span role="cell" className="ac-assigned-users-user" title={row.userLabel}>
                  {row.userLabel}
                </span>
                <span role="cell" className="ac-assigned-users-workspace" title={row.workspaceLabel}>
                  {row.workspaceLabel}
                </span>
                {showActionsColumn ? (
                  <span role="cell" className="ac-assigned-users-actions">
                    <button
                      type="button"
                      className="ac-row-icon-btn ac-row-icon-btn--danger"
                      aria-label={acT(locale, 'removeUser')}
                      onClick={() => onRemoveUser(row.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </aside>
  )
}
