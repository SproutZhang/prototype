import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  type ReactFlowInstance,
  type Connection,
  type NodeProps,
  type XYPosition,
} from 'reactflow'
import 'reactflow/dist/style.css'

import type { AgentToolAssignment } from '../../data/onboarding-workflow'
import type { NewStepTypeId } from '../../data/new-step-types'
import type { ToolLibraryAgentTemplateItem } from '../../data/tool-library'
import { NewStepPanel } from './NewStepPanel'
import { WorkflowIcon } from './WorkflowIcon'
import {
  ToolGlyph,
  WORKFLOW_AGENT_TEMPLATE_DRAG_MIME,
  WORKFLOW_DRAG_STATE_EVENT,
  WORKFLOW_TOOL_DRAG_MIME,
} from './WorkflowToolLibraryPanel'
import type { WorkflowRenderEdge, WorkflowRenderNode, WorkflowRenderNodeData } from './useOnboardingWorkflowState'

export type WorkflowCanvasNodeRuntimeStatus = 'idle' | 'busy' | 'running' | 'completed'
export type WorkflowCanvasEdgeRuntimeStatus = 'idle' | 'running' | 'completed'

type WorkflowCanvasProps = {
  nodes: WorkflowRenderNode[]
  edges: WorkflowRenderEdge[]
  nodeRuntimeStatuses?: Partial<Record<string, WorkflowCanvasNodeRuntimeStatus>>
  edgeRuntimeStatuses?: Partial<Record<string, WorkflowCanvasEdgeRuntimeStatus>>
  selectedNodeId: string | null
  selectedEdgeId: string | null
  isNewStepPanelOpen: boolean
  onSelectNode: (nodeId: string) => void
  onSelectEdge: (edgeId: string) => void
  onPaneClick: () => void
  onNodeDragStop: (nodeId: string, position: XYPosition) => void
  onConnectNodes: (connection: Connection) => void
  onAttachToolToAgent: (nodeId: string, tool: AgentToolAssignment) => void
  onCreateAgentNodeFromLibraryItem: (item: ToolLibraryAgentTemplateItem, position: XYPosition) => void
  onCloseNewStepPanel: () => void
  onPickNewStep: (stepId: NewStepTypeId) => void
}

type WorkflowCanvasNodeData = WorkflowRenderNodeData & {
  onAttachToolToAgent: (nodeId: string, tool: AgentToolAssignment) => void
  dragItemType: 'tool' | 'agent-template' | null
  runtimeStatus: WorkflowCanvasNodeRuntimeStatus
}

const kindBadgeLabel: Record<WorkflowRenderNodeData['kind'], string> = {
  'main-agent': 'Manager',
  agent: 'Agent',
  trigger: 'Trigger',
  'manual-input': 'Input',
  orchestrator: 'Orchestrator',
  router: 'Router',
  loop: 'Loop',
  subflow: 'Subflow',
}

function nodeMetaLabel(data: WorkflowRenderNodeData) {
  if (data.kind === 'trigger') return data.trigger?.selectedTriggerId ? `Source · ${data.trigger.selectedTriggerId}` : 'Source · not selected'
  if (data.kind === 'manual-input') return `Input · ${data.manualInput?.inputType ?? 'long-text'}`
  if (data.kind === 'orchestrator') return `Strategy · ${data.orchestrator?.strategy ?? 'Priority-based'}`
  if (data.kind === 'router') return `Model · ${data.router?.modelId ?? 'claude-opus-4.1'}`
  if (data.kind === 'loop') return `Loop · x${data.loop?.maxIterations ?? 1}`
  if (data.kind === 'subflow') return `Flow · ${data.subflow?.flowName ?? 'subflow'}`
  if (data.kind === 'main-agent') return null
  return null
}

