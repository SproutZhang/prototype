import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { BatchSelectUsersModal } from '../../components/BatchSelectUsersModal'
import { acT } from '../../i18n/strings'
import {
  getOrgMemberById,
  localizeOrgMemberName,
  ORG_MEMBERS_CATALOG,
} from '../../data/orgMembersCatalog'
import {
  localizeDepartmentName,
  localizeOrgRootLabel,
  ORG_ROOT_PARENT_ID,
  type OrgDepartmentRow,
} from '../data/departmentsSeed'
import type { DepartmentEditSavePayload } from '../hooks/useDepartmentsSectionController'
import { DepartmentDetailInfoCard } from './DepartmentDetailInfoCard'
import { DepartmentPrivacySection } from './DepartmentPrivacySection'
import { DepartmentTypeSelectField } from './DepartmentTypeSelectField'
import { SelectParentDepartmentModal } from './SelectParentDepartmentModal'
import { SupervisorQuickPickDropdown } from './SupervisorQuickPickDropdown'
import { getFrequentSupervisorCandidates } from '../utils/getFrequentSupervisorCandidates'
import { generateDepartmentCodeFromName } from '../utils/generateDepartmentCodeFromName'
import {
  DEFAULT_DEPARTMENT_TYPE_ID,
  getDepartmentTypeSelectOptions,
  resolveDepartmentTypeId,
} from '../data/departmentTypeCatalog'

type EditDepartmentModalProps = {
  locale: AppLocale
  open: boolean
  department: OrgDepartmentRow | null
  departments: OrgDepartmentRow[]
  /** 受限编辑：仅主管、生效日期可改（成员管理 · Manager） */
  limitedEdit?: boolean
  onClose: () => void
  onSave: (payload: DepartmentEditSavePayload) => void
}

