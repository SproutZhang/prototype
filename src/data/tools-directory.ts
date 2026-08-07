import type { AppMarketItem } from '../modules/app-market/shared/types'

export type ToolIntegrationApp =
  | 'gmail'
  | 'slack'
  | 'excel'
  | 'notion'
  | 'teams'
  | 'googleSheets'

export type ToolIconTone = 'violet' | 'sky' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'cyan' | 'orange'
const NEW_TOOL_OWNER_NAME = 'Martin'

export type ToolDirectoryItem = {
  id: string
  name: string
  description: string
  type: string
  integrations: ToolIntegrationApp[]
  agents: string[]
  owner: string
  createdAt: string
  createdLabel: string
  lastModifiedAt: string
  lastModifiedLabel: string
  lastRunAt: string
  lastRunLabel: string
  timesRun: number
  iconText: string
  iconTone: ToolIconTone
  mcpPresetId?: string
}

export const TOOL_DIRECTORY_ITEMS: ToolDirectoryItem[] = [
  {
    id: 'tool-forms-intake',
    name: 'Google Forms 表单创建',
    description: '为新员工信息采集、资料上传与待办确认生成标准化表单。',
    type: '自动化',
    integrations: ['gmail', 'googleSheets'],
    agents: ['入职助手 Agent', 'HR 收集 Agent'],
    owner: '蔡颖晨',
    createdAt: '2026-03-12T09:00:00.000Z',
    createdLabel: '3 月创建',
    lastModifiedAt: '2026-05-24T09:30:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-26T01:20:00.000Z',
    lastRunLabel: '2 小时前运行',
    timesRun: 186,
    iconText: 'GF',
    iconTone: 'violet',
  },
  {
    id: 'tool-trello-card',
    name: 'Trello 看板创建卡片',
    description: '按新员工部门与入职阶段自动创建看板卡片并分配负责人。',
    type: '任务',
    integrations: ['slack', 'teams'],
    agents: ['运营协同 Agent', 'IT 开通 Agent'],
    owner: '顾维宁',
    createdAt: '2026-02-02T07:00:00.000Z',
    createdLabel: '2 月创建',
    lastModifiedAt: '2026-05-20T07:30:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-25T08:40:00.000Z',
    lastRunLabel: '昨天运行',
    timesRun: 142,
    iconText: 'TR',
    iconTone: 'sky',
  },
  {
    id: 'tool-knowledge-answer',
    name: '从知识集中检索答案',
    description: '根据员工提问从知识库中检索并返回标准答案与引用片段。',
    type: '知识库',
    integrations: ['notion', 'gmail'],
    agents: ['知识问答 Agent'],
    owner: '林葳蕤',
    createdAt: '2026-01-18T10:15:00.000Z',
    createdLabel: '1 月创建',
    lastModifiedAt: '2026-05-18T02:20:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-25T10:10:00.000Z',
    lastRunLabel: '昨天运行',
    timesRun: 224,
    iconText: 'QA',
    iconTone: 'amber',
  },
  {
    id: 'tool-csv-analyzer',
    name: '分析 CSV 数据',
    description: '分析员工主数据表中的缺失字段、重复项和格式异常。',
    type: '分析',
    integrations: ['excel'],
    agents: ['数据校验 Agent'],
    owner: '许知遥',
    createdAt: '2026-04-06T08:10:00.000Z',
    createdLabel: '4 月创建',
    lastModifiedAt: '2026-05-17T06:10:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-24T09:00:00.000Z',
    lastRunLabel: '2 天前运行',
    timesRun: 96,
    iconText: 'CSV',
    iconTone: 'emerald',
  },
  {
    id: 'tool-upload-csv',
    name: '上传 CSV 到知识表',
    description: '把 CSV 数据批量写入知识表，支持字段映射与冲突覆盖。',
    type: '数据接入',
    integrations: ['excel', 'googleSheets'],
    agents: ['数据接入 Agent', '记录维护 Agent'],
    owner: '周若岚',
    createdAt: '2026-02-26T05:00:00.000Z',
    createdLabel: '2 月创建',
    lastModifiedAt: '2026-05-14T12:00:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-23T11:30:00.000Z',
    lastRunLabel: '3 天前运行',
    timesRun: 118,
    iconText: 'UP',
    iconTone: 'rose',
  },
  {
    id: 'tool-delete-records',
    name: '从知识库删除记录',
    description: '按员工编号或批量条件删除无效记录，并保留删除日志。',
    type: '维护',
    integrations: ['notion'],
    agents: ['记录维护 Agent'],
    owner: '沈庭轩',
    createdAt: '2026-01-10T03:50:00.000Z',
    createdLabel: '1 月创建',
    lastModifiedAt: '2026-05-12T08:30:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-22T08:00:00.000Z',
    lastRunLabel: '4 天前运行',
    timesRun: 64,
    iconText: 'DL',
    iconTone: 'indigo',
  },
  {
    id: 'tool-upsert-record',
    name: '更新或插入知识记录',
    description: '根据唯一 ID 自动更新或新增记录，适合员工资料同步场景。',
    type: '数据库',
    integrations: ['notion'],
    agents: ['记录维护 Agent', '流程路由 Agent'],
    owner: '韩知夏',
    createdAt: '2026-03-03T11:20:00.000Z',
    createdLabel: '3 月创建',
    lastModifiedAt: '2026-05-09T05:45:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-21T04:50:00.000Z',
    lastRunLabel: '5 天前运行',
    timesRun: 157,
    iconText: 'DB',
    iconTone: 'cyan',
  },
  {
    id: 'tool-teams-message',
    name: '通过 Teams 发送私信',
    description: '向新员工或负责人发送 Teams 私信，用于通知、催办与提醒。',
    type: '通知',
    integrations: ['teams', 'gmail'],
    agents: ['通知跟进 Agent'],
    owner: '程意安',
    createdAt: '2026-04-18T09:40:00.000Z',
    createdLabel: '4 月创建',
    lastModifiedAt: '2026-05-08T03:15:00.000Z',
    lastModifiedLabel: '上个月编辑',
    lastRunAt: '2026-05-26T00:40:00.000Z',
    lastRunLabel: '今天运行',
    timesRun: 279,
    iconText: 'TM',
    iconTone: 'orange',
  },
]

