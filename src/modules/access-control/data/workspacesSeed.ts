import type { AccessMode } from '../types'
import { ORG_MEMBERS_CATALOG, WORKSPACE_OPTIONS } from './orgMembersCatalog'
import { WORKSPACE_ROLE_ROWS } from './workspaceRoles'

const WORKSPACE_DESCRIPTIONS: Record<string, { zh: string; en: string }> = {
  default: {
    zh: '组织公共空间，全员可访问；未指定部门时使用。',
    en: 'Organization public space, accessible to all members; used when no department is assigned.',
  },
  'workspace-0': {
    zh: '产品团队共享空间，用于需求与路线图协作。',
    en: 'Shared space for product teams to collaborate on requirements and roadmaps.',
  },
  'workspace-1': {
    zh: '研发团队工作区，管理工程资源与发布流程。',
    en: 'Engineering workspace for resources and release workflows.',
  },
  'workspace-2': {
    zh: '人力资源工作区，覆盖招聘与员工生命周期管理。',
    en: 'HR workspace for hiring and employee lifecycle management.',
  },
  'workspace-3': {
    zh: '信息技术工作区，用于账号、权限与基础设施管理。',
    en: 'IT workspace for accounts, access, and infrastructure.',
  },
  'workspace-4': {
    zh: '运营团队工作区，协调日常运营与流程执行。',
    en: 'Operations workspace for daily coordination and process execution.',
  },
  'workspace-5': {
    zh: '销售团队工作区，管理客户与商机协作。',
    en: 'Sales workspace for customer and opportunity collaboration.',
  },
  'workspace-6': {
    zh: '法务合规工作区，存放政策与审批相关材料。',
    en: 'Legal workspace for policies and approval materials.',
  },
  'workspace-7': {
    zh: '市场团队工作区，用于 campaign 与品牌资产协作。',
    en: 'Marketing workspace for campaigns and brand assets.',
  },
  'workspace-8': {
    zh: '财务工作区，用于预算、报销与报表协作。',
    en: 'Finance workspace for budgets, expenses, and reporting.',
  },
  'workspace-9': {
    zh: '客服团队工作区，处理工单与客户支持流程。',
    en: 'Support workspace for tickets and customer service workflows.',
  },
}

export type WorkspaceMemberEntry = {
  memberId: string
  roleId: string
  isLocked?: boolean
}

export const WORKSPACE_ADMIN_MEMBER_ID = 'member-workspace-admin'

export const WORKSPACE_ADMIN_MEMBER_ENTRY: WorkspaceMemberEntry = {
  memberId: WORKSPACE_ADMIN_MEMBER_ID,
  roleId: 'admin',
  isLocked: true,
}

const SEED_WORKSPACE_ADMIN_IDS = [
  'member-self',
  'member-hr-zhang',
  'member-it-li',
  'member-mgr-wang',
  'member-ops-chen',
] as const

const DEFAULT_NEW_WORKSPACE_ADMIN_ID = SEED_WORKSPACE_ADMIN_IDS[0]

function createLockedAdminEntry(memberId: string): WorkspaceMemberEntry {
  return {
    memberId,
    roleId: 'admin',
    isLocked: true,
  }
}

export function isWorkspaceLockedMember(
  entry: Pick<WorkspaceMemberEntry, 'memberId' | 'isLocked'>,
): boolean {
  return entry.isLocked === true || entry.memberId === WORKSPACE_ADMIN_MEMBER_ID
}

function ensureUniqueMembers(members: WorkspaceMemberEntry[]): WorkspaceMemberEntry[] {
  const seen = new Set<string>()
  return members.filter((entry) => {
    if (seen.has(entry.memberId)) return false
    seen.add(entry.memberId)
    return true
  })
}

function withWorkspaceAdmin(
  members: WorkspaceMemberEntry[],
  adminMemberId: string = DEFAULT_NEW_WORKSPACE_ADMIN_ID,
): WorkspaceMemberEntry[] {
  const others = members.filter(
    (entry) => !isWorkspaceLockedMember(entry) && entry.memberId !== adminMemberId,
  )
  return ensureUniqueMembers([createLockedAdminEntry(adminMemberId), ...others])
}

export type WorkspaceRow = {
  id: string
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
  accessMode: AccessMode
  members: WorkspaceMemberEntry[]
  memberCount: number
  createdAt: string
  isBuiltin: boolean
}