function SupervisorPickerIcon() {
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

function OrgRootIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="4" r="2" fill="#3b82f6" />
      <circle cx="4" cy="12" r="2" fill="#3b82f6" />
      <circle cx="12" cy="12" r="2" fill="#3b82f6" />
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
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatIncludedDepartments(
  departments: OrgDepartmentRow[],
  locale: AppLocale,
): string {
  if (departments.length === 0) return acT(locale, 'roleNoAssignedUsers')
  return departments.map((item) => localizeDepartmentName(item, locale)).join('、')
}

export function EditDepartmentModal({
  locale,
  open,
  department,
  departments,
  limitedEdit = false,
  onClose,
  onSave,
}: EditDepartmentModalProps) {
  const restrictedEdit = limitedEdit

  const titleId = useId()
  const supervisorFieldRef = useRef<HTMLDivElement>(null)
  const supervisorMenuRef = useRef<HTMLUListElement>(null)
  const [nameZh, setNameZh] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [parentId, setParentId] = useState(ORG_ROOT_PARENT_ID)
  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const [departmentType, setDepartmentType] = useState(DEFAULT_DEPARTMENT_TYPE_ID)
  const [descriptionZh, setDescriptionZh] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [supervisorIds, setSupervisorIds] = useState<string[]>([])
  const [supervisorPickerOpen, setSupervisorPickerOpen] = useState(false)
  const [supervisorDropdownOpen, setSupervisorDropdownOpen] = useState(false)
  const [includeHiddenSubDepartments, setIncludeHiddenSubDepartments] = useState(false)
  const [includeSelfVisibleSubDepartments, setIncludeSelfVisibleSubDepartments] = useState(false)
  const [includeAssociatedOrgs, setIncludeAssociatedOrgs] = useState(false)
  const [privacyExpanded, setPrivacyExpanded] = useState(false)

  const frequentSupervisorCandidates = useMemo(
    () => (department ? getFrequentSupervisorCandidates(department.nameZh) : []),
    [department],
  )

  const selectedSupervisors = useMemo(
    () =>
      supervisorIds
        .map((id) => getOrgMemberById(id))
        .filter((member): member is NonNullable<typeof member> => member != null),
    [supervisorIds],
  )

  const parentLabel = useMemo(() => {
    if (!parentId) return ''
    if (parentId === ORG_ROOT_PARENT_ID) return localizeOrgRootLabel(locale)
    const parent = departments.find((item) => item.id === parentId)
    return parent ? localizeDepartmentName(parent, locale) : ''
  }, [departments, locale, parentId])

  const hiddenChildDepartments = useMemo(() => {
    if (!department) return []
    return departments.filter(
      (item) => item.parentId === department.id && item.hideDepartment,
    )
  }, [department, departments])

  const selfVisibleChildDepartments = useMemo(() => {
    if (!department) return []
    return departments.filter(
      (item) => item.parentId === department.id && item.restrictAddressBook,
    )
  }, [department, departments])

  const departmentNameValue = locale === 'zh' ? nameZh : nameEn
  const departmentCode = useMemo(
    () => generateDepartmentCodeFromName(departmentNameValue),
    [departmentNameValue],
  )
  const displayDepartmentType = useMemo(
    () => resolveDepartmentTypeId(departmentType),
    [departmentType],
  )
  const displayDepartmentTypeLabel = useMemo(() => {
    const options = getDepartmentTypeSelectOptions(locale)
    return (
      options.find((option) => option.value === displayDepartmentType)?.label ??
      displayDepartmentType
    )
  }, [displayDepartmentType, locale])

  useEffect(() => {
    if (!open || !department) return
    setNameZh(department.nameZh)
    setNameEn(department.nameEn)
    setParentId(department.parentId ?? ORG_ROOT_PARENT_ID)
    setDepartmentType(resolveDepartmentTypeId(department.departmentType))
    setDescriptionZh(department.descriptionZh)
    setDescriptionEn(department.descriptionEn)
    setEffectiveDate(department.effectiveDate)
    setSupervisorIds(department.supervisorIds)
    setIncludeHiddenSubDepartments(department.includeHiddenSubDepartments)
    setIncludeSelfVisibleSubDepartments(department.includeSelfVisibleSubDepartments)
    setIncludeAssociatedOrgs(department.includeAssociatedOrgs)
    setPrivacyExpanded(false)
    setSupervisorPickerOpen(false)
    setSupervisorDropdownOpen(false)
    setParentPickerOpen(false)
  }, [open, department?.id])

  useEffect(() => {
    if (!supervisorDropdownOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = supervisorFieldRef.current
      const menu = supervisorMenuRef.current
      const target = event.target as Node
      if (root?.contains(target) || menu?.contains(target)) return
      setSupervisorDropdownOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [supervisorDropdownOpen])

  if (!open || !department) return null

  const handleSave = () => {
    const trimmedNameZh = nameZh.trim() || department.nameZh
    const trimmedNameEn = nameEn.trim() || department.nameEn
    const responsibilities = locale === 'zh' ? descriptionZh : descriptionEn
    if (restrictedEdit) {
      onSave({
        nameZh: department.nameZh,
        nameEn: department.nameEn,
        parentId: department.parentId,
        departmentCode: department.departmentCode || departmentCode,
        departmentType: resolveDepartmentTypeId(department.departmentType),
        descriptionZh: department.descriptionZh,
        descriptionEn: department.descriptionEn,
        effectiveDate,
        supervisorIds,
        includeHiddenSubDepartments: department.includeHiddenSubDepartments,
        includeSelfVisibleSubDepartments: department.includeSelfVisibleSubDepartments,
        includeAssociatedOrgs: department.includeAssociatedOrgs,
      })
      return
    }
    onSave({
      nameZh: trimmedNameZh,
      nameEn: trimmedNameEn,
      parentId: parentId === ORG_ROOT_PARENT_ID ? null : parentId,
      departmentCode,
      departmentType: resolveDepartmentTypeId(departmentType),
      descriptionZh: locale === 'zh' ? responsibilities.trim() : descriptionZh.trim(),
      descriptionEn: locale === 'en' ? responsibilities.trim() : descriptionEn.trim(),
      effectiveDate,
      supervisorIds,
      includeHiddenSubDepartments,
      includeSelfVisibleSubDepartments,
      includeAssociatedOrgs,
    })
  }

  const handleSupervisorPickerSave = (memberIds: string[]) => {
    setSupervisorIds(memberIds)
    setSupervisorPickerOpen(false)
  }

  const removeSupervisor = (memberId: string) => {
    setSupervisorIds((prev) => prev.filter((id) => id !== memberId))
  }

  const toggleSupervisor = (memberId: string) => {
    setSupervisorIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const hiddenIncludeText = formatIncludedDepartments(hiddenChildDepartments, locale)
  const selfVisibleIncludeText = formatIncludedDepartments(selfVisibleChildDepartments, locale)
  const associatedOrgsIncludeText = acT(locale, 'roleNoAssignedUsers')
  const responsibilitiesValue = locale === 'zh' ? descriptionZh : descriptionEn

  return (
    <>
      <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
        <div
          className="ac-modal ac-modal--department-edit"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ac-modal-title-row ac-modal-title-row--dept-edit">
            <h2 id={titleId} className="ac-modal-title">{acT(locale, 'departmentEditTitle')}</h2>
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

          <div className="ac-dept-edit-body">
            {restrictedEdit ? (
              <DepartmentDetailInfoCard
                locale={locale}
                departmentName={departmentNameValue}
                parentLabel={parentLabel}
                isOrgRootParent={parentId === ORG_ROOT_PARENT_ID}
                departmentCode={department.departmentCode || departmentCode}
                departmentTypeLabel={displayDepartmentTypeLabel}
                description={responsibilitiesValue}
              />
            ) : (
              <>
            <div className="ac-dept-edit-field">
              <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
                {acT(locale, 'departmentColumnName')}
              </label>
              <input
                id={`${titleId}-name`}
                type="text"
                className="ac-dept-edit-input"
                value={departmentNameValue}
                placeholder={acT(locale, 'formInputPlaceholder')}
                onChange={(event) => {
                  if (locale === 'zh') setNameZh(event.target.value)
                  else setNameEn(event.target.value)
                }}
              />
            </div>

            <div className="ac-dept-edit-field">
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
                        onClick={() => setParentId(ORG_ROOT_PARENT_ID)}
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
                    onClick={() => setParentPickerOpen(true)}
                  >
                    <ParentTreePickerIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="ac-dept-edit-field-row">
              <div className="ac-dept-edit-field">
                <label className="ac-dept-edit-label" htmlFor={`${titleId}-code`}>
                  {acT(locale, 'departmentFieldCode')}
                </label>
                <input
                  id={`${titleId}-code`}
                  type="text"
                  className="ac-dept-edit-input ac-dept-edit-input--readonly"
                  value={departmentCode}
                  readOnly
                  aria-readonly="true"
                  tabIndex={-1}
                />
              </div>

              <div className="ac-dept-edit-field">
                <label className="ac-dept-edit-label" htmlFor={`${titleId}-type`}>
                  {acT(locale, 'departmentFieldType')}
                </label>
                <DepartmentTypeSelectField
                  locale={locale}
                  selectId={`${titleId}-type`}
                  value={displayDepartmentType}
                  onChange={setDepartmentType}
                />
              </div>
            </div>

            <div className="ac-dept-edit-field">
              <label className="ac-dept-edit-label" htmlFor={`${titleId}-responsibilities`}>
                {acT(locale, 'departmentFieldDescription')}
              </label>
              <textarea
                id={`${titleId}-responsibilities`}
                className="ac-dept-edit-textarea"
                rows={3}
                value={responsibilitiesValue}
                placeholder={acT(locale, 'formInputPlaceholder')}
                onChange={(event) => {
                  if (locale === 'zh') setDescriptionZh(event.target.value)
                  else setDescriptionEn(event.target.value)
                }}
              />
            </div>
              </>
            )}

            <div className="ac-dept-edit-field">
              <span className="ac-dept-edit-label">{acT(locale, 'departmentFieldSupervisor')}</span>
              <div className="ac-dept-edit-supervisor-field" ref={supervisorFieldRef}>
                <div
                  className={`ac-dept-edit-supervisor-trigger${supervisorDropdownOpen ? ' is-open' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={supervisorDropdownOpen}
                  aria-haspopup="listbox"
                  id={`${titleId}-supervisor`}
                  onClick={() => setSupervisorDropdownOpen((prev) => !prev)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSupervisorDropdownOpen((prev) => !prev)
                    }
                    if (event.key === 'Escape') setSupervisorDropdownOpen(false)
                  }}
                >
                  <div className="ac-dept-edit-supervisor-value">
                    {selectedSupervisors.length > 0 ? (
                      <div className="ac-dept-edit-supervisor-chips">
                        {selectedSupervisors.map((member) => (
                          <span key={member.id} className="ac-dept-bulk-parent-chip">
                            <span className="ac-dept-bulk-parent-chip-label">
                              {localizeOrgMemberName(member, locale)}
                            </span>
                            <button
                              type="button"
                              className="ac-dept-bulk-parent-chip-clear"
                              onClick={(event) => {
                                event.stopPropagation()
                                removeSupervisor(member.id)
                              }}
                              aria-label={acT(locale, 'modalClose')}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="ac-dept-bulk-parent-placeholder">
                        {acT(locale, 'departmentFieldSupervisorPlaceholder')}
                      </span>
                    )}
                  </div>
                  <span className="ac-dept-edit-supervisor-chevron" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>

                <SupervisorQuickPickDropdown
                  open={supervisorDropdownOpen}
                  anchorRef={supervisorFieldRef}
                  menuRef={supervisorMenuRef}
                  locale={locale}
                  ariaLabel={acT(locale, 'departmentFieldSupervisor')}
                  candidates={frequentSupervisorCandidates}
                  selectedIds={supervisorIds}
                  onToggle={toggleSupervisor}
                />

                <div className="ac-dept-bulk-parent-picker-wrap">
                  <button
                    type="button"
                    className="ac-dept-bulk-parent-tree-btn"
                    aria-label={acT(locale, 'departmentSelectSupervisorPicker')}
                    aria-haspopup="dialog"
                    onClick={() => {
                      setSupervisorDropdownOpen(false)
                      setSupervisorPickerOpen(true)
                    }}
                  >
                    <SupervisorPickerIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="ac-dept-edit-field">
              <label className="ac-dept-edit-label" htmlFor={`${titleId}-effective`}>
                {acT(locale, 'departmentFieldEffectiveDate')}
              </label>
              <input
                id={`${titleId}-effective`}
                type="date"
                className="ac-dept-edit-input ac-dept-edit-input--date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
            </div>

            {!restrictedEdit ? (
            <DepartmentPrivacySection
              locale={locale}
              expanded={privacyExpanded}
              onToggle={() => setPrivacyExpanded((prev) => !prev)}
              includeHiddenSubDepartments={includeHiddenSubDepartments}
              includeSelfVisibleSubDepartments={includeSelfVisibleSubDepartments}
              includeAssociatedOrgs={includeAssociatedOrgs}
              hiddenIncludeText={hiddenIncludeText}
              selfVisibleIncludeText={selfVisibleIncludeText}
              associatedOrgsIncludeText={associatedOrgsIncludeText}
              onIncludeHiddenChange={setIncludeHiddenSubDepartments}
              onIncludeSelfVisibleChange={setIncludeSelfVisibleSubDepartments}
              onIncludeAssociatedOrgsChange={setIncludeAssociatedOrgs}
            />
            ) : null}
          </div>

          <div className="ac-modal-actions ac-modal-actions--dept-edit">
            <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
              {acT(locale, 'formCancel')}
            </button>
            <button type="button" className="agents-btn agents-btn-primary" onClick={handleSave}>
              {acT(locale, 'formSave')}
            </button>
          </div>
        </div>
      </div>

      <BatchSelectUsersModal
        locale={locale}
        open={supervisorPickerOpen}
        nestedOverlay
        membersOnly
        allowEmptySave
        titleKey="departmentSelectSupervisorTitle"
        candidates={ORG_MEMBERS_CATALOG}
        initialSelectedIds={supervisorIds}
        onClose={() => setSupervisorPickerOpen(false)}
        onSave={handleSupervisorPickerSave}
      />

      {!restrictedEdit ? (
      <SelectParentDepartmentModal
        locale={locale}
        open={parentPickerOpen}
        departments={departments}
        excludeIds={[department.id]}
        value={parentId}
        onClose={() => setParentPickerOpen(false)}
        onConfirm={(nextParentId) => {
          setParentId(nextParentId)
          setParentPickerOpen(false)
        }}
      />
      ) : null}
    </>
  )
}
