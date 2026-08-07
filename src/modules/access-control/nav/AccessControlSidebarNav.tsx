import { useLocale } from '../../../i18n/LocaleContext'
import { useAccessControlCapabilities } from '../hooks/useAccessControlCapabilities'
import { acT } from '../i18n/strings'
import type { AccessControlSection } from '../utils/routing'
import '../access-control.css'
import { AccessControlNavItem } from './AccessControlNavItem'
import { ACCESS_CONTROL_NAV_SECTIONS, ENABLE_DEPARTMENTS_NAV_SECTION, ENABLE_USERS_NAV_SECTION } from './navConfig'

type AccessControlSidebarNavProps = {
  isSidebarExpanded: boolean
  activeSection: AccessControlSection
  isAccessControlActive: boolean
  navExpanded: boolean
  onNavExpandedChange: (expanded: boolean) => void
  onNavigate: (section: AccessControlSection) => void
  navListId: string
}

export function AccessControlSidebarNav({
  isSidebarExpanded,
  activeSection,
  isAccessControlActive,
  navExpanded,
  onNavExpandedChange,
  onNavigate,
  navListId,
}: AccessControlSidebarNavProps) {
  const { locale } = useLocale()
  const {
    canViewAuditLog,
    canViewApiKeys,
    canViewModelManagement,
    canViewUsersManagement,
    canViewDepartmentsManagement,
    canViewMembersManagement,
    isAdmin,
  } = useAccessControlCapabilities()
  const groupLabel = acT(locale, 'pageTitle')
  const showItems = !isSidebarExpanded || navExpanded
  const visibleSections = ACCESS_CONTROL_NAV_SECTIONS.filter((config) => {
    if (config.section === 'audit-log') return canViewAuditLog
    if (config.section === 'api-keys') return canViewApiKeys
    if (config.section === 'model-management') return canViewModelManagement
    if (config.section === 'users') return ENABLE_USERS_NAV_SECTION && canViewUsersManagement
    if (config.section === 'departments') return ENABLE_DEPARTMENTS_NAV_SECTION && canViewDepartmentsManagement
    if (config.section === 'members') return canViewMembersManagement
    if (config.adminOnly) return isAdmin
    return true
  })

  return (
    <div
      className={`ac-sidebar-nav-group${isSidebarExpanded && !navExpanded ? ' is-collapsed' : ''}`}
      aria-label={groupLabel}
    >
      {isSidebarExpanded ? (
        <button
          type="button"
          className="ac-sidebar-nav-group-toggle"
          aria-expanded={navExpanded}
          aria-controls={navListId}
          onClick={() => onNavExpandedChange(!navExpanded)}
        >
          <span className="ac-sidebar-nav-group-label">{groupLabel}</span>
          <span className="ac-sidebar-nav-group-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
              <path
                d="M8 10l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ) : null}
      {showItems ? (
        <div id={navListId} className="ac-sidebar-nav-group-items">
          {visibleSections.map((config) => (
            <AccessControlNavItem
              key={config.section}
              config={config}
              isActive={isAccessControlActive && activeSection === config.section}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
