import { useLocale } from '../../../i18n/LocaleContext'
import { tcsT } from '../i18n/strings'
import type { TeamCollaborationNavSection } from '../types'
import { TeamCollaborationNavIcon } from './TeamCollaborationNavIcon'
import type { TeamCollaborationNavSectionConfig } from './navConfig'

type TeamCollaborationNavItemProps = {
  config: TeamCollaborationNavSectionConfig
  isActive: boolean
  onNavigate: (section: TeamCollaborationNavSection) => void
  /** 无上级分组时作为一级导航展示 */
  variant?: 'sub' | 'primary'
}

export function TeamCollaborationNavItem({
  config,
  isActive,
  onNavigate,
  variant = 'sub',
}: TeamCollaborationNavItemProps) {
  const { locale } = useLocale()
  const label = tcsT(locale, config.labelKey)
  const itemClass =
    variant === 'primary'
      ? isActive
        ? 'manus-nav-item is-active'
        : 'manus-nav-item'
      : isActive
        ? 'manus-nav-item manus-nav-item--sub is-active'
        : 'manus-nav-item manus-nav-item--sub'

  return (
    <button
      className={itemClass}
      type="button"
      aria-label={label}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onNavigate(config.section)}
    >
      <span className="manus-nav-item-icon" aria-hidden="true">
        <TeamCollaborationNavIcon section={config.section} />
      </span>
      <span className="manus-nav-item-label">{label}</span>
    </button>
  )
}
