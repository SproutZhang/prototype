import { PUBLIC_PROJECT_GROUP_ID, PROJECT_SPACE_ITEMS_SEED } from '../data/projectSpaceSeed'
import { SHARED_SPACE_ID } from '../data/sharedSpace'
import { TEAM_COLLABORATION_SPACES_SEED } from '../data/spacesSeed'
import type {
  ProjectGroup,
  ProjectSpaceItem,
  SpaceFormDraft,
  TeamCollaborationSpaceItem,
  TcsResourceCatalogItem,
  TcsResourceKind,
  TcsResourceSourceModule,
} from '../types'
import { createTeamSpaceFromDraft } from './createTeamSpaceFromDraft'
import { flattenTeamCollaborationSpaces } from './flattenTeamSpaces'
import { createProjectSpaceItemFromDraft } from './projectItems'
import { buildMembersForSpaceDraft, resolveInvitedMemberAssignments } from './memberInit'
import { addProjectGroup, getProjectGroupsSnapshot } from './projectGroupsSync'
import { assignResourcesForScope } from './resourceAssignment'
import { registerSpaceProjectGroup } from './resourceMoveTargets'
import {
  hasPublishedResourceCatalogExtra,
  removePublishedResourceCatalogExtra,
  upsertPublishedResourceCatalogExtra,
} from './publishedResourceCatalogExtras'

type PublishCreatedSpaceRecord = {
  space: TeamCollaborationSpaceItem
  projectItem: ProjectSpaceItem
  standalone?: boolean
}

const standalonePublishSpaceIds = new Set<string>()
const standaloneGroupSpaceByGroupId: Record<string, string> = {}

export type PublishContentInput = {
  id: string
  kind: TcsResourceKind
  sourceModule: TcsResourceSourceModule
  desc?: string
  meta?: string
}

let publishCreatedRecords: PublishCreatedSpaceRecord[] = []
const spacePublishedResourceIds: Record<string, string[]> = {}
const listeners = new Set<() => void>()

const DEMO_SHARED_PUBLISH_CONTENT: PublishContentInput[] = [
  { id: 'onboarding', kind: 'agent', sourceModule: 'agent-library', desc: '', meta: 'just now' },
  { id: 'HR Onboarding Agent', kind: 'agent', sourceModule: 'agent-library', desc: '', meta: 'just now' },
  {
    id: 'Leave Approval Workflow Agent',
    kind: 'workflow',
    sourceModule: 'scenario-config',
    desc: '',
    meta: 'just now',
  },
]

function seedDemoSharedSpaceResources(): void {
  for (const content of DEMO_SHARED_PUBLISH_CONTENT) {
    const catalogItem: TcsResourceCatalogItem = {
      id: content.id,
      kind: content.kind,
      sourceModule: content.sourceModule,
      desc: content.desc ?? '',
      meta: content.meta ?? 'just now',
    }
    if (!hasPublishedResourceCatalogExtra(content.id)) {
      upsertPublishedResourceCatalogExtra(catalogItem)
    }
    const assigned = spacePublishedResourceIds[SHARED_SPACE_ID] ?? []
    if (!assigned.includes(content.id)) {
      spacePublishedResourceIds[SHARED_SPACE_ID] = [...assigned, content.id]
    }
  }
}

seedDemoSharedSpaceResources()

function notifyPublishSpaceSync() {
  for (const listener of listeners) {
    listener()
  }
}

function resolveSpaceResourceIdList(space: TeamCollaborationSpaceItem): string[] {
  if (space.resourceIds !== undefined) return [...space.resourceIds]
  if (space.resourceCount <= 0) return []
  return assignResourcesForScope(`space:${space.id}`, space.resourceCount).map((item) => item.id)
}

function getAllSpacesForBuild(): TeamCollaborationSpaceItem[] {
  return [
    ...flattenTeamCollaborationSpaces(TEAM_COLLABORATION_SPACES_SEED),
    ...publishCreatedRecords.map((record) => record.space),
  ]
}

