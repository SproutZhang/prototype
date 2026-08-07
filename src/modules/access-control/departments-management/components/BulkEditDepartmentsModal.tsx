import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  localizeOrgRootLabel,
  isDepartmentManagementRootRow,
  ORG_ROOT_PARENT_ID,
  type OrgDepartmentRow,
} from '../data/departmentsSeed'
import type {
  DepartmentBulkEditPayload,
  DepartmentBulkEditSaveOptions,
} from '../hooks/useDepartmentsSectionController'
import { RemoveDepartmentConfirmModal } from './RemoveDepartmentConfirmModal'
import { SelectParentDepartmentModal } from './SelectParentDepartmentModal'

type BulkEditDepartmentsModalProps = {
  locale: AppLocale
  open: boolean
  departments: OrgDepartmentRow[]
  memberCountById: Map<string, number>
  selectedIds: string[]
  onClose: () => void
  onSave: (
    departmentIds: string[],
    payload: DepartmentBulkEditPayload,
    options?: DepartmentBulkEditSaveOptions,
  ) => void
  onDelete: (departmentIds: string[]) => void
}

function OrgRootIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="4" r="2" fill="#3b82f6" />
      <circle cx="4" cy="12" r="2" fill="#3b82f6" />
      <circle cx="12" cy="12" r="2" fill="#3b82f6" />
    </svg>
  )
}

function ParentTreePickerIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="10" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 16v-2a3 3 0 013-3h6a3 3 0 013 3v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M10 7.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`ac-dept-toggle-switch${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="ac-dept-toggle-switch-thumb" />
    </button>
  )
}

export function BulkEditDepartmentsModal({
  locale,
  open,
  departments,
  memberCountById,
  selectedIds,
  onClose,
  onSave,
  onDelete,
}: BulkEditDepartmentsModalProps) {
  const titleId = useId()
  const [draftIds, setDraftIds] = useState<string[]>([])
  const [parentId, setParentId] = useState<string>('')
  const [hideDepartment, setHideDepartment] = useState(false)
  const [restrictAddressBook, setRestrictAddressBook] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const wasOpenRef = useRef(false)

  const selectedDepartments = useMemo(
    () =>
      departments.filter(
        (item) => draftIds.includes(item.id) && isDepartmentManagementRootRow(item.id),
      ),
    [departments, draftIds],
  )

  const parentLabel = useMemo(() => {
    if (!parentId) return ''
    if (parentId === ORG_ROOT_PARENT_ID) return localizeOrgRootLabel(locale)
    const parent = departments.find((item) => item.id === parentId)
    return parent ? localizeDepartmentName(parent, locale) : ''
  }, [departments, locale, parentId])

  const removableIds = useMemo(
    () => draftIds.filter((id) => (memberCountById.get(id) ?? 0) === 0),
    [draftIds, memberCountById],
  )

  const firstBlockedDepartment = useMemo(() => {
    const blockedId = draftIds.find((id) => (memberCountById.get(id) ?? 0) > 0)
    if (!blockedId) return null
    return departments.find((item) => item.id === blockedId) ?? null
  }, [departments, draftIds, memberCountById])

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true

    setDraftIds(
      selectedIds.filter((id) => {
        const department = departments.find((item) => item.id === id)
        return department != null && isDepartmentManagementRootRow(department.id)
      }),
    )
    setPickerOpen(false)
    setRemoveConfirmOpen(false)

    const selectedRows = departments.filter(
      (item) => selectedIds.includes(item.id) && isDepartmentManagementRootRow(item.id),
    )
    const firstParent = selectedRows[0]?.parentId
    const sameParent =
      selectedRows.length > 0 &&
      selectedRows.every((item) => item.parentId === firstParent)
    setParentId(
      sameParent
        ? firstParent
          ? firstParent
          : ORG_ROOT_PARENT_ID
        : ORG_ROOT_PARENT_ID,
    )

    const sameHide =
      selectedRows.length > 0 &&
      selectedRows.every((item) => item.hideDepartment === selectedRows[0].hideDepartment)
    setHideDepartment(sameHide ? selectedRows[0].hideDepartment : false)

    const sameRestrict =
      selectedRows.length > 0 &&
      selectedRows.every(
        (item) => item.restrictAddressBook === selectedRows[0].restrictAddressBook,
      )
    setRestrictAddressBook(sameRestrict ? selectedRows[0].restrictAddressBook : false)
  }, [open, selectedIds])

  const removeConfirmDepartmentLabel = useMemo(() => {
    if (removableIds.length === 1) {
      const department = departments.find((item) => item.id === removableIds[0])
      return department ? localizeDepartmentName(department, locale) : ''
    }
    if (firstBlockedDepartment) {
      return localizeDepartmentName(firstBlockedDepartment, locale)
    }
    return ''
  }, [departments, firstBlockedDepartment, locale, removableIds])

  if (!open) return null

  const buildBulkPayload = (nextParentId: string): DepartmentBulkEditPayload => ({
    parentId: nextParentId === ORG_ROOT_PARENT_ID ? null : nextParentId,
    hideDepartment,
    restrictAddressBook,
  })

  const handleSave = () => {
    if (draftIds.length === 0 || !parentId) return
    onSave(draftIds, buildBulkPayload(parentId))
  }

  const handlePickerConfirm = (nextParentId: string) => {
    setParentId(nextParentId)
  }

  const handleDeleteConfirm = () => {
    if (removableIds.length === 0) return
    onDelete(removableIds)
    setRemoveConfirmOpen(false)
  }

  const removeConfirmBulkCount = removableIds.length > 1 ? removableIds.length : 0
  const removeConfirmMemberCount =
    removableIds.length === 0 ? (memberCountById.get(firstBlockedDepartment?.id ?? '') ?? 0) : 0

  return (
    <>
      <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--department-bulk-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--dept-bulk">
          <h2 id={titleId} className="ac-modal-title">{acT(locale, 'departmentBulkEditTitle')}</h2>
          <button
            type="button"
            className="ac-modal-close"
            onClick={onClose}
            aria-label={acT(locale, 'modalClose')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="ac-dept-bulk-edit-body">
          <div className="ac-dept-bulk-edit-block">
            <span className="ac-dept-bulk-edit-label">{acT(locale, 'departmentBulkEditSelectedLabel')}</span>
            <div
              className="ac-dept-bulk-edit-tags"
              aria-label={acT(locale, 'departmentBulkEditSelectedLabel')}
            >
              {selectedDepartments.map((department) => (
                <span key={department.id} className="ac-dept-bulk-edit-tag">
                  {localizeDepartmentName(department, locale)}
                </span>
              ))}
            </div>
          </div>

          <div className="ac-dept-bulk-edit-block">
            <span className="ac-dept-bulk-edit-label ac-dept-bulk-edit-label--required">
              <span className="ac-dept-bulk-edit-required" aria-hidden="true">*</span>
              {acT(locale, 'departmentFieldParent')}
            </span>
            <div className="ac-dept-bulk-parent-field">
              <div className="ac-dept-bulk-parent-value">
                {parentLabel ? (
                  <span className="ac-dept-bulk-parent-chip">
                    {parentId === ORG_ROOT_PARENT_ID ? <OrgRootIcon /> : null}
                    <span className="ac-dept-bulk-parent-chip-label">{parentLabel}</span>
                    <button
                      type="button"
                      className="ac-dept-bulk-parent-chip-clear"
                      onClick={() => setParentId('')}
                      aria-label={acT(locale, 'departmentFieldParentPlaceholder')}
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <span className="ac-dept-bulk-parent-placeholder">
                    {acT(locale, 'departmentFieldParentPlaceholder')}
                  </span>
                )}
              </div>
              <div className="ac-dept-bulk-parent-picker-wrap">
                <button
                  type="button"
                  className="ac-dept-bulk-parent-tree-btn"
                  aria-label={acT(locale, 'departmentParentTreePicker')}
                  aria-haspopup="dialog"
                  onClick={() => setPickerOpen(true)}
                >
                  <ParentTreePickerIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="ac-dept-bulk-edit-block ac-dept-bulk-edit-block--settings">
            <div className="ac-dept-bulk-edit-setting">
              <div className="ac-dept-bulk-edit-setting-text">
                <span className="ac-dept-bulk-edit-setting-label">{acT(locale, 'departmentHideLabel')}</span>
                <span className="ac-dept-bulk-edit-setting-hint">{acT(locale, 'departmentHideHint')}</span>
              </div>
              <ToggleSwitch
                checked={hideDepartment}
                onChange={setHideDepartment}
                ariaLabel={acT(locale, 'departmentHideLabel')}
              />
            </div>

            <div className="ac-dept-bulk-edit-setting">
              <div className="ac-dept-bulk-edit-setting-text">
                <span className="ac-dept-bulk-edit-setting-label">
                  {acT(locale, 'departmentRestrictAddressBookLabel')}
                </span>
                <span className="ac-dept-bulk-edit-setting-hint">
                  {acT(locale, 'departmentRestrictAddressBookHint')}
                </span>
              </div>
              <ToggleSwitch
                checked={restrictAddressBook}
                onChange={setRestrictAddressBook}
                ariaLabel={acT(locale, 'departmentRestrictAddressBookLabel')}
              />
            </div>
          </div>
        </div>

        <div className="ac-modal-actions ac-modal-actions--dept-bulk">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className="ac-btn ac-btn--danger"
            disabled={draftIds.length === 0}
            onClick={() => setRemoveConfirmOpen(true)}
          >
            {acT(locale, 'removeDepartment')}
          </button>
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            onClick={handleSave}
            disabled={!parentId || draftIds.length === 0}
          >
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>

      <RemoveDepartmentConfirmModal
        locale={locale}
        open={removeConfirmOpen}
        nested
        bulkCount={removeConfirmBulkCount}
        departmentLabel={removeConfirmDepartmentLabel}
        memberCount={removeConfirmMemberCount}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
      </div>

      <SelectParentDepartmentModal
        locale={locale}
        open={pickerOpen}
        departments={departments}
        excludeIds={draftIds}
        value={parentId}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
      />
    </>
  )
}
