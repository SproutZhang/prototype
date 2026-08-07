import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeZoneName, tcsT } from '../i18n/strings'
import type { CollaborationZone, ZoneDeleteMode } from '../types'

type TcsZoneDeleteModalProps = {
  locale: AppLocale
  open: boolean
  zone: CollaborationZone | null
  onClose: () => void
  onConfirm: (mode: ZoneDeleteMode) => void
}

export function TcsZoneDeleteModal({ locale, open, zone, onClose, onConfirm }: TcsZoneDeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [mode, setMode] = useState<ZoneDeleteMode>('move_to_space')
  const [confirmName, setConfirmName] = useState('')

  if (!open || !zone) return null

  const zoneName = localizeZoneName(zone, locale)
  const count = zone.resourceCount

  const reset = () => {
    setStep(1)
    setMode('move_to_space')
    setConfirmName('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFirstConfirm = () => {
    if (mode === 'delete_all') {
      setStep(2)
      return
    }
    onConfirm(mode)
    handleClose()
  }

  const handlePermanentDelete = () => {
    if (confirmName.trim() !== zoneName) return
    onConfirm('delete_all')
    handleClose()
  }

  if (step === 2) {
    return (
      <div className="tcs-modal-overlay" role="presentation" onClick={handleClose}>
        <div className="tcs-modal tcs-modal--danger" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <h2 className="tcs-modal-title tcs-modal-title--danger">{tcsT(locale, 'deleteZoneDangerTitle')}</h2>
          <p className="tcs-modal-hint">
            {tcsT(locale, 'deleteZoneDangerHint').replace('{name}', zoneName).replace('{count}', String(count))}
          </p>
          <label className="tcs-field">
            <span>{tcsT(locale, 'deleteZoneTypeName').replace('{name}', zoneName)}</span>
            <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
          </label>
          <div className="tcs-modal-actions">
            <button type="button" className="tcs-btn tcs-btn--secondary" onClick={handleClose}>
              {tcsT(locale, 'formCancel')}
            </button>
            <button
              type="button"
              className="agents-btn tcs-btn--danger"
              disabled={confirmName.trim() !== zoneName}
              onClick={handlePermanentDelete}
            >
              {tcsT(locale, 'deleteZonePermanent')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={handleClose}>
      <div className="tcs-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="tcs-modal-title">{tcsT(locale, 'deleteZoneTitle')}</h2>
        <p className="tcs-modal-hint">{tcsT(locale, 'deleteZoneHint').replace('{count}', String(count))}</p>
        <div className="tcs-access-mode-list">
          <label className="tcs-access-mode-option">
            <input
              type="radio"
              name="zone-delete-mode"
              checked={mode === 'move_to_space'}
              onChange={() => setMode('move_to_space')}
            />
            <span className="tcs-access-mode-option-body">
              <span className="tcs-access-mode-option-title">{tcsT(locale, 'deleteZoneMove')}</span>
              <span className="tcs-access-mode-option-hint">{tcsT(locale, 'deleteZoneMoveDesc')}</span>
            </span>
          </label>
          <label className="tcs-access-mode-option">
            <input
              type="radio"
              name="zone-delete-mode"
              checked={mode === 'delete_all'}
              onChange={() => setMode('delete_all')}
            />
            <span className="tcs-access-mode-option-body">
              <span className="tcs-access-mode-option-title">{tcsT(locale, 'deleteZoneDeleteAll')}</span>
              <span className="tcs-access-mode-option-hint">{tcsT(locale, 'deleteZoneDeleteAllDesc')}</span>
            </span>
          </label>
        </div>
        <div className="tcs-modal-actions">
          <button type="button" className="tcs-btn tcs-btn--secondary" onClick={handleClose}>
            {tcsT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={handleFirstConfirm}>
            {tcsT(locale, 'deleteZoneConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
