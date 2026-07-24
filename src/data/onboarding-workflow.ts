import type { ToolLibraryIcon } from './tool-library'

export type OnboardingWorkspaceTab = 'workflow' | 'interfaces' | 'analytics' | 'messages' | 'evaluator'

export type OnboardingNodeIcon =
  | 'brain'
  | 'monitor'
  | 'file'
  | 'key'
  | 'bell'
  | 'sparkles'
  | 'user-input'
  | 'orchestrator'
  | 'loop'
  | 'subflow'

export type OnboardingNodeKind =
  | 'main-agent'
  | 'agent'
  | 'trigger'
  | 'manual-input'
  | 'orchestrator'
  | 'router'
  | 'loop'
  | 'subflow'

export type OnboardingCanvasLeftPanelMode =
  | 'ai-thoughts'
  | 'main-agent-settings'
  | 'child-agent-settings'
  | 'trigger-settings'
  | 'manual-input-settings'
  | 'orchestrator-settings'
  | 'router-settings'
  | 'loop-settings'
  | 'subflow-settings'
  | 'edge-settings'

export type ManagerAgentRow = {
  id: string
  agentName: string
  usage: string
  source: 'agent' | 'a2a'
}

export type MainAgentFormState = {
  role: string
  goal: string
  description: string
  isManagerAgent: boolean
  areChildAgentsCollapsed: boolean
  taskConfigEnabled: boolean
  scheduledTasks: AgentScheduledTask[]
  provider: string
  model: string
  temperatureUseProviderDefault: boolean
  temperature: number
  maxTokens: string
  reasoningEnabled: boolean
  maxReasoningAttempts: string
  allowDelegation: boolean
  maxIterations: string
  maxRpm: string
  maxExecutionTimeSeconds: string
  responseSchemaProperties: string[]
}

export type TriggerOption = {
  id: string
  label: string
  tone: string
}

export type TriggerNodeConfig = {
  selectedTriggerId: string | null
  dedupStrategy: string
  conditionSummary: string
}

export type ManualInputType = 'short-text' | 'long-text' | 'single-select'

export type ManualInputNodeConfig = {
  promptLabel: string
  inputType: ManualInputType
  required: boolean
  placeholder: string
}

export type RouterModelId = 'claude-opus-4.1' | 'gpt-4.1' | 'gemini-2.5-pro' | 'deepseek-v3'
export type RouterConditionType = 'llm-based' | 'rule-based'

export type RouterBranchCondition = {
  id: string
  edgeId: string
  targetNodeId: string
  label: string
  icon: OnboardingNodeIcon
  conditionType: RouterConditionType
  prompt: string
  rules: string[]
}

export type RouterNodeConfig = {
  modelId: RouterModelId
}

export type OrchestratorNodeConfig = {
  strategy: string
  executionMode: string
  maxConcurrency: number
  failurePolicy: string
}

export type LoopNodeConfig = {
  source: string
  maxIterations: number
  stopCondition: string
  outputMode: string
}

export type SubflowNodeConfig = {
  flowName: string
  inputBinding: string
  returnMode: string
  fallbackAction: string
}

export type AgentToolAssignment = {
  id: string
  label: string
  icon: ToolLibraryIcon
}

export type AgentScheduleUnit = 'second' | 'hour' | 'day' | 'month'

export type AgentScheduledTask = {
  id: string
  name: string
  description: string
  unit: AgentScheduleUnit
  interval: number
  retryCount: number
  delayMinutes: number
  nextRunAt: string
  summary: string
  active: boolean
}

export type AgentNodeConfig = {
  role: string
  goal: string
  instructions: string
  provider: string
  model: string
  isManagerMode: boolean
  areChildAgentsCollapsed: boolean
  taskSchedulingEnabled: boolean
  scheduledTasks: AgentScheduledTask[]
  temperatureUseProviderDefault: boolean
  temperature: number
  maxTokens: string
  reasoningEnabled: boolean
  maxReasoningAttempts: string
  allowDelegation: boolean
  maxIterations: string
  maxRpm: string
  maxExecutionTimeSeconds: string
  responseSchemaProperties: string[]
}

export type OnboardingCanvasNode = {
  id: string
  kind: OnboardingNodeKind
  label: string
  description: string
  icon: OnboardingNodeIcon
  color: string
  position: { x: number; y: number }
  tools?: AgentToolAssignment[]
  agentSettings?: AgentNodeConfig
  trigger?: TriggerNodeConfig
  manualInput?: ManualInputNodeConfig
  orchestrator?: OrchestratorNodeConfig
  router?: RouterNodeConfig
  loop?: LoopNodeConfig
  subflow?: SubflowNodeConfig
}

export type EdgeConnectionType = 'next-step' | 'ai-connection' | 'conditional'
export type EdgeConditionType = 'rule-based'

export type OnboardingCanvasEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label: string
  connectionType: EdgeConnectionType
  conditionType: EdgeConditionType
  conditions: string[]
}

