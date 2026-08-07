import { useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../data/departmentsSeed'
import type { DepartmentFormSavePayload } from '../hooks/useDepartmentsSectionController'
import { generateDepartmentCodeFromName } from '../utils/generateDepartmentCodeFromName'
import { DepartmentTypeSelectField } from './DepartmentTypeSelectField'

type AddChildDepartmentModalProps = {
  locale: AppLocale
  open: boolean
  parentDepartment: OrgDepartmentRow | null
  variant?: 'default' | 'minimal'
  onClose: () => void
  onSave: (payload: DepartmentFormSavePayload) => void
}

function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AddChildDepartmentModal({
  locale,
  open,
  parentDepartment,
  variant = 'default',
  onClose,
  onSave,
}: AddChildDepartmentModalProps) {
  const titleId = useId()
  const [effectiveDate, setEffectiveDate] = useState(todayIsoDate())
  const [nameZh, setNameZh] = useState('')
  const [departmentType, setDepartmentType] = useState('')
  const [establishedDate, setEstablishedDate] = useState('')
  const [responsibilities, setResponsibilities] = useState('')

  const departmentCode = useMemo(
    () => generateDepartmentCodeFromName(nameZh),
    [nameZh],
  )

  useEffect(() => {
    if (!open) return
    setEffectiveDate(todayIsoDate())
    setNameZh('')
    setDepartmentType('')
    setEstablishedDate('')
    setResponsibilities('')
  }, [open, parentDepartment?.id])

  if (!open || !parentDepartment) return null

  const parentLabel = localizeDepartmentName(parentDepartment, locale)
  const isMinimal = variant === 'minimal'

  const handleSave = () => {
    const trimmedName = nameZh.trim()
    if (!trimmedName) return
    if (!isMinimal && !effectiveDate) return
    onSave({
      nameZh: trimmedName,
      nameEn: trimmedName,
      descriptionZh: isMinimal ? '' : responsibilities.trim(),
      descriptionEn: isMinimal ? '' : responsibilities.trim(),
      parentId: parentDepartment.id,
      departmentCode,
      departmentType: isMinimal ? '' : departmentType,
      effectiveDate: isMinimal ? todayIsoDate() : effectiveDate,
      establishedDate: isMinimal ? '' : establishedDate,
    })
  }

  const canSave = isMinimal
    ? nameZh.trim().length > 0
    : nameZh.trim().length > 0 && effectiveDate.length > 0

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--department-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--dept-edit">
          <h2 id={titleId} className="ac-modal-title">{acT(locale, 'departmentAddChildTitle')}</h2>
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
            <span className="ac-dept-edit-label">{acT(locale, 'departmentFieldParent')}</span>
            <div className="ac-dept-edit-supervisor-field ac-dept-edit-supervisor-field--readonly">
              <div className="ac-dept-edit-supervisor-value">
                <span className="ac-dept-bulk-parent-chip">
                  <span className="ac-dept-bulk-parent-chip-label">{parentLabel}</span>
                </span>
              </div>
            </div>
          </div>

          {!isMinimal ? (
            <>
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
              value={responsibilities}
              placeholder={acT(locale, 'formInputPlaceholder')}
              onChange={(event) => setResponsibilities(event.target.value)}
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
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-established`}>
              {acT(locale, 'departmentFieldEstablishedDate')}
            </label>
            <input
              id={`${titleId}-established`}
              type="date"
              className="ac-dept-edit-input ac-dept-edit-input--date"
              value={establishedDate}
              onChange={(event) => setEstablishedDate(event.target.value)}
            />
          </div>
            </>
          ) : null}
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
  )
}
