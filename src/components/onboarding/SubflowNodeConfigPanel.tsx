import { SUBFLOW_RETURN_MODE_OPTIONS, type SubflowNodeConfig } from '../../data/onboarding-workflow'

type SubflowNodeConfigPanelProps = {
  config: SubflowNodeConfig
  onChange: (patch: Partial<SubflowNodeConfig>) => void
  onDelete: () => void
  onClose: () => void
}

export function SubflowNodeConfigPanel({ config, onChange, onDelete, onClose }: SubflowNodeConfigPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">子流程设置</div>
          <div className="workflow-side-panel-subtitle">定义子流程入口、入参映射与回传方式。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onDelete} aria-label="删除子流程节点">
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
            <div className="workflow-panel-label">子流程名称</div>
            <input
              className="workflow-panel-input"
              value={config.flowName}
              onChange={(event) => onChange({ flowName: event.target.value })}
              placeholder="例如：新员工账号开通子流程"
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">输入绑定</div>
            <textarea
              className="workflow-panel-textarea"
              rows={3}
              value={config.inputBinding}
              onChange={(event) => onChange({ inputBinding: event.target.value })}
              placeholder="例如：employeeProfile -> onboardingPayload"
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">回传模式</div>
            <select
              className="workflow-panel-select"
              value={config.returnMode}
              onChange={(event) => onChange({ returnMode: event.target.value })}
            >
              {SUBFLOW_RETURN_MODE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">失败回退动作</div>
            <textarea
              className="workflow-panel-textarea"
              rows={4}
              value={config.fallbackAction}
              onChange={(event) => onChange({ fallbackAction: event.target.value })}
              placeholder="例如：调用失败则转交人工处理并发送告警"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
