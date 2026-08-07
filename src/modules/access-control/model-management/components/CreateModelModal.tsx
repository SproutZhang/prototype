import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { MODEL_PROVIDERS, MODEL_TYPES, type ModelType } from '../data/modelsSeed'
import type { CreateModelPayload } from '../hooks/useModelsSectionController'
import { modelTypeLabel } from '../utils/modelLabels'

type CreateModelModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateModelPayload) => void
}

export function CreateModelModal({ locale, open, onClose, onCreate }: CreateModelModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<string>(MODEL_PROVIDERS[0])
  const [type, setType] = useState<ModelType>('chat')
  const [modelId, setModelId] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setProvider(MODEL_PROVIDERS[0])
    setType('chat')
    setModelId('')
  }, [open])

  if (!open) return null

  const canSubmit = name.trim().length > 0 && modelId.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onCreate({
      name: name.trim(),
      provider,
      type,
      modelId: modelId.trim(),
    })
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
          {acT(locale, 'modelCreateTitle')}
        </h2>

        <div className="ac-dept-edit-body">
          <p className="ac-modal-hint">{acT(locale, 'modelCreateHint')}</p>
          <div className="ac-dept-edit-field">
            <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
              {acT(locale, 'modelColumnName')}
            </label>
            <input
              id={`${titleId}-name`}
              type="text"
              className="ac-dept-edit-input"
              value={name}
              placeholder={acT(locale, 'modelNamePlaceholder')}
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
              placeholder={acT(locale, 'modelIdPlaceholder')}
              onChange={(event) => setModelId(event.target.value)}
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
            {acT(locale, 'modelCreateConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
