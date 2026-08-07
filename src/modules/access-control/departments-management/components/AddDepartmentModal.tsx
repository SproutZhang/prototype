import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { BatchSelectUsersModal } from '../../components/BatchSelectUsersModal'
import { acT } from '../../i18n/strings'
import {
  getOrgMemberById,
  localizeOrgMemberName,
  ORG_MEMBERS_CATALOG,
} from '../../data/orgMembersCatalog'
import type { DepartmentFormSavePayload } from '../hooks/useDepartmentsSectionController'
import { DepartmentPrivacySection } from './DepartmentPrivacySection'
import { DepartmentTypeSelectField } from './DepartmentTypeSelectField'
import { SupervisorQuickPickDropdown } from './SupervisorQuickPickDropdown'
import { getFrequentSupervisorCandidates } from '../utils/getFrequentSupervisorCandidates'
import { generateDepartmentCodeFromName } from '../utils/generateDepartmentCodeFromName'

type AddDepartmentModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onSave: (payload: DepartmentFormSavePayload) => void
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

export function AddDepartmentModal({
  locale,
  open,
  onClose,
  onSave,
}: AddDepartmentModalProps) {
  const titleId = useId()
  const supervisorFieldRef = useRef<HTMLDivElement>(null)
  const supervisorMenuRef = useRef<HTMLUListElement>(null)
  const [nameZh, setNameZh] = useState('')
  const [departmentType, setDepartmentType] = useState('')
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
    () => getFrequentSupervisorCandidates(nameZh.trim()),
    [nameZh],
  )

  const selectedSupervisors = useMemo(
    () =>
      supervisorIds
        .map((id) => getOrgMemberById(id))
        .filter((member): member is NonNullable<typeof member> => member != null),
    [supervisorIds],
  )

  const departmentCode = useMemo(
    () => generateDepartmentCodeFromName(nameZh),
    [nameZh],
  )

  useEffect(() => {
    if (!open) return
    setNameZh('')
    setDepartmentType('')
    setDescriptionZh('')
    setDescriptionEn('')
    setEffectiveDate('')
    setSupervisorIds([])
    setIncludeHiddenSubDepartments(false)
    setIncludeSelfVisibleSubDepartments(false)
    setIncludeAssociatedOrgs(false)
    setPrivacyExpanded(false)
    setSupervisorPickerOpen(false)
    setSupervisorDropdownOpen(false)
  }, [open])

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

  if (!open) return null

  const trimmedName = nameZh.trim()
  const canSave = trimmedName.length > 0
  const responsibilitiesValue = locale === 'zh' ? descriptionZh : descriptionEn
  const emptyIncludeText = acT(locale, 'roleNoAssignedUsers')
  const associatedOrgsIncludeText = acT(locale, 'roleNoAssignedUsers')

  const handleSave = () => {
    if (!canSave) return
    const responsibilities = locale === 'zh' ? descriptionZh : descriptionEn
    onSave({
      nameZh: trimmedName,
      nameEn: trimmedName,
      descriptionZh: locale === 'zh' ? responsibilities.trim() : descriptionZh.trim(),
      descriptionEn: locale === 'en' ? responsibilities.trim() : descriptionEn.trim(),
      parentId: null,
      departmentCode,
      departmentType,
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
            <h2 id={titleId} className="ac-modal-title">{acT(locale, 'departmentAddTitle')}</h2>
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
            <div className="ac-dept-edit-field">
              <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
                {acT(locale, 'departmentColumnName')}
              </label>
              <input
                id={`${titleId}-name`}
                type="text"
                className="ac-dept-edit-input"
                value={nameZh}
                placeholder={acT(locale, 'formInputPlaceholder')}
                onChange={(event) => setNameZh(event.target.value)}
              />
            </div>

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
                value={departmentType}
                onChange={setDepartmentType}
              />
            </div>

            <div className="ac-dept-edit-field">
              <label className="ac-dept-edit-label" htmlFor={`${titleId}-responsibilities`}>
                {acT(locale, 'departmentFieldResponsibilities')}
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

            <DepartmentPrivacySection
              locale={locale}
              expanded={privacyExpanded}
              onToggle={() => setPrivacyExpanded((prev) => !prev)}
              includeHiddenSubDepartments={includeHiddenSubDepartments}
              includeSelfVisibleSubDepartments={includeSelfVisibleSubDepartments}
              includeAssociatedOrgs={includeAssociatedOrgs}
              hiddenIncludeText={emptyIncludeText}
              selfVisibleIncludeText={emptyIncludeText}
              associatedOrgsIncludeText={associatedOrgsIncludeText}
              onIncludeHiddenChange={setIncludeHiddenSubDepartments}
              onIncludeSelfVisibleChange={setIncludeSelfVisibleSubDepartments}
              onIncludeAssociatedOrgsChange={setIncludeAssociatedOrgs}
            />
          </div>

          <div className="ac-modal-actions ac-modal-actions--dept-edit">
            <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
              {acT(locale, 'formCancel')}
            </button>
            <button
              type="button"
              className="agents-btn agents-btn-primary"
              disabled={!canSave}
              onClick={handleSave}
            >
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
    </>
  )
}
