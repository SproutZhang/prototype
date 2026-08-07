import { useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { resolveOrgMemberName } from '../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import type { WorkspaceRow } from '../data/workspacesSeed'
import { acT } from '../i18n/strings'
import { resolveRoleLabel, type RoleDisplayOverride } from '../utils/roleDisplay'

type WorkspaceMembersDrawerProps = {
  locale: AppLocale
  workspace: WorkspaceRow
  roles: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  onClose: () => void
  onAddUser: () => void
}

type WorkspaceMemberRow = {
  id: string
  userLabel: string
  roleLabel: string
}

type RoleSortDirection = 'asc' | 'desc'

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

function SortIcon({ direction }: { direction: RoleSortDirection }) {
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

export function WorkspaceMembersDrawer({
  locale,
  workspace,
  roles,
  roleOverridesById,
  onClose,
  onAddUser,
}: WorkspaceMembersDrawerProps) {
  const headingId = useId()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleSort, setRoleSort] = useState<RoleSortDirection>('asc')

  useEffect(() => {
    setSearchQuery('')
  }, [workspace.id])

  const rows = useMemo<WorkspaceMemberRow[]>(() => {
    const items = workspace.members
      .map(({ memberId, roleId }) => {
        const userLabel = resolveOrgMemberName(memberId, locale)
        if (!userLabel) return null
        const role = roles.find((item) => item.id === roleId)
        const roleLabel = role ? resolveRoleLabel(role, roleOverridesById?.[role.id]) : roleId
        return { id: memberId, userLabel, roleLabel }
      })
      .filter((row): row is WorkspaceMemberRow => row != null)

    items.sort((a, b) => {
      const roleCompare = a.roleLabel.localeCompare(b.roleLabel, locale === 'zh' ? 'zh-CN' : 'en')
      if (roleCompare !== 0) {
        return roleSort === 'asc' ? roleCompare : -roleCompare
      }
      return a.userLabel.localeCompare(b.userLabel, locale === 'zh' ? 'zh-CN' : 'en')
    })

    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (row) =>
        row.userLabel.toLowerCase().includes(q) || row.roleLabel.toLowerCase().includes(q),
    )
  }, [locale, roleOverridesById, roleSort, roles, searchQuery, workspace.members])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside className="scenario-collect-drawer ac-assigned-users-drawer" aria-labelledby={headingId}>
      <div className="scenario-collect-drawer-header">
        <h2 id={headingId} className="scenario-collect-drawer-title">
          {acT(locale, 'workspaceMembersDrawerTitle')}
        </h2>
        <button
          type="button"
          className="scenario-collect-drawer-close"
          aria-label={acT(locale, 'workspaceMembersDrawerClose')}
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
            <button type="button" className="agents-btn agents-btn-primary" onClick={onAddUser}>
              {acT(locale, 'inviteUser')}
            </button>
          </div>
          <div className="ac-assigned-users-table" role="table">
            <div className="ac-assigned-users-table-head" role="row">
              <span role="columnheader">{acT(locale, 'roleAssignedUsersColumnUser')}</span>
              <button
                type="button"
                role="columnheader"
                className="ac-assigned-users-sort-btn"
                aria-label={roleSort === 'asc' ? acT(locale, 'sortAscending') : acT(locale, 'sortDescending')}
                onClick={() => setRoleSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              >
                {acT(locale, 'workspaceMembersColumnRole')}
                <SortIcon direction={roleSort} />
              </button>
            </div>
            <ul className="ac-assigned-users-table-body" role="rowgroup">
              {rows.map((row) => (
                <li key={row.id} className="ac-assigned-users-row" role="row">
                  <span role="cell" className="ac-assigned-users-user" title={row.userLabel}>
                    {row.userLabel}
                  </span>
                  <span role="cell" className="ac-assigned-users-workspace" title={row.roleLabel}>
                    {row.roleLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  )
}
