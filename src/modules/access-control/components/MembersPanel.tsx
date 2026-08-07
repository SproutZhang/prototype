import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  clampToSpacePermissions,
  detectRolePreset,
  normalizeRolePreset,
  permissionsForPreset,
} from '../data/permissions'
import {
  acT,
  PERMISSIONS,
  permissionLabel,
  rolePresetLabel,
  ROLE_PRESET_OPTIONS,
} from '../i18n/strings'
import type { MemberAssignment, OrgMember, Permission, RolePreset } from '../types'
import {
  buildMemberRoleGroups,
  filterMemberRoleGroups,
} from '../utils/memberRoleGroups'
import { resolveMemberWorkspaceRoleLabel } from '../utils/memberWorkspaceRole'
import type { RoleDisplayOverride } from '../utils/roleDisplay'
import { resolveRoleLabel } from '../utils/roleDisplay'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { BatchSelectUsersModal } from './BatchSelectUsersModal'
import {
  memberStatusLabel,
  memberStatusActionButtonLabel,
  resolveMemberStatus,
  type MockMemberStatus,
} from '../utils/memberTableDisplay'
import {
  accountTypeLabel,
  ALL_ACCOUNT_TYPES,
  ALL_MEMBER_STATUSES,
  mockAccountType,
  mockEmployeeId,
  mockEmployeeUserId,
  mockMemberPosition,
  type MockAccountType,
} from '../utils/memberDirectoryDisplay'
import { ActivateIcon, DeactivateIcon, DeleteIcon, EditIcon, TransferAuthorityIcon, DepartmentManagerIcon } from './RowActionIcons'

function ColumnFilterIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M2.5 3.5h11L9.5 9v3.5l-2.5-1.5V9L2.5 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RoleGroupChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`ac-members-role-toggle-chevron${expanded ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function memberCountLabel(locale: AppLocale, count: number): string {
  return locale === 'zh' ? `${count} 人` : `${count} member${count === 1 ? '' : 's'}`
}

function rolePresetSelectValue(assignment: MemberAssignment): Exclude<RolePreset, 'custom'> {
  const normalized = normalizeRolePreset(assignment.rolePreset)
  if (normalized !== 'custom') return normalized
  const detected = normalizeRolePreset(detectRolePreset(assignment.permissions))
  return detected === 'custom' ? 'observer' : detected
}

export type SpaceCustomRoleOption = {
  id: string
  labelZh: string
  labelEn: string
}

function memberRoleSelectValue(
  assignment: MemberAssignment,
  customRoles: readonly SpaceCustomRoleOption[],
): string {
  if (
    assignment.customRoleId &&
    customRoles.some((role) => role.id === assignment.customRoleId)
  ) {
    return `custom:${assignment.customRoleId}`
  }
  return rolePresetSelectValue(assignment)
}

function resolveMemberRoleDisplayLabel(
  locale: AppLocale,
  assignment: MemberAssignment,
  customRoles: readonly SpaceCustomRoleOption[],
): string {
  if (assignment.customRoleId) {
    const role = customRoles.find((item) => item.id === assignment.customRoleId)
    if (role) return locale === 'zh' ? role.labelZh : role.labelEn
  }
  return rolePresetLabel(locale, assignment.rolePreset)
}

type MembersPanelProps = {
  locale: AppLocale
  members: MemberAssignment[]
  orgMembers: OrgMember[]
  workspaceRoles?: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  searchQuery?: string
  memberStatusOverrides?: Record<string, MockMemberStatus>
  emptyMessageKey?: 'noMembers' | 'noProjectMembers'
  tableLayout?: 'default' | 'tree'
  readOnly?: boolean
  showAddButton?: boolean
  /** 工具栏已移至弹窗标题行时隐藏面板内按钮 */
  hideToolbar?: boolean
  localizeMember: (m: OrgMember) => string
  localizeMemberDept: (m: OrgMember) => string
  onAdd?: () => void
  onEdit?: (assignment: MemberAssignment) => void
  onRemove?: (memberId: string) => void
  onRoleChange?: (assignment: MemberAssignment, preset: Exclude<RolePreset, 'custom'>) => void
  /** 项空间自定义角色（与 onRoleSelectChange 配合） */
  spaceCustomRoles?: SpaceCustomRoleOption[]
  onRoleSelectChange?: (assignment: MemberAssignment, value: string) => void
  /** 为 true 时禁止增删改成员，点击相关操作会触发 onManageLockedClick */
  manageLocked?: boolean
  onManageLockedClick?: () => void
  onMemberStatusChange?: (memberId: string, status: MockMemberStatus) => void
  onSelectionChange?: (memberIds: string[]) => void
  selectionClearSignal?: number | string
  /** 当前部门 Manager 成员 id（展示标签并限制删除/失效） */
  departmentManagerMemberId?: string | null
  onTransferDepartmentManager?: () => void
}

export function MembersPanel({
  locale,
  members,
  orgMembers,
  workspaceRoles = [],
  roleOverridesById,
  searchQuery = '',
  memberStatusOverrides,
  emptyMessageKey = 'noMembers',
  tableLayout = 'default',
  readOnly,
  showAddButton = true,
  hideToolbar = false,
  localizeMember,
  localizeMemberDept: _localizeMemberDept,
  onAdd,
  onEdit,
  onRemove,
  onRoleChange,
  spaceCustomRoles = [],
  onRoleSelectChange,
  manageLocked = false,
  onManageLockedClick,
  onMemberStatusChange,
  onSelectionChange,
  selectionClearSignal,
  departmentManagerMemberId = null,
  onTransferDepartmentManager,
}: MembersPanelProps) {
  const selectAllId = useId()
  const memberMap = useMemo(() => new Map(orgMembers.map((m) => [m.id, m])), [orgMembers])

  const runUnlessLocked = useCallback(
    (action: () => void) => {
      if (manageLocked) {
        onManageLockedClick?.()
        return
      }
      action()
    },
    [manageLocked, onManageLockedClick],
  )

  const showToolbar = !readOnly && !hideToolbar && onAdd && showAddButton
  const groupByRole = workspaceRoles.length > 0

  const roleGroups = useMemo(() => {
    if (!groupByRole) return []
    return buildMemberRoleGroups(workspaceRoles, members)
  }, [groupByRole, workspaceRoles, members])

  const filteredRoleGroups = useMemo(
    () =>
      filterMemberRoleGroups(roleGroups, searchQuery, memberMap, localizeMember, roleOverridesById),
    [roleGroups, searchQuery, memberMap, localizeMember, roleOverridesById],
  )

  const [expandedRoleIds, setExpandedRoleIds] = useState<Set<string>>(() => new Set())
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(() => new Set())
  const [accountTypeFilters, setAccountTypeFilters] = useState<Set<MockAccountType>>(
    () => new Set(ALL_ACCOUNT_TYPES),
  )
  const [statusFilters, setStatusFilters] = useState<Set<MockMemberStatus>>(
    () => new Set(ALL_MEMBER_STATUSES),
  )
  const [openColumnFilter, setOpenColumnFilter] = useState<'accountType' | 'accountStatus' | null>(
    null,
  )

  const useTreeTable = tableLayout === 'tree'

  const visibleDirectoryMembers = useMemo(() => {
    if (!useTreeTable) return members

    const query = searchQuery.trim().toLowerCase()
    return members.filter((assignment) => {
      const org = memberMap.get(assignment.memberId)
      if (!org) return false

      const status = resolveMemberStatus(assignment.memberId, memberStatusOverrides)
      const accountType = mockAccountType(assignment.memberId)

      if (!accountTypeFilters.has(accountType)) return false
      if (!statusFilters.has(status)) return false

      if (!query) return true

      const haystack = [
        localizeMember(org),
        accountTypeLabel(locale, accountType),
        memberStatusLabel(locale, status),
        mockMemberPosition(org, locale),
        mockEmployeeId(assignment.memberId),
        org.email,
        mockEmployeeUserId(assignment.memberId),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
      .sort((assignmentA, assignmentB) => {
        const statusA = resolveMemberStatus(assignmentA.memberId, memberStatusOverrides)
        const statusB = resolveMemberStatus(assignmentB.memberId, memberStatusOverrides)
        if (statusA === 'inactive' && statusB !== 'inactive') return 1
        if (statusA !== 'inactive' && statusB === 'inactive') return -1
        const indexA = members.findIndex((item) => item.memberId === assignmentA.memberId)
        const indexB = members.findIndex((item) => item.memberId === assignmentB.memberId)
        return indexA - indexB
      })
  }, [
    accountTypeFilters,
    locale,
    memberMap,
    memberStatusOverrides,
    members,
    searchQuery,
    statusFilters,
    useTreeTable,
    localizeMember,
  ])

  const filteredMemberIds = useMemo(() => {
    if (useTreeTable) {
      return visibleDirectoryMembers.map((assignment) => assignment.memberId)
    }
    if (groupByRole) {
      return filteredRoleGroups.flatMap((group) => group.entries.map((entry) => entry.memberId))
    }
    return members.map((assignment) => assignment.memberId)
  }, [filteredRoleGroups, groupByRole, members, useTreeTable, visibleDirectoryMembers])

  const allFilteredSelected =
    filteredMemberIds.length > 0 && filteredMemberIds.every((id) => selectedMemberIds.has(id))
  const someFilteredSelected = filteredMemberIds.some((id) => selectedMemberIds.has(id))

  useEffect(() => {
    setSelectedMemberIds(new Set())
  }, [selectionClearSignal])

  useEffect(() => {
    if (!openColumnFilter) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.ac-members-col-filter-wrap')) return
      setOpenColumnFilter(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openColumnFilter])

  useEffect(() => {
    onSelectionChange?.([...selectedMemberIds])
  }, [onSelectionChange, selectedMemberIds])

  const toggleAccountTypeFilter = useCallback((accountType: MockAccountType) => {
    setAccountTypeFilters((prev) => {
      const next = new Set(prev)
      if (next.has(accountType)) next.delete(accountType)
      else next.add(accountType)
      return next
    })
  }, [])

  const toggleStatusFilter = useCallback((status: MockMemberStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }, [])

  const toggleMemberSelection = useCallback((memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }, [])

  const toggleAllFilteredSelection = useCallback(() => {
    setSelectedMemberIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        for (const id of filteredMemberIds) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of filteredMemberIds) next.add(id)
      return next
    })
  }, [allFilteredSelected, filteredMemberIds])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) return
    setExpandedRoleIds(new Set(filteredRoleGroups.map((group) => group.role.id)))
  }, [searchQuery, filteredRoleGroups])

  const toggleRoleGroup = (roleId: string) => {
    setExpandedRoleIds((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const isEmpty = useTreeTable
    ? visibleDirectoryMembers.length === 0
    : groupByRole
      ? filteredRoleGroups.length === 0
      : members.length === 0
  const tableClassName = useTreeTable
    ? 'ac-members-table ac-members-table--members-tree ac-members-table--members-directory'
    : 'ac-members-table'
  const panelClassName = useTreeTable
    ? 'ac-members-panel ac-members-panel--with-pagination'
    : 'ac-members-panel'

  const renderDirectoryRowActions = (
    assignment: MemberAssignment,
    status: MockMemberStatus,
  ) => {
    if (readOnly) return null

    const isDepartmentManager =
      departmentManagerMemberId != null && assignment.memberId === departmentManagerMemberId
    const canActivate = !isDepartmentManager && status !== 'active' && onMemberStatusChange != null
    const canDeactivate =
      !isDepartmentManager && status === 'active' && onMemberStatusChange != null
    const canDelete = !isDepartmentManager && onRemove != null
    const canTransfer =
      isDepartmentManager && onTransferDepartmentManager != null
    const hasRowActions =
      canActivate || canDeactivate || canDelete || canTransfer

    if (!hasRowActions) return null

    return (
      <div className="ac-members-directory-actions">
        {canTransfer ? (
          <button
            type="button"
            className="ac-row-icon-btn"
            aria-label={acT(locale, 'memberActionTransferDepartmentManager')}
            title={acT(locale, 'memberActionTransferDepartmentManager')}
            onClick={onTransferDepartmentManager}
          >
            <TransferAuthorityIcon />
          </button>
        ) : null}
        {canActivate ? (
          <button
            type="button"
            className="ac-row-icon-btn ac-row-icon-btn--success"
            aria-label={memberStatusActionButtonLabel(locale, 'active', status)}
            title={memberStatusActionButtonLabel(locale, 'active', status)}
            onClick={() => onMemberStatusChange!(assignment.memberId, 'active')}
          >
            <ActivateIcon />
          </button>
        ) : null}
        {canDeactivate ? (
          <button
            type="button"
            className="ac-row-icon-btn ac-row-icon-btn--warn"
            aria-label={acT(locale, 'memberStatusActionDeactivate')}
            title={acT(locale, 'memberStatusActionDeactivate')}
            onClick={() => onMemberStatusChange!(assignment.memberId, 'inactive')}
          >
            <DeactivateIcon />
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="ac-row-icon-btn ac-row-icon-btn--danger"
            aria-label={acT(locale, 'memberActionDelete')}
            title={acT(locale, 'memberActionDelete')}
            onClick={() => onRemove!(assignment.memberId)}
          >
            <DeleteIcon />
          </button>
        ) : null}
      </div>
    )
  }

  const showDirectoryActionsColumn =
    useTreeTable &&
    !readOnly &&
    (onMemberStatusChange != null ||
      onRemove != null ||
      onTransferDepartmentManager != null)

  const renderDirectoryMemberRow = (assignment: MemberAssignment, key: string) => {
    const org = memberMap.get(assignment.memberId)
    if (!org) return null
    const status = resolveMemberStatus(assignment.memberId, memberStatusOverrides)
    const accountType = mockAccountType(assignment.memberId)
    const memberName = localizeMember(org)
    const isDepartmentManager =
      departmentManagerMemberId != null && assignment.memberId === departmentManagerMemberId

    return (
      <li key={key} className="ac-members-row" role="row">
        <span role="cell" className="ac-members-select ac-departments-select">
          <input
            type="checkbox"
            checked={selectedMemberIds.has(assignment.memberId)}
            onChange={() => toggleMemberSelection(assignment.memberId)}
            aria-label={memberName}
          />
        </span>
        <span role="cell" className="ac-members-directory-name ac-members-body-cell" title={memberName}>
          <span className="ac-members-directory-name-text">{memberName}</span>
          {isDepartmentManager ? (
            <span
              className="ac-department-manager-badge"
              title={acT(locale, 'departmentManagerBadge')}
              aria-label={acT(locale, 'departmentManagerBadge')}
            >
              <DepartmentManagerIcon />
            </span>
          ) : null}
        </span>
        <span role="cell" className="ac-members-body-cell">
          {accountTypeLabel(locale, accountType)}
        </span>
        <span role="cell" className="ac-members-body-cell">
          <span className={`ac-member-status ac-member-status--${status}`}>
            {memberStatusLabel(locale, status)}
          </span>
        </span>
        <span role="cell" className="ac-members-body-cell" title={mockMemberPosition(org, locale)}>
          {mockMemberPosition(org, locale)}
        </span>
        <span role="cell" className="ac-members-body-cell">
          {mockEmployeeId(assignment.memberId, org)}
        </span>
        <span role="cell" className="ac-members-email ac-members-body-cell" title={org.email}>
          {org.email}
        </span>
        <span
          role="cell"
          className="ac-members-directory-user-id ac-members-body-cell"
          title={mockEmployeeUserId(assignment.memberId, org)}
        >
          {mockEmployeeUserId(assignment.memberId, org)}
        </span>
        {showDirectoryActionsColumn ? (
          <span role="cell" className="ac-members-row-actions ac-members-directory-actions-col">
            {renderDirectoryRowActions(assignment, status)}
          </span>
        ) : null}
      </li>
    )
  }

  const renderRoleCell = (assignment: MemberAssignment, showRoleSpacer?: boolean) => {
    if (showRoleSpacer) {
      return <span role="cell" className="ac-members-role-spacer" aria-hidden="true" />
    }
    const useExtendedRoleSelect = spaceCustomRoles.length > 0 && onRoleSelectChange != null
    if (!readOnly && (onRoleChange || useExtendedRoleSelect)) {
      const value = useExtendedRoleSelect
        ? memberRoleSelectValue(assignment, spaceCustomRoles)
        : rolePresetSelectValue(assignment)
      return (
        <span
          role="cell"
          className={`ac-members-role-cell${manageLocked ? ' is-locked' : ''}`}
          onClick={manageLocked ? () => onManageLockedClick?.() : undefined}
        >
          <select
            className={`ac-members-role-select${manageLocked ? ' is-disabled' : ''}`}
            value={value}
            aria-label={acT(locale, 'memberRole')}
            aria-disabled={manageLocked || undefined}
            tabIndex={manageLocked ? -1 : undefined}
            onChange={(event) => {
              runUnlessLocked(() => {
                const nextValue = event.target.value
                if (useExtendedRoleSelect) {
                  onRoleSelectChange!(assignment, nextValue)
                  return
                }
                onRoleChange!(assignment, nextValue as Exclude<RolePreset, 'custom'>)
              })
            }}
          >
            {ROLE_PRESET_OPTIONS.map((preset) => (
              <option key={preset} value={preset}>
                {rolePresetLabel(locale, preset)}
              </option>
            ))}
            {spaceCustomRoles.length > 0 ? (
              <optgroup label={acT(locale, 'spaceRolesCustomSection')}>
                {spaceCustomRoles.map((role) => (
                  <option key={role.id} value={`custom:${role.id}`}>
                    {locale === 'zh' ? role.labelZh : role.labelEn}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </span>
      )
    }
    return (
      <span role="cell">
        {spaceCustomRoles.length > 0
          ? resolveMemberRoleDisplayLabel(locale, assignment, spaceCustomRoles)
          : resolveMemberWorkspaceRoleLabel(
              locale,
              assignment.memberId,
              assignment.rolePreset,
              workspaceRoles,
              roleOverridesById,
            )}
      </span>
    )
  }

  const renderMemberRow = (
    assignment: MemberAssignment,
    key: string,
    options?: { showRoleSpacer?: boolean },
  ) => {
    const org = memberMap.get(assignment.memberId)
    if (!org) return null
    const memberName = localizeMember(org)
    return (
      <li key={key} className="ac-members-row" role="row">
        <span role="cell" className="ac-members-name ac-members-body-cell">
          {memberName}
        </span>
        {renderRoleCell(assignment, options?.showRoleSpacer)}
        <span role="cell" className="ac-members-row-actions ac-members-body-cell">
          {!readOnly && onEdit ? (
            <button
              type="button"
              className={`ac-row-icon-btn${manageLocked ? ' is-disabled' : ''}`}
              aria-label={acT(locale, 'editMember')}
              aria-disabled={manageLocked || undefined}
              onClick={() => runUnlessLocked(() => onEdit(assignment))}
            >
              <EditIcon />
            </button>
          ) : null}
          {!readOnly && onRemove ? (
            <button
              type="button"
              className={`ac-row-icon-btn ac-row-icon-btn--danger${manageLocked ? ' is-disabled' : ''}`}
              aria-label={acT(locale, 'removeMember')}
              aria-disabled={manageLocked || undefined}
              onClick={() => runUnlessLocked(() => onRemove(assignment.memberId))}
            >
              <DeleteIcon />
            </button>
          ) : null}
        </span>
      </li>
    )
  }

  const renderDirectoryTableHead = () => (
    <>
      <span role="columnheader" className="ac-members-select-col ac-departments-select-col">
        <label className="ac-members-select-all ac-departments-select-all" htmlFor={selectAllId}>
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
      <span role="columnheader">{acT(locale, 'memberDirectoryName')}</span>
      <span role="columnheader" className="ac-members-head-filterable">
        <span className="ac-members-head-label">{acT(locale, 'memberAccountType')}</span>
        <div className="ac-members-col-filter-wrap">
          <button
            type="button"
            className={`ac-members-col-filter-btn${openColumnFilter === 'accountType' ? ' is-open' : ''}${accountTypeFilters.size < ALL_ACCOUNT_TYPES.length ? ' is-active' : ''}`}
            aria-label={acT(locale, 'memberColumnFilter')}
            aria-expanded={openColumnFilter === 'accountType'}
            onClick={() =>
              setOpenColumnFilter((prev) => (prev === 'accountType' ? null : 'accountType'))
            }
          >
            <ColumnFilterIcon />
          </button>
          {openColumnFilter === 'accountType' ? (
            <div className="ac-members-col-filter-menu" role="menu">
              {ALL_ACCOUNT_TYPES.map((accountType) => (
                <label key={accountType} className="ac-members-col-filter-option" role="menuitemcheckbox">
                  <input
                    type="checkbox"
                    checked={accountTypeFilters.has(accountType)}
                    onChange={() => toggleAccountTypeFilter(accountType)}
                  />
                  <span>{accountTypeLabel(locale, accountType)}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </span>
      <span role="columnheader" className="ac-members-head-filterable">
        <span className="ac-members-head-label">{acT(locale, 'memberAccountStatus')}</span>
        <div className="ac-members-col-filter-wrap">
          <button
            type="button"
            className={`ac-members-col-filter-btn${openColumnFilter === 'accountStatus' ? ' is-open' : ''}${statusFilters.size < ALL_MEMBER_STATUSES.length ? ' is-active' : ''}`}
            aria-label={acT(locale, 'memberColumnFilter')}
            aria-expanded={openColumnFilter === 'accountStatus'}
            onClick={() =>
              setOpenColumnFilter((prev) => (prev === 'accountStatus' ? null : 'accountStatus'))
            }
          >
            <ColumnFilterIcon />
          </button>
          {openColumnFilter === 'accountStatus' ? (
            <div className="ac-members-col-filter-menu" role="menu">
              {ALL_MEMBER_STATUSES.map((status) => (
                <label key={status} className="ac-members-col-filter-option" role="menuitemcheckbox">
                  <input
                    type="checkbox"
                    checked={statusFilters.has(status)}
                    onChange={() => toggleStatusFilter(status)}
                  />
                  <span>{memberStatusLabel(locale, status)}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </span>
      <span role="columnheader">{acT(locale, 'memberPosition')}</span>
      <span role="columnheader">{acT(locale, 'memberEmployeeId')}</span>
      <span role="columnheader">{acT(locale, 'memberEmail')}</span>
      <span role="columnheader">{acT(locale, 'memberEmployeeUserId')}</span>
      {showDirectoryActionsColumn ? (
        <span role="columnheader" className="ac-members-table-actions-col ac-members-directory-actions-col">
          {acT(locale, 'roleColumnActions')}
        </span>
      ) : null}
    </>
  )

  if (isEmpty && !useTreeTable) {
    return (
      <div className="ac-members-panel">
        {showToolbar ? (
          <div className="ac-members-toolbar">
            <button type="button" className="agents-btn agents-btn-primary" onClick={onAdd}>
              + {acT(locale, 'addMember')}
            </button>
          </div>
        ) : null}
        <div className="skills-empty">{acT(locale, emptyMessageKey)}</div>
      </div>
    )
  }

  return (
    <div className={panelClassName}>
      {showToolbar ? (
        <div className="ac-members-toolbar">
          <button type="button" className="agents-btn agents-btn-primary" onClick={onAdd}>
            + {acT(locale, 'addMember')}
          </button>
        </div>
      ) : null}
      <div className={tableClassName} role="table">
        <div className="ac-members-table-head" role="row">
          {useTreeTable ? (
            renderDirectoryTableHead()
          ) : (
            <>
              <span role="columnheader">{acT(locale, 'memberName')}</span>
              <span role="columnheader" className="ac-members-role-col">
                {acT(locale, 'memberColumnRole')}
              </span>
              <span role="columnheader" className="ac-members-table-actions-col">
                {acT(locale, 'roleColumnActions')}
              </span>
            </>
          )}
        </div>
        <ul
          className={`ac-members-table-body${!useTreeTable && groupByRole ? ' ac-members-table-body--grouped' : ''}${useTreeTable && visibleDirectoryMembers.length === 0 ? ' ac-members-table-body--empty' : ''}`}
          role="rowgroup"
        >
          {useTreeTable
            ? visibleDirectoryMembers.length > 0
              ? visibleDirectoryMembers.map((assignment) =>
                  renderDirectoryMemberRow(assignment, assignment.memberId),
                )
              : (
                <li className="ac-members-table-empty" role="presentation">
                  <div className="skills-empty">{acT(locale, emptyMessageKey)}</div>
                </li>
              )
            : groupByRole
            ? filteredRoleGroups.map((group) => {
                const roleLabel = resolveRoleLabel(group.role, roleOverridesById?.[group.role.id])
                const expanded = expandedRoleIds.has(group.role.id)
                return (
                  <li
                    key={group.role.id}
                    className={`ac-members-role-group${expanded ? ' is-expanded' : ''}`}
                  >
                    <div className="ac-members-role-group-header" role="row">
                      <button
                        type="button"
                        className="ac-members-role-toggle"
                        aria-expanded={expanded}
                        aria-label={
                          expanded
                            ? acT(locale, 'memberRoleGroupCollapse')
                            : acT(locale, 'memberRoleGroupExpand')
                        }
                        onClick={() => toggleRoleGroup(group.role.id)}
                      >
                        <RoleGroupChevron expanded={expanded} />
                        <span className="ac-members-role-toggle-label">{roleLabel}</span>
                        <span className="ac-members-role-toggle-count">
                          {memberCountLabel(locale, group.entries.length)}
                        </span>
                      </button>
                    </div>
                    {expanded ? (
                      <ul className="ac-members-role-group-body" role="rowgroup">
                        {group.entries.flatMap((entry) => {
                          const row = renderMemberRow(
                            entry.assignment,
                            `${group.role.id}-${entry.memberId}`,
                            { showRoleSpacer: true },
                          )
                          return row ? [row] : []
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })
            : members.map((assignment) => renderMemberRow(assignment, assignment.memberId))}
        </ul>
      </div>
    </div>
  )
}

type AddMemberModalProps = {
  locale: AppLocale
  open: boolean
  candidates: OrgMember[]
  onClose: () => void
  onConfirm: (memberIds: string[], preset: Exclude<RolePreset, 'custom'>) => void
}

export function AddMemberModal({ locale, open, candidates, onClose, onConfirm }: AddMemberModalProps) {
  const handleSave = (memberIds: string[]) => {
    if (memberIds.length === 0) return
    onConfirm(memberIds, 'observer')
  }

  return (
    <BatchSelectUsersModal
      locale={locale}
      open={open}
      candidates={candidates}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}

type EditMemberPermissionsModalProps = {
  locale: AppLocale
  open: boolean
  assignment: MemberAssignment | null
  memberName: string
  permissionCeiling?: Permission[]
  onClose: () => void
  onSave: (preset: RolePreset, permissions: Permission[]) => void
}

export function EditMemberPermissionsModal({
  locale,
  open,
  assignment,
  memberName,
  permissionCeiling,
  onClose,
  onSave,
}: EditMemberPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [preset, setPreset] = useState<Exclude<RolePreset, 'custom'>>('observer')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (!open || !assignment) return
    setPermissions([...assignment.permissions])
    const normalized = normalizeRolePreset(assignment.rolePreset)
    if (normalized !== 'custom') {
      setPreset(normalized)
    } else {
      const detected = normalizeRolePreset(detectRolePreset(assignment.permissions))
      setPreset(detected === 'custom' ? 'observer' : detected)
    }
    setShowAdvanced(false)
  }, [open, assignment])

  const availablePermissions = useMemo(() => {
    if (!permissionCeiling) return [...PERMISSIONS]
    return PERMISSIONS.filter((p) => permissionCeiling.includes(p))
  }, [permissionCeiling])

  if (!open || !assignment) return null

  const permissionsAdvancedDisabled = preset === 'no_access'

  const applyPreset = (next: Exclude<RolePreset, 'custom'>) => {
    setPreset(next)
    if (next === 'no_access') setShowAdvanced(false)
    let perms = permissionsForPreset(next)
    if (permissionCeiling) perms = clampToSpacePermissions(permissionCeiling, perms)
    setPermissions(perms)
  }

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
  }

  const handleSave = () => {
    onSave(detectRolePreset(permissions), permissions)
    onClose()
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div className="ac-modal ac-modal--permissions" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="ac-modal-title">
          {acT(locale, 'editMember')} — {memberName}
        </h2>
        <div className="ac-modal-form ac-modal-form--permissions">
          <div className="ac-permissions-role-block">
            <label className="ac-field">
              <span>{acT(locale, 'memberRole')}</span>
              <select value={preset} onChange={(e) => applyPreset(e.target.value as Exclude<RolePreset, 'custom'>)}>
                {ROLE_PRESET_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {rolePresetLabel(locale, p)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="ac-advanced-toggle"
              disabled={permissionsAdvancedDisabled}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {acT(locale, 'memberPermissionsAdvanced')}
            </button>
          </div>
          {showAdvanced ? (
            <div
              className={`ac-permission-checklist${permissionsAdvancedDisabled ? ' is-disabled' : ''}`}
              aria-disabled={permissionsAdvancedDisabled}
            >
              {availablePermissions.map((perm) => (
                <label key={perm} className="ac-permission-check-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm)}
                    disabled={permissionsAdvancedDisabled}
                    onChange={() => togglePermission(perm)}
                  />
                  <span>{permissionLabel(locale, perm)}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={handleSave}>
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
