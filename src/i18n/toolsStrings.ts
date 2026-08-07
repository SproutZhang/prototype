import type { AppLocale } from './homeStrings'
import type { ToolDirectoryItem } from '../data/tools-directory'
import { isReferencedTool } from '../data/tools-directory'
import { TOOLS_CATALOG } from '../modules/app-market/tools/data'

const STRINGS = {
  zh: {
    toolTag: '工具',
    referencedTag: '引用',
    integrationsAria: '第三方接入：{items}',
    agentsAria: '关联 Agent：{items}',
    justInstalled: '刚刚安装',
    justCreated: '刚刚创建',
    justEdited: '刚刚编辑',
    notRun: '未运行',
    unnamedTool: '未命名工具',
    importedTool: '导入工具',
    customToolDefault: '通过自定义 OpenAPI Schema 创建的工具配置。',
    importedFromJson: '从 JSON 文件 {file} 导入的工具配置。',
    invokeEndpoint: '调用 {method} {endpoint}',
    executionFailed: '工具执行失败',
  },
  en: {
    toolTag: 'Tool',
    referencedTag: 'Referenced',
    integrationsAria: 'Integrations: {items}',
    agentsAria: 'Linked agents: {items}',
    justInstalled: 'Just installed',
    justCreated: 'Just created',
    justEdited: 'Just edited',
    notRun: 'Not run yet',
    unnamedTool: 'Untitled tool',
    importedTool: 'Imported tool',
    customToolDefault: 'Custom tool created from an OpenAPI schema.',
    importedFromJson: 'Tool configuration imported from JSON file {file}.',
    invokeEndpoint: 'Invoke {method} {endpoint}',
    executionFailed: 'Tool execution failed',
  },
} as const

export type ToolsStringKey = keyof (typeof STRINGS)['zh']

export function toolsT(locale: AppLocale, key: ToolsStringKey, vars?: Record<string, string>): string {
  let text: string = STRINGS[locale][key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v)
    }
  }
  return text
}

const SEED_TOOLS: Record<
  string,
  {
    name: { zh: string; en: string }
    description: { zh: string; en: string }
    type: { zh: string; en: string }
    agents: { zh: string[]; en: string[] }
    createdLabel: { zh: string; en: string }
    lastModifiedLabel: { zh: string; en: string }
    lastRunLabel: { zh: string; en: string }
  }
