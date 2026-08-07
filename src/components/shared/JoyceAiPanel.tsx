import {
  createContext,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

export type JoyceChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** 助理消息可选方案；仅当本条为当前对话最后一条时展示为可点选按钮 */
  choices?: string[]
  /** 助理占位：展示思考态，正文与选项可延后出现 */
  isThinking?: boolean
  /**
   * 首页 Plan：工作流采集完成后的结构化气泡（与 text 二选一展示正文）。
   * 保留 `text` 可为空，仅用于兼容或后续导出。
   */
  richBubble?:
    | 'onboarding-workflow-created'
    | 'plan-multi-agent-system-created'
    | 'build-onboarding-flow-plan'
    | 'build-onboarding-build-complete'
  /** Build 入职演示：首段英文「工具思考」轨迹样式 */
  buildIntroTrace?: boolean
  /** Plan/Build 入职工作流首轮：英文规划轨迹，短时播放后由父级替换为中文 Q1 */
  workflowPlannerTrace?: boolean
  /** 首页 Plan（智能体）：首轮在气泡下展示「服务角色 + 关键环节」多选问卷，取代 chip choices */
  planOnboardingDetailQuiz?: boolean
  /** 首页 Plan（入职工作流）：与智能体问卷相同的卡片式 UI，分 scope / collaboration 两轮单选 */
  planWorkflowQuiz?: 'scope' | 'collaboration'
  /**
   * 首页 Build：工作流草案已就绪后的引导气泡内，展示与侧栏 `manus-plan-agent-blueprint-create-btn` 同行为的按钮（文案自定义）。
   */
  blueprintCreateButton?: { label: string; ariaLabel?: string }
}

/** 由父组件托管消息与输入（如首页 Build 会话） */
export type JoyceAiPanelControlledChat = {
  messages: JoyceChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  /** 用户点击助理给出的方案按钮时回调（与在输入框发送该文案等价） */
  onQuickReply?: (text: string) => void
  inputPlaceholder?: string
}

interface JoyceAiPanelProps {
  children: ReactNode
  sectionAriaLabel: string
  /** 未传时与 Agent 库一致：默认折叠 AI */
  defaultCollapsed?: boolean
  /** 受控聊天：与内部欢迎语/演示回复解耦 */
  controlledChat?: JoyceAiPanelControlledChat
  /** 显示在「Joyce AI」标题后的灰色标注 */
  panelTitleSuffix?: string
  /**
   * split：主栏 + 右侧 Joyce 栏（默认）。
   * mainChat：取向 A — 主栏全宽承载 Joyce 对话，右侧栏隐藏，与首页为同一智能体会话。
   */
  dockLayout?: 'split' | 'mainChat'
  /** mainChat 且未浮动时：顶栏左侧显示返回，替代 Joyce 标题与图标 */
  onMainChatBack?: () => void
}

const MIN_PANEL_W = 280
const DEFAULT_PANEL_W = 360
const DEFAULT_FLOAT_H = 520

/** 供分栏页主区（如场景工作区工具栏）唤起侧栏 Joyce：展开停靠面板并退出浮动 */
export type JoyceAiPanelDockContextValue = {
  expand: () => void
  /** 分栏下侧栏是否为折叠条（不含浮动窗） */
  isDockedPanelCollapsed: boolean
}

const JoyceAiPanelDockContext = createContext<JoyceAiPanelDockContextValue | null>(null)

export function useJoyceAiPanelDock(): JoyceAiPanelDockContextValue | null {
  return useContext(JoyceAiPanelDockContext)
}

function clampPanelWidth(w: number) {
  const max = Math.max(MIN_PANEL_W + 40, Math.min(1200, window.innerWidth - 200))
  return Math.min(Math.max(w, MIN_PANEL_W), max)
}

