import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../../departments-management/data/departmentsSeed'
import {
  getOrgDepartmentChildren,
  isOrgDepartmentVisibleInFilter,
} from '../utils/orgDepartmentTree'

type OrgDepartmentsSidebarProps = {
  locale: AppLocale
  departments: OrgDepartmentRow[]
  rootDepartments: OrgDepartmentRow[]
  selectedDepartmentId: string | null
  selectedDepartment?: OrgDepartmentRow | null
  orgRootLabel: string
  totalMemberCount: number
  isOrgRootSelected: boolean
  onSelectOrgRoot: () => void
  memberCountByDepartmentId: Map<string, number>
  memberIdsByDepartmentId: Map<string, string[]>
  searchQuery: string
  orgMembers: { id: string; email: string }[]
  localizeMember: (m: { id: string }) => string
  localizeMemberDept: (m: { id: string }) => string
  onSelectDepartment: (departmentId: string) => void
  onEditDepartment?: (department: OrgDepartmentRow) => void
  onAddDepartment?: () => void
  onThirdPartyImport?: () => void
  onBatchCreateDepartments?: () => void
  onAddChildDepartment?: (department: OrgDepartmentRow) => void
  onRemoveDepartment?: (department: OrgDepartmentRow) => void
  onManageDepartments?: () => void
  expandDepartmentIds?: string[]
  onExpandDepartmentIdsApplied?: () => void
}

function TreeExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      {expanded ? (
        <path
          d="M4 6l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 4l4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function MoreActionsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="4" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="12" r="1.25" fill="currentColor" />
    </svg>
  )
}

function OrgCompanyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M3 6.5 8 3.5l5 3v7.5H3V6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 14V9.5h3V14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OrgSidebarAddDepartmentAction({
  locale,
  onAddDepartment,
  onThirdPartyImport,
  onBatchCreateDepartments,
}: {
  locale: AppLocale
  onAddDepartment: () => void
  onThirdPartyImport?: () => void
  onBatchCreateDepartments?: () => void
}) {
  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const showDropdown = onThirdPartyImport != null || onBatchCreateDepartments != null

  useEffect(() => {
    if (!menuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  if (!showDropdown) {
    return (
      <button type="button" className="ac-members-org-sidebar-action" onClick={onAddDepartment}>
        <span>{acT(locale, 'departmentAddTitle')}</span>
      </button>
    )
  }

  const pickThirdPartyImport = () => {
    setMenuOpen(false)
    onThirdPartyImport?.()
  }

  const pickBatchCreateDepartments = () => {
    setMenuOpen(false)
    onBatchCreateDepartments?.()
  }

  return (
    <div className="ac-members-org-sidebar-action-group" ref={groupRef}>
      <button
        type="button"
        className="ac-members-org-sidebar-action ac-members-org-sidebar-action--main"
        onClick={onAddDepartment}
      >
        <span>{acT(locale, 'departmentAddTitle')}</span>
      </button>
      <button
        type="button"
        className="ac-members-org-sidebar-action ac-members-org-sidebar-action--toggle"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={acT(locale, 'departmentCreateMoreActions')}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <ChevronDownIcon />
      </button>
      {menuOpen ? (
        <div id={menuId} className="ac-members-org-sidebar-action-menu" role="menu">
          {onThirdPartyImport ? (
            <button
              type="button"
              className="ac-members-org-sidebar-action-menu-item"
              role="menuitem"
              onMouseDown={(event) => event.preventDefault()}
              onClick={pickThirdPartyImport}
            >
              {acT(locale, 'departmentThirdPartyImport')}
            </button>
          ) : null}
          {onBatchCreateDepartments ? (
            <button
              type="button"
              className="ac-members-org-sidebar-action-menu-item"
              role="menuitem"
              onMouseDown={(event) => event.preventDefault()}
              onClick={pickBatchCreateDepartments}
            >
              {acT(locale, 'batchCreateDepartmentsShort')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function OrgSidebarActions({
  locale,
  onAddDepartment,
  onThirdPartyImport,
  onBatchCreateDepartments,
  onAddChildDepartment,
  onManageDepartments,
  onAddChildClick,
}: {
  locale: AppLocale
  onAddDepartment?: () => void
  onThirdPartyImport?: () => void
  onBatchCreateDepartments?: () => void
  onAddChildDepartment?: (department: OrgDepartmentRow) => void
  onManageDepartments?: () => void
  onAddChildClick: () => void
}) {
  if (!onAddDepartment && !onAddChildDepartment && !onManageDepartments) return null

  return (
    <div className="ac-members-org-sidebar-actions">
      {onAddDepartment ? (
        <OrgSidebarAddDepartmentAction
          locale={locale}
          onAddDepartment={onAddDepartment}
          onThirdPartyImport={onThirdPartyImport}
          onBatchCreateDepartments={onBatchCreateDepartments}
        />
      ) : null}
      {onAddDepartment && onAddChildDepartment ? (
        <span className="ac-members-org-sidebar-actions-divider" aria-hidden="true" />
      ) : null}
      {onAddChildDepartment ? (
        <button type="button" className="ac-members-org-sidebar-action" onClick={onAddChildClick}>
          <span>{acT(locale, 'departmentAddChildTitle')}</span>
        </button>
      ) : null}
      {(onAddDepartment || onAddChildDepartment) && onManageDepartments ? (
        <span className="ac-members-org-sidebar-actions-divider" aria-hidden="true" />
      ) : null}
      {onManageDepartments ? (
        <button type="button" className="ac-members-org-sidebar-action" onClick={onManageDepartments}>
          <span>{acT(locale, 'departmentManagement')}</span>
        </button>
      ) : null}
    </div>
  )
}

function OrgCompanySummaryRow({
  locale,
  orgRootLabel,
  totalMemberCount,
  selected,
  onSelect,
}: {
  locale: AppLocale
  orgRootLabel: string
  totalMemberCount: number
  selected: boolean
  onSelect: () => void
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect()
  }

  return (
    <div
      className={`ac-members-org-tree-row ac-members-org-tree-row--company${selected ? ' is-selected' : ''}`}
      role="row"
    >
      <div className="ac-members-org-tree-name-wrap ac-members-org-tree-name-wrap--company">
        <span className="ac-members-org-company-icon" aria-hidden="true">
          <OrgCompanyIcon />
        </span>
        <button
          type="button"
          className="ac-members-org-tree-name-btn ac-members-org-tree-name-btn--company"
          aria-current={selected ? 'true' : undefined}
          title={orgRootLabel}
          onClick={onSelect}
          onKeyDown={handleKeyDown}
        >
          <span className="ac-members-org-tree-name">{orgRootLabel}</span>
          <span className="ac-members-org-tree-count">
            {acT(locale, 'workspaceMemberCount').replace('{count}', String(totalMemberCount))}
          </span>
        </button>
      </div>
    </div>
  )
}

export function OrgDepartmentsSidebar({
  locale,
  departments,
  rootDepartments,
  selectedDepartmentId,
  selectedDepartment = null,
  orgRootLabel,
  totalMemberCount,
  isOrgRootSelected,
  onSelectOrgRoot,
  memberCountByDepartmentId,
  memberIdsByDepartmentId,
  searchQuery,
  orgMembers,
  localizeMember,
  localizeMemberDept,
  onSelectDepartment,
  onEditDepartment,
  onAddDepartment,
  onThirdPartyImport,
  onBatchCreateDepartments,
  onAddChildDepartment,
  onRemoveDepartment,
  onManageDepartments,
  expandDepartmentIds = [],
  onExpandDepartmentIdsApplied,
}: OrgDepartmentsSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const query = searchQuery.trim().toLowerCase()
  const showDepartmentActions =
    onEditDepartment != null || onAddChildDepartment != null || onRemoveDepartment != null

  const getVisibleChildren = useCallback(
    (parentId: string) => {
      const children = getOrgDepartmentChildren(departments, parentId, locale)
      if (!query) return children
      return children.filter((child) =>
        isOrgDepartmentVisibleInFilter(
          child,
          query,
          locale,
          memberIdsByDepartmentId,
          orgMembers,
          localizeMember,
          localizeMemberDept,
        ),
      )
    },
    [
      departments,
      locale,
      localizeMember,
      localizeMemberDept,
      memberIdsByDepartmentId,
      orgMembers,
      query,
    ],
  )

  useEffect(() => {
    if (!query) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const root of rootDepartments) {
        if (getVisibleChildren(root.id).length > 0) next.add(root.id)
      }
      return next
    })
  }, [getVisibleChildren, query, rootDepartments])

  useEffect(() => {
    if (expandDepartmentIds.length === 0) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const departmentId of expandDepartmentIds) {
        next.add(departmentId)
      }
      return next
    })
    onExpandDepartmentIdsApplied?.()
  }, [expandDepartmentIds, onExpandDepartmentIdsApplied])

  useEffect(() => {
    if (!openMenuId) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.ac-members-org-tree-row-actions')) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openMenuId])

  const toggleExpanded = useCallback((departmentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(departmentId)) next.delete(departmentId)
      else next.add(departmentId)
      return next
    })
  }, [])

  const toggleRowMenu = useCallback((departmentId: string) => {
    setOpenMenuId((prev) => (prev === departmentId ? null : departmentId))
  }, [])

  const addChildTargetDepartment = useMemo(
    () => selectedDepartment ?? rootDepartments[0] ?? null,
    [rootDepartments, selectedDepartment],
  )

  const handleSidebarAddChild = useCallback(() => {
    if (!onAddChildDepartment || !addChildTargetDepartment) return
    onAddChildDepartment(addChildTargetDepartment)
  }, [addChildTargetDepartment, onAddChildDepartment])

  const renderDepartmentRow = (department: OrgDepartmentRow, depth: number) => {
    const label = localizeDepartmentName(department, locale)
    const count = memberCountByDepartmentId.get(department.id) ?? 0
    const selected = department.id === selectedDepartmentId
    const children = getVisibleChildren(department.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(department.id)
    const menuOpen = openMenuId === department.id

    return (
      <Fragment key={department.id}>
        <div
          className={`ac-members-org-tree-row${hasChildren ? ' has-children' : ''}${selected ? ' is-selected' : ''}`}
          role="row"
        >
          <div
            className="ac-members-org-tree-name-wrap"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="ac-members-org-tree-toggle"
                aria-expanded={isExpanded}
                aria-label={label}
                onClick={() => toggleExpanded(department.id)}
              >
                <TreeExpandIcon expanded={isExpanded} />
              </button>
            ) : (
              <span className="ac-members-org-tree-toggle ac-members-org-tree-toggle--leaf" />
            )}
            <button
              type="button"
              className="ac-members-org-tree-name-btn"
              aria-current={selected ? 'true' : undefined}
              title={label}
              onClick={() => onSelectDepartment(department.id)}
            >
              <span className="ac-members-org-tree-name">{label}</span>
              <span className="ac-members-org-tree-count">
                {acT(locale, 'workspaceMemberCount').replace('{count}', String(count))}
              </span>
            </button>
          </div>
          {showDepartmentActions ? (
            <div
              className={`ac-members-org-tree-row-actions${menuOpen ? ' is-open' : ''}`}
              onMouseEnter={() => setOpenMenuId(department.id)}
              onMouseLeave={() => setOpenMenuId((prev) => (prev === department.id ? null : prev))}
            >
              <button
                type="button"
                className="ac-members-org-tree-more-btn"
                aria-label={acT(locale, 'roleColumnActions')}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={(event) => {
                  event.stopPropagation()
                  toggleRowMenu(department.id)
                }}
              >
                <MoreActionsIcon />
              </button>
              {menuOpen ? (
                <div className="ac-members-org-tree-menu" role="menu">
                  {onEditDepartment ? (
                    <button
                      type="button"
                      className="ac-members-org-tree-menu-item"
                      role="menuitem"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEditDepartment(department)
                        setOpenMenuId(null)
                      }}
                    >
                      {acT(locale, 'departmentEditInfo')}
                    </button>
                  ) : null}
                  {onAddChildDepartment ? (
                    <button
                      type="button"
                      className="ac-members-org-tree-menu-item"
                      role="menuitem"
                      onClick={(event) => {
                        event.stopPropagation()
                        onAddChildDepartment(department)
                        setOpenMenuId(null)
                      }}
                    >
                      {acT(locale, 'departmentAddChildTitle')}
                    </button>
                  ) : null}
                  {onRemoveDepartment ? (
                    <button
                      type="button"
                      className="ac-members-org-tree-menu-item ac-members-org-tree-menu-item--danger"
                      role="menuitem"
                      onClick={(event) => {
                        event.stopPropagation()
                        onRemoveDepartment(department)
                        setOpenMenuId(null)
                      }}
                    >
                      {acT(locale, 'removeDepartment')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {hasChildren && isExpanded
          ? children.map((child) => renderDepartmentRow(child, depth + 1))
          : null}
      </Fragment>
    )
  }

  if (rootDepartments.length === 0) {
    return (
      <aside className="ac-members-org-sidebar">
        <OrgSidebarActions
          locale={locale}
          onAddDepartment={onAddDepartment}
          onThirdPartyImport={onThirdPartyImport}
          onBatchCreateDepartments={onBatchCreateDepartments}
          onAddChildDepartment={onAddChildDepartment}
          onManageDepartments={onManageDepartments}
          onAddChildClick={handleSidebarAddChild}
        />
        <div className="ac-members-org-tree-head">{acT(locale, 'membersOrgStructureTitle')}</div>
        <OrgCompanySummaryRow
          locale={locale}
          orgRootLabel={orgRootLabel}
          totalMemberCount={totalMemberCount}
          selected={isOrgRootSelected}
          onSelect={onSelectOrgRoot}
        />
        <div className="ac-members-org-sidebar-empty">{acT(locale, 'noDepartments')}</div>
      </aside>
    )
  }

  return (
    <aside className="ac-members-org-sidebar">
      <OrgSidebarActions
        locale={locale}
        onAddDepartment={onAddDepartment}
        onThirdPartyImport={onThirdPartyImport}
        onBatchCreateDepartments={onBatchCreateDepartments}
        onAddChildDepartment={onAddChildDepartment}
        onManageDepartments={onManageDepartments}
        onAddChildClick={handleSidebarAddChild}
      />
      <div className="ac-members-org-tree-head">{acT(locale, 'membersOrgStructureTitle')}</div>
      <div className="ac-members-org-tree-body">
        <OrgCompanySummaryRow
          locale={locale}
          orgRootLabel={orgRootLabel}
          totalMemberCount={totalMemberCount}
          selected={isOrgRootSelected}
          onSelect={onSelectOrgRoot}
        />
        {rootDepartments.map((department) => renderDepartmentRow(department, 0))}
      </div>
    </aside>
  )
}
