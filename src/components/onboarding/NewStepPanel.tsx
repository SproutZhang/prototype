import { NEW_STEP_TYPES, type NewStepTypeId } from '../../data/new-step-types'
import { WorkflowIcon } from './WorkflowIcon'

type NewStepPanelProps = {
  open: boolean
  onClose: () => void
  onPick: (stepId: NewStepTypeId) => void
}

export function NewStepPanel({ open, onClose, onPick }: NewStepPanelProps) {
  if (!open) return null

  return (
    <>
      <button className="workflow-new-step-backdrop" type="button" aria-label="关闭新增步骤面板" onClick={onClose} />
      <div className="workflow-new-step-panel">
        <div className="workflow-new-step-head">
          <div>
            <div className="workflow-new-step-title">新增步骤</div>
            <div className="workflow-new-step-subtitle">第一批先支持 7 类核心节点，点击后会直接插入画布并打开对应配置面板。</div>
          </div>
          <button className="workflow-side-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="workflow-new-step-list">
          {NEW_STEP_TYPES.map((item) => (
            <button
              key={item.id}
              className="workflow-new-step-item"
              type="button"
              onClick={() => onPick(item.id as NewStepTypeId)}
            >
              <span className="workflow-new-step-item-icon" style={{ color: item.accent, background: `${item.accent}18` }} aria-hidden="true">
                <WorkflowIcon icon={item.icon} />
              </span>
              <span className="workflow-new-step-item-copy">
                <span className="workflow-new-step-item-label">{item.label}</span>
                <span className="workflow-new-step-item-subtitle">{item.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
