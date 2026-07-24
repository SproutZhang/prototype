import {
  ORCHESTRATOR_EXECUTION_MODE_OPTIONS,
  ORCHESTRATOR_STRATEGY_OPTIONS,
  type OrchestratorNodeConfig,
} from '../../data/onboarding-workflow'

type OrchestratorNodeConfigPanelProps = {
  config: OrchestratorNodeConfig
  onChange: (patch: Partial<OrchestratorNodeConfig>) => void
  onDelete: () => void
  onClose: () => void
}

export function OrchestratorNodeConfigPanel({
  config,
  onChange,
  onDelete,
  onClose,
}: OrchestratorNodeConfigPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">编排器-执行器设置</div>
          <div className="workflow-side-panel-subtitle">决定如何调度下游执行节点、控制并发与失败兜底。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onDelete} aria-label="删除编排器节点">
            🗑
          </button>
          <button className="workflow-side-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
      </div>

      <div className="workflow-side-panel-scroll">
        <div className="workflow-panel-stack">
          <div className="workflow-panel-field">
            <div className="workflow-panel-label">编排策略</div>
            <select
              className="workflow-panel-select"
              value={config.strategy}
              onChange={(event) => onChange({ strategy: event.target.value })}
            >
              {ORCHESTRATOR_STRATEGY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">执行模式</div>
            <select
              className="workflow-panel-select"
              value={config.executionMode}
              onChange={(event) => onChange({ executionMode: event.target.value })}
            >
              {ORCHESTRATOR_EXECUTION_MODE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">最大并发数</div>
            <input
              className="workflow-panel-input"
              type="number"
              min={1}
              max={20}
              value={config.maxConcurrency}
              onChange={(event) => onChange({ maxConcurrency: Number(event.target.value) || 1 })}
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">失败策略</div>
            <textarea
              className="workflow-panel-textarea"
              rows={4}
              value={config.failurePolicy}
              onChange={(event) => onChange({ failurePolicy: event.target.value })}
              placeholder="例如：任一关键节点失败时暂停流程并通知人工介入"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
