import { LOOP_OUTPUT_MODE_OPTIONS, type LoopNodeConfig } from '../../data/onboarding-workflow'

type LoopNodeConfigPanelProps = {
  config: LoopNodeConfig
  onChange: (patch: Partial<LoopNodeConfig>) => void
  onDelete: () => void
  onClose: () => void
}

export function LoopNodeConfigPanel({ config, onChange, onDelete, onClose }: LoopNodeConfigPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">循环设置</div>
          <div className="workflow-side-panel-subtitle">控制循环数据来源、最大轮次与退出条件。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onDelete} aria-label="删除循环节点">
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
            <div className="workflow-panel-label">循环数据源</div>
            <input
              className="workflow-panel-input"
              value={config.source}
              onChange={(event) => onChange({ source: event.target.value })}
              placeholder="例如：候选员工列表"
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">最大轮次</div>
            <input
              className="workflow-panel-input"
              type="number"
              min={1}
              max={50}
              value={config.maxIterations}
              onChange={(event) => onChange({ maxIterations: Number(event.target.value) || 1 })}
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">退出条件</div>
            <textarea
              className="workflow-panel-textarea"
              rows={4}
              value={config.stopCondition}
              onChange={(event) => onChange({ stopCondition: event.target.value })}
              placeholder="例如：所有员工资料完整或达到上限轮次"
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">输出模式</div>
            <select
              className="workflow-panel-select"
              value={config.outputMode}
              onChange={(event) => onChange({ outputMode: event.target.value })}
            >
              {LOOP_OUTPUT_MODE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
