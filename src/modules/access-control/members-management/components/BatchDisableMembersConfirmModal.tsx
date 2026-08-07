import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type BatchDisableMembersConfirmModalProps = {
  locale: AppLocale
  open: boolean
  count: number
  onClose: () => void
  onConfirm: () => void
}

export function BatchDisableMembersConfirmModal({
  locale,
  open,
  count,
  onClose,
  onConfirm,
}: BatchDisableMembersConfirmModalProps) {
  if (!open) return null

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ac-batch-disable-title"
        aria-describedby="ac-batch-disable-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-batch-disable-title" className="ac-modal-title">
          {acT(locale, 'memberBatchDisableConfirmTitle')}
        </h2>
        <p id="ac-batch-disable-desc" className="ac-modal-hint">
          {acT(locale, 'memberBatchDisableConfirmMessage').replace('{count}', String(count))}
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn ac-btn--danger" onClick={onConfirm}>
            {acT(locale, 'memberBatchDisableConfirmAction')}
          </button>
        </div>
      </div>
    </div>
  )
}
