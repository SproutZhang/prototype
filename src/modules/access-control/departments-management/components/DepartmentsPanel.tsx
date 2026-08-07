import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { AddIcon, DeleteIcon, EditIcon, GroupIcon } from '../../components/RowActionIcons'
import {
  localizeDepartmentDescription,
  localizeDepartmentName,
  isDepartmentManagementRootRow,
  type OrgDepartmentRow,
} from '../data/departmentsSeed'
import { DEPARTMENT_PAGE_SIZE_OPTIONS, DepartmentsPagination } from './DepartmentsPagination'

type DepartmentsPanelProps = {
  locale: AppLocale
  departments: OrgDepartmentRow[]
  memberCountById: Map<string, number>
  searchQuery?: string
  selectionClearSignal?: number
  resolveParentLabel: (parentId: string | null) => string | null
  onEdit?: (department: OrgDepartmentRow) => void
  onAddChild?: (department: OrgDepartmentRow) => void
  onBulkEdit?: (departmentIds: string[]) => void
  onSelectionChange?: (departmentIds: string[]) => void
  onRemove?: (department: OrgDepartmentRow) => void
  onBulkRemove?: (departmentIds: string[]) => void
  onAddMembers?: (department: OrgDepartmentRow) => void
  /** 为 false 时不渲染表头/行 checkbox，且不维护选中状态 */
  enableMultiSelect?: boolean
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

export function DepartmentsPanel({
  locale,
  departments,
  memberCountById,
  searchQuery = '',
  selectionClearSignal = 0,
  resolveParentLabel,
  onEdit,
  onAddChild,
  onBulkEdit,
  onSelectionChange,
  onRemove,
  onBulkRemove,
  onAddMembers,
  enableMultiSelect = true,
}: DepartmentsPanelProps) {
  const selectAllId = useId()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEPARTMENT_PAGE_SIZE_OPTIONS[0])

  const listableDepartments = useMemo(
    () =>
      departments.filter(
        (department) =>
          isDepartmentManagementRootRow(department.id) ||
          (department.parentId === null && !isDepartmentManagementRootRow(department.id)),
      ),
    [departments],
  )

  const childDepartmentsByParentId = useMemo(() => {
    const map = new Map<string, OrgDepartmentRow[]>()
    for (const department of departments) {
      if (!department.parentId) continue
      const children = map.get(department.parentId) ?? []
      children.push(department)
      map.set(department.parentId, children)
    }
    for (const children of map.values()) {
      children.sort((a, b) =>
        localizeDepartmentName(a, locale).localeCompare(localizeDepartmentName(b, locale), locale),
      )
    }
    return map
  }, [departments, locale])

  const getChildDepartments = useCallback(
    (departmentId: string) => childDepartmentsByParentId.get(departmentId) ?? [],
    [childDepartmentsByParentId],
  )

  const departmentMatchesQuery = useCallback(
    (department: OrgDepartmentRow, query: string) => {
      const parentLabel = resolveParentLabel(department.parentId) ?? ''
      const haystack = [
        localizeDepartmentName(department, locale),
        localizeDepartmentDescription(department, locale),
        parentLabel,
        String(memberCountById.get(department.id) ?? 0),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    },
    [locale, memberCountById, resolveParentLabel],
  )

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return listableDepartments
    return listableDepartments.filter((department) => {
      if (departmentMatchesQuery(department, query)) return true
      return getChildDepartments(department.id).some((child) => departmentMatchesQuery(child, query))
    })
  }, [departmentMatchesQuery, getChildDepartments, listableDepartments, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedDepartments = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize
    return filteredDepartments.slice(startIndex, startIndex + pageSize)
  }, [filteredDepartments, pageSize, safePage])

  const filteredIds = useMemo(
    () => filteredDepartments.map((department) => department.id),
    [filteredDepartments],
  )

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [selectionClearSignal])

  useEffect(() => {
    if (!enableMultiSelect) return
    onSelectionChange?.([...selectedIds])
  }, [enableMultiSelect, onSelectionChange, selectedIds])

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const department of filteredDepartments) {
        const childMatched = getChildDepartments(department.id).some((child) =>
          departmentMatchesQuery(child, query),
        )
        if (childMatched) next.add(department.id)
      }
      return next
    })
  }, [departmentMatchesQuery, filteredDepartments, getChildDepartments, searchQuery])

  const selectedCount = selectedIds.size

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const toggleDepartmentSelection = useCallback((departmentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(departmentId)) next.delete(departmentId)
      else next.add(departmentId)
      return next
    })
  }, [])

  const toggleAllFilteredSelection = useCallback(() => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        for (const id of filteredIds) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of filteredIds) next.add(id)
      return next
    })
  }, [allFilteredSelected, filteredIds])

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }, [])

  const handleBulkEdit = useCallback(() => {
    if (selectedIds.size === 0) return
    onBulkEdit?.([...selectedIds])
  }, [onBulkEdit, selectedIds])

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    onBulkRemove?.([...selectedIds])
  }, [onBulkRemove, selectedIds])

  const renderDepartmentRow = (department: OrgDepartmentRow, depth: number) => {
    const memberCount = memberCountById.get(department.id) ?? 0
    const parentLabel = resolveParentLabel(department.parentId)
    const departmentName = localizeDepartmentName(department, locale)
    const children = getChildDepartments(department.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(department.id)
    const query = searchQuery.trim().toLowerCase()
    const visibleChildren =
      query.length === 0
        ? children
        : children.filter((child) => departmentMatchesQuery(child, query))

    return (
      <>
        <div
          key={department.id}
          className={`ac-members-row ac-departments-tree-row${hasChildren ? ' has-children' : ''}`}
          role="row"
        >
          {enableMultiSelect ? (
            <span role="cell" className="ac-departments-select">
              <input
                type="checkbox"
                checked={selectedIds.has(department.id)}
                onChange={() => toggleDepartmentSelection(department.id)}
                aria-label={departmentName}
              />
            </span>
          ) : null}
          <span role="cell" className="ac-departments-name ac-departments-name--tree">
            <span
              className="ac-departments-tree-name-wrap"
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="ac-departments-tree-toggle"
                  aria-expanded={isExpanded}
                  aria-label={departmentName}
                  onClick={() => toggleExpanded(department.id)}
                >
                  <TreeExpandIcon expanded={isExpanded} />
                </button>
              ) : (
                <span className="ac-departments-tree-toggle ac-departments-tree-toggle--leaf" />
              )}
              <span className="ac-departments-tree-name" title={departmentName}>
                {departmentName}
              </span>
            </span>
          </span>
          <span
            role="cell"
            className="ac-departments-desc"
            title={localizeDepartmentDescription(department, locale)}
          >
            {localizeDepartmentDescription(department, locale)}
          </span>
          <span role="cell" className="ac-departments-parent" title={parentLabel ?? undefined}>
            {parentLabel ?? acT(locale, 'departmentNoParent')}
          </span>
          <span role="cell" className="ac-departments-members">
            {acT(locale, 'workspaceMemberCount').replace('{count}', String(memberCount))}
          </span>
          <span role="cell" className="ac-members-row-actions">
            {onAddChild ? (
              <button
                type="button"
                className="ac-row-icon-btn"
                aria-label={acT(locale, 'departmentAddChild')}
                onClick={() => onAddChild(department)}
              >
                <AddIcon />
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                className="ac-row-icon-btn"
                aria-label={acT(locale, 'editDepartment')}
                onClick={() => onEdit(department)}
              >
                <EditIcon />
              </button>
            ) : null}
            {onAddMembers ? (
              <button
                type="button"
                className="ac-row-icon-btn"
                aria-label={acT(locale, 'addMember')}
                title={acT(locale, 'addMember')}
                onClick={() => onAddMembers(department)}
              >
                <GroupIcon />
              </button>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                className="ac-row-icon-btn ac-row-icon-btn--danger"
                aria-label={acT(locale, 'removeDepartment')}
                onClick={() => onRemove(department)}
              >
                <DeleteIcon />
              </button>
            ) : null}
          </span>
        </div>
        {hasChildren && isExpanded
          ? visibleChildren.map((child) => renderDepartmentRow(child, depth + 1))
          : null}
      </>
    )
  }

  if (filteredDepartments.length === 0) {
    return (
      <div className="ac-members-panel">
        <div className="skills-empty">{acT(locale, 'noDepartments')}</div>
      </div>
    )
  }

  return (
    <div className="ac-members-panel ac-members-panel--with-pagination">
      <div
        className={`ac-members-table ac-members-table--departments ac-members-table--departments-tree${enableMultiSelect ? '' : ' ac-members-table--departments-no-select'}`}
        role="table"
      >
        <div className="ac-members-table-head" role="row">
          {enableMultiSelect ? (
            <span role="columnheader" className="ac-departments-select-col">
              <label className="ac-departments-select-all" htmlFor={selectAllId}>
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
          ) : null}
          <span role="columnheader" className="ac-departments-name-col">
            {acT(locale, 'departmentColumnName')}
          </span>
          <span role="columnheader" className="ac-departments-desc-col">
            {acT(locale, 'departmentColumnDescription')}
          </span>
          <span role="columnheader" className="ac-departments-parent-col">
            {acT(locale, 'departmentColumnParent')}
          </span>
          <span role="columnheader" className="ac-departments-members-col">
            {acT(locale, 'departmentColumnMembers')}
          </span>
          <span role="columnheader" className="ac-members-table-actions-col">
            {acT(locale, 'roleColumnActions')}
          </span>
        </div>

        {paginatedDepartments.map((department) => renderDepartmentRow(department, 0))}
      </div>

      <DepartmentsPagination
        locale={locale}
        totalCount={filteredDepartments.length}
        currentPage={safePage}
        pageSize={pageSize}
        selectedCount={selectedCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  )
}
