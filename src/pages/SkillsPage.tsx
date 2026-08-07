import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'

import { JoyceAiPanel, type JoyceChatMessage } from '../components/shared/JoyceAiPanel'
import { useLocale } from '../i18n/LocaleContext'
import {
  getSkillCardTag,
  getSkillsPageText,
  isMarketplaceSkill,
  localizeSkillForDisplay,
  skillsT,
} from '../i18n/skillsStrings'
import type { AppMarketItem } from '../modules/app-market/shared/types'
import { useRbac } from '../auth/useRbac'
import { SectionIterationVersionModal } from '../modules/team-collaboration-space/components/SectionIterationVersionModal'
import type { SectionIterationPublishPayload } from '../modules/team-collaboration-space/utils/appendSectionIterationRecord'
import { recordInitialSectionIteration } from '../modules/team-collaboration-space/utils/appendSectionIterationRecord'
import { publishSectionIteration } from '../modules/team-collaboration-space/utils/publishSectionIteration'
import { tcsT } from '../modules/team-collaboration-space/i18n/strings'

const SKILL_CREATOR_NAME = 'Martin'
const SKILLS_PER_PAGE = 7

export type SkillItem = {
  id: string
  name: string
  description: string
  creator: string
  createdAt?: string
  trigger: string
  detailDescription: string
  previewTitle: string
  instructions: string
  files: SkillFileNode[]
}

type SkillFileNode = {
  id: string
  name: string
  kind: 'file' | 'folder'
  content?: string
  children?: SkillFileNode[]
}

type SkillSavedVersion = {
  id: string
  label: string
  meta: string
  savedAt: number
  snapshot: Record<string, string>
}

type SkillCreateView = 'list' | 'create-ai'
type SkillsListViewMode = 'table' | 'cards'

function hashSeed(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 37 + seed.charCodeAt(index)) >>> 0
  }
  return hash
}

function getSkillCardIconStyle(seed: string): CSSProperties {
  const palettes = [
    { from: '#7f7cff', via: '#8b5cf6', to: '#ff9a62', shadow: 'rgba(124, 92, 255, 0.28)' },
    { from: '#5ea8ff', via: '#5b7cff', to: '#7b61ff', shadow: 'rgba(91, 124, 255, 0.24)' },
    { from: '#ffd36a', via: '#ffab5b', to: '#ff7b72', shadow: 'rgba(255, 171, 91, 0.26)' },
    { from: '#62d6a5', via: '#33c0b8', to: '#3f8cff', shadow: 'rgba(51, 192, 184, 0.24)' },
    { from: '#ff8cb7', via: '#ff7d95', to: '#9a6bff', shadow: 'rgba(255, 125, 149, 0.25)' },
    { from: '#7ad7ff', via: '#4ca9ff', to: '#7c73ff', shadow: 'rgba(76, 169, 255, 0.24)' },
    { from: '#19c7c7', via: '#2d9bf0', to: '#6d6bff', shadow: 'rgba(45, 155, 240, 0.24)' },
    { from: '#ffb86c', via: '#ff8f70', to: '#ff6ea8', shadow: 'rgba(255, 143, 112, 0.24)' },
  ] as const

  const hash = hashSeed(seed)
  const palette = palettes[hash % palettes.length]
  return {
    '--agent-icon-from': palette.from,
    '--agent-icon-via': palette.via,
    '--agent-icon-to': palette.to,
    '--agent-icon-shadow': palette.shadow,
  } as CSSProperties
}

function formatSkillCreatedDate(skill: SkillItem, locale: 'zh' | 'en'): string {
  const fallbackBaseUtc = Date.UTC(2026, 0, 1)
  const fallbackOffsetDays = hashSeed(skill.id) % 120
  const createdDate = skill.createdAt
    ? new Date(skill.createdAt)
    : new Date(fallbackBaseUtc + fallbackOffsetDays * 24 * 60 * 60 * 1000)

  if (Number.isNaN(createdDate.getTime())) return locale === 'zh' ? '2026年2月11日' : 'Feb 11, 2026'

  if (locale === 'zh') {
    return `${createdDate.getFullYear()}年${createdDate.getMonth() + 1}月${createdDate.getDate()}日`
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(createdDate)
}

type SkillSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: { results: ArrayLike<{ [index: number]: { transcript: string } }> }) => void) | null
}

type SkillResponseType = 'normal' | 'skill_creation'
type SkillResponseStatus = 'idle' | 'streaming' | 'complete'
type ProcessingChipType = 'document' | 'script' | 'tool' | 'folder' | 'validation'
type ProcessingChipStatus = 'pending' | 'running' | 'complete' | 'error'

type ProcessingItem =
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'chip'
      id: string
      label: string
      chipType: ProcessingChipType
      status: ProcessingChipStatus
      detailTitle: string
      detailContent: string
      detailFormat: 'markdown' | 'code' | 'json' | 'plain'
      fileName?: string
      language?: string
    }

type SkillsChatMessage = JoyceChatMessage & {
  responseType?: SkillResponseType
  processingStatus?: SkillResponseStatus
  finalStatus?: SkillResponseStatus
  isProcessingExpanded?: boolean
  processingTitle?: string
  processingItems?: ProcessingItem[]
  visibleProcessingItemCount?: number
  activeProcessingChipId?: string | null
  finalText?: string
  visibleFinalText?: string
  createdSkillName?: string
  createdSkillContent?: string
}

type SkillCreationDraft = {
  skillName: string
  purpose: string
  whenToUse: string[]
  workflow: string[]
  keyInputs: string[]
  expectedOutputs: string[]
  refinementQuestion: string
  helperScriptName: string
  skillFileContent: string
  processingItems: ProcessingItem[]
  finalSections: string[]
  finalText: string
}

type SkillsSortOrder = 'recent' | 'a-z' | 'z-a'
type SkillsTab = 'all' | 'referenced' | 'mine'

type SkillsPageProps = {
  skills: SkillItem[]
  onSkillsChange: Dispatch<SetStateAction<SkillItem[]>>
  installedSkillTemplates?: AppMarketItem[]
  onBrowseLibrary?: () => void
}

const SKILL_UPLOAD_ACCEPT = '.zip,.md,text/markdown,application/zip,application/x-zip-compressed'

function createBrowserSpeechRecognition(): SkillSpeechRecognition | null {
  if (typeof globalThis.window === 'undefined') return null
  const w = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => SkillSpeechRecognition
    webkitSpeechRecognition?: new () => SkillSpeechRecognition
  }
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return ctor ? new ctor() : null
}

function collectFolderIds(nodes: SkillFileNode[]): string[] {
  return nodes.flatMap((node) =>
    node.kind === 'folder' ? [node.id, ...(node.children ? collectFolderIds(node.children) : [])] : [],
  )
}

function findFirstFileId(nodes: SkillFileNode[]): string | null {
  for (const node of nodes) {
    if (node.kind === 'file') return node.id
    if (node.children?.length) {
      const nested = findFirstFileId(node.children)
      if (nested) return nested
    }
  }
  return null
}

function findFileById(
  nodes: SkillFileNode[],
  targetId: string,
  ancestors: string[] = [],
): { node: SkillFileNode; path: string[] } | null {
  for (const node of nodes) {
    const nextPath = [...ancestors, node.name]
    if (node.id === targetId) {
      return { node, path: nextPath }
    }
    if (node.children?.length) {
      const nested = findFileById(node.children, targetId, nextPath)
      if (nested) return nested
    }
  }
  return null
}

function buildSkillFileSnapshot(skill: SkillItem): Record<string, string> {
  const snapshot: Record<string, string> = {}

  const visit = (nodes: SkillFileNode[], ancestors: string[] = []) => {
    nodes.forEach((node) => {
      const path = [...ancestors, node.name]
      if (node.kind === 'file') {
        snapshot[node.id] = node.content ?? buildGeneratedFileContent(skill, path)
        return
      }
      if (node.children?.length) visit(node.children, path)
    })
  }

  visit(skill.files)
  return snapshot
}

function mergeSkillSnapshots(baseSnapshot: Record<string, string>, overrideSnapshot?: Record<string, string>) {
  return overrideSnapshot ? { ...baseSnapshot, ...overrideSnapshot } : { ...baseSnapshot }
}

function cloneSkillSnapshot(snapshot: Record<string, string>) {
  return { ...snapshot }
}

function areSkillSnapshotsEqual(left: Record<string, string>, right: Record<string, string>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if ((left[key] ?? '') !== (right[key] ?? '')) return false
  }
  return true
}

function applySnapshotToSkillFiles(
  skill: SkillItem,
  nodes: SkillFileNode[],
  snapshot: Record<string, string>,
  ancestors: string[] = [],
): SkillFileNode[] {
  return nodes.map((node) => {
    const path = [...ancestors, node.name]
    if (node.kind === 'file') {
      return {
        ...node,
        content: snapshot[node.id] ?? node.content ?? buildGeneratedFileContent(skill, path),
      }
    }

    return {
      ...node,
      children: node.children ? applySnapshotToSkillFiles(skill, node.children, snapshot, path) : node.children,
    }
  })
}

function applySnapshotToSkill(skill: SkillItem, snapshot: Record<string, string>): SkillItem {
  const firstFileId = findFirstFileId(skill.files)
  const nextInstructions = firstFileId ? (snapshot[firstFileId] ?? skill.instructions) : skill.instructions

  return {
    ...skill,
    instructions: nextInstructions,
    files: applySnapshotToSkillFiles(skill, skill.files, snapshot),
  }
}

function formatVersionRelativeTime(timestamp: number, locale: 'zh' | 'en') {
  const elapsedMs = Date.now() - timestamp
  if (elapsedMs < 60_000) return locale === 'zh' ? '刚刚' : 'now'

  const minutes = Math.floor(elapsedMs / 60_000)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  return `${days}d`
}

function buildSavedVersionLabel(index: number, locale: 'zh' | 'en') {
  return locale === 'zh' ? `版本 ${index}` : `Version ${index}`
}

export function createInstalledMarketSkillItem(item: AppMarketItem, locale: 'zh' | 'en'): SkillItem {
  const name = locale === 'zh' ? item.nameZh : item.nameEn
  const description = locale === 'zh' ? item.descriptionZh : item.descriptionEn
  const detailDescription =
    locale === 'zh'
      ? (item.modalDescriptionZh ?? item.descriptionZh)
      : (item.modalDescriptionEn ?? item.descriptionEn)
  const pluginTools = locale === 'zh' ? (item.pluginToolsZh ?? []) : (item.pluginToolsEn ?? item.pluginToolsZh ?? [])
  const normalizedName =
    item.nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || item.id

  return {
    id: `market-skill-${item.id}`,
    name,
    description,
    creator: item.publisher,
    trigger: skillsT(locale, 'triggerMarketplaceInstall'),
    detailDescription,
    previewTitle: name,
    instructions: `---
name: ${normalizedName}
publisher: ${item.publisher}
rating: ${item.rating.toFixed(1)}
installs: ${item.installs}
---

# ${name}

## Description
${detailDescription}

## When to Use
- ${locale === 'zh' ? `当你需要复用「${name}」的能力模板时使用。` : `Use when you need the "${name}" reusable capability.`}
- ${locale === 'zh' ? '适合工作流步骤、子代理话术和模板化执行场景。' : 'Useful for workflow steps, sub-agent prompts, and templated execution.'}

## Plugin Tools
${pluginTools.length > 0 ? pluginTools.map((tool) => `- ${tool}`).join('\n') : locale === 'zh' ? '- 暂无关联插件工具' : '- No linked plugin tools'}
`,
    files: [
      { id: `market-skill-file-${item.id}`, name: 'SKILL.md', kind: 'file' },
      {
        id: `market-skill-ref-${item.id}`,
        name: 'references',
        kind: 'folder',
        children: [{ id: `market-skill-overview-${item.id}`, name: 'overview.md', kind: 'file' }],
      },
      {
        id: `market-skill-scripts-${item.id}`,
        name: 'scripts',
        kind: 'folder',
        children: [{ id: `market-skill-script-${item.id}`, name: 'run_skill.py', kind: 'file' }],
      },
    ],
  }
}

