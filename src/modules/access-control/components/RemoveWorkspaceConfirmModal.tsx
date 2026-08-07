import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'

type RemoveWorkspaceConfirmModalProps = {
  locale: AppLocale
  open: boolean
  workspaceLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function RemoveWorkspaceConfirmModal({
  locale,
  open,
  workspaceLabel,
  onClose,
  onConfirm,
}: RemoveWorkspaceConfirmModalProps) {
  if (!open) return null

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ac-workspace-remove-title"
        aria-describedby="ac-workspace-remove-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-workspace-remove-title" className="ac-modal-title">
          {acT(locale, 'deleteWorkspaceConfirmTitle')}
        </h2>
        <p id="ac-workspace-remove-desc" className="ac-modal-hint">
          {acT(locale, 'deleteWorkspaceConfirmMessage').replace('{name}', workspaceLabel)}
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn ac-btn--danger" onClick={onConfirm}>
            {acT(locale, 'removeWorkspace')}
          </button>
        </div>
      </div>
    </div>
  )
}
