import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Connection, Edge, Node, XYPosition } from 'reactflow'
import type { ManagerialAdvancedConfig } from '../../types/agent'

import type { NewStepTypeId } from '../../data/new-step-types'
import type { ToolLibraryAgentTemplateItem } from '../../data/tool-library'
import {
  type AgentToolAssignment,
  DEFAULT_MAIN_AGENT_FORM,
  buildInitialEdges,
  buildInitialJoyceMessages,
  buildInitialNodes,
  centerMainAgentOverParallelRow,
  type EdgeConnectionType,
  type JoyceMessage,
  type ManagerAgentRow,
  type MainAgentFormState,
  type OnboardingCanvasEdge,
  type OnboardingCanvasLeftPanelMode,
  type OnboardingCanvasNode,
  type OnboardingWorkspaceTab,
  type RouterBranchCondition,
  type RouterConditionType,
  type RouterModelId,
} from '../../data/onboarding-workflow'
import {
  buildPlanModeJoyceMessages,
  buildPlanModeOnboardingEdges,
  buildPlanModeOnboardingNodes,
  type OnboardingWorkflowPreset,
} from '../../data/plan-onboarding-workflow'
import { NEW_STEP_TYPES } from '../../data/new-step-types'

export type WorkflowRenderNodeData = OnboardingCanvasNode
export type WorkflowRenderEdgeData = OnboardingCanvasEdge

export type WorkflowRenderNode = Node<WorkflowRenderNodeData>
export type WorkflowRenderEdge = Edge<WorkflowRenderEdgeData>

type UseOnboardingWorkflowStateArgs = {
  managerName: string
  modelConfig: string
  instructions: string
  generatedPrompt: string
  managerAgents: ManagerAgentRow[]
  advancedConfig?: ManagerialAdvancedConfig
  hiddenAgentNames?: string[]
  /** 与首页 Plan「新员工入职」采集链对齐的画布骨架 */
  workflowPreset?: OnboardingWorkflowPreset
}

const nextNodePlacementByType: Record<NewStepTypeId, { x: number; yOffset: number }> = {
  trigger: { x: 64, yOffset: 150 },
  'manual-input': { x: 220, yOffset: 138 },
  agent: { x: 390, yOffset: 150 },
  orchestrator: { x: 548, yOffset: 156 },
  router: { x: 720, yOffset: 150 },
  loop: { x: 876, yOffset: 164 },
  subflow: { x: 1032, yOffset: 172 },
}

