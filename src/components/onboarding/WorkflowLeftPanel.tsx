import type {
  AgentNodeConfig,
  AgentToolAssignment,
  LoopNodeConfig,
  MainAgentFormState,
  ManualInputNodeConfig,
  OrchestratorNodeConfig,
  RouterModelId,
  SubflowNodeConfig,
  TriggerNodeConfig,
} from '../../data/onboarding-workflow'
import { AgentNodeConfigPanel } from './AgentNodeConfigPanel'
import { EdgeSettingsPanel } from './EdgeSettingsPanel'
import { LoopNodeConfigPanel } from './LoopNodeConfigPanel'
import { ManualInputNodeConfigPanel } from './ManualInputNodeConfigPanel'
import { OrchestratorNodeConfigPanel } from './OrchestratorNodeConfigPanel'
import { RouterNodeConfigPanel } from './RouterNodeConfigPanel'
import { SubflowNodeConfigPanel } from './SubflowNodeConfigPanel'
import { TriggerNodeConfigPanel } from './TriggerNodeConfigPanel'
import {
  buildAgentTaskDescription,
  type WorkflowRenderEdge,
  type WorkflowRenderNode,
  type WorkflowRenderNodeData,
} from './useOnboardingWorkflowState'

type WorkflowLeftPanelProps = {
  mode:
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
  selectedNode: WorkflowRenderNode | null
  selectedEdge: WorkflowRenderEdge | null
  sourceNode: WorkflowRenderNode | null
  targetNode: WorkflowRenderNode | null
  mainAgentForm: MainAgentFormState
  mainAgentTools?: AgentToolAssignment[]
  onMainAgentFormChange: (patch: Partial<MainAgentFormState>) => void
  routerBranches: Array<{
    id: string
    edgeId: string
    targetNodeId: string
    label: string
    icon: WorkflowRenderNodeData['icon']
    conditionType: 'llm-based' | 'rule-based'
    prompt: string
    rules: string[]
  }>
  onSelectTrigger: (triggerId: string) => void
  onUpdateTriggerConfig: (patch: Partial<TriggerNodeConfig>) => void
  onUpdateManualInputConfig: (patch: Partial<ManualInputNodeConfig>) => void
  onUpdateAgentSettings: (patch: Partial<AgentNodeConfig>) => void
  onDeleteNode: () => void
  onUpdateOrchestratorConfig: (patch: Partial<OrchestratorNodeConfig>) => void
  onUpdateRouterModel: (value: RouterModelId) => void
  onUpdateRouterBranch: (
    edgeId: string,
    patch: {
      conditionType?: 'llm-based' | 'rule-based'
      prompt?: string
    },
  ) => void
  onAddRouterRule: (edgeId: string) => void
  onUpdateRouterRule: (edgeId: string, index: number, value: string) => void
  onDeleteRouterRule: (edgeId: string, index: number) => void
  onChangeEdgeLabel: (label: string) => void
  onChangeEdgeConnectionType: (value: 'next-step' | 'ai-connection' | 'conditional') => void
  onAddEdgeCondition: () => void
  onUpdateEdgeCondition: (index: number, value: string) => void
  onDeleteEdgeCondition: (index: number) => void
  onUpdateLoopConfig: (patch: Partial<LoopNodeConfig>) => void
  onUpdateSubflowConfig: (patch: Partial<SubflowNodeConfig>) => void
  onClosePanel: () => void
}