export type JoyceMessageTone = 'thinking' | 'done' | 'note'

export type JoyceMessage = {
  id: string
  tone: JoyceMessageTone
  title: string
  content: string
}

export const DEFAULT_ONBOARDING_NODE_ID = 'N1'
export const MAIN_AGENT_NODE_ID = 'N1'

export const ONBOARDING_WORKSPACE_TABS: Array<{
  id: OnboardingWorkspaceTab
  label: string
}> = [
  { id: 'workflow', label: '创建' },
  { id: 'interfaces', label: '执行' },
]

export const DEFAULT_MAIN_AGENT_FORM: MainAgentFormState = {
  role: '人力资源经理入职协调',
  goal: '统筹员工入职全流程：自动分发问题到对应流程或专业子代理，减少人工往返并保证关键节点不遗漏。',
  description:
    '协调 IT、HR 文档、设备与权限、文化通知等子流程，确保入职申请可以被拆解、跟进、汇总和闭环。',
  isManagerAgent: true,
  areChildAgentsCollapsed: false,
  taskConfigEnabled: false,
  scheduledTasks: [],
  provider: 'OpenAI',
  model: 'gpt-4.1',
  temperatureUseProviderDefault: true,
  temperature: 0.2,
  maxTokens: '',
  reasoningEnabled: false,
  maxReasoningAttempts: '',
  allowDelegation: false,
  maxIterations: '25',
  maxRpm: '',
  maxExecutionTimeSeconds: '',
  responseSchemaProperties: [],
}

export const TRIGGER_OPTIONS: TriggerOption[] = [
  { id: 'slack', label: 'Slack', tone: '#7b61ff' },
  { id: 'google-mail', label: 'Google Mail', tone: '#dc4c3f' },
  { id: 'google-calendar', label: 'Google Calendar', tone: '#2563eb' },
  { id: 'webhook', label: 'Webhook', tone: '#4b5563' },
  { id: 'recurring-schedule', label: 'Recurring Schedule', tone: '#0f766e' },
]

export const ROUTER_MODEL_OPTIONS: Array<{ id: RouterModelId; label: string; provider: string }> = [
  { id: 'claude-opus-4.1', label: 'Claude Opus 4.1', provider: 'Anthropic' },
  { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'deepseek-v3', label: 'DeepSeek V3', provider: 'DeepSeek' },
]

export const MANUAL_INPUT_TYPE_OPTIONS: Array<{ id: ManualInputType; label: string }> = [
  { id: 'short-text', label: '单行文本' },
  { id: 'long-text', label: '多行文本' },
  { id: 'single-select', label: '单选' },
]

export const ORCHESTRATOR_STRATEGY_OPTIONS = ['Sequential', 'Priority-based', 'Parallel fan-out'] as const
export const ORCHESTRATOR_EXECUTION_MODE_OPTIONS = ['Supervisor', 'Worker pool', 'Delegate'] as const
export const LOOP_OUTPUT_MODE_OPTIONS = ['Append each run', 'Keep latest only', 'Summarize at end'] as const
export const SUBFLOW_RETURN_MODE_OPTIONS = ['Return output payload', 'Return status only', 'Return payload with trace'] as const

/** 与画布 `.workflow-agent-node` 宽度一致，用于节点水平居中计算 */
export const WORKFLOW_AGENT_NODE_WIDTH = 300

/** 汇总/通知类子代理单独占位，不参与主代理下方并列行的居中计算 */
const PARALLEL_ROW_EXCLUDED_AGENT_IDS = new Set(['onb-report', 'N5'])

/**
 * 将主代理节点的 x 与当前可见的并列子代理行水平居中对齐。
 * 在按名称隐藏部分子代理后，避免主代理仍停留在「满列」时的旧坐标。
 */
export function centerMainAgentOverParallelRow(
  nodes: OnboardingCanvasNode[],
  nodeWidth: number = WORKFLOW_AGENT_NODE_WIDTH,
): OnboardingCanvasNode[] {
  const main = nodes.find((node) => node.kind === 'main-agent')
  if (!main) return nodes

  const parallelRowAgents = nodes.filter(
    (node) => node.kind === 'agent' && !PARALLEL_ROW_EXCLUDED_AGENT_IDS.has(node.id),
  )
  if (parallelRowAgents.length === 0) return nodes

  const minX = Math.min(...parallelRowAgents.map((node) => node.position.x))
  const maxX = Math.max(...parallelRowAgents.map((node) => node.position.x))
  const rowCenterX = minX + (maxX - minX + nodeWidth) / 2
  const mainX = Math.round(rowCenterX - nodeWidth / 2)

  return nodes.map((node) =>
    node.kind === 'main-agent' ? { ...node, position: { ...node.position, x: mainX } } : node,
  )
}

const CARD_WIDTH = 272
const GAP_X = 68
const GAP_Y = 86
const SECOND_ROW_Y = 222
const THIRD_ROW_Y = SECOND_ROW_Y + 230 + GAP_Y

