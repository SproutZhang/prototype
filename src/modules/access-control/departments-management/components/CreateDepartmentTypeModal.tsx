import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { CreateDepartmentTypePayload } from '../data/departmentTypeCatalog'

type CreateDepartmentTypeModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onSave: (payload: CreateDepartmentTypePayload) => void
}

export function CreateDepartmentTypeModal({
  locale,
  open,
  onClose,
  onSave,
}: CreateDepartmentTypeModalProps) {
  const titleId = useId()
  const [nameZh, setNameZh] = useState('')
  const [descriptionZh, setDescriptionZh] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')

  useEffect(() => {
    if (!open) return
    setNameZh('')
    setDescriptionZh('')
    setDescriptionEn('')
  }, [open])

  if (!open) return null

  const descriptionValue = locale === 'zh' ? descriptionZh : descriptionEn
  const canSave = nameZh.trim().length > 0

  const handleSave = () => {
    const trimmedName = nameZh.trim()
    if (!trimmedName) return
    const trimmedDescription = descriptionValue.trim()
    onSave({
      nameZh: trimmedName,
      nameEn: trimmedName,
      descriptionZh: locale === 'zh' ? trimmedDescription : descriptionZh.trim(),
      descriptionEn: locale === 'en' ? trimmedDescription : descriptionEn.trim(),
    })
  }

  return (
    <div className="ac-modal-overlay ac-modal-overlay--nested" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--department-edit ac-modal--department-type-create"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--dept-edit">
          <h2 id={titleId} className="ac-modal-title">{acT(locale, 'departmentTypeCreateTitle')}</h2>
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
              {acT(locale, 'departmentTypeFieldTitle')}
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
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-description`}>
              {acT(locale, 'departmentTypeFieldDescription')}
            </label>
            <textarea
              id={`${titleId}-description`}
              className="ac-dept-edit-textarea"
              rows={3}
              value={descriptionValue}
              placeholder={acT(locale, 'formInputPlaceholder')}
              onChange={(event) => {
                if (locale === 'zh') setDescriptionZh(event.target.value)
                else setDescriptionEn(event.target.value)
              }}
            />
          </div>
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
