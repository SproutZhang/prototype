import type { EdgeConnectionType } from '../../data/onboarding-workflow'
import type { WorkflowRenderEdge, WorkflowRenderNode } from './useOnboardingWorkflowState'
import { WorkflowIcon } from './WorkflowIcon'

type EdgeSettingsPanelProps = {
  edge: WorkflowRenderEdge
  sourceNode: WorkflowRenderNode | null
  targetNode: WorkflowRenderNode | null
  onChangeLabel: (label: string) => void
  onChangeConnectionType: (value: EdgeConnectionType) => void
  onAddCondition: () => void
  onUpdateCondition: (index: number, value: string) => void
  onDeleteCondition: (index: number) => void
  onClose: () => void
}

export function EdgeSettingsPanel({
  edge,
  sourceNode,
  targetNode,
  onChangeLabel,
  onChangeConnectionType,
  onAddCondition,
  onUpdateCondition,
  onDeleteCondition,
  onClose,
}: EdgeSettingsPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">连线设置</div>
          <div className="workflow-side-panel-subtitle">先实现统一可扩展的 EdgeSettingsPanel。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
      </div>

      <div className="workflow-side-panel-scroll">
        <div className="workflow-edge-summary">
          <div className="workflow-edge-node-chip">
            {sourceNode ? (
              <>
                <span className="workflow-edge-node-chip-icon" aria-hidden="true">
                  <WorkflowIcon icon={sourceNode.data.icon} />
                </span>
                <span className="workflow-edge-node-chip-text">{sourceNode.data.label}</span>
              </>
            ) : (
              <span className="workflow-edge-node-chip-text">{edge.source}</span>
            )}
          </div>
          <span className="workflow-edge-arrow" aria-hidden="true">
            →
          </span>
          <div className="workflow-edge-node-chip">
            {targetNode ? (
              <>
                <span className="workflow-edge-node-chip-icon" aria-hidden="true">
                  <WorkflowIcon icon={targetNode.data.icon} />
                </span>
                <span className="workflow-edge-node-chip-text">{targetNode.data.label}</span>
              </>
            ) : (
              <span className="workflow-edge-node-chip-text">{edge.target}</span>
            )}
          </div>
        </div>

        <div className="workflow-panel-field">
          <div className="workflow-panel-label">Label</div>
          <input
            className="workflow-panel-input"
            value={edge.data?.label ?? ''}
            onChange={(event) => onChangeLabel(event.target.value)}
            placeholder="Describe this connection..."
          />
        </div>

        <div className="workflow-panel-field">
          <div className="workflow-panel-label">Connection type</div>
          <select
            className="workflow-panel-select"
            value={edge.data?.connectionType ?? 'next-step'}
            onChange={(event) => onChangeConnectionType(event.target.value as EdgeConnectionType)}
          >
            <option value="next-step">Next step</option>
            <option value="ai-connection">AI connection</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>

        {edge.data?.connectionType === 'conditional' ? (
          <div className="workflow-panel-field">
            <div className="workflow-panel-label">Conditions</div>
            <div className="workflow-router-rule-list">
              {(edge.data.conditions ?? []).map((rule, index) => (
                <div key={`${edge.id}-${index}`} className="workflow-router-rule-row">
                  <input
                    className="workflow-panel-input"
                    value={rule}
                    onChange={(event) => onUpdateCondition(index, event.target.value)}
                    placeholder={`Condition ${index + 1}`}
                  />
                  <button
                    className="workflow-router-rule-delete"
                    type="button"
                    onClick={() => onDeleteCondition(index)}
                    aria-label="删除条件"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button className="workflow-link-btn" type="button" onClick={onAddCondition}>
              + 添加条件
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
