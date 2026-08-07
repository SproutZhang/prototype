import { useId, useState } from 'react'

import type { AgentNodeConfig, AgentToolAssignment } from '../../data/onboarding-workflow'
import { ToolGlyph } from './WorkflowToolLibraryPanel'

type AgentNodeConfigPanelProps = {
  config: AgentNodeConfig
  tools?: AgentToolAssignment[]
  onChange: (patch: Partial<AgentNodeConfig>) => void
  onClose: () => void
}

const MODEL_OPTIONS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'claude-opus-4.1',
  'gemini-2.5-pro',
  'deepseek-v3',
] as const

export function AgentNodeConfigPanel({ config, tools = [], onChange, onClose }: AgentNodeConfigPanelProps) {
  const [isModelCollapsed, setIsModelCollapsed] = useState(false)
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false)
  const [isLlmSettingsCollapsed, setIsLlmSettingsCollapsed] = useState(false)
  const [isAgentSettingsCollapsed, setIsAgentSettingsCollapsed] = useState(false)
  const maxTokensHintId = useId()
  const agentPanelTitle = config.role.trim() || '未命名智能体'
  const agentPanelSubtitle = config.isManagerMode ? '主智能体 / 管理型智能体' : '智能体 / 单智能体'

  return (
    <div className="workflow-side-panel">
      <div className="workflow-agent-config-head">
        <div className="workflow-agent-config-summary">
          <div className="workflow-agent-config-node-title">{agentPanelTitle}</div>
          <div className="workflow-agent-config-node-subtitle">{agentPanelSubtitle}</div>
        </div>
        <div className="workflow-side-panel-actions">
          <button className="workflow-side-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
      </div>

      <div className="workflow-side-panel-scroll workflow-side-panel-scroll--agent-config">
        <div className="workflow-panel-stack workflow-panel-stack--agent-form">
          <div className="workflow-agent-section">
            <div className="workflow-agent-section-body">
              <div className="workflow-panel-field workflow-panel-field--plain">
                <div className="workflow-panel-label">角色</div>
                <input className="workflow-panel-input" value={config.role} onChange={(event) => onChange({ role: event.target.value })} />
              </div>

              <div className="workflow-panel-field workflow-panel-field--plain">
                <div className="workflow-panel-label">任务名称</div>
                <input
                  className="workflow-panel-input"
                  value={config.goal}
                  onChange={(event) => onChange({ goal: event.target.value })}
                />
              </div>

              <div className="workflow-panel-field workflow-panel-field--plain">
                <div className="workflow-panel-label">任务描述</div>
                <textarea
                  className="workflow-panel-textarea"
                  rows={3}
                  value={config.instructions}
                  onChange={(event) => onChange({ instructions: event.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="workflow-agent-section">
            <button
              className="workflow-agent-collapse-toggle workflow-agent-collapse-toggle--section"
              type="button"
              onClick={() => setIsModelCollapsed((prev) => !prev)}
              aria-expanded={!isModelCollapsed}
            >
              <span>模型</span>
            </button>

            {!isModelCollapsed ? (
              <div className="workflow-panel-field workflow-panel-field--plain">
                <select
                  className="workflow-panel-select"
                  value={config.model}
                  onChange={(event) => onChange({ model: event.target.value })}
                >
                  {MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="workflow-agent-section">
            <button
              className="workflow-agent-collapse-toggle workflow-agent-collapse-toggle--section"
              type="button"
              onClick={() => setIsToolsCollapsed((prev) => !prev)}
              aria-expanded={!isToolsCollapsed}
            >
              <span>工具</span>
            </button>

            {!isToolsCollapsed ? (
              <div className="workflow-panel-field workflow-panel-field--plain">
                {tools.length > 0 ? (
                  <div className="workflow-agent-tool-chip-list workflow-agent-tool-chip-list--panel">
                    {tools.map((tool) => (
                      <span key={tool.id} className="workflow-agent-tool-chip">
                        <span className="workflow-agent-tool-chip-icon" aria-hidden="true">
                          <ToolGlyph icon={tool.icon} />
                        </span>
                        <span>{tool.label}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="workflow-agent-empty-copy">当前没有为该智能体分配工具。</div>
                )}
              </div>
            ) : null}
          </div>

          <div className="workflow-agent-section">
            <button
              className="workflow-agent-collapse-toggle workflow-agent-collapse-toggle--section"
              type="button"
              onClick={() => setIsLlmSettingsCollapsed((prev) => !prev)}
              aria-expanded={!isLlmSettingsCollapsed}
            >
              <span>模型设置</span>
            </button>

            {!isLlmSettingsCollapsed ? (
              <div className="workflow-agent-section-body">
                <div className="workflow-panel-field workflow-panel-field--plain">
                  <div className="workflow-agent-field-header-row">
                    <div className="workflow-panel-label">温度</div>
                    <label className="workflow-agent-check-row">
                      <input
                        type="checkbox"
                        checked={config.temperatureUseProviderDefault}
                        onChange={(event) => onChange({ temperatureUseProviderDefault: event.target.checked })}
                      />
                      <span>使用提供方默认值</span>
                    </label>
                  </div>
                  <input
                    className="workflow-agent-range"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    style={{ ['--slider-progress' as string]: `${config.temperature * 100}%` }}
                    onChange={(event) =>
                      onChange({
                        temperature: Number(event.target.value),
                        temperatureUseProviderDefault: false,
                      })
                    }
                  />
                  <div className="workflow-agent-range-axis" aria-hidden="true">
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>

                <div className="workflow-panel-field workflow-panel-field--plain">
                  <div className="workflow-panel-label-row">
                    <div className="workflow-panel-label">最大输出长度</div>
                    <span className="workflow-panel-info-wrap">
                      <button
                        type="button"
                        className="workflow-panel-info"
                        aria-label="最大输出长度说明"
                        aria-describedby={maxTokensHintId}
                      >
                        <span aria-hidden="true">i</span>
                      </button>
                      <span id={maxTokensHintId} role="tooltip" className="workflow-panel-info-popover">
                        限制单次模型回复的最大输出长度。
                      </span>
                    </span>
                  </div>
                  <input
                    className="workflow-panel-input"
                    value={config.maxTokens}
                    placeholder="使用提供方默认值"
                    onChange={(event) => onChange({ maxTokens: event.target.value })}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="workflow-agent-section">
            <button
              className="workflow-agent-collapse-toggle workflow-agent-collapse-toggle--section"
              type="button"
              onClick={() => setIsAgentSettingsCollapsed((prev) => !prev)}
              aria-expanded={!isAgentSettingsCollapsed}
            >
              <span>智能体设置</span>
            </button>

            {!isAgentSettingsCollapsed ? (
              <div className="workflow-agent-section-body">
                <div className="workflow-agent-toggle-row">
                  <div>
                    <div className="workflow-panel-label">推理</div>
                    <div className="workflow-panel-helper">执行前先思考任务并形成计划。</div>
                  </div>
                  <button
                    className={config.reasoningEnabled ? 'workflow-switch is-on' : 'workflow-switch'}
                    type="button"
                    onClick={() => onChange({ reasoningEnabled: !config.reasoningEnabled })}
                    aria-pressed={config.reasoningEnabled}
                  >
                    <span />
                  </button>
                </div>

                {config.reasoningEnabled ? (
                  <div className="workflow-panel-field workflow-panel-field--plain">
                    <div className="workflow-panel-label">最大推理尝试次数</div>
                    <div className="workflow-panel-helper">推理失败时允许的最大重试次数。</div>
                    <input
                      className="workflow-panel-input"
                      value={config.maxReasoningAttempts}
                      placeholder="未设置"
                      onChange={(event) => onChange({ maxReasoningAttempts: event.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
