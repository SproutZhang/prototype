import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { CreateApiKeyPayload } from '../hooks/useApiKeysSectionController'

type CreateApiKeyModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateApiKeyPayload) => void
}

export function CreateApiKeyModal({ locale, open, onClose, onCreate }: CreateApiKeyModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
  }, [open])

  if (!open) return null

  const canSubmit = name.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onCreate({ name: name.trim(), description: description.trim() })
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--api-key-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ac-modal-title">
          {acT(locale, 'apiKeyCreateTitle')}
        </h2>

        <div className="ac-dept-edit-body">
          <p className="ac-modal-hint">{acT(locale, 'apiKeyCreateHint')}</p>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
              {acT(locale, 'apiKeyColumnName')}
            </label>
            <input
              id={`${titleId}-name`}
              type="text"
              className="ac-dept-edit-input"
              value={name}
              placeholder={acT(locale, 'apiKeyNamePlaceholder')}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-desc`}>
              {acT(locale, 'apiKeyColumnDescription')}
            </label>
            <textarea
              id={`${titleId}-desc`}
              className="ac-dept-edit-textarea"
              rows={3}
              value={description}
              placeholder={acT(locale, 'apiKeyDescriptionPlaceholder')}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {acT(locale, 'apiKeyCreateConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
