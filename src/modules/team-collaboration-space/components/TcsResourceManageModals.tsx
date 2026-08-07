import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'

type TcsMoveResourceModalProps = {
  locale: AppLocale
  open: boolean
  resourceName: string
  targets: Array<{ id: string; name: string }>
  onClose: () => void
  onConfirm: (targetSpaceId: string) => void
}

export function TcsMoveResourceModal({
  locale,
  open,
  resourceName,
  targets,
  onClose,
  onConfirm,
}: TcsMoveResourceModalProps) {
  const [targetSpaceId, setTargetSpaceId] = useState('')

  useEffect(() => {
    if (!open) return
    setTargetSpaceId(targets[0]?.id ?? '')
  }, [open, targets])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!targetSpaceId) return
    onConfirm(targetSpaceId)
    onClose()
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tcs-modal tcs-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tcs-move-resource-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tcs-move-resource-title" className="tcs-modal-title">
          {tcsT(locale, 'moveResourceTitle')}
        </h2>
        <form className="tcs-modal-form" onSubmit={handleSubmit}>
          <p className="tcs-modal-hint">
            {tcsT(locale, 'moveResourceHint').replace('{name}', resourceName)}
          </p>
          <label className="tcs-field">
            <span>{tcsT(locale, 'moveResourceTarget')}</span>
            <select
              value={targetSpaceId}
              onChange={(event) => setTargetSpaceId(event.target.value)}
              disabled={targets.length === 0}
            >
              {targets.length === 0 ? (
                <option value="">{tcsT(locale, 'moveResourceNoTargets')}</option>
              ) : (
                targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="tcs-modal-actions">
            <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>
              {tcsT(locale, 'formCancel')}
            </button>
            <button
              type="submit"
              className="agents-btn agents-btn-primary"
              disabled={!targetSpaceId}
            >
              {tcsT(locale, 'moveResourceConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type TcsRemoveResourceModalProps = {
  locale: AppLocale
  open: boolean
  resourceName: string
  onClose: () => void
  onConfirm: () => void
}

export function TcsRemoveResourceModal({
  locale,
  open,
  resourceName,
  onClose,
  onConfirm,
}: TcsRemoveResourceModalProps) {
  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onConfirm()
    onClose()
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tcs-modal tcs-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tcs-remove-resource-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tcs-remove-resource-title" className="tcs-modal-title">
          {tcsT(locale, 'removeResourceTitle')}
        </h2>
        <form className="tcs-modal-form" onSubmit={handleSubmit}>
          <p className="tcs-modal-hint">
            {tcsT(locale, 'removeResourceHint').replace('{name}', resourceName)}
          </p>
          <div className="tcs-modal-actions">
            <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>
              {tcsT(locale, 'formCancel')}
            </button>
            <button type="submit" className="agents-btn tcs-btn--danger">
              {tcsT(locale, 'removeResourceConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