const WORKSPACE_LIST_LIMIT = 5

const SEED_MEMBER_COUNTS = [6, 7, 5, 8, 6]

const SEED_ACCESS_MODES: AccessMode[] = ['default', 'open', 'shared', 'private', 'open']

function seedCreatedAt(index: number): string {
  const date = new Date()
  date.setDate(date.getDate() - (index * 12 + 5))
  date.setHours(9 + (index % 8), (index * 7) % 60, 0, 0)
  return date.toISOString()
}

function seedMemberCount(index: number): number {
  return SEED_MEMBER_COUNTS[index % SEED_MEMBER_COUNTS.length] ?? 5
}

function seedWorkspaceMembers(index: number, count: number): WorkspaceMemberEntry[] {
  const adminMemberId = SEED_WORKSPACE_ADMIN_IDS[index % SEED_WORKSPACE_ADMIN_IDS.length]!
  const roleIds = WORKSPACE_ROLE_ROWS.map((role) => role.id)
  const start = index * 9
  const otherCount = Math.max(count - 1, 0)
  const others = Array.from({ length: otherCount }, (_, memberIndex) => ({
    memberId: ORG_MEMBERS_CATALOG[(start + memberIndex) % ORG_MEMBERS_CATALOG.length]!.id,
    roleId: roleIds[(index + memberIndex) % roleIds.length]!,
  })).filter((entry) => entry.memberId !== adminMemberId)
  return withWorkspaceAdmin(others, adminMemberId)
}

/** 默认工作区：组织全员以观察者身份加入 */
function buildDefaultWorkspaceMembers(): WorkspaceMemberEntry[] {
  const adminMemberId = DEFAULT_NEW_WORKSPACE_ADMIN_ID
  const others = ORG_MEMBERS_CATALOG.filter((member) => member.id !== adminMemberId).map((member) => ({
    memberId: member.id,
    roleId: 'user',
  }))
  return withWorkspaceAdmin(others, adminMemberId)
}

export function isDefaultWorkspace(workspace: Pick<WorkspaceRow, 'id'>): boolean {
  return workspace.id === 'default'
}

export const WORKSPACE_ROWS: WorkspaceRow[] = WORKSPACE_OPTIONS.slice(0, WORKSPACE_LIST_LIMIT).map(
  (option, index) => {
    const descriptions = WORKSPACE_DESCRIPTIONS[option.id] ?? {
      zh: '自定义工作区。',
      en: 'Custom workspace.',
    }
    const isDefault = option.id === 'default'
    const members = isDefault ? buildDefaultWorkspaceMembers() : seedWorkspaceMembers(index, seedMemberCount(index))
    return {
      id: option.id,
      nameZh: option.labelZh,
      nameEn: option.labelEn,
      descriptionZh: descriptions.zh,
      descriptionEn: descriptions.en,
      accessMode: isDefault ? 'shared' : (SEED_ACCESS_MODES[index % SEED_ACCESS_MODES.length] ?? 'default'),
      members,
      memberCount: members.length,
      createdAt: seedCreatedAt(index),
      isBuiltin: true,
    }
  },
)

export function isDeletableWorkspace(_workspace: Pick<WorkspaceRow, 'id'>): boolean {
  return true
}

export function localizeWorkspaceRowName(row: WorkspaceRow, locale: 'zh' | 'en'): string {
  return locale === 'zh' ? row.nameZh : row.nameEn
}

export function localizeWorkspaceRowDescription(row: WorkspaceRow, locale: 'zh' | 'en'): string {
  return locale === 'zh' ? row.descriptionZh : row.descriptionEn
}

export function formatWorkspaceCreatedAt(iso: string, locale: 'zh' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const pad2 = (value: number) => String(value).padStart(2, '0')
  if (locale === 'zh') {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function createWorkspaceRowFromPayload(payload: {
  name: string
  description: string
}): WorkspaceRow {
  const id = `workspace-custom-${Date.now()}`
  const createdAt = new Date().toISOString()
  const memberCount = 5 + (Date.now() % 4)
  const members = seedWorkspaceMembers(5 + (Date.now() % 3), memberCount)
  return {
    id,
    nameZh: payload.name,
    nameEn: payload.name,
    descriptionZh: payload.description,
    descriptionEn: payload.description,
    accessMode: 'default',
    members,
    memberCount: members.length,
    createdAt,
    isBuiltin: false,
  }
}
