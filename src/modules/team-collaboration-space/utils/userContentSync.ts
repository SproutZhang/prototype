import type { Agent } from '../../../types/agent'
import { buildInitialPublishedAgentNameSet } from '../../../i18n/agentLibraryStrings'
import { buildInitialPublishedScenarioSourceSet } from '../../../i18n/scenarioStrings'
import { getAgentCreatorDisplay } from '../../../utils/agentCardAttribution'
import {
  getContentLifecycleSnapshot,
  hasUnpublishedChanges as hasContentUnpublishedChanges,
  isContentFrozen,
} from './contentLifecycleSync'
import type {
  SyncUserContentAgentInput,
  UserContentAcquiredVia,
  UserContentItem,
  UserContentLifecycleStatus,
} from '../types/userContent'
import { SHARED_SPACE_ID } from '../data/sharedSpace'

const DEMO_AGENT_NAMES = [
  '入职流程编排Agent',
  'onboarding',
  'Leave Approval Workflow Agent',
  'Orientation Scheduler Agent',
  'Onboarding Support Agent',
  'Training Coordinator Agent',
  'Account Setup Agent',
  'Document Collection Agent',
  'HR Onboarding Agent',
  'Chief Technology Editor',
  'Technology Writer',
  'Technology Researcher',
  'Game Sprint Pipeline',
  'Art Asset Collaborator',
  'Game Bug Triage Agent',
]

const DEMO_OWNER_MEMBER_ID = 'member-mgr-wang'

const DEMO_SKILL_SEED: Array<{ id: string; name: string; desc: string; published: boolean }> = [
  {
    id: 'skill-marketing-psychology',
    name: 'marketing-psychology',
    desc: '应用心理学原则、心智模型与行为科学，帮助梳理营销策略与转化路径。',
    published: true,
  },
  {
    id: 'skill-account-briefing',
    name: 'account-briefing',
    desc: '当用户需要会前准备、快速了解客户背景或会议对象时启用。',
    published: true,
  },
  {
    id: 'skill-doc-coauthoring',
    name: 'doc-coauthoring',
    desc: '通过协作式流程帮助用户完成方案、技术文档、提案与规范撰写。',
    published: true,
  },
  {
    id: 'skill-canvas-design',
    name: 'canvas-design',
    desc: '帮助用户将抽象需求转化为结构化画布或页面原型设计。',
    published: false,
  },
  {
    id: 'skill-skill-creator',
    name: 'skill-creator',
    desc: '引导用户定义技能的目标、触发条件、边界与输出形式。',
    published: false,
  },
  {
    id: 'skill-web-artifacts-builder',
    name: 'web-artifacts-builder',
    desc: '帮助用户生成网页内容、组件草稿和可交付的前端文案资产。',
    published: true,
  },
  {
    id: 'skill-onboarding-playbook',
    name: 'onboarding-playbook',
    desc: '围绕入职场景生成流程、清单、材料模板与协作说明。',
    published: false,
  },
  {
    id: 'skill-meeting-prep',
    name: 'meeting-prep',
    desc: '将会议主题转成一页式准备摘要、风险提醒和提问提纲。',
    published: true,
  },
]

const DEMO_TOOL_SEED: Array<{ id: string; name: string; desc: string; published: boolean }> = [
  {
    id: 'tool-forms-intake',
    name: 'Google Forms 表单创建',
    desc: '为新员工信息采集、资料上传与待办确认生成标准化表单。',
    published: true,
  },
  {
    id: 'tool-trello-card',
    name: 'Trello 看板创建卡片',
    desc: '按新员工部门与入职阶段自动创建看板卡片并分配负责人。',
    published: true,
  },
  {
    id: 'tool-knowledge-answer',
    name: '从知识集中检索答案',
    desc: '根据员工提问从知识库中检索并返回标准答案与引用片段。',
    published: true,
  },
  {
    id: 'tool-csv-analyzer',
    name: '分析 CSV 数据',
    desc: '分析员工主数据表中的缺失字段、重复项和格式异常。',
    published: false,
  },
  {
    id: 'tool-upload-csv',
    name: '上传 CSV 到知识表',
    desc: '把 CSV 数据批量写入知识表，支持字段映射与冲突覆盖。',
    published: false,
  },
  {
    id: 'tool-teams-message',
    name: '通过 Teams 发送私信',
    desc: '向新员工或负责人发送 Teams 私信，用于通知、催办与提醒。',
    published: true,
  },
]

