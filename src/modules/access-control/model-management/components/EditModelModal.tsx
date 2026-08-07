import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { MODEL_PROVIDERS, MODEL_TYPES, type ModelRow, type ModelStatus, type ModelType } from '../data/modelsSeed'
import type { EditModelPayload } from '../hooks/useModelsSectionController'
import { modelTypeLabel } from '../utils/modelLabels'

type EditModelModalProps = {
  locale: AppLocale
  open: boolean
  model: ModelRow | null
  onClose: () => void
  onSave: (id: string, payload: EditModelPayload) => void
}

export function EditModelModal({ locale, open, model, onClose, onSave }: EditModelModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<string>(MODEL_PROVIDERS[0])
  const [type, setType] = useState<ModelType>('chat')
  const [modelId, setModelId] = useState('')
  const [status, setStatus] = useState<ModelStatus>('active')

  useEffect(() => {
    if (!open || !model) return
    setName(model.name)
    setProvider(model.provider)
    setType(model.type)
    setModelId(model.modelId)
    setStatus(model.status)
  }, [open, model])

  if (!open || !model) return null

  const canSubmit = name.trim().length > 0 && modelId.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave(model.id, {
      name: name.trim(),
      provider,
      type,
      modelId: modelId.trim(),
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
          {acT(locale, 'modelEditTitle')}
        </h2>

        <div className="ac-dept-edit-body">
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
              {acT(locale, 'modelColumnName')}
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
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-provider`}>
              {acT(locale, 'modelColumnProvider')}
            </label>
            <select
              id={`${titleId}-provider`}
              className="ac-dept-edit-input"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              {MODEL_PROVIDERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-type`}>
              {acT(locale, 'modelColumnType')}
            </label>
            <select
              id={`${titleId}-type`}
              className="ac-dept-edit-input"
              value={type}
              onChange={(event) => setType(event.target.value as ModelType)}
            >
              {MODEL_TYPES.map((item) => (
                <option key={item} value={item}>
                  {modelTypeLabel(locale, item)}
                </option>
              ))}
            </select>
          </div>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-modelId`}>
              {acT(locale, 'modelColumnModelId')}
            </label>
            <input
              id={`${titleId}-modelId`}
              type="text"
              className="ac-dept-edit-input"
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
            />
          </div>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-status`}>
              {acT(locale, 'modelColumnStatus')}
            </label>
            <select
              id={`${titleId}-status`}
              className="ac-dept-edit-input"
              value={status}
              onChange={(event) => setStatus(event.target.value as ModelStatus)}
            >
              <option value="active">{acT(locale, 'modelStatusActive')}</option>
              <option value="disabled">{acT(locale, 'modelStatusDisabled')}</option>
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
