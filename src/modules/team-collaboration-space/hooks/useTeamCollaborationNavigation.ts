import { useCallback, useState } from 'react'

import {
  isTeamPath,
  navigateTeamCollaborationSection,
  teamCollaborationSectionFromPath,
} from '../utils/routing'
import { ENABLE_TEAM_SPACES_NAV_SECTION } from '../nav/navConfig'
import type { TeamCollaborationNavSection } from '../types'

export function useTeamCollaborationNavigation() {
  const [section, setSection] = useState<TeamCollaborationNavSection>(() => {
    if (typeof window === 'undefined') {
      return ENABLE_TEAM_SPACES_NAV_SECTION ? 'team-spaces' : 'project-space'
    }
    return teamCollaborationSectionFromPath(window.location.pathname)
  })
  const [navExpanded, setNavExpanded] = useState(false)

  const syncFromPath = useCallback((path: string) => {
    if (isTeamPath(path)) {
      setSection(teamCollaborationSectionFromPath(path))
    }
  }, [])

  const navigateToSection = useCallback((next: TeamCollaborationNavSection) => {
    setNavExpanded(true)
    setSection(next)
    navigateTeamCollaborationSection(next)
  }, [])

  return {
    section,
    navExpanded,
    setNavExpanded,
    syncFromPath,
    navigateToSection,
  }
}
