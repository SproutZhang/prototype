import type { OnboardingNodeIcon } from './onboarding-workflow'

export type NewStepTypeId =
  | 'trigger'
  | 'manual-input'
  | 'agent'
  | 'orchestrator'
  | 'router'
  | 'loop'
  | 'subflow'

export type NewStepTypeItem = {
  id: NewStepTypeId
  label: string
  subtitle: string
  hint: string
  accent: string
  icon: OnboardingNodeIcon
}

export const NEW_STEP_TYPES: NewStepTypeItem[] = [
  {
    id: 'trigger',
    label: '触发器',
    subtitle: '添加一个新的流程启动入口',
    hint: '用于让流程由 Slack、Mail、Webhook 或定时计划触发。',
    accent: '#0f766e',
    icon: 'bell',
  },
  {
    id: 'manual-input',
    label: '人工输入',
    subtitle: '等待用户补充输入后继续执行',
    hint: '用于在流程中插入人工确认、填写或补录信息的节点。',
    accent: '#9333ea',
    icon: 'user-input',
  },
  {
    id: 'agent',
    label: '智能体',
    subtitle: '添加一个可执行任务的 Agent 节点',
    hint: '用于新增一个负责处理具体任务的智能体节点。',
    accent: '#16a34a',
    icon: 'brain',
  },
  {
    id: 'orchestrator',
    label: '编排器-执行器',
    subtitle: '协调多个执行分支与任务分派',
    hint: '用于统一编排下游节点执行顺序、并发与失败策略。',
    accent: '#0f766e',
    icon: 'orchestrator',
  },
  {
    id: 'router',
    label: '路由器',
    subtitle: '按条件把任务分发到不同分支',
    hint: '用于基于规则或 LLM 判断，把上下文导向不同下游节点。',
    accent: '#64748b',
    icon: 'key',
  },
  {
    id: 'loop',
    label: '循环',
    subtitle: '按条件重复处理直到满足退出条件',
    hint: '用于对同一任务或同一批数据进行迭代执行。',
    accent: '#0ea5a4',
    icon: 'loop',
  },
  {
    id: 'subflow',
    label: '子流程',
    subtitle: '调用一个可复用的流程块',
    hint: '用于把复杂步骤收敛成可复用的子工作流节点。',
    accent: '#3b82f6',
    icon: 'subflow',
  },
]