const SEED_TOOL_IDS = new Set(TOOL_DIRECTORY_ITEMS.map((item) => item.id))

const USER_CREATED_TOOL_ID_PREFIXES = ['custom-tool-', 'imported-tool-', 'structured-tool-'] as const

/** 从应用市场安装的工具（非内置种子、非用户自建/导入） */
export function isReferencedTool(item: ToolDirectoryItem): boolean {
  if (SEED_TOOL_IDS.has(item.id)) return false
  return !USER_CREATED_TOOL_ID_PREFIXES.some((prefix) => item.id.startsWith(prefix))
}

export function isMcpToolItem(item: ToolDirectoryItem): boolean {
  return item.type === 'MCP'
}

const TOOL_ICON_TONES: ToolIconTone[] = ['violet', 'sky', 'amber', 'emerald', 'rose', 'indigo', 'cyan', 'orange']

function pickToolIconTone(seed: string): ToolIconTone {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0
  }
  return TOOL_ICON_TONES[hash % TOOL_ICON_TONES.length]
}

function buildIconText(name: string) {
  const compact = name.replace(/\s+/g, '').slice(0, 3).toUpperCase()
  return compact || 'TL'
}

function dedupeToolIntegrations(items: ToolIntegrationApp[]) {
  return Array.from(new Set(items))
}

function getAppMarketToolIntegrations(item: AppMarketItem): ToolIntegrationApp[] {
  const integrationKeywordMap: Array<{ pattern: RegExp; integration: ToolIntegrationApp }> = [
    { pattern: /\bgmail\b/i, integration: 'gmail' },
    { pattern: /\bslack\b/i, integration: 'slack' },
    { pattern: /\bexcel\b/i, integration: 'excel' },
    { pattern: /\bnotion\b/i, integration: 'notion' },
    { pattern: /\bteams\b/i, integration: 'teams' },
    { pattern: /google\s*sheets/i, integration: 'googleSheets' },
    { pattern: /谷歌表格|google表格/i, integration: 'googleSheets' },
  ]
  const pluginTools = [...(item.pluginToolsZh ?? []), ...(item.pluginToolsEn ?? [])]
  const matches = pluginTools.flatMap((pluginName) =>
    integrationKeywordMap
      .filter(({ pattern }) => pattern.test(pluginName))
      .map(({ integration }) => integration),
  )
  const fallbackMap: Partial<Record<AppMarketItem['id'], ToolIntegrationApp[]>> = {
    'google-workspace-bridge': ['gmail', 'googleSheets'],
    'notion-hr-kit': ['notion'],
    'slack-notify-pack': ['slack'],
  }
  return dedupeToolIntegrations(matches.length > 0 ? matches : (fallbackMap[item.id] ?? []))
}

