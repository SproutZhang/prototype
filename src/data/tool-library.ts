export type ToolLibraryIcon =
  | 'route'
  | 'embed'
  | 'eval'
  | 'queue'
  | 'retry'
  | 'webhook'
  | 'identity'
  | 'risk'
  | 'sql'
  | 'memory'
  | 'rate-limit'
  | 'extract'
  | 'pdf'
  | 'ocr'
  | 'web'
  | 'gmail'
  | 'slack'
  | 'notion'
  | 'http'
  | 'research'
  | 'search'
  | 'browser'
  | 'dom'
  | 'agent'
  | 'google-docs'
  | 'google-sheets'
  | 'teams'

export type AgentTemplateNodeIcon = 'brain' | 'monitor' | 'file' | 'key' | 'bell' | 'sparkles'

type ToolLibraryItemBase = {
  id: string
  label: string
  icon: ToolLibraryIcon
}

export type ToolLibraryToolItem = ToolLibraryItemBase & {
  itemType: 'tool'
}

export type ToolLibraryAgentTemplateItem = ToolLibraryItemBase & {
  itemType: 'agent-template'
  description: string
  nodeIcon: AgentTemplateNodeIcon
  color: string
}

export type ToolLibraryItem = ToolLibraryToolItem | ToolLibraryAgentTemplateItem

export type ToolLibrarySection = {
  id: string
  title: string
  items: ToolLibraryItem[]
}

export type ToolLibraryCategory = {
  id: string
  title: string
  sections?: ToolLibrarySection[]
  items?: ToolLibraryItem[]
}

export const TOOL_LIBRARY_RECOVERY_KEYWORD = 'full-tool-library-baseline'

const tool = (id: string, label: string, icon: ToolLibraryIcon): ToolLibraryToolItem => ({
  id,
  label,
  icon,
  itemType: 'tool',
})

const agentTemplate = (
  id: string,
  label: string,
  description: string,
  nodeIcon: AgentTemplateNodeIcon,
  color: string,
): ToolLibraryAgentTemplateItem => ({
  id,
  label,
  icon: 'agent',
  itemType: 'agent-template',
  description,
  nodeIcon,
  color,
})

export const FULL_TOOL_LIBRARY_CATEGORIES: ToolLibraryCategory[] = [
  {
    id: 'tools',
    title: '工具',
    sections: [
      {
        id: 'ai-ml',
        title: 'AI 与机器学习',
        items: [
          tool('model-routing', '模型路由', 'route'),
          tool('vector-embed', '向量嵌入', 'embed'),
          tool('eval-framework', '评测框架', 'eval'),
        ],
      },
      {
        id: 'automation',
        title: '自动化与集成',
        items: [
          tool('webhook-listener', 'Webhook 侦听', 'webhook'),
          tool('queue-runner', '队列执行器', 'queue'),
          tool('retry-policy', '重试策略', 'retry'),
        ],
      },
      {
        id: 'data',
        title: '数据库与数据',
        items: [
          tool('sql-query', 'SQL 查询器', 'sql'),
          tool('vector-index', '向量索引', 'memory'),
          tool('cache-kv', '缓存 / KV', 'memory'),
        ],
      },
      {
        id: 'files',
        title: '文件与文档',
        items: [
          tool('pdf-parse', 'PDF 解析', 'pdf'),
          tool('ocr', 'OCR 流式抽取', 'ocr'),
          tool('structured-output', '结构化产出', 'extract'),
        ],
      },
      {
        id: 'universal',
        title: '万能节点',
        items: [
          tool('google-file', 'Google 文件', 'pdf'),
          tool('slack', 'Slack', 'slack'),
          tool('if-branch', 'If 分支', 'route'),
          tool('split-block', '分片', 'extract'),
        ],
      },
      {
        id: 'mcp',
        title: 'MCP 服务器',
        items: [
          tool('feishu-mcp', '飞书助手 MCP', 'agent'),
          tool('database-mcp', '数据库 MCP', 'sql'),
          tool('crm-mcp', 'CRM MCP', 'browser'),
        ],
      },
      {
        id: 'web-browser',
        title: '网页抓取与浏览',
        items: [
          tool('headless-browser', '无头抓取', 'browser'),
          tool('dom-crawl', 'DOM 抽取', 'dom'),
          tool('rate-limit', '限流器', 'rate-limit'),
        ],
      },
      {
        id: 'research',
        title: '搜索式研究',
        items: [
          tool('web-search', '网页搜索', 'search'),
          tool('paper-search', '内容深挖', 'research'),
        ],
      },
      {
        id: 'misc',
        title: '未分类',
        items: [
          tool('generic-tool', '通用工具', 'http'),
        ],
      },
      {
        id: 'skills',
        title: 'Available Skills',
        items: [
          tool('skill-onboarding', '入职办理引导技能', 'agent'),
          tool('skill-hr', 'HR 开通协调技能', 'agent'),
          tool('skill-notify', '通知与状态跟踪技能', 'agent'),
        ],
      },
    ],
  },
  {
    id: 'agent-library',
    title: '智能体仓库',
    items: [
      agentTemplate(
        'approval-agent',
        '入职审批执行智能体',
        '负责审批流转、材料核验和入职前置条件确认。',
        'brain',
        '#6f63ff',
      ),
      agentTemplate(
        'it-agent',
        'IT 开通协调智能体',
        '负责账号、基础权限、设备准备和系统接入协同。',
        'monitor',
        '#2f80ff',
      ),
      agentTemplate(
        'hr-agent',
        'HR 文档处理智能体',
        '负责员工资料收集、合同归档和入职文档处理。',
        'file',
        '#f59e0b',
      ),
      agentTemplate(
        'reminder-agent',
        '通知与跟进智能体',
        '负责状态提醒、异常升级和关键节点通知同步。',
        'bell',
        '#ef4444',
      ),
    ],
  },
]

export const TOOL_LIBRARY_CATEGORIES: ToolLibraryCategory[] = [
  {
    id: 'tools',
    title: '工具',
    sections: [
      {
        id: 'documents',
        title: '文件与文档',
        items: [
          tool('pdf-parse', 'PDF 解析', 'pdf'),
          tool('google-docs', 'Google Docs', 'google-docs'),
          tool('google-sheets', 'Google Sheets', 'google-sheets'),
        ],
      },
      {
        id: 'collaboration',
        title: '沟通与协作',
        items: [
          tool('slack', 'Slack', 'slack'),
          tool('teams', 'Teams', 'teams'),
          tool('gmail', 'Gmail', 'gmail'),
        ],
      },
    ],
  },
  FULL_TOOL_LIBRARY_CATEGORIES.find((category) => category.id === 'agent-library')!,
]
