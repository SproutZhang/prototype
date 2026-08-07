import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT, versionBumpLabel } from '../i18n/strings'
import type { VersionBump } from '../types/sectionIteration'

type SectionIterationBumpBadgeProps = {
  locale: AppLocale
  bump: VersionBump
  requiresMigration?: boolean
}

export function SectionIterationBumpBadge({
  locale,
  bump,
  requiresMigration = false,
}: SectionIterationBumpBadgeProps) {
  return (
    <span
      className={`tcs-changelog-bump-badge tcs-changelog-bump-badge--${bump}${requiresMigration ? ' tcs-changelog-bump-badge--migration' : ''}`}
    >
      {versionBumpLabel(locale, bump)}
      {requiresMigration ? (
        <span className="tcs-changelog-bump-badge__migration">{tcsT(locale, 'changelogRequiresMigration')}</span>
      ) : null}
    </span>
  )
}