const AgentNode = memo(({ data, selected }: NodeProps<WorkflowCanvasNodeData>) => {
  const [isToolDropOver, setIsToolDropOver] = useState(false)
  const nodeAccentColor = data.kind === 'agent' ? '#2f80ff' : data.color
  const runtimeStatus = data.runtimeStatus ?? 'idle'

  const handleToolDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (data.kind !== 'agent') return
    if (!event.dataTransfer.types.includes(WORKFLOW_TOOL_DRAG_MIME)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    if (!isToolDropOver) setIsToolDropOver(true)
  }

  const handleToolDrop = (event: DragEvent<HTMLDivElement>) => {
    if (data.kind !== 'agent') return
    event.preventDefault()
    event.stopPropagation()
    setIsToolDropOver(false)

    const raw = event.dataTransfer.getData(WORKFLOW_TOOL_DRAG_MIME)
    if (!raw) return

    try {
      const tool = JSON.parse(raw) as AgentToolAssignment
      if (!tool?.id || !tool?.label || !tool?.icon) return
      data.onAttachToolToAgent(data.id, tool)
    } catch {
      // noop
    }
  }

  return (
    <div
      className={[
        'workflow-agent-node',
        selected ? 'is-selected' : '',
        data.kind === 'agent' && data.dragItemType === 'tool' ? 'is-tool-dragging' : '',
        data.kind === 'agent' && isToolDropOver ? 'is-tool-drop-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--workflow-node-accent': nodeAccentColor } as CSSProperties}
    >
      {data.kind === 'agent' && data.dragItemType === 'tool' ? (
        <div className="workflow-agent-drop-pill">Drop tool here</div>
      ) : null}
      {runtimeStatus !== 'idle' && !(data.kind === 'main-agent' && runtimeStatus === 'completed') ? (
        <div className={`workflow-agent-runtime-badge workflow-agent-runtime-badge--${runtimeStatus}`}>
          <span
            className={`workflow-agent-runtime-badge-icon${
              runtimeStatus === 'running' ? ' is-spinning' : runtimeStatus === 'completed' ? ' is-check' : ' is-busy'
            }`}
            aria-hidden="true"
          />
          <span>
            {runtimeStatus === 'busy' ? 'Busy' : runtimeStatus === 'running' ? 'Running' : 'Completed'}
          </span>
        </div>
      ) : null}
      <Handle id="top" className="workflow-agent-handle" type="target" position={Position.Top} />
      <div className="workflow-agent-node-header">
        <span className="workflow-agent-node-icon" aria-hidden="true">
          <WorkflowIcon icon={data.icon} />
        </span>
        <span className={`workflow-agent-node-badge workflow-agent-node-badge--${data.kind}`}>
          {kindBadgeLabel[data.kind]}
        </span>
      </div>
      <div className="workflow-agent-node-title">{data.label}</div>
      <div className="workflow-agent-node-desc">{data.description}</div>
      {nodeMetaLabel(data) ? <div className="workflow-agent-node-meta">{nodeMetaLabel(data)}</div> : null}
      {data.kind === 'agent' ? (
        <div
          className={isToolDropOver ? 'workflow-agent-tool-slot is-drop-over' : 'workflow-agent-tool-slot'}
          onDragOver={handleToolDragOver}
          onDragEnter={handleToolDragOver}
          onDragLeave={() => setIsToolDropOver(false)}
          onDrop={handleToolDrop}
        >
          <div className="workflow-agent-tool-slot-label">{data.tools?.length ? 'Attached tools' : 'Drop tools here'}</div>
          {data.tools?.length ? (
            <div className="workflow-agent-tool-chip-list">
              {data.tools.map((tool) => (
                <span key={tool.id} className="workflow-agent-tool-chip">
                  <span className="workflow-agent-tool-chip-icon" aria-hidden="true">
                    <ToolGlyph icon={tool.icon} />
                  </span>
                  <span>{tool.label}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="workflow-agent-tool-slot-empty">Drag from Tool1 panel</div>
          )}
        </div>
      ) : null}
      <Handle id="bottom" className="workflow-agent-handle" type="source" position={Position.Bottom} />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

const nodeTypes = {
  agentCard: AgentNode,
}

export function WorkflowCanvas({
  nodes,
  edges,
  nodeRuntimeStatuses,
  edgeRuntimeStatuses,
  selectedNodeId,
  selectedEdgeId,
  isNewStepPanelOpen,
  onSelectNode,
  onSelectEdge,
  onPaneClick,
  onNodeDragStop,
  onConnectNodes,
  onAttachToolToAgent,
  onCreateAgentNodeFromLibraryItem,
  onCloseNewStepPanel,
  onPickNewStep,
}: WorkflowCanvasProps) {
  const [dragItemType, setDragItemType] = useState<'tool' | 'agent-template' | null>(null)
  const [isCanvasAgentDropOver, setIsCanvasAgentDropOver] = useState(false)
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null)

  useEffect(() => {
    const handleToolDragState = (event: Event) => {
      const customEvent = event as CustomEvent<{
        active?: boolean
        itemType?: 'tool' | 'agent-template'
      }>
      setDragItemType(customEvent.detail?.active ? customEvent.detail?.itemType ?? null : null)
      if (!customEvent.detail?.active) {
        setIsCanvasAgentDropOver(false)
      }
    }

    window.addEventListener(WORKFLOW_DRAG_STATE_EVENT, handleToolDragState as EventListener)
    return () =>
      window.removeEventListener(WORKFLOW_DRAG_STATE_EVENT, handleToolDragState as EventListener)
  }, [])

  const handleCanvasDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(WORKFLOW_AGENT_TEMPLATE_DRAG_MIME)) return
    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest('.workflow-agent-node')) {
      if (isCanvasAgentDropOver) setIsCanvasAgentDropOver(false)
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    if (!isCanvasAgentDropOver) {
      setIsCanvasAgentDropOver(true)
    }
  }

  const handleCanvasDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setIsCanvasAgentDropOver(false)
  }

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(WORKFLOW_AGENT_TEMPLATE_DRAG_MIME)) return
    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest('.workflow-agent-node')) {
      setIsCanvasAgentDropOver(false)
      return
    }
    event.preventDefault()
    setIsCanvasAgentDropOver(false)

    const raw = event.dataTransfer.getData(WORKFLOW_AGENT_TEMPLATE_DRAG_MIME)
    if (!raw || !reactFlowInstanceRef.current) return

    try {
      const item = JSON.parse(raw) as ToolLibraryAgentTemplateItem
      if (!item?.id || item.itemType !== 'agent-template') return

      const position = reactFlowInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      onCreateAgentNodeFromLibraryItem(item, position)
    } catch {
      // noop
    }
  }

  const rfNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAttachToolToAgent,
          dragItemType,
          runtimeStatus: nodeRuntimeStatuses?.[node.id] ?? 'idle',
        },
        selected: node.id === selectedNodeId,
      })),
    [dragItemType, nodeRuntimeStatuses, nodes, onAttachToolToAgent, selectedNodeId],
  )

  const rfEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...(edgeRuntimeStatuses?.[edge.id] === 'running' ? { animated: true } : {}),
        ...edge,
        type: 'default',
        sourceHandle: edge.data?.sourceHandle ?? edge.sourceHandle,
        targetHandle: edge.data?.targetHandle ?? edge.targetHandle,
        ...(function () {
          const runtimeStatus = edgeRuntimeStatuses?.[edge.id] ?? 'idle'
          const isRunning = runtimeStatus === 'running'
          const isCompleted = runtimeStatus === 'completed'
          const strokeColor = isRunning ? '#5b5bd6' : selectedEdgeId === edge.id ? '#6f63ff' : '#cbd5e1'
          return {
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: strokeColor,
            },
            style: {
              stroke: strokeColor,
              strokeWidth: isRunning ? 2.6 : isCompleted ? 1.8 : 1.5,
              strokeDasharray: isRunning || isCompleted ? '0' : '6 5',
              strokeLinecap: 'round',
            },
          }
        })(),
      })),
    [edgeRuntimeStatuses, edges, selectedEdgeId],
  )

  return (
    <div
      className={
        isCanvasAgentDropOver
          ? 'workflow-canvas-shell is-agent-template-drop-over'
          : 'workflow-canvas-shell'
      }
    >
      <div
        className="workflow-canvas-surface"
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
      >
        {dragItemType === 'agent-template' ? (
          <div
            className={
              isCanvasAgentDropOver
                ? 'workflow-canvas-drop-hint is-active'
                : 'workflow-canvas-drop-hint'
            }
          >
            放开以创建 Agent 节点
          </div>
        ) : null}
        <ReactFlow
          className="onboarding-reactflow"
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.14, minZoom: 0.58, maxZoom: 1.05 }}
          connectionMode={ConnectionMode.Strict}
          minZoom={0.45}
          maxZoom={1.6}
          nodesDraggable
          nodesConnectable
          onConnect={onConnectNodes}
          onNodeClick={(_, node) => onSelectNode(node.id)}
          onEdgeClick={(_, edge) => onSelectEdge(edge.id)}
          onPaneClick={onPaneClick}
          onNodeDragStop={(_, node) => onNodeDragStop(node.id, node.position)}
          onInit={(instance) => {
            reactFlowInstanceRef.current = instance
          }}
          connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="rgba(17, 24, 39, 0.08)" />
          <MiniMap
            pannable
            zoomable
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(232,233,245,0.9)',
              borderRadius: 18,
            }}
            nodeColor={(node) => (node.id === selectedNodeId ? '#6f63ff' : '#d4d6e6')}
          />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
        <NewStepPanel open={isNewStepPanelOpen} onClose={onCloseNewStepPanel} onPick={onPickNewStep} />
      </div>
    </div>
  )
}
