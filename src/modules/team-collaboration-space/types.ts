export type { SectionType, VersionBump, SectionIterationRecord, SectionIterationSummary, ChangelogSortKey } from './types/sectionIteration'

import type { SectionType } from './types/sectionIteration'
import type {
  AccessMode as SpaceAccessMode,
  MemberAssignment as TcsMemberAssignment,
  OrgMember as TcsOrgMember,
  Permission as TcsPermission,
  RolePreset as TcsRolePreset,
} from '../access-control/types'

export type SpaceKind = 'shared' | 'team' | 'personal'

export type { SpaceAccessMode, TcsMemberAssignment, TcsOrgMember, TcsPermission, TcsRolePreset }

/** 项空间自定义角色（仅 Admin 可创建） */
export type SpaceCustomRole = {
  id: string
  nameZh: string
  nameEn: string
  permissions: TcsPermission[]
}

export type SpaceCustomRoleDraft = {
  nameZh: string
  nameEn: string
  permissions: TcsPermission[]
}

export type CollaborationZone = {
  id: string
  spaceId: string
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
  accent: string
  accessMode?: SpaceAccessMode
  copyFromZoneId?: string | null
  permissionsCustomized?: boolean
  members: TcsMemberAssignment[]
  resourceCount: number
  updatedAtLabelZh: string
  updatedAtLabelEn: string
}

export type TeamCollaborationSpaceItem = {
  id: string
  kind: SpaceKind
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
  updatedAtLabelZh: string
  updatedAtLabelEn: string
  accent: string
  accessMode?: SpaceAccessMode
  copyFromSpaceId?: string | null
  permissionsCustomized?: boolean
  members: TcsMemberAssignment[]
  zones: CollaborationZone[]
  /** 已归属本空间的资源 ID；未设置时按 resourceCount 演示抽样 */
  resourceIds?: string[]
  resourceCount: number
  /** 时间期限（ISO 日期 YYYY-MM-DD；均为空表示长期有效） */
  deadlineStart?: string | null
  deadlineEnd?: string | null
}

export type InvitedMemberAssignment = {
  memberId: string
  preset: Exclude<TcsRolePreset, 'custom'>
}

export type SpaceFormDraft = {
  name: string
  description: string
  accessMode: SpaceAccessMode
  copyFromSpaceId?: string | null
  /** 创建时额外引入的成员（与访问权限自动生成的成员合并） */
  invitedMemberIds?: string[]
  invitedMemberPreset?: Exclude<TcsRolePreset, 'custom'>
  /** 按角色分别引入的成员（优先于 invitedMemberIds + invitedMemberPreset） */
  invitedMemberAssignments?: InvitedMemberAssignment[]
  /** 预览/提交时排除的成员 */
  excludedMemberIds?: string[]
  /** 项目时间期限（仅项目空间创建流程使用） */
  deadlineStart?: string | null
  deadlineEnd?: string | null
}

export type ZoneFormDraft = {
  name: string
  description: string
  accessMode: SpaceAccessMode
  copyFromZoneId?: string | null
}

export type ZoneDeleteMode = 'move_to_space' | 'delete_all'

export type TeamCollaborationNavSection = 'team-spaces' | 'project-space'

export type TeamRoute =
  | { view: 'list' }
  | { view: 'shared' }
  | { view: 'space'; spaceId: string }
  | { view: 'zone'; spaceId: string; zoneId: string }
  | { view: 'project-space'; scope?: 'mine' | 'group'; groupId?: string }
  | { view: 'project-space-roles' }
  | { view: 'project-space-changelog' }
  | {
      view: 'project-space-changelog-detail'
      sectionType: SectionType
      sectionId: string
    }
  | { view: 'project-space-tasks'; groupId?: string; instanceId?: string; onboardingCandidateId?: string; recruitJdRequestId?: string; tasksScope?: ProjectSpaceTasksScope }

export type ProjectGroup = {
  id: string
  nameZh: string
  nameEn: string
  sortOrder: number
  /** 组织级公共空间：Manager 不可编辑/删除；Admin 可设置访问权限与删除 */
  isPublicSpace?: boolean
  descriptionZh?: string
  descriptionEn?: string
  accessMode?: SpaceAccessMode
  copyFromSpaceId?: string | null
  permissionsCustomized?: boolean
  members?: TcsMemberAssignment[]
}

export type ProjectGroupFormDraft = {
  name: string
  accessMode: SpaceAccessMode
  copyFromSpaceId?: string | null
  invitedMemberIds?: string[]
  invitedMemberPreset?: Exclude<TcsRolePreset, 'custom'>
  invitedMemberAssignments?: InvitedMemberAssignment[]
  excludedMemberIds?: string[]
}

export type ProjectSpaceItem = {
  id: string
  groupId: string
  nameZh: string
  nameEn: string
  coverFrom: string
  coverVia: string
  coverTo: string
  /** 关联的团队协作空间；有值时点击进入空间详情 */
  spaceId?: string
  /** 项目时间期限（ISO 日期 YYYY-MM-DD） */
  deadlineStart?: string | null
  deadlineEnd?: string | null
  starred?: boolean
  joinOverlay?: boolean
  isCreateCard?: boolean
  /** 演示用：项目已失效标签 */
  isExpired?: boolean
}

export type ProjectSpaceNavTab = 'mine' | 'tasks' | 'roles' | 'changelog'

export type ApprovalTaskStatus = 'pending' | 'approved' | 'rejected'

export type WorkflowInstanceStepStatus = 'completed' | 'pending' | 'skipped' | 'waiting'

export type WorkflowApprovalField = {
  labelZh: string
  labelEn: string
  valueZh: string
  valueEn: string
}

export type WorkflowApprovalPayload = {
  summaryZh: string
  summaryEn: string
  fields: WorkflowApprovalField[]
  attachmentNamesZh?: string[]
  attachmentNamesEn?: string[]
}

export type WorkflowInstanceStep = {
  id: string
  nodeId: string
  titleZh: string
  titleEn: string
  kind: 'auto' | 'approval' | 'branch'
  status: WorkflowInstanceStepStatus
  assigneeIds?: string[]
  startedAt?: string
  completedAt?: string
  branchLabelZh?: string
  branchLabelEn?: string
  approvalPayload?: WorkflowApprovalPayload
  approvalDecision?: 'approved' | 'rejected'
  rejectReason?: string
}

export type WorkflowInstance = {
  id: string
  scenarioTitleZh: string
  scenarioTitleEn: string
  projectGroupId: string
  projectId: string
  projectNameZh: string
  projectNameEn: string
  subjectZh: string
  subjectEn: string
  initiatorId: string
  status: 'running' | 'completed' | 'failed'
  currentStepId: string
  steps: WorkflowInstanceStep[]
  createdAt: string
}

export type ApprovalTask = {
  id: string
  instanceId: string
  nodeId: string
  projectGroupId: string
  projectId: string
  assigneeId: string
  status: ApprovalTaskStatus
  requestedAt: string
  completedAt?: string
}

export type ProjectSpaceTasksScope = 'all' | 'inbox' | 'initiated' | 'done'

export type SpaceDetailTab = 'all' | 'overview' | 'members' | 'zones' | 'resources'
export type ZoneDetailTab = 'resources'
export type TcsListViewMode = 'list' | 'cards'

export type TcsResourceKind = 'agent' | 'workflow'

export type TcsResourceSourceModule = 'agent-library' | 'scenario-config'

export type TcsResourceCatalogItem = {
  id: string
  kind: TcsResourceKind
  sourceModule: TcsResourceSourceModule
  desc: string
  meta: string
}