export const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'skill-marketing-psychology',
    name: 'marketing-psychology',
    description: '应用心理学原则、心智模型与行为科学，帮助梳理营销策略与转化路径。',
    creator: SKILL_CREATOR_NAME,
    trigger: 'Slash command + 自动',
    detailDescription:
      '通过结构化提示框架帮助用户快速拆解营销目标、受众、利益点和转化路径，适用于撰写营销方案、活动页文案和品牌增长内容。',
    previewTitle: 'Marketing Psychology Workflow',
    instructions: `该技能会引导用户先明确目标受众、核心诉求与转化动作，再生成文案方向、说服结构和测试建议。

适用场景：
- 用户提出撰写营销方案、落地页或广告文案
- 用户希望优化转化率、用户激励或 CTA 表达
- 用户需要将抽象卖点转成更易理解的利益点

执行方式：
1. 先确认业务目标、受众和渠道
2. 提炼用户痛点、阻力与决策动机
3. 输出结构化文案建议与测试方向`,
    files: [
      { id: 'm-skill', name: 'SKILL.md', kind: 'file' },
      {
        id: 'm-references',
        name: 'references',
        kind: 'folder',
        children: [
          { id: 'm-ref-1', name: 'frameworks.md', kind: 'file' },
          { id: 'm-ref-2', name: 'examples.md', kind: 'file' },
        ],
      },
      {
        id: 'm-scripts',
        name: 'scripts',
        kind: 'folder',
        children: [
          { id: 'm-script-1', name: 'outline_generator.py', kind: 'file' },
          { id: 'm-script-2', name: 'headline_tester.py', kind: 'file' },
        ],
      },
    ],
  },
  {
    id: 'skill-account-briefing',
    name: 'account-briefing',
    description: '当用户需要会前准备、快速了解客户背景或会议对象时启用。',
    creator: SKILL_CREATOR_NAME,
    trigger: '会议准备 + 自动',
    detailDescription:
      '聚合客户背景、行业上下文、关键联系人信息和推荐提问方式，适用于销售拜访、客户成功续约和高层沟通场景。',
    previewTitle: 'Account Briefing Workflow',
    instructions: `该技能帮助用户在会议前快速整理客户背景、核心风险点和建议提问。

适用场景：
- 用户准备客户会议、售前演示或续约复盘
- 用户需要快速了解联系人、公司近况和合作状态

执行方式：
1. 汇总客户信息与会议目标
2. 提炼关键风险、机会和跟进动作
3. 输出简要 briefing 与推荐开场问题`,
    files: [
      { id: 'a-skill', name: 'SKILL.md', kind: 'file' },
      {
        id: 'a-references',
        name: 'references',
        kind: 'folder',
        children: [
          { id: 'a-ref-1', name: 'account_checklist.md', kind: 'file' },
          { id: 'a-ref-2', name: 'meeting_prep.md', kind: 'file' },
        ],
      },
      {
        id: 'a-scripts',
        name: 'scripts',
        kind: 'folder',
        children: [
          { id: 'a-script-1', name: 'briefing_builder.py', kind: 'file' },
        ],
      },
    ],
  },
  {
    id: 'skill-doc-coauthoring',
    name: 'doc-coauthoring',
    description: '通过协作式流程帮助用户完成方案、技术文档、提案与规范撰写。',
    creator: SKILL_CREATOR_NAME,
    trigger: '文档写作 + 自动',
    detailDescription:
      '引导用户分阶段收集上下文、搭建结构、补全细节并进行读者校验，适合 PRD、方案、提案、技术设计文档等内容共创。',
    previewTitle: 'Doc Co-Authoring Workflow',
    instructions: `该技能提供一套文档共创流程，用于指导用户完成从结构梳理到内容润色的全过程。

触发条件：
- 用户提到撰写文档、提案、技术规范、决策文档
- 用户希望把零散想法快速整理成结构化内容

执行方式：
1. 先澄清文档目标、读者和输出格式
2. 生成建议目录与章节重点
3. 逐段补全内容并校验可读性`,
    files: [
      { id: 'd-skill', name: 'SKILL.md', kind: 'file' },
      {
        id: 'd-references',
        name: 'references',
        kind: 'folder',
        children: [
          { id: 'd-ref-1', name: 'api_reference.md', kind: 'file' },
          { id: 'd-ref-2', name: 'parse_prompt.md', kind: 'file' },
        ],
      },
      {
        id: 'd-scripts',
        name: 'scripts',
        kind: 'folder',
        children: [
          { id: 'd-script-1', name: 'example.py', kind: 'file' },
          { id: 'd-script-2', name: 'extract_resume.py', kind: 'file' },
        ],
      },
    ],
  },
  {
    id: 'skill-canvas-design',
    name: 'canvas-design',
    description: '帮助用户将抽象需求转化为结构化画布或页面原型设计。',
    creator: SKILL_CREATOR_NAME,
    trigger: '画布设计 + 手动',
    detailDescription:
      '适用于工作流画布、Agent 配置页、分析页等复杂产品界面的信息结构设计，强调布局区域、交互状态与实现建议。',
    previewTitle: 'Canvas Design Workflow',
    instructions: `该技能擅长将用户需求拆解为页面区域、组件层级和交互状态。

适用场景：
- 用户要设计复杂工作台、配置页或多栏画布
- 用户提供参考图，希望翻译成产品设计结构

执行方式：
1. 先划分主要区域和信息层级
2. 定义每个区域的触发动作和状态
3. 给出便于 Cursor 落地的实现顺序`,
    files: [
      { id: 'c-skill', name: 'SKILL.md', kind: 'file' },
      { id: 'c-map', name: 'layout-map.md', kind: 'file' },
      {
        id: 'c-references',
        name: 'references',
        kind: 'folder',
        children: [{ id: 'c-ref-1', name: 'canvas-patterns.md', kind: 'file' }],
      },
    ],
  },
  {
    id: 'skill-skill-creator',
    name: 'skill-creator',
    description: '引导用户定义技能的目标、触发条件、边界与输出形式。',
    creator: SKILL_CREATOR_NAME,
    trigger: '技能创建 + 自动',
    detailDescription:
      '面向创建新技能时的需求收集与模板生成，帮助用户先定义清楚技能边界，再生成更稳定的 Skill 说明。',
    previewTitle: 'Skill Creator Workflow',
    instructions: `该技能用于帮助用户设计新的技能定义。

核心步骤：
1. 明确技能要解决的问题和目标
2. 确认触发场景、依赖工具和限制条件
3. 生成可复用的技能说明草稿和执行建议`,
    files: [
      { id: 's-skill', name: 'SKILL.md', kind: 'file' },
      { id: 's-template', name: 'template.md', kind: 'file' },
      {
        id: 's-references',
        name: 'references',
        kind: 'folder',
        children: [{ id: 's-ref-1', name: 'prompt-patterns.md', kind: 'file' }],
      },
    ],
  },
  {
    id: 'skill-web-artifacts-builder',
    name: 'web-artifacts-builder',
    description: '帮助用户生成网页内容、组件草稿和可交付的前端文案资产。',
    creator: SKILL_CREATOR_NAME,
    trigger: 'Web 产物 + 自动',
    detailDescription:
      '适用于需要把需求直接落地为网页模块说明、信息结构、文案资产或界面片段的任务，强调可复用和可交付。',
    previewTitle: 'Web Artifacts Builder',
    instructions: `该技能帮助用户快速整理网页产物所需的结构、文案和交付格式。

适用场景：
- 页面落地、专题页搭建、营销页资产整理
- 需要快速给出模块结构和前端实现草案

执行方式：
1. 确认页面目标与受众
2. 输出模块结构、主文案和 CTA
3. 按交付格式整理可复用内容`,
    files: [
      { id: 'w-skill', name: 'SKILL.md', kind: 'file' },
      {
        id: 'w-references',
        name: 'references',
        kind: 'folder',
        children: [{ id: 'w-ref-1', name: 'artifact-spec.md', kind: 'file' }],
      },
      {
        id: 'w-scripts',
        name: 'scripts',
        kind: 'folder',
        children: [{ id: 'w-script-1', name: 'asset_packager.py', kind: 'file' }],
      },
    ],
  },
  {
    id: 'skill-onboarding-playbook',
    name: 'onboarding-playbook',
    description: '围绕入职场景生成流程、清单、材料模板与协作说明。',
    creator: SKILL_CREATOR_NAME,
    trigger: '入职流程 + 自动',
    detailDescription:
      '帮助 HR、IT 与用人经理围绕员工入职场景生成步骤清单、材料模板和协作对齐说明，适合标准化入职设计。',
    previewTitle: 'Onboarding Playbook',
    instructions: `该技能聚焦于新员工入职流程的拆解和标准化。

典型输出：
- 入职阶段清单
- 责任人分工
- 材料模板与提醒节点

适用于需要快速搭建入职 playbook、流程说明或协作 checklist 的场景。`,
    files: [
      { id: 'o-skill', name: 'SKILL.md', kind: 'file' },
      { id: 'o-checklist', name: 'checklist.md', kind: 'file' },
      {
        id: 'o-references',
        name: 'references',
        kind: 'folder',
        children: [{ id: 'o-ref-1', name: 'handoff-template.md', kind: 'file' }],
      },
    ],
  },
  {
    id: 'skill-meeting-prep',
    name: 'meeting-prep',
    description: '将会议主题转成一页式准备摘要、风险提醒和提问提纲。',
    creator: SKILL_CREATOR_NAME,
    trigger: '会议准备 + Slash',
    detailDescription:
      '帮助用户围绕会议主题整理目标、对方背景、预期结果与关键问题，适用于高层汇报、客户会议和项目同步。',
    previewTitle: 'Meeting Preparation',
    instructions: `该技能适合用户在会议前快速做准备。

执行方式：
1. 提炼会议目标、角色和决策点
2. 生成风险提醒和推荐提问
3. 输出一页式准备摘要与会后跟进建议`,
    files: [
      { id: 'mp-skill', name: 'SKILL.md', kind: 'file' },
      {
        id: 'mp-references',
        name: 'references',
        kind: 'folder',
        children: [{ id: 'mp-ref-1', name: 'question-bank.md', kind: 'file' }],
      },
      {
        id: 'mp-scripts',
        name: 'scripts',
        kind: 'folder',
        children: [{ id: 'mp-script-1', name: 'agenda_builder.py', kind: 'file' }],
      },
    ],
  },
]

const INITIAL_USER_PROMPT = '让我们一起创建一个 Skill。请先问我这个 Skill 应该做什么，并在开始前充分理解需求。'

const INITIAL_ASSISTANT_REPLY = `在开始设计高质量技能之前，我需要先充分理解你的目标。

请先告诉我：
1. 这个技能的核心目的是什么？它要解决什么问题，主要目标是什么？
2. 这个技能应在什么情况下被触发？哪些用户请求或场景应激活它？
3. 这个技能会和哪些集成、工具或数据源交互？例如 Slack、邮件、Google Sheets、网页抓取、本地沙箱或自定义 API。
4. 有没有必须遵守的规则、模板、输出格式或严格限制？

你现在最想创建的这个技能，主要希望它帮你完成什么任务？`

function isSkillCreationPrompt(input: string) {
  return /(创建技能|技能|create\s+skill|build\s+skill|\bskill\b|\bskills\b)/i.test(input)
}

function inferSkillName(input: string) {
  const tokenRules = [
    { pattern: /pdf/i, token: 'pdf' },
    { pattern: /文档|document|doc/i, token: 'document' },
    { pattern: /总结|摘要|summary|summarize/i, token: 'summary' },
    { pattern: /大纲|outline/i, token: 'outline' },
    { pattern: /markdown|md/i, token: 'markdown' },
    { pattern: /json/i, token: 'json' },
    { pattern: /表格|table|sheet|excel|csv/i, token: 'table' },
    { pattern: /网页|web|url/i, token: 'web' },
    { pattern: /抓取|crawl|scrape/i, token: 'scrape' },
    { pattern: /分析|analy/i, token: 'analysis' },
    { pattern: /报告|report/i, token: 'report' },
    { pattern: /邮件|email/i, token: 'email' },
    { pattern: /客服|support/i, token: 'support' },
    { pattern: /翻译|translate/i, token: 'translate' },
    { pattern: /知识库|knowledge/i, token: 'knowledge' },
  ]
  const tokens = tokenRules.filter((rule) => rule.pattern.test(input)).map((rule) => rule.token)
  const uniqueTokens = Array.from(new Set(tokens)).slice(0, 4)
  if (uniqueTokens.length === 0) return 'custom-skill-draft'
  return uniqueTokens.join('-')
}

function inferHelperScriptName(input: string) {
  if (/resume|简历/i.test(input)) return 'parse_resume.py'
  if (/pdf|文档|document|doc/i.test(input)) return 'extract_text.py'
  if (/网页|web|url|crawl|scrape/i.test(input)) return 'scrape_content.py'
  if (/表格|table|excel|csv|sheet/i.test(input)) return 'normalize_table.py'
  return 'generate_result.py'
}

