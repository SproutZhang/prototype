import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  localizeOrgRootLabel,
  ORG_ROOT_PARENT_ID,
  type OrgDepartmentRow,
} from '../data/departmentsSeed'

type SelectParentDepartmentModalProps = {
  locale: AppLocale
  open: boolean
  departments: OrgDepartmentRow[]
  excludeIds: string[]
  value: string
  titleKey?: string
  confirmKey?: string
  hintMessage?: string | null
  onClose: () => void
  onConfirm: (parentId: string) => void
}

function ModalCloseIcon() {
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
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.8 16.8 21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function OrgTabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="4" y="4" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="8.5" y="13" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function OrgRootIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="4" r="2" fill="currentColor" />
      <circle cx="4" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DepartmentGroupHead({ name }: { name: string }) {
  return (
    <div className="ac-batch-select-chat-head ac-batch-select-group-head">
      <span className="ac-batch-select-group-head-name">{name}</span>
    </div>
  )
}

function DepartmentTreeRow({
  name,
  checked,
  selectDisabled,
  hasChildren,
  selectAriaLabel,
  radioName,
  radioValue,
  onSelect,
  onOpen,
}: {
  name: string
  checked: boolean
  selectDisabled: boolean
  hasChildren: boolean
  selectAriaLabel: string
  radioName: string
  radioValue: string
  onSelect: () => void
  onOpen?: () => void
}) {
  const handleTriggerClick = () => {
    if (!selectDisabled) {
      onSelect()
      return
    }
    if (hasChildren) onOpen?.()
  }

  return (
    <div
      className={`ac-batch-select-chat-group-item${checked ? ' is-selected' : ''}${selectDisabled ? ' is-select-disabled' : ''}${selectDisabled && hasChildren ? ' is-drill-only' : ''}`}
    >
      <button
        type="button"
        className="ac-batch-select-chat-group-trigger"
        onClick={handleTriggerClick}
      >
        <span className="ac-batch-select-chat-icon" aria-hidden="true">
          <OrgTabIcon />
        </span>
        <span className="ac-batch-select-chat-meta ac-batch-select-chat-group-line">
          <span className="ac-batch-select-chat-group-name">{name}</span>
        </span>
      </button>
      {hasChildren ? (
        <button
          type="button"
          className="ac-batch-select-chat-group-chevron-btn"
          aria-label={name}
          onClick={(event) => {
            event.stopPropagation()
            onOpen?.()
          }}
        >
          <ChevronRightIcon />
        </button>
      ) : null}
      <label
        className="ac-batch-select-chat-group-radio"
        onClick={(event) => {
          event.stopPropagation()
          if (!selectDisabled) {
            onSelect()
            return
          }
          if (hasChildren) onOpen?.()
        }}
      >
        <input
          type="radio"
          className="ac-dept-parent-picker-radio"
          name={radioName}
          value={radioValue}
          checked={selectDisabled ? false : checked}
          readOnly={selectDisabled}
          aria-disabled={selectDisabled}
          aria-label={selectAriaLabel}
          onClick={(event) => {
            if (selectDisabled) {
              event.preventDefault()
              if (hasChildren) onOpen?.()
            }
          }}
          onChange={() => {
            if (!selectDisabled) onSelect()
          }}
        />
      </label>
    </div>
  )
}

function DepartmentAvatar({ departmentId }: { departmentId: string }) {
  const isRoot = departmentId === ORG_ROOT_PARENT_ID
  return (
    <span className="ac-batch-select-avatar ac-batch-select-avatar--dept">
      {isRoot ? <OrgRootIcon /> : <OrgTabIcon />}
    </span>
  )
}

function sortDepartments(rows: OrgDepartmentRow[], locale: AppLocale): OrgDepartmentRow[] {
  return [...rows].sort((a, b) =>
    localizeDepartmentName(a, locale).localeCompare(localizeDepartmentName(b, locale),
  ))
}

function getChildDepartments(
  departments: OrgDepartmentRow[],
  parentId: string | null,
  locale: AppLocale,
): OrgDepartmentRow[] {
  return sortDepartments(
    departments.filter((item) => item.parentId === parentId),
    locale,
  )
}

function hasChildDepartments(departments: OrgDepartmentRow[], departmentId: string): boolean {
  return departments.some((item) => item.parentId === departmentId)
}

function getDescendantDepartmentIds(
  rootId: string,
  departments: OrgDepartmentRow[],
): string[] {
  const descendants: string[] = []
  const queue = [rootId]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    for (const department of departments) {
      if (department.parentId === currentId) {
        descendants.push(department.id)
        queue.push(department.id)
      }
    }
  }
  return descendants
}

function getInvalidParentDepartmentIds(
  editedIds: string[],
  departments: OrgDepartmentRow[],
): string[] {
  const invalid = new Set<string>()
  for (const editedId of editedIds) {
    invalid.add(editedId)
    for (const descendantId of getDescendantDepartmentIds(editedId, departments)) {
      invalid.add(descendantId)
    }
  }
  return [...invalid]
}

