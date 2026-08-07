import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseCreateFolderModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => boolean
}

function FolderPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M3.5 5.5h5.2l1.2 1.4h6.6v8.6a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10 9v4M8 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function KnowledgeBaseCreateFolderModal({
  locale,
  open,
  onClose,
  onSubmit,
}: KnowledgeBaseCreateFolderModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setError(null)
  }, [open])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const ok = onSubmit(name)
    if (!ok) {
      setError(kbT(locale, 'createFolderErrorDuplicate'))
      return
    }
    setName('')
    setError(null)
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--new-folder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-create-folder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <h2 id="kb-create-folder-title" className="kb-modal-title">
            {kbT(locale, 'createFolderTitle')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="kb-modal-hint">{kbT(locale, 'createFolderHint')}</p>
        <form className="kb-modal-form" onSubmit={handleSubmit}>
          <label className="kb-field">
            <span>{kbT(locale, 'createFolderName')}</span>
            <input
              type="text"
              value={name}
              required
              placeholder={kbT(locale, 'createFolderNamePlaceholder')}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          </label>
          {error ? <p className="kb-modal-error">{error}</p> : null}
          <div className="kb-modal-actions">
            <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--solid kb-btn--with-icon">
              <FolderPlusIcon />
              <span>{kbT(locale, 'createFolderConfirm')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
