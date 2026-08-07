import { useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { getOrgMemberById, resolveOrgMemberName } from '../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { isWorkspaceLockedMember, type WorkspaceRow } from '../data/workspacesSeed'
import { acT } from '../i18n/strings'
import type { MemberAssignment } from '../types'
import {
  memberStatusLabel,
  mockMemberLastLogin,
  resolveMemberStatus,
  type MockMemberStatus,
} from '../utils/memberTableDisplay'
import { memberAvatarColors, memberAvatarInitials, memberAvatarInitialsForMember } from '../utils/memberAvatar'
import { resolveRoleLabel, type RoleDisplayOverride } from '../utils/roleDisplay'
import { buildMemberAssignmentFromWorkspaceEntry } from '../utils/workspaceMembers'
import { EditIcon } from './RowActionIcons'

type WorkspaceEditDrawerProps = {
  locale: AppLocale
  workspace: WorkspaceRow
  roles: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  memberStatusOverrides?: Record<string, MockMemberStatus>
  onClose: () => void
  onEditMemberRole: (payload: { assignment: MemberAssignment; roleId: string }) => void
  onEditMemberInvite: (payload: { assignment: MemberAssignment; roleId: string }) => void
  onAddUser: () => void
  onRemoveUser: (memberIds: string[]) => void
  /** Manager 视角：锁定工作区 Admin 不可勾选、改角色或移除；Admin 视角为 false */
  restrictLockedAdminMembers?: boolean
}

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

export function WorkspaceEditDrawer({
  locale,
  workspace,
  roles,
  roleOverridesById,
  memberStatusOverrides,
  onClose,
  onEditMemberRole,
  onEditMemberInvite,
  onAddUser,
  onRemoveUser,
  restrictLockedAdminMembers = false,
}: WorkspaceEditDrawerProps) {
  const headingId = useId()
  const selectAllId = useId()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setSearchQuery('')
    setSelectedMemberIds(new Set())
  }, [workspace.id])

  const rows = useMemo(() => {
    return workspace.members
      .map((entry) => {
        const userLabel = resolveOrgMemberName(entry.memberId, locale)
        if (!userLabel) return null
        const orgMember = getOrgMemberById(entry.memberId)
        const email = orgMember?.email ?? ''
        const avatar = memberAvatarColors(entry.memberId)
        const avatarInitials = orgMember
          ? memberAvatarInitialsForMember(orgMember, locale)
          : memberAvatarInitials(userLabel)
        const role = roles.find((item) => item.id === entry.roleId)
        const roleLabel = role ? resolveRoleLabel(role, roleOverridesById?.[role.id]) : entry.roleId
        const isLocked = restrictLockedAdminMembers && isWorkspaceLockedMember(entry)
        const status: MockMemberStatus = isLocked
          ? 'active'
          : resolveMemberStatus(entry.memberId, memberStatusOverrides)
        const assignment = buildMemberAssignmentFromWorkspaceEntry(entry, roles)
        return {
          id: entry.memberId,
          roleId: entry.roleId,
          isLocked,
          userLabel,
          email,
          avatar,
          avatarInitials,
          roleLabel,
          status,
          statusLabel: memberStatusLabel(locale, status),
          lastLogin: mockMemberLastLogin(locale, entry.memberId, status),
          assignment,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
  }, [locale, memberStatusOverrides, restrictLockedAdminMembers, roleOverridesById, roles, workspace.members])

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) =>
      [row.userLabel, row.email, row.roleLabel, row.statusLabel, row.lastLogin]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, searchQuery])

  const selectableFilteredRowIds = useMemo(
    () => filteredRows.filter((row) => !row.isLocked).map((row) => row.id),
    [filteredRows],
  )
  const allFilteredSelected =
    selectableFilteredRowIds.length > 0 &&
    selectableFilteredRowIds.every((id) => selectedMemberIds.has(id))
  const someFilteredSelected = selectableFilteredRowIds.some((id) => selectedMemberIds.has(id))
  const hasSelection = selectedMemberIds.size > 0

  useEffect(() => {
    const memberIds = new Set(workspace.members.map((entry) => entry.memberId))
    const lockedMemberIds = new Set(
      workspace.members
        .filter((entry) => restrictLockedAdminMembers && isWorkspaceLockedMember(entry))
        .map((entry) => entry.memberId),
    )
    setSelectedMemberIds((prev) => {
      const next = new Set(
        [...prev].filter((id) => memberIds.has(id) && !lockedMemberIds.has(id)),
      )
      return next.size === prev.size ? prev : next
    })
  }, [restrictLockedAdminMembers, workspace.members])

  const toggleMemberSelection = (memberId: string) => {
    const row = rows.find((item) => item.id === memberId)
    if (row?.isLocked) return
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const toggleAllFilteredSelection = () => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const id of selectableFilteredRowIds) next.delete(id)
      } else {
        for (const id of selectableFilteredRowIds) next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside
      className="scenario-collect-drawer ac-workspace-edit-drawer"
      aria-labelledby={headingId}
    >
      <div className="scenario-collect-drawer-header">
        <h2 id={headingId} className="scenario-collect-drawer-title">
          {acT(locale, 'editWorkspace')}
        </h2>
        <button
          type="button"
          className="scenario-collect-drawer-close"
          aria-label={acT(locale, 'workspaceEditDrawerClose')}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="scenario-collect-drawer-body ac-workspace-edit-drawer-body">
        <div className="ac-workspace-edit-toolbar">
          <div className="agents-search skills-page-search ac-page-search ac-workspace-edit-search">
            <span className="agents-search-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="agents-search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={acT(locale, 'searchPlaceholder')}
              aria-label={acT(locale, 'searchPlaceholder')}
            />
          </div>
          <button
            type="button"
            className={`agents-btn${hasSelection ? ' ac-btn--danger' : ''}`}
            disabled={!hasSelection}
            onClick={() => onRemoveUser([...selectedMemberIds])}
          >
            {acT(locale, 'removeUser')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={onAddUser}>
            {acT(locale, 'inviteUser')}
          </button>
        </div>

        <div className="ac-members-table ac-workspace-edit-members-table" role="table">
          <div className="ac-members-table-head" role="row">
            <span role="columnheader" className="ac-members-select-col">
              <label className="ac-workspace-edit-select-all" htmlFor={selectAllId}>
                <input
                  id={selectAllId}
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = someFilteredSelected && !allFilteredSelected
                    }
                  }}
                  onChange={toggleAllFilteredSelection}
                  aria-label={acT(locale, 'rolePermissionsSelectAll')}
                />
              </label>
            </span>
            <span role="columnheader">{acT(locale, 'memberColumnName')}</span>
            <span role="columnheader">{acT(locale, 'memberColumnRole')}</span>
            <span role="columnheader">{acT(locale, 'memberActivationStatus')}</span>
            <span role="columnheader">{acT(locale, 'memberLastLogin')}</span>
            <span role="columnheader" className="ac-members-table-actions-col">
              {acT(locale, 'roleColumnActions')}
            </span>
          </div>
          <ul className="ac-members-table-body" role="rowgroup">
            {filteredRows.length === 0 ? (
              <li className="ac-workspace-edit-empty" role="row">
                <span role="cell">{acT(locale, 'noMembers')}</span>
              </li>
            ) : (
              filteredRows.map((row) => (
                <li
                  key={row.id}
                  className={`ac-members-row${row.isLocked ? ' is-locked' : ''}`}
                  role="row"
                >
                  <span role="cell" className="ac-members-body-cell ac-workspace-edit-member-select">
                    {row.isLocked ? (
                      <span className="ac-workspace-edit-member-select-placeholder" aria-hidden="true" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.has(row.id)}
                        onChange={() => toggleMemberSelection(row.id)}
                        aria-label={row.userLabel}
                      />
                    )}
                  </span>
                  <span role="cell" className="ac-members-body-cell ac-workspace-edit-member-cell">
                    <span className="ac-workspace-edit-member-profile">
                      <span
                        className="ac-workspace-edit-member-avatar"
                        style={{ background: row.avatar.background, color: row.avatar.color }}
                        aria-hidden="true"
                      >
                        {row.avatarInitials}
                      </span>
                      <span className="ac-workspace-edit-member-text">
                        <span className="ac-workspace-edit-member-name" title={row.userLabel}>
                          {row.userLabel}
                        </span>
                        <span className="ac-workspace-edit-member-email" title={row.email}>
                          {row.email}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span role="cell" className="ac-members-body-cell" title={row.roleLabel}>
                    {row.roleLabel}
                  </span>
                  <span role="cell" className="ac-members-body-cell">
                    <span className={`ac-member-status ac-member-status--${row.status}`}>
                      {row.statusLabel}
                    </span>
                  </span>
                  <span role="cell" className="ac-members-last-login ac-members-body-cell">
                    {row.lastLogin}
                  </span>
                  <span role="cell" className="ac-members-row-actions ac-members-body-cell">
                    {row.isLocked ? (
                      <span className="ac-workspace-edit-row-action-placeholder" aria-hidden="true">
                        —
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="ac-workspace-edit-row-action"
                        aria-label={
                          row.status === 'active'
                            ? acT(locale, 'memberActionChangeRole')
                            : acT(locale, 'memberActionInvite')
                        }
                        onClick={() =>
                          row.status === 'active'
                            ? onEditMemberRole({ assignment: row.assignment, roleId: row.roleId })
                            : onEditMemberInvite({ assignment: row.assignment, roleId: row.roleId })
                        }
                      >
                        <EditIcon />
                        <span>
                          {row.status === 'active'
                            ? acT(locale, 'memberActionChangeRole')
                            : acT(locale, 'memberActionInvite')}
                        </span>
                      </button>
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </aside>
  )
}
