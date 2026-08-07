import type { TeamCollaborationNavSection } from '../types'

/** 团队协作空间列表入口：暂未开放，侧栏仅保留项目空间 */
export const ENABLE_TEAM_SPACES_NAV_SECTION = false

export type TeamCollaborationNavSectionConfig = {
  section: TeamCollaborationNavSection
  labelKey: 'sectionTeamTitle' | 'projectSpaceTitle'
  /** Admin / Manager 可见（如项目空间） */
  managerOrAdminOnly?: boolean
}

export const TEAM_COLLABORATION_NAV_SECTIONS: readonly TeamCollaborationNavSectionConfig[] = [
  { section: 'team-spaces', labelKey: 'sectionTeamTitle' },
  { section: 'project-space', labelKey: 'projectSpaceTitle', managerOrAdminOnly: true },
] as const
