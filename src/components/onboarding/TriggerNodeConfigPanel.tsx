import { TRIGGER_OPTIONS, type TriggerNodeConfig } from '../../data/onboarding-workflow'

type TriggerNodeConfigPanelProps = {
  config: TriggerNodeConfig
  onSelectTrigger: (triggerId: string) => void
  onChangeConfig: (patch: Partial<TriggerNodeConfig>) => void
  onDelete: () => void
  onClose: () => void
}

export function TriggerNodeConfigPanel({
  config,
  onSelectTrigger,
  onChangeConfig,
  onDelete,
  onClose,
}: TriggerNodeConfigPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">选择触发器</div>
          <div className="workflow-side-panel-subtitle">为当前流程选择一个启动入口。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onDelete} aria-label="删除触发器节点">
            🗑
          </button>
          <button className="workflow-side-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
      </div>

      <div className="workflow-side-panel-scroll">
        <div className="workflow-option-list">
          {TRIGGER_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={config.selectedTriggerId === option.id ? 'workflow-option-item is-selected' : 'workflow-option-item'}
              type="button"
              onClick={() => onSelectTrigger(option.id)}
            >
              <span className="workflow-option-dot" style={{ background: option.tone }} aria-hidden="true" />
              <span className="workflow-option-copy">
                <span className="workflow-option-label">{option.label}</span>
                <span className="workflow-option-hint">
                  {option.id === 'recurring-schedule' ? '按周期或定时计划触发' : '连接外部事件后即可启动'}
                </span>
              </span>
              {config.selectedTriggerId === option.id ? <span className="workflow-option-state">已选择</span> : null}
            </button>
          ))}
        </div>

        <div className="workflow-panel-stack">
          <div className="workflow-panel-field">
            <div className="workflow-panel-label">去重策略</div>
            <input
              className="workflow-panel-input"
              value={config.dedupStrategy}
              onChange={(event) => onChangeConfig({ dedupStrategy: event.target.value })}
              placeholder="例如：10 分钟内同一发送者只处理一次"
            />
          </div>

          <div className="workflow-panel-field">
            <div className="workflow-panel-label">触发条件摘要</div>
            <textarea
              className="workflow-panel-textarea"
              rows={3}
              value={config.conditionSummary}
              onChange={(event) => onChangeConfig({ conditionSummary: event.target.value })}
              placeholder="描述当前触发器什么时候会真正启动流程"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