function countProjectItemsInGroup(groupId: string): number {
  const seedCount = PROJECT_SPACE_ITEMS_SEED.filter(
    (item) => !item.isCreateCard && item.groupId === groupId,
  ).length
  const createdCount = publishCreatedRecords.filter((record) => record.projectItem.groupId === groupId).length
  return seedCount + createdCount
}

/** 将 Agent / 场景发布到指定协作空间，并写入资源目录供项目空间展示 */
export function publishContentToSpace(spaceId: string, content: PublishContentInput): void {
  const catalogItem: TcsResourceCatalogItem = {
    id: content.id,
    kind: content.kind,
    sourceModule: content.sourceModule,
    desc: content.desc ?? '',
    meta: content.meta ?? 'just now',
  }

  upsertPublishedResourceCatalogExtra(catalogItem)

  const assigned = spacePublishedResourceIds[spaceId] ?? []
  if (!assigned.includes(content.id)) {
    spacePublishedResourceIds[spaceId] = [...assigned, content.id]
  }

  notifyPublishSpaceSync()
}

/** 从指定协作空间移除已发布资源（若其它空间仍引用则保留目录项） */
export function removeResourceFromSpace(spaceId: string, resourceId: string): void {
  const assigned = spacePublishedResourceIds[spaceId]
  if (assigned?.includes(resourceId)) {
    spacePublishedResourceIds[spaceId] = assigned.filter((id) => id !== resourceId)
  }

  const stillReferenced = Object.values(spacePublishedResourceIds).some((ids) => ids.includes(resourceId))
  if (!stillReferenced) {
    removePublishedResourceCatalogExtra(resourceId)
  }

  notifyPublishSpaceSync()
}

export { getPublishedResourceCatalogExtras } from './publishedResourceCatalogExtras'

export function getSpacePublishedResourceIds(): Record<string, string[]> {
  return { ...spacePublishedResourceIds }
}

function buildMembersFromSpaceDraft(draft: SpaceFormDraft): ProjectGroup['members'] {
  const copySource =
    draft.accessMode === 'copy' && draft.copyFromSpaceId
      ? getAllSpacesForBuild().find((space) => space.id === draft.copyFromSpaceId) ?? null
      : null
  return buildMembersForSpaceDraft(draft.accessMode, copySource, draft)
}

function nextProjectGroupSortOrder(): number {
  const groups = getProjectGroupsSnapshot()
  return groups.reduce((max, group) => Math.max(max, group.sortOrder), -1) + 1
}

/** Agent / 场景发布流程中创建的空间，同步写入项目空间与协作空间数据源 */
export function addPublishCreatedSpace(
  draft: SpaceFormDraft,
  groupId: string = PUBLIC_PROJECT_GROUP_ID,
): string {
  const spaceId = `tcs-team-${Date.now()}`
  const space = createTeamSpaceFromDraft(draft, getAllSpacesForBuild(), undefined, 'team', spaceId)
  const projectItem = createProjectSpaceItemFromDraft(
    draft,
    groupId,
    spaceId,
    countProjectItemsInGroup(groupId),
  )

  registerSpaceProjectGroup(spaceId, groupId)
  publishCreatedRecords = [...publishCreatedRecords, { space, projectItem }]
  notifyPublishSpaceSync()
  return spaceId
}

