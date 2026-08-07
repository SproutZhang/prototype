import { resolveProjectSpaceLandingPath } from '../../../auth/catalogGrantAccess'
import { readLoginSession } from '../../../auth/session'
import type { LoginRole } from '../../../auth/types'
import type { SectionType } from '../types/sectionIteration'
import { SHARED_SPACE_ID } from '../data/sharedSpace'
import { getDefaultProjectGroupId } from '../data/projectSpaceSeed'
import { ENABLE_TEAM_SPACES_NAV_SECTION } from '../nav/navConfig'
import type { TeamCollaborationNavSection, TeamRoute } from '../types'

function resolveTeamLoginRole(): LoginRole {
  return readLoginSession()?.role ?? 'manager'
}

export function parseTeamRoute(pathname: string): TeamRoute {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/team') {
    if (ENABLE_TEAM_SPACES_NAV_SECTION) return { view: 'list' }
    return parseTeamRoute(resolveProjectSpaceLandingPath(resolveTeamLoginRole()))
  }
  if (path === '/team/shared') return { view: 'shared' }

  if (path === '/team/project-space/tasks/done') {
    return { view: 'project-space-tasks', tasksScope: 'done' }
  }

  if (path === '/team/project-space/tasks/all') {
    return { view: 'project-space-tasks', tasksScope: 'all' }
  }

  if (path === '/team/project-space/tasks/initiated') {
    return { view: 'project-space-tasks', tasksScope: 'initiated' }
  }

  const taskDetailMatch = path.match(/^\/team\/project-space\/tasks\/([^/]+)$/)
  if (taskDetailMatch) {
    const id = taskDetailMatch[1]
    if (id.startsWith('uir-')) {
      return { view: 'project-space-tasks', recruitJdRequestId: id }
    }
    if (id.startsWith('rpc-')) {
      return { view: 'project-space-tasks', onboardingCandidateId: id }
    }
    return { view: 'project-space-tasks', instanceId: id }
  }

  if (path === '/team/project-space/tasks') {
    return { view: 'project-space-tasks', tasksScope: 'inbox' }
  }

  if (path === '/team/project-space/mine') {
    return { view: 'project-space', scope: 'mine' }
  }

  if (path === '/team/project-space/roles') {
    return { view: 'project-space-roles' }
  }

  if (path === '/team/project-space/changelog') {
    return { view: 'project-space-changelog' }
  }

  const changelogDetailMatch = path.match(
    /^\/team\/project-space\/changelog\/(workflow|agent|skill|tool)\/([^/]+)$/,
  )
  if (changelogDetailMatch) {
    return {
      view: 'project-space-changelog-detail',
      sectionType: changelogDetailMatch[1] as SectionType,
      sectionId: decodeURIComponent(changelogDetailMatch[2]),
    }
  }

  const projectSpaceMatch = path.match(/^\/team\/project-space(?:\/([^/]+))?$/)
  if (projectSpaceMatch) {
    const segment = projectSpaceMatch[1]
    if (segment && segment !== 'tasks' && segment !== 'mine' && segment !== 'roles' && segment !== 'changelog') {
      return { view: 'project-space', scope: 'group', groupId: segment }
    }
    if (!segment) {
      return { view: 'project-space', scope: 'mine' }
    }
  }

  const zoneMatch = path.match(/^\/team\/([^/]+)\/zones\/([^/]+)$/)
  if (zoneMatch) {
    return { view: 'zone', spaceId: zoneMatch[1], zoneId: zoneMatch[2] }
  }

  const spaceMatch = path.match(/^\/team\/([^/]+)$/)
  if (spaceMatch && spaceMatch[1] !== 'shared') {
    return { view: 'space', spaceId: spaceMatch[1] }
  }

  return { view: 'list' }
}

/** 将旧版或简写项目空间 URL 规范化为可解析路径 */
export function normalizeProjectSpacePathname(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/team/project-space' || path === '/team/project-space/') {
    return resolveProjectSpaceLandingPath(resolveTeamLoginRole())
  }
  return null
}

export function buildTeamPath(route: TeamRoute): string {
  switch (route.view) {
    case 'list':
      return '/team'
    case 'shared':
      return '/team/shared'
    case 'space':
      return `/team/${route.spaceId}`
    case 'zone':
      return `/team/${route.spaceId}/zones/${route.zoneId}`
    case 'project-space':
      if (route.scope === 'mine') return '/team/project-space/mine'
      return `/team/project-space/${route.groupId ?? getDefaultProjectGroupId()}`
    case 'project-space-roles':
      return '/team/project-space/roles'
    case 'project-space-changelog':
      return '/team/project-space/changelog'
    case 'project-space-changelog-detail':
      return `/team/project-space/changelog/${route.sectionType}/${encodeURIComponent(route.sectionId)}`
    case 'project-space-tasks':
      if (route.onboardingCandidateId) return `/team/project-space/tasks/${route.onboardingCandidateId}`
      if (route.recruitJdRequestId) return `/team/project-space/tasks/${route.recruitJdRequestId}`
      if (route.instanceId) return `/team/project-space/tasks/${route.instanceId}`
      if (route.tasksScope === 'all') return '/team/project-space/tasks/all'
      if (route.tasksScope === 'done') return '/team/project-space/tasks/done'
      if (route.tasksScope === 'initiated') return '/team/project-space/tasks/initiated'
      return '/team/project-space/tasks'
  }
}

export function isTeamPath(pathname: string): boolean {
  return pathname === '/team' || pathname.startsWith('/team/')
}

export function teamCollaborationSectionFromPath(pathname: string): TeamCollaborationNavSection {
  if (pathname.startsWith('/team/project-space/tasks')) return 'project-space'
  if (pathname.startsWith('/team/project-space')) return 'project-space'
  if (!ENABLE_TEAM_SPACES_NAV_SECTION) return 'project-space'
  return 'team-spaces'
}

export function navigateTeamCollaborationSection(section: TeamCollaborationNavSection) {
  const path =
    section === 'project-space' || !ENABLE_TEAM_SPACES_NAV_SECTION
      ? resolveProjectSpaceLandingPath(resolveTeamLoginRole())
      : '/team'
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigateToHome() {
  window.history.pushState(null, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export { SHARED_SPACE_ID }
