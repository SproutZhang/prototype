import { useState } from 'react'
import type { JoyceMessage, OnboardingWorkspaceTab } from '../../data/onboarding-workflow'

type JoycePanelProps = {
  activeTab: OnboardingWorkspaceTab
  messages: JoyceMessage[]
  collapsed: boolean
  currentContextLabel: string
  onToggleCollapsed: () => void
  onSendMessage: (text: string) => void
}

export function JoycePanel({
  activeTab,
  messages,
  collapsed,
  currentContextLabel,
  onToggleCollapsed,
  onSendMessage,
}: JoycePanelProps) {
  const [draft, setDraft] = useState('')
  const latestMessage = messages[messages.length - 1]

  return (
    <aside
      className={collapsed ? 'workflow-joyce-shell is-collapsed' : 'workflow-joyce-shell'}
      aria-label="Joyce AI 面板"
    >
      {!collapsed ? <div className="workflow-joyce-main">
          <div className="workflow-joyce-header-card">
            <div className="workflow-joyce-profile">
              <div className="workflow-joyce-avatar" aria-hidden="true">
                J
              </div>
              <div className="workflow-joyce-profile-copy">
                <div className="workflow-joyce-name-row">
                  <span className="workflow-joyce-name">Joyce AI</span>
                  <span className="workflow-joyce-online-dot" aria-hidden="true" />
                </div>
                <div className="workflow-joyce-online">在线</div>
              </div>
            </div>

            <button
              className="workflow-joyce-close"
              type="button"
              onClick={onToggleCollapsed}
              aria-label="关闭 Joyce AI 面板"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M8 9V6h3M16 15v3h-3M9 16H6v-3M15 8h3v3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="workflow-joyce-divider" aria-hidden="true" />

          <div className="workflow-joyce-body">
            {draft.trim().length === 0 && !latestMessage ? null : (
              <div className="workflow-joyce-body-hint">
                {draft.trim().length > 0
                  ? '继续补充你的工作流意图...'
                  : latestMessage?.content ?? `${activeTab} · ${currentContextLabel}`}
              </div>
            )}
          </div>

          <div className="workflow-joyce-composer">
            <textarea
              className="workflow-joyce-textarea"
              rows={3}
              placeholder="提问与你工作流相关……"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              className="workflow-joyce-send-icon"
              type="button"
              onClick={() => {
                onSendMessage(draft)
                setDraft('')
              }}
              aria-label="发送消息"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4.8 12.4 18.2 5.7c.7-.3 1.4.3 1.1 1.1l-6.7 13.4c-.3.7-1.4.6-1.5-.2l-.7-5.2-5.2-.7c-.8-.1-.9-1.2-.2-1.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div> : (
        <button
          className="workflow-joyce-rail"
          type="button"
          onClick={onToggleCollapsed}
          aria-label="展开 Joyce AI 面板"
        >
          <span className="workflow-joyce-rail-text">Joyce AI</span>
        </button>
      )}
    </aside>
  )
}
