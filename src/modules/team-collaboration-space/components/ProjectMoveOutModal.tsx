import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'

type ProjectMoveOutModalProps = {
  locale: AppLocale
  open: boolean
  projectName: string
  targets: Array<{ id: string; name: string }>
  onClose: () => void
  onConfirm: (targetGroupId: string) => void
}

export function ProjectMoveOutModal({
  locale,
  open,
  projectName,
  targets,
  onClose,
  onConfirm,
}: ProjectMoveOutModalProps) {
  const [targetGroupId, setTargetGroupId] = useState('')

  useEffect(() => {
    if (!open) return
    setTargetGroupId(targets[0]?.id ?? '')
  }, [open, targets])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!targetGroupId) return
    onConfirm(targetGroupId)
    onClose()
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tcs-modal tcs-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tcs-move-project-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tcs-move-project-title" className="tcs-modal-title">
          {tcsT(locale, 'moveProjectTitle')}
        </h2>
        <form className="tcs-modal-form" onSubmit={handleSubmit}>
          <p className="tcs-modal-hint">
            {tcsT(locale, 'moveProjectHint').replace('{name}', projectName)}
          </p>
          <label className="tcs-field">
            <span>{tcsT(locale, 'moveProjectTarget')}</span>
            <select
              value={targetGroupId}
              onChange={(event) => setTargetGroupId(event.target.value)}
              disabled={targets.length === 0}
            >
              {targets.length === 0 ? (
                <option value="">{tcsT(locale, 'moveProjectNoTargets')}</option>
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
              disabled={!targetGroupId}
            >
              {tcsT(locale, 'moveProjectConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
