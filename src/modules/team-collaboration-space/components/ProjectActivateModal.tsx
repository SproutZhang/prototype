import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeSpaceName, tcsT } from '../i18n/strings'
import type { TeamCollaborationSpaceItem } from '../types'

export type ProjectActivateDraft = {
  deadlineStart: string | null
  deadlineEnd: string | null
}

type ProjectDeadlineKind = 'permanent' | 'custom'

type ProjectActivateModalProps = {
  locale: AppLocale
  open: boolean
  space: TeamCollaborationSpaceItem | null
  onClose: () => void
  onConfirm: (draft: ProjectActivateDraft) => void
}

function resolveInitialDeadlineKind(
  start: string | null | undefined,
  end: string | null | undefined,
): ProjectDeadlineKind {
  if (start?.trim() || end?.trim()) return 'custom'
  return 'permanent'
}

export function ProjectActivateModal({
  locale,
  open,
  space,
  onClose,
  onConfirm,
}: ProjectActivateModalProps) {
  const [deadlineKind, setDeadlineKind] = useState<ProjectDeadlineKind>('permanent')
  const [deadlineStart, setDeadlineStart] = useState('')
  const [deadlineEnd, setDeadlineEnd] = useState('')

  useEffect(() => {
    if (!open || !space) return
    const start = space.deadlineStart ?? ''
    const end = space.deadlineEnd ?? ''
    setDeadlineKind(resolveInitialDeadlineKind(start, end))
    setDeadlineStart(start)
    setDeadlineEnd(end)
  }, [open, space])

  if (!open || !space) return null

  const spaceName = localizeSpaceName(space, locale)
  const customIncomplete =
    deadlineKind === 'custom' && (!deadlineStart.trim() || !deadlineEnd.trim())

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (customIncomplete) return
    onConfirm({
      deadlineStart: deadlineKind === 'custom' ? deadlineStart.trim() || null : null,
      deadlineEnd: deadlineKind === 'custom' ? deadlineEnd.trim() || null : null,
    })
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tcs-modal tcs-modal--form tcs-modal--activate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tcs-project-activate-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tcs-modal-title-row">
          <h2 id="tcs-project-activate-title" className="tcs-modal-title">
            {tcsT(locale, 'projectSpaceActivateTitle')}
          </h2>
          <button
            type="button"
            className="tcs-modal-close"
            onClick={onClose}
            aria-label={tcsT(locale, 'modalClose')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <form className="tcs-modal-form tcs-modal-form--activate" onSubmit={handleSubmit}>
          <p className="tcs-modal-hint">
            {tcsT(locale, 'projectSpaceActivateHint').replace('{name}', spaceName)}
          </p>
          <fieldset className="tcs-deadline-fieldset">
            <legend>{tcsT(locale, 'formProjectDeadline')}</legend>
            <div
              className="tcs-deadline-mode-list"
              role="radiogroup"
              aria-label={tcsT(locale, 'formProjectDeadline')}
            >
              <label className="tcs-deadline-mode-option">
                <input
                  type="radio"
                  name="tcs-activate-deadline-mode"
                  value="permanent"
                  checked={deadlineKind === 'permanent'}
                  onChange={() => {
                    setDeadlineKind('permanent')
                    setDeadlineStart('')
                    setDeadlineEnd('')
                  }}
                />
                <span>{tcsT(locale, 'formProjectDeadlinePermanent')}</span>
              </label>
              <label className="tcs-deadline-mode-option">
                <input
                  type="radio"
                  name="tcs-activate-deadline-mode"
                  value="custom"
                  checked={deadlineKind === 'custom'}
                  onChange={() => setDeadlineKind('custom')}
                />
                <span>{tcsT(locale, 'formProjectDeadlineCustom')}</span>
              </label>
            </div>
            {deadlineKind === 'custom' ? (
              <div className="tcs-deadline-range">
                <label className="tcs-deadline-field">
                  <span className="tcs-deadline-field-label">
                    {tcsT(locale, 'formProjectDeadlineStart')}
                  </span>
                  <input
                    type="date"
                    value={deadlineStart}
                    max={deadlineEnd || undefined}
                    onChange={(event) => setDeadlineStart(event.target.value)}
                  />
                </label>
                <label className="tcs-deadline-field">
                  <span className="tcs-deadline-field-label">
                    {tcsT(locale, 'formProjectDeadlineEnd')}
                  </span>
                  <input
                    type="date"
                    value={deadlineEnd}
                    min={deadlineStart || undefined}
                    onChange={(event) => setDeadlineEnd(event.target.value)}
                  />
                </label>
              </div>
            ) : null}
            {customIncomplete ? (
              <p className="tcs-modal-hint">{tcsT(locale, 'projectSpaceActivateDeadlineRequired')}</p>
            ) : null}
          </fieldset>
          <div className="tcs-modal-actions">
            <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>
              {tcsT(locale, 'formCancel')}
            </button>
            <button type="submit" className="agents-btn agents-btn-primary" disabled={customIncomplete}>
              {tcsT(locale, 'projectSpaceActivateConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
