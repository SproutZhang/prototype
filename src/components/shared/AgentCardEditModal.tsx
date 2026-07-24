import { useEffect, useId, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../i18n/homeStrings'
import './agent-card-edit-modal.css'

export type AgentCardEditDraft = {
  name: string
  description: string
}

type AgentCardEditModalProps = {
  locale: AppLocale
  open: boolean
  modalTitle: string
  nameLabel: string
  descriptionLabel: string
  cancelLabel: string
  saveLabel: string
  initialName: string
  initialDescription: string
  onClose: () => void
  onSave: (draft: AgentCardEditDraft) => void
}

export function AgentCardEditModal({
  locale: _locale,
  open,
  modalTitle,
  nameLabel,
  descriptionLabel,
  cancelLabel,
  saveLabel,
  initialName,
  initialDescription,
  onClose,
  onSave,
}: AgentCardEditModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setDescription(initialDescription)
  }, [open, initialName, initialDescription])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave({ name: trimmedName, description: description.trim() })
  }

  return (
    <div className="agent-card-edit-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="agent-card-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="agent-card-edit-modal-title">
          {modalTitle}
        </h2>
        <form className="agent-card-edit-modal-form" onSubmit={handleSubmit}>
          <label className="agent-card-edit-modal-field">
            <span>{nameLabel}</span>
            <input type="text" value={name} required onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="agent-card-edit-modal-field">
            <span>{descriptionLabel}</span>
            <textarea value={description} rows={3} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <div className="agent-card-edit-modal-actions">
            <button type="button" className="agent-card-edit-modal-btn agent-card-edit-modal-btn--secondary" onClick={onClose}>
              {cancelLabel}
            </button>
            <button type="submit" className="agent-card-edit-modal-btn agent-card-edit-modal-btn--primary">
              {saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
