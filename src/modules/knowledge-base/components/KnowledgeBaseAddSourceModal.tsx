import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

export type KnowledgeBaseAddSourceKind = 'local' | 'integration'

type KnowledgeBaseAddSourceModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onPick: (kind: KnowledgeBaseAddSourceKind) => void
}

function LocalDocIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M4 6a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 4v6h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IntegrationIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M7.5 7.5l2 2M14.5 14.5l2 2M16.5 7.5l-2 2M9.5 14.5l-2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function KnowledgeBaseAddSourceModal({
  locale,
  open,
  onClose,
  onPick,
}: KnowledgeBaseAddSourceModalProps) {
  if (!open) return null

  const options: { kind: KnowledgeBaseAddSourceKind; icon: typeof LocalDocIcon; titleKey: 'addSourceLocal' | 'addSourceIntegration'; descKey: 'addSourceLocalDesc' | 'addSourceIntegrationDesc' }[] = [
    { kind: 'local', icon: LocalDocIcon, titleKey: 'addSourceLocal', descKey: 'addSourceLocalDesc' },
    { kind: 'integration', icon: IntegrationIcon, titleKey: 'addSourceIntegration', descKey: 'addSourceIntegrationDesc' },
  ]

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--source"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-add-source-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-add-source-title" className="kb-modal-title">
          {kbT(locale, 'addSourceTitle')}
        </h2>
        <p className="kb-modal-hint">{kbT(locale, 'addSourceHint')}</p>
        <ul className="kb-source-options" role="list">
          {options.map(({ kind, icon: Icon, titleKey, descKey }) => (
            <li key={kind}>
              <button
                type="button"
                className="kb-source-option"
                onClick={() => onPick(kind)}
              >
                <span className="kb-source-option-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="kb-source-option-text">
                  <span className="kb-source-option-title">{kbT(locale, titleKey)}</span>
                  <span className="kb-source-option-desc">{kbT(locale, descKey)}</span>
                </span>
                <span className="kb-source-option-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
