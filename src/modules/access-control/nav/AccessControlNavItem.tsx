import { useLocale } from '../../../i18n/LocaleContext'
import { acT } from '../i18n/strings'
import type { AccessControlSection } from '../utils/routing'
import { AccessControlNavIcon } from './AccessControlNavIcon'
import type { AccessControlNavSectionConfig } from './navConfig'

type AccessControlNavItemProps = {
  config: AccessControlNavSectionConfig
  isActive: boolean
  onNavigate: (section: AccessControlSection) => void
}

export function AccessControlNavItem({ config, isActive, onNavigate }: AccessControlNavItemProps) {
  const { locale } = useLocale()
  const label = acT(locale, config.labelKey)

  return (
    <button
      className={isActive ? 'manus-nav-item manus-nav-item--sub is-active' : 'manus-nav-item manus-nav-item--sub'}
      type="button"
      aria-label={label}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onNavigate(config.section)}
    >
      <span className="manus-nav-item-icon" aria-hidden="true">
        <AccessControlNavIcon section={config.section} />
      </span>
      <span className="manus-nav-item-label">{label}</span>
    </button>
  )
}
