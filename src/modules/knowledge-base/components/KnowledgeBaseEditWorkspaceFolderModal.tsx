import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseWorkspaceFolder } from '../types'

type KnowledgeBaseEditWorkspaceFolderModalProps = {
  locale: AppLocale
  folder: KnowledgeBaseWorkspaceFolder | null
  onClose: () => void
  onSubmit: (folderId: string, name: string) => boolean
}

export function KnowledgeBaseEditWorkspaceFolderModal({
  locale,
  folder,
  onClose,
  onSubmit,
}: KnowledgeBaseEditWorkspaceFolderModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!folder) return
    setName(locale === 'zh' ? folder.nameZh : folder.nameEn)
    setError(null)
  }, [folder, locale])

  if (!folder) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const ok = onSubmit(folder.id, name)
    if (!ok) {
      setError(kbT(locale, 'createFolderErrorDuplicate'))
      return
    }
    setError(null)
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--new-folder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-edit-workspace-folder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <h2 id="kb-edit-workspace-folder-title" className="kb-modal-title">
            {kbT(locale, 'editWorkspaceFolderTitle')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>
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
            <button type="submit" className="agents-btn agents-btn-primary">
              {kbT(locale, 'editWorkspaceFolderConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
