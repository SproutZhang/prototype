import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type RemoveDepartmentConfirmModalProps = {
  locale: AppLocale
  open: boolean
  departmentLabel?: string
  memberCount?: number
  bulkCount?: number
  nested?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RemoveDepartmentConfirmModal({
  locale,
  open,
  departmentLabel = '',
  memberCount = 0,
  bulkCount = 0,
  nested = false,
  onClose,
  onConfirm,
}: RemoveDepartmentConfirmModalProps) {
  if (!open) return null

  const isBulk = bulkCount > 1
  const blocked = !isBulk && memberCount > 0
  const hint = blocked
    ? acT(locale, 'departmentRemoveBlockedMessage')
    : isBulk
      ? acT(locale, 'departmentBulkRemoveConfirmMessage').replace('{count}', String(bulkCount))
      : acT(locale, 'departmentRemoveConfirmMessage').replace('{name}', departmentLabel)

  return (
    <div
      className={`ac-modal-overlay${nested ? ' ac-modal-overlay--nested' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ac-department-remove-title"
        aria-describedby="ac-department-remove-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-department-remove-title" className="ac-modal-title">
          {acT(locale, 'departmentRemoveConfirmTitle')}
        </h2>
        <p id="ac-department-remove-desc" className="ac-modal-hint">{hint}</p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          {!blocked ? (
            <button type="button" className="agents-btn ac-btn--danger" onClick={onConfirm}>
              {acT(locale, 'removeDepartment')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
