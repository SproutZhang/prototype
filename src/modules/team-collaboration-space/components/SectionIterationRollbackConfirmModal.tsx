import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import type { SectionIterationRecord } from '../types/sectionIteration'

type SectionIterationRollbackConfirmModalProps = {
  locale: AppLocale
  record: SectionIterationRecord
  onCancel: () => void
  onConfirm: () => void
}

export function SectionIterationRollbackConfirmModal({
  locale,
  record,
  onCancel,
  onConfirm,
}: SectionIterationRollbackConfirmModalProps) {
  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="ac-modal ac-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="ac-modal-title">{tcsT(locale, 'resourceIterationRollbackTitle')}</h2>
        <p className="ac-modal-hint">
          {tcsT(locale, 'resourceIterationRollbackHint').replace('{version}', record.versionLabel)}
        </p>
        {record.requiresMigration ? (
          <p className="tcs-resource-iteration-rollback-warning">
            {locale === 'zh' ? record.migrationNoteZh : record.migrationNoteEn}
          </p>
        ) : null}
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onCancel}>
            {tcsT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={onConfirm}>
            {tcsT(locale, 'resourceIterationRollbackConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
