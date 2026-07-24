import {
  ROUTER_MODEL_OPTIONS,
  type RouterBranchCondition,
  type RouterConditionType,
  type RouterModelId,
} from '../../data/onboarding-workflow'
import { WorkflowIcon } from './WorkflowIcon'

type RouterNodeConfigPanelProps = {
  modelId: RouterModelId
  branches: RouterBranchCondition[]
  onModelChange: (value: RouterModelId) => void
  onChangeBranch: (
    edgeId: string,
    patch: Partial<Pick<RouterBranchCondition, 'conditionType' | 'prompt'>>,
  ) => void
  onAddRule: (edgeId: string) => void
  onUpdateRule: (edgeId: string, index: number, value: string) => void
  onDeleteRule: (edgeId: string, index: number) => void
  onDelete: () => void
  onClose: () => void
}

export function RouterNodeConfigPanel({
  modelId,
  branches,
  onModelChange,
  onChangeBranch,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onDelete,
  onClose,
}: RouterNodeConfigPanelProps) {
  return (
    <div className="workflow-side-panel">
      <div className="workflow-side-panel-head">
        <div>
          <div className="workflow-side-panel-title">Router 设置</div>
          <div className="workflow-side-panel-subtitle">按模型或规则为不同分支配置条件。</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onDelete} aria-label="删除路由节点">
            🗑
          </button>
          <button className="workflow-side-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
      </div>

      <div className="workflow-side-panel-scroll">
        <div className="workflow-panel-field">
          <div className="workflow-panel-label">LLM Model</div>
          <select
            className="workflow-panel-select"
            value={modelId}
            onChange={(event) => onModelChange(event.target.value as RouterModelId)}
          >
            {ROUTER_MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · {option.provider}
              </option>
            ))}
          </select>
        </div>

        <div className="workflow-router-note">
          第一个满足条件的分支会成为执行路径。当前先保留最小版 condition cards 结构，方便下一批继续扩展排序与高级 provider 信息。
        </div>

        {branches.length > 0 ? (
          <div className="workflow-router-branch-list">
            {branches.map((branch) => (
              <section key={branch.id} className="workflow-router-branch-card">
                <div className="workflow-router-branch-head">
                  <div className="workflow-router-branch-target">
                    <span className="workflow-router-branch-icon" aria-hidden="true">
                      <WorkflowIcon icon={branch.icon} />
                    </span>
                    <span>{branch.label}</span>
                  </div>
                  <span className="workflow-router-branch-badge">Branch</span>
                </div>

                <div className="workflow-panel-field workflow-panel-field--inner">
                  <div className="workflow-panel-label">Condition type</div>
                  <select
                    className="workflow-panel-select"
                    value={branch.conditionType}
                    onChange={(event) =>
                      onChangeBranch(branch.edgeId, {
                        conditionType: event.target.value as RouterConditionType,
                      })
                    }
                  >
                    <option value="llm-based">LLM-based</option>
                    <option value="rule-based">Rule-based</option>
                  </select>
                </div>

                {branch.conditionType === 'llm-based' ? (
                  <div className="workflow-panel-field workflow-panel-field--inner">
                    <div className="workflow-panel-label">Prompt</div>
                    <textarea
                      className="workflow-panel-textarea"
                      rows={3}
                      value={branch.prompt}
                      onChange={(event) =>
                        onChangeBranch(branch.edgeId, {
                          prompt: event.target.value,
                        })
                      }
                      placeholder="Describe when this branch should be selected..."
                    />
                  </div>
                ) : (
                  <div className="workflow-panel-field workflow-panel-field--inner">
                    <div className="workflow-panel-label">Rules</div>
                    <div className="workflow-router-rule-list">
                      {branch.rules.map((rule, index) => (
                        <div key={`${branch.id}-${index}`} className="workflow-router-rule-row">
                          <input
                            className="workflow-panel-input"
                            value={rule}
                            onChange={(event) => onUpdateRule(branch.edgeId, index, event.target.value)}
                            placeholder={`Condition ${index + 1}`}
                          />
                          <button
                            className="workflow-router-rule-delete"
                            type="button"
                            onClick={() => onDeleteRule(branch.edgeId, index)}
                            aria-label="删除条件"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="workflow-link-btn" type="button" onClick={() => onAddRule(branch.edgeId)}>
                      + Add condition
                    </button>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="workflow-empty-state">
            当前 Router 还没有连到下游节点。先在画布里补连线后，这里就会出现对应的 condition cards。
          </div>
        )}
      </div>
    </div>
  )
}