function createNodeId(stepId: NewStepTypeId, count: number) {
  return `${stepId}-${count + 1}`
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createScheduleTaskId() {
  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function createEdgeId() {
  return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createLibraryAgentNodeId() {
  return `agent-library-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  )
}

function colorForStep(stepId: NewStepTypeId) {
  return NEW_STEP_TYPES.find((item) => item.id === stepId)?.accent ?? '#64748b'
}

function nodeKindFromStep(stepId: NewStepTypeId): OnboardingCanvasNode['kind'] {
  if (stepId === 'trigger') return 'trigger'
  if (stepId === 'manual-input') return 'manual-input'
  if (stepId === 'orchestrator') return 'orchestrator'
  if (stepId === 'router') return 'router'
  if (stepId === 'loop') return 'loop'
  if (stepId === 'subflow') return 'subflow'
  return 'agent'
}

function buildNodeDescription(stepId: NewStepTypeId) {
  if (stepId === 'trigger') return '等待外部事件、Webhook 或定时任务来启动工作流。'
  if (stepId === 'manual-input') return '在关键节点等待用户补充资料、审批意见或人工确认后再继续。'
  if (stepId === 'orchestrator') return '负责统筹多个执行节点，控制任务分派、并发和失败回退策略。'
  if (stepId === 'router') return '基于规则或模型判断，将上下文路由到不同下游分支。'
  if (stepId === 'loop') return '按设定条件重复执行，直到达到迭代上限或满足退出条件。'
  if (stepId === 'subflow') return '调用一个可复用的子流程，把复杂任务收敛成独立流程块。'
  return '负责承接一个具体的子任务执行步骤。'
}

export type AgentTaskDescriptionKind = 'manager' | 'worker'

export function buildAgentTaskDescription(
  role: string,
  goal: string,
  kind: AgentTaskDescriptionKind = 'worker',
) {
  const normalizedGoal =
    goal.trim() ||
    (kind === 'manager'
      ? '统筹多个子智能体，协调任务分派、进度跟踪与结果汇总。'
      : '负责当前节点的核心任务执行与结果回传。')

  if (kind === 'manager') {
    return [
      `1. ${normalizedGoal}`,
      '2. 根据任务类型将工作分派给最合适的子智能体。',
      '3. 汇总各子智能体结果并输出统一结论。',
    ].join('\n')
  }

  return [
    `1. ${normalizedGoal}`,
    '2. 围绕当前节点职责处理输入信息，并识别关键阻塞点。',
    '3. 输出清晰、结构化的结果，便于下游节点继续接力。',
  ].join('\n')
}

function buildDefaultAgentSettings(role: string, goal: string) {
  return {
    role,
    goal,
    instructions: buildAgentTaskDescription(role, goal),
    provider: 'OpenAI',
    model: 'gpt-4.1',
    isManagerMode: true,
    areChildAgentsCollapsed: false,
    taskSchedulingEnabled: false,
    scheduledTasks: [],
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
}

function buildPanelMode(kind: OnboardingCanvasNode['kind']): OnboardingCanvasLeftPanelMode {
  if (kind === 'main-agent') return 'main-agent-settings'
  if (kind === 'trigger') return 'trigger-settings'
  if (kind === 'manual-input') return 'manual-input-settings'
  if (kind === 'orchestrator') return 'orchestrator-settings'
  if (kind === 'router') return 'router-settings'
  if (kind === 'loop') return 'loop-settings'
  if (kind === 'subflow') return 'subflow-settings'
  return 'child-agent-settings'
}

function toRenderNode(node: OnboardingCanvasNode): WorkflowRenderNode {
  return {
    id: node.id,
    type: 'agentCard',
    position: node.position,
    data: node,
  }
}

function toRenderEdge(edge: OnboardingCanvasEdge): WorkflowRenderEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    data: edge,
  }
}

function buildNodeConfig(stepId: NewStepTypeId) {
  if (stepId === 'trigger') {
    return {
      trigger: {
        selectedTriggerId: 'slack',
        dedupStrategy: 'Skip duplicate sender within 10m',
        conditionSummary: '当收到 onboarding 申请或入职任务消息时启动。',
      },
    }
  }
  if (stepId === 'manual-input') {
    return {
      manualInput: {
        promptLabel: '请补充入职申请备注',
        inputType: 'long-text' as const,
        required: true,
        placeholder: '例如：补充员工部门、地点、入职日期等说明',
      },
    }
  }
  if (stepId === 'agent') {
    return {
      agentSettings: {
        role: '人力资源入职协调 Agent',
        goal: '统筹员工入职全流程：自动分发问题到对应专业子代理，并减少人工往返与状态遗漏。',
        instructions: buildAgentTaskDescription(
          '人力资源入职协调 Agent',
          '统筹员工入职全流程：自动分发问题到对应专业子代理，并减少人工往返与状态遗漏。',
          'manager',
        ),
        provider: 'OpenAI',
        model: 'gpt-4.1',
        isManagerMode: true,
        areChildAgentsCollapsed: false,
        taskSchedulingEnabled: false,
        scheduledTasks: [
          {
            id: createScheduleTaskId(),
            name: '巡检子代理延迟与入职准备清单',
            description: '扫描各子代理队列与节点状态，提醒未完成节点。',
            unit: 'hour' as const,
            interval: 3,
            retryCount: 2,
            delayMinutes: 15,
            nextRunAt: '2026-04-17 10:43',
            summary: '定期巡检账户、设备与培训节点。',
            active: true,
          },
          {
            id: createScheduleTaskId(),
            name: '提醒回收入职文档与 IT 开通',
            description: '周期性检查文档回收与异常工单。',
            unit: 'day' as const,
            interval: 7,
            retryCount: 3,
            delayMinutes: 0,
            nextRunAt: '2026-04-17 10:43',
            summary: '定期检查文档回收与异常工单。',
            active: true,
          },
        ],
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
      },
    }
  }
  if (stepId === 'orchestrator') {
    return {
      orchestrator: {
        strategy: 'Priority-based',
        executionMode: 'Supervisor',
        maxConcurrency: 3,
        failurePolicy: 'Pause and escalate to operator',
      },
    }
  }
  if (stepId === 'router') {
    return {
      router: {
        modelId: 'claude-opus-4.1' as RouterModelId,
      },
    }
  }
  if (stepId === 'loop') {
    return {
      loop: {
        source: '候选员工列表',
        maxIterations: 5,
        stopCondition: '全部员工资料完整或达到最大轮次',
        outputMode: 'Summarize at end',
      },
    }
  }
  if (stepId === 'subflow') {
    return {
      subflow: {
        flowName: '新员工账号开通子流程',
        inputBinding: 'employeeProfile -> onboardingPayload',
        returnMode: 'Return payload with trace',
        fallbackAction: '调用失败时回退到人工处理队列',
      },
    }
  }
  return {}
}

function initialGraph(
  preset: OnboardingWorkflowPreset | undefined,
  managerName: string,
  managerAgents: ManagerAgentRow[],
  hiddenAgentNames: string[] = [],
): { nodes: WorkflowRenderNode[]; edges: WorkflowRenderEdge[]; messages: JoyceMessage[] } {
  const hiddenAgentNameSet = new Set(hiddenAgentNames.filter(Boolean))
  const filterGraph = (nodes: OnboardingCanvasNode[], edges: OnboardingCanvasEdge[]) => {
    if (hiddenAgentNameSet.size === 0) return { nodes, edges }
    const hiddenNodeIds = new Set(nodes.filter((node) => hiddenAgentNameSet.has(node.label)).map((node) => node.id))
    return {
      nodes: nodes.filter((node) => !hiddenNodeIds.has(node.id)),
      edges: edges.filter((edge) => !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target)),
    }
  }

  if (preset === 'plan-onboarding') {
    const graph = filterGraph(buildPlanModeOnboardingNodes(managerName), buildPlanModeOnboardingEdges())
    return {
      nodes: centerMainAgentOverParallelRow(graph.nodes).map(toRenderNode),
      edges: graph.edges.map(toRenderEdge),
      messages: buildPlanModeJoyceMessages(managerName),
    }
  }
  const graph = filterGraph(buildInitialNodes(managerName, managerAgents), buildInitialEdges())
  return {
    nodes: centerMainAgentOverParallelRow(graph.nodes).map(toRenderNode),
    edges: graph.edges.map(toRenderEdge),
    messages: buildInitialJoyceMessages(managerName),
  }
}

export function useOnboardingWorkflowState({
  managerName,
  modelConfig,
  instructions,
  generatedPrompt,
  managerAgents,
  advancedConfig,
  hiddenAgentNames = [],
  workflowPreset = 'default',
}: UseOnboardingWorkflowStateArgs) {
  const [activeTab, setActiveTab] = useState<OnboardingWorkspaceTab>('workflow')
  const [isJoyceCollapsed, setIsJoyceCollapsed] = useState(true)
  const [nodes, setNodes] = useState<WorkflowRenderNode[]>(() =>
    initialGraph(workflowPreset, managerName, managerAgents, hiddenAgentNames).nodes,
  )
  const [edges, setEdges] = useState<WorkflowRenderEdge[]>(() =>
    initialGraph(workflowPreset, managerName, managerAgents, hiddenAgentNames).edges,
  )
  const [messages, setMessages] = useState<JoyceMessage[]>(() =>
    initialGraph(workflowPreset, managerName, managerAgents, hiddenAgentNames).messages,
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [leftPanelMode, setLeftPanelMode] = useState<OnboardingCanvasLeftPanelMode>('ai-thoughts')
  const [isNewStepPanelOpen, setIsNewStepPanelOpen] = useState(false)
  const [mainAgentForm, setMainAgentForm] = useState<MainAgentFormState>(() => ({
    ...DEFAULT_MAIN_AGENT_FORM,
    role: managerName || DEFAULT_MAIN_AGENT_FORM.role,
    goal: instructions || DEFAULT_MAIN_AGENT_FORM.goal,
    description: buildAgentTaskDescription(
      managerName || DEFAULT_MAIN_AGENT_FORM.role,
      instructions || DEFAULT_MAIN_AGENT_FORM.goal,
      'manager',
    ),
    model: modelConfig || DEFAULT_MAIN_AGENT_FORM.model,
    temperatureUseProviderDefault: advancedConfig?.useProviderDefaults ?? DEFAULT_MAIN_AGENT_FORM.temperatureUseProviderDefault,
    temperature: advancedConfig?.temperature ?? DEFAULT_MAIN_AGENT_FORM.temperature,
    maxTokens: advancedConfig?.maxTokens ? String(advancedConfig.maxTokens) : DEFAULT_MAIN_AGENT_FORM.maxTokens,
    reasoningEnabled: advancedConfig?.reasoningEnabled ?? DEFAULT_MAIN_AGENT_FORM.reasoningEnabled,
    maxReasoningAttempts: advancedConfig?.maxReasoningAttempts
      ? String(advancedConfig.maxReasoningAttempts)
      : DEFAULT_MAIN_AGENT_FORM.maxReasoningAttempts,
    allowDelegation: advancedConfig?.allowDelegation ?? DEFAULT_MAIN_AGENT_FORM.allowDelegation,
    maxIterations: advancedConfig?.maxIterations ? String(advancedConfig.maxIterations) : DEFAULT_MAIN_AGENT_FORM.maxIterations,
    maxRpm: advancedConfig?.maxRpm ? String(advancedConfig.maxRpm) : DEFAULT_MAIN_AGENT_FORM.maxRpm,
    maxExecutionTimeSeconds: advancedConfig?.maxExecutionTime
      ? String(advancedConfig.maxExecutionTime)
      : DEFAULT_MAIN_AGENT_FORM.maxExecutionTimeSeconds,
    responseSchemaProperties:
      advancedConfig?.structuredOutputEnabled && advancedConfig.structuredOutputProperties.length > 0
        ? advancedConfig.structuredOutputProperties.map((item) => item.key).filter(Boolean)
        : DEFAULT_MAIN_AGENT_FORM.responseSchemaProperties,
  }))

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId],
  )
  const selectedEdge = useMemo(
    () => (selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) ?? null : null),
    [edges, selectedEdgeId],
  )

  const appendJoyceMessage = useCallback((message: JoyceMessage) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.content === message.content) return prev
      return [...prev, message]
    })
  }, [])

  const openJoycePanel = useCallback(() => {
    setIsJoyceCollapsed(false)
  }, [])

  const toggleJoyceCollapsed = useCallback(() => {
    setIsJoyceCollapsed((prev) => !prev)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setLeftPanelMode('ai-thoughts')
    setIsNewStepPanelOpen(false)
  }, [])

  const closeLeftPanel = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const selectNode = useCallback(
    (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId)
      if (!target) return
      setSelectedEdgeId(null)
      setSelectedNodeId(nodeId)
      setLeftPanelMode(buildPanelMode(target.data.kind))
      setIsJoyceCollapsed(false)
      appendJoyceMessage({
        id: createMessageId('joyce-context'),
        tone: 'note',
        title: '画布联动',
        content: `已选中 ${target.data.label}，左侧已切换到对应配置面板。`,
      })
    },
    [appendJoyceMessage, nodes],
  )

  const selectEdge = useCallback(
    (edgeId: string) => {
      const target = edges.find((edge) => edge.id === edgeId)
      if (!target) return
      setSelectedNodeId(null)
      setSelectedEdgeId(edgeId)
      setLeftPanelMode('edge-settings')
      setIsJoyceCollapsed(false)
      appendJoyceMessage({
        id: createMessageId('joyce-edge'),
        tone: 'note',
        title: '画布联动',
        content: `已选中连线 ${target.data?.label || `${target.source} -> ${target.target}`}，左侧已切换到边配置面板。`,
      })
    },
    [appendJoyceMessage, edges],
  )

  const updateNodePosition = useCallback((nodeId: string, position: XYPosition) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position,
              data: {
                ...node.data,
                position,
              },
            }
          : node,
      ),
    )
  }, [])

  const updateNode = useCallback((nodeId: string, updater: (node: OnboardingCanvasNode) => OnboardingCanvasNode) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: updater(node.data),
            }
          : node,
      ),
    )
  }, [])

  const attachToolToAgent = useCallback(
    (nodeId: string, tool: AgentToolAssignment) => {
      updateNode(nodeId, (node) => {
        if (node.kind !== 'agent') return node
        if (node.tools?.some((item) => item.id === tool.id)) return node
        return {
          ...node,
          tools: [...(node.tools ?? []), tool],
        }
      })
    },
    [updateNode],
  )

  const createAgentNodeFromLibraryItem = useCallback(
    (item: ToolLibraryAgentTemplateItem, position: XYPosition) => {
      const nextNode: OnboardingCanvasNode = {
        id: createLibraryAgentNodeId(),
        kind: 'agent',
        label: item.label,
        description: item.description,
        icon: item.nodeIcon,
        color: item.color,
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y),
        },
        agentSettings: buildDefaultAgentSettings(item.label, item.description),
      }

      setNodes((prev) => [...prev, toRenderNode(nextNode)])
      setSelectedEdgeId(null)
      setSelectedNodeId(nextNode.id)
      setLeftPanelMode('child-agent-settings')
      setIsJoyceCollapsed(false)
      appendJoyceMessage({
        id: createMessageId('joyce-library-agent'),
        tone: 'done',
        title: '已创建智能体节点',
        content: `${item.label} 已加入画布，可继续配置职责、模型与工具。`,
      })
    },
    [appendJoyceMessage],
  )

  const updateEdge = useCallback((edgeId: string, updater: (edge: OnboardingCanvasEdge) => OnboardingCanvasEdge) => {
    setEdges((prev) =>
      prev.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: updater(edge.data as OnboardingCanvasEdge),
            }
          : edge,
      ),
    )
  }, [])

  const connectNodes = useCallback(
    (connection: Connection) => {
      const sourceId = connection.source
      const targetId = connection.target
      if (!sourceId || !targetId || sourceId === targetId) return

      const sourceNode = nodes.find((node) => node.id === sourceId)
      const targetNode = nodes.find((node) => node.id === targetId)
      if (!sourceNode || !targetNode) return

      const duplicateEdge = edges.find(
        (edge) =>
          edge.source === sourceId &&
          edge.target === targetId &&
          (edge.sourceHandle ?? 'bottom') === (connection.sourceHandle ?? 'bottom') &&
          (edge.targetHandle ?? 'top') === (connection.targetHandle ?? 'top'),
      )

      if (duplicateEdge) {
        setSelectedNodeId(null)
        setSelectedEdgeId(duplicateEdge.id)
        setLeftPanelMode('edge-settings')
        setIsJoyceCollapsed(false)
        return
      }

      const nextEdge: OnboardingCanvasEdge = {
        id: createEdgeId(),
        source: sourceId,
        target: targetId,
        sourceHandle: connection.sourceHandle ?? 'bottom',
        targetHandle: connection.targetHandle ?? 'top',
        label: `连接 ${sourceNode.data.label} -> ${targetNode.data.label}`,
        connectionType: 'next-step',
        conditionType: 'rule-based',
        conditions: [],
      }

      setEdges((prev) => [...prev, toRenderEdge(nextEdge)])
      setSelectedNodeId(null)
      setSelectedEdgeId(nextEdge.id)
      setLeftPanelMode('edge-settings')
      setIsJoyceCollapsed(false)
      appendJoyceMessage({
        id: createMessageId('joyce-connect'),
        tone: 'done',
        title: '已创建连线',
        content: `${sourceNode.data.label} 已连接到 ${targetNode.data.label}。`,
      })
    },
    [appendJoyceMessage, edges, nodes],
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((item) => item.id === nodeId)
      if (!node || node.data.kind === 'main-agent') return
      setNodes((prev) => prev.filter((item) => item.id !== nodeId))
      setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      clearSelection()
      appendJoyceMessage({
        id: createMessageId('joyce-delete'),
        tone: 'done',
        title: '节点已删除',
        content: `${node.data.label} 已从当前 workflow 中移除。`,
      })
    },
    [appendJoyceMessage, clearSelection, nodes],
  )

  useEffect(() => {
    if (!selectedNodeId) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete') return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      deleteNode(selectedNodeId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteNode, selectedNodeId])

  const addNode = useCallback(
    (stepId: NewStepTypeId) => {
      const kind = nodeKindFromStep(stepId)
      const existingCount = nodes.filter((node) => node.data.kind === kind).length
      const placement = nextNodePlacementByType[stepId]
      const maxY = nodes.reduce((max, node) => Math.max(max, node.position.y), 0)
      const config = NEW_STEP_TYPES.find((item) => item.id === stepId)
      if (!config) return

      const nextNode: OnboardingCanvasNode = {
        id: createNodeId(stepId, existingCount),
        kind,
        label: config.label,
        description: buildNodeDescription(stepId),
        icon: config.icon,
        color: colorForStep(stepId),
        position: { x: placement.x, y: maxY + placement.yOffset },
        ...buildNodeConfig(stepId),
      }

      setNodes((prev) => [...prev, toRenderNode(nextNode)])
      setSelectedEdgeId(null)
      setSelectedNodeId(nextNode.id)
      setLeftPanelMode(buildPanelMode(nextNode.kind))
      setIsJoyceCollapsed(false)
      setIsNewStepPanelOpen(false)
      appendJoyceMessage({
        id: createMessageId('joyce-new'),
        tone: 'done',
        title: '新增步骤',
        content: `已新增 ${config.label} 节点，并切换到对应的配置面板。`,
      })
    },
    [appendJoyceMessage, nodes],
  )

  const updateTriggerSelection = useCallback(
    (nodeId: string, triggerId: string) => {
      updateNode(nodeId, (node) => ({
        ...node,
        trigger: {
          dedupStrategy: node.trigger?.dedupStrategy ?? 'Skip duplicate sender within 10m',
          conditionSummary: node.trigger?.conditionSummary ?? '当收到 onboarding 申请或入职任务消息时启动。',
          selectedTriggerId: triggerId,
        },
      }))
    },
    [updateNode],
  )

  const updateTriggerConfig = useCallback(
    (nodeId: string, patch: Partial<NonNullable<OnboardingCanvasNode['trigger']>>) => {
      updateNode(nodeId, (node) => ({
        ...node,
        trigger: {
          selectedTriggerId: node.trigger?.selectedTriggerId ?? 'slack',
          dedupStrategy: node.trigger?.dedupStrategy ?? 'Skip duplicate sender within 10m',
          conditionSummary: node.trigger?.conditionSummary ?? '',
          ...patch,
        },
      }))
    },
    [updateNode],
  )

  const updateManualInputConfig = useCallback(
    (nodeId: string, patch: Partial<NonNullable<OnboardingCanvasNode['manualInput']>>) => {
      updateNode(nodeId, (node) => ({
        ...node,
        manualInput: {
          promptLabel: node.manualInput?.promptLabel ?? '请补充入职申请备注',
          inputType: node.manualInput?.inputType ?? 'long-text',
          required: node.manualInput?.required ?? true,
          placeholder: node.manualInput?.placeholder ?? '',
          ...patch,
        },
      }))
    },
    [updateNode],
  )

  const updateAgentSettings = useCallback(
    (nodeId: string, patch: Partial<NonNullable<OnboardingCanvasNode['agentSettings']>>) => {
      updateNode(nodeId, (node) => ({
        ...node,
        agentSettings: {
          role: node.agentSettings?.role ?? node.label,
          goal: node.agentSettings?.goal ?? node.description,
          instructions:
            node.agentSettings?.instructions ??
            buildAgentTaskDescription(node.agentSettings?.role ?? node.label, node.agentSettings?.goal ?? node.description),
          provider: node.agentSettings?.provider ?? 'OpenAI',
          model: node.agentSettings?.model ?? 'gpt-4.1',
          isManagerMode: node.agentSettings?.isManagerMode ?? true,
          areChildAgentsCollapsed: node.agentSettings?.areChildAgentsCollapsed ?? false,
          taskSchedulingEnabled: node.agentSettings?.taskSchedulingEnabled ?? false,
          scheduledTasks: node.agentSettings?.scheduledTasks ?? [],
          temperatureUseProviderDefault: node.agentSettings?.temperatureUseProviderDefault ?? true,
          temperature: node.agentSettings?.temperature ?? 0.2,
          maxTokens: node.agentSettings?.maxTokens ?? '',
          reasoningEnabled: node.agentSettings?.reasoningEnabled ?? false,
          maxReasoningAttempts: node.agentSettings?.maxReasoningAttempts ?? '',
          allowDelegation: node.agentSettings?.allowDelegation ?? false,
          maxIterations: node.agentSettings?.maxIterations ?? '25',
          maxRpm: node.agentSettings?.maxRpm ?? '',
          maxExecutionTimeSeconds: node.agentSettings?.maxExecutionTimeSeconds ?? '',
          responseSchemaProperties: node.agentSettings?.responseSchemaProperties ?? [],
          ...patch,
        },
      }))
    },
    [updateNode],
  )

  const updateOrchestratorConfig = useCallback(
    (nodeId: string, patch: Partial<NonNullable<OnboardingCanvasNode['orchestrator']>>) => {
      updateNode(nodeId, (node) => ({
        ...node,
        orchestrator: {
          strategy: node.orchestrator?.strategy ?? 'Priority-based',
          executionMode: node.orchestrator?.executionMode ?? 'Supervisor',
          maxConcurrency: node.orchestrator?.maxConcurrency ?? 3,
          failurePolicy: node.orchestrator?.failurePolicy ?? '',
          ...patch,
        },
      }))
    },
    [updateNode],
  )

  const updateRouterModel = useCallback(
    (nodeId: string, modelId: RouterModelId) => {
      updateNode(nodeId, (node) => ({
        ...node,
        router: {
          modelId,
        },
      }))
    },
    [updateNode],
  )

  const updateEdgeConnectionType = useCallback(
    (edgeId: string, connectionType: EdgeConnectionType) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        connectionType,
      }))
    },
    [updateEdge],
  )

  const updateLoopConfig = useCallback(
    (nodeId: string, patch: Partial<NonNullable<OnboardingCanvasNode['loop']>>) => {
      updateNode(nodeId, (node) => ({
        ...node,
        loop: {
          source: node.loop?.source ?? '候选员工列表',
          maxIterations: node.loop?.maxIterations ?? 3,
          stopCondition: node.loop?.stopCondition ?? '',
          outputMode: node.loop?.outputMode ?? 'Summarize at end',
          ...patch,
        },
      }))
    },
    [updateNode],
  )

  const updateSubflowConfig = useCallback(
    (nodeId: string, patch: Partial<NonNullable<OnboardingCanvasNode['subflow']>>) => {
      updateNode(nodeId, (node) => ({
        ...node,
        subflow: {
          flowName: node.subflow?.flowName ?? '新员工账号开通子流程',
          inputBinding: node.subflow?.inputBinding ?? '',
          returnMode: node.subflow?.returnMode ?? 'Return payload with trace',
          fallbackAction: node.subflow?.fallbackAction ?? '',
          ...patch,
        },
      }))
    },
    [updateNode],
  )

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        label,
      }))
    },
    [updateEdge],
  )

  const updateEdgeConditionType = useCallback(
    (edgeId: string, conditionType: RouterConditionType) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        conditionType: 'rule-based',
        connectionType: 'conditional',
        conditions:
          conditionType === 'rule-based'
            ? edge.conditions.length > 0
              ? edge.conditions
              : ['']
            : edge.conditions,
      }))
    },
    [updateEdge],
  )

  const addEdgeCondition = useCallback(
    (edgeId: string) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        connectionType: 'conditional',
        conditions: [...edge.conditions, ''],
      }))
    },
    [updateEdge],
  )

  const updateEdgeCondition = useCallback(
    (edgeId: string, index: number, value: string) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        conditions: edge.conditions.map((condition, conditionIndex) => (conditionIndex === index ? value : condition)),
      }))
    },
    [updateEdge],
  )

  const removeEdgeCondition = useCallback(
    (edgeId: string, index: number) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        conditions: edge.conditions.filter((_, conditionIndex) => conditionIndex !== index),
      }))
    },
    [updateEdge],
  )

  const routerConditionCards = useMemo<RouterBranchCondition[]>(() => {
    if (!selectedNode || selectedNode.data.kind !== 'router') return []
    return edges
      .filter((edge) => edge.source === selectedNode.id)
      .map((edge) => {
        const targetNode = nodes.find((node) => node.id === edge.target)
        return {
          id: `${edge.id}-condition`,
          edgeId: edge.id,
          targetNodeId: edge.target,
          label: targetNode?.data.label ?? edge.target,
          icon: targetNode?.data.icon ?? 'sparkles',
          conditionType: edge.data?.connectionType === 'conditional' ? 'rule-based' : 'llm-based',
          prompt: edge.data?.label || '',
          rules: edge.data?.conditions ?? [],
        }
      })
  }, [edges, nodes, selectedNode])

  const updateRouterBranchCondition = useCallback(
    (edgeId: string, patch: Partial<Pick<RouterBranchCondition, 'conditionType' | 'prompt'>>) => {
      updateEdge(edgeId, (edge) => ({
        ...edge,
        label: patch.prompt ?? edge.label,
        connectionType: patch.conditionType === 'rule-based' ? 'conditional' : edge.connectionType,
      }))
    },
    [updateEdge],
  )

  const sendJoyceUserMessage = useCallback((text: string) => {
    const value = text.trim()
    if (!value) return
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('joyce-user'),
        tone: 'thinking',
        title: '你',
        content: value,
      },
      {
        id: createMessageId('joyce-reply'),
        tone: 'note',
        title: 'Joyce AI',
        content: '当前为第三批原型阶段，Joyce 已接收这条上下文，但这里先保留轻量壳层回复。',
      },
    ])
    setIsJoyceCollapsed(false)
  }, [])

  const currentContextLabel = useMemo(() => {
    if (selectedEdge?.data) {
      return `Edge · ${selectedEdge.data.label || `${selectedEdge.source} -> ${selectedEdge.target}`}`
    }
    if (selectedNode?.data) {
      return selectedNode.data.label
    }
    return 'AI thoughts'
  }, [selectedEdge, selectedNode])

  return {
    activeTab,
    setActiveTab,
    isJoyceCollapsed,
    openJoycePanel,
    toggleJoyceCollapsed,
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    selectedNode,
    selectedEdge,
    leftPanelMode,
    clearSelection,
    closeLeftPanel,
    selectNode,
    selectEdge,
    updateNodePosition,
    connectNodes,
    attachToolToAgent,
    createAgentNodeFromLibraryItem,
    addNode,
    deleteNode,
    updateTriggerSelection,
    updateTriggerConfig,
    updateManualInputConfig,
    updateAgentSettings,
    updateOrchestratorConfig,
    updateRouterModel,
    updateRouterBranchCondition,
    routerConditionCards,
    updateLoopConfig,
    updateSubflowConfig,
    updateEdgeConnectionType,
    updateEdgeLabel,
    updateEdgeConditionType,
    addEdgeCondition,
    updateEdgeCondition,
    removeEdgeCondition,
    messages,
    sendJoyceUserMessage,
    currentContextLabel,
    isNewStepPanelOpen,
    setIsNewStepPanelOpen,
    mainAgentForm,
    setMainAgentForm,
  }
}
