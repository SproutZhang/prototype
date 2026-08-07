import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'

type RemoveRoleConfirmModalProps = {
  locale: AppLocale
  open: boolean
  roleLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function RemoveRoleConfirmModal({
  locale,
  open,
  roleLabel,
  onClose,
  onConfirm,
}: RemoveRoleConfirmModalProps) {
  if (!open) return null

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ac-role-remove-title"
        aria-describedby="ac-role-remove-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-role-remove-title" className="ac-modal-title">
          {acT(locale, 'roleRemoveConfirmTitle')}
        </h2>
        <p id="ac-role-remove-desc" className="ac-modal-hint">
          {acT(locale, 'roleRemoveConfirmMessage').replace('{name}', roleLabel)}
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn ac-btn--danger" onClick={onConfirm}>
            {acT(locale, 'removeRole')}
          </button>
        </div>
      </div>
    </div>
  )
}