export function createToolDirectoryItemFromAppMarket(item: AppMarketItem): ToolDirectoryItem {
  const installedAt = new Date().toISOString()
  return {
    id: item.id,
    name: item.nameZh,
    description: item.descriptionZh,
    type: 'Tools',
    integrations: getAppMarketToolIntegrations(item),
    agents: [],
    owner: NEW_TOOL_OWNER_NAME,
    createdAt: installedAt,
    createdLabel: '刚刚安装',
    lastModifiedAt: installedAt,
    lastModifiedLabel: '刚刚安装',
    lastRunAt: installedAt,
    lastRunLabel: '未运行',
    timesRun: 0,
    iconText: buildIconText(item.nameZh),
    iconTone: pickToolIconTone(item.id),
  }
}

type StructuredToolDraft = {
  title: string
  description: string
  endpoint: string
  method: string
}

function buildRecentToolTimeLabels() {
  return {
    createdLabel: '刚刚创建',
    lastModifiedLabel: '刚刚编辑',
    lastRunLabel: '未运行',
  }
}

export function createStructuredToolDirectoryItem(draft: StructuredToolDraft): ToolDirectoryItem {
  const createdAt = new Date().toISOString()
  const { createdLabel, lastModifiedLabel, lastRunLabel } = buildRecentToolTimeLabels()
  return {
    id: `structured-tool-${Date.now()}`,
    name: draft.title.trim() || '未命名工具',
    description: draft.description.trim() || `调用 ${draft.method.toUpperCase()} ${draft.endpoint.trim()}`,
    type: 'Tools',
    integrations: [],
    agents: [],
    owner: NEW_TOOL_OWNER_NAME,
    createdAt,
    createdLabel,
    lastModifiedAt: createdAt,
    lastModifiedLabel,
    lastRunAt: createdAt,
    lastRunLabel,
    timesRun: 0,
    iconText: buildIconText(draft.title),
    iconTone: pickToolIconTone(`${draft.title}-${draft.endpoint}`),
  }
}

type CustomToolDraft = {
  title: string
  description: string
}

export function createCustomToolDirectoryItem(draft: CustomToolDraft): ToolDirectoryItem {
  const createdAt = new Date().toISOString()
  const { createdLabel, lastModifiedLabel, lastRunLabel } = buildRecentToolTimeLabels()
  return {
    id: `custom-tool-${Date.now()}`,
    name: draft.title.trim() || '未命名工具',
    description: draft.description.trim() || '通过自定义 OpenAPI Schema 创建的工具配置。',
    type: 'Tools',
    integrations: [],
    agents: [],
    owner: NEW_TOOL_OWNER_NAME,
    createdAt,
    createdLabel,
    lastModifiedAt: createdAt,
    lastModifiedLabel,
    lastRunAt: createdAt,
    lastRunLabel,
    timesRun: 0,
    iconText: buildIconText(draft.title),
    iconTone: pickToolIconTone(`custom-${draft.title}`),
  }
}

export function createImportedToolDirectoryItem(fileName: string): ToolDirectoryItem {
  const createdAt = new Date().toISOString()
  const cleanName = fileName.replace(/\.[^.]+$/, '').trim() || '导入工具'
  const { createdLabel, lastModifiedLabel, lastRunLabel } = buildRecentToolTimeLabels()
  return {
    id: `imported-tool-${Date.now()}`,
    name: cleanName,
    description: `从 JSON 文件 ${fileName} 导入的工具配置。`,
    type: 'Tools',
    integrations: [],
    agents: [],
    owner: NEW_TOOL_OWNER_NAME,
    createdAt,
    createdLabel,
    lastModifiedAt: createdAt,
    lastModifiedLabel,
    lastRunAt: createdAt,
    lastRunLabel,
    timesRun: 0,
    iconText: buildIconText(cleanName),
    iconTone: pickToolIconTone(fileName),
  }
}

type RemoteMcpToolDraft = {
  title: string
  description: string
  mcpPresetId?: string
}

export function createRemoteMcpToolDirectoryItem(draft: RemoteMcpToolDraft): ToolDirectoryItem {
  const createdAt = new Date().toISOString()
  const { createdLabel, lastModifiedLabel, lastRunLabel } = buildRecentToolTimeLabels()
  return {
    id: `mcp-tool-${Date.now()}`,
    name: draft.title.trim() || '未命名 MCP',
    description: draft.description.trim() || '远程 MCP 服务连接。',
    type: 'MCP',
    integrations: [],
    agents: [],
    owner: NEW_TOOL_OWNER_NAME,
    createdAt,
    createdLabel,
    lastModifiedAt: createdAt,
    lastModifiedLabel,
    lastRunAt: createdAt,
    lastRunLabel,
    timesRun: 0,
    iconText: buildIconText(draft.title),
    iconTone: pickToolIconTone(`mcp-${draft.title}`),
    mcpPresetId: draft.mcpPresetId,
  }
}
