import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type BatchDeleteMembersConfirmModalProps = {
  locale: AppLocale
  open: boolean
  count: number
  onClose: () => void
  onConfirm: () => void
}

export function BatchDeleteMembersConfirmModal({
  locale,
  open,
  count,
  onClose,
  onConfirm,
}: BatchDeleteMembersConfirmModalProps) {
  if (!open) return null

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ac-batch-delete-title"
        aria-describedby="ac-batch-delete-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-batch-delete-title" className="ac-modal-title">
          {acT(locale, 'memberBatchDeleteDirectConfirmTitle')}
        </h2>
        <p id="ac-batch-delete-desc" className="ac-modal-hint">
          {acT(locale, 'memberBatchDeleteDirectConfirmMessage').replace('{count}', String(count))}
        </p>
        <p className="ac-modal-hint ac-modal-hint--danger">
          {acT(locale, 'memberBatchDeleteDirectConfirmWarning')}
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn ac-btn--danger" onClick={onConfirm}>
            {acT(locale, 'memberBatchDeleteDirectConfirmAction')}
          </button>
        </div>
      </div>
    </div>
  )
}
