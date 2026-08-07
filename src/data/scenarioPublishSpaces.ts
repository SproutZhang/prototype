import type { AppLocale } from '../i18n/homeStrings'
import type { SpaceFormDraft } from '../modules/team-collaboration-space/types'
import { TEAM_COLLABORATION_SPACES_SEED } from '../modules/team-collaboration-space/data/spacesSeed'
import {
  DEFAULT_PUBLISH_PROJECT_GROUP_ID,
  getPublishProjectGroupOptions,
} from '../modules/team-collaboration-space/utils/publishProjectGroupTargets'
import {
  addPublishCreatedIndependentSpace,
  getPublishCreatedProjectItems,
  getPublishCreatedSpaces,
} from '../modules/team-collaboration-space/utils/publishSpaceSync'
import { addProjectSpaceItem } from '../modules/team-collaboration-space/utils/projectSpaceItemsSync'
import { syncPublishCreatedSpacesToTeamStore } from '../modules/team-collaboration-space/utils/teamCollaborationSpaceRuntime'

export const CREATE_PUBLISH_SPACE_OPTION_VALUE = '__create_publish_space__'

export type PublishSpaceOption = {
  id: string
  label: string
}

export { DEFAULT_PUBLISH_PROJECT_GROUP_ID }

/** 发布弹窗：与项目空间侧边栏「项目分组」一致 */
export function getPublishSpaceOptions(locale: AppLocale): PublishSpaceOption[] {
  return getPublishProjectGroupOptions(locale)
}

/** 协作空间名称（公共资源移动、公共空间标签等） */
export function getCollaborationSpaceOptions(locale: AppLocale): PublishSpaceOption[] {
  const seedOptions = TEAM_COLLABORATION_SPACES_SEED.map((space) => ({
    id: space.id,
    label: locale === 'zh' ? space.nameZh : space.nameEn,
  }))

  const customOptions = getPublishCreatedSpaces().map((space) => ({
    id: space.id,
    label: locale === 'zh' ? space.nameZh : space.nameEn,
  }))

  return [...seedOptions, ...customOptions]
}

/** 发布弹窗创建：独立项目空间（新建分组，不作为已有空间/分组的子级） */
export function addCustomPublishSpace(draft: SpaceFormDraft): string {
  const spaceId = addPublishCreatedIndependentSpace(draft)
  const projectItem = getPublishCreatedProjectItems().find((item) => item.spaceId === spaceId)
  if (projectItem) {
    addProjectSpaceItem(projectItem)
  }
  syncPublishCreatedSpacesToTeamStore()
  return spaceId
}

export { getPublishCreatedSpaces }