function buildSkillCreationDraft(input: string): SkillCreationDraft {
  const trimmed = input.trim()
  const skillName = inferSkillName(trimmed)
  const helperScriptName = inferHelperScriptName(trimmed)
  const lower = trimmed.toLowerCase()
  const sourceLabel =
    /pdf/i.test(trimmed)
      ? 'PDF 文档'
      : /文档|document|doc/i.test(trimmed)
        ? '文档内容'
        : /网页|web|url/i.test(trimmed)
          ? '网页或链接内容'
          : /表格|sheet|excel|csv/i.test(trimmed)
            ? '表格数据'
            : '用户提供的原始输入'
  const outputLabel =
    /json/i.test(lower)
      ? '结构化 JSON'
      : /表格|table|excel|csv/i.test(lower)
        ? '结构化表格'
        : /markdown|md/i.test(lower)
          ? 'Markdown 文档'
          : /大纲|outline/i.test(lower)
            ? '结构化大纲'
            : '结构化结果'

  const workflow = ['识别用户目标、使用场景与约束边界']
  if (/pdf/i.test(trimmed)) workflow.push('读取 PDF 文档并提取可处理文本')
  else if (/文档|document|doc/i.test(trimmed)) workflow.push('读取文档内容并抽取关键信息')
  else if (/网页|web|url/i.test(trimmed)) workflow.push('抓取网页内容并清洗正文与结构')
  else if (/表格|sheet|excel|csv/i.test(trimmed)) workflow.push('读取表格字段并识别关键数据关系')
  else workflow.push('接收用户输入并标准化任务上下文')

  if (/总结|摘要|summary|summarize/i.test(trimmed)) workflow.push('提炼核心信息并生成压缩摘要')
  if (/大纲|outline/i.test(trimmed)) workflow.push('将摘要结果组织为层级化大纲')
  if (/翻译|translate/i.test(trimmed)) workflow.push('根据目标语言或风格要求重写结果内容')
  if (/分析|analy|报告|report/i.test(trimmed)) workflow.push('补充分析结论、风险点与行动建议')
  workflow.push(`按 ${outputLabel} 输出最终结果并附上可继续优化的建议`)

  const whenToUse = [
    `当用户明确提出“${trimmed}”或相近的技能诉求时使用。`,
    `当任务需要围绕 ${sourceLabel} 进行稳定复用的处理流程时使用。`,
  ]
  if (/总结|摘要|summary|summarize/i.test(trimmed)) {
    whenToUse.push('当用户希望先压缩内容，再继续做归纳、改写或下游处理时使用。')
  }
  if (/大纲|outline/i.test(trimmed)) {
    whenToUse.push('当用户需要把非结构化内容变成章节化或分层结构时使用。')
  }

  const keyInputs = [
    `原始输入来源：${sourceLabel}`,
    '任务目标、重点关注信息与输出偏好',
    '格式约束、长度限制与不能遗漏的规则',
  ]
  if (/pdf|文档|document|doc|网页|web|url|表格|sheet|excel|csv/i.test(trimmed)) {
    keyInputs.push('待处理文件、链接或数据内容')
  }

  const expectedOutputs = [`与需求匹配的${outputLabel}`]
  if (/总结|摘要|summary|summarize/i.test(trimmed)) expectedOutputs.push('关键结论与重点摘要')
  if (/大纲|outline/i.test(trimmed)) expectedOutputs.push('分层章节或步骤大纲')
  expectedOutputs.push('下一步可继续优化的参数建议')

  const purpose = `围绕“${trimmed}”生成一个可复用技能草稿，帮助用户稳定完成从输入处理、结构整理到结果输出的整套流程。`

  const refinementQuestion = /json/i.test(lower)
    ? '你希望这个技能输出的 JSON 更偏向扁平字段，还是分层嵌套结构？'
    : /表格|table|excel|csv/i.test(lower)
      ? '你希望这个技能最终输出为可直接导出的表格字段，还是先给出 Markdown 说明再附表格内容？'
      : /markdown|md/i.test(lower)
        ? '你希望这个技能的 Markdown 输出更偏向简洁摘要、章节大纲，还是带详细说明的完整文档？'
        : '你希望这个技能的输出结果更偏向表格、Markdown 文档，还是结构化 JSON？'
  const installCallToAction =
    '如果你想立即使用这个技能，请点击下方卡片中的 `Save skill` 完成安装。安装成功后，系统会自动带你进入该技能的详情页。'

  const scaffoldedSkillTemplate = `---
name: ${skillName}
description: ${purpose}
trigger: ${whenToUse[0]}
---

# ${skillName}

## Purpose
${purpose}

## Workflow
- ${workflow.join('\n- ')}

## Outputs
- ${expectedOutputs.join('\n- ')}
`

  const completedSkillMarkdown = `---
name: ${skillName}
description: ${purpose}
input_source: ${sourceLabel}
output_format: ${outputLabel}
---

# ${skillName}

## Purpose
${purpose}

## When to use
- ${whenToUse.join('\n- ')}

## Workflow
- ${workflow.join('\n- ')}

## Key inputs
- ${keyInputs.join('\n- ')}

## Expected outputs
- ${expectedOutputs.join('\n- ')}

## Refinement
${refinementQuestion}`

  const helperScriptContent = `def ${helperScriptName.replace(/\.py$/i, '')}(source_path: str) -> dict:
    """
    Prepare content for the ${skillName} skill.
    """
    return {
        "source": source_path,
        "task": "${trimmed}",
        "input_type": "${sourceLabel}",
        "output_format": "${outputLabel}"
    }`

  const processingItems: ProcessingItem[] = [
    {
      type: 'text',
      content: `理解用户意图：围绕“${trimmed}”构建新的技能草稿，并确认它需要处理的对象、关键动作和结果形式。`,
    },
    {
      type: 'chip',
      id: `${skillName}-reference-skill-md`,
      label: 'Read the skill-creator SKILL.md',
      chipType: 'document',
      status: 'pending',
      detailTitle: 'skill-creator / SKILL.md',
      detailContent: `# Skill creation reference\n\n- Target request: ${trimmed}\n- Suggested skill name: ${skillName}\n- Expected output: ${outputLabel}\n- Reusable workflow pattern:\n  1. clarify the task\n  2. define inputs and outputs\n  3. draft SKILL.md\n  4. add helper scripts if needed\n  5. validate the skill`,
      detailFormat: 'markdown',
      fileName: 'SKILL.md',
    },
    {
      type: 'text',
      content: `先查看已有技能目录与命名方式，确保新技能与现有结构一致，并避免与已存在的技能能力重叠。`,
    },
    {
      type: 'chip',
      id: `${skillName}-list-skills`,
      label: 'List existing skills in the skills directory',
      chipType: 'folder',
      status: 'pending',
      detailTitle: 'skills directory snapshot',
      detailContent: `skills/\n- marketing-psychology\n- account-briefing\n- doc-coauthoring\n- canvas-design\n- skill-creator\n- ${skillName} (planned)`,
      detailFormat: 'plain',
      fileName: 'skills/',
    },
    {
      type: 'text',
      content: `拟定技能命名、输入来源和输出格式后，先创建 ${skillName} 的脚手架目录，再读取初始化模板。`,
    },
    {
      type: 'chip',
      id: `${skillName}-scaffold`,
      label: `Scaffold a new custom skill named ${skillName}`,
      chipType: 'tool',
      status: 'pending',
      detailTitle: `Scaffold skill: ${skillName}`,
      detailContent: `## Tool call\n- Tool: scaffold_skill\n- Status: complete\n- Input summary: skillName=${skillName}, request=${trimmed}\n- Output summary: created ${skillName}/SKILL.md and prepared scripts/ for helper assets.`,
      detailFormat: 'markdown',
    },
    {
      type: 'chip',
      id: `${skillName}-template`,
      label: `Read the newly scaffolded ${skillName} SKILL.md template`,
      chipType: 'document',
      status: 'pending',
      detailTitle: `${skillName} / SKILL.md template`,
      detailContent: scaffoldedSkillTemplate,
      detailFormat: 'markdown',
      fileName: `${skillName}/SKILL.md`,
    },
    {
      type: 'text',
      content: `开始填充 SKILL.md 的 purpose、workflow、inputs 和 outputs，并把与你这次需求相关的约束一起写进去。`,
    },
    {
      type: 'chip',
      id: `${skillName}-write-skill-md`,
      label: `Write the full contents of ${skillName} SKILL.md`,
      chipType: 'document',
      status: 'pending',
      detailTitle: `${skillName} / SKILL.md`,
      detailContent: completedSkillMarkdown,
      detailFormat: 'markdown',
      fileName: `${skillName}/SKILL.md`,
    },
    {
      type: 'text',
      content: `根据输入源类型补充辅助脚本，确保技能在处理 ${sourceLabel} 时有稳定的预处理入口。`,
    },
    {
      type: 'chip',
      id: `${skillName}-scripts-folder`,
      label: 'Create scripts directory',
      chipType: 'folder',
      status: 'pending',
      detailTitle: `${skillName} / scripts`,
      detailContent: `${skillName}/scripts/\n- ${helperScriptName}`,
      detailFormat: 'plain',
      fileName: `${skillName}/scripts/`,
    },
    {
      type: 'chip',
      id: `${skillName}-helper-script`,
      label: `Write ${helperScriptName} helper script`,
      chipType: 'script',
      status: 'pending',
      detailTitle: helperScriptName,
      detailContent: helperScriptContent,
      detailFormat: 'code',
      fileName: helperScriptName,
      language: 'python',
    },
    {
      type: 'text',
      content: `最后再做一次结构和规则校验，确认这个技能的命名、输入输出与 ${trimmed} 的目标保持一致。`,
    },
    {
      type: 'chip',
      id: `${skillName}-validation`,
      label: `Validate the newly created ${skillName} skill`,
      chipType: 'validation',
      status: 'pending',
      detailTitle: `Validation: ${skillName}`,
      detailContent: JSON.stringify(
        {
          skillName,
          status: 'complete',
          checks: ['frontmatter', 'workflow_steps', 'input_output_alignment', 'follow_up_question'],
          summary: `Validated ${skillName} for ${trimmed}`,
        },
        null,
        2,
      ),
      detailFormat: 'json',
      fileName: 'validation.json',
    },
  ]

  const skillDirPath = `skills/${skillName}`
  const skillMdPath = `${skillDirPath}/SKILL.md`
  const scriptPath = `${skillDirPath}/scripts/${helperScriptName}`
  const initCommand = `python3 ~/home/user/skills/tools/init_skill.py ${skillName}`
  const validateCommand = `python3 ~/home/user/skills/tools/quick_validate.py ${skillName}`
  const usagePrompt = `请使用 ${skillName} 读取一个${sourceLabel}，并输出${outputLabel}。`

  const finalSections = [
    `已成功为你创建技能 \`${skillName}\`。当前该技能已经完成**创建、配置、校验**，并输出了可继续使用与扩展的 \`SKILL.md\` 文件、辅助脚本和验证结果，已经可以直接进入下一步使用。`,
    `---`,
    `# 🛠 技能创建流程指南（How It Was Built）`,
    `## 第一步：确定技能名称与初始化

我先根据你的真实需求对技能进行命名和初始化，确保目录结构、技能名和用途保持一致，方便后续复用与维护。

- **技能名称**：\`${skillName}\`
- **技能目录**：\`${skillDirPath}\`
- **核心目标**：围绕“${trimmed}”构建稳定可复用的技能流程

\`\`\`bash
${initCommand}
\`\`\``,
    `## 第二步：设计核心规范说明书（SKILL.md）

接着我为这个技能生成核心说明文档 \`${skillMdPath}\`，把触发条件、输入输出、使用时机和执行流程都固化进去，让这个技能具备清晰的运行规则。

- **主说明文件**：\`${skillMdPath}\`
- **输入来源**：\`${sourceLabel}\`
- **输出形式**：\`${outputLabel}\`
- **关键能力**：${workflow.slice(0, Math.min(3, workflow.length)).map((item) => `**${item}**`).join('、')}

\`\`\`markdown
---
name: ${skillName}
description: ${purpose}
input_source: ${sourceLabel}
output_format: ${outputLabel}
---

# ${skillName}

## Workflow
- ${workflow.join('\n- ')}
\`\`\``,
    `## 第三步：编写核心自动化脚本

为了让技能真正可执行，我补充了对应的自动化脚本，用来处理输入内容、清洗结构并生成最终结果。

- **脚本文件**：\`${scriptPath}\`
- **脚本职责**：负责处理 ${sourceLabel}，并将结果整理成 \`${outputLabel}\`
- **关键输入**：${keyInputs.map((item) => `**${item}**`).join('、')}

\`\`\`python
def ${helperScriptName.replace(/\.py$/i, '')}(source_path: str) -> dict:
    """
    Prepare content for the ${skillName} skill.
    """
    return {
        "source": source_path,
        "task": "${trimmed}",
        "input_type": "${sourceLabel}",
        "output_format": "${outputLabel}"
    }
\`\`\``,
    `## 第四步：合规性校验

在交付前，我又对这个技能做了一轮结构与规则校验，确保技能名、说明文档、脚本逻辑和追问方式与你的目标保持一致。

- **校验对象**：\`${skillName}\`
- **校验重点**：**frontmatter**、**workflow steps**、**input/output alignment**、**follow-up question**
- **当前状态**：**validated**，可以直接继续使用

\`\`\`bash
${validateCommand}
\`\`\``,
    `## 📖 如何使用这个新技能？

这个技能适合在用户需要处理 ${sourceLabel} 并输出 ${outputLabel} 时使用，尤其适用于以下场景：

- ${whenToUse.join('\n- ')}

1. 准备待处理的输入内容，例如文件、链接或原始文本。
2. 调用技能 \`${skillName}\`，让它按既定流程读取输入并生成结果。
3. 查看 \`${skillMdPath}\` 和 \`${scriptPath}\`，必要时继续调整输出模板或处理逻辑。

> “${usagePrompt}”`,
    `## ⚙️ 如何对其进行修改和升级？

如果你后续想继续优化这个技能，可以直接从这些方向入手：

- 修改 \`${skillMdPath}\` 中的**输出模板**和**使用说明**
- 为 \`${scriptPath}\` 增加新的**输入文件类型**或解析逻辑
- 调整 **Workflow**，让输出更贴近你的业务步骤
- 强化 **validation rules**，增加边界检查和格式校验
- 扩展 \`SKILL.md\` 的说明内容，让团队成员更容易复用`,
    refinementQuestion,
    installCallToAction,
  ]

  const finalText = finalSections.join('\n\n')

  return {
    skillName,
    purpose,
    whenToUse,
    workflow,
    keyInputs,
    expectedOutputs,
    refinementQuestion,
    helperScriptName,
    skillFileContent: completedSkillMarkdown,
    processingItems,
    finalSections,
    finalText,
  }
}

function buildSkillAssistantReply(input: string, turn: number) {
  const trimmed = input.trim()
  if (turn === 0) {
    return `收到，我先记录这条需求：${trimmed}

下一步请继续补充触发条件、会用到的工具或数据源，以及是否有必须遵守的格式或限制。我会基于这些信息帮你继续完善技能定义。`
  }
  return `我已经记录这部分信息：${trimmed}

如果你愿意，下一条可以继续告诉我：
1. 希望它产出的结果格式
2. 需要接入的系统或文件来源
3. 不能做的事情或必须遵守的边界

我会继续整理并生成更完整的技能说明。`
}

function buildGeneratedFileContent(skill: SkillItem, path: string[]) {
  const fileName = path[path.length - 1]?.toLowerCase() ?? ''
  if (fileName === 'skill.md') {
    return `---
name: ${skill.name}
description: ${skill.description}
trigger: ${skill.trigger}
creator: ${skill.creator}
---

# ${skill.previewTitle}

## Description
${skill.detailDescription}

## When to Use
- Trigger when the user asks for: ${skill.description}
- Use this skill when the workflow needs a structured, reusable response
- Route related tasks here before handing off to tools or child agents

## Workflow
\`\`\`text
Skill Execution Progress:
- [ ] Step 1: Clarify the user goal
- [ ] Step 2: Gather constraints and inputs
- [ ] Step 3: Generate the structured result
- [ ] Step 4: Review and refine the output
\`\`\`

## Inputs
| Field | Type | Description |
| --- | --- | --- |
| input | string | Main user request |
| context | string | Optional business context |
| constraints | string | Optional guardrails |

---

## Notes
Use \`${skill.name}\` when the request matches the expected trigger conditions.
`
  }
  if (fileName.endsWith('.md')) {
    return `# ${path[path.length - 1]}

This file belongs to the skill \`${skill.name}\`.

## Summary
${skill.description}

## Notes
${skill.detailDescription}`
  }
  if (fileName.endsWith('.py')) {
    return `def main():
    """
    ${skill.name}
    """
    return "${skill.description}"
`
  }
  return `${skill.name}\n\n${skill.description}`
}

