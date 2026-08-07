import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type ThirdPartyImportDepartmentsModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
}

const INTEGRATION_KEYS = [
  'departmentThirdPartyFeishu',
  'departmentThirdPartyWecom',
  'departmentThirdPartyDingtalk',
] as const

export function ThirdPartyImportDepartmentsModal({
  locale,
  open,
  onClose,
}: ThirdPartyImportDepartmentsModalProps) {
  if (!open) return null

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--department-third-party"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-dept-third-party-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-dept-third-party-title" className="ac-modal-title">
          {acT(locale, 'departmentThirdPartyImportTitle')}
        </h2>
        <p className="ac-dept-third-party-desc">{acT(locale, 'departmentThirdPartyImportDesc')}</p>
        <ul className="ac-dept-third-party-list">
          {INTEGRATION_KEYS.map((key) => (
            <li key={key}>
              <button type="button" className="ac-dept-third-party-item" onClick={onClose}>
                {acT(locale, key)}
              </button>
            </li>
          ))}
        </ul>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
