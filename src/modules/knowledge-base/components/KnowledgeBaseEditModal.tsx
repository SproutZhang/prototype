import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseCreateDraft, KnowledgeBaseItem } from '../types'

type KnowledgeBaseEditModalProps = {
  locale: AppLocale
  item: KnowledgeBaseItem | null
  onClose: () => void
  onSubmit: (itemId: string, draft: KnowledgeBaseCreateDraft) => void
}

export function KnowledgeBaseEditModal({
  locale,
  item,
  onClose,
  onSubmit,
}: KnowledgeBaseEditModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!item) return
    setName(locale === 'zh' ? item.nameZh : item.nameEn)
    setDescription(locale === 'zh' ? item.descriptionZh : item.descriptionEn)
  }, [item, locale])

  if (!item) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(item.id, { name: trimmed, description: description.trim() })
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-edit-kb-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-edit-kb-title" className="kb-modal-title">
          {kbT(locale, 'editKbTitle')}
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
            <button type="submit" className="agents-btn agents-btn-primary">
              {kbT(locale, 'editKbConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
