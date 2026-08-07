import { useEffect, useSyncExternalStore } from 'react'

import { useTeamCollaborationSpaceStore } from './context/TeamCollaborationSpaceContext'
import { CollaborationZoneDetailPage } from './pages/CollaborationZoneDetailPage'
import { ProjectSpaceChangelogDetailPage } from './pages/ProjectSpaceChangelogDetailPage'
import { ProjectSpaceChangelogPage } from './pages/ProjectSpaceChangelogPage'
import { ProjectSpacePage } from './pages/ProjectSpacePage'
import { ProjectSpaceRolesPage } from './pages/ProjectSpaceRolesPage'
import { ProjectSpaceTasksPage } from './pages/ProjectSpaceTasksPage'
import { SharedSpaceDetailPage } from './pages/SharedSpaceDetailPage'
import { TeamCollaborationSpaceListPage } from './pages/TeamCollaborationSpaceListPage'
import { TeamSpaceDetailPage } from './pages/TeamSpaceDetailPage'
import { SHARED_SPACE_ID } from './data/sharedSpace'
import { normalizeProjectSpacePathname, parseTeamRoute } from './utils/routing'

function subscribePathname(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

function getPathnameSnapshot() {
  return window.location.pathname
}

export function TeamCollaborationSpaceRouterInner() {
  const tcs = useTeamCollaborationSpaceStore()
  const pathname = useSyncExternalStore(subscribePathname, getPathnameSnapshot, () => '/team')
  const route = parseTeamRoute(pathname)

  useEffect(() => {
    const normalized = normalizeProjectSpacePathname(pathname)
    if (normalized && normalized !== pathname.replace(/\/+$/, '')) {
      window.history.replaceState(null, '', normalized)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [pathname])

  switch (route.view) {
    case 'shared':
      return <SharedSpaceDetailPage spaceId={SHARED_SPACE_ID} />
    case 'space': {
      const space = tcs.getSpace(route.spaceId)
      if (space?.kind === 'shared') {
        return <SharedSpaceDetailPage spaceId={route.spaceId} />
      }
      return <TeamSpaceDetailPage spaceId={route.spaceId} />
    }
    case 'zone': {
      const parentSpace = tcs.getSpace(route.spaceId)
      if (parentSpace?.kind === 'team') {
        return <TeamSpaceDetailPage spaceId={route.spaceId} />
      }
      return <CollaborationZoneDetailPage spaceId={route.spaceId} zoneId={route.zoneId} />
    }
    case 'project-space':
      return (
        <ProjectSpacePage
          scope={route.scope ?? (route.groupId ? 'group' : 'mine')}
          groupId={route.groupId}
        />
      )
    case 'project-space-roles':
      return <ProjectSpaceRolesPage />
    case 'project-space-changelog':
      return <ProjectSpaceChangelogPage />
    case 'project-space-changelog-detail':
      return (
        <ProjectSpaceChangelogDetailPage
          sectionType={route.sectionType}
          sectionId={route.sectionId}
        />
      )
    case 'project-space-tasks':
      return (
        <ProjectSpaceTasksPage
          groupId={route.groupId}
          instanceId={route.instanceId}
          onboardingCandidateId={route.onboardingCandidateId}
          recruitJdRequestId={route.recruitJdRequestId}
          tasksScope={route.tasksScope ?? 'inbox'}
        />
      )
    case 'list':
    default:
      return <TeamCollaborationSpaceListPage />
  }
}
