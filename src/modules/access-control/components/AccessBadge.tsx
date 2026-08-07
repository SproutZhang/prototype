import type { AppLocale } from '../../../i18n/homeStrings'
import { accessModeBadgeLabel } from '../i18n/strings'
import type { AccessBadgeMode } from '../types'

type AccessBadgeProps = {
  locale: AppLocale
  mode: AccessBadgeMode
  className?: string
}

export function AccessBadge({ locale, mode, className }: AccessBadgeProps) {
  const label = accessModeBadgeLabel(locale, mode)
  const classes = ['ac-access-badge', `ac-access-badge--${mode}`, className].filter(Boolean).join(' ')

  return <span className={classes}>{label}</span>
}
