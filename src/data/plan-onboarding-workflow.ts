/**
 * 与首页 Plan Mode「新员工入职」采集思路对齐的默认画布骨架：
 * 入职管家 → 四类专业子代理 → 汇总报告。
 */
import {
  WORKFLOW_AGENT_NODE_WIDTH,
  centerMainAgentOverParallelRow,
  type JoyceMessage,
  type OnboardingCanvasEdge,
  type OnboardingCanvasNode,
} from './onboarding-workflow'

export type OnboardingWorkflowPreset = 'default' | 'plan-onboarding'

const CARD_W = WORKFLOW_AGENT_NODE_WIDTH
const GAP_X = 34
const PARALLEL_ROW_WIDTH = 4 * CARD_W + 3 * GAP_X
const PARALLEL_START_X = 126
/** 主代理与下方四列子代理共用同一水平中心线 */
const MAIN_X = Math.round(PARALLEL_START_X + PARALLEL_ROW_WIDTH / 2 - CARD_W / 2)
const PARALLEL_XS = [
  PARALLEL_START_X,
  PARALLEL_START_X + CARD_W + GAP_X,
  PARALLEL_START_X + 2 * (CARD_W + GAP_X),
  PARALLEL_START_X + 3 * (CARD_W + GAP_X),
] as const
const REPORT_X = PARALLEL_XS[3] + CARD_W + 82
const MAIN_AGENT_Y = 64
const PARALLEL_ROW_Y = 474
const REPORT_Y = PARALLEL_ROW_Y

const PARALLEL_DEFAULTS: Array<{ fallbackName: string; fallbackDesc: string; icon: OnboardingCanvasNode['icon']; color: string }> = [
  {
    fallbackName: 'HR 文档处理Agent',
    fallbackDesc: '负责收集入职表单、证件与合同资料，并校验关键信息是否完整。',
    icon: 'file',
    color: '#f59e0b',
  },
  {
    fallbackName: 'IT 开通协调Agent',
    fallbackDesc: '负责开通账号、系统权限与常用应用，并同步必要的使用说明。',
    icon: 'monitor',
    color: '#2f80ff',
  },
  {
    fallbackName: '设备与权限开通Agent',
    fallbackDesc: '负责安排设备、工牌与访问权限，确保入职前的资源准备到位。',
    icon: 'sparkles',
    color: '#8b5cf6',
  },
  {
    fallbackName: '企业文化宣讲Agent',
    fallbackDesc: '负责企业文化介绍、制度讲解与培训引导，帮助新人快速融入团队。',
    icon: 'key',
    color: '#0d9488',
  },
]

export function buildPlanModeOnboardingNodes(
  managerName: string,
): OnboardingCanvasNode[] {
  const mainLabel = managerName.trim() || '新员工入职管家 (Onboarding Concierge)'

  const parallelNodes: OnboardingCanvasNode[] = PARALLEL_DEFAULTS.map((row, i) => ({
    id: `onb-a${i + 1}`,
    kind: 'agent',
    label: row.fallbackName,
    description: row.fallbackDesc,
    icon: row.icon,
    color: row.color,
    position: { x: PARALLEL_XS[i] ?? 42, y: PARALLEL_ROW_Y },
  }))

  return centerMainAgentOverParallelRow([
    {
      id: 'onb-main',
      kind: 'main-agent',
      label: mainLabel,
      description: '统筹入职对话与任务分派，对齐 Plan 采集结果并驱动下游子代理。',
      icon: 'brain',
      color: '#6f63ff',
      position: { x: MAIN_X, y: MAIN_AGENT_Y },
    },
    ...parallelNodes,
    {
      id: 'onb-report',
      kind: 'agent',
      label: '通知与跟进Agent',
      description: '负责汇总整体进度、发送关键通知，并持续跟进入职过程中的异常事项。',
      icon: 'bell',
      color: '#ef4444',
      position: { x: REPORT_X, y: REPORT_Y },
    },
  ])
}

export function buildPlanModeOnboardingEdges(): OnboardingCanvasEdge[] {
  const fanOut: OnboardingCanvasEdge[] = [1, 2, 3, 4].map((n) => ({
    id: `onb-e-orch-a${n}`,
    source: 'onb-main',
    target: `onb-a${n}`,
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: `分派支线 ${n}`,
    connectionType: 'next-step',
    conditionType: 'rule-based',
    conditions: [],
  }))

  const reportConnection: OnboardingCanvasEdge = {
    id: 'onb-e-orch-report',
    source: 'onb-main',
    target: 'onb-report',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: '分派支线 5',
    connectionType: 'next-step',
    conditionType: 'rule-based',
    conditions: [],
  }

  return [...fanOut, reportConnection]
}

export function buildPlanModeJoyceMessages(managerName: string): JoyceMessage[] {
  const name = managerName.trim() || '新员工入职管家'
  return [
    {
      id: 'joyce-plan-1',
      tone: 'thinking',
      title: 'Joyce AI',
      content: `已根据「${name}」生成默认画布：入职管家 → 四类专业子代理 → 汇总闭环。`,
    },
    {
      id: 'joyce-plan-2',
      tone: 'done',
      title: '与首页流程的对应关系',
      content:
        '上方保留流程启动与入职管家两个核心节点；下方四类专业子代理分别承接资料、IT、培训/文化与办公物品，最后统一汇总报告。',
    },
    {
      id: 'joyce-plan-3',
      tone: 'note',
      title: '下一步',
      content: '可在画布上继续增删改连线，或通过左侧配置 Trigger、人工输入与各子代理的说明与工具。',
    },
  ]
}
