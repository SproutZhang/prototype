import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import { TcsContentEmptyState } from './TcsContentEmptyState'

type TeamCollaborationSpaceEmptyStateProps = {
  locale: AppLocale
  variant?: 'team' | 'personal'
}

export function TeamCollaborationSpaceEmptyState({
  locale,
  variant = 'team',
}: TeamCollaborationSpaceEmptyStateProps) {
  if (variant === 'personal') {
    return <TcsContentEmptyState locale={locale} messageKey="emptyPersonalTitle" />
  }

  const titleKey = 'emptyTitle'
  const hintKey = 'emptyHint'

  return (
    <div className="skills-empty tcs-empty" role="status">
      <div className="tcs-empty-title">{tcsT(locale, titleKey)}</div>
      <div className="tcs-empty-hint">{tcsT(locale, hintKey)}</div>
    </div>
  )
}
