import { MANUAL_INPUT_TYPE_OPTIONS, type ManualInputNodeConfig } from '../../data/onboarding-workflow'

type ManualInputNodeConfigPanelProps = {
  config: ManualInputNodeConfig
  onChange: (patch: Partial<ManualInputNodeConfig>) => void
  onDelete: () => void
  onClose: () => void
}

export function ManualInputNodeConfigPanel({
  config,
  onChange,
  onDelete,
  onClose,
}: ManualInputNodeConfigPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">人工输入设置</div>
          <div className="workflow-side-panel-subtitle">定义当前节点需要用户补充的输入内容与约束。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onDelete} aria-label="删除人工输入节点">
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
            <div className="workflow-panel-label">输入标题</div>
            <input
              className="workflow-panel-input"
              value={config.promptLabel}
              onChange={(event) => onChange({ promptLabel: event.target.value })}
              placeholder="例如：请补充员工入职说明"
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">输入类型</div>
            <select
              className="workflow-panel-select"
              value={config.inputType}
              onChange={(event) => onChange({ inputType: event.target.value as ManualInputNodeConfig['inputType'] })}
            >
              {MANUAL_INPUT_TYPE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">占位说明</div>
            <textarea
              className="workflow-panel-textarea"
              rows={4}
              value={config.placeholder}
              onChange={(event) => onChange({ placeholder: event.target.value })}
              placeholder="告诉用户这里需要输入什么内容"
            />
          </div>

          <div className="workflow-panel-field">
            <label className="workflow-panel-toggle">
              <input
                type="checkbox"
                checked={config.required}
                onChange={(event) => onChange({ required: event.target.checked })}
              />
              <span>必须填写后才能继续执行</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
