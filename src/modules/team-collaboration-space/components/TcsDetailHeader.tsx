import type { ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'

type TcsDetailHeaderProps = {
  title: string
  subtitle?: ReactNode
  backLabel: string
  onBack: () => void
  onEdit?: () => void
  editLabel?: string
  editDisabled?: boolean
  editDisabledMessage?: string
  actions?: ReactNode
}

export function TcsDetailHeader({
  title,
  subtitle,
  backLabel,
  onBack,
  onEdit,
  editLabel,
  editDisabled = false,
  editDisabledMessage,
  actions,
}: TcsDetailHeaderProps) {
  const editHint = editDisabled && editDisabledMessage ? editDisabledMessage : editLabel

  return (
    <header className="agents-header skills-page-header tcs-detail-header">
      <div className="agents-header-lead tcs-detail-header-lead">
        <button type="button" className="agents-back-btn tcs-back-btn" onClick={onBack}>
          ← {backLabel}
        </button>
        <div
          className={[
            'tcs-detail-title-row',
            onEdit ? 'has-edit' : '',
            onEdit && editDisabled ? 'is-edit-disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="agents-title tcs-detail-title">{title}</div>
          {onEdit ? (
            <button
              type="button"
              className="tcs-detail-title-edit"
              aria-label={editLabel}
              title={editHint}
              disabled={editDisabled}
              onClick={onEdit}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                <path
                  d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
        {subtitle ? <div className="agents-subtitle tcs-detail-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="agents-header-actions">{actions}</div> : null}
    </header>
  )
}

export function tcsBackToListLabel(locale: AppLocale) {
  return tcsT(locale, 'backToList')
}

export function tcsBackToSpaceLabel(locale: AppLocale) {
  return tcsT(locale, 'backToSpace')
}
