import { useLocale } from '../../../i18n/LocaleContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { tcsT } from '../i18n/strings'
import type { TeamCollaborationNavSection } from '../types'
import '../../access-control/access-control.css'
import { TeamCollaborationNavItem } from './TeamCollaborationNavItem'
import { TEAM_COLLABORATION_NAV_SECTIONS, ENABLE_TEAM_SPACES_NAV_SECTION } from './navConfig'

type TeamCollaborationSidebarNavProps = {
  isSidebarExpanded: boolean
  activeSection: TeamCollaborationNavSection
  isTeamCollaborationActive: boolean
  navExpanded: boolean
  onNavExpandedChange: (expanded: boolean) => void
  onNavigate: (section: TeamCollaborationNavSection) => void
  navListId: string
}

export function TeamCollaborationSidebarNav({
  isSidebarExpanded,
  activeSection,
  isTeamCollaborationActive,
  navExpanded,
  onNavExpandedChange,
  onNavigate,
  navListId,
}: TeamCollaborationSidebarNavProps) {
  const { locale } = useLocale()
  const { canShowProjectSpaceNav } = useTeamCollaborationCapabilities()
  const groupLabel = tcsT(locale, 'pageTitle')
  const visibleSections = TEAM_COLLABORATION_NAV_SECTIONS.filter((config) => {
    if (config.section === 'team-spaces' && !ENABLE_TEAM_SPACES_NAV_SECTION) return false
    if (config.managerOrAdminOnly) return canShowProjectSpaceNav
    return true
  })

  if (visibleSections.length === 0) return null

  /** 仅保留项目空间时：不展示「团队协作空间」分组标题，直接作为一级导航 */
  if (!ENABLE_TEAM_SPACES_NAV_SECTION) {
    return (
      <>
        {visibleSections.map((config) => (
          <TeamCollaborationNavItem
            key={config.section}
            config={config}
            variant="primary"
            isActive={isTeamCollaborationActive && activeSection === config.section}
            onNavigate={onNavigate}
          />
        ))}
      </>
    )
  }

  const showItems = !isSidebarExpanded || navExpanded

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
            <TeamCollaborationNavItem
              key={config.section}
              config={config}
              isActive={isTeamCollaborationActive && activeSection === config.section}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
