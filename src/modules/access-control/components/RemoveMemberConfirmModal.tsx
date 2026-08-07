import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'

type RemoveMemberConfirmModalProps = {
  locale: AppLocale
  open: boolean
  memberName: string
  onClose: () => void
  onConfirm: () => void
}

export function RemoveMemberConfirmModal({
  locale,
  open,
  memberName,
  onClose,
  onConfirm,
}: RemoveMemberConfirmModalProps) {
  if (!open) return null

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ac-member-remove-title"
        aria-describedby="ac-member-remove-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-member-remove-title" className="ac-modal-title">
          {acT(locale, 'memberRemoveConfirmTitle')}
        </h2>
        <p id="ac-member-remove-desc" className="ac-modal-hint">
          {acT(locale, 'memberRemoveConfirmMessage').replace('{name}', memberName)}
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn ac-btn--danger" onClick={onConfirm}>
            {acT(locale, 'removeMember')}
          </button>
        </div>
      </div>
    </div>
  )
}