const DEMO_PUBLIC_SHARED_BY_KEY: Record<string, string> = {
  onboarding: 'member-mgr-wang',
  'HR Onboarding Agent': 'member-mgr-wang',
  'Leave Approval Workflow Agent': 'member-it-li',
}

const userContentById = new Map<string, UserContentItem>()
const listeners = new Set<() => void>()
let demoSeeded = false
let storeVersion = 0
let listSnapshotCache: { version: number; byMember: Map<string, UserContentItem[]> } | null = null

function invalidateListSnapshotCache() {
  storeVersion += 1
  listSnapshotCache = null
}

function notify() {
  invalidateListSnapshotCache()
  listeners.forEach((listener) => listener())
}

function pickScenarioCategory(seed: string): UserContentItem['category'] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0
  const v = h % 4
  return v === 0 ? 'medical' : v === 1 ? 'finance' : v === 2 ? 'tech' : 'accounting'
}

function pickAgentTag(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % 4 === 0 ? 'Managerial Agent' : 'Single Agent'
}

function resolveAcquiredVia(agent: Pick<Agent, 'provenance'>): UserContentAcquiredVia {
  if (agent.provenance === 'app-market-template') return 'template'
  return 'created'
}

function resolveLifecycleStatus(
  frozen: boolean,
  published: boolean,
): UserContentLifecycleStatus {
  if (frozen) return 'frozen'
  if (published) return 'published'
  return 'draft'
}