function parseYamlFrontmatter(source: string): { metadata: Array<{ key: string; value: string }>; body: string } {
  const normalized = source.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return { metadata: [], body: normalized }
  const endIndex = normalized.indexOf('\n---\n', 4)
  if (endIndex === -1) return { metadata: [], body: normalized }
  const rawFrontmatter = normalized.slice(4, endIndex)
  const metadata = rawFrontmatter
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) return { key: line, value: '' }
      return {
        key: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      }
    })
  return { metadata, body: normalized.slice(endIndex + 5) }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`strong-${index}`}>{part.slice(2, -2)}</strong>
    }
    if (/^`[^`]+`$/.test(part)) {
      return <code key={`inline-${index}`}>{part.slice(1, -1)}</code>
    }
    return <span key={`inline-${index}`}>{part}</span>
  })
}

function isTableSeparator(line: string) {
  const normalized = line.replace(/\|/g, '').trim()
  return /^:?-{3,}:?$/.test(normalized) || /^(:?-{3,}:?\s+)+:?-{3,}:?$/.test(line.trim())
}

function renderMarkdownDocument(source: string, options?: { enableCodeCopy?: boolean }): ReactNode[] {
  const { metadata, body } = parseYamlFrontmatter(source)
  const lines = body.split('\n')
  const nodes: ReactNode[] = []
  let index = 0

  if (metadata.length > 0) {
    nodes.push(
      <div key="meta" className="skills-md-meta-table-wrap">
        <table className="skills-md-meta-table">
          <tbody>
            {metadata.map((item) => (
              <tr key={item.key}>
                <th>{item.key}</th>
                <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )
  }

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      nodes.push(
        <div key={`code-${index}`} className="skills-md-code-block">
          {lang || options?.enableCodeCopy ? (
            <div className="skills-md-code-bar">
              {lang ? <div className="skills-md-code-lang">{lang}</div> : <span />}
              {options?.enableCodeCopy ? (
                <button
                  type="button"
                  className="skills-md-code-copy"
                  onClick={() => {
                    void globalThis.navigator?.clipboard?.writeText(codeLines.join('\n'))
                  }}
                >
                  <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                    <path d="M5 5.2A1.2 1.2 0 0 1 6.2 4h4.6A1.2 1.2 0 0 1 12 5.2v6.1a1.2 1.2 0 0 1-1.2 1.2H6.2A1.2 1.2 0 0 1 5 11.3V5.2Zm-1.8 5V4.7A1.7 1.7 0 0 1 4.9 3h5.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : null}
          <pre>{codeLines.join('\n')}</pre>
        </div>,
      )
      continue
    }

    if (/^---+$/.test(trimmed)) {
      nodes.push(<hr key={`hr-${index}`} className="skills-md-divider" />)
      index += 1
      continue
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      nodes.push(
        <blockquote key={`quote-${index}`} className="skills-md-quote">
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`${index}-quote-line-${quoteIndex}`}>{renderInlineMarkdown(quoteLine)}</p>
          ))}
        </blockquote>,
      )
      continue
    }

    if (trimmed.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      const headerCells = trimmed
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
      const rowLines: string[] = []
      index += 2
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rowLines.push(lines[index])
        index += 1
      }
      nodes.push(
        <div key={`table-${index}`} className="skills-md-table-wrap">
          <table className="skills-md-table">
            <thead>
              <tr>
                {headerCells.map((cell, headerIndex) => (
                  <th key={`${cell}-${headerIndex}`}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowLines.map((row, rowIndex) => {
                const cells = row
                  .split('|')
                  .map((cell) => cell.trim())
                  .filter(Boolean)
                return (
                  <tr key={`row-${rowIndex}`}>
                    {cells.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingChildren = renderInlineMarkdown(headingMatch[2])
      if (level === 1) {
        nodes.push(
          <h1 key={`heading-${index}`} className="skills-md-heading skills-md-heading--h1">
            {headingChildren}
          </h1>,
        )
      } else if (level === 2) {
        nodes.push(
          <h2 key={`heading-${index}`} className="skills-md-heading skills-md-heading--h2">
            {headingChildren}
          </h2>,
        )
      } else {
        nodes.push(
          <h3 key={`heading-${index}`} className="skills-md-heading skills-md-heading--h3">
            {headingChildren}
          </h3>,
        )
      }
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      nodes.push(
        <ul key={`list-${index}`} className="skills-md-list">
          {items.map((item, itemIndex) => (
            <li key={`item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    const paragraphLines: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^---+$/.test(lines[index].trim()) &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !(lines[index].includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim()))
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    nodes.push(
      <p key={`p-${index}`} className="skills-md-paragraph">
        {renderInlineMarkdown(paragraphLines.join(' '))}
      </p>,
    )
  }

  return nodes
}