function isDepartmentSelectable(departmentId: string, invalidParentSet: Set<string>): boolean {
  return !invalidParentSet.has(departmentId)
}

export function SelectParentDepartmentModal({
  locale,
  open,
  departments,
  excludeIds,
  value,
  titleKey = 'departmentSelectParentTitle',
  confirmKey = 'formSave',
  hintMessage = null,
  onClose,
  onConfirm,
}: SelectParentDepartmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [browseDepartmentId, setBrowseDepartmentId] = useState<string | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const wasOpenRef = useRef(false)
  const parentPickerRadioGroupName = useId()

  const invalidParentSet = useMemo(
    () => new Set(getInvalidParentDepartmentIds(excludeIds, departments)),
    [excludeIds, departments],
  )

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return null
    return sortDepartments(
      departments.filter((department) =>
        localizeDepartmentName(department, locale).toLowerCase().includes(query),
      ),
      locale,
    )
  }, [departments, locale, searchQuery])

  const browseDepartment = useMemo(() => {
    if (!browseDepartmentId) return null
    return departments.find((item) => item.id === browseDepartmentId) ?? null
  }, [browseDepartmentId, departments])

  const visibleDepartments = useMemo(() => {
    if (searchResults) return searchResults
    if (browseDepartmentId) return getChildDepartments(departments, browseDepartmentId, locale)
    return getChildDepartments(departments, null, locale)
  }, [browseDepartmentId, departments, locale, searchResults])

  const selectedDepartment = useMemo(() => {
    if (!selectedDepartmentId) return null
    if (selectedDepartmentId === ORG_ROOT_PARENT_ID) {
      return { id: ORG_ROOT_PARENT_ID, label: localizeOrgRootLabel(locale) }
    }
    const department = departments.find((item) => item.id === selectedDepartmentId)
    if (!department) return null
    return { id: department.id, label: localizeDepartmentName(department, locale) }
  }, [departments, locale, selectedDepartmentId])

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true

    setSearchQuery('')
    const nextSelected = value && value !== ORG_ROOT_PARENT_ID ? value : null
    setSelectedDepartmentId(nextSelected)
    if (nextSelected) {
      const department = departments.find((item) => item.id === nextSelected)
      setBrowseDepartmentId(department?.parentId ?? null)
    } else {
      setBrowseDepartmentId(null)
    }
  }, [open, value, departments])

  useEffect(() => {
    if (searchResults) return
    if (browseDepartmentId && !departments.some((item) => item.id === browseDepartmentId)) {
      setBrowseDepartmentId(null)
    }
  }, [browseDepartmentId, departments, searchResults])

  if (!open) return null

  const selectedCount = selectedDepartmentId ? 1 : 0
  const isSearchMode = searchResults != null
  const isDrilledView = !isSearchMode && browseDepartmentId != null
  const isCategoryList = !isDrilledView

  const selectDepartment = (departmentId: string | null) => {
    if (departmentId != null && !isDepartmentSelectable(departmentId, invalidParentSet)) return
    setSelectedDepartmentId(departmentId)
  }

  const toggleDepartment = (departmentId: string) => {
    if (!isDepartmentSelectable(departmentId, invalidParentSet)) return
    setSelectedDepartmentId(departmentId)
  }

  const handleConfirm = () => {
    if (!selectedDepartmentId) return
    onConfirm(selectedDepartmentId)
    onClose()
  }

  const handleBack = () => {
    if (!browseDepartmentId) return
    const current = departments.find((item) => item.id === browseDepartmentId)
    if (!current?.parentId) {
      setBrowseDepartmentId(null)
      return
    }
    setBrowseDepartmentId(current.parentId)
  }

  const renderDepartmentRow = (department: OrgDepartmentRow) => {
    const name = localizeDepartmentName(department, locale)
    const hasChildren = !isSearchMode && hasChildDepartments(departments, department.id)
    const selectDisabled = !isDepartmentSelectable(department.id, invalidParentSet)
    const checked = selectedDepartmentId === department.id

    return (
      <DepartmentTreeRow
        key={department.id}
        name={name}
        checked={checked}
        selectDisabled={selectDisabled}
        hasChildren={hasChildren}
        selectAriaLabel={name}
        radioName={parentPickerRadioGroupName}
        radioValue={department.id}
        onSelect={() => toggleDepartment(department.id)}
        onOpen={
          hasChildren ? () => setBrowseDepartmentId(department.id) : undefined
        }
      />
    )
  }

  const drilledHeader = browseDepartment
    ? {
        name: localizeDepartmentName(browseDepartment, locale),
        departmentId: browseDepartment.id,
      }
    : null

  const listEmpty = visibleDepartments.length === 0
  const drilledHeaderSelectDisabled =
    drilledHeader != null &&
    !isDepartmentSelectable(drilledHeader.departmentId, invalidParentSet)

  return (
    <div
      className="ac-modal-overlay ac-modal-overlay--nested"
      role="presentation"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
    >
      <div
        className="ac-modal ac-modal--batch-select"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-dept-parent-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--batch">
          <h2 id="ac-dept-parent-picker-title" className="ac-modal-title">
            {acT(locale, titleKey)}
          </h2>
          <button
            type="button"
            className="ac-modal-close"
            aria-label={acT(locale, 'modalClose')}
            onClick={onClose}
          >
            <ModalCloseIcon />
          </button>
        </div>

        {hintMessage ? <p className="ac-modal-hint ac-batch-select-hint">{hintMessage}</p> : null}

        <div className="ac-batch-select-body">
          <div className="ac-batch-select-left">
            <div className="ac-batch-select-search">
              <SearchIcon />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={acT(locale, 'batchSelectSearchPlaceholder')}
                aria-label={acT(locale, 'batchSelectSearchPlaceholder')}
              />
            </div>

            <div
              className={`ac-batch-select-list${isCategoryList ? ' ac-batch-select-list--categories' : ''}`}
              role="radiogroup"
              aria-label={acT(locale, titleKey)}
            >
              {isDrilledView && drilledHeader ? (
                <div className="ac-batch-select-group-panel">
                  <div className="ac-batch-select-group-toolbar">
                    <button
                      type="button"
                      className="ac-batch-select-group-back"
                      aria-label={acT(locale, 'batchSelectBackToOrg')}
                      onClick={handleBack}
                    >
                      <ChevronLeftIcon />
                    </button>
                    <div
                      className={`ac-batch-select-org-header${selectedDepartmentId === drilledHeader.departmentId ? ' is-selected' : ''}${drilledHeaderSelectDisabled ? ' is-select-disabled' : ''}`}
                    >
                      <button
                        type="button"
                        className={`ac-batch-select-org-header-trigger${drilledHeaderSelectDisabled ? ' is-select-disabled' : ''}`}
                        onClick={() => {
                          if (drilledHeaderSelectDisabled) return
                          toggleDepartment(drilledHeader.departmentId)
                        }}
                      >
                        <DepartmentGroupHead name={drilledHeader.name} />
                      </button>
                      <label
                        className="ac-batch-select-chat-group-radio"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (drilledHeaderSelectDisabled) return
                          toggleDepartment(drilledHeader.departmentId)
                        }}
                      >
                        <input
                          type="radio"
                          className="ac-dept-parent-picker-radio"
                          name={parentPickerRadioGroupName}
                          value={drilledHeader.departmentId}
                          checked={selectedDepartmentId === drilledHeader.departmentId}
                          readOnly={drilledHeaderSelectDisabled}
                          aria-disabled={drilledHeaderSelectDisabled}
                          aria-label={drilledHeader.name}
                          onClick={(event) => {
                            if (drilledHeaderSelectDisabled) event.preventDefault()
                          }}
                          onChange={() => {
                            if (!drilledHeaderSelectDisabled) {
                              toggleDepartment(drilledHeader.departmentId)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="ac-batch-select-org-group ac-batch-select-chat-group">
                    {visibleDepartments.map(renderDepartmentRow)}
                  </div>
                </div>
              ) : listEmpty ? (
                <div className="ac-batch-select-empty">{acT(locale, 'formSearchNoResults')}</div>
              ) : (
                visibleDepartments.map(renderDepartmentRow)
              )}
            </div>
          </div>

          <div className="ac-batch-select-right">
            <div className="ac-batch-select-selected-head">
              {acT(locale, 'departmentSelectParentSelectedCount').replace(
                '{count}',
                String(selectedCount),
              )}
            </div>

            <div className="ac-batch-select-chips">
              {selectedDepartment ? (
                <span className="ac-batch-select-chip">
                  <span className="ac-batch-select-chip-avatar ac-batch-select-chip-avatar--dept">
                    <DepartmentAvatar departmentId={selectedDepartment.id} />
                  </span>
                  <span className="ac-batch-select-chip-name">{selectedDepartment.label}</span>
                  <button
                    type="button"
                    className="ac-batch-select-chip-remove"
                    aria-label={acT(locale, 'modalClose')}
                    onClick={() => selectDepartment(null)}
                  >
                    ×
                  </button>
                </span>
              ) : (
                <div className="ac-batch-select-chips-empty">
                  {acT(locale, 'departmentSelectParentEmpty')}
                </div>
              )}
            </div>

            <div className="ac-batch-select-actions">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
                {acT(locale, 'formCancel')}
              </button>
              <button
                type="button"
                className="agents-btn agents-btn-primary"
                disabled={!selectedDepartmentId}
                onClick={handleConfirm}
              >
                {acT(locale, confirmKey)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
