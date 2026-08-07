import { useLocale } from '../i18n/LocaleContext'

export type HomeOnboardingShortcutsProps = {
  onMulti: () => void
  onSingle: () => void
}

/** 首页：辅助新员工入职 / 新员工入职工作流 快捷入口（落地页与会话页共用，点击由父组件写入输入框） */
export function HomeOnboardingShortcuts({ onMulti, onSingle }: HomeOnboardingShortcutsProps) {
  const { t } = useLocale()

  return (
    <div className="manus-home-session-onboard-actions" role="group" aria-label={t('onboardShortcutsAriaLabel')}>
      <button type="button" className="manus-home-session-onboard-pill" onClick={onMulti}>
        <span className="manus-home-session-onboard-pill-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
            <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <ellipse cx="12" cy="12" rx="3.25" ry="7.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <path d="M4.5 12h15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <span className="manus-home-session-onboard-pill-label">{t('onboardShortcutAgent')}</span>
      </button>
      <button type="button" className="manus-home-session-onboard-pill" onClick={onSingle}>
        <span className="manus-home-session-onboard-pill-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        </span>
        <span className="manus-home-session-onboard-pill-label">{t('onboardShortcutWorkflow')}</span>
      </button>
    </div>
  )
}
