import { useCallback, useState } from 'react'

import {
  accessControlSectionFromPath,
  accessControlSectionPath,
  isAccessControlPath,
  navigateAccessControlSection,
  type AccessControlSection,
} from '../utils/routing'

export function useAccessControlNavigation() {
  const [section, setSection] = useState<AccessControlSection>(() => {
    if (typeof window === 'undefined') return 'workspace'
    return accessControlSectionFromPath(window.location.pathname)
  })
  const [navExpanded, setNavExpanded] = useState(false)

  const syncFromPath = useCallback((path: string) => {
    if (isAccessControlPath(path)) {
      setSection(accessControlSectionFromPath(path))
    }
  }, [])

  const navigateToSection = useCallback((next: AccessControlSection) => {
    setNavExpanded(true)
    setSection(next)
    navigateAccessControlSection(next)
    return accessControlSectionPath(next)
  }, [])

  return {
    section,
    navExpanded,
    setNavExpanded,
    syncFromPath,
    navigateToSection,
  }
}