function SkillsPageTagline() {
  const { locale } = useLocale()

  return (
    <div className="agents-subtitle agents-subtitle--tagline" aria-label={skillsT(locale, 'taglineAria')}>
      <span className="agents-subtitle-part">{skillsT(locale, 'taglineTask')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{skillsT(locale, 'taglineFlow')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{skillsT(locale, 'taglineCapability')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{skillsT(locale, 'taglineScenario')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{skillsT(locale, 'taglineOrchestration')}</span>
    </div>
  )
}

export function SkillsPage({
  skills,
  onSkillsChange,
  installedSkillTemplates = [],
  onBrowseLibrary,
}: SkillsPageProps) {
  const { locale } = useLocale()
  const { can } = useRbac()
  const canPublishSectionVersion = can('team.view_changelog')
  const [skillVersionModalOpen, setSkillVersionModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [skillsTab, setSkillsTab] = useState<SkillsTab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<SkillsSortOrder>('recent')
  const [viewMode, setViewMode] = useState<SkillsListViewMode>('cards')
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [view, setView] = useState<SkillCreateView>('list')
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [fileViewMode, setFileViewMode] = useState<'preview' | 'edit'>('preview')
  const [editorActiveLine, setEditorActiveLine] = useState(1)
  const [editorScrollTop, setEditorScrollTop] = useState(0)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set(collectFolderIds(INITIAL_SKILLS[0]?.files ?? [])))
  const [initialSkillSnapshots, setInitialSkillSnapshots] = useState<Record<string, Record<string, string>>>({})
  const [skillDraftSnapshots, setSkillDraftSnapshots] = useState<Record<string, Record<string, string>>>({})
  const [savedSkillVersions, setSavedSkillVersions] = useState<Record<string, SkillSavedVersion[]>>({})
  const [activeVersionIdsBySkill, setActiveVersionIdsBySkill] = useState<Record<string, string>>({})
  const [versionPanelExpandedBySkill, setVersionPanelExpandedBySkill] = useState<Record<string, boolean>>({})
  const [skillNoticeToast, setSkillNoticeToast] = useState<{ title: string; sub?: string } | null>(null)
  const [manualCreateOpen, setManualCreateOpen] = useState(false)
  const [activeSkillMenuId, setActiveSkillMenuId] = useState<string | null>(null)
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualInstructions, setManualInstructions] = useState('')
  const [aiMessages, setAiMessages] = useState<SkillsChatMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiVoiceListening, setAiVoiceListening] = useState(false)
  const [aiReplyTurn, setAiReplyTurn] = useState(0)
  const [aiDraftSkillName, setAiDraftSkillName] = useState('')
  const [installingGeneratedSkillName, setInstallingGeneratedSkillName] = useState<string | null>(null)
  const [installedGeneratedSkillName, setInstalledGeneratedSkillName] = useState<string | null>(null)

  const sortMenuRef = useRef<HTMLDivElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const noticeTimerRef = useRef<number | null>(null)
  const aiReplyTimerRef = useRef<number | null>(null)
  const aiStreamTimerIdsRef = useRef<number[]>([])
  const generatedSkillInstallTimerIdsRef = useRef<number[]>([])
  const aiComposerRef = useRef<HTMLTextAreaElement | null>(null)
  const aiMessagesScrollRef = useRef<HTMLDivElement | null>(null)
  const aiRecognitionRef = useRef<SkillSpeechRecognition | null>(null)
  const suppressAiAutoScrollRef = useRef(false)

  const text = useMemo(
    () => ({
      ...getSkillsPageText(locale),
      aiPageSubtitle: '',
      creatorName: SKILL_CREATOR_NAME,
    }),
    [locale],
  )

  const displaySkills = useMemo(
    () => skills.map((skill) => localizeSkillForDisplay(skill, locale)),
    [skills, locale],
  )

  const installedMarketplaceSkillItems = useMemo(
    () => installedSkillTemplates.map((item) => createInstalledMarketSkillItem(item, locale)),
    [installedSkillTemplates, locale],
  )

  const skillsTabCounts = useMemo(
    () => ({
      all: skills.length,
      referenced: skills.filter((skill) => isMarketplaceSkill(skill)).length,
      mine: skills.filter((skill) => !isMarketplaceSkill(skill)).length,
    }),
    [skills],
  )

  const tabFilteredSkills = useMemo(() => {
    switch (skillsTab) {
      case 'referenced':
        return displaySkills.filter((skill) => isMarketplaceSkill(skill))
      case 'mine':
        return displaySkills.filter((skill) => !isMarketplaceSkill(skill))
      default:
        return displaySkills
    }
  }, [displaySkills, skillsTab])

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tabFilteredSkills
    return tabFilteredSkills.filter((skill) =>
      [skill.name, skill.description, skill.creator, skill.trigger]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [search, tabFilteredSkills])

  const sortedSkills = useMemo(() => {
    if (sortOrder === 'recent') return filteredSkills
    const sorted = [...filteredSkills]
    sorted.sort((left, right) => {
      const compareResult = left.name.localeCompare(right.name, locale === 'zh' ? 'zh-CN' : 'en', {
        sensitivity: 'base',
      })
      return sortOrder === 'a-z' ? compareResult : -compareResult
    })
    return sorted
  }, [filteredSkills, locale, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sortedSkills.length / SKILLS_PER_PAGE))

  const paginatedSkills = useMemo(() => {
    const startIndex = (currentPage - 1) * SKILLS_PER_PAGE
    return sortedSkills.slice(startIndex, startIndex + SKILLS_PER_PAGE)
  }, [currentPage, sortedSkills])

  const aiAssistantPending = useMemo(
    () =>
      aiMessages.some(
        (message) =>
          message.isThinking ||
          message.processingStatus === 'streaming' ||
          message.finalStatus === 'streaming',
      ),
    [aiMessages],
  )
  const selectedSkill = useMemo(() => {
    const raw = selectedSkillId ? skills.find((skill) => skill.id === selectedSkillId) ?? null : null
    return raw ? localizeSkillForDisplay(raw, locale) : null
  }, [selectedSkillId, skills, locale])
  const selectedFile = useMemo(() => {
    if (!selectedSkill || !selectedFileId) return null
    return findFileById(selectedSkill.files, selectedFileId)
  }, [selectedFileId, selectedSkill])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortOrder, skillsTab])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    setInitialSkillSnapshots((current) => {
      let changed = false
      const next = { ...current }

      skills.forEach((skill) => {
        if (next[skill.id]) return
        next[skill.id] = buildSkillFileSnapshot(skill)
        changed = true
      })

      return changed ? next : current
    })
  }, [skills])

  useEffect(() => {
    onSkillsChange((current) => {
      const nonMarketplaceSkills = current.filter((skill) => !skill.id.startsWith('market-skill-'))
      const existingMarketplaceSkills = new Map(
        current.filter((skill) => skill.id.startsWith('market-skill-')).map((skill) => [skill.id, skill]),
      )
      const mergedMarketplaceSkills = installedMarketplaceSkillItems.map((skill) => ({
        ...(existingMarketplaceSkills.get(skill.id) ?? skill),
        ...skill,
      }))
      return [...mergedMarketplaceSkills, ...nonMarketplaceSkills]
    })
  }, [installedMarketplaceSkillItems, onSkillsChange])

  useEffect(() => {
    if (selectedSkillId && !skills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(null)
    }
  }, [selectedSkillId, skills])

  useEffect(() => {
    if (!selectedSkillId || !selectedSkill) return
    setExpandedFolderIds(new Set(collectFolderIds(selectedSkill.files)))
    setSelectedFileId(findFirstFileId(selectedSkill.files))
    setFileViewMode('preview')
    setEditorActiveLine(1)
    setEditorScrollTop(0)
  }, [selectedSkillId])

  useEffect(() => {
    if (!selectedSkill) return
    const latestSnapshot = buildSkillFileSnapshot(selectedSkill)

    setSkillDraftSnapshots((current) => {
      const mergedSnapshot = mergeSkillSnapshots(latestSnapshot, current[selectedSkill.id])
      if (current[selectedSkill.id] && areSkillSnapshotsEqual(current[selectedSkill.id], mergedSnapshot)) {
        return current
      }
      return {
        ...current,
        [selectedSkill.id]: mergedSnapshot,
      }
    })

    setActiveVersionIdsBySkill((current) =>
      current[selectedSkill.id]
        ? current
        : {
            ...current,
            [selectedSkill.id]: 'initial',
          },
    )
  }, [selectedSkill])

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current)
      if (aiReplyTimerRef.current != null) window.clearTimeout(aiReplyTimerRef.current)
      aiStreamTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId))
      aiStreamTimerIdsRef.current = []
      generatedSkillInstallTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId))
      generatedSkillInstallTimerIdsRef.current = []
      aiRecognitionRef.current?.abort()
      aiRecognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!createMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [createMenuOpen])

  useEffect(() => {
    if (!sortMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (sortMenuRef.current?.contains(target)) return
      setSortMenuOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSortMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sortMenuOpen])

  useEffect(() => {
    if (!activeSkillMenuId) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('.skills-table-actions-wrap')) return
      setActiveSkillMenuId(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveSkillMenuId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeSkillMenuId])

  useEffect(() => {
    if (!aiMessagesScrollRef.current) return
    if (suppressAiAutoScrollRef.current) {
      suppressAiAutoScrollRef.current = false
      return
    }
    aiMessagesScrollRef.current.scrollTop = aiMessagesScrollRef.current.scrollHeight
  }, [aiMessages])

  const showNotice = (title: string, sub?: string) => {
    setSkillNoticeToast({ title, sub: sub?.trim() || undefined })
    if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => {
      setSkillNoticeToast(null)
      noticeTimerRef.current = null
    }, 2000)
  }

  const createSkillItemFromDraft = (draft: SkillCreationDraft): SkillItem => ({
    id: `skill-ai-${Date.now()}`,
    name: draft.skillName,
    description: draft.purpose,
    creator: text.creatorName,
    createdAt: new Date().toISOString(),
    trigger: skillsT(locale, 'triggerAiCreate'),
    detailDescription: draft.purpose,
    previewTitle: `${draft.skillName} Workflow`,
    instructions: draft.skillFileContent,
    files: [
      { id: `skill-ai-file-${Date.now()}`, name: 'SKILL.md', kind: 'file', content: draft.skillFileContent },
      {
        id: `skill-ai-scripts-${Date.now()}`,
        name: 'scripts',
        kind: 'folder',
        children: [{ id: `skill-ai-script-${Date.now()}`, name: draft.helperScriptName, kind: 'file' }],
      },
    ],
  })

  const scheduleAiStreamStep = (callback: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      aiStreamTimerIdsRef.current = aiStreamTimerIdsRef.current.filter((currentId) => currentId !== timerId)
      callback()
    }, delay)
    aiStreamTimerIdsRef.current.push(timerId)
  }

  const updateAiMessage = (messageId: string, updater: (message: SkillsChatMessage) => SkillsChatMessage) => {
    setAiMessages((current) => current.map((message) => (message.id === messageId ? updater(message) : message)))
  }

  const streamSkillCreationResponse = (messageId: string, input: string) => {
    const draft = buildSkillCreationDraft(input)
    setAiDraftSkillName(draft.skillName === 'custom-skill-draft' ? '' : draft.skillName)
    const streamProcessingItem = (itemIndex: number) => {
      if (itemIndex >= draft.processingItems.length) {
        updateAiMessage(messageId, (message) => ({
          ...message,
          processingStatus: 'complete',
          finalStatus: 'streaming',
        }))
        streamFinalText(0)
        return
      }
      updateAiMessage(messageId, (message) => ({
        ...message,
        processingItems: draft.processingItems,
        visibleProcessingItemCount: itemIndex + 1,
        processingStatus: 'streaming',
        isProcessingExpanded: true,
      }))
      const nextDelay = draft.processingItems[itemIndex]?.type === 'chip' ? 320 : 220
      scheduleAiStreamStep(() => streamProcessingItem(itemIndex + 1), nextDelay)
    }

    const streamFinalText = (sectionIndex: number) => {
      const nextVisibleText = draft.finalSections.slice(0, sectionIndex).join('\n\n')
      if (sectionIndex > draft.finalSections.length) {
        const createdSkill = createSkillItemFromDraft(draft)
        updateAiMessage(messageId, (message) => ({
          ...message,
          processingStatus: 'complete',
          finalStatus: 'complete',
          visibleFinalText: draft.finalText,
          isProcessingExpanded: false,
          createdSkillName: createdSkill.name,
          createdSkillContent: draft.skillFileContent,
        }))
        onSkillsChange((current) => {
          if (current.some((skill) => skill.name === createdSkill.name)) {
            return current.map((skill) =>
              skill.name === createdSkill.name
                ? {
                    ...skill,
                    description: createdSkill.description,
                    detailDescription: createdSkill.detailDescription,
                    instructions: createdSkill.instructions,
                    files: createdSkill.files,
                    trigger: createdSkill.trigger,
                    previewTitle: createdSkill.previewTitle,
                  }
                : skill,
            )
          }
          return [createdSkill, ...current]
        })
        showNotice(text.creatorSaved, text.creatorSavedSub)
        return
      }
      updateAiMessage(messageId, (message) => ({
        ...message,
        finalText: draft.finalText,
        visibleFinalText: nextVisibleText,
        finalStatus: 'streaming',
      }))
      scheduleAiStreamStep(() => streamFinalText(sectionIndex + 1), 180)
    }

    scheduleAiStreamStep(() => streamProcessingItem(0), 280)
  }

  const appendAssistantReply = (
    input: string,
    turn: number,
    userMessage: SkillsChatMessage,
    replaceCurrent = false,
    forceSkillCreation = false,
  ) => {
    const timestamp = Date.now()
    if (forceSkillCreation || isSkillCreationPrompt(input)) {
      const messageId = `skills-assistant-skill-${timestamp}`
      const assistantMessage: SkillsChatMessage = {
        id: messageId,
        role: 'assistant',
        text: '',
        responseType: 'skill_creation',
        processingTitle: text.skillProcessingTitle,
        processingStatus: 'streaming',
        finalStatus: 'idle',
        isProcessingExpanded: true,
        processingItems: [],
        visibleProcessingItemCount: 0,
        activeProcessingChipId: null,
        finalText: '',
        visibleFinalText: '',
      }
      setAiMessages((current) => (replaceCurrent ? [userMessage, assistantMessage] : [...current, userMessage, assistantMessage]))
      streamSkillCreationResponse(messageId, input)
      return
    }

    const thinkingId = `skills-assistant-thinking-${timestamp}`
    setAiMessages((current) =>
      replaceCurrent
        ? [userMessage, { id: thinkingId, role: 'assistant', text: '', isThinking: true }]
        : [...current, userMessage, { id: thinkingId, role: 'assistant', text: '', isThinking: true }],
    )
    if (aiReplyTimerRef.current != null) window.clearTimeout(aiReplyTimerRef.current)
    aiReplyTimerRef.current = window.setTimeout(() => {
      const replyText = buildSkillAssistantReply(input, turn)
      setAiMessages((current) => [
        ...current.filter((message) => message.id !== thinkingId),
        { id: `skills-assistant-${timestamp}`, role: 'assistant', text: replyText, responseType: 'normal' },
      ])
      aiReplyTimerRef.current = null
    }, 850)
  }

  const startAiCreateFlow = () => {
    setCreateMenuOpen(false)
    setView('create-ai')
    setAiDraftSkillName('')
    setAiReplyTurn(0)
    setAiInput('')
    if (aiReplyTimerRef.current != null) window.clearTimeout(aiReplyTimerRef.current)
    aiStreamTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId))
    aiStreamTimerIdsRef.current = []
    const userMessage: SkillsChatMessage = { id: `skills-user-init-${Date.now()}`, role: 'user', text: INITIAL_USER_PROMPT }
    const thinkingId = `skills-ai-thinking-${Date.now()}`
    setAiMessages([userMessage, { id: thinkingId, role: 'assistant', text: '', isThinking: true }])
    aiReplyTimerRef.current = window.setTimeout(() => {
      setAiMessages([userMessage, { id: `skills-assistant-init-${Date.now()}`, role: 'assistant', text: INITIAL_ASSISTANT_REPLY, responseType: 'normal' }])
      aiReplyTimerRef.current = null
    }, 900)
  }

  const handleAiSend = () => {
    const trimmed = aiInput.trim()
    if (!trimmed || aiAssistantPending) return
    const nextTurn = aiReplyTurn + 1
    const userMessage: SkillsChatMessage = { id: `skills-user-${Date.now()}`, role: 'user', text: trimmed }
    setAiInput('')
    setAiReplyTurn(nextTurn)
    appendAssistantReply(trimmed, nextTurn - 1, userMessage, false, true)
  }

  const handleAiVoiceClick = () => {
    if (aiVoiceListening) {
      aiRecognitionRef.current?.stop()
      return
    }
    if (aiAssistantPending) return
    const recognition = createBrowserSpeechRecognition()
    if (!recognition) return
    recognition.lang = locale === 'zh' ? 'zh-CN' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setAiVoiceListening(true)
    recognition.onend = () => {
      setAiVoiceListening(false)
      aiRecognitionRef.current = null
    }
    recognition.onerror = () => {
      setAiVoiceListening(false)
      aiRecognitionRef.current = null
    }
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join('')
        .trim()
      if (!transcript) return
      setAiInput((current) => `${current}${current ? ' ' : ''}${transcript}`.trim())
      aiComposerRef.current?.focus()
    }
    aiRecognitionRef.current = recognition
    recognition.start()
  }

  const handleUploadFiles = () => {
    setCreateMenuOpen(false)
    uploadInputRef.current?.click()
  }

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const isValidFile = /\.(zip|md)$/i.test(file.name)
    if (!isValidFile) {
      showNotice(text.uploadInvalidType, text.uploadInvalidTypeSub)
      event.target.value = ''
      return
    }
    const baseName = file.name.replace(/\.[^.]+$/, '').trim() || 'new-skill'
    const createdSkill: SkillItem = {
      id: `skill-upload-${Date.now()}`,
      name: baseName.toLowerCase().replace(/\s+/g, '-'),
      description: `根据文件 ${file.name} 生成的技能草稿。`,
      creator: text.creatorName,
      createdAt: new Date().toISOString(),
      trigger: skillsT(locale, 'triggerFileUpload'),
      detailDescription: `该技能基于文件 ${file.name} 自动生成，可继续补充触发场景、边界与输出格式。`,
      previewTitle: `${baseName} Workflow`,
      instructions: `该技能由文件 ${file.name} 自动生成。

建议下一步：
1. 明确触发时机
2. 补充依赖的数据源或工具
3. 完善输出格式与边界限制`,
      files: [
        { id: `upload-skill-${Date.now()}`, name: 'SKILL.md', kind: 'file' },
        {
          id: `upload-ref-${Date.now()}`,
          name: 'references',
          kind: 'folder',
          children: [{ id: `upload-ref-file-${Date.now()}`, name: file.name, kind: 'file' }],
        },
      ],
    }
    onSkillsChange((current) => [createdSkill, ...current])
    showNotice(text.uploadSuccess, text.uploadSuccessSub)
    event.target.value = ''
  }

  const handleSaveManualSkill = () => {
    if (!manualName.trim() || !manualDescription.trim() || !manualInstructions.trim()) return
    const createdSkill: SkillItem = {
      id: `skill-manual-${Date.now()}`,
      name: manualName.trim(),
      description: manualDescription.trim(),
      creator: text.creatorName,
      createdAt: new Date().toISOString(),
      trigger: skillsT(locale, 'triggerManualAdd'),
      detailDescription: manualDescription.trim(),
      previewTitle: `${manualName.trim()} Workflow`,
      instructions: manualInstructions.trim(),
      files: [{ id: `manual-skill-${Date.now()}`, name: 'SKILL.md', kind: 'file' }],
    }
    onSkillsChange((current) => [createdSkill, ...current])
    recordInitialSectionIteration({
      sectionType: 'skill',
      sectionId: createdSkill.id,
      sectionNameZh: createdSkill.name,
      sectionNameEn: createdSkill.name,
      summaryZh: '初始创建 Skill',
      summaryEn: 'Initial skill creation',
    })
    setManualName('')
    setManualDescription('')
    setManualInstructions('')
    setManualCreateOpen(false)
    setCreateMenuOpen(false)
    showNotice(text.creatorSaved, text.creatorSavedSub)
  }

  const handleOpenSkillConfig = (skillId: string) => {
    setActiveSkillMenuId(null)
    setSelectedSkillId(skillId)
  }

  const handleDeleteSkill = (skillId: string) => {
    onSkillsChange((current) => current.filter((skill) => skill.id !== skillId))
    setActiveSkillMenuId(null)
    showNotice(text.skillDeleted, text.skillDeletedSub)
  }

  const renderSkillActions = (skill: SkillItem) => (
    <div className="skills-table-actions-wrap">
      <button
        type="button"
        className="skills-table-actions-trigger"
        aria-label={text.openSkillActions}
        aria-expanded={activeSkillMenuId === skill.id}
        onClick={(event) => {
          event.stopPropagation()
          setActiveSkillMenuId((current) => (current === skill.id ? null : skill.id))
        }}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {activeSkillMenuId === skill.id ? (
        <div className="skills-table-actions-menu" role="menu" aria-label={`${skill.name} actions`}>
          <button
            type="button"
            className="skills-table-actions-item"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation()
              handleOpenSkillConfig(skill.id)
            }}
          >
            {text.editSkill}
          </button>
          <button
            type="button"
            className="skills-table-actions-item skills-table-actions-item--danger"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation()
              handleDeleteSkill(skill.id)
            }}
          >
            {text.deleteSkill}
          </button>
        </div>
      ) : null}
    </div>
  )

  const handleSelectedFileContentChange = (content: string) => {
    if (!selectedSkill || !selectedFileId) return
    setSkillDraftSnapshots((current) => {
      const latestSnapshot = buildSkillFileSnapshot(selectedSkill)
      const currentSnapshot = mergeSkillSnapshots(latestSnapshot, current[selectedSkill.id])
      return {
        ...current,
        [selectedSkill.id]: {
          ...currentSnapshot,
          [selectedFileId]: content,
        },
      }
    })
  }

  const handleSelectSavedVersion = (versionId: string) => {
    if (!selectedSkill) return

    const initialSnapshot = initialSkillSnapshots[selectedSkill.id] ?? buildSkillFileSnapshot(selectedSkill)
    const versionSnapshot =
      versionId === 'initial'
        ? initialSnapshot
        : savedSkillVersions[selectedSkill.id]?.find((version) => version.id === versionId)?.snapshot

    if (!versionSnapshot) return

    setSkillDraftSnapshots((current) => ({
      ...current,
      [selectedSkill.id]: cloneSkillSnapshot(versionSnapshot),
    }))
    setActiveVersionIdsBySkill((current) => ({
      ...current,
      [selectedSkill.id]: versionId,
    }))
    setEditorActiveLine(1)
    setEditorScrollTop(0)
  }

  const handleSaveEditedVersion = () => {
    if (!selectedSkill) return

    const latestSnapshot = buildSkillFileSnapshot(selectedSkill)
    const initialSnapshot = initialSkillSnapshots[selectedSkill.id] ?? latestSnapshot
    const currentSnapshot = mergeSkillSnapshots(latestSnapshot, skillDraftSnapshots[selectedSkill.id])
    const activeVersionId = activeVersionIdsBySkill[selectedSkill.id] ?? 'initial'
    const activeSnapshot =
      activeVersionId === 'initial'
        ? initialSnapshot
        : savedSkillVersions[selectedSkill.id]?.find((version) => version.id === activeVersionId)?.snapshot ?? latestSnapshot

    if (areSkillSnapshotsEqual(currentSnapshot, activeSnapshot)) return

    const existingVersions = savedSkillVersions[selectedSkill.id] ?? []
    const savedAt = Date.now()
    const versionId = `${selectedSkill.id}-version-${savedAt}`
    const version: SkillSavedVersion = {
      id: versionId,
      label: buildSavedVersionLabel(existingVersions.length + 1, locale),
      meta: `${selectedSkill.creator} · ${formatVersionRelativeTime(savedAt, locale)}`,
      savedAt,
      snapshot: cloneSkillSnapshot(currentSnapshot),
    }

    onSkillsChange((current) =>
      current.map((skill) => (skill.id === selectedSkill.id ? applySnapshotToSkill(skill, currentSnapshot) : skill)),
    )
    setSavedSkillVersions((current) => ({
      ...current,
      [selectedSkill.id]: [version, ...(current[selectedSkill.id] ?? [])],
    }))
    setSkillDraftSnapshots((current) => ({
      ...current,
      [selectedSkill.id]: cloneSkillSnapshot(currentSnapshot),
    }))
    setActiveVersionIdsBySkill((current) => ({
      ...current,
      [selectedSkill.id]: versionId,
    }))
  }

  const handleDownloadSelectedFile = () => {
    if (!selectedSkill || !selectedFile) return
    const fileName = selectedFile.path[selectedFile.path.length - 1] ?? 'skill-file.txt'
    const fallbackContent =
      selectedFile.node.content ?? buildGeneratedFileContent(selectedSkill, selectedFile.path)
    const blob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadGeneratedSkill = (skillName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${skillName}.skill`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleOpenGeneratedSkill = (skillName: string) => {
    const matchedSkill = skills.find((skill) => skill.name === skillName)
    if (!matchedSkill) return
    setSelectedSkillId(matchedSkill.id)
    setView('list')
  }

  const handleInstallGeneratedSkill = (skillName: string) => {
    if (installingGeneratedSkillName || installedGeneratedSkillName) return
    setInstallingGeneratedSkillName(skillName)
    setInstalledGeneratedSkillName(null)

    const installingTimerId = window.setTimeout(() => {
      setInstallingGeneratedSkillName(null)
      setInstalledGeneratedSkillName(skillName)
      showNotice(text.saveSkillCardInstalled, text.saveSkillCardInstalledSub)
      const matchedSkill = skills.find((skill) => skill.name === skillName)
      if (matchedSkill) {
        recordInitialSectionIteration({
          sectionType: 'skill',
          sectionId: matchedSkill.id,
          sectionNameZh: matchedSkill.name,
          sectionNameEn: matchedSkill.name,
          summaryZh: '初始创建 Skill',
          summaryEn: 'Initial skill creation',
        })
      }

      const navigateTimerId = window.setTimeout(() => {
        setInstalledGeneratedSkillName(null)
        handleOpenGeneratedSkill(skillName)
        generatedSkillInstallTimerIdsRef.current = generatedSkillInstallTimerIdsRef.current.filter(
          (currentId) => currentId !== navigateTimerId,
        )
      }, 720)

      generatedSkillInstallTimerIdsRef.current.push(navigateTimerId)
      generatedSkillInstallTimerIdsRef.current = generatedSkillInstallTimerIdsRef.current.filter(
        (currentId) => currentId !== installingTimerId,
      )
    }, 900)

    generatedSkillInstallTimerIdsRef.current.push(installingTimerId)
  }

  const completeSkillVersionPublish = (payload: SectionIterationPublishPayload) => {
    if (!selectedSkill || !canPublishSectionVersion) return
    publishSectionIteration({
      sectionType: 'skill',
      sectionId: selectedSkill.id,
      sectionNameZh: selectedSkill.name,
      sectionNameEn: selectedSkill.name,
      ...payload,
    })
    setSkillVersionModalOpen(false)
  }

  const toggleProcessingExpanded = (messageId: string) => {
    suppressAiAutoScrollRef.current = true
    setAiMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, isProcessingExpanded: !message.isProcessingExpanded }
          : message,
      ),
    )
  }

  const toggleProcessingChipDetail = (messageId: string, chipId: string) => {
    suppressAiAutoScrollRef.current = true
    setAiMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              activeProcessingChipId: message.activeProcessingChipId === chipId ? null : chipId,
            }
          : message,
      ),
    )
  }

  const getProcessingChipStatus = (
    message: SkillsChatMessage,
    item: ProcessingItem,
    itemIndex: number,
  ): ProcessingChipStatus => {
    if (item.type !== 'chip') return 'pending'
    const visibleCount = message.visibleProcessingItemCount ?? 0
    if (itemIndex >= visibleCount) return 'pending'
    if (message.processingStatus === 'streaming' && itemIndex === visibleCount - 1) return 'running'
    return 'complete'
  }

  const renderProcessingChipIcon = (chipType: ProcessingChipType, status: ProcessingChipStatus) => {
    if (chipType === 'validation') {
      return status === 'complete' ? (
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="m3.5 8.5 2.6 2.6L12.5 4.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M8 2.4 13 4v3.2c0 3.1-1.9 5.9-5 6.8-3.1-.9-5-3.7-5-6.8V4L8 2.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )
    }
    if (chipType === 'folder') {
      return (
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M1.8 4.6A1.6 1.6 0 0 1 3.4 3h2l1 1.2h6.2A1.6 1.6 0 0 1 14.2 5.8v5.8a1.6 1.6 0 0 1-1.6 1.6H3.4a1.6 1.6 0 0 1-1.6-1.6V4.6Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )
    }
    if (chipType === 'script') {
      return (
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="m5.2 4.5-2.7 3 2.7 3M10.8 4.5l2.7 3-2.7 3M9.2 3.3 6.8 11.7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
    if (chipType === 'tool') {
      return (
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M9.6 2.8a2.8 2.8 0 0 0 3.6 3.6l-5.8 5.8a1.2 1.2 0 0 1-1.7 0l-1-1a1.2 1.2 0 0 1 0-1.7l5.8-5.8Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )
    }
    return (
      <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
        <path d="M4.2 1.8h4.5l3.1 3.1v7a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4V3.2a1.4 1.4 0 0 1 1.4-1.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8.7 1.8v3.3H12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    )
  }

  const renderProcessingChipDetail = (item: Extract<ProcessingItem, { type: 'chip' }>) => {
    if (item.detailFormat === 'markdown') {
      return <div className="skills-ai-skill-chip-detail-markdown">{renderMarkdownDocument(item.detailContent)}</div>
    }

    return (
      <div className="skills-ai-skill-chip-detail-codewrap">
        {item.fileName ? (
          <div className="skills-ai-skill-chip-detail-codehead">
            <span>{item.fileName}</span>
            {item.language ? <span>{item.language}</span> : null}
          </div>
        ) : null}
        <pre className="skills-ai-skill-chip-detail-pre">{item.detailContent}</pre>
      </div>
    )
  }

  const renderAiMessages = () => (
    <div className="manus-home-session-messages-inner">
      {aiMessages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} className="agents-ai-message-turn is-user">
              <div className="agents-ai-bubble is-user">{message.text}</div>
            </div>
          )
        }
        return (
          <div key={message.id} className="agents-ai-message-turn is-assistant manus-home-session-ai-turn" role="article">
            <div className="manus-home-session-ai-msg-sender">
              <span className="manus-home-session-ai-msg-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                  <defs>
                    <linearGradient id={`skills-ai-grad-${index}`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#7ec8ff" />
                      <stop offset="100%" stopColor="#1e4fd8" />
                    </linearGradient>
                  </defs>
                  <rect x="1.5" y="1.5" width="21" height="21" rx="7" ry="7" fill={`url(#skills-ai-grad-${index})`} />
                  <polygon points="12,7.2 16.8,12 12,16.8 7.2,12" fill="#ffffff" />
                </svg>
              </span>
              <span className="manus-home-session-ai-msg-name">{text.assistantName}</span>
            </div>
            {message.isThinking ? (
              <div
                className="agents-ai-bubble is-assistant manus-home-session-ai-thinking"
                role="status"
                aria-label={text.thinking}
              >
                <span className="manus-home-session-ai-thinking-line">
                  <span className="manus-home-session-ai-thinking-label">{text.thinking}</span>
                  <span className="manus-home-session-ai-thinking-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              </div>
            ) : message.responseType === 'skill_creation' ? (
              <div className="skills-ai-skill-message-body">
                <div className="skills-ai-skill-response">
                  <div className="skills-ai-skill-processing">
                    <button
                      type="button"
                      className="skills-ai-skill-processing-toggle"
                      aria-expanded={message.isProcessingExpanded}
                      aria-label={message.isProcessingExpanded ? text.collapseProcessing : text.expandProcessing}
                      onClick={() => toggleProcessingExpanded(message.id)}
                    >
                      <span className="skills-ai-skill-processing-title-wrap">
                        <span
                          className={`skills-ai-skill-processing-status${
                            message.processingStatus === 'complete' ? ' is-complete' : ''
                          }`}
                          aria-hidden="true"
                        >
                          {message.processingStatus === 'complete' ? (
                            <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                              <path d="m3.5 8.5 2.6 2.6L12.5 4.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <span className="skills-ai-skill-processing-spinner" />
                          )}
                        </span>
                        <span className="skills-ai-skill-processing-title">{message.processingTitle}</span>
                      </span>
                      <span className={`skills-ai-skill-processing-chevron${message.isProcessingExpanded ? ' is-expanded' : ''}`} aria-hidden="true">
                        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                          <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    <div className={`skills-ai-skill-processing-body${message.isProcessingExpanded ? ' is-expanded' : ''}`}>
                      <div className="skills-ai-skill-processing-stream">
                        {(message.processingItems ?? [])
                          .slice(0, message.visibleProcessingItemCount ?? 0)
                          .map((item, itemIndex) => {
                            const isLast = itemIndex === (message.visibleProcessingItemCount ?? 0) - 1
                            return (
                              <div
                                key={item.type === 'chip' ? item.id : `${message.id}-processing-text-${itemIndex}`}
                                className={`skills-ai-skill-processing-item${isLast ? ' is-last' : ''}`}
                              >
                                <div className="skills-ai-skill-processing-rail" aria-hidden="true">
                                  <span className="skills-ai-skill-processing-rail-dot" />
                                  <span className="skills-ai-skill-processing-rail-line" />
                                </div>
                                <div className="skills-ai-skill-processing-content">
                                  {item.type === 'text' ? (
                                    <div className="skills-ai-skill-processing-line">{item.content}</div>
                                  ) : (
                                    <div className="skills-ai-skill-processing-chip-group">
                                      <button
                                        type="button"
                                        className={`skills-ai-skill-processing-chip skills-ai-skill-processing-chip--${item.chipType}${
                                          message.activeProcessingChipId === item.id ? ' is-active' : ''
                                        }`}
                                        onClick={() => toggleProcessingChipDetail(message.id, item.id)}
                                      >
                                        <span
                                          className={`skills-ai-skill-processing-chip-icon is-${getProcessingChipStatus(message, item, itemIndex)}`}
                                          aria-hidden="true"
                                        >
                                          {renderProcessingChipIcon(item.chipType, getProcessingChipStatus(message, item, itemIndex))}
                                        </span>
                                        <span className="skills-ai-skill-processing-chip-label">{item.label}</span>
                                      </button>
                                      {message.activeProcessingChipId === item.id ? (
                                        <div className="skills-ai-skill-chip-detail">
                                          <div className="skills-ai-skill-chip-detail-head">
                                            <div className="skills-ai-skill-chip-detail-title">{item.detailTitle}</div>
                                            <button
                                              type="button"
                                              className="skills-ai-skill-chip-detail-close"
                                              aria-label={locale === 'zh' ? '收起详情' : 'Collapse details'}
                                              title={locale === 'zh' ? '收起详情' : 'Collapse details'}
                                              onClick={() => toggleProcessingChipDetail(message.id, item.id)}
                                            >
                                              <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                                                <path d="m4 4 8 8M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                              </svg>
                                            </button>
                                          </div>
                                          {renderProcessingChipDetail(item)}
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                  {message.finalStatus !== 'idle' ? (
                    <div className="agents-ai-bubble is-assistant skills-ai-skill-final">
                      <div className="skills-ai-skill-final-text">{renderMarkdownDocument(message.visibleFinalText ?? '', { enableCodeCopy: true })}</div>
                      {message.finalStatus === 'complete' && message.createdSkillName && message.createdSkillContent ? (
                        <div className="skills-ai-generated-skill-card" role="group" aria-label={message.createdSkillName}>
                          <div className="skills-ai-generated-skill-card__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                              <path
                                d="M8 4.5h7l4.5 4.5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinejoin="round"
                              />
                              <path d="M15 4.5V9h4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                              <path
                                d="M9.5 12.25h5M9.5 15h5M9.5 17.75h3.25"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div className="skills-ai-generated-skill-card__body">
                            <div className="skills-ai-generated-skill-card__title">{message.createdSkillName}</div>
                            <div className="skills-ai-generated-skill-card__meta">{text.saveSkillCardType}</div>
                          </div>
                          <div className="skills-ai-generated-skill-card__actions">
                            <button
                              type="button"
                              className="skills-ai-generated-skill-card__icon-btn"
                              aria-label={text.saveSkillCardDownload}
                              title={text.saveSkillCardDownload}
                              onClick={() => handleDownloadGeneratedSkill(message.createdSkillName!, message.createdSkillContent!)}
                            >
                              <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
                                <path
                                  d="M10 3.75v8.5M6.75 9.75 10 13l3.25-3.25M4 15.25h12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className={`skills-ai-generated-skill-card__save-btn${
                                installingGeneratedSkillName === message.createdSkillName ? ' is-loading' : ''
                              }${
                                installedGeneratedSkillName === message.createdSkillName ? ' is-success' : ''
                              }`}
                              disabled={
                                installingGeneratedSkillName != null || installedGeneratedSkillName != null
                              }
                              onClick={() => handleInstallGeneratedSkill(message.createdSkillName!)}
                            >
                              {installingGeneratedSkillName === message.createdSkillName ? (
                                <>
                                  <span className="skills-ai-generated-skill-card__save-spinner" aria-hidden="true" />
                                  <span>{text.saveSkillCardInstalling}</span>
                                </>
                              ) : installedGeneratedSkillName === message.createdSkillName ? (
                                text.saveSkillCardInstalled
                              ) : (
                                text.saveSkillCardAction
                              )}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="agents-ai-bubble is-assistant">{message.text}</div>
            )}
          </div>
        )
      })}
    </div>
  )

  const renderSkillFiles = (nodes: SkillFileNode[], depth = 0): ReactNode[] =>
    nodes.flatMap((node) => {
      const isFolder = node.kind === 'folder'
      const isExpanded = isFolder ? expandedFolderIds.has(node.id) : false

      const row = isFolder ? (
        <button
          key={node.id}
          type="button"
          className="skills-config-file-row is-folder"
          style={{ paddingLeft: `${12 + depth * 18}px` }}
          onClick={() =>
            setExpandedFolderIds((current) => {
              const next = new Set(current)
              if (next.has(node.id)) {
                next.delete(node.id)
              } else {
                next.add(node.id)
              }
              return next
            })
          }
        >
          <span className={`skills-config-file-caret${isExpanded ? ' is-expanded' : ''}`} aria-hidden="true">
            <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
              <path d="M5 3.5 10 8 5 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="skills-config-file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l1.6 1.8H18A2.5 2.5 0 0 1 20.5 9.3v7.2A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="skills-config-file-name">{node.name}</span>
        </button>
      ) : (
        <button
          key={node.id}
          type="button"
          className={selectedFileId === node.id ? 'skills-config-file-row is-file-active' : 'skills-config-file-row'}
          style={{ paddingLeft: `${12 + depth * 18}px` }}
          onClick={() => {
            setSelectedFileId(node.id)
            setFileViewMode('preview')
          }}
        >
          <span className="skills-config-file-caret" aria-hidden="true" />
          <span className="skills-config-file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M14 3.5V8h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="skills-config-file-name">{node.name}</span>
        </button>
      )

      if (isFolder && node.children?.length && isExpanded) {
        return [row, ...renderSkillFiles(node.children, depth + 1)]
      }

      return [row]
    })

  const selectedSkillLatestSnapshot = selectedSkill ? buildSkillFileSnapshot(selectedSkill) : {}
  const selectedSkillInitialSnapshot =
    selectedSkill && initialSkillSnapshots[selectedSkill.id]
      ? initialSkillSnapshots[selectedSkill.id]
      : selectedSkillLatestSnapshot
  const selectedSkillDraftSnapshot =
    selectedSkill && skillDraftSnapshots[selectedSkill.id]
      ? mergeSkillSnapshots(selectedSkillLatestSnapshot, skillDraftSnapshots[selectedSkill.id])
      : selectedSkillLatestSnapshot
  const activeVersionId = selectedSkill ? activeVersionIdsBySkill[selectedSkill.id] ?? 'initial' : 'initial'
  const selectedSkillVersionHistory = selectedSkill ? savedSkillVersions[selectedSkill.id] ?? [] : []
  const activeSavedVersion =
    activeVersionId === 'initial' ? null : selectedSkillVersionHistory.find((version) => version.id === activeVersionId) ?? null
  const activeVersionSnapshot = activeSavedVersion?.snapshot ?? selectedSkillInitialSnapshot
  const hasUnsavedChanges =
    selectedSkill != null && !areSkillSnapshotsEqual(selectedSkillDraftSnapshot, activeVersionSnapshot)
  const versionPanelExpanded = selectedSkill ? (versionPanelExpandedBySkill[selectedSkill.id] ?? false) : false
  const initialVersionMeta = selectedSkill ? `${selectedSkill.creator} · ${formatSkillCreatedDate(selectedSkill, locale)}` : ''
  const activeVersionLabel = activeSavedVersion?.label ?? text.initialVersion
  const activeVersionMeta = activeSavedVersion?.meta ?? initialVersionMeta
  const selectedFileContent =
    selectedFile && selectedSkill
      ? selectedSkillDraftSnapshot[selectedFile.node.id] ?? buildGeneratedFileContent(selectedSkill, selectedFile.path)
      : selectedSkill
        ? selectedSkill.instructions
        : ''

  const editorLineCount = Math.max(1, selectedFileContent.split('\n').length)
  const selectedFileIsMarkdown = selectedFile ? /\.md$/i.test(selectedFile.path[selectedFile.path.length - 1] ?? '') : true
  const aiPageDisplayTitle = locale === 'zh' && aiDraftSkillName ? aiDraftSkillName : text.aiPageTitle

  if (view === 'create-ai') {
    return (
      <section className="manus-home-session skills-ai-create-page" aria-label={aiPageDisplayTitle}>
        <header className="manus-home-session-head">
          <button
            type="button"
            className="agents-joyce-main-chat-back"
            aria-label={text.back}
            title={text.back}
            onClick={() => {
              setAiDraftSkillName('')
              setView('list')
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="skills-ai-page-head-main">
            <h1 className="manus-home-session-head__title">{aiPageDisplayTitle}</h1>
            {text.aiPageSubtitle ? <p className="skills-ai-page-subtitle">{text.aiPageSubtitle}</p> : null}
          </div>
          <span className="skills-ai-page-tag">{text.aiTag}</span>
        </header>
        <div className="manus-home-session-body">
          <div className="manus-home-session-solo">
            <div className="manus-home-session-chat">
              <div className="manus-home-session-messages-wrap">
                <div ref={aiMessagesScrollRef} className="manus-home-session-messages" role="log" aria-live="polite">
                  <div className="manus-home-session-messages-dialog">{renderAiMessages()}</div>
                </div>
              </div>
            </div>
            <div className="manus-home-session-composer-band">
              <div className="manus-home-session-composer-outer composer composer--home-session">
                <div className="composer-surface composer-surface--home-session">
                  <label className="sr-only" htmlFor="skills-ai-composer-input">
                    {aiPageDisplayTitle}
                  </label>
                  <div className="composer-input-wrap">
                    <textarea
                      ref={aiComposerRef}
                      id="skills-ai-composer-input"
                      className="composer-input composer-input--home-session"
                      rows={1}
                      placeholder={text.inputPlaceholder}
                      value={aiInput}
                      disabled={aiAssistantPending}
                      onChange={(event) => setAiInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          if (aiInput.trim() && !aiAssistantPending) handleAiSend()
                        }
                      }}
                    />
                    <button
                      className="composer-send"
                      type="button"
                      aria-label={text.send}
                      title={text.send}
                      disabled={!aiInput.trim() || aiAssistantPending}
                      onClick={handleAiSend}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M12 19V6M7 10l5-5 5 5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className={`composer-voice${aiVoiceListening ? ' composer-voice--listening' : ''}`}
                      type="button"
                      aria-label={aiVoiceListening ? '停止语音输入' : '语音输入'}
                      aria-pressed={aiVoiceListening}
                      disabled={aiAssistantPending}
                      title={aiVoiceListening ? '点击结束识别' : '点击开始语音输入（再次点击结束）'}
                      onClick={handleAiVoiceClick}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 11a7 7 0 0 1-14 0M12 18v3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (selectedSkill) {
    return (
      <section className="skills-config-page" aria-label={text.skillConfigTitle}>
        <div className="skills-config-shell">
          <aside className="skills-config-sidebar">
            <button
              type="button"
              className="skills-config-back-link"
              aria-label={text.backToSkills}
              title={text.backToSkills}
              onClick={() => setSelectedSkillId(null)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{text.back}</span>
            </button>
            <div className="skills-config-search-row">
              <label className="sr-only" htmlFor="skills-config-search-input">
                {text.searchSkillsConfig}
              </label>
              <div className="skills-config-search">
                <span className="skills-config-search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M16.8 16.8 21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="skills-config-search-input"
                  type="text"
                  placeholder={text.searchSkillsConfig}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button type="button" className="skills-config-filter-btn" aria-label={text.filterSkills} title={text.filterSkills}>
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M4 7h16l-6 7v4l-4 2v-6L4 7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="skills-config-sidebar-label">{text.skillsNav}</div>
            <div className="skills-config-sidebar-list">
              {skills
                .filter((skill) => {
                  const query = search.trim().toLowerCase()
                  if (!query) return true
                  return [skill.name, skill.description].join(' ').toLowerCase().includes(query)
                })
                .map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className={skill.id === selectedSkill.id ? 'skills-config-sidebar-item is-active' : 'skills-config-sidebar-item'}
                    onClick={() => setSelectedSkillId(skill.id)}
                  >
                    <span className="skills-config-sidebar-item-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path
                          d="M8 4h7l5 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                          fill="currentColor"
                          opacity="0.18"
                        />
                        <path
                          d="M8 4h7l5 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>{skill.name}</span>
                  </button>
                ))}
            </div>
          </aside>

          <aside className="skills-config-files-pane" aria-label={text.filesPaneLabel}>
            <div className="skills-config-files-head">
              <div className="skills-config-files-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path
                    d="M8 4h7l5 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    fill="currentColor"
                    opacity="0.18"
                  />
                  <path
                    d="M8 4h7l5 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="skills-config-files-head-main">
                <div className="skills-config-files-title">{selectedSkill.name}</div>
                <div className="skills-config-files-meta">{initialVersionMeta}</div>
              </div>
              {canPublishSectionVersion ? (
                <button
                  type="button"
                  className="agents-btn agents-btn-primary skills-config-publish-btn"
                  onClick={() => setSkillVersionModalOpen(true)}
                >
                  {tcsT(locale, 'sectionVersionPublishBtn')}
                </button>
              ) : null}
            </div>
            <div className="skills-config-files-version">
              <button
                type="button"
                className="skills-config-files-version-trigger"
                onClick={() =>
                  setVersionPanelExpandedBySkill((current) => ({
                    ...current,
                    [selectedSkill.id]: !versionPanelExpanded,
                  }))
                }
                aria-expanded={versionPanelExpanded}
              >
                <span className="skills-config-files-version-trigger-main">
                  <span className="skills-config-files-version-title">{activeVersionLabel}</span>
                  <span className="skills-config-files-version-meta">{activeVersionMeta}</span>
                </span>
                <span className={versionPanelExpanded ? 'skills-config-files-version-chevron is-expanded' : 'skills-config-files-version-chevron'} aria-hidden="true">
                  <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                    <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              {versionPanelExpanded ? (
                <div className="skills-config-version-history">
                  <div className="skills-config-version-history-title">{text.editChanges}</div>
                  <div className="skills-config-version-history-list" role="list">
                    {selectedSkillVersionHistory.length > 0 ? (
                      selectedSkillVersionHistory.map((version) => (
                        <button
                          key={version.id}
                          type="button"
                          className={activeVersionId === version.id ? 'skills-config-version-history-item is-active' : 'skills-config-version-history-item'}
                          onClick={() => handleSelectSavedVersion(version.id)}
                        >
                          <span className="skills-config-version-history-item-main">
                            <span className="skills-config-version-history-item-label">{version.label}</span>
                            <span className="skills-config-version-history-item-meta">{version.meta}</span>
                          </span>
                          {activeVersionId === version.id ? <span className="skills-config-version-history-item-check">✓</span> : null}
                        </button>
                      ))
                    ) : null}
                    <button
                      type="button"
                      className={activeVersionId === 'initial' ? 'skills-config-version-history-item is-active' : 'skills-config-version-history-item'}
                      onClick={() => handleSelectSavedVersion('initial')}
                    >
                      <span className="skills-config-version-history-item-main">
                        <span className="skills-config-version-history-item-label">{text.initialVersion}</span>
                        <span className="skills-config-version-history-item-meta">{initialVersionMeta}</span>
                      </span>
                      {activeVersionId === 'initial' ? <span className="skills-config-version-history-item-check">✓</span> : null}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="skills-config-files-tree">{renderSkillFiles(selectedSkill.files)}</div>
          </aside>

          <main className="skills-config-detail">
            <div className="skills-config-detail-filebar">
              <div className="skills-config-detail-filebar-actions">
                <button
                  type="button"
                  className={fileViewMode === 'preview' ? 'skills-config-mode-btn is-active' : 'skills-config-mode-btn'}
                  onClick={() => setFileViewMode('preview')}
                >
                  {text.previewFile}
                </button>
                <button
                  type="button"
                  className={fileViewMode === 'edit' ? 'skills-config-mode-btn is-active' : 'skills-config-mode-btn'}
                  onClick={() => setFileViewMode('edit')}
                  disabled={!selectedFile}
                >
                  {text.editFile}
                </button>
              </div>
              <div className="skills-config-detail-filepath">
                {selectedFile ? selectedFile.path.join('/') : selectedSkill.files[0]?.name ?? 'SKILL.md'}
              </div>
              <div className="skills-config-detail-filebar-actions is-right">
                <button
                  type="button"
                  className="skills-config-download-btn"
                  aria-label={text.downloadFile}
                  title={text.downloadFile}
                  onClick={handleDownloadSelectedFile}
                  disabled={!selectedFile}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 4v10M8 10l4 4 4-4M5 18h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="skills-config-preview-section">
              <div className="skills-config-preview-card">
                {selectedFile ? (
                  fileViewMode === 'preview' ? (
                    selectedFileIsMarkdown ? (
                      <div className="skills-config-markdown-doc is-readonly">
                        {renderMarkdownDocument(selectedFileContent)}
                      </div>
                    ) : (
                      <pre className="skills-config-preview-content is-readonly">{selectedFileContent}</pre>
                    )
                  ) : (
                    <div className="skills-config-source-editor">
                      <div className="skills-config-editor-shell">
                        <div className="skills-config-editor-gutter" style={{ transform: `translateY(-${editorScrollTop}px)` }} aria-hidden="true">
                          {Array.from({ length: editorLineCount }, (_, index) => (
                            <div
                              key={`line-${index + 1}`}
                              className={index + 1 === editorActiveLine ? 'skills-config-editor-line-number is-active' : 'skills-config-editor-line-number'}
                            >
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        <div className="skills-config-editor-main">
                          <div
                            className="skills-config-editor-active-line"
                            style={{ transform: `translateY(${(editorActiveLine - 1) * 26 - editorScrollTop}px)` }}
                            aria-hidden="true"
                          />
                          <textarea
                            className="skills-config-editor"
                            value={selectedFileContent}
                            onChange={(event) => handleSelectedFileContentChange(event.target.value)}
                            onClick={(event) => {
                              const value = event.currentTarget.value
                              const cursor = event.currentTarget.selectionStart ?? 0
                              setEditorActiveLine(value.slice(0, cursor).split('\n').length)
                            }}
                            onKeyUp={(event) => {
                              const value = event.currentTarget.value
                              const cursor = event.currentTarget.selectionStart ?? 0
                              setEditorActiveLine(value.slice(0, cursor).split('\n').length)
                            }}
                            onSelect={(event) => {
                              const value = event.currentTarget.value
                              const cursor = event.currentTarget.selectionStart ?? 0
                              setEditorActiveLine(value.slice(0, cursor).split('\n').length)
                            }}
                            onScroll={(event) => setEditorScrollTop(event.currentTarget.scrollTop)}
                            spellCheck={false}
                          />
                        </div>
                      </div>
                      <div className="skills-config-save-bar skills-config-save-bar--inside">
                        <button
                          type="button"
                          className="skills-config-save-btn"
                          onClick={handleSaveEditedVersion}
                          disabled={!hasUnsavedChanges}
                        >
                          {text.saveEdits}
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="skills-config-markdown-doc is-readonly">{renderMarkdownDocument(selectedSkill.instructions)}</div>
                )}
              </div>
            </div>
          </main>
        </div>
        {skillVersionModalOpen && selectedSkill ? (
          <SectionIterationVersionModal
            open
            locale={locale}
            sectionType="skill"
            sectionId={selectedSkill.id}
            sectionName={selectedSkill.name}
            onClose={() => setSkillVersionModalOpen(false)}
            onConfirm={completeSkillVersionPublish}
          />
        ) : null}
      </section>
    )
  }

  const listPage = (
    <section className="agents-page experience-entry-page skills-page" aria-label={text.title}>
      <div className="agents-page-main experience-entry-page-main skills-page-main">
        <header className="agents-header skills-page-header">
          <div className="agents-header-lead">
            <div className="agents-title">{text.title}</div>
            <SkillsPageTagline />
          </div>
          <div className="agents-header-actions">
            <div className="skills-create-menu-wrap">
              <button
                type="button"
                className="agents-btn agents-btn-primary skills-create-trigger"
                aria-expanded={createMenuOpen}
                onClick={() => setCreateMenuOpen((current) => !current)}
              >
                + {text.createSkill}
              </button>
            </div>
          </div>
        </header>

        <div className="agents-tabs" role="tablist" aria-label={text.filterLabel}>
          {([
            ['all', text.tabAll, skillsTabCounts.all],
            ['referenced', text.tabReferenced, skillsTabCounts.referenced],
            ['mine', text.tabMine, skillsTabCounts.mine],
          ] as Array<[SkillsTab, string, number]>).map(([key, label, count]) => (
            <button
              key={key}
              className={skillsTab === key ? 'agents-tab is-active' : 'agents-tab'}
              type="button"
              role="tab"
              aria-selected={skillsTab === key}
              onClick={() => setSkillsTab(key)}
            >
              {label} <span className="agents-tab-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="agents-toolbar skills-page-toolbar">
          <div className="skills-page-toolbar-left">
            <div className="agents-search skills-page-search">
              <span className="agents-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.8 16.8 21 21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                className="agents-search-input"
                placeholder={text.searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="skills-page-header-actions">
            <div ref={sortMenuRef} className="skills-sort-menu-wrap">
              <button
                type="button"
                className="skills-filter-trigger"
                aria-label={text.filterSkills}
                aria-expanded={sortMenuOpen}
                onClick={() => setSortMenuOpen((current) => !current)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                  <path
                    d="M4 7h16M7 12h10M10 17h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {sortMenuOpen ? (
                <div className="skills-sort-menu-panel" role="menu" aria-label={text.sortMenuLabel}>
                  {([
                    ['recent', text.sortRecent],
                    ['a-z', text.sortNameAsc],
                    ['z-a', text.sortNameDesc],
                  ] as Array<[SkillsSortOrder, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={sortOrder === value ? 'skills-sort-menu-item is-active' : 'skills-sort-menu-item'}
                      role="menuitemradio"
                      aria-checked={sortOrder === value}
                      onClick={() => {
                        setSortOrder(value)
                        setSortMenuOpen(false)
                      }}
                    >
                      <span>{label}</span>
                      {sortOrder === value ? <span className="skills-sort-menu-check">✓</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="agents-btn" onClick={onBrowseLibrary}>
              {text.browseLibrary}
            </button>
            <div className="tools-directory-view-toggle" role="tablist" aria-label={text.viewToggle}>
              <button
                type="button"
                className={viewMode === 'table' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
                role="tab"
                aria-selected={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                title={text.tableView}
              >
                ☰
              </button>
              <button
                type="button"
                className={viewMode === 'cards' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
                role="tab"
                aria-selected={viewMode === 'cards'}
                onClick={() => setViewMode('cards')}
                title={text.cardsView}
              >
                ⊞
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <section className="skills-table-shell" aria-label={text.tableLabel}>
            <div className="skills-table-head">
              <div>{text.columnName}</div>
              <div>{text.columnDescription}</div>
              <div>{text.columnCreator}</div>
              <div aria-hidden="true" />
            </div>
            <div className="skills-table-body">
              {paginatedSkills.length > 0 ? (
                paginatedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="skills-table-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenSkillConfig(skill.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleOpenSkillConfig(skill.id)
                      }
                    }}
                  >
                    <div className="skills-table-name-cell">
                      <span
                        className="agent-card-icon agent-card-icon-grad skills-table-name-icon"
                        style={getSkillCardIconStyle(skill.name)}
                        aria-hidden="true"
                      />
                      <span className="skills-table-name-text">{skill.name}</span>
                    </div>
                    <div className="skills-table-desc">{skill.description}</div>
                    <div className="skills-table-creator">{skill.creator}</div>
                    {renderSkillActions(skill)}
                  </div>
                ))
              ) : (
                <div className="skills-empty">{text.empty}</div>
              )}
            </div>
          </section>
        ) : (
          <section className="agents-grid skills-cards-grid" aria-label={text.cardsLabel}>
            {paginatedSkills.length > 0 ? (
              paginatedSkills.map((skill) => (
                <article
                  key={skill.id}
                  className="agent-card skills-record-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenSkillConfig(skill.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    handleOpenSkillConfig(skill.id)
                  }}
                >
                  {renderSkillActions(skill)}
                  <div className="skills-record-card-head">
                    <span
                      className="agent-card-icon agent-card-icon-grad skills-record-card-icon"
                      style={getSkillCardIconStyle(skill.name)}
                      aria-hidden="true"
                    />
                    <div className="skills-record-card-title-wrap">
                      <div className="skills-record-card-title">{skill.name}</div>
                      <div className="skills-record-card-creator">
                        {text.columnCreator}: {skill.creator}
                      </div>
                    </div>
                  </div>
                  <div className="skills-record-card-desc">{skill.description}</div>
                  <div className="skills-record-card-footer">
                    <div className="skills-record-card-created-at">{formatSkillCreatedDate(skill, locale)}</div>
                    <div className="agent-card-tag">{getSkillCardTag(skill, locale)}</div>
                  </div>
                </article>
              ))
            ) : (
              <div className="skills-empty">{text.empty}</div>
            )}
          </section>
        )}

        {filteredSkills.length > 0 ? (
          <nav className="tools-directory-pagination" aria-label={text.paginationLabel}>
            <button
              type="button"
              className="tools-directory-pagination-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              {text.previousPage}
            </button>
            <div className="tools-directory-pagination-pages">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1
                return (
                  <button
                    key={page}
                    type="button"
                    aria-current={page === currentPage ? 'page' : undefined}
                    className={
                      page === currentPage
                        ? 'tools-directory-pagination-page is-active'
                        : 'tools-directory-pagination-page'
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <div className="tools-directory-pagination-summary">
              {text.pageSummary.replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
            </div>
            <button
              type="button"
              className="tools-directory-pagination-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              {text.nextPage}
            </button>
          </nav>
        ) : null}
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept={SKILL_UPLOAD_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleUploadChange}
      />

      {skillNoticeToast
        ? createPortal(
            <div className="agents-publish-success-toast" role="status" aria-live="polite">
              <span className="agents-publish-success-toast__icon" aria-hidden="true">
                ✓
              </span>
              <div className="agents-publish-success-toast__text">
                <strong className="agents-publish-success-toast__title">{skillNoticeToast.title}</strong>
                {skillNoticeToast.sub ? (
                  <span className="agents-publish-success-toast__sub">{skillNoticeToast.sub}</span>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {manualCreateOpen ? (
        <div className="skills-manual-modal-layer" role="presentation">
          <button
            type="button"
            className="skills-manual-modal-backdrop"
            aria-label={text.cancel}
            onClick={() => setManualCreateOpen(false)}
          />
          <div className="skills-manual-modal" role="dialog" aria-modal="true" aria-label={text.manualTitle}>
            <button
              type="button"
              className="skills-manual-modal-close"
              aria-label={text.cancel}
              onClick={() => setManualCreateOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="skills-manual-modal-title">{text.manualTitle}</div>
            <div className="skills-manual-modal-subtitle">{text.manualSubtitle}</div>
            <label className="skills-manual-modal-field">
              <span>{text.manualName}</span>
              <input
                placeholder={text.manualNamePlaceholder}
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
              />
            </label>
            <label className="skills-manual-modal-field">
              <span>{text.manualDescription}</span>
              <input
                placeholder={text.manualDescriptionPlaceholder}
                value={manualDescription}
                onChange={(event) => setManualDescription(event.target.value)}
              />
            </label>
            <div className="skills-manual-modal-actions">
              <label className="skills-manual-modal-field">
                <span>{text.manualInstructions}</span>
                <textarea
                  rows={12}
                  placeholder={text.manualInstructionsPlaceholder}
                  value={manualInstructions}
                  onChange={(event) => setManualInstructions(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="agents-btn agents-btn-primary skills-manual-modal-submit"
                disabled={!manualName.trim() || !manualDescription.trim() || !manualInstructions.trim()}
                onClick={handleSaveManualSkill}
              >
                {text.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {createMenuOpen ? (
        <div className="skills-create-modal-layer" role="presentation">
          <button
            type="button"
            className="skills-create-modal-backdrop"
            aria-label={text.cancel}
            onClick={() => setCreateMenuOpen(false)}
          />
          <div className="skills-create-modal" role="dialog" aria-modal="true" aria-label={text.menuTitle}>
            <button
              type="button"
              className="skills-create-modal-close"
              aria-label={text.cancel}
              onClick={() => setCreateMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="skills-create-modal-title">{text.menuTitle}</div>
            <div className="skills-create-modal-subtitle">{text.createModalSubtitle}</div>
            <div className="skills-create-modal-options">
              <button type="button" className="skills-create-modal-option" onClick={startAiCreateFlow}>
                <div className="skills-create-modal-option-title">{text.createWithAi}</div>
                <div className="skills-create-modal-option-desc">{text.createWithAiDesc}</div>
              </button>
              <button type="button" className="skills-create-modal-option" onClick={handleUploadFiles}>
                <div className="skills-create-modal-option-title">{text.uploadFiles}</div>
                <div className="skills-create-modal-option-desc">{text.uploadFilesDesc}</div>
              </button>
              <button
                type="button"
                className="skills-create-modal-option"
                onClick={() => {
                  setCreateMenuOpen(false)
                  setManualCreateOpen(true)
                }}
              >
                <div className="skills-create-modal-option-title">{text.writeInstructions}</div>
                <div className="skills-create-modal-option-desc">{text.writeInstructionsDesc}</div>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )

  return <JoyceAiPanel sectionAriaLabel={text.title}>{listPage}</JoyceAiPanel>
}