export function JoyceAiPanel({
  children,
  sectionAriaLabel,
  defaultCollapsed,
  controlledChat,
  panelTitleSuffix,
  dockLayout = 'split',
  onMainChatBack,
}: JoyceAiPanelProps) {
  const gradId = `joyce-ai-logo-${useId().replace(/:/g, '')}`

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? true)
  const [widthPx, setWidthPx] = useState(DEFAULT_PANEL_W)
  const [isResizeDragging, setIsResizeDragging] = useState(false)
  const [isFloating, setIsFloating] = useState(false)
  const [floatHeightPx, setFloatHeightPx] = useState(DEFAULT_FLOAT_H)
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 })
  const floatDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const [internalMessages, setInternalMessages] = useState<JoyceChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: '你好，我是 Joyce AI，可在此咨询 Agent 相关问题。' },
  ])
  const [internalChatInput, setInternalChatInput] = useState('')

  const displayMessages = controlledChat?.messages ?? internalMessages
  const chatInput = controlledChat?.input ?? internalChatInput

  const clampFloatHeight = useCallback((h: number) => {
    const min = 200
    const max = Math.max(min + 40, Math.min(window.innerHeight - 16, Math.floor(window.innerHeight * 0.92)))
    return Math.min(Math.max(h, min), max)
  }, [])

  const clampWidth = useCallback((w: number) => clampPanelWidth(w), [])

  const beginFloat = useCallback(() => {
    const w = widthPx
    const h = clampFloatHeight(floatHeightPx)
    setFloatHeightPx(h)
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, window.innerWidth - w - 20))
    const y = Math.max(8, Math.min((window.innerHeight - h) / 2, window.innerHeight - h - 8))
    setFloatPos({ x, y })
    setIsFloating(true)
  }, [widthPx, floatHeightPx, clampFloatHeight])

  const endFloat = useCallback(() => setIsFloating(false), [])

  const onResizeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsResizeDragging(true)
      const startX = event.clientX
      const startW = widthPx
      const onMove = (ev: MouseEvent) => {
        setWidthPx(clampWidth(startW - (ev.clientX - startX)))
      }
      const onUp = () => {
        setIsResizeDragging(false)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [widthPx, clampWidth],
  )

  const onFloatResizeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsResizeDragging(true)
      const startX = event.clientX
      const startW = widthPx
      const startLeft = floatPos.x
      const onMove = (ev: MouseEvent) => {
        const newW = clampWidth(startW - (ev.clientX - startX))
        setWidthPx(newW)
        setFloatPos((p) => ({ x: startLeft + startW - newW, y: p.y }))
      }
      const onUp = () => {
        setIsResizeDragging(false)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [widthPx, floatPos.x, clampWidth],
  )

  const onFloatResizeKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const step = e.shiftKey ? 32 : 8
      const dir = e.key === 'ArrowLeft' ? step : -step
      setWidthPx((w0) => {
        const newW = clampWidth(w0 + dir)
        if (newW !== w0) setFloatPos((p) => ({ x: p.x - (newW - w0), y: p.y }))
        return newW
      })
    },
    [clampWidth],
  )

  const onFloatResizeBottomMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsResizeDragging(true)
      const startY = event.clientY
      const startH = floatHeightPx
      const topY = floatPos.y
      const onMove = (ev: MouseEvent) => {
        const maxByViewport = clampFloatHeight(startH + (ev.clientY - startY))
        const maxByTop = Math.max(200, window.innerHeight - topY - 8)
        setFloatHeightPx(Math.min(maxByViewport, maxByTop))
      }
      const onUp = () => {
        setIsResizeDragging(false)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
    },
    [floatHeightPx, floatPos.y, clampFloatHeight],
  )

  const onFloatResizeBottomKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? (e.shiftKey ? 24 : 8) : -(e.shiftKey ? 24 : 8)
      setFloatHeightPx((h0) => {
        const maxByTop = Math.max(200, window.innerHeight - floatPos.y - 8)
        return Math.min(clampFloatHeight(h0 + dir), maxByTop)
      })
    },
    [floatPos.y, clampFloatHeight],
  )

  const onFloatHeaderMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('button')) return
      event.preventDefault()
      floatDragRef.current = { startX: event.clientX, startY: event.clientY, origX: floatPos.x, origY: floatPos.y }
      const onMove = (ev: MouseEvent) => {
        const d = floatDragRef.current
        if (!d) return
        const w = widthPx
        const h = floatHeightPx
        let nx = d.origX + ev.clientX - d.startX
        let ny = d.origY + ev.clientY - d.startY
        nx = Math.max(8, Math.min(nx, window.innerWidth - w - 8))
        ny = Math.max(8, Math.min(ny, window.innerHeight - h - 8))
        setFloatPos({ x: nx, y: ny })
      }
      const onUp = () => {
        floatDragRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    },
    [floatPos.x, floatPos.y, widthPx, floatHeightPx],
  )

  const sendChat = () => {
    if (controlledChat) {
      controlledChat.onSend()
      return
    }
    const text = chatInput.trim()
    if (!text) return
    const id = `${Date.now()}`
    setInternalMessages((prev) => [
      ...prev,
      { id: `${id}-u`, role: 'user', text },
      { id: `${id}-a`, role: 'assistant', text: '（演示）已收到你的消息。接入后端后可返回真实 AI 回复。' },
    ])
    setInternalChatInput('')
  }

  useEffect(() => {
    const onWinResize = () => setWidthPx((w) => clampWidth(w))
    window.addEventListener('resize', onWinResize)
    return () => window.removeEventListener('resize', onWinResize)
  }, [clampWidth])

  useEffect(() => {
    if (!isFloating) return
    const onResize = () => {
      setFloatHeightPx((h) => {
        const maxByTop = Math.max(200, window.innerHeight - floatPos.y - 8)
        return Math.min(clampFloatHeight(h), maxByTop)
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isFloating, floatPos.y, clampFloatHeight])

  useEffect(() => {
    if (!isFloating) return
    const onResize = () => {
      setFloatPos(({ x, y }) => ({
        x: Math.max(8, Math.min(x, window.innerWidth - widthPx - 8)),
        y: Math.max(8, Math.min(y, window.innerHeight - floatHeightPx - 8)),
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isFloating, widthPx, floatHeightPx])

  useEffect(() => {
    if (!isFloating) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFloating(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFloating])

  const useMainChatLayout = dockLayout === 'mainChat'
  const dockedSplitLayout = !isFloating && !isCollapsed && !useMainChatLayout

  const expandDockedJoycePanel = useCallback(() => {
    setIsFloating(false)
    setIsCollapsed(false)
  }, [])

  const joyceDockContextValue = useMemo<JoyceAiPanelDockContextValue | null>(() => {
    if (dockLayout !== 'split' || useMainChatLayout) return null
    return {
      expand: expandDockedJoycePanel,
      isDockedPanelCollapsed: isCollapsed && !isFloating,
    }
  }, [dockLayout, useMainChatLayout, isCollapsed, isFloating, expandDockedJoycePanel])

  const titleBlock = (
    <div className="agents-ai-panel-title-wrap">
      <span className="agents-ai-panel-title-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradId} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7ec8ff" />
              <stop offset="100%" stopColor="#1e4fd8" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="21" height="21" rx="7" ry="7" fill={`url(#${gradId})`} />
          <polygon points="12,7.2 16.8,12 12,16.8 7.2,12" fill="#ffffff" />
        </svg>
      </span>
      <span className="agents-ai-panel-title">Joyce AI</span>
      {panelTitleSuffix ? (
        <span className="agents-ai-panel-title-suffix">{panelTitleSuffix}</span>
      ) : null}
    </div>
  )

  const messagesAndInput = (
    <>
      <div className="agents-ai-messages" role="log" aria-live="polite">
        {displayMessages.map((m, i) => {
          const isLast = i === displayMessages.length - 1
          const showChoiceChips =
            m.role === 'assistant' &&
            isLast &&
            Boolean(m.choices?.length) &&
            Boolean(controlledChat?.onQuickReply)
          return (
            <div
              key={m.id}
              className={m.role === 'user' ? 'agents-ai-message-turn is-user' : 'agents-ai-message-turn is-assistant'}
            >
              <div className={m.role === 'user' ? 'agents-ai-bubble is-user' : 'agents-ai-bubble is-assistant'}>
                {m.text}
              </div>
              {showChoiceChips ? (
                <div className="agents-ai-choice-chips" role="group" aria-label="可选方案">
                  {m.choices!.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="agents-ai-choice-chip"
                      onClick={() => controlledChat!.onQuickReply!(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <div className="agents-ai-input-row">
        <div className="agents-ai-input-wrap">
          <textarea
            className="agents-ai-input"
            rows={2}
            placeholder={controlledChat?.inputPlaceholder ?? '输入问题…'}
            value={chatInput}
            onChange={(e) =>
              controlledChat ? controlledChat.onInputChange(e.target.value) : setInternalChatInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendChat()
              }
            }}
          />
          <button className="agents-ai-send" type="button" onClick={sendChat}>
            发送
          </button>
        </div>
      </div>
    </>
  )

  const mainChatDocked = useMainChatLayout && !isFloating

  /** 与首页 .composer 同宽（min(760px, 100%)），由外层 body 居中 */
  const mainChatDialogShell = <div className="agents-joyce-main-chat-dialog">{messagesAndInput}</div>

  return (
    <JoyceAiPanelDockContext.Provider value={joyceDockContextValue}>
      <section
        className={
          !isFloating
            ? useMainChatLayout
              ? 'agents-page agents-page--joyce-main-chat'
              : `agents-page agents-page--split${isCollapsed ? ' agents-page--split-ai-collapsed' : ''}`
            : 'agents-page'
        }
        aria-label={sectionAriaLabel}
        style={
          dockedSplitLayout
            ? { gridTemplateColumns: `minmax(0, 1fr) ${clampWidth(widthPx)}px` }
            : undefined
        }
      >
        {mainChatDocked ? (
          <div className="agents-page-main agents-page-main--joyce-main-chat">
            <div className="agents-joyce-main-chat-head">
              {onMainChatBack ? (
                <button
                  type="button"
                  className="agents-joyce-main-chat-back"
                  aria-label="返回首页"
                  title="返回首页"
                  onClick={onMainChatBack}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                    <path
                      d="M19 12H5M12 19l-7-7 7-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                titleBlock
              )}
              <div className="agents-joyce-main-chat-head-actions">
                <button type="button" className="agents-ai-toggle" aria-label="浮动窗口" title="浮动窗口" onClick={beginFloat}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
                    <path
                      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {children ? (
              <div className="agents-joyce-main-chat-with-side">
                <aside className="agents-joyce-main-chat-side" aria-label="智能体草案">
                  {children}
                </aside>
                <div className="agents-joyce-main-chat-body">{mainChatDialogShell}</div>
              </div>
            ) : (
              <div className="agents-joyce-main-chat-body">{mainChatDialogShell}</div>
            )}
          </div>
        ) : (
          <div className="agents-page-main">{children}</div>
        )}

        {!isFloating && !useMainChatLayout ? (
          <aside className={isCollapsed ? 'agents-ai-panel is-collapsed' : 'agents-ai-panel'} aria-label="Joyce AI 对话">
            {!isCollapsed ? (
              <div
                className={isResizeDragging ? 'agents-ai-resize-handle agents-ai-resize-handle--dragging' : 'agents-ai-resize-handle'}
                role="separator"
                aria-orientation="vertical"
                aria-label="调整 AI 面板宽度"
                aria-valuenow={Math.round(widthPx)}
                tabIndex={0}
                onMouseDown={onResizeMouseDown}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault()
                    const step = e.shiftKey ? 32 : 8
                    setWidthPx((w) => clampWidth(w + (e.key === 'ArrowLeft' ? step : -step)))
                  }
                }}
              >
                <div className="agents-ai-resize-grip" role="presentation" aria-hidden="true">
                  <svg className="agents-ai-resize-grip-icon" viewBox="0 0 10 15" width="10" height="15" aria-hidden="true" focusable="false">
                    <circle cx="2.5" cy="2.5" r="1.15" fill="currentColor" />
                    <circle cx="7.5" cy="2.5" r="1.15" fill="currentColor" />
                    <circle cx="2.5" cy="7.5" r="1.15" fill="currentColor" />
                    <circle cx="7.5" cy="7.5" r="1.15" fill="currentColor" />
                    <circle cx="2.5" cy="12.5" r="1.15" fill="currentColor" />
                    <circle cx="7.5" cy="12.5" r="1.15" fill="currentColor" />
                  </svg>
                </div>
              </div>
            ) : null}

            <div className={isCollapsed ? 'agents-ai-panel-head agents-ai-panel-head--rail' : 'agents-ai-panel-head'}>
              {isCollapsed ? (
                <>
                  <button type="button" className="agents-ai-toggle" aria-label="展开 Joyce AI" aria-expanded={false} onClick={() => setIsCollapsed(false)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20">
                      <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="agents-ai-rail-label" aria-hidden="true">Joyce AI</span>
                </>
              ) : (
                <>
                  {titleBlock}
                  <div className="agents-ai-panel-head-actions">
                    <button type="button" className="agents-ai-toggle" aria-label="浮动窗口" title="浮动窗口" onClick={beginFloat}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" className="agents-ai-toggle" aria-label="折叠 Joyce AI" aria-expanded={true} onClick={() => setIsCollapsed(true)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20">
                        <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>

            {!isCollapsed ? messagesAndInput : null}
          </aside>
        ) : null}
      </section>

      {isFloating ? (
        <div
          className="agents-ai-float-root"
          style={{ left: floatPos.x, top: floatPos.y, width: widthPx, height: floatHeightPx }}
        >
          <div
            className="agents-ai-float-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label="调整浮动窗口宽度"
            tabIndex={0}
            onMouseDown={onFloatResizeMouseDown}
            onKeyDown={onFloatResizeKeyDown}
          />
          <aside className="agents-ai-panel agents-ai-panel--floating" aria-label="Joyce AI 对话（浮动）">
            <div className="agents-ai-panel-head agents-ai-panel-head--floating" onMouseDown={onFloatHeaderMouseDown}>
              {titleBlock}
              <button type="button" className="agents-ai-toggle agents-ai-toggle--dock" aria-label="还原到页面侧边" title="还原到侧边" onClick={endFloat}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
                  <path d="M9 4H5v16h4V4zm4 2h8v12h-8V6zM11 12h6M8 8l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {messagesAndInput}
          </aside>
          <div
            className={isResizeDragging ? 'agents-ai-float-bottom-resize agents-ai-float-bottom-resize--dragging' : 'agents-ai-float-bottom-resize'}
            role="separator"
            aria-orientation="horizontal"
            aria-label="调整浮动窗口高度"
            aria-valuenow={Math.round(floatHeightPx)}
            tabIndex={0}
            onMouseDown={onFloatResizeBottomMouseDown}
            onKeyDown={onFloatResizeBottomKeyDown}
          />
        </div>
      ) : null}
    </JoyceAiPanelDockContext.Provider>
  )
}