> = {
  'tool-forms-intake': {
    name: { zh: 'Google Forms 表单创建', en: 'Create Google Forms' },
    description: {
      zh: '为新员工信息采集、资料上传与待办确认生成标准化表单。',
      en: 'Generate standardized forms for new-hire intake, uploads, and confirmations.',
    },
    type: { zh: '自动化', en: 'Automation' },
    agents: {
      zh: ['入职助手 Agent', 'HR 收集 Agent'],
      en: ['Onboarding assistant agent', 'HR intake agent'],
    },
    createdLabel: { zh: '3 月创建', en: 'Created in Mar' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '2 小时前运行', en: 'Ran 2 hours ago' },
  },
  'tool-trello-card': {
    name: { zh: 'Trello 看板创建卡片', en: 'Create Trello board cards' },
    description: {
      zh: '按新员工部门与入职阶段自动创建看板卡片并分配负责人。',
      en: 'Auto-create Trello cards by department and onboarding stage, with owners assigned.',
    },
    type: { zh: '任务', en: 'Task' },
    agents: {
      zh: ['运营协同 Agent', 'IT 开通 Agent'],
      en: ['Ops coordination agent', 'IT provisioning agent'],
    },
    createdLabel: { zh: '2 月创建', en: 'Created in Feb' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '昨天运行', en: 'Ran yesterday' },
  },
  'tool-knowledge-answer': {
    name: { zh: '从知识集中检索答案', en: 'Retrieve answers from knowledge base' },
    description: {
      zh: '根据员工提问从知识库中检索并返回标准答案与引用片段。',
      en: 'Search the knowledge base for standard answers and cited snippets.',
    },
    type: { zh: '知识库', en: 'Knowledge base' },
    agents: { zh: ['知识问答 Agent'], en: ['Knowledge Q&A agent'] },
    createdLabel: { zh: '1 月创建', en: 'Created in Jan' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '昨天运行', en: 'Ran yesterday' },
  },
  'tool-csv-analyzer': {
    name: { zh: '分析 CSV 数据', en: 'Analyze CSV data' },
    description: {
      zh: '分析员工主数据表中的缺失字段、重复项和格式异常。',
      en: 'Analyze employee master data for missing fields, duplicates, and format issues.',
    },
    type: { zh: '分析', en: 'Analytics' },
    agents: { zh: ['数据校验 Agent'], en: ['Data validation agent'] },
    createdLabel: { zh: '4 月创建', en: 'Created in Apr' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '2 天前运行', en: 'Ran 2 days ago' },
  },
  'tool-upload-csv': {
    name: { zh: '上传 CSV 到知识表', en: 'Upload CSV to knowledge table' },
    description: {
      zh: '把 CSV 数据批量写入知识表，支持字段映射与冲突覆盖。',
      en: 'Bulk-write CSV data into a knowledge table with mapping and conflict overwrite.',
    },
    type: { zh: '数据接入', en: 'Data ingest' },
    agents: {
      zh: ['数据接入 Agent', '记录维护 Agent'],
      en: ['Data ingest agent', 'Record maintenance agent'],
    },
    createdLabel: { zh: '2 月创建', en: 'Created in Feb' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '3 天前运行', en: 'Ran 3 days ago' },
  },
  'tool-delete-records': {
    name: { zh: '从知识库删除记录', en: 'Delete records from knowledge base' },
    description: {
      zh: '按员工编号或批量条件删除无效记录，并保留删除日志。',
      en: 'Delete invalid records by employee ID or batch criteria, with audit logs.',
    },
    type: { zh: '维护', en: 'Maintenance' },
    agents: { zh: ['记录维护 Agent'], en: ['Record maintenance agent'] },
    createdLabel: { zh: '1 月创建', en: 'Created in Jan' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '4 天前运行', en: 'Ran 4 days ago' },
  },
  'tool-upsert-record': {
    name: { zh: '更新或插入知识记录', en: 'Upsert knowledge records' },
    description: {
      zh: '根据唯一 ID 自动更新或新增记录，适合员工资料同步场景。',
      en: 'Update or insert records by unique ID, suited for employee profile sync.',
    },
    type: { zh: '数据库', en: 'Database' },
    agents: {
      zh: ['记录维护 Agent', '流程路由 Agent'],
      en: ['Record maintenance agent', 'Workflow routing agent'],
    },
    createdLabel: { zh: '3 月创建', en: 'Created in Mar' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '5 天前运行', en: 'Ran 5 days ago' },
  },
  'tool-teams-message': {
    name: { zh: '通过 Teams 发送私信', en: 'Send Teams direct messages' },
    description: {
      zh: '向新员工或负责人发送 Teams 私信，用于通知、催办与提醒。',
      en: 'Send Teams DMs to new hires or owners for notifications and reminders.',
    },
    type: { zh: '通知', en: 'Notification' },
    agents: { zh: ['通知跟进 Agent'], en: ['Notification follow-up agent'] },
    createdLabel: { zh: '4 月创建', en: 'Created in Apr' },
    lastModifiedLabel: { zh: '上个月编辑', en: 'Edited last month' },
    lastRunLabel: { zh: '今天运行', en: 'Ran today' },
  },
}

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  自动化: { zh: '自动化', en: 'Automation' },
  任务: { zh: '任务', en: 'Task' },
  知识库: { zh: '知识库', en: 'Knowledge base' },
  分析: { zh: '分析', en: 'Analytics' },
  数据接入: { zh: '数据接入', en: 'Data ingest' },
  维护: { zh: '维护', en: 'Maintenance' },
  数据库: { zh: '数据库', en: 'Database' },
  通知: { zh: '通知', en: 'Notification' },
  MCP: { zh: 'MCP', en: 'MCP' },
  Tools: { zh: 'Tools', en: 'Tools' },
  工具: { zh: '工具', en: 'Tool' },
}