function buildUserContentId(contentKey: string): string {
  return `uc-${contentKey}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function isSameUserContentItem(a: UserContentItem, b: UserContentItem): boolean {
  return (
    a.id === b.id &&
    a.contentKey === b.contentKey &&
    a.ownerMemberId === b.ownerMemberId &&
    a.lifecycleStatus === b.lifecycleStatus &&
    a.displayName === b.displayName &&
    a.desc === b.desc &&
    a.meta === b.meta &&
    a.hasUnpublishedChanges === b.hasUnpublishedChanges &&
    a.scopes.join('|') === b.scopes.join('|') &&
    a.publishedTargets.length === b.publishedTargets.length
  )
}

function isAuxiliaryScopeItem(item: UserContentItem): boolean {
  const hasAgentOrScenario = item.scopes.includes('agent-library') || item.scopes.includes('scenario-config')
  const hasSkillOrTool = item.scopes.includes('skills') || item.scopes.includes('tools')
  return hasSkillOrTool && !hasAgentOrScenario
}

function buildMemberList(memberId: string): UserContentItem[] {
  let items = [...userContentById.values()].filter((item) => item.ownerMemberId === memberId)
  const ownedKeys = new Set(items.map((item) => item.contentKey))

  const demoSupplement = [...userContentById.values()]
    .filter((item) => item.ownerMemberId === DEMO_OWNER_MEMBER_ID)
    .filter((item) => !ownedKeys.has(item.contentKey))
    .filter((item) => isAuxiliaryScopeItem(item) || (items.length === 0 && memberId !== DEMO_OWNER_MEMBER_ID))
    .map((item) => ({ ...item, ownerMemberId: memberId }))

  items = [...items, ...demoSupplement]
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function ensureDemoSeed() {
  if (demoSeeded) return
  demoSeeded = true

  const publishedAgents = buildInitialPublishedAgentNameSet(DEMO_AGENT_NAMES)
  const publishedScenarios = buildInitialPublishedScenarioSourceSet(DEMO_AGENT_NAMES)
  const timestamp = nowIso()

  for (const name of DEMO_AGENT_NAMES) {
    const published = publishedAgents.has(name) || publishedScenarios.has(name)
    const demoPublisherId = DEMO_PUBLIC_SHARED_BY_KEY[name]
    const publishedTargets = demoPublisherId
      ? [
          {
            spaceId: SHARED_SPACE_ID,
            publishedAt: timestamp,
            publisherMemberId: demoPublisherId,
          },
        ]
      : []
    const id = buildUserContentId(name)
    userContentById.set(id, {
      id,
      contentKey: name,
      ownerMemberId: DEMO_OWNER_MEMBER_ID,
      acquiredVia: name === 'Technology Writer' || name === 'Technology Researcher' ? 'template' : 'created',
      lifecycleStatus: published || demoPublisherId ? 'published' : 'draft',
      displayName: name,
      desc: '',
      meta: 'just now',
      tag: pickAgentTag(name),
      category: pickScenarioCategory(name),
      creatorLabel: undefined,
      creatorVariant: name === 'Technology Writer' || name === 'Technology Researcher' ? 'template' : 'default',
      scopes: ['agent-library', 'scenario-config'],
      hasUnpublishedChanges: false,
      publishedTargets,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  for (const skill of DEMO_SKILL_SEED) {
    const id = buildUserContentId(skill.id)
    userContentById.set(id, {
      id,
      contentKey: skill.id,
      ownerMemberId: DEMO_OWNER_MEMBER_ID,
      acquiredVia: 'created',
      lifecycleStatus: skill.published ? 'published' : 'draft',
      displayName: skill.name,
      desc: skill.desc,
      meta: 'just now',
      tag: 'Skill',
      creatorLabel: undefined,
      creatorVariant: 'default',
      scopes: ['skills'],
      hasUnpublishedChanges: skill.published ? false : undefined,
      publishedTargets: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  for (const tool of DEMO_TOOL_SEED) {
    const id = buildUserContentId(tool.id)
    userContentById.set(id, {
      id,
      contentKey: tool.id,
      ownerMemberId: DEMO_OWNER_MEMBER_ID,
      acquiredVia: 'created',
      lifecycleStatus: tool.published ? 'published' : 'draft',
      displayName: tool.name,
      desc: tool.desc,
      meta: 'just now',
      tag: 'Tool',
      creatorLabel: undefined,
      creatorVariant: 'default',
      scopes: ['tools'],
      hasUnpublishedChanges: tool.published ? false : undefined,
      publishedTargets: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  invalidateListSnapshotCache()
}

export function subscribeUserContentSync(listener: () => void): () => void {
  ensureDemoSeed()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** 供 useSyncExternalStore 使用：同版本内返回稳定数组引用，避免无限 re-render */
export function listUserContentByMember(memberId: string): UserContentItem[] {
  ensureDemoSeed()
  if (!listSnapshotCache || listSnapshotCache.version !== storeVersion) {
    listSnapshotCache = { version: storeVersion, byMember: new Map() }
  }
  const cached = listSnapshotCache.byMember.get(memberId)
  if (cached) return cached
  const list = buildMemberList(memberId)
  listSnapshotCache.byMember.set(memberId, list)
  return list
}

function upsertUserContentFromAgentInternal(
  input: SyncUserContentAgentInput,
  locale: 'zh' | 'en' = 'zh',
): boolean {
  const { agent, memberId, scope, lifecycleStatus, hasUnpublishedChanges, publishedTargets } = input
  const contentKey = agent.name
  const id = buildUserContentId(contentKey)
  const creator = getAgentCreatorDisplay(agent, locale)
  const existing = userContentById.get(id)
  const timestamp = nowIso()
  const scopes = existing ? [...new Set([...existing.scopes, scope])] : [scope]

  const next: UserContentItem = {
    id,
    contentKey,
    ownerMemberId: memberId,
    acquiredVia: existing?.acquiredVia ?? resolveAcquiredVia(agent),
    lifecycleStatus,
    displayName: agent.label?.trim() || agent.name,
    desc: agent.desc,
    meta: agent.meta,
    tag: pickAgentTag(contentKey),
    category: pickScenarioCategory(contentKey),
    creatorLabel: creator.label,
    creatorVariant: creator.variant,
    scopes,
    hasUnpublishedChanges:
      hasUnpublishedChanges !== undefined
        ? hasUnpublishedChanges
        : existing?.hasUnpublishedChanges ?? false,
    publishedTargets: publishedTargets ?? existing?.publishedTargets ?? [],
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  if (existing && isSameUserContentItem(existing, next)) {
    return false
  }

  userContentById.set(id, next)
  return true
}

export function upsertUserContentFromAgent(input: SyncUserContentAgentInput, locale: 'zh' | 'en' = 'zh'): UserContentItem {
  ensureDemoSeed()
  const changed = upsertUserContentFromAgentInternal(input, locale)
  const item = userContentById.get(buildUserContentId(input.agent.name))!
  if (changed) notify()
  return item
}

export function removeUserContentByKey(contentKey: string): void {
  const id = buildUserContentId(contentKey)
  if (!userContentById.delete(id)) return
  notify()
}

export function renameUserContentKey(fromKey: string, toKey: string): void {
  const fromId = buildUserContentId(fromKey)
  const existing = userContentById.get(fromId)
  if (!existing) return
  userContentById.delete(fromId)
  const toId = buildUserContentId(toKey)
  userContentById.set(toId, {
    ...existing,
    id: toId,
    contentKey: toKey,
    updatedAt: nowIso(),
  })
  notify()
}

export type SyncAgentsSnapshot = {
  memberId: string
  locale?: 'zh' | 'en'
}

export function syncUserContentFromAgents(agents: Agent[], snapshot: SyncAgentsSnapshot): void {
  ensureDemoSeed()
  const lifecycle = getContentLifecycleSnapshot()
  const locale = snapshot.locale ?? 'zh'
  const agentKeys = new Set(agents.map((agent) => agent.name))
  let changed = false

  for (const agent of agents) {
    const contentKey = agent.name
    const existing = userContentById.get(buildUserContentId(contentKey))
    const frozen = isContentFrozen(contentKey)
    let published =
      lifecycle.publishedAgentNames.has(contentKey) ||
      lifecycle.publishedScenarioSourceNames.has(contentKey)
    if (!published && !frozen && existing?.lifecycleStatus === 'published') {
      published = true
    }
    const lifecycleStatus = resolveLifecycleStatus(frozen, published)
    let hasUnpublishedChanges = hasContentUnpublishedChanges(contentKey)
    if (!hasUnpublishedChanges && existing?.hasUnpublishedChanges) {
      hasUnpublishedChanges = existing.hasUnpublishedChanges
    }

    const spaceId = lifecycle.agentPublishedSpaceByName[contentKey]
    const publishedTargets =
      spaceId != null
        ? existing?.publishedTargets?.some((target) => target.spaceId === spaceId)
          ? existing.publishedTargets
          : [
              {
                spaceId,
                publishedAt: nowIso(),
                publisherMemberId: snapshot.memberId,
              },
            ]
        : existing?.publishedTargets ?? []

    if (
      upsertUserContentFromAgentInternal(
        {
          agent,
          memberId: snapshot.memberId,
          scope: 'agent-library',
          lifecycleStatus,
          hasUnpublishedChanges,
          publishedTargets,
        },
        locale,
      )
    ) {
      changed = true
    }

    if (
      upsertUserContentFromAgentInternal(
        {
          agent,
          memberId: snapshot.memberId,
          scope: 'scenario-config',
          lifecycleStatus,
          hasUnpublishedChanges,
          publishedTargets,
        },
        locale,
      )
    ) {
      changed = true
    }
  }

  for (const item of [...userContentById.values()]) {
    if (item.ownerMemberId !== snapshot.memberId) continue
    if (agentKeys.has(item.contentKey)) continue
    if (isAuxiliaryScopeItem(item)) continue
    userContentById.delete(item.id)
    changed = true
  }

  if (changed) notify()
}

export type SyncSkillsSnapshot = {
  memberId: string
}

export type SyncSkillInput = {
  id: string
  name: string
  description: string
}

function upsertUserContentSkillInternal(skill: SyncSkillInput, memberId: string): boolean {
  const contentKey = skill.id
  const id = buildUserContentId(contentKey)
  const existing = userContentById.get(id)
  const timestamp = nowIso()
  const next: UserContentItem = {
    id,
    contentKey,
    ownerMemberId: memberId,
    acquiredVia: existing?.acquiredVia ?? 'created',
    lifecycleStatus: existing?.lifecycleStatus ?? 'published',
    displayName: skill.name,
    desc: skill.description,
    meta: 'just now',
    tag: 'Skill',
    creatorLabel: undefined,
    creatorVariant: 'default',
    scopes: ['skills'],
    hasUnpublishedChanges: existing?.hasUnpublishedChanges,
    publishedTargets: existing?.publishedTargets ?? [],
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  if (existing && isSameUserContentItem(existing, next)) {
    return false
  }

  userContentById.set(id, next)
  return true
}

export function syncUserContentFromSkills(skills: SyncSkillInput[], snapshot: SyncSkillsSnapshot): void {
  ensureDemoSeed()
  const skillKeys = new Set(skills.map((skill) => skill.id))
  let changed = false

  for (const skill of skills) {
    if (upsertUserContentSkillInternal(skill, snapshot.memberId)) {
      changed = true
    }
  }

  for (const item of [...userContentById.values()]) {
    if (item.ownerMemberId !== snapshot.memberId) continue
    if (!item.scopes.includes('skills') || !isAuxiliaryScopeItem(item)) continue
    if (skillKeys.has(item.contentKey)) continue
    userContentById.delete(item.id)
    changed = true
  }

  if (changed) notify()
}

export type SyncToolsSnapshot = {
  memberId: string
}

export type SyncToolInput = {
  id: string
  name: string
  description: string
}

function upsertUserContentToolInternal(tool: SyncToolInput, memberId: string): boolean {
  const contentKey = tool.id
  const id = buildUserContentId(contentKey)
  const existing = userContentById.get(id)
  const timestamp = nowIso()
  const next: UserContentItem = {
    id,
    contentKey,
    ownerMemberId: memberId,
    acquiredVia: existing?.acquiredVia ?? 'created',
    lifecycleStatus: existing?.lifecycleStatus ?? 'published',
    displayName: tool.name,
    desc: tool.description,
    meta: 'just now',
    tag: 'Tool',
    creatorLabel: undefined,
    creatorVariant: 'default',
    scopes: ['tools'],
    hasUnpublishedChanges: existing?.hasUnpublishedChanges,
    publishedTargets: existing?.publishedTargets ?? [],
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  if (existing && isSameUserContentItem(existing, next)) {
    return false
  }

  userContentById.set(id, next)
  return true
}

export function syncUserContentFromTools(tools: SyncToolInput[], snapshot: SyncToolsSnapshot): void {
  ensureDemoSeed()
  const toolKeys = new Set(tools.map((tool) => tool.id))
  let changed = false

  for (const tool of tools) {
    if (upsertUserContentToolInternal(tool, snapshot.memberId)) {
      changed = true
    }
  }

  for (const item of [...userContentById.values()]) {
    if (item.ownerMemberId !== snapshot.memberId) continue
    if (!item.scopes.includes('tools') || !isAuxiliaryScopeItem(item)) continue
    if (toolKeys.has(item.contentKey)) continue
    userContentById.delete(item.id)
    changed = true
  }

  if (changed) notify()
}

export function updateUserContentLifecycle(
  contentKey: string,
  lifecycleStatus: UserContentLifecycleStatus,
  options?: { hasUnpublishedChanges?: boolean },
): void {
  const id = buildUserContentId(contentKey)
  const existing = userContentById.get(id)
  if (!existing) return
  const next = {
    ...existing,
    lifecycleStatus,
    hasUnpublishedChanges: options?.hasUnpublishedChanges ?? existing.hasUnpublishedChanges,
    updatedAt: nowIso(),
  }
  if (isSameUserContentItem(existing, next)) return
  userContentById.set(id, next)
  notify()
}

export function addUserContentPublishedTarget(
  contentKey: string,
  target: UserContentItem['publishedTargets'][number],
): void {
  const id = buildUserContentId(contentKey)
  const existing = userContentById.get(id)
  if (!existing) return
  const withoutSpace = existing.publishedTargets.filter((entry) => entry.spaceId !== target.spaceId)
  userContentById.set(id, {
    ...existing,
    lifecycleStatus: 'published',
    hasUnpublishedChanges: false,
    publishedTargets: [...withoutSpace, target],
    updatedAt: nowIso(),
  })
  notify()
}

/** 供公共空间「共享内容」列表聚合 */
export function listAllUserContent(): UserContentItem[] {
  ensureDemoSeed()
  return [...userContentById.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function removeUserContentPublishedTarget(contentKey: string, spaceId: string): boolean {
  const id = buildUserContentId(contentKey)
  const existing = userContentById.get(id)
  if (!existing) return false
  const nextTargets = existing.publishedTargets.filter((target) => target.spaceId !== spaceId)
  if (nextTargets.length === existing.publishedTargets.length) return false

  const stillPublished = nextTargets.length > 0
  const next: UserContentItem = {
    ...existing,
    lifecycleStatus: stillPublished ? (existing.lifecycleStatus === 'frozen' ? 'frozen' : 'published') : 'draft',
    hasUnpublishedChanges: stillPublished ? existing.hasUnpublishedChanges : false,
    publishedTargets: nextTargets,
    updatedAt: nowIso(),
  }
  userContentById.set(id, next)
  notify()
  return true
}
