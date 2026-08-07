import { useEffect, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeWorkspaceRowName, type WorkspaceRow } from '../data/workspacesSeed'
import { acT } from '../i18n/strings'

export type EditWorkspacePayload = {
  name: string
  description: string
}

type EditWorkspaceModalProps = {
  locale: AppLocale
  open: boolean
  workspace: WorkspaceRow | null
  onClose: () => void
  onSave: (workspaceId: string, payload: EditWorkspacePayload) => void
}

type FormErrors = Partial<Record<'name', string>>

function ModalCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EditWorkspaceModal({
  locale,
  open,
  workspace,
  onClose,
  onSave,
}: EditWorkspaceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open || !workspace) return
    setName(localizeWorkspaceRowName(workspace, locale))
    setDescription(locale === 'zh' ? workspace.descriptionZh : workspace.descriptionEn)
    setErrors({})
  }, [open, workspace, locale])

  if (!open || !workspace) return null

  const handleSubmit = () => {
    const nextErrors: FormErrors = {}
    if (!name.trim()) nextErrors.name = acT(locale, 'createNewUserRequired')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSave(workspace.id, {
      name: name.trim(),
      description: description.trim(),
    })
    onClose()
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--create-user"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-edit-workspace-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row">
          <h2 id="ac-edit-workspace-title" className="ac-modal-title">
            {acT(locale, 'editWorkspace')}
          </h2>
          <button
            type="button"
            className="ac-modal-close"
            aria-label={acT(locale, 'modalClose')}
            onClick={onClose}
          >
            <ModalCloseIcon />
          </button>
        </div>
        <div className="ac-modal-form ac-modal-form--create-user">
          <label className="ac-field">
            <span>{acT(locale, 'createSpaceName')}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              autoComplete="off"
            />
            {errors.name ? <span className="ac-field-error">{errors.name}</span> : null}
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'createSpaceDescription')}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </label>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={handleSubmit}>
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
