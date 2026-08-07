    return (
      <span className="scenario-collect-drawer-option-icon-wrap" aria-hidden="true">
        <svg
          className="scenario-collect-drawer-option-icon scenario-collect-drawer-option-icon--robot"
          viewBox="0 0 24 24"
          width="16"
          height="16"
        >
          <path
            d="M12 3v2M9 4l1 2M15 4l-1 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect
            x="5"
            y="7"
            width="14"
            height="12"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="9.5" cy="12" r="1.25" fill="currentColor" />
          <circle cx="14.5" cy="12" r="1.25" fill="currentColor" />
          <path d="M10 16h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span className="scenario-collect-drawer-option-icon-wrap" aria-hidden="true">
      <svg
        className="scenario-collect-drawer-option-icon scenario-collect-drawer-option-icon--team"
        viewBox="0 0 24 24"
        width="16"
        height="16"
      >
        <circle cx="9" cy="8.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="9.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3.5 20.5v-1a4.5 4.5 0 014.5-4.5h2a4.5 4.5 0 014.5 4.5v1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M13.5 19.5v-.5a3 3 0 013-2.5h.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function createInitialSavedAgentIds(): Record<OnboardingAgentDrawerKey, string> {
  return {
    collect: 'collect',
    account: 'account',
    training: 'training',
    office: 'office',
    master: 'master',
  }
}

function createInitialTaskTexts(): Record<OnboardingAgentDrawerKey, string> {
  return {
    collect: ONBOARDING_COLLECT_DRAWER_TASK_MARKDOWN,
    account: ONBOARDING_ACCOUNT_DRAWER_TASK_MARKDOWN,
    training: ONBOARDING_TRAINING_DRAWER_TASK_MARKDOWN,
    office: ONBOARDING_OFFICE_DRAWER_TASK_MARKDOWN,
    master: ONBOARDING_MASTER_DRAWER_TASK_MARKDOWN,
  }
}

function computeOnboardingWorkflowBounds(
  pos: Record<OnboardingBoardNodeKey, { x: number; y: number }>,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const k of ONBOARDING_BOARD_NODE_KEYS) {
    const p = pos[k]
    const h = WORKFLOW_NODE_HEIGHT[k]
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x + WORKFLOW_NODE_WIDTH)
    maxY = Math.max(maxY, p.y + h)
  }
  return { minX, minY, maxX, maxY }
}

/** 与 `.scenario-workflow-canvas` 的 padding 一致，用于把画布坐标换算到可滚动区域 */
const WORKFLOW_CANVAS_PADDING = 12

/** 视口从主轴第一个仍在画布上的节点开始展示（顶对齐 + 横向居中该节点），避免默认落在整段工作流的几何中心 */
function scrollOnboardingWorkflowToFirstNode(
  vp: HTMLDivElement,
  pos: Record<OnboardingBoardNodeKey, { x: number; y: number }>,
  zoomPercent: number,
  removed: readonly OnboardingBoardNodeKey[],
) {
  if (!Number.isFinite(zoomPercent) || zoomPercent < 1) return
  const z = zoomPercent / 100
  const removedSet = new Set(removed)
  let firstKey: OnboardingBoardNodeKey = ONBOARDING_WORKFLOW_SPINE_ORDER[0]
  for (const k of ONBOARDING_WORKFLOW_SPINE_ORDER) {
    if (!removedSet.has(k)) {
      firstKey = k
      break
    }
  }
  const p = pos[firstKey]
  const vw = vp.clientWidth
  const vh = vp.clientHeight
  const cx = p.x + WORKFLOW_NODE_WIDTH / 2
  const targetLeft = WORKFLOW_CANVAS_PADDING + cx * z - vw / 2
  const targetTop = WORKFLOW_CANVAS_PADDING + p.y * z
  const maxL = Math.max(0, vp.scrollWidth - vw)
  const maxT = Math.max(0, vp.scrollHeight - vh)
  vp.scrollLeft = Math.min(Math.max(0, targetLeft), maxL)
  vp.scrollTop = Math.min(Math.max(0, targetTop), maxT)
}

/** 整块画布小于视口时，用 margin 在四周留白居中（与滚动定位互补） */
function alignWorkflowCanvasMarginsWhenFits(vp: HTMLDivElement) {
  const canvas = vp.querySelector('.scenario-workflow-canvas')
  if (!(canvas instanceof HTMLElement)) return
  const sw = vp.scrollWidth
  const sh = vp.scrollHeight
  const cw = vp.clientWidth
  const ch = vp.clientHeight
  if (sw <= cw + 1 && sh <= ch + 1) {
    canvas.style.marginLeft = `${Math.max(0, (cw - sw) / 2)}px`
    canvas.style.marginTop = `${Math.max(0, (ch - sh) / 2)}px`
  } else {
    canvas.style.marginLeft = ''
    canvas.style.marginTop = ''
  }
}

function onboardingWorkflowEdgePath(
  from: OnboardingBoardNodeKey,
  to: OnboardingBoardNodeKey,
  pos: Record<OnboardingBoardNodeKey, { x: number; y: number }>,
): string {
  const x1 = pos[from].x + WORKFLOW_NODE_WIDTH / 2
  const y1 = pos[from].y + WORKFLOW_NODE_HEIGHT[from]
  const x2 = pos[to].x + WORKFLOW_NODE_WIDTH / 2
  const y2 = pos[to].y
  const dy = y2 - y1
  const sign = dy >= 0 ? 1 : -1
  const h = Math.max(28, Math.min(180, Math.abs(dy) * 0.48))
  const cy1 = y1 + sign * h
  const cy2 = y2 - sign * h
  return `M ${x1} ${y1} C ${x1} ${cy1} ${x2} ${cy2} ${x2} ${y2}`
}

