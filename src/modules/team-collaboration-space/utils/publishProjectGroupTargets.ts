import type { AppLocale } from '../../../i18n/homeStrings'
import { PUBLIC_PROJECT_GROUP_ID } from '../data/projectSpaceSeed'
import { SHARED_SPACE_ID } from '../data/sharedSpace'
import { buildTeamPath } from './routing'
import { TEAM_COLLABORATION_SPACES_SEED } from '../data/spacesSeed'
import { localizeProjectGroupName, localizeProjectSpaceItemName } from '../i18n/strings'
import { isPublicProjectGroup } from './projectGroups'
import { getProjectGroupsSnapshot } from './projectGroupsSync'
import { getProjectSpaceItemsSnapshot } from './projectSpaceItemsSync'
import {
  isStandalonePublishGroup,
  isStandalonePublishSpace,
  resolveStandaloneGroupSpaceId,
} from './publishSpaceSync'

export const DEFAULT_PUBLISH_PROJECT_GROUP_ID = PUBLIC_PROJECT_GROUP_ID

export type PublishProjectGroupOption = {
  id: string
  label: string
}

export type PublishTargetChild = {
  id: string
  label: string
}

export type PublishTargetGroup = {
  id: string
  label: string
  children: PublishTargetChild[]
}

function getSharedSpaceChildLabel(locale: AppLocale): string {
  const shared = TEAM_COLLABORATION_SPACES_SEED.find((space) => space.id === SHARED_SPACE_ID)
  if (!shared) return SHARED_SPACE_ID
  return locale === 'zh' ? shared.nameZh : shared.nameEn
}

export function getPublishProjectGroupOptions(locale: AppLocale): PublishProjectGroupOption[] {
  return getPublishTargetGroups(locale).map((group) => ({
    id: group.id,
    label: group.label,
  }))
}

/** 发布弹窗：项目分组及其下属协作空间（子空间） */
export function getPublishTargetGroups(locale: AppLocale): PublishTargetGroup[] {
  const items = getProjectSpaceItemsSnapshot()

  return getProjectGroupsSnapshot().map((group) => {
    const children: PublishTargetChild[] = []

    if (isPublicProjectGroup(group)) {
      children.push({
        id: SHARED_SPACE_ID,
        label: getSharedSpaceChildLabel(locale),
      })
    }

    if (isStandalonePublishGroup(group.id)) {
      return {
        id: group.id,
        label: localizeProjectGroupName(group, locale),
        children: [],
      }
    }

    for (const item of items) {
      if (item.groupId !== group.id || item.isCreateCard || !item.spaceId) continue
      children.push({
        id: item.spaceId,
        label: localizeProjectSpaceItemName(item, locale),
      })
    }

    return {
      id: group.id,
      label: localizeProjectGroupName(group, locale),
      children,
    }
  })
}

function isKnownProjectGroupId(targetId: string): boolean {
  return getProjectGroupsSnapshot().some((group) => group.id === targetId)
}

export function resolvePublishTargetLabel(targetId: string, locale: AppLocale): string {
  if (isStandalonePublishGroup(targetId)) {
    return resolvePublishGroupLabel(targetId, locale)
  }

  const projectItem = getProjectSpaceItemsSnapshot().find((item) => item.spaceId === targetId)
  if (projectItem?.spaceId) {
    const spaceLabel = localizeProjectSpaceItemName(projectItem, locale)
    if (isStandalonePublishSpace(projectItem.spaceId)) {
      return spaceLabel
    }
    const groupLabel = resolvePublishGroupLabel(projectItem.groupId, locale)
    return `${groupLabel} · ${spaceLabel}`
  }

  for (const group of getPublishTargetGroups(locale)) {
    if (group.id === targetId) {
      return group.label
    }
  }

  if (targetId === SHARED_SPACE_ID) {
    return `${resolvePublishGroupLabel(PUBLIC_PROJECT_GROUP_ID, locale)} · ${getSharedSpaceChildLabel(locale)}`
  }

  return resolvePublishGroupLabel(targetId, locale)
}

export function resolvePublishGroupLabel(groupId: string, locale: AppLocale): string {
  const group = getProjectGroupsSnapshot().find((entry) => entry.id === groupId)
  return group ? localizeProjectGroupName(group, locale) : groupId
}

/** 将发布目标解析为项目分组 id（兼容历史 spaceId 存储） */
export function resolvePublishGroupIdFromTargetId(targetId: string): string {
  if (isKnownProjectGroupId(targetId)) {
    return targetId
  }

  if (targetId === SHARED_SPACE_ID) {
    return PUBLIC_PROJECT_GROUP_ID
  }

  const projectItem = getProjectSpaceItemsSnapshot().find((item) => item.spaceId === targetId)
  if (projectItem) {
    return projectItem.groupId
  }

  return PUBLIC_PROJECT_GROUP_ID
}

/** 项目分组 → 实际写入资源的协作空间 id */
export function resolvePublishSpaceIdForGroup(groupId: string): string | null {
  if (isPublicProjectGroup({ id: groupId })) {
    return SHARED_SPACE_ID
  }

  const projectItem = getProjectSpaceItemsSnapshot().find(
    (item) => item.groupId === groupId && item.spaceId,
  )
  return projectItem?.spaceId ?? null
}

export function resolvePublishSpaceIdFromTargetId(targetId: string): string | null {
  if (targetId === SHARED_SPACE_ID) {
    return SHARED_SPACE_ID
  }

  const standaloneSpaceId = resolveStandaloneGroupSpaceId(targetId)
  if (standaloneSpaceId) {
    return standaloneSpaceId
  }

  const projectItem = getProjectSpaceItemsSnapshot().find((item) => item.spaceId === targetId)
  if (projectItem?.spaceId) {
    return projectItem.spaceId
  }

  if (getProjectGroupsSnapshot().some((group) => group.id === targetId)) {
    return resolvePublishSpaceIdForGroup(targetId)
  }

  return resolvePublishSpaceIdForGroup(resolvePublishGroupIdFromTargetId(targetId))
}

/** 发布完成后跳转：根据发布目标解析团队空间路径 */
export function buildPublishTargetViewPath(targetId: string): string {
  if (targetId === SHARED_SPACE_ID) {
    return buildTeamPath({ view: 'shared' })
  }

  if (isStandalonePublishSpace(targetId)) {
    return buildTeamPath({ view: 'space', spaceId: targetId })
  }

  const standaloneSpaceId = resolveStandaloneGroupSpaceId(targetId)
  if (standaloneSpaceId) {
    return buildTeamPath({ view: 'space', spaceId: standaloneSpaceId })
  }

  const projectItem = getProjectSpaceItemsSnapshot().find((item) => item.spaceId === targetId)
  if (projectItem?.spaceId) {
    return buildTeamPath({ view: 'space', spaceId: projectItem.spaceId })
  }

  if (getProjectGroupsSnapshot().some((group) => group.id === targetId)) {
    return buildTeamPath({ view: 'project-space', scope: 'group', groupId: targetId })
  }

  const groupId = resolvePublishGroupIdFromTargetId(targetId)
  return buildTeamPath({ view: 'project-space', scope: 'group', groupId })
}

export function navigateToPublishTarget(targetId: string) {
  const path = buildPublishTargetViewPath(targetId)
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