const LEFT_BRANCH_X = 42
const IT_NODE_X = LEFT_BRANCH_X
const HR_NODE_X = IT_NODE_X + CARD_WIDTH + GAP_X
const ACCESS_NODE_X = HR_NODE_X + CARD_WIDTH + GAP_X
const CANVAS_CENTER_X = IT_NODE_X + (ACCESS_NODE_X + CARD_WIDTH - IT_NODE_X) / 2
const TOP_AND_BOTTOM_X = Math.round(CANVAS_CENTER_X - CARD_WIDTH / 2)

export function buildInitialNodes(managerName: string, managerAgents: ManagerAgentRow[]): OnboardingCanvasNode[] {
  const usefulRows = managerAgents.filter((item) => item.agentName.trim())
  const secondRow = [
    {
      id: 'N2',
      fallbackName: 'IT 开通协调 Agent',
      fallbackDesc: '准备账号、应用、凭据和系统权限开通。',
      icon: 'monitor' as const,
      color: '#2f80ff',
      position: { x: IT_NODE_X, y: SECOND_ROW_Y },
    },
    {
      id: 'N3',
      fallbackName: 'HR 文档处理 Agent',
      fallbackDesc: '收集表单、薪资和福利相关资料。',
      icon: 'file' as const,
      color: '#f59e0b',
      position: { x: HR_NODE_X, y: SECOND_ROW_Y },
    },
    {
      id: 'N4',
      fallbackName: '设备与权限开通 Agent',
      fallbackDesc: '安排工牌、硬件、工位和访问权限。',
      icon: 'key' as const,
      color: '#8b5cf6',
      position: { x: ACCESS_NODE_X, y: SECOND_ROW_Y },
    },
  ]

  return [
    {
      id: 'N1',
      kind: 'main-agent',
      label: managerName || '人力资源部经理Agent',
      description: '识别入职申请内容，并将任务并行分发到合适的团队。',
      icon: 'brain',
      color: '#6f63ff',
      position: { x: TOP_AND_BOTTOM_X, y: 44 },
    },
    ...secondRow.map((row, index) => ({
      id: row.id,
      kind: 'agent' as const,
      label: usefulRows[index]?.agentName || row.fallbackName,
      description: usefulRows[index]?.usage || row.fallbackDesc,
      icon: row.icon,
      color: row.color,
      position: row.position,
    })),
    {
      id: 'N5',
      kind: 'agent',
      label: '通知与跟进 Agent',
      description: '汇总进度、同步风险，并向相关人员发送通知。',
      icon: 'bell',
      color: '#ef4444',
      position: { x: TOP_AND_BOTTOM_X, y: THIRD_ROW_Y },
    },
  ]
}

export function buildInitialEdges(): OnboardingCanvasEdge[] {
  return [
    {
      id: 'e1-2',
      source: 'N1',
      target: 'N2',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      label: '分发 IT 开通任务',
      connectionType: 'next-step',
      conditionType: 'rule-based',
      conditions: [],
    },
    {
      id: 'e1-3',
      source: 'N1',
      target: 'N3',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      label: '分发 HR 文档任务',
      connectionType: 'next-step',
      conditionType: 'rule-based',
      conditions: [],
    },
    {
      id: 'e1-4',
      source: 'N1',
      target: 'N4',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      label: '分发设备与权限任务',
      connectionType: 'next-step',
      conditionType: 'rule-based',
      conditions: [],
    },
    {
      id: 'e2-5',
      source: 'N2',
      target: 'N5',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      label: '回传 IT 处理结果',
      connectionType: 'next-step',
      conditionType: 'rule-based',
      conditions: [],
    },
    {
      id: 'e3-5',
      source: 'N3',
      target: 'N5',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      label: '回传 HR 处理结果',
      connectionType: 'next-step',
      conditionType: 'rule-based',
      conditions: [],
    },
    {
      id: 'e4-5',
      source: 'N4',
      target: 'N5',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      label: '回传设备与权限结果',
      connectionType: 'next-step',
      conditionType: 'rule-based',
      conditions: [],
    },
  ]
}

export function buildInitialJoyceMessages(managerName: string): JoyceMessage[] {
  return [
    {
      id: 'joyce-1',
      tone: 'thinking',
      title: 'Joyce AI',
      content: `我已经根据 ${managerName} 的配置装载了 onboarding workflow 的基础骨架，当前开始进入可编辑工作台阶段。`,
    },
    {
      id: 'joyce-2',
      tone: 'done',
      title: '已同步内容',
      content: '当前支持在画布里继续编辑节点、边、Trigger、Router，以及通过 + New 增加新步骤。',
    },
    {
      id: 'joyce-3',
      tone: 'note',
      title: '当前状态',
      content: '点击节点、边或画布空白区域时，左侧配置区会切换到相应面板，右侧 Joyce 会保持同一工作区上下文。',
    },
  ]
}
