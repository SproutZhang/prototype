import { useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseCreateDraft } from '../types'

type KnowledgeBaseCreateModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onSubmit: (draft: KnowledgeBaseCreateDraft) => void
}

export function KnowledgeBaseCreateModal({
  locale,
  open,
  onClose,
  onSubmit,
}: KnowledgeBaseCreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({ name: trimmed, description: description.trim() })
    setName('')
    setDescription('')
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-create-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-create-title" className="kb-modal-title">
          {kbT(locale, 'createTitle')}
        </h2>
        <form className="kb-modal-form" onSubmit={handleSubmit}>
          <label className="kb-field">
            <span>{kbT(locale, 'createName')}</span>
            <input type="text" value={name} required onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="kb-field">
            <span>{kbT(locale, 'createDesc')}</span>
            <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="kb-modal-actions">
            <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--solid">
              {kbT(locale, 'createConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
