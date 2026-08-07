import type { ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT, type TeamCollaborationSpaceTranslationKey } from '../i18n/strings'

type TcsContentEmptyStateProps = {
  locale: AppLocale
  messageKey?: TeamCollaborationSpaceTranslationKey
  children?: ReactNode
}

export function TcsContentEmptyIllustration() {
  return (
    <svg
      className="tcs-content-empty-illustration"
      viewBox="0 0 160 120"
      width="160"
      height="120"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M38 28 L52 18 L48 34 L58 38 L38 28 Z"
        fill="#2dd4bf"
      />
      <path
        d="M52 18 L58 38 L48 34 Z"
        fill="#14b8a6"
        opacity="0.55"
      />
      <path
        d="M48 52 C48 52 42 58 42 72 L42 88 C42 92 45 95 49 95 L111 95 C115 95 118 92 118 88 L118 72 C118 58 112 52 112 52 L108 48 L52 48 L48 52 Z"
        fill="#ececec"
      />
      <path
        d="M52 48 L108 48 L108 52 C108 52 118 58 118 72 L42 72 C42 58 48 52 48 52 L52 48 Z"
        fill="#e2e2e2"
      />
      <path
        d="M80 34 L86.8 58.4 L112 64 L86.8 69.6 L80 94 L73.2 69.6 L48 64 L73.2 58.4 Z"
        fill="#d8d8d8"
      />
      <ellipse cx="74" cy="62" rx="2.2" ry="3.2" fill="#b8b8b8" />
      <ellipse cx="86" cy="62" rx="2.2" ry="3.2" fill="#b8b8b8" />
      <path
        d="M76 72 Q80 74 84 72"
        fill="none"
        stroke="#b8b8b8"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TcsContentEmptyState({
  locale,
  messageKey = 'contentEmptyTitle',
  children,
}: TcsContentEmptyStateProps) {
  return (
    <div className="tcs-content-empty" role="status">
      <TcsContentEmptyIllustration />
      <p className="tcs-content-empty-label">{tcsT(locale, messageKey)}</p>
      {children}
    </div>
  )
}