const TIME_LABEL_MAP: Record<string, ToolsStringKey> = {
  刚刚安装: 'justInstalled',
  刚刚创建: 'justCreated',
  刚刚编辑: 'justEdited',
  未运行: 'notRun',
  'Just installed': 'justInstalled',
  'Just created': 'justCreated',
  'Just edited': 'justEdited',
  'Not run yet': 'notRun',
}

const TIME_LABEL_PATTERNS: Array<{ pattern: RegExp; en: (match: RegExpMatchArray) => string }> = [
  { pattern: /^(\d+) 月创建$/, en: (m) => `Created in month ${m[1]}` },
  { pattern: /^上个月编辑$/, en: () => 'Edited last month' },
  { pattern: /^(\d+) 小时前运行$/, en: (m) => `Ran ${m[1]} hours ago` },
  { pattern: /^昨天运行$/, en: () => 'Ran yesterday' },
  { pattern: /^(\d+) 天前运行$/, en: (m) => `Ran ${m[1]} days ago` },
  { pattern: /^今天运行$/, en: () => 'Ran today' },
]

function localizeTimeLabel(label: string, locale: AppLocale): string {
  if (locale === 'zh') return label
  const key = TIME_LABEL_MAP[label]
  if (key) return toolsT(locale, key)
  for (const { pattern, en } of TIME_LABEL_PATTERNS) {
    const match = label.match(pattern)
    if (match) return en(match)
  }
  return label
}

export function localizeToolType(type: string, locale: AppLocale): string {
  if (locale === 'zh') return type
  const entry = TYPE_LABELS[type]
  if (entry) return entry.en
  if (type === 'Tools' || type === 'Tool') return 'Tools'
  return type
}

function localizeDynamicDescription(description: string, locale: AppLocale): string {
  if (locale === 'zh') return description
  if (description === STRINGS.zh.customToolDefault) return toolsT(locale, 'customToolDefault')
  const importedMatch = /^从 JSON 文件 (.+) 导入的工具配置。$/.exec(description)
  if (importedMatch) return toolsT(locale, 'importedFromJson', { file: importedMatch[1] })
  const invokeMatch = /^调用 ([A-Z]+) (.+)$/.exec(description)
  if (invokeMatch) return toolsT(locale, 'invokeEndpoint', { method: invokeMatch[1], endpoint: invokeMatch[2] })
  return description
}

function localizeDynamicName(name: string, locale: AppLocale): string {
  if (locale === 'zh') return name
  if (name === '未命名工具') return toolsT(locale, 'unnamedTool')
  if (name === '导入工具') return toolsT(locale, 'importedTool')
  return name
}

function getAppMarketToolCopy(id: string, locale: AppLocale): { name: string; description: string } | null {
  const entry = TOOLS_CATALOG.find((tool) => tool.id === id)
  if (!entry) return null
  return {
    name: locale === 'zh' ? entry.nameZh : entry.nameEn,
    description: locale === 'zh' ? entry.descriptionZh : entry.descriptionEn,
  }
}

export function localizeToolForDisplay(item: ToolDirectoryItem, locale: AppLocale): ToolDirectoryItem {
  if (locale === 'zh') return item
  const seed = SEED_TOOLS[item.id]
  if (seed) {
    return {
      ...item,
      name: seed.name.en,
      description: seed.description.en,
      type: seed.type.en,
      agents: seed.agents.en,
      createdLabel: seed.createdLabel.en,
      lastModifiedLabel: seed.lastModifiedLabel.en,
      lastRunLabel: seed.lastRunLabel.en,
    }
  }
  const marketCopy = isReferencedTool(item) ? getAppMarketToolCopy(item.id, locale) : null
  return {
    ...item,
    name: marketCopy?.name ?? localizeDynamicName(item.name, locale),
    description: marketCopy?.description ?? localizeDynamicDescription(item.description, locale),
    type: localizeToolType(item.type, locale),
    createdLabel: localizeTimeLabel(item.createdLabel, locale),
    lastModifiedLabel: localizeTimeLabel(item.lastModifiedLabel, locale),
    lastRunLabel: localizeTimeLabel(item.lastRunLabel, locale),
  }
}

export function getToolCardTag(item: ToolDirectoryItem, locale: AppLocale): string {
  if (item.type === 'MCP') return 'MCP'
  return toolsT(locale, 'toolTag')
}
