import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { ApiKeyRow, ApiKeyStatus } from '../data/apiKeysSeed'
import type { EditApiKeyPayload } from '../hooks/useApiKeysSectionController'

type EditApiKeyModalProps = {
  locale: AppLocale
  open: boolean
  apiKey: ApiKeyRow | null
  onClose: () => void
  onSave: (id: string, payload: EditApiKeyPayload) => void
}

export function EditApiKeyModal({ locale, open, apiKey, onClose, onSave }: EditApiKeyModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ApiKeyStatus>('active')

  useEffect(() => {
    if (!open || !apiKey) return
    setName(apiKey.name)
    setDescription(apiKey.description)
    setStatus(apiKey.status)
  }, [open, apiKey])

  if (!open || !apiKey) return null

  const canSubmit = name.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave(apiKey.id, {
      name: name.trim(),
      description: description.trim(),
      status,
    })
    onClose()
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
          {acT(locale, 'apiKeyEditTitle')}
        </h2>

        <div className="ac-dept-edit-body">
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
              {acT(locale, 'apiKeyColumnName')}
            </label>
            <input
              id={`${titleId}-name`}
              type="text"
              className="ac-dept-edit-input"
              value={name}
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
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-status`}>
              {acT(locale, 'apiKeyColumnStatus')}
            </label>
            <select
              id={`${titleId}-status`}
              className="ac-dept-edit-input"
              value={status}
              onChange={(event) => setStatus(event.target.value as ApiKeyStatus)}
            >
              <option value="active">{acT(locale, 'apiKeyStatusActive')}</option>
              <option value="disabled">{acT(locale, 'apiKeyStatusDisabled')}</option>
            </select>
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
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