function onboardingWorkflowStepIcon(key: OnboardingStepIconKey) {
  if (key === 'master') {
    return (
      <svg
        className="scenario-workflow-card-icon-svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <circle cx="12" cy="7" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.35" />
        <path
          d="M6.5 17.5h11M8 17.5l1.8-5.2M12 10.2V17M16 17.5l-1.8-5.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6.5" cy="18.5" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.35" />
        <circle cx="12" cy="18.5" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.35" />
        <circle cx="17.5" cy="18.5" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.35" />
      </svg>
    )
  }
  if (key === 'collect') {
    return (
      <svg
        className="scenario-workflow-card-icon-svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          d="M9 2h6l1 2h3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h3l1-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M9 10h10M9 14h7M9 18h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (key === 'account') {
    return (
      <svg
        className="scenario-workflow-card-icon-svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M5.5 19.5c1.2-3 4.2-5 6.5-5s5.3 2 6.5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M17 11h3.5a1 1 0 011 1V19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (key === 'training') {
    return (
      <svg
        className="scenario-workflow-card-icon-svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          d="M4 7l8-3 8 3v10l-8 3-8-3V7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M12 11v9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  if (key === 'office') {
    return (
      <svg
        className="scenario-workflow-card-icon-svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          d="M4 20V9l8-4 8 4v11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M9 20v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M4 13h16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg
      className="scenario-workflow-card-icon-svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 7.4V10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 10.5c-2.6 0-4.7 1.9-4.7 4.3V18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 10.5c2.6 0 4.7 1.9 4.7 4.3V18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="7.3" cy="18.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16.7" cy="18.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/** 「+ New」菜单项图标：与工作区节点卡片同一套 SVG 与 icon-wrap 样式 */
function workspaceNewNodeMenuIcon(kind: WorkspaceNewNodeKind): React.JSX.Element | null {
  switch (kind) {
    case 'manual':
      return (
        <span
          className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--manual scenario-workspace-newnode-item-icon"
          aria-hidden="true"
        >
          <svg className="scenario-workflow-card-icon-svg" viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </span>
      )
    case 'trigger':
      /* 与画布 Trigger 节点「入职启动」卡片主区域 head-icon 一致 */
      return (
        <span
          className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--trigger-rich scenario-workspace-newnode-item-icon"
          aria-hidden="true"
        >
          <svg className="scenario-workflow-card-icon-svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="#ffffff" stroke="#d4c4fc" strokeWidth="1.25" />
            <circle cx="8" cy="9.5" r="1.15" fill="#7c3aed" />
            <path
              d="M11 9h9M11 13h9M11 17h6"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )
    case 'agent':
      return (
        <span
          className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--collect scenario-workspace-newnode-item-icon"
          aria-hidden="true"
        >
          {onboardingWorkflowStepIcon('collect')}
        </span>
      )
    case 'orchestration':
      return (
        <span
          className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--master scenario-workspace-newnode-item-icon"
          aria-hidden="true"
        >
          {onboardingWorkflowStepIcon('master')}
        </span>
      )
    case 'branch':
      return (
        <span
          className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--branch scenario-workspace-newnode-item-icon"
          aria-hidden="true"
        >
          {onboardingWorkflowStepIcon('branch')}
        </span>
      )
    default:
      return null
  }
}

/** 画布「条件分支」节点：标签页 + 规则条说明 / Add step */
function ScenarioWorkflowBranchCanvasCard({
  idPrefix,
  onRuleBarClick,
}: {
  idPrefix: string
  /** 点击规则条「Add rule」时打开左侧路径规则抽屉 */
  onRuleBarClick?: (detail: { pathIndex: number; pathLetter: string }) => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [branchCount, setBranchCount] = useState(2)

  const tabSuffix = (i: number) => {
    if (i === 0) return 'If'
    if (i === 1) return 'Else'
    return 'Elif'
  }

  const ruleBarCaption = (pathIndex: number) => {
    if (pathIndex === 0) return '当条件成立时'
    if (pathIndex === 1) return '当未选择其他分支时'
    return '当扩展条件成立时'
  }

  return (
    <div className="scenario-workflow-branch-canvas" role="group" aria-label="条件分支">
      <div className="scenario-workflow-branch-canvas-tabs" role="tablist" aria-label="分支">
        {Array.from({ length: branchCount }, (_, i) => {
          const letter = String.fromCharCode(65 + i)
          const active = activeIdx === i
          return (
            <button
              key={i}
              type="button"
              role="tab"
              id={`${idPrefix}-branch-tab-${i}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={
                active
                  ? 'scenario-workflow-branch-canvas-tab scenario-workflow-branch-canvas-tab--active'
                  : 'scenario-workflow-branch-canvas-tab'
              }
              onClick={() => setActiveIdx(i)}
            >
              <span className="scenario-workflow-branch-canvas-tab-mark">{letter}</span>
              <span className="scenario-workflow-branch-canvas-tab-sep" aria-hidden="true">
                •
              </span>
              <span className="scenario-workflow-branch-canvas-tab-suffix">{tabSuffix(i)}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="scenario-workflow-branch-canvas-tab-add"
          aria-label="添加分支"
          disabled={branchCount >= 8}
          onClick={() => {
            setBranchCount((n) => {
              if (n >= 8) return n
              setActiveIdx(n)
              return n + 1
            })
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
            />
          </svg>
        </button>
      </div>
      <div
        className="scenario-workflow-branch-canvas-panel"
        role="tabpanel"
        id={`${idPrefix}-branch-panel`}
        aria-labelledby={`${idPrefix}-branch-tab-${activeIdx}`}
      >
        <button
          type="button"
          className="scenario-workflow-branch-canvas-rulebar"
          aria-label={`路径 ${String.fromCharCode(65 + activeIdx)}：${ruleBarCaption(activeIdx)}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() =>
            onRuleBarClick?.({
              pathIndex: activeIdx,
              pathLetter: String.fromCharCode(65 + activeIdx),
            })
          }
        >
          <span className="scenario-workflow-branch-canvas-rule-idx" aria-hidden="true">
            {activeIdx + 1}
          </span>
          <span className="scenario-workflow-branch-canvas-rule-label">{ruleBarCaption(activeIdx)}</span>
        </button>
        <div className="scenario-workflow-branch-canvas-body">
          <button type="button" className="scenario-workflow-branch-canvas-add-step">
            <svg
              className="scenario-workflow-branch-canvas-add-step-ic"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span>Add step</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function Home() {
  const tabListId = useId()
  const planTabId = `${tabListId}-plan`
  const buildTabId = `${tabListId}-build`
  const panelId = `${tabListId}-panel`
  const joyceAiLogoGradId = `joyce-ai-logo-${tabListId.replace(/:/g, '')}`
  const runSearchInputId = `${tabListId}-run-search`

  type RunHistoryItem = { id: string; name: string; status: 'warn' | 'ok' }

  const [runHistoryItems] = useState<RunHistoryItem[]>([
    { id: '1', name: 'Employee Onboarding New ...', status: 'warn' },
    { id: '2', name: 'Employee Onboarding Jinny...', status: 'ok' },
  ])
  const [runSearchOpen, setRunSearchOpen] = useState(false)
  const [runSearchQuery, setRunSearchQuery] = useState('')
  const [selectedScenarioName, setSelectedScenarioName] = useState<string | null>(null)
  const [editingScenarioName, setEditingScenarioName] = useState<string | null>(null)
  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)
  const [workspaceCanvasZoom, setWorkspaceCanvasZoom] = useState(DEFAULT_WORKSPACE_CANVAS_ZOOM)
  const [workspaceNewNodeMenuOpen, setWorkspaceNewNodeMenuOpen] = useState(false)
  const workspaceNewNodeWrapRef = useRef<HTMLSpanElement>(null)
  const [workspaceExtraNodes, setWorkspaceExtraNodes] = useState<WorkspaceExtraNode[]>([])
  const workspaceExtraNodesRef = useRef(workspaceExtraNodes)
  const workspaceExtraIdSeqRef = useRef(1)
  const [scenarioWorkspaceMode, setScenarioWorkspaceMode] = useState<'editor' | 'runs'>('editor')
  const [onboardingTriggerAccentOpen, setOnboardingTriggerAccentOpen] = useState(false)
  /** 工作区用户新增节点：点击后保持左侧蓝条高亮（与 rich Trigger 的 accent-on 一致） */
  const [workspaceExtraNodeAccentOpenId, setWorkspaceExtraNodeAccentOpenId] = useState<string | null>(null)
  /** 当前打开的 Agent 配置抽屉（与画布五类可配置节点一一对应） */
  const [onboardingAgentDrawerKey, setOnboardingAgentDrawerKey] = useState<OnboardingAgentDrawerKey | null>(
    null,
  )
  const [onboardingCollectTaskModalOpen, setOnboardingCollectTaskModalOpen] = useState(false)
  const [onboardingCollectOptimizeModalOpen, setOnboardingCollectOptimizeModalOpen] = useState(false)
  const [collectOptimizePhase, setCollectOptimizePhase] = useState<'thinking' | 'streaming' | 'done'>(
    'thinking',
  )
  const [collectOptimizeStreamText, setCollectOptimizeStreamText] = useState('')
  const [collectOptimizeFooterInput, setCollectOptimizeFooterInput] = useState('')
  const [collectOptimizeStreamRunId, setCollectOptimizeStreamRunId] = useState(0)
  const collectOptimizeActiveLinesRef = useRef<string[]>([...ONBOARDING_OPTIMIZE_LINES])
  const optimizeStreamTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const collectOptimizeTimersRef = useRef<{ t?: number; i?: number }>({})
  const [taskTextByNode, setTaskTextByNode] = useState(createInitialTaskTexts)
  /** 抽屉内当前编辑的代理人选项（随打开抽屉从 saved 同步） */
  const [agentDrawerDraftId, setAgentDrawerDraftId] = useState('collect')
  /** 各节点上次「保存」的代理人 id，驱动画布标题 */
  const [savedAgentIdByNode, setSavedAgentIdByNode] = useState(createInitialSavedAgentIds)
  const collectTaskModalOpenSnapshotRef = useRef<string>(ONBOARDING_COLLECT_DRAWER_TASK_MARKDOWN)
  const collectTaskModalIsOpenRef = useRef(false)
  const onboardingAgentDrawerKeyRef = useRef<OnboardingAgentDrawerKey | null>(null)
  const savedAgentIdByNodeRef = useRef(savedAgentIdByNode)
  const agentComboboxWrapRef = useRef<HTMLDivElement | null>(null)
  const collectTaskFileInputRef = useRef<HTMLInputElement | null>(null)
  const [agentComboboxOpen, setAgentComboboxOpen] = useState(false)
  /** 从代理人「共同版块」进入的空白详情页（全屏覆盖） */
  const [agentDetailBlankPageOpen, setAgentDetailBlankPageOpen] = useState(false)
  /** 打开当前抽屉时画布上已生效的代理人 id，用于取消/关闭时回滚（下拉会立即写入 saved） */
  const savedAgentIdAtDrawerOpenRef = useRef<string | null>(null)
  const [onboardingNodePos, setOnboardingNodePos] = useState(DEFAULT_ONBOARDING_NODE_POS)
  /** 画布上已从演示流程中移除的内置节点（连线同步隐藏） */
  const [removedOnboardingKeys, setRemovedOnboardingKeys] = useState<OnboardingBoardNodeKey[]>([])
  const onboardingNodePosRef = useRef(onboardingNodePos)
  /** 下一动态路径 id 序号（与默认 branch-path-0…2 错开） */
  const branchPathIdSeqRef = useRef(DEFAULT_BRANCH_PATH_SLOTS)
  /** 仅「条件分支」节点：左侧无遮罩配置抽屉 */
  const [branchDrawerOpen, setBranchDrawerOpen] = useState(false)
  /** 画布条件分支卡片上点击「Add rule」：左侧路径规则面板（无全屏遮罩，与 Build 区 flex 并排） */
  const [branchCanvasPathRulesOpen, setBranchCanvasPathRulesOpen] = useState(false)
  const [branchCanvasPathRulesIndex, setBranchCanvasPathRulesIndex] = useState(0)
  /** 路径规则「触发条件」下拉的选项（与产品稿一致：No other path is matching / Rules match） */
  const [branchPathRulesTriggerOpen, setBranchPathRulesTriggerOpen] = useState(false)
  const [branchPathRulesTriggerMode, setBranchPathRulesTriggerMode] = useState<
    'noOther' | 'rulesMatch'
  >('rulesMatch')
  const branchPathRulesSelectWrapRef = useRef<HTMLDivElement>(null)
  /** 画布上内置条件分支节点已保存的配置（与新增节点表单分离） */
  const [canvasBranchLogicText, setCanvasBranchLogicText] = useState(DEFAULT_BRANCH_LOGIC_TEXT)
  const [canvasBranchPaths, setCanvasBranchPaths] = useState<BranchPathDraft[]>(() => defaultBranchPathsForCanvas())
  const canvasBranchLogicTextRef = useRef(DEFAULT_BRANCH_LOGIC_TEXT)
  const canvasBranchPathsRef = useRef<BranchPathDraft[]>(defaultBranchPathsForCanvas())
  /** 当前抽屉编辑的是画布内置分支（null）还是某一新增分支节点 id */
  const [branchDrawerExtraId, setBranchDrawerExtraId] = useState<string | null>(null)
  const branchDrawerExtraIdRef = useRef<string | null>(null)
  const [branchLogicText, setBranchLogicText] = useState(DEFAULT_BRANCH_LOGIC_TEXT)
  const [branchPaths, setBranchPaths] = useState<BranchPathDraft[]>(() => defaultBranchPathsForCanvas())
  const branchFormSnapshotRef = useRef<{ logic: string; paths: BranchPathDraft[] } | null>(null)
  const branchLogicTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const branchMentionWrapRef = useRef<HTMLDivElement | null>(null)
  const [branchMentionOpen, setBranchMentionOpen] = useState(false)
  const [branchLogicModalOpen, setBranchLogicModalOpen] = useState(false)
  const branchLogicModalSnapshotRef = useRef('')
  const [branchPathDescModalPathId, setBranchPathDescModalPathId] = useState<string | null>(null)
  const branchPathDescModalPathIdRef = useRef<string | null>(null)
  const branchPathDescModalSnapshotRef = useRef('')

  useEffect(() => {
    if (!branchDrawerOpen) {
      setBranchLogicModalOpen(false)
      branchPathDescModalPathIdRef.current = null
      setBranchPathDescModalPathId(null)
    }
  }, [branchDrawerOpen])

  useEffect(() => {
    canvasBranchLogicTextRef.current = canvasBranchLogicText
  }, [canvasBranchLogicText])
  useEffect(() => {
    canvasBranchPathsRef.current = canvasBranchPaths
  }, [canvasBranchPaths])
  useEffect(() => {
    branchDrawerExtraIdRef.current = branchDrawerExtraId
  }, [branchDrawerExtraId])

  const handleBranchMentionPick = useCallback(
    (item: { label: string }) => {
      const ta = branchLogicTextareaRef.current
      const token = `@${item.label} `
      if (!ta) {
        setBranchLogicText((v) => `${v}${token}`)
        setBranchMentionOpen(false)
        return
      }
      const v = branchLogicText
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const before = v.slice(0, start)
      const after = v.slice(end)
      let nv: string
      let caret: number
      if (start === end && start > 0 && v[start - 1] === '@') {
        nv = v.slice(0, start - 1) + token + after
        caret = start - 1 + token.length
      } else {
        nv = before + token + after
        caret = before.length + token.length
      }
      flushSync(() => {
        setBranchLogicText(nv)
      })
      ta.focus()
      ta.setSelectionRange(caret, caret)
      setBranchMentionOpen(false)
    },
    [branchLogicText],
  )

  const handleBranchLogicTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    const pos = e.target.selectionStart ?? v.length
    setBranchLogicText(v)
    if (pos > 0 && v[pos - 1] === '@') {
      if (pos >= 2 && v[pos - 2] === '@') return
      const prev = pos >= 2 ? v[pos - 2] : ' '
      if (pos === 1 || /\s/.test(prev)) {
        setBranchMentionOpen(true)
      }
    }
  }, [])

  const openBranchLogicExpandModal = useCallback(() => {
    branchPathDescModalPathIdRef.current = null
    setBranchPathDescModalPathId(null)
    branchLogicModalSnapshotRef.current = branchLogicText
    setBranchLogicModalOpen(true)
  }, [branchLogicText])

  const closeBranchLogicModalSave = useCallback(() => {
    setBranchLogicModalOpen(false)
  }, [])

  const closeBranchLogicModalCancel = useCallback(() => {
    setBranchLogicText(branchLogicModalSnapshotRef.current)
    setBranchLogicModalOpen(false)
  }, [])

  const openBranchPathDescModal = useCallback(
    (pathId: string) => {
      const path = branchPaths.find((x) => x.id === pathId)
      if (!path) return
      setBranchLogicModalOpen(false)
      branchPathDescModalSnapshotRef.current = path.description
      branchPathDescModalPathIdRef.current = pathId
      setBranchPathDescModalPathId(pathId)
    },
    [branchPaths],
  )

  const closeBranchPathDescModalSave = useCallback(() => {
    branchPathDescModalPathIdRef.current = null
    setBranchPathDescModalPathId(null)
  }, [])

  const closeBranchPathDescModalCancel = useCallback(() => {
    const id = branchPathDescModalPathIdRef.current
    if (id != null) {
      const snap = branchPathDescModalSnapshotRef.current
      setBranchPaths((paths) =>
        paths.map((x) => (x.id === id ? { ...x, description: snap } : x)),
      )
    }
    branchPathDescModalPathIdRef.current = null
    setBranchPathDescModalPathId(null)
  }, [])

  const handleBranchDrawerCancel = useCallback(() => {
    const snap = branchFormSnapshotRef.current
    if (snap) {
      setBranchLogicText(snap.logic)
      setBranchPaths(snap.paths.map((p) => ({ ...p })))
    }
    setBranchMentionOpen(false)
    setBranchLogicModalOpen(false)
    branchPathDescModalPathIdRef.current = null
    setBranchPathDescModalPathId(null)
    setBranchDrawerExtraId(null)
    setBranchDrawerOpen(false)
  }, [])

  const openBranchCanvasPathRules = useCallback(
    (detail: { pathIndex: number; pathLetter: string }) => {
      void detail.pathLetter
      setBranchCanvasPathRulesIndex(detail.pathIndex)
      setBranchCanvasPathRulesOpen(true)
      setBranchDrawerOpen(false)
    },
    [],
  )

  const closeBranchCanvasPathRules = useCallback(() => {
    setBranchPathRulesTriggerOpen(false)
    setBranchCanvasPathRulesOpen(false)
  }, [])

  useEffect(() => {
    if (!branchCanvasPathRulesOpen) return
    setBranchPathRulesTriggerMode(branchCanvasPathRulesIndex === 1 ? 'noOther' : 'rulesMatch')
    setBranchPathRulesTriggerOpen(false)
  }, [branchCanvasPathRulesIndex, branchCanvasPathRulesOpen])

  useEffect(() => {
    if (!branchPathRulesTriggerOpen) return
    const onDoc = (e: MouseEvent) => {
      const el = branchPathRulesSelectWrapRef.current
      if (el && !el.contains(e.target as Node)) setBranchPathRulesTriggerOpen(false)
    }
    document.addEventListener('mousedown', onDoc, true)
    return () => document.removeEventListener('mousedown', onDoc, true)
  }, [branchPathRulesTriggerOpen])

  useEffect(() => {
    if (!branchCanvasPathRulesOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setBranchPathRulesTriggerOpen((open) => {
        if (open) return false
        setBranchCanvasPathRulesOpen(false)
        return false
      })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [branchCanvasPathRulesOpen])

  const handleBranchDrawerSave = useCallback(() => {
    if (branchDrawerExtraId) {
      setWorkspaceExtraNodes((nodes) =>
        nodes.map((node) =>
          node.id === branchDrawerExtraId
            ? {
                ...node,
                branchLogicText: branchLogicText,
                branchPaths: branchPaths.map((p) => ({ ...p })),
              }
            : node,
        ),
      )
    } else {
      setCanvasBranchLogicText(branchLogicText)
      setCanvasBranchPaths(branchPaths.map((p) => ({ ...p })))
    }
    branchFormSnapshotRef.current = {
      logic: branchLogicText,
      paths: branchPaths.map((p) => ({ ...p })),
    }
    setBranchMentionOpen(false)
    setBranchLogicModalOpen(false)
    branchPathDescModalPathIdRef.current = null
    setBranchPathDescModalPathId(null)
    setBranchDrawerExtraId(null)
    setBranchDrawerOpen(false)
  }, [branchDrawerExtraId, branchLogicText, branchPaths])

  useEffect(() => {
    if (!branchMentionOpen) return
    const onDoc = (ev: MouseEvent) => {
      const w = branchMentionWrapRef.current
      if (w && !w.contains(ev.target as Node)) setBranchMentionOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setBranchMentionOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [branchMentionOpen])

  useEffect(() => {
    if (!workspaceNewNodeMenuOpen) return
    const onDoc = (ev: MouseEvent) => {
      const w = workspaceNewNodeWrapRef.current
      if (w && !w.contains(ev.target as Node)) setWorkspaceNewNodeMenuOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setWorkspaceNewNodeMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [workspaceNewNodeMenuOpen])

  const addWorkspaceNodeFromMenu = useCallback(
    (kind: WorkspaceNewNodeKind) => {
      const h = WORKSPACE_NEW_NODE_HEIGHT[kind]
      const vp = workflowViewportRef.current
      const idx = workspaceExtraNodesRef.current.length
      const { x, y } = boardCoordsForNewWorkspaceNode(vp, workspaceCanvasZoom, WORKFLOW_NODE_WIDTH, h, idx)
      const id = `ws-${workspaceExtraIdSeqRef.current++}`
      setWorkspaceExtraNodes((prev) => {
        if (kind === 'branch') {
          const branchPaths = defaultBranchPathsForUserAddedNode(
            () => `branch-path-${branchPathIdSeqRef.current++}`,
          )
          return [
            ...prev,
            {
              id,
              kind,
              x,
              y,
              branchPaths,
            },
          ]
        }
        return [...prev, { id, kind, x, y }]
      })
      setWorkspaceNewNodeMenuOpen(false)
    },
    [workspaceCanvasZoom],
  )

  const closeCollectTaskModalSave = useCallback(() => {
    setOnboardingCollectTaskModalOpen(false)
  }, [])

  const handleCollectTaskFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files?.length) return
    const k = onboardingAgentDrawerKeyRef.current
    if (!k) return
    const names = Array.from(files)
      .map((f) => f.name)
      .join('、')
    const line = `\n\n[附件：${names}]`
    setTaskTextByNode((prev) => ({
      ...prev,
      [k]: `${prev[k]}${line}`,
    }))
    e.target.value = ''
  }, [])

  const revertAgentSelectionToSnapshot = useCallback(() => {
    const k = onboardingAgentDrawerKeyRef.current
    const snap = savedAgentIdAtDrawerOpenRef.current
    if (!k || snap == null) return
    const restored = clampAgentIdForDrawer(k, snap)
    setSavedAgentIdByNode((p) => ({ ...p, [k]: restored }))
    setAgentDrawerDraftId(restored)
  }, [])

  const closeCollectTaskModalCancel = useCallback(() => {
    const key = onboardingAgentDrawerKeyRef.current
    if (key) {
      setTaskTextByNode((prev) => ({
        ...prev,
        [key]: collectTaskModalOpenSnapshotRef.current,
      }))
    }
    setOnboardingCollectTaskModalOpen(false)
  }, [])

  useEffect(() => {
    onboardingNodePosRef.current = onboardingNodePos
  }, [onboardingNodePos])

  useEffect(() => {
    workspaceExtraNodesRef.current = workspaceExtraNodes
  }, [workspaceExtraNodes])

  useEffect(() => {
    collectTaskModalIsOpenRef.current = onboardingCollectTaskModalOpen
  }, [onboardingCollectTaskModalOpen])

  useEffect(() => {
    onboardingAgentDrawerKeyRef.current = onboardingAgentDrawerKey
  }, [onboardingAgentDrawerKey])

  useEffect(() => {
    savedAgentIdByNodeRef.current = savedAgentIdByNode
  }, [savedAgentIdByNode])

  /** 切换抽屉节点或画布已保存代理人变化时，草稿与当前节点 saved 对齐（下拉会同时写 saved + draft） */
  useEffect(() => {
    if (!onboardingAgentDrawerKey) {
      savedAgentIdAtDrawerOpenRef.current = null
      return
    }
    const k = onboardingAgentDrawerKey
    const saved = savedAgentIdByNode[k]
    savedAgentIdAtDrawerOpenRef.current = saved
    setAgentDrawerDraftId(clampAgentIdForDrawer(k, saved))
  }, [onboardingAgentDrawerKey, savedAgentIdByNode])

  useEffect(() => {
    if (!onboardingAgentDrawerKey) setAgentComboboxOpen(false)
  }, [onboardingAgentDrawerKey])

  useEffect(() => {
    if (!agentComboboxOpen) return
    const onDoc = (ev: MouseEvent) => {
      const w = agentComboboxWrapRef.current
      if (w && !w.contains(ev.target as Node)) setAgentComboboxOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setAgentComboboxOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [agentComboboxOpen])

  useEffect(() => {
    if (selectedScenarioName !== '新员工入职') {
      setOnboardingTriggerAccentOpen(false)
      setWorkspaceExtraNodeAccentOpenId(null)
      if (collectTaskModalIsOpenRef.current) {
        const key = onboardingAgentDrawerKeyRef.current
        if (key) {
          setTaskTextByNode((prev) => ({
            ...prev,
            [key]: collectTaskModalOpenSnapshotRef.current,
          }))
        }
      }
      setOnboardingAgentDrawerKey(null)
      setOnboardingCollectTaskModalOpen(false)
      setOnboardingCollectOptimizeModalOpen(false)
      setAgentComboboxOpen(false)
      setAgentDetailBlankPageOpen(false)
      setAgentDrawerDraftId('collect')
      setSavedAgentIdByNode(createInitialSavedAgentIds())
      setTaskTextByNode(createInitialTaskTexts())
      setOnboardingNodePos({ ...DEFAULT_ONBOARDING_NODE_POS })
      setRemovedOnboardingKeys([])
      setWorkspaceExtraNodes([])
      workspaceExtraIdSeqRef.current = 1
      setScenarioWorkspaceMode('editor')
      setBranchDrawerOpen(false)
      setBranchMentionOpen(false)
      setBranchLogicModalOpen(false)
      branchPathDescModalPathIdRef.current = null
      setBranchPathDescModalPathId(null)
      setBranchDrawerExtraId(null)
      setCanvasBranchLogicText(DEFAULT_BRANCH_LOGIC_TEXT)
      setCanvasBranchPaths(defaultBranchPathsForCanvas())
      setBranchLogicText(DEFAULT_BRANCH_LOGIC_TEXT)
      branchPathIdSeqRef.current = DEFAULT_BRANCH_PATH_SLOTS
      setBranchPaths(defaultBranchPathsForCanvas())
      setWorkspaceNewNodeMenuOpen(false)
    }
  }, [selectedScenarioName])

  useEffect(() => {
    const anyModalOpen =
      onboardingCollectTaskModalOpen ||
      onboardingCollectOptimizeModalOpen ||
      branchLogicModalOpen ||
      branchPathDescModalPathId != null
    if (!anyModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (branchPathDescModalPathId != null) {
        const id = branchPathDescModalPathIdRef.current
        if (id != null) {
          const snap = branchPathDescModalSnapshotRef.current
          setBranchPaths((paths) =>
            paths.map((x) => (x.id === id ? { ...x, description: snap } : x)),
          )
        }
        branchPathDescModalPathIdRef.current = null
        setBranchPathDescModalPathId(null)
        return
      }
      if (branchLogicModalOpen) {
        setBranchLogicText(branchLogicModalSnapshotRef.current)
        setBranchLogicModalOpen(false)
        return
      }
      if (onboardingCollectOptimizeModalOpen) {
        setOnboardingCollectOptimizeModalOpen(false)
        return
      }
      const key = onboardingAgentDrawerKeyRef.current
      if (key) {
        setTaskTextByNode((prev) => ({
          ...prev,
          [key]: collectTaskModalOpenSnapshotRef.current,
        }))
      }
      setOnboardingCollectTaskModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [
    onboardingCollectTaskModalOpen,
    onboardingCollectOptimizeModalOpen,
    branchLogicModalOpen,
    branchPathDescModalPathId,
  ])

  useEffect(() => {
    if (!onboardingCollectOptimizeModalOpen) {
      if (collectOptimizeTimersRef.current.t) clearTimeout(collectOptimizeTimersRef.current.t)
      if (collectOptimizeTimersRef.current.i) clearInterval(collectOptimizeTimersRef.current.i)
      collectOptimizeTimersRef.current = {}
      return
    }
    setCollectOptimizePhase('thinking')
    setCollectOptimizeStreamText('')
    setCollectOptimizeFooterInput('')
    collectOptimizeTimersRef.current.t = window.setTimeout(() => {
      setCollectOptimizePhase('streaming')
      const fullTarget = collectOptimizeActiveLinesRef.current.join('\n')
      let streamPos = 0
      const tick = () => {
        const len = fullTarget.length
        if (streamPos >= len) {
          if (collectOptimizeTimersRef.current.i) {
            clearInterval(collectOptimizeTimersRef.current.i)
            collectOptimizeTimersRef.current.i = undefined
          }
          setCollectOptimizeStreamText(fullTarget)
          setCollectOptimizePhase('done')
          return
        }
        const remaining = len - streamPos
        const stride =
          remaining > 8000 ? 18 : remaining > 4000 ? 12 : remaining > 1500 ? 8 : remaining > 400 ? 5 : 2
        streamPos = Math.min(len, streamPos + stride)
        setCollectOptimizeStreamText(fullTarget.slice(0, streamPos))
        if (streamPos >= len) {
          if (collectOptimizeTimersRef.current.i) {
            clearInterval(collectOptimizeTimersRef.current.i)
            collectOptimizeTimersRef.current.i = undefined
          }
          setCollectOptimizePhase('done')
        }
      }
      collectOptimizeTimersRef.current.i = window.setInterval(tick, 22)
      tick()
    }, 2000)
    return () => {
      if (collectOptimizeTimersRef.current.t) clearTimeout(collectOptimizeTimersRef.current.t)
      if (collectOptimizeTimersRef.current.i) clearInterval(collectOptimizeTimersRef.current.i)
      collectOptimizeTimersRef.current = {}
    }
  }, [onboardingCollectOptimizeModalOpen, collectOptimizeStreamRunId])

  useEffect(() => {
    if (!onboardingCollectOptimizeModalOpen) return
    if (collectOptimizePhase !== 'streaming' && collectOptimizePhase !== 'done') return
    const el = optimizeStreamTextareaRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [collectOptimizeStreamText, collectOptimizePhase, onboardingCollectOptimizeModalOpen])

  const handleOptimizeRegenerate = useCallback(() => {
    const nextSrc = randomTweakOptimizeMarkdown(collectOptimizeStreamText)
    collectOptimizeActiveLinesRef.current = nextSrc.split(/\r?\n/)
    setCollectOptimizeStreamRunId((n) => n + 1)
  }, [collectOptimizeStreamText])

  const handleOptimizeApplyToDrawer = useCallback(() => {
    const key = onboardingAgentDrawerKeyRef.current
    if (key) {
      setTaskTextByNode((prev) => ({
        ...prev,
        [key]: collectOptimizeStreamText,
      }))
    }
    setOnboardingCollectOptimizeModalOpen(false)
  }, [collectOptimizeStreamText])

  const filteredRunHistory = useMemo(() => {
    const q = runSearchQuery.trim().toLowerCase()
    if (!q) return runHistoryItems
    return runHistoryItems.filter((r) => r.name.toLowerCase().includes(q))
  }, [runHistoryItems, runSearchQuery])

  const [mode, setMode] = useState<'plan' | 'build'>('plan')
  const [prompt, setPrompt] = useState('')
  const isComposerActive = prompt.trim().length > 0
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [activePage, setActivePage] = useState<
    'home' | 'agent-library' | 'scenarios' | 'experience' | 'analytics'
  >('home')
  const [agentsTab, setAgentsTab] = useState<'all' | 'single' | 'managerial'>('all')
  const [scenariosTab, setScenariosTab] = useState<'all' | 'medical' | 'finance' | 'tech' | 'accounting'>('all')
  const [openAgentMenu, setOpenAgentMenu] = useState<string | null>(null)
  const [isRunsExpanded, setIsRunsExpanded] = useState(true)
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(true)
  const [aiPanelWidthPx, setAiPanelWidthPx] = useState(360)
  const [isAiResizeDragging, setIsAiResizeDragging] = useState(false)

  const workflowViewportRef = useRef<HTMLDivElement>(null)

  const clearWorkflowCanvasMargins = useCallback(() => {
    const el = workflowViewportRef.current
    const c = el?.querySelector('.scenario-workflow-canvas')
    if (c instanceof HTMLElement) {
      c.style.marginLeft = ''
      c.style.marginTop = ''
    }
  }, [])
  const workflowPanRef = useRef<{
    active: boolean
    pointerId: number | null
    startX: number
    startY: number
    scrollLeft: number
    scrollTop: number
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })

  const fitOnboardingWorkflowToViewport = useCallback(() => {
    const el = workflowViewportRef.current
    if (!el) return
    clearWorkflowCanvasMargins()
    const pos = onboardingNodePosRef.current
    const b = computeOnboardingWorkflowBounds(pos)
    /** 节点包络外留白（过大时自适应缩放会偏小，工作流在视口里显得小） */
    const margin = 24
    const contentW = b.maxX - b.minX + 2 * margin
    const contentH = b.maxY - b.minY + 2 * margin
    const vw = el.clientWidth
    const vh = el.clientHeight
    if (vw < 48 || vh < 48 || contentW < 16 || contentH < 16) return
    const availW = Math.max(80, vw - WORKFLOW_CANVAS_PADDING * 2)
    const availH = Math.max(80, vh - WORKFLOW_CANVAS_PADDING * 2)
    /** 与「整段适配」取较大值：默认保持放大后的节点尺寸；必要时出现滚动条 */
    const rawFitZoom = Math.min(availW / contentW, availH / contentH) * 100
    const nextZoom = Math.round(
      Math.min(300, Math.max(50, Math.max(DEFAULT_WORKSPACE_CANVAS_ZOOM, rawFitZoom))),
    )
    if (!Number.isFinite(nextZoom) || nextZoom < 50) return
    flushSync(() => {
      setWorkspaceCanvasZoom(nextZoom)
    })
    const applyScroll = () => {
      const vp = workflowViewportRef.current
      if (!vp) return
      scrollOnboardingWorkflowToFirstNode(vp, pos, nextZoom, removedOnboardingKeys)
      alignWorkflowCanvasMarginsWhenFits(vp)
    }
    applyScroll()
    requestAnimationFrame(() => {
      applyScroll()
    })
  }, [clearWorkflowCanvasMargins, removedOnboardingKeys])

  useLayoutEffect(() => {
    if (activePage !== 'scenarios' || selectedScenarioName !== '新员工入职') return
    /** Runs 与 Build 切换时面板会卸载/挂载，必须在切回 Build 时重新适配，否则会停在滚动 (0,0) 只看到空白画布 */
    if (scenarioWorkspaceMode !== 'editor') return
    fitOnboardingWorkflowToViewport()
    const el = workflowViewportRef.current
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return
    const id = requestAnimationFrame(() => {
      fitOnboardingWorkflowToViewport()
    })
    return () => cancelAnimationFrame(id)
  }, [activePage, selectedScenarioName, scenarioWorkspaceMode, fitOnboardingWorkflowToViewport])

  useEffect(() => {
    if (activePage !== 'scenarios' || selectedScenarioName !== '新员工入职') return
    if (scenarioWorkspaceMode !== 'editor') return
    const onResize = () => {
      fitOnboardingWorkflowToViewport()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activePage, selectedScenarioName, scenarioWorkspaceMode, fitOnboardingWorkflowToViewport])

  const workflowNodeDragRef = useRef<
    | {
        kind: 'builtin'
        key: OnboardingBoardNodeKey
        pointerId: number
        originX: number
        originY: number
        startClientX: number
        startClientY: number
      }
    | {
        kind: 'extra'
        id: string
        pointerId: number
        originX: number
        originY: number
        startClientX: number
        startClientY: number
      }
    | null
  >(null)

  const onWorkflowNodePointerDown = useCallback(
    (key: OnboardingBoardNodeKey, e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      if (e.button !== 0) return
      const p = onboardingNodePosRef.current[key]
      workflowNodeDragRef.current = {
        kind: 'builtin',
        key,
        pointerId: e.pointerId,
        originX: p.x,
        originY: p.y,
        startClientX: e.clientX,
        startClientY: e.clientY,
      }
      e.currentTarget.classList.add('scenario-workflow-node--dragging')
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    },
    [],
  )

  const onWorkflowExtraNodePointerDown = useCallback(
    (id: string, e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      if (e.button !== 0) return
      const n = workspaceExtraNodesRef.current.find((x) => x.id === id)
      if (!n) return
      workflowNodeDragRef.current = {
        kind: 'extra',
        id,
        pointerId: e.pointerId,
        originX: n.x,
        originY: n.y,
        startClientX: e.clientX,
        startClientY: e.clientY,
      }
      e.currentTarget.classList.add('scenario-workflow-node--dragging')
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    },
    [],
  )

  const removeWorkspaceExtraNodeById = useCallback((id: string) => {
    setWorkspaceExtraNodes((list) => list.filter((n) => n.id !== id))
    setWorkspaceExtraNodeAccentOpenId((cur) => (cur === id ? null : cur))
    if (branchDrawerExtraIdRef.current === id) {
      setBranchDrawerExtraId(null)
      setBranchDrawerOpen(false)
      setBranchLogicModalOpen(false)
      branchPathDescModalPathIdRef.current = null
      setBranchPathDescModalPathId(null)
    }
  }, [])

  const removeOnboardingBoardNode = useCallback((key: OnboardingBoardNodeKey) => {
    setRemovedOnboardingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    if (key === 'branch') {
      setBranchDrawerOpen(false)
      setBranchLogicModalOpen(false)
      branchPathDescModalPathIdRef.current = null
      setBranchPathDescModalPathId(null)
      setBranchDrawerExtraId(null)
    }
    if (key === 'trigger') {
      setOnboardingTriggerAccentOpen(false)
    }
    setOnboardingAgentDrawerKey((prev) => (prev === key ? null : prev))
  }, [])

  const onWorkflowNodePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = workflowNodeDragRef.current
      if (!d || d.pointerId !== e.pointerId) return
      const z = workspaceCanvasZoom / 100
      const nx = d.originX + (e.clientX - d.startClientX) / z
      const ny = d.originY + (e.clientY - d.startClientY) / z
      if (d.kind === 'builtin') {
        setOnboardingNodePos((prev) => ({
          ...prev,
          [d.key]: { x: nx, y: ny },
        }))
      } else {
        setWorkspaceExtraNodes((list) => list.map((n) => (n.id === d.id ? { ...n, x: nx, y: ny } : n)))
      }
    },
    [workspaceCanvasZoom],
  )

  const onWorkflowNodePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = workflowNodeDragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const captureId = e.pointerId
    const dist = Math.hypot(e.clientX - d.startClientX, e.clientY - d.startClientY)
    workflowNodeDragRef.current = null
    e.currentTarget.classList.remove('scenario-workflow-node--dragging')
    try {
      e.currentTarget.releasePointerCapture(captureId)
    } catch {
      /* noop */
    }
    if (d.kind === 'extra') {
      const n = workspaceExtraNodesRef.current.find((x) => x.id === d.id)
      if (!n) return
      if (n.kind === 'branch' && dist < 8) {
        setBranchDrawerOpen((wasOpen) => {
          if (wasOpen && branchDrawerExtraIdRef.current === n.id) {
            setBranchDrawerExtraId(null)
            return false
          }
          const logic = n.branchLogicText ?? ''
          const paths =
            n.branchPaths?.length && n.branchPaths.length > 0
              ? n.branchPaths.map((p) => ({ ...p }))
              : defaultBranchPathsForUserAddedNode(() => `branch-path-${branchPathIdSeqRef.current++}`)
          flushSync(() => {
            setBranchDrawerExtraId(n.id)
            setBranchLogicText(logic)
            setBranchPaths(paths)
          })
          branchFormSnapshotRef.current = {
            logic,
            paths: paths.map((p) => ({ ...p })),
          }
          setOnboardingAgentDrawerKey((prev) => {
            if (!prev) return null
            if (collectTaskModalIsOpenRef.current) {
              setTaskTextByNode((t) => ({
                ...t,
                [prev]: collectTaskModalOpenSnapshotRef.current,
              }))
            }
            setOnboardingCollectTaskModalOpen(false)
            setOnboardingCollectOptimizeModalOpen(false)
            revertAgentSelectionToSnapshot()
            return null
          })
          return true
        })
        return
      }
      if (dist < 8) {
        setWorkspaceExtraNodeAccentOpenId((cur) => (cur === d.id ? null : d.id))
      }
      return
    }
    if (d.key === 'trigger' && dist < 8) {
      setOnboardingTriggerAccentOpen((open) => !open)
    }
    if (dist < 8 && d.key === 'branch') {
      setBranchDrawerOpen((wasOpen) => {
        if (wasOpen && branchDrawerExtraIdRef.current === null) {
          return false
        }
        const logic = canvasBranchLogicTextRef.current
        const paths = canvasBranchPathsRef.current.map((p) => ({ ...p }))
        flushSync(() => {
          setBranchDrawerExtraId(null)
          setBranchLogicText(logic)
          setBranchPaths(paths)
        })
        branchFormSnapshotRef.current = {
          logic,
          paths: paths.map((p) => ({ ...p })),
        }
        setOnboardingAgentDrawerKey((prev) => {
          if (!prev) return null
          if (collectTaskModalIsOpenRef.current) {
            setTaskTextByNode((t) => ({
              ...t,
              [prev]: collectTaskModalOpenSnapshotRef.current,
            }))
          }
          setOnboardingCollectTaskModalOpen(false)
          setOnboardingCollectOptimizeModalOpen(false)
          revertAgentSelectionToSnapshot()
          return null
        })
        return true
      })
    }
    if (dist < 8 && ONBOARDING_AGENT_DRAWER_KEYS.includes(d.key as OnboardingAgentDrawerKey)) {
      setBranchDrawerOpen(false)
      setBranchLogicModalOpen(false)
      branchPathDescModalPathIdRef.current = null
      setBranchPathDescModalPathId(null)
      setBranchDrawerExtraId(null)
      const nodeKey = d.key as OnboardingAgentDrawerKey
      setOnboardingAgentDrawerKey((prev) => {
        if (prev === nodeKey) {
          if (collectTaskModalIsOpenRef.current) {
            setTaskTextByNode((t) => ({
              ...t,
              [nodeKey]: collectTaskModalOpenSnapshotRef.current,
            }))
          }
          setOnboardingCollectTaskModalOpen(false)
          setOnboardingCollectOptimizeModalOpen(false)
          revertAgentSelectionToSnapshot()
          return null
        }
        if (prev) {
          if (collectTaskModalIsOpenRef.current) {
            setTaskTextByNode((t) => ({
              ...t,
              [prev]: collectTaskModalOpenSnapshotRef.current,
            }))
          }
          setOnboardingCollectTaskModalOpen(false)
          setOnboardingCollectOptimizeModalOpen(false)
        }
        return nodeKey
      })
    }
  }, [revertAgentSelectionToSnapshot])

  const onWorkflowViewportPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const t = e.target as HTMLElement | null
    if (t?.closest('.scenario-workflow-node')) return
    const el = workflowViewportRef.current
    if (!el) return
    workflowPanRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }
    el.classList.add('scenario-workflow-region--panning')
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }, [])

  const onWorkflowViewportPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const p = workflowPanRef.current
    if (!p.active || p.pointerId !== e.pointerId) return
    const el = workflowViewportRef.current
    if (!el) return
    el.scrollLeft = p.scrollLeft - (e.clientX - p.startX)
    el.scrollTop = p.scrollTop - (e.clientY - p.startY)
  }, [])

  const onWorkflowViewportPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const p = workflowPanRef.current
    if (!p.active || p.pointerId !== e.pointerId) return
    const captureId = e.pointerId
    p.active = false
    p.pointerId = null
    const el = workflowViewportRef.current
    el?.classList.remove('scenario-workflow-region--panning')
    try {
      el?.releasePointerCapture(captureId)
    } catch {
      /* noop */
    }
  }, [])

  const clampAiPanelWidth = useCallback((w: number) => {
    const min = 280
    const max = Math.max(min + 40, Math.min(1200, window.innerWidth - 200))
    return Math.min(Math.max(w, min), max)
  }, [])

  const onAiResizeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsAiResizeDragging(true)
      const startX = event.clientX
      const startW = aiPanelWidthPx
      const onMove = (ev: MouseEvent) => {
        // 与常见左右分栏一致：向右拖分界线 → 左侧主区域变宽、右侧 AI 变窄（鼠标位移与右侧面板宽度反向）
        const delta = ev.clientX - startX
        setAiPanelWidthPx(clampAiPanelWidth(startW - delta))
      }
      const onUp = () => {
        setIsAiResizeDragging(false)
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
    [aiPanelWidthPx, clampAiPanelWidth],
  )

  useEffect(() => {
    const onWinResize = () => setAiPanelWidthPx((w) => clampAiPanelWidth(w))
    window.addEventListener('resize', onWinResize)
    return () => window.removeEventListener('resize', onWinResize)
  }, [clampAiPanelWidth])

  const [isAiPanelFloating, setIsAiPanelFloating] = useState(false)
  const [aiFloatHeightPx, setAiFloatHeightPx] = useState(520)
  const [aiFloatPos, setAiFloatPos] = useState({ x: 0, y: 0 })
  const aiFloatDragRef = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const clampAiFloatHeight = useCallback((h: number) => {
    const min = 200
    const max = Math.max(min + 40, Math.min(window.innerHeight - 16, Math.floor(window.innerHeight * 0.92)))
    return Math.min(Math.max(h, min), max)
  }, [])

  const beginAiFloat = useCallback(() => {
    const w = aiPanelWidthPx
    const h = clampAiFloatHeight(aiFloatHeightPx)
    setAiFloatHeightPx(h)
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, window.innerWidth - w - 20))
    const y = Math.max(8, Math.min((window.innerHeight - h) / 2, window.innerHeight - h - 8))
    setAiFloatPos({ x, y })
    setIsAiPanelFloating(true)
  }, [aiPanelWidthPx, aiFloatHeightPx, clampAiFloatHeight])

  const endAiFloat = useCallback(() => setIsAiPanelFloating(false), [])

  /** 浮动窗口左缘拖动：右边缘位置不变，仅改变宽度 */
  const onAiFloatResizeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsAiResizeDragging(true)
      const startX = event.clientX
      const startW = aiPanelWidthPx
      const startLeft = aiFloatPos.x
      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const newW = clampAiPanelWidth(startW - delta)
        setAiPanelWidthPx(newW)
        setAiFloatPos((p) => ({
          x: startLeft + startW - newW,
          y: p.y,
        }))
      }
      const onUp = () => {
        setIsAiResizeDragging(false)
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
    [aiPanelWidthPx, aiFloatPos.x, clampAiPanelWidth],
  )

  const onAiFloatResizeKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const step = e.shiftKey ? 32 : 8
      const dir = e.key === 'ArrowLeft' ? step : -step
      setAiPanelWidthPx((w0) => {
        const newW = clampAiPanelWidth(w0 + dir)
        const dw = newW - w0
        if (dw !== 0) {
          setAiFloatPos((p) => ({ x: p.x - dw, y: p.y }))
        }
        return newW
      })
    },
    [clampAiPanelWidth],
  )

  /** 浮动窗口底边拖动：改变高度，顶边位置不变 */
  const onAiFloatResizeBottomMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsAiResizeDragging(true)
      const startY = event.clientY
      const startH = aiFloatHeightPx
      const topY = aiFloatPos.y
      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY
        const maxByViewport = clampAiFloatHeight(startH + delta)
        const maxByTop = Math.max(200, window.innerHeight - topY - 8)
        setAiFloatHeightPx(Math.min(maxByViewport, maxByTop))
      }
      const onUp = () => {
        setIsAiResizeDragging(false)
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
    [aiFloatHeightPx, aiFloatPos.y, clampAiFloatHeight],
  )

  const onAiFloatResizeBottomKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const step = e.shiftKey ? 24 : 8
      const dir = e.key === 'ArrowDown' ? step : -step
      setAiFloatHeightPx((h0) => {
        const maxByTop = Math.max(200, window.innerHeight - aiFloatPos.y - 8)
        return Math.min(clampAiFloatHeight(h0 + dir), maxByTop)
      })
    },
    [aiFloatPos.y, clampAiFloatHeight],
  )

  const onAiFloatHeaderMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('button')) return
      event.preventDefault()
      aiFloatDragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        origX: aiFloatPos.x,
        origY: aiFloatPos.y,
      }
      const onMove = (ev: MouseEvent) => {
        const d = aiFloatDragRef.current
        if (!d) return
        const w = aiPanelWidthPx
        const h = aiFloatHeightPx
        let nx = d.origX + ev.clientX - d.startX
        let ny = d.origY + ev.clientY - d.startY
        nx = Math.max(8, Math.min(nx, window.innerWidth - w - 8))
        ny = Math.max(8, Math.min(ny, window.innerHeight - h - 8))
        setAiFloatPos({ x: nx, y: ny })
      }
      const onUp = () => {
        aiFloatDragRef.current = null
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
    [aiFloatPos.x, aiFloatPos.y, aiPanelWidthPx, aiFloatHeightPx],
  )

  useEffect(() => {
    if (!isAiPanelFloating) return
    const onResize = () => {
      setAiFloatHeightPx((h) => {
        const maxByTop = Math.max(200, window.innerHeight - aiFloatPos.y - 8)
        return Math.min(clampAiFloatHeight(h), maxByTop)
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isAiPanelFloating, aiFloatPos.y, clampAiFloatHeight])

  useEffect(() => {
    if (!isAiPanelFloating) return
    const onResize = () => {
      setAiFloatPos(({ x, y }) => {
        const w = aiPanelWidthPx
        const h = aiFloatHeightPx
        return {
          x: Math.max(8, Math.min(x, window.innerWidth - w - 8)),
          y: Math.max(8, Math.min(y, window.innerHeight - h - 8)),
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isAiPanelFloating, aiPanelWidthPx, aiFloatHeightPx])

  useEffect(() => {
    if (!isAiPanelFloating) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAiPanelFloating(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isAiPanelFloating])

  useEffect(() => {
    const keepAiFloat =
      activePage === 'agent-library' ||
      activePage === 'scenarios' ||
      activePage === 'experience' ||
      activePage === 'analytics'
    if (!keepAiFloat) setIsAiPanelFloating(false)
  }, [activePage])

  useEffect(() => {
    if (activePage !== 'agent-library') setIsOnboardingWorkflowOpen(false)
  }, [activePage])

  const [agentChatInput, setAgentChatInput] = useState('')
  const [agentChatMessages, setAgentChatMessages] = useState<
    { id: string; role: 'user' | 'assistant'; text: string }[]
  >([{ id: 'welcome', role: 'assistant', text: '你好，我是 Joyce AI，可在此咨询 Agent 相关问题。' }])
  const pickAgentTag = (seed: string): 'Single Agent' | 'Managerial Agent' => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    return h % 4 === 0 ? 'Managerial Agent' : 'Single Agent'
  }

  const pickScenarioCategory = (seed: string) => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0
    const v = h % 4
    return v === 0 ? 'medical' : v === 1 ? 'finance' : v === 2 ? 'tech' : 'accounting'
  }

  const agentIconPalettes = [
    {
      from: '#7f7cff',
      via: '#8b5cf6',
      to: '#ff9a62',
      shadow: 'rgba(124, 92, 255, 0.28)',
    },
    {
      from: '#5ea8ff',
      via: '#5b7cff',
      to: '#7b61ff',
      shadow: 'rgba(91, 124, 255, 0.24)',
    },
    {
      from: '#19c7c7',
      via: '#2d9bf0',
      to: '#6d6bff',
      shadow: 'rgba(45, 155, 240, 0.24)',
    },
    {
      from: '#ffd36a',
      via: '#ffab5b',
      to: '#ff7b72',
      shadow: 'rgba(255, 171, 91, 0.26)',
    },
    {
      from: '#62d6a5',
      via: '#33c0b8',
      to: '#3f8cff',
      shadow: 'rgba(51, 192, 184, 0.24)',
    },
    {
      from: '#ff8cb7',
      via: '#ff7d95',
      to: '#9a6bff',
      shadow: 'rgba(255, 125, 149, 0.25)',
    },
    {
      from: '#7ad7ff',
      via: '#4ca9ff',
      to: '#7c73ff',
      shadow: 'rgba(76, 169, 255, 0.24)',
    },
    {
      from: '#ffb86c',
      via: '#ff8f70',
      to: '#ff6ea8',
      shadow: 'rgba(255, 143, 112, 0.24)',
    },
  ] as const

  const pickAgentIconPalette = (seed: string) => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 37 + seed.charCodeAt(i)) >>> 0
    return agentIconPalettes[h % agentIconPalettes.length]
  }

  type Agent = {
    name: string
    desc: string
    meta: string
  }

  type DropdownOption = {
    id: string
    title: string
    description?: string
    meta?: string
  }

  type SingleAgentSettingsDraft = {
    name: string
    modelConfig: string
    instructions: string
    generatedPrompt: string
    agentTools: string[]
    skills: string[]
    knowledge: string[]
    tools: string[]
  }

  type ManagerialAgentSettingsDraft = {
    name: string
    modelConfig: string
    instructions: string
    generatedPrompt: string
    agentTools: string[]
    skills: string[]
    knowledge: string[]
    tools: string[]
    managerGoal: string
    memberAgents: string[]
    delegationStrategy: string
    approvalMode: string
    escalationTriggers: string[]
    successCriteria: string
    managerNotes: string
    managerEnabled: boolean
    managerAgents: { id: string; agentName: string; usage: string; source: 'agent' | 'a2a' }[]
  }

  const initialAgents: Agent[] = [
    {
      name: '新员工入职',
      desc: 'Master coordinator managing the entire employee onboarding workflow by delegating tasks to…',
      meta: 'yesterday',
    },
    {
      name: 'onboarding',
      desc: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',
      meta: '19 days ago',
    },
    {
      name: 'Leave Approval Workflow Agent',
      desc: 'Multi-level PTO approval workflow agent that routes vacation requests through manager and H…',
      meta: '19 days ago',
    },
    {
      name: 'Orientation Scheduler Agent',
      desc: 'Coordinates orientation schedules, team introductions, and first-day logistics',
      meta: '20 days ago',
    },
    {
      name: 'Onboarding Support Agent',
      desc: 'Answers employee questions and provides support throughout the onboarding process',
      meta: '20 days ago',
    },
    {
      name: 'Training Coordinator Agent',
      desc: 'Assigns training courses and tracks employee training progress',
      meta: '20 days ago',
    },
    {
      name: 'Account Setup Agent',
      desc: 'Creates and configures employee accounts and access credentials',
      meta: '20 days ago',
    },
    {
      name: 'Document Collection Agent',
      desc: 'Manages employee document collection and verification during onboarding',
      meta: '20 days ago',
    },
    {
      name: 'HR Onboarding Agent',
      desc: 'Automates new-hire onboarding: generates personalized welcome emails, builds role-specific…',
      meta: '20 days ago',
    },
    {
      name: 'Chief Technology Editor',
      desc: 'A senior editor who ensures article quality and coordinates the research and…',
      meta: '26 days ago',
    },
    {
      name: 'Technology Writer',
      desc: 'A renowned technology writer skilled at making complex technical concepts accessible through…',
      meta: '27 days ago',
    },
    {
      name: 'Technology Researcher',
      desc: 'Skilled in gathering and validating the latest technical information to…',
      meta: '27 days ago',
    },
  ]
  const modelConfigOptions: DropdownOption[] = [
    { id: 'default', title: '默认', description: 'chatOpenAICustom' },
    { id: 'qwen-test', title: 'Qwen-test', description: 'chatOpenAICustom' },
  ]
  const instructionTemplates = [
    '总结文档',
    '翻译语言',
    '撰写邮件',
    '代码转换',
    '调研并生成报告',
    '规划旅行',
  ] as const
  const agentToolOptions: DropdownOption[] = [
    {
      id: 'test-notion',
      title: 'Notion 测试',
      meta: '083b2ff8-ad48-411d-b12a-1fe106c25646',
    },
    {
      id: 'gmail-test',
      title: 'Gmail 测试',
      meta: 'e566c118-78eb-4833-bf69-2f4f4e9bbd40',
    },
    {
      id: 'google-calendar-test',
      title: 'Google 日历测试',
      meta: 'd04e7afa-c591-483b-8dfb-4305b874d3e7',
    },
    {
      id: 'slack-test',
      title: 'Slack 测试',
      meta: '0c51e469-a949-44cd-8e40-4a51c5ff6e6e',
    },
    {
      id: 'expense-reimbursement',
      title: '签一个巡堂一下（兑奖版）',
      meta: '015de15e-d6da-4c45-8c9e-2fcdfc93539c',
    },
    {
      id: 'meeting-helper',
      title: '会议记录小助手',
      meta: '818df541-cdeb-4712-839f-58880328008b',
    },
    {
      id: 'conditional-test',
      title: '条件分支测试',
      meta: '7a1790-e507-452b-aeba-2d3844e6d859',
    },
  ]
  const skillOptions: DropdownOption[] = [
    {
      id: 'agent-test-skill',
      title: '智能体测试技能',
      description: '用于智能体测试的技能。',
    },
    {
      id: 'searchable-skill-b',
      title: '可搜索技能 B',
      description: '描述 B',
    },
    {
      id: 'searchable-skill-a',
      title: '可搜索技能 A',
      description: '描述 A',
    },
    {
      id: 'view-toggle-test-skill',
      title: '视图切换测试技能',
      description: '用于测试视图切换。',
    },
    {
      id: 'test-skill-e2e',
      title: '端到端测试技能',
      description: '这是由 Playwright E2E 测试创建的测试技能。',
    },
    {
      id: 'skill-edited',
      title: '已编辑技能',
      description: '原始描述。',
    },
    {
      id: 'python-code-executor',
      title: 'Python 代码执行器',
      description: '用于执行 Python 脚本。',
    },
  ]
  const knowledgeOptions: DropdownOption[] = [
    {
      id: 'employee-onboarding-docs',
      title: '员工入职文档',
      description: '包含制度说明、录用通知、首日检查清单和入职 SOP。',
    },
    {
      id: 'hr-faq',
      title: 'HR 常见问题库',
      description: '包含请假、薪资、福利和报销等高频问题。',
    },
    {
      id: 'security-guidelines',
      title: '安全规范',
      description: '包含安全意识手册、密码策略和设备合规要求。',
    },
  ]
  const toolOptions: DropdownOption[] = [
    { id: '163-email', title: '163 邮箱', description: '发送邮件工具。' },
    {
      id: 'news',
      title: '新闻',
      description: '股票市场搜索查询（例如：股票市场、科技股）。',
    },
    {
      id: 'show-alert',
      title: '显示提醒',
      description:
        '在用户页面上显示一条自定义提醒信息，AI 可以用它向用户展示重要通知。',
    },
    {
      id: 'json-formatter',
      title: 'JSON 格式化',
      description: '将原始 JSON 字符串按 2 空格缩进进行美化输出。',
    },
    {
      id: 'word-count',
      title: '字数统计',
      description: '统计给定文本中的词数。',
    },
    {
      id: 'string-reverse',
      title: '字符串反转',
      description: '将输入的字符串按字符顺序反转。',
    },
    {
      id: 'current-date-time',
      title: '当前日期时间',
      description: '返回当前 UTC 日期时间，格式为 ISO 8601，无需输入参数。',
    },
  ]
  const managerialDelegationOptions: DropdownOption[] = [
    { id: 'capability-routing', title: '按能力路由', description: '根据任务类型自动分配给最合适的子智能体。' },
    { id: 'sequential', title: '顺序编排', description: '按照预设顺序逐步执行并传递阶段结果。' },
    { id: 'parallel', title: '并行协作', description: '多个子智能体同时执行，再由管理型智能体汇总。' },
    { id: 'conditional', title: '条件分支', description: '基于输入条件、风险等级或置信度走不同分支。' },
  ]
  const managerialApprovalOptions: DropdownOption[] = [
    { id: 'auto', title: '自动通过', description: '满足规则后自动流转，无需人工审批。' },
    { id: 'key-nodes', title: '关键节点审批', description: '仅在关键决策节点需要审批确认。' },
    { id: 'all-manual', title: '全程人工审批', description: '所有阶段输出都需要人工确认。' },
    { id: 'exception-only', title: '异常时升级审批', description: '仅在异常或风险条件触发时升级审批。' },
  ]
  const managerialEscalationOptions: DropdownOption[] = [
    { id: 'sla-risk', title: '时效风险', description: '任务超时、排队过长或响应 SLA 即将超限。' },
    { id: 'quality-risk', title: '质量风险', description: '结果缺失、置信度偏低或多轮纠错失败。' },
    { id: 'compliance-risk', title: '合规风险', description: '涉及权限、隐私、审批或制度冲突。' },
    { id: 'handoff-failure', title: '交接失败', description: '子智能体返回失败、上下文不完整或无法继续。' },
  ]

  const hashSeed = (seed: string, factor = 31) => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * factor + seed.charCodeAt(i)) >>> 0
    return h >>> 0
  }

  const pickOptionIds = (
    options: DropdownOption[],
    seed: string,
    count: number,
    factor: number,
  ) => {
    if (options.length === 0 || count <= 0) return []
    const start = hashSeed(seed, factor) % options.length
    const result: string[] = []
    for (let i = 0; i < Math.min(count, options.length); i++) {
      result.push(options[(start + i) % options.length].id)
    }
    return result
  }

  const pickInstructionTemplateForAgent = (agent: Agent) => {
    const text = `${agent.name} ${agent.desc}`.toLowerCase()
    if (text.includes('writer') || text.includes('editor')) return '撰写邮件'
    if (text.includes('research')) return '调研并生成报告'
    if (text.includes('document')) return '总结文档'
    if (text.includes('support')) return '翻译语言'
    return '调研并生成报告'
  }

  const buildInstructionContextForAgent = (agent: Agent) => {
    return `${agent.desc.replace(/…/g, '').trim()}。请优先输出实用结果、清晰结构以及贴合该角色的判断。`
  }

  const createSingleAgentDraft = (agent: Agent): SingleAgentSettingsDraft => {
    const template = pickInstructionTemplateForAgent(agent)
    const generatedPrompt = buildGeneratedPrompt(
      agent.name,
      template,
      buildInstructionContextForAgent(agent),
    )

    return {
      name: agent.name,
      modelConfig: hashSeed(agent.name, 29) % 2 === 0 ? '默认' : 'Qwen-test',
      instructions: generatedPrompt,
      generatedPrompt,
      agentTools: pickOptionIds(agentToolOptions, agent.name, 2, 41),
      skills: pickOptionIds(skillOptions, agent.name, 2, 43),
      knowledge: pickOptionIds(knowledgeOptions, agent.name, 1, 47),
      tools: pickOptionIds(toolOptions, agent.name, 3, 53),
    }
  }

  const initialSingleAgentMemberOptions: DropdownOption[] = initialAgents
    .filter((agent) => pickAgentTag(agent.name) === 'Single Agent')
    .map((agent) => ({
      id: agent.name,
      title: agent.name,
      description: agent.desc.replace(/…/g, '').trim(),
    }))

  const createManagerialAgentDraft = (agent: Agent): ManagerialAgentSettingsDraft => {
    const generatedPrompt = `# 角色
你是 **${agent.name}**，一个负责协调多个子智能体的管理型智能体。

## 管理目标
围绕整体任务目标拆解阶段、分发子任务、跟踪执行状态，并在必要时做审批与升级判断。

## 编排职责
- 理解用户最终目标并拆解出可执行子任务。
- 根据任务类型将工作分派给最合适的子智能体。
- 汇总各子智能体结果并输出统一结论。

## 治理要求
- 重点关注时效、质量、合规与交接完整性。
- 出现异常时触发升级或人工审批。
- 对最终输出负责，保证结果清晰可用。`

    return {
      name: agent.name,
      modelConfig: hashSeed(agent.name, 29) % 2 === 0 ? '默认' : 'Qwen-test',
      instructions: generatedPrompt,
      generatedPrompt,
      agentTools: pickOptionIds(agentToolOptions, agent.name, 2, 61),
      skills: pickOptionIds(skillOptions, agent.name, 2, 67),
      knowledge: pickOptionIds(knowledgeOptions, agent.name, 1, 71),
      tools: pickOptionIds(toolOptions, agent.name, 2, 73),
      managerGoal: `${agent.desc.replace(/…/g, '').trim()}。重点负责跨节点协调、任务汇总和最终结果把关。`,
      memberAgents: pickOptionIds(initialSingleAgentMemberOptions, agent.name, 3, 79),
      delegationStrategy: managerialDelegationOptions[hashSeed(agent.name, 83) % managerialDelegationOptions.length].title,
      approvalMode: managerialApprovalOptions[hashSeed(agent.name, 89) % managerialApprovalOptions.length].title,
      escalationTriggers: pickOptionIds(managerialEscalationOptions, agent.name, 2, 97),
      successCriteria: '所有关键子任务均完成；结果通过质量检查；无阻塞项；最终输出满足业务目标并可直接交付。',
      managerNotes: '适合用于多阶段、多角色协同任务。优先让管理型智能体聚焦调度、汇总与升级判断。',
      managerEnabled: true,
      managerAgents: [
        {
          id: `${agent.name}-member-1`,
          agentName:
            initialSingleAgentMemberOptions[
              hashSeed(agent.name, 101) % Math.max(1, initialSingleAgentMemberOptions.length)
            ]?.title ?? '',
          usage: '负责处理首个关键子任务，并将结果回传给管理型智能体。',
          source: 'agent',
        },
        {
          id: `${agent.name}-member-2`,
          agentName: '',
          usage: '',
          source: 'agent',
        },
      ],
    }
  }

  const buildGeneratedPrompt = (agentName: string, template: string, details: string) => {
    const trimmedDetails = details.trim() || '请结合提供的上下文完成任务。'
    const taskFocus =
      template === '总结文档'
        ? '将文档内容提炼为清晰的重点摘要'
        : template === '翻译语言'
          ? '在保留语气、意图和术语准确性的前提下完成翻译'
          : template === '撰写邮件'
            ? '起草清晰、得体且可直接发送的邮件'
            : template === '代码转换'
              ? '在保持原有逻辑不变的前提下完成代码语言转换'
              : template === '调研并生成报告'
                ? '完成信息调研并输出结构化报告'
                : '规划一个实用、清晰且包含建议的旅行方案'

    return `# 角色
你是 **${agentName}**，一个专门用于${taskFocus}的单智能体。

## 任务背景
${trimmedDetails}

## 目标
- 在回复前先准确理解用户目标。
- 输出直接可用的结果，而不是泛泛而谈的建议。
- 保持结果与当前任务类型一致。

## 输出要求
- 使用清晰的分节标题。
- 在合适的时候使用简洁的项目符号。
- 明确标出假设条件或缺失信息。

## 语气
- 保持专业、冷静、面向执行。
- 避免不必要的铺垫和冗余表述。

## 最终检查
- 确保回复内容完整。
- 确保输出易于阅读并且可以直接使用。`
  }

  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [singleAgentSettingsByKey, setSingleAgentSettingsByKey] = useState<
    Record<string, SingleAgentSettingsDraft>
  >(() =>
    Object.fromEntries(
      initialAgents
        .filter((agent) => pickAgentTag(agent.name) === 'Single Agent')
        .map((agent) => [agent.name, createSingleAgentDraft(agent)]),
    ),
  )
  const [managerialAgentSettingsByKey, setManagerialAgentSettingsByKey] = useState<
    Record<string, ManagerialAgentSettingsDraft>
  >(() =>
    Object.fromEntries(
      initialAgents
        .filter((agent) => pickAgentTag(agent.name) === 'Managerial Agent')
        .map((agent) => [agent.name, createManagerialAgentDraft(agent)]),
    ),
  )
  const [selectedSingleAgentKey, setSelectedSingleAgentKey] = useState<string | null>(null)
  const [selectedManagerialAgentKey, setSelectedManagerialAgentKey] = useState<string | null>(null)
  const [singleAgentPreviewTab, setSingleAgentPreviewTab] = useState<'preview' | 'ai-adjust'>('preview')
  const [managerialAgentPreviewTab, setManagerialAgentPreviewTab] = useState<'preview' | 'ai-adjust'>('preview')
  const [openSettingsDropdown, setOpenSettingsDropdown] = useState<
    | null
    | 'modelConfig'
    | 'agentTools'
    | 'skills'
    | 'knowledge'
    | 'tools'
    | 'managerMemberAgents'
    | 'managerDelegationStrategy'
    | 'managerApprovalMode'
    | 'managerEscalationTriggers'
  >(null)
  const [modelConfigQuery, setModelConfigQuery] = useState('')
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false)
  const [instructionTaskInput, setInstructionTaskInput] = useState('')
  const [instructionSelectedTemplate, setInstructionSelectedTemplate] = useState<string>('')
  const [isInstructionGenerating, setIsInstructionGenerating] = useState(false)
  const [instructionGeneratedDraft, setInstructionGeneratedDraft] = useState('')
  const [openManagerAgentPickerRowId, setOpenManagerAgentPickerRowId] = useState<string | null>(null)
  const [isOnboardingWorkflowOpen, setIsOnboardingWorkflowOpen] = useState(false)

  const makeDuplicateName = (baseName: string, usedNames: Set<string>) => {
    const root = `${baseName} Copy`
    if (!usedNames.has(root)) return root
    let i = 2
    while (usedNames.has(`${root} ${i}`)) i++
    return `${root} ${i}`
  }

  const agentsWithDerived = agents.map((a) => ({
    ...a,
    tag: pickAgentTag(a.name),
    managerial: pickAgentTag(a.name) === 'Managerial Agent',
  }))
  const singleAgents = agentsWithDerived.filter((a) => a.tag === 'Single Agent')
  const managerialAgents = agentsWithDerived.filter((a) => a.tag === 'Managerial Agent')
  const filteredAgents =
    agentsTab === 'single'
      ? singleAgents
      : agentsTab === 'managerial'
        ? managerialAgents
        : agentsWithDerived
  const filteredModelConfigOptions = modelConfigOptions.filter((option) => {
    const q = modelConfigQuery.trim().toLowerCase()
    if (!q) return true
    return (
      option.title.toLowerCase().includes(q) || (option.description ?? '').toLowerCase().includes(q)
    )
  })
  const selectedSingleAgent =
    selectedSingleAgentKey ? singleAgentSettingsByKey[selectedSingleAgentKey] ?? null : null
  const selectedManagerialAgent =
    selectedManagerialAgentKey ? managerialAgentSettingsByKey[selectedManagerialAgentKey] ?? null : null

  useEffect(() => {
    if (!selectedManagerialAgentKey) setIsOnboardingWorkflowOpen(false)
  }, [selectedManagerialAgentKey])

  const updateSelectedSingleAgent = (
    updater: (prev: SingleAgentSettingsDraft) => SingleAgentSettingsDraft,
  ) => {
    if (!selectedSingleAgentKey) return
    setSingleAgentSettingsByKey((prev) => {
      const current = prev[selectedSingleAgentKey]
      if (!current) return prev
      return { ...prev, [selectedSingleAgentKey]: updater(current) }
    })
  }

  const updateSelectedManagerialAgent = (
    updater: (prev: ManagerialAgentSettingsDraft) => ManagerialAgentSettingsDraft,
  ) => {
    if (!selectedManagerialAgentKey) return
    setManagerialAgentSettingsByKey((prev) => {
      const current = prev[selectedManagerialAgentKey]
      if (!current) return prev
      return { ...prev, [selectedManagerialAgentKey]: updater(current) }
    })
  }

  const updateManagerAgentRow = (
    rowId: string,
    updater: (row: ManagerialAgentSettingsDraft['managerAgents'][number]) => ManagerialAgentSettingsDraft['managerAgents'][number],
  ) => {
    updateSelectedManagerialAgent((prev) => ({
      ...prev,
      managerAgents: prev.managerAgents.map((row) => (row.id === rowId ? updater(row) : row)),
    }))
  }

  const appendManagerAgentRow = (source: 'agent' | 'a2a') => {
    updateSelectedManagerialAgent((prev) => ({
      ...prev,
      managerAgents: [
        ...prev.managerAgents,
        {
          id: `${prev.name}-${source}-${Date.now()}`,
          agentName: '',
          usage: '',
          source,
        },
      ],
    }))
  }

  const toggleSingleAgentListField = (
    field: 'agentTools' | 'skills' | 'knowledge' | 'tools',
    id: string,
  ) => {
    updateSelectedSingleAgent((prev) => {
      if (!prev) return prev
      const current = prev[field]
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { ...prev, [field]: next }
    })
  }

  const getSelectedLabels = (options: DropdownOption[], selectedIds: string[]) => {
    const names = options.filter((option) => selectedIds.includes(option.id)).map((option) => option.title)
    return names.length > 0 ? names.join(', ') : ''
  }

  const openSingleAgentSettings = (agent: Agent) => {
    setSingleAgentSettingsByKey((prev) => ({
      ...prev,
      [agent.name]: prev[agent.name] ?? createSingleAgentDraft(agent),
    }))
    setSelectedSingleAgentKey(agent.name)
    setSelectedManagerialAgentKey(null)
    setOpenSettingsDropdown(null)
    setOpenManagerAgentPickerRowId(null)
    setIsOnboardingWorkflowOpen(false)
    setModelConfigQuery('')
    setSingleAgentPreviewTab('preview')
  }

  const openManagerialAgentSettings = (agent: Agent) => {
    setManagerialAgentSettingsByKey((prev) => ({
      ...prev,
      [agent.name]: prev[agent.name] ?? createManagerialAgentDraft(agent),
    }))
    setSelectedManagerialAgentKey(agent.name)
    setSelectedSingleAgentKey(null)
    setOpenSettingsDropdown(null)
    setOpenManagerAgentPickerRowId(null)
    setIsOnboardingWorkflowOpen(false)
    setModelConfigQuery('')
    setManagerialAgentPreviewTab('preview')
  }

  const sendAgentChat = () => {
    const text = agentChatInput.trim()
    if (!text) return
    const id = `${Date.now()}`
    setAgentChatMessages((prev) => [
      ...prev,
      { id: `${id}-u`, role: 'user', text },
      {
        id: `${id}-a`,
        role: 'assistant',
        text: '（演示）已收到你的消息。接入后端后可返回真实 AI 回复。',
      },
    ])
    setAgentChatInput('')
  }

  const renderJoyceAiSplitLayout = (sectionAriaLabel: string, main: ReactNode) => {
    const joyceAiMessagesAndInput = (
      <>
        <div className="agents-ai-messages" role="log" aria-live="polite">
          {agentChatMessages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user' ? 'agents-ai-bubble is-user' : 'agents-ai-bubble is-assistant'
              }
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="agents-ai-input-row">
          <div className="agents-ai-input-wrap">
            <textarea
              className="agents-ai-input"
              rows={2}
              placeholder="输入问题…"
              value={agentChatInput}
              onChange={(e) => setAgentChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendAgentChat()
                }
              }}
            />
            <button className="agents-ai-send" type="button" onClick={sendAgentChat}>
              发送
            </button>
          </div>
        </div>
      </>
    )

    const joyceAiTitleBlock = (
      <div className="agents-ai-panel-title-wrap">
        <span className="agents-ai-panel-title-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient
                id={joyceAiLogoGradId}
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#7ec8ff" />
                <stop offset="100%" stopColor="#1e4fd8" />
              </linearGradient>
            </defs>
            <rect x="1.5" y="1.5" width="21" height="21" rx="7" ry="7" fill={`url(#${joyceAiLogoGradId})`} />
            <polygon points="12,7.2 16.8,12 12,16.8 7.2,12" fill="#ffffff" />
          </svg>
        </span>
        <span className="agents-ai-panel-title">Joyce AI</span>
      </div>
    )

    const dockedSplitLayout = !isAiPanelFloating && !isAiPanelCollapsed

    return (
      <>
        <section
          className={
            !isAiPanelFloating
              ? `agents-page agents-page--split${isAiPanelCollapsed ? ' agents-page--split-ai-collapsed' : ''}`
              : 'agents-page'
          }
          aria-label={sectionAriaLabel}
          style={
            dockedSplitLayout
              ? { gridTemplateColumns: `minmax(0, 1fr) ${aiPanelWidthPx}px` }
              : undefined
          }
        >
          <div className="agents-page-main">{main}</div>
          {!isAiPanelFloating ? (
            <aside
              className={isAiPanelCollapsed ? 'agents-ai-panel is-collapsed' : 'agents-ai-panel'}
              aria-label="Joyce AI 对话"
            >
              {!isAiPanelCollapsed ? (
                <div
                  className={
                    isAiResizeDragging
                      ? 'agents-ai-resize-handle agents-ai-resize-handle--dragging'
                      : 'agents-ai-resize-handle'
                  }
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="调整 AI 面板宽度"
                  aria-valuenow={Math.round(aiPanelWidthPx)}
                  tabIndex={0}
                  onMouseDown={onAiResizeMouseDown}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      const step = e.shiftKey ? 32 : 8
                      setAiPanelWidthPx((w) =>
                        clampAiPanelWidth(w + (e.key === 'ArrowLeft' ? step : -step)),
                      )
                    }
                  }}
                >
                  <div className="agents-ai-resize-grip" role="presentation" aria-hidden="true">
                    <svg
                      className="agents-ai-resize-grip-icon"
                      viewBox="0 0 10 15"
                      width="10"
                      height="15"
                      aria-hidden="true"
                      focusable="false"
                    >
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
              <div
                className={
                  isAiPanelCollapsed
                    ? 'agents-ai-panel-head agents-ai-panel-head--rail'
                    : 'agents-ai-panel-head'
                }
              >
                {isAiPanelCollapsed ? (
                  <>
                    <button
                      type="button"
                      className="agents-ai-toggle"
                      aria-label="展开 Joyce AI"
                      aria-expanded={false}
                      onClick={() => setIsAiPanelCollapsed(false)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20">
                        <path
                          d="M15 18l-6-6 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <span className="agents-ai-rail-label" aria-hidden="true">
                      Joyce AI
                    </span>
                  </>
                ) : (
                  <>
                    {joyceAiTitleBlock}
                    <div className="agents-ai-panel-head-actions">
                      <button
                        type="button"
                        className="agents-ai-toggle"
                        aria-label="浮动窗口"
                        title="浮动窗口"
                        onClick={beginAiFloat}
                      >
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
                      <button
                        type="button"
                        className="agents-ai-toggle"
                        aria-label="折叠 Joyce AI"
                        aria-expanded={true}
                        onClick={() => setIsAiPanelCollapsed(true)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20">
                          <path
                            d="M9 18l6-6-6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {!isAiPanelCollapsed ? joyceAiMessagesAndInput : null}
            </aside>
          ) : null}
        </section>
        {isAiPanelFloating ? (
          <div
            className="agents-ai-float-root"
            style={{
              left: aiFloatPos.x,
              top: aiFloatPos.y,
              width: aiPanelWidthPx,
              height: aiFloatHeightPx,
            }}
          >
            <div
              className="agents-ai-float-resize"
              role="separator"
              aria-orientation="vertical"
              aria-label="调整浮动窗口宽度"
              tabIndex={0}
              onMouseDown={onAiFloatResizeMouseDown}
              onKeyDown={onAiFloatResizeKeyDown}
            />
            <aside className="agents-ai-panel agents-ai-panel--floating" aria-label="Joyce AI 对话（浮动）">
              <div
                className="agents-ai-panel-head agents-ai-panel-head--floating"
                onMouseDown={onAiFloatHeaderMouseDown}
              >
                {joyceAiTitleBlock}
                <button
                  type="button"
                  className="agents-ai-toggle agents-ai-toggle--dock"
                  aria-label="还原到页面侧边"
                  title="还原到侧边"
                  onClick={endAiFloat}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
                    <path
                      d="M9 4H5v16h4V4zm4 2h8v12h-8V6zM11 12h6M8 8l-3 3 3 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {joyceAiMessagesAndInput}
            </aside>
            <div
              className={
                isAiResizeDragging
                  ? 'agents-ai-float-bottom-resize agents-ai-float-bottom-resize--dragging'
                  : 'agents-ai-float-bottom-resize'
              }
              role="separator"
              aria-orientation="horizontal"
              aria-label="调整浮动窗口高度"
              aria-valuenow={Math.round(aiFloatHeightPx)}
              tabIndex={0}
              onMouseDown={onAiFloatResizeBottomMouseDown}
              onKeyDown={onAiFloatResizeBottomKeyDown}
            />
          </div>
        ) : null}
      </>
    )
  }

  const scenarioConfigTagline = (
    <div className="agents-subtitle agents-subtitle--tagline" aria-label="场景·Agent·流程·动作">
      <span className="agents-subtitle-part">场景</span>
      <span className="agents-subtitle-dot" aria-hidden="true">
        ·
      </span>
      <span className="agents-subtitle-part">Agent</span>
      <span className="agents-subtitle-dot" aria-hidden="true">
        ·
      </span>
      <span className="agents-subtitle-part">流程</span>
      <span className="agents-subtitle-dot" aria-hidden="true">
        ·
      </span>
      <span className="agents-subtitle-part">动作</span>
    </div>
  )

  const renderWorkflowNodeDeleteButton = (onRemove: () => void) => (
    <button
      type="button"
      className="scenario-workflow-node-delete"
      aria-label="删除节点"
      title="删除节点"
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        />
      </svg>
    </button>
  )

  const wrapWorkspaceExtraNodeCard = (node: WorkspaceExtraNode, cardInner: ReactNode) => {
    const accentOn =
      workspaceExtraNodeAccentOpenId === node.id ||
      (node.kind === 'branch' && branchDrawerOpen && branchDrawerExtraId === node.id)
    return (
      <div
        className={`scenario-workflow-card scenario-workflow-card--with-icon scenario-workflow-card--workspace-rich${
          accentOn ? ' scenario-workflow-card--workspace-rich-accent-on' : ''
        }`}
        role="listitem"
        tabIndex={0}
        aria-pressed={accentOn}
        onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          if (node.kind === 'branch') return
          setWorkspaceExtraNodeAccentOpenId((cur) => (cur === node.id ? null : node.id))
        }}
      >
        <div className="scenario-workflow-card-workspace-row">
          <div className="scenario-workflow-card-accent" aria-hidden="true" />
          <div className="scenario-workflow-card-workspace-main">{cardInner}</div>
        </div>
      </div>
    )
  }

  const renderWorkspaceExtraNodeCard = (node: WorkspaceExtraNode) => {
    const opt = getWorkspaceNewNodeOption(node.kind)
    switch (node.kind) {
      case 'manual':
        return wrapWorkspaceExtraNodeCard(
          node,
          <>
            <span className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--manual" aria-hidden="true">
              <svg className="scenario-workflow-card-icon-svg" viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="currentColor"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </span>
            <div className="scenario-workflow-card-textstack">
              <div className="scenario-workflow-card-headline">
                <span className="scenario-workflow-card-title">{opt.title}</span>
                <span className="scenario-workflow-card-pill">人工</span>
              </div>
              <span className="scenario-workflow-card-desc">{opt.desc}</span>
            </div>
          </>,
        )
      case 'trigger': {
        const accentOn = workspaceExtraNodeAccentOpenId === node.id
        return (
          <div
            className={`scenario-workflow-card scenario-workflow-card--rich${
              accentOn ? ' scenario-workflow-card--rich-accent-on' : ''
            }`}
            role="listitem"
            tabIndex={0}
            aria-pressed={accentOn}
            onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              setWorkspaceExtraNodeAccentOpenId((cur) => (cur === node.id ? null : node.id))
            }}
          >
            <div className="scenario-workflow-card-banner">
              <svg
                className="scenario-workflow-card-banner-icon"
                viewBox="0 0 16 16"
                width="13"
                height="13"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.15" />
                <circle cx="8" cy="8" r="2.2" fill="currentColor" />
              </svg>
              <span className="scenario-workflow-card-banner-label">Trigger</span>
            </div>
            <div className="scenario-workflow-card-mainrow">
              <div className="scenario-workflow-card-accent" aria-hidden="true" />
              <span className="scenario-workflow-card-head-icon" aria-hidden="true">
                <svg
                  className="scenario-workflow-card-head-icon-svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <rect
                    x="3.5"
                    y="4.5"
                    width="17"
                    height="15"
                    rx="2.5"
                    fill="#ffffff"
                    stroke="#d4c4fc"
                    strokeWidth="1.25"
                  />
                  <circle cx="8" cy="9.5" r="1.15" fill="#7c3aed" />
                  <path
                    d="M11 9h9M11 13h9M11 17h6"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="scenario-workflow-card-textcol">
                <span className="scenario-workflow-card-head-title">{opt.title}</span>
                <div className="scenario-workflow-card-foot">{opt.desc}</div>
              </div>
            </div>
          </div>
        )
      }
      case 'agent':
        return (
          <div className="scenario-workflow-card scenario-workflow-card--with-icon" role="listitem">
            <span
              className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--collect"
              aria-hidden="true"
            >
              {onboardingWorkflowStepIcon('collect')}
            </span>
            <div className="scenario-workflow-card-textstack">
              <div className="scenario-workflow-card-headline">
                <span className="scenario-workflow-card-title">{opt.title}</span>
                <span className="scenario-workflow-card-pill">Single</span>
              </div>
              <span className="scenario-workflow-card-desc">{opt.desc}</span>
            </div>
          </div>
        )
      case 'orchestration':
        return wrapWorkspaceExtraNodeCard(
          node,
          <>
            <span className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--master" aria-hidden="true">
              {onboardingWorkflowStepIcon('master')}
            </span>
            <div className="scenario-workflow-card-textstack">
              <div className="scenario-workflow-card-headline">
                <span className="scenario-workflow-card-title">{opt.title}</span>
                <span className="scenario-workflow-card-pill">编排</span>
              </div>
              <span className="scenario-workflow-card-desc">{opt.desc}</span>
            </div>
          </>,
        )
      case 'branch': {
        const accentOn =
          workspaceExtraNodeAccentOpenId === node.id ||
          (branchDrawerOpen && branchDrawerExtraId === node.id)
        return (
          <div
            className={`scenario-workflow-card scenario-workflow-card--branch-canvas scenario-workflow-card--workspace-rich${
              accentOn ? ' scenario-workflow-card--workspace-rich-accent-on' : ''
            }`}
            role="listitem"
            tabIndex={0}
            aria-pressed={accentOn}
            onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
            }}
          >
            <div className="scenario-workflow-card-workspace-row scenario-workflow-card-workspace-row--branch-canvas">
              <div className="scenario-workflow-card-accent" aria-hidden="true" />
              <div className="scenario-workflow-card-workspace-main scenario-workflow-card-workspace-main--branch-canvas">
                    <ScenarioWorkflowBranchCanvasCard
                      idPrefix={`${tabListId}-ws-${node.id}`}
                      onRuleBarClick={openBranchCanvasPathRules}
                    />
              </div>
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  type ScenarioRow = Agent & {
    tag: string
    category: 'medical' | 'finance' | 'tech' | 'accounting'
  }

  const renderScenarioDetail = (row: ScenarioRow) => {
    const onboardingWorkflow =
      row.name === '新员工入职'
        ? ([
            { key: 'trigger', title: 'Trigger', desc: '满足触发条件时启动本场景工作流。' },
            { key: 'collect', title: '信息收集 Agent', desc: '收集入职所需表单、证件与补充材料。' },
            { key: 'branch', title: '条件分支', desc: '按照业务规则分流到后续不同步骤。' },
          ] as const)
        : null

    const onboardingParallelSteps =
      onboardingWorkflow == null
        ? null
        : ([
            {
              key: 'account' as const,
              title: '账户设置 Agent',
              desc: '配置系统账户、权限与访问凭证。',
            },
            {
              key: 'training' as const,
              title: '培训协调 Agent',
              desc: '分配培训课程并跟踪学习进度。',
            },
            {
              key: 'office' as const,
              title: '办公配置 Agent',
              desc: '开通工位、设备、门禁及协作工具。',
            },
          ] as const)

    const agentDrawerDk = onboardingAgentDrawerKey
    const drawerAgentPillKind: 'single' | 'managerial' = agentDrawerDk
      ? DRAWER_PILL_KIND[agentDrawerDk]
      : 'single'
    const drawerAgentOptionIds: readonly string[] = agentDrawerDk
      ? DRAWER_AGENT_OPTIONS[agentDrawerDk]
      : DRAWER_AGENT_OPTIONS.collect
    const drawerSafeAgentId = agentDrawerDk
      ? clampAgentIdForDrawer(agentDrawerDk, agentDrawerDraftId)
      : clampAgentIdForDrawer('collect', agentDrawerDraftId)
    /** 代理人下拉展示（随所选代理人变化） */
    const drawerAgentDisplayLabel = COLLECT_AGENT_LABELS[drawerSafeAgentId] ?? drawerSafeAgentId
    /** 抽屉头部版块标题：固定为当前画布节点类型，不随代理人选择变化 */
    const drawerSectionTitle =
      agentDrawerDk != null ? COLLECT_AGENT_LABELS[agentDrawerDk] ?? '节点配置' : ''

    const main = onboardingWorkflow ? (
      <div className="scenario-workspace" aria-label="工作区">
        <header className="agents-header agents-header--with-back">
          <div className="agents-header-with-back-stack">
            <div
              className="agents-back-panel agents-back-panel--with-title agents-back-panel--with-workspace-segment"
              aria-label="当前页面"
            >
              <div className="agents-back-panel-lead">
                <button
                  type="button"
                  className="agents-back-btn"
                  aria-label="返回场景列表"
                  onClick={() => setSelectedScenarioName(null)}
                >
                  ←
                </button>
                <h1 className="agents-back-panel-title">{row.name}</h1>
              </div>
              <div className="agents-workspace-segment" role="tablist" aria-label="工作区视图">
                <button
                  type="button"
                  className="agents-workspace-segment__btn"
                  role="tab"
                  aria-selected={scenarioWorkspaceMode === 'editor'}
                  id={`${tabListId}-workspace-editor`}
                  aria-controls={`${tabListId}-workspace-editor-panel`}
                  onClick={() => setScenarioWorkspaceMode('editor')}
                >
                  <svg
                    className="agents-workspace-segment__icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Build
                </button>
                <button
                  type="button"
                  className="agents-workspace-segment__btn"
                  role="tab"
                  aria-selected={scenarioWorkspaceMode === 'runs'}
                  id={`${tabListId}-workspace-runs`}
                  aria-controls={`${tabListId}-workspace-runs-panel`}
                  onClick={() => setScenarioWorkspaceMode('runs')}
                >
                  <svg
                    className="agents-workspace-segment__icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="5"
                      width="16"
                      height="6"
                      rx="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="4"
                      y="14"
                      width="16"
                      height="6"
                      rx="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  Runs
                </button>
              </div>
              <div className="agents-back-panel-trail">
                <button className="agents-btn" type="button">
                  Save
                </button>
                <button className="agents-btn agents-btn-primary" type="button">
                  Publish
                </button>
              </div>
            </div>
          </div>
        </header>

        {scenarioWorkspaceMode === 'editor' ? (
          <div className="scenario-workspace-build">
            {onboardingAgentDrawerKey ? (
              <>
              <aside
                className="scenario-collect-drawer"
                aria-label={`${drawerSectionTitle}配置`}
              >
                <div className="scenario-collect-drawer-header">
                  <h2 className="scenario-collect-drawer-title">{drawerSectionTitle}</h2>
                  <button
                    type="button"
                    className="scenario-collect-drawer-close"
                    aria-label="关闭"
                    onClick={() => {
                      const k = onboardingAgentDrawerKey
                      if (onboardingCollectTaskModalOpen) {
                        setTaskTextByNode((prev) => ({
                          ...prev,
                          [k]: collectTaskModalOpenSnapshotRef.current,
                        }))
                        setOnboardingCollectTaskModalOpen(false)
                      }
                      revertAgentSelectionToSnapshot()
                      setOnboardingAgentDrawerKey(null)
                      setOnboardingCollectOptimizeModalOpen(false)
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="scenario-collect-drawer-body">
                  <div className="scenario-collect-drawer-field">
                    <span className="scenario-collect-drawer-label" id={`${tabListId}-drawer-agent-label`}>
                      代理人
                    </span>
                    <div
                      className="scenario-collect-drawer-select-wrap scenario-collect-drawer-combobox-wrap"
                      ref={agentComboboxWrapRef}
                    >
                      <div className="scenario-collect-drawer-combobox-row">
                        <button
                          type="button"
                          id={`${tabListId}-drawer-agent-jump`}
                          className="scenario-collect-drawer-combobox-jump"
                          aria-labelledby={`${tabListId}-drawer-agent-label`}
                          aria-label={`查看 ${drawerAgentDisplayLabel} 详情`}
                          onClick={() => {
                            setAgentComboboxOpen(false)
                            setAgentDetailBlankPageOpen(true)
                          }}
                        >
                          <span className="scenario-collect-drawer-combobox-trigger-inner">
                            <AgentOptionKindIcon kind={drawerAgentPillKind} />
                            <span className="scenario-collect-drawer-combobox-trigger-text">
                              {drawerAgentDisplayLabel}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          id={`${tabListId}-drawer-agent-trigger`}
                          className="scenario-collect-drawer-combobox-dropdown"
                          aria-haspopup="listbox"
                          aria-expanded={agentComboboxOpen}
                          aria-controls={`${tabListId}-drawer-agent-listbox`}
                          aria-label="展开代理人列表"
                          onClick={() => setAgentComboboxOpen((o) => !o)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                              d="M6 9l6 6 6-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      {agentComboboxOpen ? (
                        <ul
                          id={`${tabListId}-drawer-agent-listbox`}
                          className="scenario-collect-drawer-combobox-menu"
                          role="listbox"
                          aria-label="选择代理人"
                        >
                          {drawerAgentOptionIds.map((v) => (
                            <li key={v} role="presentation">
                              <button
                                type="button"
                                role="option"
                                aria-selected={v === drawerSafeAgentId}
                                className={
                                  v === drawerSafeAgentId
                                    ? 'scenario-collect-drawer-combobox-option scenario-collect-drawer-combobox-option--selected'
                                    : 'scenario-collect-drawer-combobox-option'
                                }
                                onClick={() => {
                                  const k = onboardingAgentDrawerKey
                                  if (k) {
                                    setSavedAgentIdByNode((prev) => ({
                                      ...prev,
                                      [k]: v,
                                    }))
                                  }
                                  setAgentDrawerDraftId(v)
                                  setAgentComboboxOpen(false)
                                }}
                              >
                                <AgentOptionKindIcon kind={drawerAgentPillKind} />
                                <span className="scenario-collect-drawer-combobox-option-label">
                                  {COLLECT_AGENT_LABELS[v] ?? v}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                  <div className="scenario-collect-drawer-field scenario-collect-drawer-field--grow">
                    <label className="scenario-collect-drawer-label" htmlFor={`${tabListId}-collect-task`}>
                      任务配置
                    </label>
                    <div className="scenario-collect-drawer-editor">
                      <div className="scenario-collect-drawer-editor-toolbar">
                        <button
                          type="button"
                          className="scenario-collect-drawer-icon-btn"
                          aria-label="智能建议"
                          title="智能建议"
                          onClick={() => {
                            collectOptimizeActiveLinesRef.current = [...ONBOARDING_OPTIMIZE_LINES]
                            setCollectOptimizeStreamRunId((n) => n + 1)
                            setOnboardingCollectOptimizeModalOpen(true)
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path
                              d="M9 18h6M10 22h4M12 2v1M4.93 4.93l.7.7M3 12h1m16 0h1m-2.63-6.37l.7-.7M19.07 19.07l-.7-.7M12 15a4 4 0 100-8 4 4 0 000 8z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="scenario-collect-drawer-icon-btn"
                          aria-label="展开编辑"
                          title="展开编辑"
                          onClick={() => {
                            collectTaskModalOpenSnapshotRef.current =
                              taskTextByNode[onboardingAgentDrawerKey]
                            setOnboardingCollectTaskModalOpen(true)
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path
                              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <textarea
                        id={`${tabListId}-collect-task`}
                        className="scenario-collect-drawer-textarea"
                        value={taskTextByNode[onboardingAgentDrawerKey]}
                        onChange={(e) =>
                          setTaskTextByNode((prev) => ({
                            ...prev,
                            [onboardingAgentDrawerKey]: e.target.value,
                          }))
                        }
                        spellCheck={false}
                      />
                      <div
                        className="scenario-collect-drawer-editor-mentionbar"
                        aria-label="输入辅助"
                      >
                        <input
                          ref={collectTaskFileInputRef}
                          id={`${tabListId}-collect-task-file`}
                          type="file"
                          className="sr-only"
                          tabIndex={-1}
                          multiple
                          onChange={handleCollectTaskFileChange}
                        />
                        <button
                          type="button"
                          className="scenario-collect-drawer-mentionbar-btn"
                          aria-label="上传附件"
                          title="上传附件"
                          onClick={() => collectTaskFileInputRef.current?.click()}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                              d="M12 16V4m0 0l3.5 3.5M12 4L8.5 7.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <span className="scenario-collect-drawer-mentionbar-at-group">
                          <button
                            type="button"
                            className="scenario-collect-drawer-mentionbar-btn"
                            aria-label="提及"
                            title="提及"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <text
                                x="12"
                                y="15.5"
                                textAnchor="middle"
                                fill="currentColor"
                                fontSize="11"
                                fontFamily="Inter, sans-serif"
                                fontWeight="600"
                              >
                                @
                              </text>
                            </svg>
                          </button>
                          <span className="scenario-collect-drawer-mentionbar-hint">代理</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="scenario-collect-drawer-footer">
                  <button
                    type="button"
                    className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
                    onClick={() => {
                      const k = onboardingAgentDrawerKey
                      if (onboardingCollectTaskModalOpen) {
                        setTaskTextByNode((prev) => ({
                          ...prev,
                          [k]: collectTaskModalOpenSnapshotRef.current,
                        }))
                        setOnboardingCollectTaskModalOpen(false)
                      }
                      revertAgentSelectionToSnapshot()
                      setOnboardingAgentDrawerKey(null)
                      setOnboardingCollectOptimizeModalOpen(false)
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
                    onClick={() => {
                      const k = onboardingAgentDrawerKey
                      const nextId = clampAgentIdForDrawer(k, agentDrawerDraftId)
                      setSavedAgentIdByNode((prev) => ({
                        ...prev,
                        [k]: nextId,
                      }))
                      setOnboardingCollectTaskModalOpen(false)
                      setOnboardingAgentDrawerKey(null)
                      setOnboardingCollectOptimizeModalOpen(false)
                    }}
                  >
                    保存
                  </button>
                </div>
              </aside>
              {onboardingCollectTaskModalOpen ? (
                <div
                  className="scenario-collect-task-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${tabListId}-collect-task-modal-title`}
                >
                  <button
                    type="button"
                    className="scenario-collect-task-modal-backdrop"
                    aria-label="关闭弹窗（不保存）"
                    onClick={closeCollectTaskModalCancel}
                  />
                  <div className="scenario-collect-task-modal-panel">
                    <div className="scenario-collect-task-modal-header">
                      <h2 id={`${tabListId}-collect-task-modal-title`} className="scenario-collect-task-modal-title">
                        任务配置
                      </h2>
                      <button
                        type="button"
                        className="scenario-collect-task-modal-close"
                        aria-label="关闭（不保存）"
                        onClick={closeCollectTaskModalCancel}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <textarea
                      id={`${tabListId}-collect-task-modal`}
                      className="scenario-collect-task-modal-textarea"
                      value={taskTextByNode[onboardingAgentDrawerKey]}
                      onChange={(e) =>
                        setTaskTextByNode((prev) => ({
                          ...prev,
                          [onboardingAgentDrawerKey]: e.target.value,
                        }))
                      }
                      spellCheck={false}
                      aria-label="任务配置全文编辑"
                    />
                    <div className="scenario-collect-task-modal-footer">
                      <button
                        type="button"
                        className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
                        onClick={closeCollectTaskModalCancel}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
                        onClick={closeCollectTaskModalSave}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {onboardingCollectOptimizeModalOpen ? (
                <div
                  className="scenario-collect-optimize-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${tabListId}-collect-optimize-title`}
                >
                  <button
                    type="button"
                    className="scenario-collect-optimize-backdrop"
                    aria-label="关闭弹窗"
                    onClick={() => setOnboardingCollectOptimizeModalOpen(false)}
                  />
                  <div className="scenario-collect-optimize-panel">
                    <div className="scenario-collect-optimize-header">
                      <h2
                        id={`${tabListId}-collect-optimize-title`}
                        className="scenario-collect-optimize-title"
                      >
                        智能优化
                      </h2>
                      <button
                        type="button"
                        className="scenario-collect-optimize-close"
                        aria-label="关闭"
                        onClick={() => setOnboardingCollectOptimizeModalOpen(false)}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="scenario-collect-optimize-body">
                      {collectOptimizePhase === 'thinking' ? (
                        <div className="scenario-collect-optimize-thinking">... 思考中</div>
                      ) : null}
                      {collectOptimizePhase === 'streaming' || collectOptimizePhase === 'done' ? (
                        <textarea
                          ref={optimizeStreamTextareaRef}
                          className="scenario-collect-optimize-stream"
                          value={collectOptimizeStreamText}
                          readOnly={collectOptimizePhase !== 'done'}
                          onChange={(e) => setCollectOptimizeStreamText(e.target.value)}
                          spellCheck={false}
                          aria-label="智能优化生成内容"
                        />
                      ) : null}
                    </div>
                    <div className="scenario-collect-optimize-footer">
                      {collectOptimizePhase === 'done' ? (
                        <div className="scenario-collect-optimize-footer-actions">
                          <button
                            type="button"
                            className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
                            onClick={handleOptimizeRegenerate}
                          >
                            重新生成
                          </button>
                          <button
                            type="button"
                            className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
                            onClick={handleOptimizeApplyToDrawer}
                          >
                            确认替换
                          </button>
                        </div>
                      ) : (
                        <div className="scenario-collect-optimize-footer-row">
                          <input
                            type="text"
                            className="scenario-collect-optimize-input"
                            placeholder="在此输入您的问题..."
                            value={collectOptimizeFooterInput}
                            onChange={(e) => setCollectOptimizeFooterInput(e.target.value)}
                            disabled={
                              collectOptimizePhase === 'thinking' ||
                              collectOptimizePhase === 'streaming'
                            }
                            aria-label="向智能优化提问"
                          />
                          <button
                            type="button"
                            className="scenario-collect-optimize-submit"
                            disabled={
                              collectOptimizePhase === 'thinking' ||
                              collectOptimizePhase === 'streaming'
                            }
                          >
                            {(collectOptimizePhase === 'thinking' ||
                              collectOptimizePhase === 'streaming') && (
                              <span className="scenario-collect-optimize-spinner" aria-hidden="true" />
                            )}
                            {collectOptimizePhase === 'thinking' ? '思考中' : null}
                            {collectOptimizePhase === 'streaming' ? '生成中...' : null}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              </>
            ) : null}
            {branchCanvasPathRulesOpen ? (
              <aside
                className="scenario-branch-path-rules-drawer"
                aria-label={`路径${String.fromCharCode(65 + branchCanvasPathRulesIndex)}`}
              >
                <div className="scenario-branch-path-rules-head">
                  <h2 className="scenario-branch-path-rules-title">
                    路径{String.fromCharCode(65 + branchCanvasPathRulesIndex)}
                  </h2>
                  <div className="scenario-branch-path-rules-head-actions">
                    <button
                      type="button"
                      className="scenario-collect-drawer-close"
                      aria-label="关闭"
                      onClick={closeBranchCanvasPathRules}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="scenario-branch-path-rules-body">
                  <div className="scenario-branch-path-rules-field">
                    <label
                      className="scenario-branch-path-rules-field-label"
                      htmlFor={`${tabListId}-branch-path-name-${branchCanvasPathRulesIndex}`}
                    >
                      路径{String.fromCharCode(65 + branchCanvasPathRulesIndex)}
                    </label>
                    <input
                      id={`${tabListId}-branch-path-name-${branchCanvasPathRulesIndex}`}
                      key={branchCanvasPathRulesIndex}
                      className="scenario-branch-path-rules-input"
                      type="text"
                      defaultValue={`路径${String.fromCharCode(65 + branchCanvasPathRulesIndex)}`}
                      spellCheck={false}
                      aria-label={`路径${String.fromCharCode(65 + branchCanvasPathRulesIndex)}`}
                    />
                  </div>
                  <section
                    className="scenario-branch-path-rules-block"
                    aria-label="路径规则"
                  >
                    <h3 className="scenario-branch-path-rules-section-title">路径规则</h3>
                    <p className="scenario-branch-path-rules-section-lead">
                      {`设定路径${String.fromCharCode(65 + branchCanvasPathRulesIndex)}的触发条件。`}
                    </p>
                    <h4 className="scenario-branch-path-rules-subtitle">触发条件</h4>
                    <div
                      className="scenario-branch-path-rules-select-wrap"
                      ref={branchPathRulesSelectWrapRef}
                    >
                      <button
                        type="button"
                        className="scenario-branch-path-rules-select-trigger"
                        id={`${tabListId}-branch-path-rules-trigger`}
                        aria-haspopup="listbox"
                        aria-expanded={branchPathRulesTriggerOpen}
                        aria-controls={`${tabListId}-branch-path-rules-listbox`}
                        aria-label="触发条件"
                        onClick={() => setBranchPathRulesTriggerOpen((o) => !o)}
                      >
                        <span className="scenario-branch-path-rules-select-value">
                          {
                            BRANCH_PATH_RULES_TRIGGER_OPTIONS.find((x) => x.id === branchPathRulesTriggerMode)
                              ?.label
                          }
                        </span>
                        <span
                          className={
                            branchPathRulesTriggerOpen
                              ? 'scenario-branch-path-rules-select-chevron scenario-branch-path-rules-select-chevron--open'
                              : 'scenario-branch-path-rules-select-chevron'
                          }
                          aria-hidden="true"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16">
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 9l6 6 6-6"
                            />
                          </svg>
                        </span>
                      </button>
                      {branchPathRulesTriggerOpen ? (
                        <ul
                          className="scenario-branch-path-rules-listbox"
                          id={`${tabListId}-branch-path-rules-listbox`}
                          role="listbox"
                          aria-label="触发条件选项"
                        >
                          {BRANCH_PATH_RULES_TRIGGER_OPTIONS.map((opt) => {
                            const selected = branchPathRulesTriggerMode === opt.id
                            return (
                              <li key={opt.id} className="scenario-branch-path-rules-listbox-item" role="none">
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  className={
                                    selected
                                      ? 'scenario-branch-path-rules-option scenario-branch-path-rules-option--selected'
                                      : 'scenario-branch-path-rules-option'
                                  }
                                  onClick={() => {
                                    setBranchPathRulesTriggerMode(opt.id)
                                    setBranchPathRulesTriggerOpen(false)
                                  }}
                                >
                                  <span className="scenario-branch-path-rules-option-label">{opt.label}</span>
                                  {selected ? (
                                    <span className="scenario-branch-path-rules-option-check" aria-hidden="true">
                                      <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.25"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="scenario-branch-path-rules-option-check-spacer" aria-hidden="true" />
                                  )}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </section>
                </div>
              </aside>
            ) : null}
            {branchDrawerOpen ? (
              <aside className="scenario-branch-drawer" aria-label="条件分支配置">
                <div className="scenario-branch-drawer-header">
                  <h2 className="scenario-branch-drawer-title">条件分支</h2>
                  <button
                    type="button"
                    className="scenario-collect-drawer-close"
                    aria-label="关闭"
                    onClick={handleBranchDrawerCancel}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="scenario-branch-drawer-body">
                  <div className="scenario-branch-field">
                    <label className="scenario-branch-label" htmlFor={`${tabListId}-branch-logic`}>
                      分支逻辑{' '}
                      <span className="scenario-branch-required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <div className="scenario-branch-logic-wrap" ref={branchMentionWrapRef}>
                      <div className="scenario-collect-drawer-editor-toolbar">
                        <button
                          type="button"
                          className="scenario-collect-drawer-icon-btn"
                          aria-label="展开编辑"
                          title="展开编辑"
                          onClick={openBranchLogicExpandModal}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path
                              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <textarea
                        ref={branchLogicTextareaRef}
                        id={`${tabListId}-branch-logic`}
                        className="scenario-branch-logic-textarea"
                        placeholder="Choose a path..."
                        value={branchLogicText}
                        onChange={handleBranchLogicTextChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape' && branchMentionOpen) {
                            e.stopPropagation()
                            setBranchMentionOpen(false)
                          }
                        }}
                        spellCheck={false}
                        aria-describedby={`${tabListId}-branch-mention-hint`}
                      />
                      <div className="scenario-branch-logic-footer">
                      {branchMentionOpen ? (
                        <div
                          className="scenario-branch-mention-menu"
                          role="listbox"
                          aria-label="选择工具或代理"
                          id={`${tabListId}-branch-mention-menu`}
                        >
                          <div className="scenario-branch-mention-group" role="presentation">
                            <div className="scenario-branch-mention-group-label">工具</div>
                            <ul className="scenario-branch-mention-list">
                              {BRANCH_MENTION_TOOLS.map((t) => (
                                <li key={t.id} role="presentation">
                                  <button
                                    type="button"
                                    role="option"
                                    className="scenario-branch-mention-option"
                                    onClick={() => handleBranchMentionPick(t)}
                                  >
                                    {t.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="scenario-branch-mention-group" role="presentation">
                            <div className="scenario-branch-mention-group-label">代理</div>
                            <ul className="scenario-branch-mention-list">
                              {BRANCH_MENTION_AGENTS.map((a) => (
                                <li key={a.id} role="presentation">
                                  <button
                                    type="button"
                                    role="option"
                                    className="scenario-branch-mention-option"
                                    onClick={() => handleBranchMentionPick(a)}
                                  >
                                    {a.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="scenario-branch-logic-mention"
                        id={`${tabListId}-branch-mention-hint`}
                        aria-haspopup="listbox"
                        aria-expanded={branchMentionOpen}
                        aria-controls={branchMentionOpen ? `${tabListId}-branch-mention-menu` : undefined}
                        onClick={() => setBranchMentionOpen((o) => !o)}
                      >
                        <span className="scenario-branch-logic-mention-at">@</span>
                        <span className="scenario-branch-logic-mention-text">提任何事</span>
                      </button>
                      </div>
                    </div>
                  </div>

                  {branchPaths.map((p, idx) => (
                    <div key={p.id} className="scenario-branch-path-card">
                      <div className="scenario-branch-path-head">
                        <span className="scenario-branch-path-title">路径 {idx + 1}</span>
                        <button
                          type="button"
                          className="scenario-branch-path-delete"
                          aria-label="删除路径"
                          disabled={branchPaths.length <= 1}
                          onClick={() => {
                            setBranchPaths((paths) =>
                              paths.length <= 1 ? paths : paths.filter((x) => x.id !== p.id),
                            )
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <label className="scenario-branch-sublabel" htmlFor={`${tabListId}-branch-next-${p.id}`}>
                        下一个节点
                      </label>
                      <select
                        id={`${tabListId}-branch-next-${p.id}`}
                        className="scenario-branch-select"
                        value={p.nextNode}
                        onChange={(e) =>
                          setBranchPaths((paths) =>
                            paths.map((x) =>
                              x.id === p.id ? { ...x, nextNode: e.target.value } : x,
                            ),
                          )
                        }
                      >
                        <option value="">选择下一个节点</option>
                        {BRANCH_NEXT_NODE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <label className="scenario-branch-sublabel" htmlFor={`${tabListId}-branch-desc-${p.id}`}>
                        描述
                      </label>
                      <div className="scenario-branch-path-desc-wrap">
                        <div className="scenario-collect-drawer-editor-toolbar">
                          <button
                            type="button"
                            className="scenario-collect-drawer-icon-btn"
                            aria-label="展开编辑"
                            title="展开编辑"
                            onClick={() => openBranchPathDescModal(p.id)}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                              <path
                                d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <textarea
                          id={`${tabListId}-branch-desc-${p.id}`}
                          className="scenario-branch-path-desc"
                          placeholder="描述路径......"
                          value={p.description}
                          onChange={(e) =>
                            setBranchPaths((paths) =>
                              paths.map((x) =>
                                x.id === p.id ? { ...x, description: e.target.value } : x,
                              ),
                            )
                          }
                          spellCheck={false}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="scenario-branch-add-path"
                    onClick={() => {
                      const id = `branch-path-${branchPathIdSeqRef.current++}`
                      setBranchPaths((paths) => [
                        ...paths,
                        { id, nextNode: DEFAULT_BRANCH_NEXT_NODE, description: '' },
                      ])
                    }}
                  >
                    + 添加路径
                  </button>
                </div>
                <div className="scenario-collect-drawer-footer">
                  <button
                    type="button"
                    className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
                    onClick={handleBranchDrawerCancel}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
                    onClick={handleBranchDrawerSave}
                  >
                    保存
                  </button>
                </div>
              </aside>
            ) : null}
            {branchLogicModalOpen ? (
              <div
                className="scenario-collect-task-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${tabListId}-branch-logic-modal-title`}
              >
                <button
                  type="button"
                  className="scenario-collect-task-modal-backdrop"
                  aria-label="关闭弹窗（不保存）"
                  onClick={closeBranchLogicModalCancel}
                />
                <div className="scenario-collect-task-modal-panel">
                  <div className="scenario-collect-task-modal-header">
                    <h2
                      id={`${tabListId}-branch-logic-modal-title`}
                      className="scenario-collect-task-modal-title"
                    >
                      分支逻辑
                    </h2>
                    <button
                      type="button"
                      className="scenario-collect-task-modal-close"
                      aria-label="关闭（不保存）"
                      onClick={closeBranchLogicModalCancel}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    id={`${tabListId}-branch-logic-modal`}
                    className="scenario-collect-task-modal-textarea"
                    value={branchLogicText}
                    onChange={(e) => setBranchLogicText(e.target.value)}
                    spellCheck={false}
                    aria-label="分支逻辑全文编辑"
                  />
                  <div className="scenario-collect-task-modal-footer">
                    <button
                      type="button"
                      className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
                      onClick={closeBranchLogicModalCancel}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
                      onClick={closeBranchLogicModalSave}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {branchPathDescModalPathId != null ? (
              <div
                className="scenario-collect-task-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${tabListId}-branch-path-desc-modal-title`}
              >
                <button
                  type="button"
                  className="scenario-collect-task-modal-backdrop"
                  aria-label="关闭弹窗（不保存）"
                  onClick={closeBranchPathDescModalCancel}
                />
                <div className="scenario-collect-task-modal-panel">
                  <div className="scenario-collect-task-modal-header">
                    <h2
                      id={`${tabListId}-branch-path-desc-modal-title`}
                      className="scenario-collect-task-modal-title"
                    >
                      路径{' '}
                      {Math.max(
                        1,
                        branchPaths.findIndex((x) => x.id === branchPathDescModalPathId) + 1,
                      )}{' '}
                      描述
                    </h2>
                    <button
                      type="button"
                      className="scenario-collect-task-modal-close"
                      aria-label="关闭（不保存）"
                      onClick={closeBranchPathDescModalCancel}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    id={`${tabListId}-branch-path-desc-modal`}
                    className="scenario-collect-task-modal-textarea"
                    value={
                      branchPaths.find((x) => x.id === branchPathDescModalPathId)?.description ?? ''
                    }
                    onChange={(e) => {
                      const id = branchPathDescModalPathId
                      if (id == null) return
                      setBranchPaths((paths) =>
                        paths.map((x) =>
                          x.id === id ? { ...x, description: e.target.value } : x,
                        ),
                      )
                    }}
                    spellCheck={false}
                    aria-label="路径描述全文编辑"
                  />
                  <div className="scenario-collect-task-modal-footer">
                    <button
                      type="button"
                      className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
                      onClick={closeBranchPathDescModalCancel}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
                      onClick={closeBranchPathDescModalSave}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="scenario-workspace-build-main">
        <div
          ref={workflowViewportRef}
          id={`${tabListId}-workspace-editor-panel`}
          role="tabpanel"
          aria-labelledby={`${tabListId}-workspace-editor`}
          className="scenario-workflow-region"
          onPointerDown={onWorkflowViewportPointerDown}
          onPointerMove={onWorkflowViewportPointerMove}
          onPointerUp={onWorkflowViewportPointerUp}
          onPointerCancel={onWorkflowViewportPointerUp}
        >
          <div className="scenario-workflow-canvas">
            <div
              className="scenario-workflow-scale-wrap"
              style={{
                width: (ONBOARDING_BOARD_W * workspaceCanvasZoom) / 100,
                height: (ONBOARDING_BOARD_H * workspaceCanvasZoom) / 100,
              }}
            >
              <div
                className="scenario-workflow-scale"
                style={{
                  width: ONBOARDING_BOARD_W,
                  height: ONBOARDING_BOARD_H,
                  transform: `scale(${workspaceCanvasZoom / 100})`,
                  transformOrigin: 'top left',
                }}
              >
              <div
                className="scenario-workflow-board"
                role="presentation"
                style={{
                  width: ONBOARDING_BOARD_W,
                  height: ONBOARDING_BOARD_H,
                }}
              >
                {!removedOnboardingKeys.includes('trigger') ? (
                <div
                  className="scenario-workflow-node"
                  style={{
                    left: onboardingNodePos.trigger.x,
                    top: onboardingNodePos.trigger.y,
                  }}
                  onPointerDown={(e) => onWorkflowNodePointerDown('trigger', e)}
                  onPointerMove={onWorkflowNodePointerMove}
                  onPointerUp={onWorkflowNodePointerUp}
                  onPointerCancel={onWorkflowNodePointerUp}
                >
                  {renderWorkflowNodeDeleteButton(() => removeOnboardingBoardNode('trigger'))}
                  <div
                    className={`scenario-workflow-card scenario-workflow-card--rich${
                      onboardingTriggerAccentOpen ? ' scenario-workflow-card--rich-accent-on' : ''
                    }`}
                    role="listitem"
                    tabIndex={0}
                    aria-pressed={onboardingTriggerAccentOpen}
                    onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setOnboardingTriggerAccentOpen((open) => !open)
                      }
                    }}
                  >
                    <div className="scenario-workflow-card-banner">
                      <svg
                        className="scenario-workflow-card-banner-icon"
                        viewBox="0 0 16 16"
                        width="13"
                        height="13"
                        aria-hidden="true"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.15"
                        />
                        <circle cx="8" cy="8" r="2.2" fill="currentColor" />
                      </svg>
                      <span className="scenario-workflow-card-banner-label">Trigger</span>
                    </div>
                    <div className="scenario-workflow-card-mainrow">
                      <div className="scenario-workflow-card-accent" aria-hidden="true" />
                      <span className="scenario-workflow-card-head-icon" aria-hidden="true">
                        <svg
                          className="scenario-workflow-card-head-icon-svg"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                        >
                          <rect
                            x="3.5"
                            y="4.5"
                            width="17"
                            height="15"
                            rx="2.5"
                            fill="#ffffff"
                            stroke="#d4c4fc"
                            strokeWidth="1.25"
                          />
                          <circle cx="8" cy="9.5" r="1.15" fill="#7c3aed" />
                          <path
                            d="M11 9h9M11 13h9M11 17h6"
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div className="scenario-workflow-card-textcol">
                        <span className="scenario-workflow-card-head-title">入职启动</span>
                        <div className="scenario-workflow-card-foot">
                          收到HR发起的新员工入职申请
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                ) : null}
                {!removedOnboardingKeys.includes('collect') ? (
                <div
                  className="scenario-workflow-node"
                  style={{
                    left: onboardingNodePos.collect.x,
                    top: onboardingNodePos.collect.y,
                  }}
                  onPointerDown={(e) => onWorkflowNodePointerDown('collect', e)}
                  onPointerMove={onWorkflowNodePointerMove}
                  onPointerUp={onWorkflowNodePointerUp}
                  onPointerCancel={onWorkflowNodePointerUp}
                >
                  {renderWorkflowNodeDeleteButton(() => removeOnboardingBoardNode('collect'))}
                  <div className="scenario-workflow-card scenario-workflow-card--with-icon" role="listitem">
                    <span
                      className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--collect"
                      aria-hidden="true"
                    >
                      {onboardingWorkflowStepIcon('collect')}
                    </span>
                    <div className="scenario-workflow-card-textstack">
                      <div className="scenario-workflow-card-headline">
                        <span className="scenario-workflow-card-title">
                          {COLLECT_AGENT_LABELS[clampAgentIdForDrawer('collect', savedAgentIdByNode.collect)] ??
                            onboardingWorkflow[1].title}
                        </span>
                        <span className="scenario-workflow-card-pill">Single</span>
                      </div>
                      <span className="scenario-workflow-card-desc">{onboardingWorkflow[1].desc}</span>
                    </div>
                  </div>
                </div>
                ) : null}
                {!removedOnboardingKeys.includes('branch') ? (
                <div
                  className="scenario-workflow-node"
                  style={{
                    left: onboardingNodePos.branch.x,
                    top: onboardingNodePos.branch.y,
                  }}
                  onPointerDown={(e) => onWorkflowNodePointerDown('branch', e)}
                  onPointerMove={onWorkflowNodePointerMove}
                  onPointerUp={onWorkflowNodePointerUp}
                  onPointerCancel={onWorkflowNodePointerUp}
                >
                  {renderWorkflowNodeDeleteButton(() => removeOnboardingBoardNode('branch'))}
                  <div className="scenario-workflow-card scenario-workflow-card--branch-canvas" role="listitem">
                    <ScenarioWorkflowBranchCanvasCard
                      idPrefix={`${tabListId}-board-branch`}
                      onRuleBarClick={openBranchCanvasPathRules}
                    />
                  </div>
                </div>
                ) : null}
                {onboardingParallelSteps != null
                  ? onboardingParallelSteps
                      .filter((p) => !removedOnboardingKeys.includes(p.key))
                      .map((p) => (
                      <div
                        key={p.key}
                        className="scenario-workflow-node"
                        style={{
                          left: onboardingNodePos[p.key].x,
                          top: onboardingNodePos[p.key].y,
                        }}
                        onPointerDown={(e) => onWorkflowNodePointerDown(p.key, e)}
                        onPointerMove={onWorkflowNodePointerMove}
                        onPointerUp={onWorkflowNodePointerUp}
                        onPointerCancel={onWorkflowNodePointerUp}
                      >
                        {renderWorkflowNodeDeleteButton(() => removeOnboardingBoardNode(p.key))}
                        <div className="scenario-workflow-card scenario-workflow-card--with-icon">
                          <span
                            className={`scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--${p.key}`}
                            aria-hidden="true"
                          >
                            {onboardingWorkflowStepIcon(p.key)}
                          </span>
                          <div className="scenario-workflow-card-textstack">
                            <div className="scenario-workflow-card-headline">
                              <span className="scenario-workflow-card-title">
                                {COLLECT_AGENT_LABELS[clampAgentIdForDrawer(p.key, savedAgentIdByNode[p.key])] ?? p.title}
                              </span>
                              <span className="scenario-workflow-card-pill">
                                {p.key === 'account' || p.key === 'training'
                                  ? 'Managerial'
                                  : 'Single'}
                              </span>
                            </div>
                            <span className="scenario-workflow-card-desc">{p.desc}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
                {!removedOnboardingKeys.includes('master') ? (
                <div
                  className="scenario-workflow-node"
                  style={{
                    left: onboardingNodePos.master.x,
                    top: onboardingNodePos.master.y,
                  }}
                  onPointerDown={(e) => onWorkflowNodePointerDown('master', e)}
                  onPointerMove={onWorkflowNodePointerMove}
                  onPointerUp={onWorkflowNodePointerUp}
                  onPointerCancel={onWorkflowNodePointerUp}
                >
                  {renderWorkflowNodeDeleteButton(() => removeOnboardingBoardNode('master'))}
                  <div className="scenario-workflow-card scenario-workflow-card--with-icon" role="listitem">
                    <span
                      className="scenario-workflow-card-icon-wrap scenario-workflow-card-icon-wrap--master"
                      aria-hidden="true"
                    >
                      {onboardingWorkflowStepIcon('master')}
                    </span>
                    <div className="scenario-workflow-card-textstack">
                      <span className="scenario-workflow-card-title">
                        {COLLECT_AGENT_LABELS[clampAgentIdForDrawer('master', savedAgentIdByNode.master)] ??
                        '入职总控Agent'}
                      </span>
                      <span
                        className="scenario-workflow-card-desc scenario-workflow-card-desc--single-line"
                        title="生成入职报告：员工档案、IT账户、培训及办公配置。"
                      >
                        生成入职报告：员工档案、IT账户、培训及办公配置。
                      </span>
                    </div>
                  </div>
                </div>
                ) : null}
                <svg
                  className="scenario-workflow-edges"
                  width={ONBOARDING_BOARD_W}
                  height={ONBOARDING_BOARD_H}
                  viewBox={`0 0 ${ONBOARDING_BOARD_W} ${ONBOARDING_BOARD_H}`}
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  {ONBOARDING_WORKFLOW_EDGES.filter(
                    (edge) =>
                      !removedOnboardingKeys.includes(edge.from) && !removedOnboardingKeys.includes(edge.to),
                  ).map((e) => (
                    <path
                      key={`${e.from}-${e.to}`}
                      className="scenario-workflow-edge-path"
                      d={onboardingWorkflowEdgePath(e.from, e.to, onboardingNodePos)}
                      fill="none"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                {workspaceExtraNodes.map((node) => (
                  <div
                    key={node.id}
                    className="scenario-workflow-node"
                    style={{
                      left: node.x,
                      top: node.y,
                    }}
                    onPointerDown={(e) => onWorkflowExtraNodePointerDown(node.id, e)}
                    onPointerMove={onWorkflowNodePointerMove}
                    onPointerUp={onWorkflowNodePointerUp}
                    onPointerCancel={onWorkflowNodePointerUp}
                  >
                    {renderWorkflowNodeDeleteButton(() => removeWorkspaceExtraNodeById(node.id))}
                    {renderWorkspaceExtraNodeCard(node)}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="scenario-workspace-toolbar" role="toolbar" aria-label="工作区工具栏">
          <span className="scenario-workspace-toolbar-zoom sr-only" aria-live="polite">
            当前缩放 {workspaceCanvasZoom}%
          </span>
          <span className="scenario-workspace-newnode-wrap" ref={workspaceNewNodeWrapRef}>
            <button
              type="button"
              className="scenario-workspace-toolbar-btn scenario-workspace-toolbar-btn--primary"
              title="新增节点"
              aria-haspopup="menu"
              aria-expanded={workspaceNewNodeMenuOpen}
              aria-controls={workspaceNewNodeMenuOpen ? `${tabListId}-workspace-newnode-menu` : undefined}
              onClick={() => setWorkspaceNewNodeMenuOpen((o) => !o)}
            >
              + New
            </button>
            {workspaceNewNodeMenuOpen ? (
              <div
                className="scenario-workspace-newnode-menu"
                id={`${tabListId}-workspace-newnode-menu`}
                role="menu"
                aria-label="选择节点类型"
              >
                {WORKSPACE_NEW_NODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitem"
                    className="scenario-workspace-newnode-item"
                    onClick={() => addWorkspaceNodeFromMenu(opt.id as WorkspaceNewNodeKind)}
                  >
                    {workspaceNewNodeMenuIcon(opt.id as WorkspaceNewNodeKind)}
                    <span className="scenario-workspace-newnode-item-main">
                      <span className="scenario-workspace-newnode-item-title">{opt.title}</span>
                      <span className="scenario-workspace-newnode-item-desc">{opt.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </span>
          <span className="scenario-workspace-toolbar-sep" aria-hidden="true" />
          <div className="scenario-workspace-toolbar-group" role="group" aria-label="画布缩放">
            <button
              type="button"
              className="scenario-workspace-toolbar-icon scenario-workspace-toolbar-icon--glyph"
              title={`放大（${workspaceCanvasZoom}%）`}
              aria-label="放大"
              disabled={workspaceCanvasZoom >= 300}
              onClick={() => {
                clearWorkflowCanvasMargins()
                setWorkspaceCanvasZoom((z) => Math.min(300, z + 10))
              }}
            >
              <svg
                className="scenario-workspace-toolbar-svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M16.5 16.5L21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path
                  d="M11 8v6M8 11h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="scenario-workspace-toolbar-icon scenario-workspace-toolbar-icon--glyph"
              title={`缩小（${workspaceCanvasZoom}%）`}
              aria-label="缩小"
              disabled={workspaceCanvasZoom <= 50}
              onClick={() => {
                clearWorkflowCanvasMargins()
                setWorkspaceCanvasZoom((z) => Math.max(50, z - 10))
              }}
            >
              <svg
                className="scenario-workspace-toolbar-svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M16.5 16.5L21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path
                  d="M8 11h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="scenario-workspace-toolbar-icon scenario-workspace-toolbar-icon--glyph"
              title="恢复默认排版并适配视窗"
              aria-label="展开适配画布"
              onClick={() => {
                const next = { ...DEFAULT_ONBOARDING_NODE_POS }
                onboardingNodePosRef.current = next
                flushSync(() => {
                  setOnboardingNodePos(next)
                })
                fitOnboardingWorkflowToViewport()
              }}
            >
              <svg
                className="scenario-workspace-toolbar-svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M9 3H3v6M15 21h6v-6M21 9v6h-6M3 15v-6h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <span className="scenario-workspace-toolbar-sep" aria-hidden="true" />
          <button
            type="button"
            className="scenario-workspace-toolbar-ai"
            title="展开 Joyce AI 对话"
            aria-label="展开 Joyce AI 对话"
            onClick={() => {
              if (isAiPanelFloating) {
                endAiFloat()
              }
              setIsAiPanelCollapsed(false)
            }}
          >
            <svg
              className="scenario-workspace-toolbar-ai-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M12 3v2M9 4l1 2M15 4l-1 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <rect
                x="5"
                y="7"
                width="14"
                height="12"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="9.5" cy="12" r="1.25" fill="currentColor" />
              <circle cx="14.5" cy="12" r="1.25" fill="currentColor" />
              <path
                d="M10 16h4"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
            <span className="scenario-workspace-toolbar-ai-badge">AI</span>
          </button>
        </div>
            </div>
          </div>
        ) : (
          <div
            className="scenario-workspace-runs"
            role="tabpanel"
            id={`${tabListId}-workspace-runs-panel`}
            aria-labelledby={`${tabListId}-workspace-runs`}
            aria-label="运行记录"
          >
            <p className="scenario-workspace-runs-placeholder">
              运行历史与日志将显示于此。（演示占位）
            </p>
          </div>
        )}
      </div>
    ) : (
      <>
        <header className="agents-header agents-header--with-back">
          <div className="agents-header-with-back-stack">
            <div className="agents-back-panel agents-back-panel--with-title" aria-label="当前页面">
              <button
                type="button"
                className="agents-back-btn"
                aria-label="返回场景列表"
                onClick={() => setSelectedScenarioName(null)}
              >
                ←
              </button>
              <h1 className="agents-back-panel-title">{row.name}</h1>
            </div>
          </div>
        </header>
      </>
    )
    return renderJoyceAiSplitLayout(`场景详情 · ${row.name}`, main)
  }

  const renderScenarioEdit = (row: ScenarioRow) => {
    const main = (
      <>
        <header className="agents-header agents-header--with-back">
          <div className="agents-header-with-back-stack">
            <div className="agents-back-panel agents-back-panel--with-title" aria-label="当前页面">
              <button
                type="button"
                className="agents-back-btn"
                aria-label="返回场景列表"
                onClick={() => setEditingScenarioName(null)}
              >
                ←
              </button>
              <h1 className="agents-back-panel-title">{row.name}</h1>
            </div>
          </div>
        </header>

        <div className="scenario-detail-body">
          <p className="scenario-detail-desc">
            在此修改场景名称、描述与分类等信息。（演示占位，接入后端后可保存。）
          </p>
        </div>
      </>
    )
    return renderJoyceAiSplitLayout(`编辑场景 · ${row.name}`, main)
  }

  type AgentRow = Agent & { tag: string }

  const renderAgentEdit = (row: AgentRow) => {
    const main = (
      <>
        <header className="agents-header agents-header--with-back">
          <div className="agents-header-with-back-stack">
            <div className="agents-back-panel agents-back-panel--with-title" aria-label="当前页面">
              <button
                type="button"
                className="agents-back-btn"
                aria-label="返回 Agent 列表"
                onClick={() => setEditingAgentName(null)}
              >
                ←
              </button>
              <h1 className="agents-back-panel-title">{row.name}</h1>
            </div>
          </div>
        </header>

        <div className="scenario-detail-body">
          <p className="scenario-detail-desc">
            在此修改 Agent 名称、描述与能力配置。（演示占位，接入后端后可保存。）
          </p>
        </div>
      </>
    )
    return renderJoyceAiSplitLayout(`编辑 Agent · ${row.name}`, main)
  }

  const renderCardsPage = <T extends { name: string; desc: string; meta: string; tag: string }>(
    title: string,
    primaryActionLabel: string,
    tabs: { key: string; label: string; count: number }[],
    activeTab: string,
    setActiveTab: (key: string) => void,
    filtered: T[],
    tagLabel: (a: T) => string,
    withAiPanel = false,
    onCardClick?: (item: T) => void,
    onEditItem?: (item: T) => void,
  ) => {
    const main = (
      <>
        <header className="agents-header">
          <div>
            <div className="agents-title">{title}</div>
            {scenarioConfigTagline}
          </div>
          <div className="agents-header-actions">
            <button className="agents-btn agents-btn-primary" type="button">
              {primaryActionLabel}
            </button>
          </div>
        </header>

        <div className="agents-tabs" role="tablist" aria-label="筛选">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={t.key === activeTab ? 'agents-tab is-active' : 'agents-tab'}
              type="button"
              role="tab"
              aria-selected={t.key === activeTab}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label} <span className="agents-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="agents-toolbar">
          <div className="agents-search">
            <span className="agents-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input className="agents-search-input" placeholder="Search" />
          </div>
          <div className="agents-toolbar-right">
            <div className="agents-view-actions" />
          </div>
        </div>

        <div className="agents-grid" aria-label="列表">
          {filtered.map((a) => {
            const iconPalette = pickAgentIconPalette(a.name)
            const isSingleAgentCard = a.tag === 'Single Agent'
            const isManagerialAgentCard = a.tag === 'Managerial Agent'
            const useAgentLibraryNav = !onCardClick && (isSingleAgentCard || isManagerialAgentCard)

            return (
            <article
              key={a.name}
              className={
                onCardClick || useAgentLibraryNav
                  ? 'agent-card agent-card--clickable is-clickable'
                  : 'agent-card'
              }
              aria-label={onCardClick ? `查看场景：${a.name}` : undefined}
              role={useAgentLibraryNav ? 'button' : undefined}
              tabIndex={useAgentLibraryNav ? 0 : undefined}
              onClick={(event) => {
                const target = event.target as HTMLElement | null
                if (target?.closest('.agent-card-more-wrap')) return
                if (onCardClick) {
                  onCardClick(a)
                  return
                }
                if (isSingleAgentCard) openSingleAgentSettings(a as unknown as Agent)
                if (isManagerialAgentCard) openManagerialAgentSettings(a as unknown as Agent)
              }}
              onKeyDown={(event) => {
                if (!useAgentLibraryNav) return
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                if (isSingleAgentCard) openSingleAgentSettings(a as unknown as Agent)
                if (isManagerialAgentCard) openManagerialAgentSettings(a as unknown as Agent)
              }}
            >
              <div className="agent-card-more-wrap">
                <button
                  className="agent-card-more"
                  type="button"
                  aria-label="更多操作"
                  aria-haspopup="menu"
                  aria-expanded={openAgentMenu === a.name}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenAgentMenu((v) => (v === a.name ? null : a.name))
                  }}
                >
                  ⋮
                </button>
                <div
                  className={openAgentMenu === a.name ? 'agent-card-menu is-open' : 'agent-card-menu'}
                  role="menu"
                  aria-label="操作菜单"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="agent-card-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onEditItem?.(a)
                      setOpenAgentMenu(null)
                    }}
                  >
                    <span className="agent-card-menu-icon" aria-hidden="true">
                      ✎
                    </span>
                    Edit
                  </button>
                  <button
                    className="agent-card-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAgents((prev) => {
                        const used = new Set(prev.map((x) => x.name))
                        const name = makeDuplicateName(a.name, used)
                        const copy: Agent = { ...(a as unknown as Agent), name, meta: 'just now' }
                        if (a.tag === 'Single Agent') {
                          setSingleAgentSettingsByKey((settingsPrev) => {
                            const source =
                              settingsPrev[a.name] ?? createSingleAgentDraft(a as unknown as Agent)
                            return {
                              ...settingsPrev,
                              [name]: { ...source, name },
                            }
                          })
                        }
                        if (a.tag === 'Managerial Agent') {
                          setManagerialAgentSettingsByKey((settingsPrev) => {
                            const source =
                              settingsPrev[a.name] ?? createManagerialAgentDraft(a as unknown as Agent)
                            return {
                              ...settingsPrev,
                              [name]: { ...source, name },
                            }
                          })
                        }
                        const idx = prev.findIndex((x) => x.name === a.name)
                        if (idx === -1) return [copy, ...prev]
                        return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
                      })
                      setOpenAgentMenu(null)
                    }}
                  >
                    <span className="agent-card-menu-icon" aria-hidden="true">
                      ⧉
                    </span>
                    Duplicate
                  </button>
                  <button
                    className="agent-card-menu-item is-danger"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      const ok = window.confirm('确认删除该卡片吗？此操作不可撤销。')
                      if (!ok) return
                      setAgents((prev) => prev.filter((x: Agent) => x.name !== a.name))
                      setSingleAgentSettingsByKey((prev) => {
                        if (!(a.name in prev)) return prev
                        const next = { ...prev }
                        delete next[a.name]
                        return next
                      })
                      setManagerialAgentSettingsByKey((prev) => {
                        if (!(a.name in prev)) return prev
                        const next = { ...prev }
                        delete next[a.name]
                        return next
                      })
                      setSelectedSingleAgentKey((prev) => (prev === a.name ? null : prev))
                      setSelectedManagerialAgentKey((prev) => (prev === a.name ? null : prev))
                      setOpenAgentMenu(null)
                    }}
                  >
                    <span className="agent-card-menu-icon" aria-hidden="true">
                      🗑
                    </span>
                    Delete
                  </button>
                </div>
              </div>
              <div
                className="agent-card-icon agent-card-icon-grad"
                style={
                  {
                    '--agent-icon-from': iconPalette.from,
                    '--agent-icon-via': iconPalette.via,
                    '--agent-icon-to': iconPalette.to,
                    '--agent-icon-shadow': iconPalette.shadow,
                  } as CSSProperties
                }
                aria-hidden="true"
              />
              <div className="agent-card-name">{a.name}</div>
              <div className="agent-card-desc">{a.desc}</div>
              <div className="agent-card-footer">
                <div className="agent-card-meta">{a.meta}</div>
                <div className="agent-card-tag">{tagLabel(a)}</div>
              </div>
            </article>
            )
          })}
        </div>
      </>
    )

    if (!withAiPanel) {
      return (
        <section className="agents-page" aria-label={title}>
          <div className="agents-page-main">{main}</div>
        </section>
      )
    }
    return renderJoyceAiSplitLayout(title, main)
  }

  const renderSingleAgentSettingsPage = () => {
    if (!selectedSingleAgent) return null

    const renderMultiSelectField = (
      dropdownKey: 'agentTools' | 'skills' | 'knowledge' | 'tools',
      label: string,
      helper: string,
      placeholder: string,
      options: DropdownOption[],
      selectedIds: string[],
      dropdownPlacement: 'above' | 'below' = 'below',
    ) => (
      <div className="single-agent-field">
        <label className="single-agent-label">
          {label}
          <span className="single-agent-label-info" aria-hidden="true">
            i
          </span>
        </label>
        <div className="single-agent-helper">{helper}</div>
        <div className="single-agent-select-wrap">
          <button
            className={openSettingsDropdown === dropdownKey ? 'single-agent-select is-open' : 'single-agent-select'}
            type="button"
            aria-expanded={openSettingsDropdown === dropdownKey}
            onClick={() =>
              setOpenSettingsDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }
          >
            <span className={selectedIds.length > 0 ? 'single-agent-select-value' : 'single-agent-select-placeholder'}>
              {getSelectedLabels(options, selectedIds) || placeholder}
            </span>
            <span className="single-agent-select-caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {openSettingsDropdown === dropdownKey ? (
            <div
              className={
                dropdownPlacement === 'above'
                  ? 'single-agent-dropdown single-agent-dropdown--above'
                  : 'single-agent-dropdown'
              }
              role="listbox"
              aria-label={label}
            >
              {options.map((option) => {
                const selected = selectedIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    className={selected ? 'single-agent-dropdown-item is-selected' : 'single-agent-dropdown-item'}
                    type="button"
                    onClick={() => toggleSingleAgentListField(dropdownKey, option.id)}
                  >
                    <div className="single-agent-dropdown-title-row">
                      <div className="single-agent-dropdown-title">{option.title}</div>
                      {selected ? (
                        <span className="single-agent-dropdown-check" aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    {option.description ? (
                      <div className="single-agent-dropdown-desc">{option.description}</div>
                    ) : null}
                    {option.meta ? <div className="single-agent-dropdown-meta">{option.meta}</div> : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    )

    return (
      <section className="single-agent-page" aria-label="单Agent 设置">
        <div className="single-agent-shell">
          <div className="single-agent-main">
            <div className="single-agent-topbar">
              <div className="single-agent-topbar-left">
                <div className="single-agent-topbar-left-main">
                  <button
                    className="single-agent-back"
                    type="button"
                    onClick={() => {
                      setSelectedSingleAgentKey(null)
                      setOpenSettingsDropdown(null)
                    }}
                  >
                    <span className="single-agent-back-icon" aria-hidden="true">
                      ◀
                    </span>
                  </button>
                  <div className="single-agent-topmeta">
                    <div className="single-agent-title">{selectedSingleAgent.name}</div>
                    <div className="single-agent-subtitle">单智能体设置</div>
                  </div>
                </div>
                <div className="single-agent-left-actions">
                  <button className="single-agent-preview-icon" type="button" aria-label="代码">
                    {'</>'}
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label="提示词">
                    ✦
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label="设置">
                    ⚙
                  </button>
                </div>
              </div>
              <div className="single-agent-topbar-right">
                <div className="single-agent-preview-tabs" role="tablist" aria-label="预览标签">
                  <button
                    className={
                      singleAgentPreviewTab === 'preview'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setSingleAgentPreviewTab('preview')}
                  >
                    预览
                  </button>
                  <button
                    className={
                      singleAgentPreviewTab === 'ai-adjust'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setSingleAgentPreviewTab('ai-adjust')}
                  >
                    AI修改
                  </button>
                </div>
              </div>
            </div>

            <div className="single-agent-layout">
              <div className="single-agent-left">
                <div className="single-agent-card">
                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="single-agent-name">
                      智能体名称 <span className="single-agent-required">*</span>
                    </label>
                    <input
                      id="single-agent-name"
                      className="single-agent-input"
                      value={selectedSingleAgent.name}
                      onChange={(event) =>
                        updateSelectedSingleAgent((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="single-agent-model">
                      模型配置 <span className="single-agent-required">*</span>
                    </label>
                    <div className="single-agent-helper">选择一个模型配置模板。</div>
                    <div className="single-agent-select-wrap">
                      <button
                        id="single-agent-model"
                        className={
                          openSettingsDropdown === 'modelConfig'
                            ? 'single-agent-select is-open'
                            : 'single-agent-select'
                        }
                        type="button"
                        aria-expanded={openSettingsDropdown === 'modelConfig'}
                        onClick={() => {
                          setOpenSettingsDropdown((prev) =>
                            prev === 'modelConfig' ? null : 'modelConfig',
                          )
                          setModelConfigQuery(selectedSingleAgent.modelConfig)
                        }}
                      >
                        <span className="single-agent-select-value">{selectedSingleAgent.modelConfig}</span>
                        <span className="single-agent-select-caret" aria-hidden="true">
                          ▾
                        </span>
                      </button>
                      {openSettingsDropdown === 'modelConfig' ? (
                        <div className="single-agent-dropdown single-agent-dropdown--search" role="listbox">
                          <div className="single-agent-search-row">
                            <input
                              className="single-agent-search-input"
                              value={modelConfigQuery}
                              placeholder="搜索模型配置"
                              onChange={(event) => setModelConfigQuery(event.target.value)}
                            />
                            <button
                              className="single-agent-search-clear"
                              type="button"
                              onClick={() => setModelConfigQuery('')}
                              aria-label="清空搜索"
                            >
                              ×
                            </button>
                          </div>
                          <div className="single-agent-dropdown-scroll">
                            {filteredModelConfigOptions.map((option) => (
                              <button
                                key={option.id}
                                className={
                                  selectedSingleAgent.modelConfig === option.title
                                    ? 'single-agent-dropdown-item is-selected'
                                    : 'single-agent-dropdown-item'
                                }
                                type="button"
                                onClick={() => {
                                  updateSelectedSingleAgent((prev) => ({
                                    ...prev,
                                    modelConfig: option.title,
                                  }))
                                  setOpenSettingsDropdown(null)
                                }}
                              >
                                <div className="single-agent-dropdown-title">{option.title}</div>
                                {option.description ? (
                                  <div className="single-agent-dropdown-desc">{option.description}</div>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-row">
                      <label className="single-agent-label" htmlFor="single-agent-instructions">
                        描述 <span className="single-agent-required">*</span>
                      </label>
                      <button
                        className="single-agent-generate-link"
                        type="button"
                        onClick={() => {
                          setIsInstructionModalOpen(true)
                          setInstructionGeneratedDraft('')
                          setInstructionSelectedTemplate('')
                          setInstructionTaskInput('')
                        }}
                      >
                        ✦ AI生成
                      </button>
                    </div>
                    {selectedSingleAgent.generatedPrompt ? (
                      <div className="single-agent-markdown-block">
                        <div className="single-agent-markdown-title">生成的提示词</div>
                        <pre className="single-agent-markdown-preview">
                          {selectedSingleAgent.generatedPrompt}
                        </pre>
                      </div>
                    ) : (
                      <textarea
                        id="single-agent-instructions"
                        className="single-agent-textarea"
                        value={selectedSingleAgent.instructions}
                        onChange={(event) =>
                          updateSelectedSingleAgent((prev) => ({
                            ...prev,
                            instructions: event.target.value,
                          }))
                        }
                        rows={8}
                      />
                    )}
                  </div>

                  {renderMultiSelectField(
                    'agentTools',
                    '智能体工具（Agent as Tool）',
                    '这里会更新该智能体的工具列表，可添加多个 Agent as Tool 项；流程文件中也可能显示相同配置对应的 Tool 节点。',
                    '选择智能体工具',
                    agentToolOptions,
                    selectedSingleAgent.agentTools,
                  )}

                  {renderMultiSelectField(
                    'skills',
                    '技能',
                    '从列表中选择技能。保存后，启用的技能会按顺序追加在描述之后。',
                    '选择技能',
                    skillOptions,
                    selectedSingleAgent.skills,
                  )}

                  {renderMultiSelectField(
                    'knowledge',
                    '知识库（文档库）',
                    '绑定内部文档数据源，让该智能体可以结合更多上下文进行回答。',
                    '选择知识库',
                    knowledgeOptions,
                    selectedSingleAgent.knowledge,
                  )}

                  {renderMultiSelectField(
                    'tools',
                    '工具',
                    '选择该单智能体在执行过程中可以调用的工具。',
                    '选择工具',
                    toolOptions,
                    selectedSingleAgent.tools,
                    'above',
                  )}
                </div>
              </div>

              <aside className="single-agent-right">
                <div className="single-agent-preview-card">
                  <div className="single-agent-preview-card-head">
                    <span>预览</span>
                    <button className="single-agent-refresh" type="button" aria-label="刷新">
                      ↻
                    </button>
                  </div>
                  <div className="single-agent-preview-body">
                    {singleAgentPreviewTab === 'preview' ? (
                      <div className="single-agent-preview-message">你好！我可以怎么帮助你？</div>
                    ) : (
                      <div className="single-agent-preview-placeholder">
                        AI 辅助优化后的提示词内容会显示在这里。
                      </div>
                    )}
                  </div>
                  <div className="single-agent-preview-input-row">
                    <input className="single-agent-preview-input" placeholder="输入你的问题" />
                    <button className="single-agent-preview-send" type="button" aria-label="发送">
                      ➤
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {isInstructionModalOpen ? (
          <div className="single-agent-modal-layer" role="presentation">
            <div
              className="single-agent-modal-backdrop"
              onClick={() => {
                if (isInstructionGenerating) return
                setIsInstructionModalOpen(false)
              }}
            />
            <div className="single-agent-modal" role="dialog" aria-modal="true" aria-label="生成描述">
              <div className="single-agent-modal-title">生成描述</div>
              <div className="single-agent-modal-subtitle">
                通过补充任务的基本信息，你可以快速生成一份提示词模板。
              </div>
              <div className="single-agent-template-list">
                {instructionTemplates.map((template) => (
                  <button
                    key={template}
                    className={
                      instructionSelectedTemplate === template
                        ? 'single-agent-template-chip is-active'
                        : 'single-agent-template-chip'
                    }
                    type="button"
                    onClick={() => {
                      setInstructionSelectedTemplate(template)
                      setInstructionTaskInput(template)
                    }}
                  >
                    {template}
                  </button>
                ))}
              </div>
              <textarea
                className="single-agent-modal-textarea"
                placeholder="在这里描述你的任务"
                value={instructionTaskInput}
                onChange={(event) => setInstructionTaskInput(event.target.value)}
                rows={3}
              />
              {instructionGeneratedDraft ? (
                <pre className="single-agent-modal-preview">{instructionGeneratedDraft}</pre>
              ) : null}
              <div className="single-agent-modal-actions">
                <button
                  className={
                    isInstructionGenerating
                      ? 'single-agent-modal-submit is-loading'
                      : 'single-agent-modal-submit'
                  }
                  type="button"
                  disabled={isInstructionGenerating}
                  onClick={() => {
                    if (instructionGeneratedDraft) {
                      updateSelectedSingleAgent((prev) => ({
                        ...prev,
                        instructions: instructionGeneratedDraft,
                        generatedPrompt: instructionGeneratedDraft,
                      }))
                      setIsInstructionModalOpen(false)
                      return
                    }

                    setIsInstructionGenerating(true)
                    window.setTimeout(() => {
                      setInstructionGeneratedDraft(
                        buildGeneratedPrompt(
                          selectedSingleAgent.name,
                          instructionSelectedTemplate || '调研并生成报告',
                          instructionTaskInput,
                        ),
                      )
                      setIsInstructionGenerating(false)
                    }, 1000)
                  }}
                >
                  {isInstructionGenerating ? (
                    <>
                      <span className="single-agent-spinner" aria-hidden="true" />
                      生成中...
                    </>
                  ) : instructionGeneratedDraft ? (
                    '保存'
                  ) : (
                    '生成'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  const renderManagerialAgentSettingsPage = () => {
    if (!selectedManagerialAgent) return null

    const managerAgentPickerOptions: DropdownOption[] = agentsWithDerived
      .filter((agent) => agent.name !== selectedManagerialAgent.name)
      .map((agent) => ({
        id: agent.name,
        title: agent.name,
        description: agent.desc.replace(/…/g, '').trim(),
      }))

    const renderManagerialMultiSelectField = (
      dropdownKey: 'agentTools' | 'skills' | 'knowledge' | 'tools' | 'managerMemberAgents' | 'managerEscalationTriggers',
      label: string,
      helper: string,
      placeholder: string,
      options: DropdownOption[],
      selectedIds: string[],
      updater: (id: string) => void,
      dropdownPlacement: 'above' | 'below' = 'below',
    ) => (
      <div className="single-agent-field">
        <label className="single-agent-label">
          {label}
          <span className="single-agent-label-info" aria-hidden="true">
            i
          </span>
        </label>
        <div className="single-agent-helper">{helper}</div>
        <div className="single-agent-select-wrap">
          <button
            className={openSettingsDropdown === dropdownKey ? 'single-agent-select is-open' : 'single-agent-select'}
            type="button"
            aria-expanded={openSettingsDropdown === dropdownKey}
            onClick={() =>
              setOpenSettingsDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }
          >
            <span className={selectedIds.length > 0 ? 'single-agent-select-value' : 'single-agent-select-placeholder'}>
              {getSelectedLabels(options, selectedIds) || placeholder}
            </span>
            <span className="single-agent-select-caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {openSettingsDropdown === dropdownKey ? (
            <div
              className={
                dropdownPlacement === 'above'
                  ? 'single-agent-dropdown single-agent-dropdown--above'
                  : 'single-agent-dropdown'
              }
              role="listbox"
              aria-label={label}
            >
              {options.map((option) => {
                const selected = selectedIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    className={selected ? 'single-agent-dropdown-item is-selected' : 'single-agent-dropdown-item'}
                    type="button"
                    onClick={() => updater(option.id)}
                  >
                    <div className="single-agent-dropdown-title-row">
                      <div className="single-agent-dropdown-title">{option.title}</div>
                      {selected ? (
                        <span className="single-agent-dropdown-check" aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    {option.description ? (
                      <div className="single-agent-dropdown-desc">{option.description}</div>
                    ) : null}
                    {option.meta ? <div className="single-agent-dropdown-meta">{option.meta}</div> : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    )

    return (
      <section className="single-agent-page managerial-agent-page" aria-label="管理型Agent 设置">
        <div className="single-agent-shell">
          <div className="single-agent-main">
            <div className="single-agent-topbar">
              <div className="single-agent-topbar-left">
                <div className="single-agent-topbar-left-main">
                  <button
                    className="single-agent-back"
                    type="button"
                    onClick={() => {
                      setSelectedManagerialAgentKey(null)
                      setOpenSettingsDropdown(null)
                      setIsOnboardingWorkflowOpen(false)
                    }}
                  >
                    <span className="single-agent-back-icon" aria-hidden="true">
                      ◀
                    </span>
                  </button>
                  <div className="single-agent-topmeta">
                    <div className="single-agent-title">{selectedManagerialAgent.name}</div>
                    <div className="single-agent-subtitle">管理型智能体设置</div>
                  </div>
                </div>
                <div className="single-agent-left-actions">
                  <button
                    className="single-agent-preview-icon managerial-agent-edit-btn"
                    type="button"
                    aria-label="编辑"
                    onClick={() => {
                      setOpenSettingsDropdown(null)
                      setOpenManagerAgentPickerRowId(null)
                      setIsOnboardingWorkflowOpen(true)
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M8 16l8.5-8.5 2 2L10 18H8v-2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14.5 6l2 2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label="代码">
                    {'</>'}
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label="提示词">
                    ✦
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label="设置">
                    ⚙
                  </button>
                </div>
              </div>
              <div className="single-agent-topbar-right">
                <div className="single-agent-preview-tabs" role="tablist" aria-label="预览标签">
                  <button
                    className={
                      managerialAgentPreviewTab === 'preview'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setManagerialAgentPreviewTab('preview')}
                  >
                    预览
                  </button>
                  <button
                    className={
                      managerialAgentPreviewTab === 'ai-adjust'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setManagerialAgentPreviewTab('ai-adjust')}
                  >
                    AI修改
                  </button>
                </div>
              </div>
            </div>

            <div className="single-agent-layout">
              <div className="single-agent-left">
                <div className="single-agent-card">
                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="managerial-agent-name">
                      智能体名称 <span className="single-agent-required">*</span>
                    </label>
                    <input
                      id="managerial-agent-name"
                      className="single-agent-input"
                      value={selectedManagerialAgent.name}
                      onChange={(event) =>
                        updateSelectedManagerialAgent((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="managerial-agent-model">
                      模型配置 <span className="single-agent-required">*</span>
                    </label>
                    <div className="single-agent-helper">选择一个模型配置模板。</div>
                    <div className="single-agent-select-wrap">
                      <button
                        id="managerial-agent-model"
                        className={
                          openSettingsDropdown === 'modelConfig'
                            ? 'single-agent-select is-open'
                            : 'single-agent-select'
                        }
                        type="button"
                        aria-expanded={openSettingsDropdown === 'modelConfig'}
                        onClick={() => {
                          setOpenSettingsDropdown((prev) =>
                            prev === 'modelConfig' ? null : 'modelConfig',
                          )
                          setModelConfigQuery(selectedManagerialAgent.modelConfig)
                        }}
                      >
                        <span className="single-agent-select-value">{selectedManagerialAgent.modelConfig}</span>
                        <span className="single-agent-select-caret" aria-hidden="true">
                          ▾
                        </span>
                      </button>
                      {openSettingsDropdown === 'modelConfig' ? (
                        <div className="single-agent-dropdown single-agent-dropdown--search" role="listbox">
                          <div className="single-agent-search-row">
                            <input
                              className="single-agent-search-input"
                              value={modelConfigQuery}
                              placeholder="搜索模型配置"
                              onChange={(event) => setModelConfigQuery(event.target.value)}
                            />
                            <button
                              className="single-agent-search-clear"
                              type="button"
                              onClick={() => setModelConfigQuery('')}
                              aria-label="清空搜索"
                            >
                              ×
                            </button>
                          </div>
                          <div className="single-agent-dropdown-scroll">
                            {filteredModelConfigOptions.map((option) => (
                              <button
                                key={option.id}
                                className={
                                  selectedManagerialAgent.modelConfig === option.title
                                    ? 'single-agent-dropdown-item is-selected'
                                    : 'single-agent-dropdown-item'
                                }
                                type="button"
                                onClick={() => {
                                  updateSelectedManagerialAgent((prev) => ({
                                    ...prev,
                                    modelConfig: option.title,
                                  }))
                                  setOpenSettingsDropdown(null)
                                }}
                              >
                                <div className="single-agent-dropdown-title">{option.title}</div>
                                {option.description ? (
                                  <div className="single-agent-dropdown-desc">{option.description}</div>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-row">
                      <label className="single-agent-label" htmlFor="managerial-agent-instructions">
                        描述 <span className="single-agent-required">*</span>
                      </label>
                      <button
                        className="single-agent-generate-link"
                        type="button"
                        onClick={() => {
                          setIsInstructionModalOpen(true)
                          setInstructionGeneratedDraft('')
                          setInstructionSelectedTemplate('')
                          setInstructionTaskInput('')
                        }}
                      >
                        ✦ AI生成
                      </button>
                    </div>
                    {selectedManagerialAgent.generatedPrompt ? (
                      <div className="single-agent-markdown-block">
                        <div className="single-agent-markdown-title">生成的提示词</div>
                        <pre className="single-agent-markdown-preview">
                          {selectedManagerialAgent.generatedPrompt}
                        </pre>
                      </div>
                    ) : (
                      <textarea
                        id="managerial-agent-instructions"
                        className="single-agent-textarea"
                        value={selectedManagerialAgent.instructions}
                        onChange={(event) =>
                          updateSelectedManagerialAgent((prev) => ({
                            ...prev,
                            instructions: event.target.value,
                          }))
                        }
                        rows={8}
                      />
                    )}
                  </div>

                  <div className="single-agent-field manager-agent-field">
                    <div className="manager-agent-toggle-row">
                      <label className="single-agent-label manager-agent-label">
                        Manager Agent
                      </label>
                      <button
                        className={
                          selectedManagerialAgent.managerEnabled
                            ? 'manager-agent-switch is-on'
                            : 'manager-agent-switch'
                        }
                        type="button"
                        role="switch"
                        aria-checked={selectedManagerialAgent.managerEnabled}
                        onClick={() =>
                          updateSelectedManagerialAgent((prev) => ({
                            ...prev,
                            managerEnabled: !prev.managerEnabled,
                          }))
                        }
                      >
                        <span className="manager-agent-switch-thumb" aria-hidden="true" />
                      </button>
                    </div>

                    {selectedManagerialAgent.managerEnabled ? (
                      <div className="manager-agent-panel">
                        <div className="manager-agent-warning">
                          <span className="manager-agent-warning-icon" aria-hidden="true">
                            △
                          </span>
                          <span>
                            管理型 Agent 更适合搭配高推理模型使用（例如 Gemini 2.5+、Claude 4 系列、GPT-5 系列）。
                          </span>
                        </div>

                        <div className="manager-agent-list-title">Agents</div>
                        <div className="manager-agent-list">
                          {selectedManagerialAgent.managerAgents.map((row) => (
                            <div key={row.id} className="manager-agent-row">
                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label="刷新"
                              >
                                ↻
                              </button>

                              <div className="manager-agent-select-wrap">
                                <button
                                  className={
                                    openManagerAgentPickerRowId === row.id
                                      ? 'manager-agent-select is-open'
                                      : 'manager-agent-select'
                                  }
                                  type="button"
                                  onClick={() =>
                                    setOpenManagerAgentPickerRowId((prev) =>
                                      prev === row.id ? null : row.id,
                                    )
                                  }
                                >
                                  <span
                                    className={
                                      row.agentName
                                        ? 'manager-agent-select-value'
                                        : 'manager-agent-select-placeholder'
                                    }
                                  >
                                    {row.agentName || '选择一个 Agent'}
                                  </span>
                                  <span className="manager-agent-select-caret" aria-hidden="true">
                                    ▾
                                  </span>
                                </button>
                                {openManagerAgentPickerRowId === row.id ? (
                                  <div className="manager-agent-picker" role="listbox" aria-label="Agent列表">
                                    {managerAgentPickerOptions.map((option) => (
                                      <button
                                        key={option.id}
                                        className="manager-agent-picker-item"
                                        type="button"
                                        onClick={() => {
                                          updateManagerAgentRow(row.id, (current) => ({
                                            ...current,
                                            agentName: option.title,
                                          }))
                                          setOpenManagerAgentPickerRowId(null)
                                        }}
                                      >
                                        <div className="manager-agent-picker-title">{option.title}</div>
                                        {option.description ? (
                                          <div className="manager-agent-picker-desc">
                                            {option.description}
                                          </div>
                                        ) : null}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              <input
                                className="manager-agent-usage-input"
                                placeholder="你会如何使用这个 Agent？"
                                value={row.usage}
                                onChange={(event) =>
                                  updateManagerAgentRow(row.id, (current) => ({
                                    ...current,
                                    usage: event.target.value,
                                  }))
                                }
                              />

                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label="编辑Agent"
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                  <path
                                    d="M14 5h5v5M10 14 19 5M18 14v4a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>

                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label="删除Agent"
                                onClick={() =>
                                  updateSelectedManagerialAgent((prev) => ({
                                    ...prev,
                                    managerAgents:
                                      prev.managerAgents.length > 1
                                        ? prev.managerAgents.filter((item) => item.id !== row.id)
                                        : prev.managerAgents,
                                  }))
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="manager-agent-action-row">
                          <button
                            className="manager-agent-action-btn is-primary"
                            type="button"
                            onClick={() => appendManagerAgentRow('agent')}
                          >
                            <span aria-hidden="true">＋</span>
                              添加 Agent
                          </button>
                          <button
                            className="manager-agent-action-btn"
                            type="button"
                            onClick={() => appendManagerAgentRow('a2a')}
                          >
                            <span aria-hidden="true">＋</span>
                              添加 A2A 服务
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {renderManagerialMultiSelectField(
                    'agentTools',
                    '智能体工具（Agent as Tool）',
                    '这里会更新该智能体的工具列表，可添加多个 Agent as Tool 项；流程文件中也可能显示相同配置对应的 Tool 节点。',
                    '选择智能体工具',
                    agentToolOptions,
                    selectedManagerialAgent.agentTools,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        agentTools: prev.agentTools.includes(id)
                          ? prev.agentTools.filter((x) => x !== id)
                          : [...prev.agentTools, id],
                      })),
                  )}

                  {renderManagerialMultiSelectField(
                    'skills',
                    '技能',
                    '从列表中选择技能。保存后，启用的技能会按顺序追加在描述之后。',
                    '选择技能',
                    skillOptions,
                    selectedManagerialAgent.skills,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        skills: prev.skills.includes(id)
                          ? prev.skills.filter((x) => x !== id)
                          : [...prev.skills, id],
                      })),
                  )}

                  {renderManagerialMultiSelectField(
                    'knowledge',
                    '知识库（文档库）',
                    '绑定内部文档数据源，让该智能体可以结合更多上下文进行回答。',
                    '选择知识库',
                    knowledgeOptions,
                    selectedManagerialAgent.knowledge,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        knowledge: prev.knowledge.includes(id)
                          ? prev.knowledge.filter((x) => x !== id)
                          : [...prev.knowledge, id],
                      })),
                  )}

                  {renderManagerialMultiSelectField(
                    'tools',
                    '工具',
                    '选择该管理型智能体在执行过程中可以调用的工具。',
                    '选择工具',
                    toolOptions,
                    selectedManagerialAgent.tools,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        tools: prev.tools.includes(id)
                          ? prev.tools.filter((x) => x !== id)
                          : [...prev.tools, id],
                      })),
                    'above',
                  )}
                </div>
              </div>

              <aside className="single-agent-right">
                <div className="single-agent-preview-card managerial-agent-preview-card">
                  <div className="single-agent-preview-card-head">
                    <span>预览</span>
                    <button className="single-agent-refresh" type="button" aria-label="刷新">
                      ↻
                    </button>
                  </div>
                  <div className="managerial-agent-summary">
                    <div className="managerial-agent-summary-title">当前编排概览</div>
                    <div className="managerial-agent-summary-row">
                      <span>成员数</span>
                      <strong>
                        {selectedManagerialAgent.managerAgents.filter((item) => item.agentName).length}
                      </strong>
                    </div>
                    <div className="managerial-agent-summary-row">
                      <span>分发策略</span>
                      <strong>{selectedManagerialAgent.delegationStrategy}</strong>
                    </div>
                    <div className="managerial-agent-summary-row">
                      <span>审批模式</span>
                      <strong>{selectedManagerialAgent.approvalMode}</strong>
                    </div>
                  </div>
                  <div className="single-agent-preview-body">
                    {managerialAgentPreviewTab === 'preview' ? (
                      <div className="single-agent-preview-message">
                        你好！我是管理型智能体，可以帮你协调多个子智能体来完成复杂任务。
                      </div>
                    ) : (
                      <div className="single-agent-preview-placeholder">
                        AI 辅助优化后的管理编排建议会显示在这里。
                      </div>
                    )}
                  </div>
                  <div className="single-agent-preview-input-row">
                    <input className="single-agent-preview-input" placeholder="输入你的问题" />
                    <button className="single-agent-preview-send" type="button" aria-label="发送">
                      ➤
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {isInstructionModalOpen ? (
          <div className="single-agent-modal-layer" role="presentation">
            <div
              className="single-agent-modal-backdrop"
              onClick={() => {
                if (isInstructionGenerating) return
                setIsInstructionModalOpen(false)
              }}
            />
            <div className="single-agent-modal" role="dialog" aria-modal="true" aria-label="生成描述">
              <div className="single-agent-modal-title">生成描述</div>
              <div className="single-agent-modal-subtitle">
                通过补充任务的基本信息，你可以快速生成一份提示词模板。
              </div>
              <div className="single-agent-template-list">
                {instructionTemplates.map((template) => (
                  <button
                    key={template}
                    className={
                      instructionSelectedTemplate === template
                        ? 'single-agent-template-chip is-active'
                        : 'single-agent-template-chip'
                    }
                    type="button"
                    onClick={() => {
                      setInstructionSelectedTemplate(template)
                      setInstructionTaskInput(template)
                    }}
                  >
                    {template}
                  </button>
                ))}
              </div>
              <textarea
                className="single-agent-modal-textarea"
                placeholder="在这里描述你的任务"
                value={instructionTaskInput}
                onChange={(event) => setInstructionTaskInput(event.target.value)}
                rows={3}
              />
              {instructionGeneratedDraft ? (
                <pre className="single-agent-modal-preview">{instructionGeneratedDraft}</pre>
              ) : null}
              <div className="single-agent-modal-actions">
                <button
                  className={
                    isInstructionGenerating
                      ? 'single-agent-modal-submit is-loading'
                      : 'single-agent-modal-submit'
                  }
                  type="button"
                  disabled={isInstructionGenerating}
                  onClick={() => {
                    if (instructionGeneratedDraft) {
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        instructions: instructionGeneratedDraft,
                        generatedPrompt: instructionGeneratedDraft,
                      }))
                      setIsInstructionModalOpen(false)
                      return
                    }

                    setIsInstructionGenerating(true)
                    window.setTimeout(() => {
                      setInstructionGeneratedDraft(
                        buildGeneratedPrompt(
                          selectedManagerialAgent.name,
                          instructionSelectedTemplate || '调研并生成报告',
                          instructionTaskInput,
                        ),
                      )
                      setIsInstructionGenerating(false)
                    }, 1000)
                  }}
                >
                  {isInstructionGenerating ? (
                    <>
                      <span className="single-agent-spinner" aria-hidden="true" />
                      生成中...
                    </>
                  ) : instructionGeneratedDraft ? (
                    '保存'
                  ) : (
                    '生成'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  useEffect(() => {
    if (activePage !== 'scenarios') {
      setSelectedScenarioName(null)
      setEditingScenarioName(null)
    }
    if (activePage !== 'agent-library') setEditingAgentName(null)
  }, [activePage])

  useEffect(() => {
    if (
      activePage === 'scenarios' &&
      selectedScenarioName != null &&
      !agents.some((a) => a.name === selectedScenarioName)
    ) {
      setSelectedScenarioName(null)
    }
    if (
      activePage === 'scenarios' &&
      editingScenarioName != null &&
      !agents.some((a) => a.name === editingScenarioName)
    ) {
      setEditingScenarioName(null)
    }
    if (
      activePage === 'agent-library' &&
      editingAgentName != null &&
      !agents.some((a) => a.name === editingAgentName)
    ) {
      setEditingAgentName(null)
    }
  }, [activePage, selectedScenarioName, editingScenarioName, editingAgentName, agents])

  useEffect(() => {
    if (selectedScenarioName !== '新员工入职') {
      setWorkspaceCanvasZoom(DEFAULT_WORKSPACE_CANVAS_ZOOM)
    }
  }, [selectedScenarioName])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.agent-card-more-wrap')) return
      if (target.closest('.single-agent-select-wrap')) return
      if (target.closest('.single-agent-modal')) return
      if (target.closest('.manager-agent-select-wrap')) return
      setOpenAgentMenu(null)
      setOpenSettingsDropdown(null)
      setOpenManagerAgentPickerRowId(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenAgentMenu(null)
      setOpenSettingsDropdown(null)
      setOpenManagerAgentPickerRowId(null)
      if (!isInstructionGenerating) setIsInstructionModalOpen(false)
      if (activePage === 'scenarios') {
        if (editingScenarioName != null) {
          setEditingScenarioName(null)
          return
        }
        if (selectedScenarioName != null) {
          setSelectedScenarioName(null)
          return
        }
      }
      if (activePage === 'agent-library' && editingAgentName != null) {
        setEditingAgentName(null)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [
    activePage,
    editingScenarioName,
    editingAgentName,
    selectedScenarioName,
    isInstructionGenerating,
  ])

  useEffect(() => {
    if (!agentDetailBlankPageOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAgentDetailBlankPageOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [agentDetailBlankPageOpen])

  return (
    <>
    <div className={isSidebarExpanded ? 'manus is-sidebar-expanded' : 'manus'}>
      <aside className="manus-sidebar" aria-label="导航">
        <div className="manus-sidebar-top">
          <div className="manus-logo" role="img" aria-label="Logo">
            X
          </div>
          <button
            className="manus-sidebar-toggle"
            type="button"
            aria-label={isSidebarExpanded ? '折叠侧边栏' : '展开侧边栏'}
            aria-expanded={isSidebarExpanded}
            onClick={() => setIsSidebarExpanded((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              style={
                isSidebarExpanded
                  ? undefined
                  : { transform: 'scaleX(-1)', transformOrigin: 'center' }
              }
            >
              <path
                d="M6 5v14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M17 8l-5 4 5 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <nav className="manus-sidebar-nav" aria-label="功能">
          <button
            className={activePage === 'home' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label="首页"
            title="首页"
            aria-current={activePage === 'home' ? 'page' : undefined}
            onClick={() => setActivePage('home')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M3 11.5 12 4l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-8.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">首页</span>
          </button>
          <button
            className={activePage === 'agent-library' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label="Agent库"
            title="Agent库"
            aria-current={activePage === 'agent-library' ? 'page' : undefined}
            onClick={() => setActivePage('agent-library')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8h6M9 12h6M9 16h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">Agent库</span>
          </button>
          <button
            className={activePage === 'scenarios' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label="场景配置"
            title="场景配置"
            aria-current={activePage === 'scenarios' ? 'page' : undefined}
            onClick={() => setActivePage('scenarios')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  d="M19.4 13.3v-2.6l-2.2-.7a7.7 7.7 0 0 0-.7-1.6l1.2-2-1.8-1.8-2 1.2c-.5-.3-1-.5-1.6-.7L13.3 4h-2.6l-.7 2.2c-.6.2-1.1.4-1.6.7l-2-1.2-1.8 1.8 1.2 2c-.3.5-.5 1-.7 1.6l-2.2.7v2.6l2.2.7c.2.6.4 1.1.7 1.6l-1.2 2 1.8 1.8 2-1.2c.5.3 1 .5 1.6.7l.7 2.2h2.6l.7-2.2c.6-.2 1.1-.4 1.6-.7l2 1.2 1.8-1.8-1.2-2c.3-.5.5-1 .7-1.6l2.2-.7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">场景配置</span>
          </button>
          <button
            className={activePage === 'experience' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label="体验"
            title="体验"
            aria-current={activePage === 'experience' ? 'page' : undefined}
            onClick={() => setActivePage('experience')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                />
                <path
                  d="M14 19.5a4.5 4.5 0 0 0-9 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M14.5 9.5h6M17.5 6.5v6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">体验</span>
          </button>
          <button
            className={activePage === 'analytics' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label="分析"
            title="分析"
            aria-current={activePage === 'analytics' ? 'page' : undefined}
            onClick={() => setActivePage('analytics')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M5 19V10M12 19V5M19 19v-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">分析</span>
          </button>
        </nav>

        {isSidebarExpanded ? (
          <section className="manus-sidebar-runs" aria-label="历史记录">
            <header className="manus-runs-header">
              <button
                className="manus-runs-title"
                type="button"
                aria-label="折叠/展开历史记录"
                aria-expanded={isRunsExpanded}
                onClick={() => setIsRunsExpanded((v) => !v)}
              >
                <span
                  className={isRunsExpanded ? 'manus-runs-caret is-open' : 'manus-runs-caret'}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                历史记录
              </button>
              <div className="manus-runs-actions" aria-label="actions">
                <button
                  className={runSearchOpen ? 'manus-runs-action is-active' : 'manus-runs-action'}
                  type="button"
                  aria-label="筛选历史记录"
                  aria-expanded={runSearchOpen}
                  onClick={() => {
                    setIsRunsExpanded(true)
                    setRunSearchOpen((v) => !v)
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16.8 16.8 21 21"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  className="manus-runs-action"
                  type="button"
                  aria-label="前往首页"
                  onClick={() => setActivePage('home')}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M12 5v14M5 12h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button className="manus-runs-action" type="button" aria-label="More">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M5 7h14M5 12h14M5 17h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </header>

            {isRunsExpanded && runSearchOpen ? (
              <div className="manus-runs-filter">
                <label className="sr-only" htmlFor={runSearchInputId}>
                  筛选历史记录
                </label>
                <input
                  id={runSearchInputId}
                  className="manus-runs-filter-input"
                  type="search"
                  placeholder="输入关键字筛选…"
                  value={runSearchQuery}
                  onChange={(e) => setRunSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
            ) : null}

            {isRunsExpanded ? (
              <div className="manus-runs-list" role="list">
                {filteredRunHistory.length === 0 ? (
                  <div className="manus-runs-empty" role="status">
                    {runSearchQuery.trim() ? '无匹配记录' : '暂无记录'}
                  </div>
                ) : (
                  filteredRunHistory.map((run) => (
                    <div key={run.id} className="manus-run" role="listitem">
                      <div className="manus-run-name">{run.name}</div>
                      <span
                        className={
                          run.status === 'warn' ? 'manus-run-status is-warn' : 'manus-run-status is-ok'
                        }
                        aria-label="status"
                      />
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="manus-sidebar-user" aria-label="用户信息">
          <button className="manus-user" type="button" aria-label="打开用户信息">
            <span className="manus-user-avatar" aria-hidden="true">
              m
            </span>
            <span className="manus-user-meta">
              <span className="manus-user-name">Manager</span>
              <span className="manus-user-sub">admin@gamil.com</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="manus-main">
        {activePage === 'home' ? (
          <section className="manus-center" aria-label="内容">
            <h1 className="manus-title">今天你想自动化什么?</h1>
            <p className="manus-title-en" lang="en">
              What can I do for you?
            </p>

            <div className="composer">
              <div className="composer-tabs" role="tablist" aria-label="模式">
                <button
                  id={planTabId}
                  className={mode === 'plan' ? 'composer-tab is-active' : 'composer-tab'}
                  type="button"
                  role="tab"
                  aria-selected={mode === 'plan'}
                  aria-controls={panelId}
                  onClick={() => setMode('plan')}
                >
                  <span className="composer-tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M4.5 7.5 12 3l7.5 4.5V16.5L12 21 4.5 16.5V7.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.5 7.5 12 12l7.5-4.5M12 12v9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Plan Mode
                </button>
                <button
                  id={buildTabId}
                  className={mode === 'build' ? 'composer-tab is-active' : 'composer-tab'}
                  type="button"
                  role="tab"
                  aria-selected={mode === 'build'}
                  aria-controls={panelId}
                  onClick={() => setMode('build')}
                >
                  <span className="composer-tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.5 7 17 10.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Build Mode
                </button>
              </div>

              <div className="composer-surface">
                <label className="sr-only" htmlFor="composer-input">
                  输入任务
                </label>
                <div className="composer-input-wrap">
                  <textarea
                    id="composer-input"
                    className="composer-input"
                    placeholder={
                      mode === 'plan'
                        ? '我可以为你搭建或执行任何任务'
                        : '我可以为你搭建或执行任何任务'
                    }
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={5}
                    role="tabpanel"
                    aria-labelledby={mode === 'plan' ? planTabId : buildTabId}
                    aria-label={mode === 'plan' ? 'Plan Mode 输入' : 'Build Mode 输入'}
                    aria-describedby={panelId}
                  />
                  <button
                    className="composer-send"
                    type="button"
                    aria-label="发送"
                    disabled={!isComposerActive}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M12 19V6M7 10l5-5 5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    className="composer-voice"
                    type="button"
                    aria-label="语音输入"
                    disabled={!isComposerActive}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 11a7 7 0 0 1-14 0M12 18v3"
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
            </div>
          </section>
        ) : activePage === 'agent-library' ? (
          (() => {
            if (editingAgentName != null) {
              const row = agentsWithDerived.find((a) => a.name === editingAgentName)
              if (row) return renderAgentEdit(row)
            }
            if (selectedSingleAgent) {
              return renderSingleAgentSettingsPage()
            }
            if (selectedManagerialAgent) {
              return isOnboardingWorkflowOpen ? (
                <OnboardingWorkflowPage
                  managerName={selectedManagerialAgent.name}
                  modelConfig={selectedManagerialAgent.modelConfig}
                  instructions={selectedManagerialAgent.instructions}
                  generatedPrompt={selectedManagerialAgent.generatedPrompt}
                  managerAgents={selectedManagerialAgent.managerAgents}
                  onBack={() => setIsOnboardingWorkflowOpen(false)}
                />
              ) : (
                renderManagerialAgentSettingsPage()
              )
            }
            return renderCardsPage(
              'Agents',
              '+ Create Agent',
              [
                { key: 'all', label: 'All', count: agentsWithDerived.length },
                { key: 'single', label: 'Single', count: singleAgents.length },
                { key: 'managerial', label: 'Managerial', count: managerialAgents.length },
              ],
              agentsTab,
              (k) => setAgentsTab(k as typeof agentsTab),
              filteredAgents,
              (a) => (agentsTab === 'managerial' ? 'Managerial Agent' : a.tag),
              true,
              undefined,
              (item) => setEditingAgentName(item.name),
            )
          })()
        ) : activePage === 'scenarios' ? (
          (() => {
            const withCat: ScenarioRow[] = agentsWithDerived.map((a) => ({
              name: a.name,
              desc: a.desc,
              meta: a.meta,
              tag: a.tag,
              category: pickScenarioCategory(a.name) as ScenarioRow['category'],
            }))
            const medical = withCat.filter((a) => a.category === 'medical')
            const finance = withCat.filter((a) => a.category === 'finance')
            const tech = withCat.filter((a) => a.category === 'tech')
            const accounting = withCat.filter((a) => a.category === 'accounting')
            const filtered =
              scenariosTab === 'medical'
                ? medical
                : scenariosTab === 'finance'
                  ? finance
                  : scenariosTab === 'tech'
                    ? tech
                    : scenariosTab === 'accounting'
                      ? accounting
                      : withCat

            const selectedRow =
              selectedScenarioName == null
                ? null
                : (withCat.find((x) => x.name === selectedScenarioName) ?? null)

            const editingRow =
              editingScenarioName == null
                ? null
                : (withCat.find((x) => x.name === editingScenarioName) ?? null)

            if (editingRow) {
              return renderScenarioEdit(editingRow)
            }

            if (selectedRow) {
              return renderScenarioDetail(selectedRow)
            }

            return renderCardsPage(
              '场景配置',
              '+ 创建场景',
              [
                { key: 'all', label: '全部', count: withCat.length },
                { key: 'medical', label: '医疗', count: medical.length },
                { key: 'finance', label: '金融', count: finance.length },
                { key: 'tech', label: '科技', count: tech.length },
                { key: 'accounting', label: '财务', count: accounting.length },
              ],
              scenariosTab,
              (k) => setScenariosTab(k as typeof scenariosTab),
              filtered,
              (a) =>
                a.category === 'medical'
                  ? '医疗'
                  : a.category === 'finance'
                    ? '金融'
                    : a.category === 'tech'
                      ? '科技'
                      : '财务',
              true,
              (item) => setSelectedScenarioName(item.name),
              (item) => setEditingScenarioName(item.name),
            )
          })()
        ) : activePage === 'experience' || activePage === 'analytics' ? (
          renderJoyceAiSplitLayout(
            activePage === 'experience' ? '体验' : '分析',
            <>
              <header className="agents-header">
                <div>
                  <div className="agents-title">
                    {activePage === 'experience' ? '体验' : '分析'}
                  </div>
                  <div className="agents-subtitle">
                    {activePage === 'experience'
                      ? '在此试用与预览产品能力。'
                      : '在此查看数据指标与运营分析。'}
                  </div>
                </div>
              </header>
            </>,
          )
        ) : null}
      </div>
    </div>
    {agentDetailBlankPageOpen ? (
      <div
        className="agent-detail-blank-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-detail-blank-title"
      >
        <header className="agent-detail-blank-page-header">
          <button
            type="button"
            className="agent-detail-blank-page-back"
            id="agent-detail-blank-title"
            aria-label="返回"
            onClick={() => setAgentDetailBlankPageOpen(false)}
          >
            <span className="agent-detail-blank-page-back-icon" aria-hidden="true">
              ←
            </span>
            返回
          </button>
        </header>
        <main className="agent-detail-blank-page-main" aria-label="详情内容区" />
      </div>
    ) : null}
    </>
  )
}