/** 发布弹窗「+ 创建新的空间」：独立项目空间（新建项目分组 + 协作空间，非已有分组子级） */
export function addPublishCreatedIndependentSpace(draft: SpaceFormDraft): string {
  const timestamp = Date.now()
  const groupId = `pg-${timestamp}`
  const spaceId = `tcs-team-${timestamp}`

  const group: ProjectGroup = {
    id: groupId,
    nameZh: draft.name,
    nameEn: draft.name,
    sortOrder: nextProjectGroupSortOrder(),
    descriptionZh: draft.description,
    descriptionEn: draft.description,
    accessMode: draft.accessMode,
    copyFromSpaceId: draft.accessMode === 'copy' ? draft.copyFromSpaceId ?? null : null,
    permissionsCustomized:
      (resolveInvitedMemberAssignments(draft)?.length ?? 0) > 0 ||
      (draft.excludedMemberIds?.length ?? 0) > 0,
    members: buildMembersFromSpaceDraft(draft),
  }

  addProjectGroup(group)

  const space = createTeamSpaceFromDraft(draft, getAllSpacesForBuild(), undefined, 'team', spaceId)
  const projectItem = createProjectSpaceItemFromDraft(draft, groupId, spaceId, 0)

  registerSpaceProjectGroup(spaceId, groupId)
  standalonePublishSpaceIds.add(spaceId)
  standaloneGroupSpaceByGroupId[groupId] = spaceId
  publishCreatedRecords = [
    ...publishCreatedRecords,
    { space, projectItem, standalone: true },
  ]
  notifyPublishSpaceSync()
  return spaceId
}

export function isStandalonePublishSpace(spaceId: string): boolean {
  return standalonePublishSpaceIds.has(spaceId)
}

export function isStandalonePublishGroup(groupId: string): boolean {
  return groupId in standaloneGroupSpaceByGroupId
}

export function resolveStandaloneGroupSpaceId(groupId: string): string | null {
  return standaloneGroupSpaceByGroupId[groupId] ?? null
}

export function getPublishCreatedSpaces(): TeamCollaborationSpaceItem[] {
  return publishCreatedRecords.map((record) => record.space)
}

export function resolvePublishCreatedSpace(
  spaceId: string,
  spaces: TeamCollaborationSpaceItem[],
): TeamCollaborationSpaceItem | undefined {
  return spaces.find((space) => space.id === spaceId) ?? getPublishCreatedSpaces().find((space) => space.id === spaceId)
}

export function getPublishCreatedProjectItems(): ProjectSpaceItem[] {
  return publishCreatedRecords.map((record) => record.projectItem)
}

export function subscribePublishSpaceSync(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function applySpaceResourceAssignments(
  spaces: TeamCollaborationSpaceItem[],
): TeamCollaborationSpaceItem[] {
  const assignments = getSpacePublishedResourceIds()
  const assignmentSpaceIds = Object.keys(assignments)
  if (assignmentSpaceIds.length === 0) return spaces

  return spaces.map((space) => {
    const toAdd = assignments[space.id]
    if (!toAdd?.length) return space

    const merged = [...resolveSpaceResourceIdList(space)]
    for (const resourceId of toAdd) {
      if (!merged.includes(resourceId)) merged.push(resourceId)
    }

    if (
      space.resourceIds !== undefined &&
      space.resourceIds.length === merged.length &&
      space.resourceIds.every((id, index) => id === merged[index])
    ) {
      return space
    }

    return {
      ...space,
      resourceIds: merged,
      resourceCount: merged.length,
      updatedAtLabelZh: '刚刚更新',
      updatedAtLabelEn: 'Updated just now',
    }
  })
}

export function mergePublishCreatedSpaces(
  spaces: TeamCollaborationSpaceItem[],
): TeamCollaborationSpaceItem[] {
  const existingIds = new Set(spaces.map((space) => space.id))
  const extra = getPublishCreatedSpaces().filter((space) => !existingIds.has(space.id))
  const merged = extra.length > 0 ? [...spaces, ...extra] : spaces
  return applySpaceResourceAssignments(merged)
}

export function mergePublishCreatedProjectItems(items: ProjectSpaceItem[]): ProjectSpaceItem[] {
  const existingIds = new Set(items.map((item) => item.id))
  const extra = getPublishCreatedProjectItems().filter((item) => !existingIds.has(item.id))
  return extra.length > 0 ? [...items, ...extra] : items
}