export function WorkflowLeftPanel({
  mode,
  selectedNode,
  selectedEdge,
  sourceNode,
  targetNode,
  mainAgentForm,
  mainAgentTools,
  onMainAgentFormChange,
  routerBranches,
  onSelectTrigger,
  onUpdateTriggerConfig,
  onUpdateManualInputConfig,
  onUpdateAgentSettings,
  onDeleteNode,
  onUpdateOrchestratorConfig,
  onUpdateRouterModel,
  onUpdateRouterBranch,
  onAddRouterRule,
  onUpdateRouterRule,
  onDeleteRouterRule,
  onChangeEdgeLabel,
  onChangeEdgeConnectionType,
  onAddEdgeCondition,
  onUpdateEdgeCondition,
  onDeleteEdgeCondition,
  onUpdateLoopConfig,
  onUpdateSubflowConfig,
  onClosePanel,
}: WorkflowLeftPanelProps) {
  if (mode === 'main-agent-settings') {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <AgentNodeConfigPanel
          config={{
            role: mainAgentForm.role,
            goal: mainAgentForm.goal,
            instructions: mainAgentForm.description,
            provider: mainAgentForm.provider,
            model: mainAgentForm.model,
            isManagerMode: mainAgentForm.isManagerAgent,
            areChildAgentsCollapsed: mainAgentForm.areChildAgentsCollapsed,
            taskSchedulingEnabled: mainAgentForm.taskConfigEnabled,
            scheduledTasks: mainAgentForm.scheduledTasks,
            temperatureUseProviderDefault: mainAgentForm.temperatureUseProviderDefault,
            temperature: mainAgentForm.temperature,
            maxTokens: mainAgentForm.maxTokens,
            reasoningEnabled: mainAgentForm.reasoningEnabled,
            maxReasoningAttempts: mainAgentForm.maxReasoningAttempts,
            allowDelegation: mainAgentForm.allowDelegation,
            maxIterations: mainAgentForm.maxIterations,
            maxRpm: mainAgentForm.maxRpm,
            maxExecutionTimeSeconds: mainAgentForm.maxExecutionTimeSeconds,
            responseSchemaProperties: mainAgentForm.responseSchemaProperties,
          }}
          tools={mainAgentTools}
          onChange={(patch) => {
            const nextPatch: Partial<MainAgentFormState> = {}
            if (patch.role !== undefined) nextPatch.role = patch.role
            if (patch.goal !== undefined) nextPatch.goal = patch.goal
            if (patch.instructions !== undefined) nextPatch.description = patch.instructions
            if (patch.provider !== undefined) nextPatch.provider = patch.provider
            if (patch.model !== undefined) nextPatch.model = patch.model
            if (patch.isManagerMode !== undefined) nextPatch.isManagerAgent = patch.isManagerMode
            if (patch.areChildAgentsCollapsed !== undefined) {
              nextPatch.areChildAgentsCollapsed = patch.areChildAgentsCollapsed
            }
            if (patch.taskSchedulingEnabled !== undefined) nextPatch.taskConfigEnabled = patch.taskSchedulingEnabled
            if (patch.scheduledTasks !== undefined) nextPatch.scheduledTasks = patch.scheduledTasks
            if (patch.temperatureUseProviderDefault !== undefined) {
              nextPatch.temperatureUseProviderDefault = patch.temperatureUseProviderDefault
            }
            if (patch.temperature !== undefined) nextPatch.temperature = patch.temperature
            if (patch.maxTokens !== undefined) nextPatch.maxTokens = patch.maxTokens
            if (patch.reasoningEnabled !== undefined) nextPatch.reasoningEnabled = patch.reasoningEnabled
            if (patch.maxReasoningAttempts !== undefined) {
              nextPatch.maxReasoningAttempts = patch.maxReasoningAttempts
            }
            if (patch.allowDelegation !== undefined) nextPatch.allowDelegation = patch.allowDelegation
            if (patch.maxIterations !== undefined) nextPatch.maxIterations = patch.maxIterations
            if (patch.maxRpm !== undefined) nextPatch.maxRpm = patch.maxRpm
            if (patch.maxExecutionTimeSeconds !== undefined) {
              nextPatch.maxExecutionTimeSeconds = patch.maxExecutionTimeSeconds
            }
            if (patch.responseSchemaProperties !== undefined) {
              nextPatch.responseSchemaProperties = patch.responseSchemaProperties
            }
            onMainAgentFormChange(nextPatch)
          }}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'trigger-settings' && selectedNode?.data.trigger) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <TriggerNodeConfigPanel
          config={selectedNode.data.trigger}
          onSelectTrigger={(triggerId) => onSelectTrigger(triggerId)}
          onChangeConfig={onUpdateTriggerConfig}
          onDelete={onDeleteNode}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'manual-input-settings' && selectedNode?.data.manualInput) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <ManualInputNodeConfigPanel
          config={selectedNode.data.manualInput}
          onChange={onUpdateManualInputConfig}
          onDelete={onDeleteNode}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'orchestrator-settings' && selectedNode?.data.orchestrator) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <OrchestratorNodeConfigPanel
          config={selectedNode.data.orchestrator}
          onChange={onUpdateOrchestratorConfig}
          onDelete={onDeleteNode}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'router-settings' && selectedNode?.data.router) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <RouterNodeConfigPanel
          modelId={selectedNode.data.router.modelId}
          branches={routerBranches}
          onModelChange={onUpdateRouterModel}
          onChangeBranch={onUpdateRouterBranch}
          onAddRule={onAddRouterRule}
          onUpdateRule={onUpdateRouterRule}
          onDeleteRule={onDeleteRouterRule}
          onDelete={onDeleteNode}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'edge-settings' && selectedEdge) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <EdgeSettingsPanel
          edge={selectedEdge}
          sourceNode={sourceNode}
          targetNode={targetNode}
          onChangeLabel={onChangeEdgeLabel}
          onChangeConnectionType={onChangeEdgeConnectionType}
          onAddCondition={onAddEdgeCondition}
          onUpdateCondition={onUpdateEdgeCondition}
          onDeleteCondition={onDeleteEdgeCondition}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'loop-settings' && selectedNode?.data.loop) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <LoopNodeConfigPanel
          config={selectedNode.data.loop}
          onChange={onUpdateLoopConfig}
          onDelete={onDeleteNode}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'subflow-settings' && selectedNode?.data.subflow) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <SubflowNodeConfigPanel
          config={selectedNode.data.subflow}
          onChange={onUpdateSubflowConfig}
          onDelete={onDeleteNode}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  if (mode === 'child-agent-settings' && selectedNode) {
    return (
      <aside className="workflow-config-shell" aria-label="左侧配置面板">
        <AgentNodeConfigPanel
          config={
            selectedNode.data.agentSettings ?? {
              role: selectedNode.data.label,
              goal: selectedNode.data.description,
              instructions: buildAgentTaskDescription(selectedNode.data.label, selectedNode.data.description),
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
          tools={selectedNode.data.tools}
          onChange={onUpdateAgentSettings}
          onClose={onClosePanel}
        />
      </aside>
    )
  }

  return (
    <aside className="workflow-config-shell" aria-label="左侧配置面板">
      <div className="workflow-panel-header">
        <div>
          <div className="workflow-panel-eyebrow">
            {mode === 'child-agent-settings' ? 'Child Agent Settings' : 'AI Thoughts'}
          </div>
          <div className="workflow-panel-title">
            {mode === 'ai-thoughts' ? 'AI thoughts' : selectedNode?.data.label ?? '未选中节点'}
          </div>
        </div>
        {selectedNode ? (
          <span className="workflow-panel-color-chip" style={{ background: selectedNode.data.color }} aria-hidden="true" />
        ) : null}
      </div>

      <div className="workflow-empty-state">
        点击画布中的节点、边或使用 `+ New` 新增步骤后，左侧会切换到对应配置面板。点击空白区域时，这里会回到 AI thoughts 空态。
      </div>
    </aside>
  )
}
