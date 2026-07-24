import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ManagerialAdvancedConfig } from '../../types/agent'

import { EXPERIENCE_AVATAR_MAP } from '../../data/experienceAvatars'
import type { ManagerAgentRow } from '../../data/onboarding-workflow'
import type { OnboardingWorkflowPreset } from '../../data/plan-onboarding-workflow'
import { WorkflowLeftPanel } from './WorkflowLeftPanel'
import {
  WorkflowCanvas,
  type WorkflowCanvasEdgeRuntimeStatus,
  type WorkflowCanvasNodeRuntimeStatus,
} from './WorkflowCanvas'
import { WorkflowToolLibraryPanel } from './WorkflowToolLibraryPanel'
import { useOnboardingWorkflowState } from './useOnboardingWorkflowState'

type WorkflowRunWorkerSpec = {
  id: string
  displayName: string
  taskTitle: string
  statusLabel: string
  summary: string
  objective: string
  deliverable: string
  steps: string[]
  resultTitle: string
  resultBody: string[]
  resultHighlights: string[]
  codeLanguage?: string
  codeBlock?: string
}

type WorkflowRunExecStepStatus = 'ok' | 'warn' | 'pending'
type WorkflowRunExecStep = {
  label: string
  status?: WorkflowRunExecStepStatus
  detail?: string
}
type WorkflowRunExecOutputRow = {
  k: string
  v: string
  mono?: boolean
}

type WorkflowRunBehaviorConfig = {
  allowDelegation: boolean
  reasoningEnabled: boolean
  maxReasoningAttempts: string
  maxIterations: string
  maxExecutionTimeSeconds: string
  responseSchemaProperties: string[]
  responseFormatLabel: string
  safeModeEnabled: boolean
}

const WORKFLOW_RUN_WORKERS: WorkflowRunWorkerSpec[] = [
  {
    id: 'it',
    displayName: 'IT 开通协调Agent',
    taskTitle: 'Task 1: 账号开通与权限协调',
    statusLabel: '正在整理账号开通与权限审批项',
    summary: '负责企业账号开通、权限组匹配与审批风险收敛。',
    objective: '确保新员工首日所需账号与系统权限已完成准备，并提前识别阻塞审批项。',
    deliverable: '账号开通清单 + 权限审批建议',
    steps: ['整理账号开通清单', '汇总权限审批与风险提示'],
    resultTitle: '账号与权限开通建议',
    resultBody: ['已整理企业邮箱、团队 IM、HR-OA 与项目协作系统的开通清单。', 'VPN 与代码仓库权限已标记为待审批项，并附带风险说明。'],
    resultHighlights: ['基础账号 4 项', '待审批权限 2 项', '阻塞风险 1 项'],
    codeLanguage: 'json',
    codeBlock: `{
  "accounts": ["企业邮箱", "团队 IM", "HR-OA", "项目协作系统"],
  "permissions": ["SSO 默认权限组", "VPN", "代码仓库只读权限"],
  "risk": "VPN 权限仍需网络管理员最终放行"
}`,
  },
  {
    id: 'device',
    displayName: '设备与权限开通Agent',
    taskTitle: 'Task 2: 设备发放与现场权限准备',
    statusLabel: '正在整理设备发放与现场权限安排',
    summary: '负责设备预留、门禁工位与现场领取安排确认。',
    objective: '确保员工到岗当天可顺利领取设备，并直接使用基础现场办公权限。',
    deliverable: '设备发放清单 + 现场权限安排',
    steps: ['确认设备套餐与库存', '整理门禁工位与领取安排'],
    resultTitle: '设备与现场权限安排',
    resultBody: ['已确认笔记本电脑、扩展坞与显示器的预留状态，并锁定设备套餐。', '门禁、工位与访客系统权限已生成申请单，首日领取时间已安排。'],
    resultHighlights: ['设备套餐 1 组', '现场权限 3 项', '领取安排 1 份'],
    codeLanguage: 'json',
    codeBlock: `{
  "devices": ["笔记本电脑", "扩展坞", "显示器"],
  "onsite_permissions": ["门禁", "工位", "访客系统"],
  "pickup": "首日 09:30 到 IT 服务台领取"
}`,
  },
  {
    id: 'culture',
    displayName: '企业宣讲Agent',
    taskTitle: 'Task 3: 培训与企业宣讲引导',
    statusLabel: '正在整理首日宣讲与文化导览内容',
    summary: '负责企业文化宣讲、制度导览与首周引导内容编排。',
    objective: '让新员工快速理解公司文化、协作方式与首周关键安排。',
    deliverable: '企业宣讲提纲 + 首周引导安排',
    steps: ['整理企业文化宣讲提纲', '生成首周入职引导安排'],
    resultTitle: '宣讲与引导建议',
    resultBody: ['已生成首日企业文化宣讲提纲，覆盖使命愿景、行为准则与协作方式。', '已输出 Day 1 至 Day 3 的入职引导安排，便于经理与 Buddy 接力。'],
    resultHighlights: ['宣讲模块 2 部分', '首周引导 1 份', '关键接力人 2 类'],
  },
]

const WORKFLOW_RUN_AVATAR_MAP = {
  manager: EXPERIENCE_AVATAR_MAP.joyce,
  it: EXPERIENCE_AVATAR_MAP.it,
  device: EXPERIENCE_AVATAR_MAP.device,
  culture: EXPERIENCE_AVATAR_MAP.culture,
} as const

function WorkflowRunAvatar({
  src,
  alt,
  size = 'md',
}: {
  src: string
  alt: string
  size?: 'sm' | 'md'
}) {
  const sm = size === 'sm' ? ' scenario-workspace-runs-agent-avatar--sm' : ''
  return (
    <span className={`scenario-workspace-runs-agent-avatar${sm}`} aria-hidden="true">
      <img className="scenario-workspace-runs-agent-avatar-img" src={src} alt={alt} />
    </span>
  )
}

function WorkflowRunExecKicker({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`runs-agent-exec-kicker${className ? ` ${className}` : ''}`}>{children}</p>
}

function WorkflowRunExecSteps({ steps }: { steps: readonly WorkflowRunExecStep[] }) {
  if (steps.length === 0) return null
  return (
    <ul className="runs-agent-exec-steps">
      {steps.map((step) => {
        const status = step.status ?? 'ok'
        const icon = status === 'warn' ? '⚠' : status === 'pending' ? '⏳' : '✓'
        return (
          <li key={step.label} className={`runs-agent-exec-step runs-agent-exec-step--${status}`}>
            <span className="runs-agent-exec-step-ic" aria-hidden="true">
              {icon}
            </span>
            <span className="runs-agent-exec-step-main">
              <span className="runs-agent-exec-step-label">{step.label}</span>
              {step.detail ? <span className="runs-agent-exec-step-detail">{step.detail}</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function WorkflowRunExecOutputs({ rows }: { rows: readonly WorkflowRunExecOutputRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="runs-agent-exec-outputs">
      {rows.map((row) => (
        <div key={row.k} className="runs-agent-exec-output-row">
          <span className="runs-agent-exec-output-k">{row.k}</span>
          <span className={row.mono ? 'runs-agent-exec-output-v runs-agent-exec-output-v--mono' : 'runs-agent-exec-output-v'}>
            {row.v}
          </span>
        </div>
      ))}
    </div>
  )
}

function WorkflowRunExecResult({
  title,
  summary,
  items,
}: {
  title: string
  summary: string
  items: readonly string[]
}) {
  return (
    <div className="runs-agent-exec-result">
      <div className="runs-agent-exec-result-head">
        <span className="runs-agent-exec-result-check" aria-hidden="true">
          ✓
        </span>
        <span className="runs-agent-exec-result-title">{title}</span>
      </div>
      <p className="runs-agent-exec-result-summary">{summary}</p>
      <ul className="runs-agent-exec-result-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function WorkflowRunExecJson({
  language,
  code,
}: {
  language: string
  code: string
}) {
  return (
    <div className="runs-agent-exec-json-wrap">
      <div className="runs-agent-exec-json-cap">
        <span className="runs-agent-exec-json-cap-tag">{language}</span>
        <span className="runs-agent-exec-json-cap-meta">Structured output preview</span>
      </div>
      <pre className="runs-agent-exec-json">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function WorkflowRunCard({
  avatarSrc,
  displayName,
  capMuted,
  streamKey,
  streamLines = [],
  showLiveLine = false,
  streamStatic = false,
  hideIdentity = false,
  detailCollapsed = false,
  detailCollapsible = false,
  onToggleDetailCollapsed,
  children,
}: {
  avatarSrc: string
  displayName: string
  capMuted: string
  streamKey: string
  streamLines?: readonly string[]
  showLiveLine?: boolean
  streamStatic?: boolean
  hideIdentity?: boolean
  detailCollapsed?: boolean
  detailCollapsible?: boolean
  onToggleDetailCollapsed?: () => void
  children?: ReactNode
}) {
  const [visibleCount, setVisibleCount] = useState(0)
  const streamSignature = `${streamKey}::${JSON.stringify(streamLines)}`

  useEffect(() => {
    if (streamStatic) {
      setVisibleCount(streamLines.length)
      return
    }
    setVisibleCount(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    streamLines.forEach((_, index) => {
      timers.push(window.setTimeout(() => setVisibleCount(index + 1), index * 120))
    })
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [streamSignature, streamStatic, streamLines.length])

  return (
    <div className="scenario-workspace-runs-run-card">
      {detailCollapsible ? (
        <button
          type="button"
          className={`scenario-workspace-runs-run-card-cap scenario-workspace-runs-run-card-cap--button${
            hideIdentity ? ' scenario-workspace-runs-run-card-cap--muted-only' : ''
          }`}
          aria-expanded={!detailCollapsed}
          onClick={onToggleDetailCollapsed}
        >
          {!hideIdentity ? <WorkflowRunAvatar src={avatarSrc} alt={displayName} size="sm" /> : null}
          <div className="scenario-workspace-runs-run-card-cap-text">
            {!hideIdentity ? <strong>{displayName}</strong> : null}
            <span className="scenario-workspace-runs-run-card-cap-muted">{hideIdentity ? capMuted : ` ${capMuted}`}</span>
          </div>
          <span
            className={`scenario-workspace-runs-run-card-cap-chev${
              detailCollapsed ? ' scenario-workspace-runs-run-card-cap-chev--collapsed' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div
          className={`scenario-workspace-runs-run-card-cap${
            hideIdentity ? ' scenario-workspace-runs-run-card-cap--muted-only' : ''
          }`}
        >
          {!hideIdentity ? <WorkflowRunAvatar src={avatarSrc} alt={displayName} size="sm" /> : null}
          <div className="scenario-workspace-runs-run-card-cap-text">
            {!hideIdentity ? <strong>{displayName}</strong> : null}
            <span className="scenario-workspace-runs-run-card-cap-muted">{hideIdentity ? capMuted : ` ${capMuted}`}</span>
          </div>
        </div>
      )}
      <div className="scenario-workspace-runs-run-card-body">
        {streamLines.length > 0 ? (
          <ul className="scenario-workspace-runs-run-list" aria-live="polite">
            {streamLines.slice(0, visibleCount).map((line) => (
              <li
                key={`${streamKey}-${line}`}
                className={streamStatic ? undefined : 'scenario-workspace-runs-run-card-stream-line--show'}
              >
                {line}
              </li>
            ))}
            {showLiveLine ? (
              <li>
                正在持续生成当前执行结果
                <span className="scenario-workflow-run-code-cursor" aria-hidden="true" />
              </li>
            ) : null}
          </ul>
        ) : null}
        {!detailCollapsed ? children : null}
      </div>
    </div>
  )
}

function WorkflowRunStep({
  avatarSrc,
  displayName,
  timeLabel,
  hierarchy = 'child',
  completed = false,
  children,
}: {
  avatarSrc: string
  displayName: string
  timeLabel: string
  hierarchy?: 'manager' | 'child'
  completed?: boolean
  children: ReactNode
}) {
  const [cardsHidden, setCardsHidden] = useState(false)

  return (
    <details
      className={`scenario-workspace-runs-run-step${hierarchy === 'child' ? ' scenario-workflow-run-step--child' : ' scenario-workflow-run-step--manager'}${cardsHidden ? ' scenario-workspace-runs-run-step--cards-hidden' : ''}`}
      open
    >
      <summary
        className="scenario-workspace-runs-run-step-summary"
        onClick={(event) => {
          event.preventDefault()
          setCardsHidden((prev) => !prev)
        }}
      >
        <span className="scenario-workspace-runs-run-step-avatar">
          <WorkflowRunAvatar src={avatarSrc} alt={displayName} />
          {completed ? (
            <span className="scenario-workspace-runs-run-step-check" aria-hidden="true">
              ✓
            </span>
          ) : null}
        </span>
        <span className="scenario-workspace-runs-run-step-meta">
          <span className="scenario-workflow-run-step-title-group">
            <span className="scenario-workspace-runs-run-step-name">{displayName}</span>
            <span
              className={`scenario-workflow-run-step-role-pill ${
                hierarchy === 'manager'
                  ? 'scenario-workflow-run-step-role-pill--manager'
                  : 'scenario-workflow-run-step-role-pill--child'
              }`}
            >
              {hierarchy === 'manager' ? 'Manager' : 'Agent'}
            </span>
          </span>
          <span className="scenario-workspace-runs-run-step-time">{timeLabel}</span>
        </span>
        <span
          className={`scenario-workspace-runs-run-step-chev${cardsHidden ? ' scenario-workspace-runs-run-step-chev--collapsed' : ''}`}
          aria-hidden="true"
        />
      </summary>
      <div className="scenario-workspace-runs-run-step-body">{children}</div>
    </details>
  )
}

function WorkflowRunWorkerCard({
  index,
  worker,
  completedCount,
  hasStarted,
}: {
  index: number
  worker: WorkflowRunWorkerSpec
  completedCount: number
  hasStarted: boolean
}) {
  const allDone = completedCount >= worker.steps.length
  const isRunning = hasStarted && !allDone
  const isPending = !hasStarted
  const [detailCollapsed, setDetailCollapsed] = useState(allDone)
  const taskHeading = worker.taskTitle.includes(':') ? worker.taskTitle.split(':').slice(1).join(':').trim() : worker.taskTitle
  const streamLines = allDone
    ? [worker.summary, `${worker.displayName} 已完成全部步骤，并已把结果回传给 Manager。`]
    : isRunning
      ? [
          worker.summary,
          worker.statusLabel,
          `当前执行中：${worker.steps[Math.min(completedCount, worker.steps.length - 1)]}`,
        ]
      : [worker.summary, '等待 Manager 派发执行。']
  const executionSteps: WorkflowRunExecStep[] = worker.steps.map((step, index) => {
    const done = completedCount > index
    const active = !done && completedCount === index && hasStarted
    return {
      label: step,
      status: done ? 'ok' : active ? 'warn' : 'pending',
      detail: done ? '该步骤已完成并记录到当前结果。' : active ? '当前正在处理该步骤。' : '等待前序步骤完成后启动。',
    }
  })
  const outputRows: WorkflowRunExecOutputRow[] = [
    { k: '当前任务', v: worker.taskTitle },
    { k: '执行目标', v: worker.objective },
    { k: '预期产出', v: worker.deliverable },
  ]

  useEffect(() => {
    if (isRunning) {
      setDetailCollapsed(false)
      return
    }
    if (!allDone) {
      return
    }
    const timer = window.setTimeout(() => setDetailCollapsed(true), 1600)
    return () => window.clearTimeout(timer)
  }, [allDone, isRunning])

  const currentRevealStage: 'none' | 'steps' | 'task' | 'full' = !hasStarted
    ? 'none'
    : allDone
      ? 'full'
      : completedCount <= 1
        ? 'steps'
        : 'task'

  const shouldShowSteps = !detailCollapsed && (currentRevealStage === 'steps' || currentRevealStage === 'full')
  const shouldShowTaskInfo = !detailCollapsed && (currentRevealStage === 'task' || currentRevealStage === 'full')
  const shouldShowResult = !detailCollapsed && currentRevealStage === 'full'

  const statusTone = isPending ? 'running' : allDone ? 'done' : 'running'
  const statusLabel = isPending ? '等待中' : allDone ? '已完成' : '运行中'

  return (
    <div
      className={`runs-account-subagent-matrix-group scenario-workflow-run-worker-record${
        detailCollapsed ? ' runs-account-subagent-matrix-group--collapsed' : ' runs-account-subagent-matrix-group--open'
      } runs-account-subagent-matrix-group--${statusTone}`}
    >
      <button
        type="button"
        className="runs-account-subagent-matrix-group-head"
        aria-expanded={!detailCollapsed}
        onClick={() => setDetailCollapsed((prev) => !prev)}
      >
        <span className="runs-account-subagent-matrix-group-index">{`#${index + 1}`}</span>
        <span className="runs-account-subagent-matrix-group-title">{taskHeading}</span>
        <span className={`runs-account-subagent-matrix-group-agent runs-account-subagent-matrix-group-agent--${statusTone}`}>
          {allDone ? (
            <span className="runs-account-subagent-matrix-group-agent-icon" aria-hidden="true">
              ◇
            </span>
          ) : (
            <span className="runs-account-subagent-matrix-group-agent-spinner" aria-hidden="true" />
          )}
          <span className="runs-account-subagent-matrix-group-agent-name">{worker.displayName}</span>
          <span className={`runs-account-subagent-matrix-group-agent-status runs-account-subagent-matrix-group-agent-status--${statusTone}`}>
            {allDone ? (
              <>
                <span className="runs-agent-post-exec-review-head-status-icon-check" aria-hidden="true">
                  ✓
                </span>
                {statusLabel}
              </>
            ) : isPending ? (
              <>{statusLabel}</>
            ) : (
              <>
                <span className="runs-agent-post-exec-review-head-status-spin" aria-hidden="true" />
                {statusLabel}
              </>
            )}
          </span>
        </span>
        <span className="runs-account-subagent-matrix-group-count" aria-hidden="true">
          {worker.steps.length} 个子任务
        </span>
        <span
          className={`runs-account-subagent-matrix-group-chev${detailCollapsed ? '' : ' runs-account-subagent-matrix-group-chev--open'}`}
          aria-hidden="true"
        />
      </button>
      {!detailCollapsed ? (
        <div className="scenario-workflow-run-worker-record-body">
          <ul className="scenario-workspace-runs-run-list" aria-live="polite">
            {streamLines.map((line) => (
              <li key={`${worker.id}-${line}`} className={allDone ? undefined : 'scenario-workspace-runs-run-card-stream-line--show'}>
                {line}
              </li>
            ))}
            {isRunning ? (
              <li>
                正在持续生成当前执行结果
                <span className="scenario-workflow-run-code-cursor" aria-hidden="true" />
              </li>
            ) : null}
          </ul>

          {shouldShowSteps ? (
            <>
              <WorkflowRunExecKicker>执行步骤</WorkflowRunExecKicker>
              <WorkflowRunExecSteps steps={executionSteps} />
            </>
          ) : null}

          {shouldShowTaskInfo ? (
            <>
              <WorkflowRunExecKicker>任务信息</WorkflowRunExecKicker>
              <WorkflowRunExecOutputs rows={outputRows} />
            </>
          ) : null}

          {shouldShowResult ? (
            <>
              <WorkflowRunExecResult
                title={worker.resultTitle}
                summary={`${worker.displayName} 已完成该任务，并将结果回传给 Manager 进行最终汇总。`}
                items={worker.resultBody}
              />
              {worker.resultHighlights.length > 0 ? (
                <WorkflowRunExecOutputs
                  rows={worker.resultHighlights.map((item, highlightIndex) => ({
                    k: `结果摘要 ${highlightIndex + 1}`,
                    v: item,
                  }))}
                />
              ) : null}
              {worker.codeBlock ? <WorkflowRunExecJson language={worker.codeLanguage ?? 'json'} code={worker.codeBlock} /> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function WorkflowRunManagerUnifiedCard({
  managerName,
  behavior,
  phase,
  isReportReady,
  workerStarted,
  workerProgress,
}: {
  managerName: string
  behavior: WorkflowRunBehaviorConfig
  phase: 0 | 1 | 2 | 3
  isReportReady: boolean
  workerStarted: Record<string, boolean>
  workerProgress: Record<string, number>
}) {
  const [matrixDetailCollapsed, setMatrixDetailCollapsed] = useState(false)
  const [reportRevealCount, setReportRevealCount] = useState(0)
  const startedWorkersCount = WORKFLOW_RUN_WORKERS.filter((worker) => workerStarted[worker.id] ?? false).length
  const completedWorkersCount = WORKFLOW_RUN_WORKERS.filter(
    (worker) => (workerProgress[worker.id] ?? 0) >= worker.steps.length,
  ).length
  const allWorkersCompleted = completedWorkersCount >= WORKFLOW_RUN_WORKERS.length

  useEffect(() => {
    if (!allWorkersCompleted) {
      setMatrixDetailCollapsed(false)
      return
    }
    const timer = window.setTimeout(() => setMatrixDetailCollapsed(true), 2400)
    return () => window.clearTimeout(timer)
  }, [allWorkersCompleted])

  useEffect(() => {
    if (!isReportReady) {
      setReportRevealCount(0)
      return
    }

    setReportRevealCount(1)
    const timers: ReturnType<typeof setTimeout>[] = []
    ;[2, 3, 4, 5, 6].forEach((count, index) => {
      timers.push(window.setTimeout(() => setReportRevealCount(count), 240 + index * 180))
    })

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [isReportReady])

  const streamLines =
    phase < 2
      ? [
          '已读取当前 workflow 节点结构、触发方式与输出目标。',
          behavior.allowDelegation
            ? '已识别 IT 开通、设备权限准备、培训宣讲三类子任务需要协同推进。'
            : '当前已关闭自动分发，将按管理型 Agent 主导的顺序推进各任务节点。',
          behavior.responseSchemaProperties.length > 0
            ? `已判断最终需要按结构化字段输出：${behavior.responseSchemaProperties.join('、')}。`
            : `已判断最终输出格式为 ${behavior.responseFormatLabel}。`,
        ]
      : [
          '已读取当前 workflow 节点结构、触发方式与输出目标。',
          behavior.allowDelegation
            ? '已识别 IT 开通、设备权限准备、培训宣讲三类子任务需要协同推进。'
            : '当前以 Manager 审核模式运行，并按顺序控制节点执行。',
          behavior.reasoningEnabled
            ? `已完成前置推理，并将最多执行 ${behavior.maxReasoningAttempts || '多'} 轮决策判断。`
            : '未启用额外推理，将直接进入执行派发。',
        ]

  const capMuted =
    isReportReady
      ? '已完成结果聚合与测试报告生成'
      : phase >= 3
        ? allWorkersCompleted
          ? `${behavior.allowDelegation ? 'Agent 协同矩阵' : 'Manager 顺序执行'} · ${WORKFLOW_RUN_WORKERS.length} 大任务已完成`
          : `${behavior.allowDelegation ? 'Agent 协同矩阵' : 'Manager 顺序执行'} · ${behavior.allowDelegation ? `${WORKFLOW_RUN_WORKERS.length} 大任务并行执行中` : '节点顺序执行中'}`
        : phase >= 2
          ? behavior.allowDelegation
            ? '正在拆解任务并派发 Agent'
            : '正在执行 Manager 主导调度'
          : '正在理解当前 workflow'

  return (
    <WorkflowRunCard
      avatarSrc={WORKFLOW_RUN_AVATAR_MAP.manager}
      displayName={managerName}
      capMuted={capMuted}
      streamKey={`manager-unified-phase-${phase}-${isReportReady ? 'report' : 'main'}`}
      streamLines={streamLines}
      showLiveLine={phase > 0 && phase < 3}
      streamStatic={phase >= 3}
    >
      {phase >= 3 ? (
        <div className="scenario-workflow-run-nested-cards">
          <WorkflowRunCard
            avatarSrc={WORKFLOW_RUN_AVATAR_MAP.manager}
            displayName={managerName}
            capMuted={
              allWorkersCompleted
                ? `Agent 协同矩阵 · ${WORKFLOW_RUN_WORKERS.length} 个 Agent 已完成`
                : behavior.allowDelegation
                  ? `Agent 协同矩阵 · 已派发 ${startedWorkersCount} / ${WORKFLOW_RUN_WORKERS.length} 个 Agent`
                  : `Manager 顺序执行 · 已推进 ${startedWorkersCount} / ${WORKFLOW_RUN_WORKERS.length} 个节点`
            }
            streamKey={`manager-matrix-shell-${allWorkersCompleted ? 'done' : 'running'}`}
            streamLines={
              allWorkersCompleted
                ? ['全部子 Agent 已完成执行并回传结果，可展开查看各 Agent 明细。']
                : ['各 Agent 正在按派发批次执行，完成后会自动折叠为矩阵汇总。']
            }
            showLiveLine={!allWorkersCompleted}
            streamStatic={allWorkersCompleted}
            hideIdentity
            detailCollapsed={matrixDetailCollapsed}
            detailCollapsible={allWorkersCompleted}
            onToggleDetailCollapsed={() => setMatrixDetailCollapsed((prev) => !prev)}
          >
            <div className="scenario-workflow-run-nested-cards">
              {WORKFLOW_RUN_WORKERS.map((worker, index) => (
                <WorkflowRunWorkerCard
                  key={worker.id}
                  index={index}
                  worker={worker}
                  completedCount={workerProgress[worker.id] ?? 0}
                  hasStarted={workerStarted[worker.id] ?? false}
                />
              ))}
            </div>
          </WorkflowRunCard>
        </div>
      ) : null}
      {isReportReady ? (
        <>
          {reportRevealCount >= 1 ? (
            <WorkflowRunExecKicker className="scenario-workflow-run-final-report-kicker">最终汇报</WorkflowRunExecKicker>
          ) : null}
          <div className="scenario-workflow-run-inline-report">
            {reportRevealCount >= 2 ? (
              <p className="scenario-workflow-run-inline-report-appear">
                已收集各 Agent 的结构化产出与运行摘要，并生成最终汇总结论与后续建议。
              </p>
            ) : null}
            <ul className="scenario-workflow-run-inline-report-list">
              {reportRevealCount >= 3 ? (
                <li className="scenario-workflow-run-inline-report-appear">
                  IT 开通协调Agent 已输出账号开通清单、权限审批建议与阻塞风险。
                </li>
              ) : null}
              {reportRevealCount >= 4 ? (
                <li className="scenario-workflow-run-inline-report-appear">
                  设备与权限开通Agent 已完成设备预留、门禁工位权限与首日领取安排。
                </li>
              ) : null}
              {reportRevealCount >= 5 ? (
                <li className="scenario-workflow-run-inline-report-appear">
                  企业宣讲Agent 已完成首日宣讲提纲与首周引导安排。
                </li>
              ) : null}
              {reportRevealCount >= 6 ? (
                <li className="scenario-workflow-run-inline-report-appear">
                  {behavior.safeModeEnabled
                    ? '本轮运行测试已完成，高风险或不确定结果已按安全治理规则标注。'
                    : '本轮运行测试已完成，可继续进入发布前验证。'}
                </li>
              ) : null}
            </ul>
          </div>
        </>
      ) : null}
    </WorkflowRunCard>
  )
}

function ManualRunTriggerBadgeIcon() {
  return (
    <svg
      className="scenario-workflow-run-page-badge-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      />
    </svg>
  )
}

type WorkflowRunParameterField = {
  id: 'employeeName' | 'employeeEmail' | 'department' | 'role' | 'startDate'
  label: string
  placeholder: string
  value: string
  inputType?: 'text' | 'date'
}

type WorkflowRunPreviewSection = {
  id: string
  title: string
  description: string
  expectedOutput: string
}

type WorkflowCanvasRunTimeline = {
  nodeStatuses: Partial<Record<string, WorkflowCanvasNodeRuntimeStatus>>
  edgeStatuses: Partial<Record<string, WorkflowCanvasEdgeRuntimeStatus>>
}

const DEFAULT_WORKFLOW_RUN_PARAMETER_FIELDS: WorkflowRunParameterField[] = [
  {
    id: 'employeeName',
    label: '员工姓名',
    placeholder: '请输入员工姓名',
    value: '林晓雯',
  },
  {
    id: 'employeeEmail',
    label: '员工邮箱',
    placeholder: '请输入员工邮箱',
    value: 'lin.xiaowen@company.com',
  },
  {
    id: 'department',
    label: '所属部门',
    placeholder: '请输入所属部门',
    value: '产品运营部',
  },
  {
    id: 'role',
    label: '岗位名称',
    placeholder: '请输入岗位名称',
    value: '运营专员',
  },
  {
    id: 'startDate',
    label: '入职日期',
    placeholder: '请输入入职日期',
    value: '2026-05-28',
    inputType: 'date',
  },
]

function formatRunParameterValue(fieldId: WorkflowRunParameterField['id'], value: string) {
  if (fieldId === 'startDate' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.replace(/-/g, '.')
  }
  return value
}

function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return
  const pickerInput = input as HTMLInputElement & { showPicker?: () => void }
  try {
    pickerInput.showPicker?.()
  } catch {
    /* ignore browsers without native picker support */
  }
}

function renderPreviewTemplate(
  template: string,
  values: Record<WorkflowRunParameterField['id'], string>,
  labels: Record<WorkflowRunParameterField['id'], string>,
) {
  const tokenRegex = /{{(employeeName|employeeEmail|department|role|startDate)}}/g
  const segments: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push(template.slice(lastIndex, match.index))
    }

    const fieldId = match[1] as WorkflowRunParameterField['id']
    const value = formatRunParameterValue(fieldId, values[fieldId].trim()) || `待填写${labels[fieldId]}`
    segments.push(
      <span key={`${fieldId}-${match.index}`} className="onboarding-workflow-run-modal-preview-token">
        {value}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < template.length) {
    segments.push(template.slice(lastIndex))
  }

  return segments
}

function buildRunPreviewSections(
  managerName: string,
  nodes: ReturnType<typeof useOnboardingWorkflowState>['nodes'],
  behavior: WorkflowRunBehaviorConfig,
): WorkflowRunPreviewSection[] {
  const workerNodes = nodes.filter((node) => node.data.kind === 'agent').slice(0, 3)
  const schemaSummary =
    behavior.responseSchemaProperties.length > 0
      ? `结构化字段：${behavior.responseSchemaProperties.join('、')}。`
      : '输出可以保留自然语言摘要。'
  const delegationSummary = behavior.allowDelegation
    ? 'Manager 会将任务分派给成员节点协同执行。'
    : 'Manager 会保留控制权，按顺序推进节点并减少自动分发。'

  const sections = workerNodes.map((node, index) => ({
    id: node.id,
    title: node.data.label,
    description:
      index === 0
        ? `接收 {{employeeName}}（{{employeeEmail}}）的入职资料，并结合 {{department}} 的岗位 {{role}} 要求，${node.data.description}`
        : index === 1
          ? `围绕 {{employeeName}} 在 {{startDate}} 入职的安排展开执行，结合 {{department}} 当前的协同需求，${node.data.description}`
          : `基于 {{employeeName}} 的岗位 {{role}} 与入职日期 {{startDate}}，整理跨团队协同事项并继续推进，${node.data.description}`,
    expectedOutput: `${node.data.label} 的执行摘要、关键待办与需要同步给 ${managerName} 的${behavior.responseSchemaProperties.length > 0 ? '结构化' : ''}结果。${schemaSummary}`,
  }))

  return [
    {
      id: 'manager-overview',
      title: `${managerName} 运行总览`,
      description:
        `${managerName} 将根据 {{employeeName}}（{{employeeEmail}}）的入职信息，协调 {{department}} 的 {{role}} 岗位在 {{startDate}} 前完成 workflow 任务分派、执行跟进与结果汇总。${delegationSummary}`,
      expectedOutput: `输出本次入职 workflow 的整体执行概览、关键风险、协同状态与最终汇总结论，返回格式为 ${behavior.responseFormatLabel}。${schemaSummary}`,
    },
    ...sections,
  ]
}

function normalizeWorkflowNodeLabel(label: string) {
  return label.replace(/\s+/g, '')
}

function buildIdleRunTimeline(
  nodes: ReturnType<typeof useOnboardingWorkflowState>['nodes'],
  edges: ReturnType<typeof useOnboardingWorkflowState>['edges'],
): WorkflowCanvasRunTimeline {
  return {
    nodeStatuses: Object.fromEntries(nodes.map((node) => [node.id, 'idle'])) as Partial<
      Record<string, WorkflowCanvasNodeRuntimeStatus>
    >,
    edgeStatuses: Object.fromEntries(edges.map((edge) => [edge.id, 'idle'])) as Partial<
      Record<string, WorkflowCanvasEdgeRuntimeStatus>
    >,
  }
}

function buildWorkflowRunPlan(
  nodes: ReturnType<typeof useOnboardingWorkflowState>['nodes'],
  edges: ReturnType<typeof useOnboardingWorkflowState>['edges'],
) {
  const managerNode = nodes.find((node) => node.data.kind === 'main-agent') ?? null
  const childAgentNodes = nodes
    .filter((node) => node.data.kind === 'agent')
    .sort((a, b) => (a.position.y === b.position.y ? a.position.x - b.position.x : a.position.y - b.position.y))

  const itNode =
    childAgentNodes.find((node) => normalizeWorkflowNodeLabel(node.data.label).includes('IT开通协调')) ?? null
  const cultureNode =
    childAgentNodes.find((node) => normalizeWorkflowNodeLabel(node.data.label).includes('企业文化宣讲')) ?? null
  const remainingNodes = childAgentNodes.filter((node) => node.id !== itNode?.id && node.id !== cultureNode?.id)

  const allTimedNodes = [itNode, cultureNode, ...remainingNodes].filter((node): node is NonNullable<typeof node> => Boolean(node))
  const timedEdgeIds = new Map(
    allTimedNodes.map((node) => [node.id, edges.filter((edge) => edge.target === node.id).map((edge) => edge.id)]),
  )

  return {
    managerNodeId: managerNode?.id ?? null,
    parallelNodes: [itNode, cultureNode].filter((node): node is NonNullable<typeof node> => Boolean(node)),
    sequentialNodes: remainingNodes,
    edgeIdByNodeId: timedEdgeIds,
  }
}

function OnboardingWorkflowRunModal({
  managerName,
  nodes,
  behavior,
  parameterFields,
  onParameterChange,
  onClose,
  onRun,
}: {
  managerName: string
  nodes: ReturnType<typeof useOnboardingWorkflowState>['nodes']
  behavior: WorkflowRunBehaviorConfig
  parameterFields: WorkflowRunParameterField[]
  onParameterChange: (fieldId: WorkflowRunParameterField['id'], value: string) => void
  onClose: () => void
  onRun: () => void
}) {
  const titleId = useId()
  const previewSections = useMemo(() => buildRunPreviewSections(managerName, nodes, behavior), [behavior, managerName, nodes])
  const fieldValues = useMemo(
    () =>
      Object.fromEntries(parameterFields.map((field) => [field.id, field.value])) as Record<
        WorkflowRunParameterField['id'],
        string
      >,
    [parameterFields],
  )
  const fieldLabels = useMemo(
    () =>
      Object.fromEntries(parameterFields.map((field) => [field.id, field.label])) as Record<
        WorkflowRunParameterField['id'],
        string
      >,
    [parameterFields],
  )
  const dateInputRefs = useRef<Partial<Record<WorkflowRunParameterField['id'], HTMLInputElement | null>>>({})

  return (
    <div className="onboarding-workflow-run-modal-root" lang="zh-CN">
      <button
        type="button"
        className="onboarding-workflow-run-modal-backdrop"
        aria-label="关闭运行参数弹窗"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="onboarding-workflow-run-modal-panel"
      >
        <div className="onboarding-workflow-run-modal-head">
          <div>
            <h2 id={titleId} className="onboarding-workflow-run-modal-title">
              运行参数
            </h2>
            <p className="onboarding-workflow-run-modal-subtitle">填写运行参数后，可在右侧实时预览本次 workflow 的执行说明与期望输出。</p>
          </div>
          <button type="button" className="onboarding-workflow-run-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="onboarding-workflow-run-modal-body">
          <section className="onboarding-workflow-run-modal-column" aria-label="输入参数">
            <div className="onboarding-workflow-run-modal-section-head">
              <h3>输入参数</h3>
            </div>
            <div className="onboarding-workflow-run-modal-fields">
              {parameterFields.map((field) => (
                <label key={field.id} className="onboarding-workflow-run-modal-field">
                  <span>{field.label}</span>
                  {field.inputType === 'date' ? (
                    <div className="onboarding-workflow-run-modal-input-wrap">
                      <input
                        ref={(node) => {
                          dateInputRefs.current[field.id] = node
                        }}
                        className="onboarding-workflow-run-modal-input onboarding-workflow-run-modal-input--date"
                        type="date"
                        value={field.value}
                        placeholder={field.placeholder}
                        onClick={(event) => openDatePicker(event.currentTarget)}
                        onChange={(event) => onParameterChange(field.id, event.target.value)}
                      />
                      <button
                        type="button"
                        className="onboarding-workflow-run-modal-date-trigger"
                        aria-label={`选择${field.label}`}
                        onClick={() => {
                          const input = dateInputRefs.current[field.id] ?? null
                          input?.focus()
                          openDatePicker(input)
                        }}
                      >
                        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
                          <path
                            d="M6 2.75v2.5M14 2.75v2.5M3.75 7.25h12.5M5.5 4.5h9A1.75 1.75 0 0 1 16.25 6.25v8.25A1.75 1.75 0 0 1 14.5 16.25h-9a1.75 1.75 0 0 1-1.75-1.75V6.25A1.75 1.75 0 0 1 5.5 4.5Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <input
                      className="onboarding-workflow-run-modal-input"
                      type={field.inputType ?? 'text'}
                      value={field.value}
                      placeholder={field.placeholder}
                      onChange={(event) => onParameterChange(field.id, event.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="onboarding-workflow-run-modal-column onboarding-workflow-run-modal-column--preview" aria-label="预览">
            <div className="onboarding-workflow-run-modal-section-head">
              <h3>预览</h3>
              <p>右侧内容会根据左侧输入参数实时变化。</p>
            </div>
            <div className="onboarding-workflow-run-modal-preview-list">
              {previewSections.map((section, index) => (
                <article key={section.id} className="onboarding-workflow-run-modal-preview-card">
                  <div className="onboarding-workflow-run-modal-preview-index">{index + 1}</div>
                  <div className="onboarding-workflow-run-modal-preview-main">
                    <h4>{section.title}</h4>
                    <p className="onboarding-workflow-run-modal-preview-description">
                      {renderPreviewTemplate(section.description, fieldValues, fieldLabels)}
                    </p>
                    <div className="onboarding-workflow-run-modal-expected">
                      <span className="onboarding-workflow-run-modal-expected-label">期望输出</span>
                      <p>{section.expectedOutput}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="onboarding-workflow-run-modal-footer">
          <button type="button" className="onboarding-workflow-ghost-btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="onboarding-workflow-primary-btn" onClick={onRun}>
            运行
          </button>
        </div>
      </div>
    </div>
  )
}

function OnboardingWorkflowRunTestPanel({
  managerName,
  behavior,
  onBack,
}: {
  managerName: string
  behavior: WorkflowRunBehaviorConfig
  onBack: () => void
}) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0)
  const [isReportReady, setIsReportReady] = useState(false)
  const [workerStarted, setWorkerStarted] = useState<Record<string, boolean>>(
    Object.fromEntries(WORKFLOW_RUN_WORKERS.map((worker) => [worker.id, false])),
  )
  const [workerProgress, setWorkerProgress] = useState<Record<string, number>>(
    Object.fromEntries(WORKFLOW_RUN_WORKERS.map((worker) => [worker.id, 0])),
  )
  const allWorkersCompleted = WORKFLOW_RUN_WORKERS.every(
    (worker) => (workerProgress[worker.id] ?? 0) >= worker.steps.length,
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase(1), behavior.reasoningEnabled ? 520 : 320)
    return () => window.clearTimeout(timer)
  }, [behavior.reasoningEnabled])

  useEffect(() => {
    if (phase !== 1) return
    const timer = window.setTimeout(
      () => setPhase(2),
      behavior.reasoningEnabled ? 1450 + Math.min(2200, Number(behavior.maxReasoningAttempts || '0') * 260) : 1450,
    )
    return () => window.clearTimeout(timer)
  }, [behavior.maxReasoningAttempts, behavior.reasoningEnabled, phase])

  useEffect(() => {
    if (phase !== 2) return
    const timer = window.setTimeout(() => setPhase(3), 1500)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 3) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const workerTimingPlan = behavior.allowDelegation
      ? [
          { startDelay: 880, stepOffsets: [1180, 2840, 4720] },
          { startDelay: 2140, stepOffsets: [1560, 3520, 5640] },
          { startDelay: 3840, stepOffsets: [1380, 3360, 5960] },
          { startDelay: 5920, stepOffsets: [1840, 4280, 7440] },
        ]
      : [
          { startDelay: 880, stepOffsets: [1380, 3320, 5380] },
          { startDelay: 6580, stepOffsets: [1080, 2940, 4760] },
          { startDelay: 11980, stepOffsets: [1040, 2660, 4380] },
          { startDelay: 17080, stepOffsets: [1040, 2620, 4280] },
        ]

    WORKFLOW_RUN_WORKERS.forEach((worker, workerIndex) => {
      const timing = workerTimingPlan[workerIndex] ?? {
        startDelay: 1200 + workerIndex * 1480,
        stepOffsets: worker.steps.map((_, stepIndex) => 1380 + stepIndex * 1860),
      }
      timers.push(
        window.setTimeout(() => {
          setWorkerStarted((prev) => ({
            ...prev,
            [worker.id]: true,
          }))
        }, timing.startDelay),
      )
      worker.steps.forEach((_, stepIndex) => {
        const stepOffset =
          timing.stepOffsets[stepIndex] ??
          timing.stepOffsets[timing.stepOffsets.length - 1] + (stepIndex - timing.stepOffsets.length + 1) * 1400
        timers.push(
          window.setTimeout(() => {
            setWorkerProgress((prev) => ({
              ...prev,
              [worker.id]: Math.max(prev[worker.id] ?? 0, stepIndex + 1),
            }))
          }, timing.startDelay + stepOffset),
        )
      })
    })

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [behavior.allowDelegation, phase])

  useEffect(() => {
    if (!allWorkersCompleted) {
      setIsReportReady(false)
      return
    }
    const timer = window.setTimeout(() => setIsReportReady(true), 2400)
    return () => window.clearTimeout(timer)
  }, [allWorkersCompleted])

  return (
    <div className="scenario-workflow-run-panel" aria-label="运行测试面板">
      <div className="scenario-workflow-run-scroll scenario-workflow-run-scroll--runs">
        <div className="scenario-workflow-run-linear-shell scenario-workflow-run-linear-shell--runs">
          <div className="scenario-workflow-run-page-head scenario-workflow-run-page-head--runs">
            <button className="agents-back-btn" type="button" aria-label="返回管理型智能体配置页面" onClick={onBack}>
              ←
            </button>
            <div className="scenario-workflow-run-page-copy">
              <div className="scenario-workflow-run-page-title-row">
                <h2>运行测试</h2>
                <span className="scenario-workflow-run-page-badge">
                  <ManualRunTriggerBadgeIcon />
                  Manual
                </span>
                <span
                  className={
                    isReportReady
                      ? 'scenario-workflow-run-page-status is-done'
                      : phase >= 3
                        ? 'scenario-workflow-run-page-status is-running'
                        : 'scenario-workflow-run-page-status'
                  }
                >
                  {isReportReady ? '汇总完成' : phase >= 3 ? '执行中' : '准备中'}
                </span>
              </div>
            </div>
          </div>

          <div className="scenario-workflow-run-sequence">
            {phase >= 1 ? (
              <WorkflowRunStep
                avatarSrc={WORKFLOW_RUN_AVATAR_MAP.manager}
                displayName={managerName}
                timeLabel={isReportReady ? '00:12' : phase >= 3 ? '00:07' : '00:01'}
                hierarchy="manager"
                completed={isReportReady}
              >
                <WorkflowRunManagerUnifiedCard
                  managerName={managerName}
                  behavior={behavior}
                  phase={phase}
                  isReportReady={isReportReady}
                  workerStarted={workerStarted}
                  workerProgress={workerProgress}
                />
              </WorkflowRunStep>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

type OnboardingWorkflowPageProps = {
  managerName: string
  modelConfig: string
  instructions: string
  generatedPrompt: string
  managerAgents: ManagerAgentRow[]
  advancedConfig?: ManagerialAdvancedConfig
  hiddenAgentNames?: string[]
  /** `plan-onboarding`：与首页 Plan 三轮采集链对齐的默认节点与连线 */
  workflowPreset?: OnboardingWorkflowPreset
  initialView?: 'build' | 'run-test'
  onBack: () => void
}

export function OnboardingWorkflowPage({
  managerName,
  modelConfig,
  instructions,
  generatedPrompt,
  managerAgents,
  advancedConfig,
  hiddenAgentNames,
  workflowPreset = 'default',
  initialView = 'build',
  onBack,
}: OnboardingWorkflowPageProps) {
  const workflow = useOnboardingWorkflowState({
    managerName,
    modelConfig,
    instructions,
    generatedPrompt,
    managerAgents,
    advancedConfig,
    hiddenAgentNames,
    workflowPreset,
  })
  const runBehavior = useMemo<WorkflowRunBehaviorConfig>(
    () => ({
      allowDelegation: workflow.mainAgentForm.allowDelegation,
      reasoningEnabled: workflow.mainAgentForm.reasoningEnabled,
      maxReasoningAttempts: workflow.mainAgentForm.maxReasoningAttempts,
      maxIterations: workflow.mainAgentForm.maxIterations,
      maxExecutionTimeSeconds: workflow.mainAgentForm.maxExecutionTimeSeconds,
      responseSchemaProperties: workflow.mainAgentForm.responseSchemaProperties,
      responseFormatLabel:
        advancedConfig?.structuredOutputEnabled || advancedConfig?.responseFormat === 'structured'
          ? 'Structured'
          : advancedConfig?.responseFormat === 'json'
            ? 'JSON'
            : advancedConfig?.responseFormat === 'markdown'
              ? 'Markdown'
              : 'Text',
      safeModeEnabled: Boolean(advancedConfig?.safeResponsibleAiEnabled || advancedConfig?.hallucinationManagerEnabled),
    }),
    [advancedConfig, workflow.mainAgentForm],
  )

  const sourceNode = workflow.selectedEdge
    ? workflow.nodes.find((node) => node.id === workflow.selectedEdge?.source) ?? null
    : null
  const targetNode = workflow.selectedEdge
    ? workflow.nodes.find((node) => node.id === workflow.selectedEdge?.target) ?? null
    : null
  const hasLeftPanel =
    workflow.leftPanelMode !== 'ai-thoughts' && Boolean(workflow.selectedNode || workflow.selectedEdge)
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false)
  const [workflowView, setWorkflowView] = useState<'build' | 'run-loading' | 'run-test'>(initialView)
  const [isRunModalOpen, setIsRunModalOpen] = useState(false)
  const [runParameterFields, setRunParameterFields] = useState<WorkflowRunParameterField[]>(DEFAULT_WORKFLOW_RUN_PARAMETER_FIELDS)
  const runTimersRef = useRef<number[]>([])
  const workflowStructureSignature = useMemo(
    () =>
      JSON.stringify({
        nodeIds: workflow.nodes.map((node) => node.id),
        edgeIds: workflow.edges.map((edge) => edge.id),
      }),
    [workflow.edges, workflow.nodes],
  )
  const [canvasRunTimeline, setCanvasRunTimeline] = useState<WorkflowCanvasRunTimeline>(() =>
    buildIdleRunTimeline(workflow.nodes, workflow.edges),
  )
  const handleRunTestBack = () => {
    if (initialView === 'run-test') {
      onBack()
      return
    }
    setWorkflowView('build')
  }

  useEffect(() => {
    if (workflowView !== 'run-loading') return
    const timer = window.setTimeout(() => setWorkflowView('run-test'), 1100)
    return () => window.clearTimeout(timer)
  }, [workflowView])

  const clearCanvasRunTimers = useCallback(() => {
    runTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    runTimersRef.current = []
  }, [])

  useEffect(() => () => clearCanvasRunTimers(), [clearCanvasRunTimers])

  useEffect(() => {
    setCanvasRunTimeline((prev) => ({
      nodeStatuses: Object.fromEntries(
        workflow.nodes.map((node) => [node.id, prev.nodeStatuses[node.id] ?? 'idle']),
      ) as Partial<Record<string, WorkflowCanvasNodeRuntimeStatus>>,
      edgeStatuses: Object.fromEntries(
        workflow.edges.map((edge) => [edge.id, prev.edgeStatuses[edge.id] ?? 'idle']),
      ) as Partial<Record<string, WorkflowCanvasEdgeRuntimeStatus>>,
    }))
  }, [workflowStructureSignature, workflow.edges, workflow.nodes])

  const startCanvasRunSequence = useCallback(() => {
    clearCanvasRunTimers()
    const idleTimeline = buildIdleRunTimeline(workflow.nodes, workflow.edges)
    setCanvasRunTimeline(idleTimeline)

    const runPlan = buildWorkflowRunPlan(workflow.nodes, workflow.edges)
    if (!runPlan.managerNodeId) return

    const schedule = (delayMs: number, task: () => void) => {
      runTimersRef.current.push(window.setTimeout(task, delayMs))
    }

    const markNodeStatus = (nodeId: string, status: WorkflowCanvasNodeRuntimeStatus) => {
      setCanvasRunTimeline((prev) => ({
        ...prev,
        nodeStatuses: {
          ...prev.nodeStatuses,
          [nodeId]: status,
        },
      }))
    }

    const markEdgeStatus = (edgeIds: string[] | undefined, status: WorkflowCanvasEdgeRuntimeStatus) => {
      if (!edgeIds || edgeIds.length === 0) return
      setCanvasRunTimeline((prev) => ({
        ...prev,
        edgeStatuses: {
          ...prev.edgeStatuses,
          ...Object.fromEntries(edgeIds.map((edgeId) => [edgeId, status])),
        },
      }))
    }

    const managerNodeId = runPlan.managerNodeId
    const reasoningPasses = Math.max(0, Number(workflow.mainAgentForm.maxReasoningAttempts || '0'))
    const managerBusyDelay = workflow.mainAgentForm.reasoningEnabled ? 2000 + Math.min(2400, reasoningPasses * 320) : 1200
    const delegationEnabled = workflow.mainAgentForm.allowDelegation
    const parallelStartDelay = managerBusyDelay + 600
    const iterationBudget = Math.max(1, Number(workflow.mainAgentForm.maxIterations || '3'))
    const parallelDuration = delegationEnabled ? Math.max(2200, Math.min(4200, iterationBudget * 180)) : 0
    const executionBudget = Math.max(600, Number(workflow.mainAgentForm.maxExecutionTimeSeconds || '1800'))
    const sequenceNodes = delegationEnabled
      ? runPlan.sequentialNodes
      : [...runPlan.parallelNodes, ...runPlan.sequentialNodes]
    const sequentialBaseDuration = Math.max(
      1600,
      Math.min(4200, Math.round(executionBudget / Math.max(1, sequenceNodes.length * 2))),
    )
    const sequentialDurations = delegationEnabled
      ? [5000, 3000, 3000]
      : sequenceNodes.map((_, index) => sequentialBaseDuration + index * 360)

    schedule(managerBusyDelay, () => {
      markNodeStatus(managerNodeId, 'busy')
    })

    if (delegationEnabled && runPlan.parallelNodes.length > 0) {
      schedule(parallelStartDelay, () => {
        runPlan.parallelNodes.forEach((node) => {
          markNodeStatus(node.id, 'running')
          markEdgeStatus(runPlan.edgeIdByNodeId.get(node.id), 'running')
        })
      })

      schedule(parallelStartDelay + parallelDuration, () => {
        runPlan.parallelNodes.forEach((node) => {
          markNodeStatus(node.id, 'completed')
          markEdgeStatus(runPlan.edgeIdByNodeId.get(node.id), 'completed')
        })
      })
    }

    let cursorDelay = parallelStartDelay + (delegationEnabled && runPlan.parallelNodes.length > 0 ? parallelDuration : 0)
    sequenceNodes.forEach((node, index) => {
      const duration = sequentialDurations[index] ?? sequentialDurations[sequentialDurations.length - 1]
      schedule(cursorDelay, () => {
        markNodeStatus(node.id, 'running')
        markEdgeStatus(runPlan.edgeIdByNodeId.get(node.id), 'running')
      })

      schedule(cursorDelay + duration, () => {
        markNodeStatus(node.id, 'completed')
        markEdgeStatus(runPlan.edgeIdByNodeId.get(node.id), 'completed')
      })

      cursorDelay += duration
    })

    schedule(cursorDelay + 300, () => {
      markNodeStatus(managerNodeId, 'idle')
    })
  }, [clearCanvasRunTimers, workflow.edges, workflow.mainAgentForm, workflow.nodes])

  const handleRunParameterChange = (fieldId: WorkflowRunParameterField['id'], value: string) => {
    setRunParameterFields((prev) => prev.map((field) => (field.id === fieldId ? { ...field, value } : field)))
  }

  return (
    <section className="onboarding-workflow-page" aria-label="Onboarding Workflow 页面">
      <div className="onboarding-workflow-shell">
        <div className={hasLeftPanel ? 'onboarding-workflow-stage is-panel-open' : 'onboarding-workflow-stage'}>
          {workflowView === 'build' ? (
            <header className="onboarding-workflow-topbar">
              <div className="onboarding-workflow-topbar-left">
                <button className="agents-back-btn" type="button" aria-label="返回管理型智能体配置页面" onClick={onBack}>
                  ←
                </button>
                <div className="onboarding-workflow-meta">
                  <div className="onboarding-workflow-title">Onboarding Agent Workflow</div>
                  <div className="onboarding-workflow-subtitle">
                    {workflowPreset === 'plan-onboarding'
                      ? `${managerName} · Plan 入职采集 → 多代理执行画布（默认骨架）`
                      : `${managerName} · 管理型 Agent workflow 编辑台`}
                  </div>
                </div>
              </div>
  
              <div className="onboarding-workflow-topbar-right">
                <div className="onboarding-workflow-actions">
                  <button className="onboarding-workflow-ghost-btn" type="button">
                    保存
                  </button>
                  <button className="onboarding-workflow-ghost-btn" type="button" onClick={() => setIsRunModalOpen(true)}>
                    运行
                  </button>
                </div>
              </div>
            </header>
          ) : null}

          <div className="onboarding-workflow-content">
            {workflowView === 'run-loading' ? (
              <div className="scenario-workflow-run-loading" aria-label="运行测试准备中">
                <div className="scenario-workflow-run-loading-card">
                  <span className="scenario-workflow-run-loading-spinner" aria-hidden="true" />
                  <strong>正在准备运行测试</strong>
                  <p>正在装配 Orchestrator、SubAgent 与运行上下文，请稍候…</p>
                </div>
              </div>
            ) : workflowView === 'run-test' ? (
              <OnboardingWorkflowRunTestPanel managerName={managerName} behavior={runBehavior} onBack={handleRunTestBack} />
            ) : (
              <>
                {hasLeftPanel ? (
                  <div className="onboarding-workflow-left-overlay">
                    <WorkflowLeftPanel
                      mode={workflow.leftPanelMode}
                      selectedNode={workflow.selectedNode}
                      selectedEdge={workflow.selectedEdge}
                      sourceNode={sourceNode}
                      targetNode={targetNode}
                      mainAgentForm={workflow.mainAgentForm}
                  mainAgentTools={workflow.selectedNode?.data.kind === 'main-agent' ? workflow.selectedNode.data.tools : undefined}
                      onMainAgentFormChange={(patch) =>
                        workflow.setMainAgentForm((prev) => ({
                          ...prev,
                          ...patch,
                        }))
                      }
                      routerBranches={workflow.routerConditionCards}
                      onSelectTrigger={(triggerId) => {
                        if (workflow.selectedNodeId) workflow.updateTriggerSelection(workflow.selectedNodeId, triggerId)
                      }}
                      onUpdateTriggerConfig={(patch) => {
                        if (workflow.selectedNodeId) workflow.updateTriggerConfig(workflow.selectedNodeId, patch)
                      }}
                      onUpdateManualInputConfig={(patch) => {
                        if (workflow.selectedNodeId) workflow.updateManualInputConfig(workflow.selectedNodeId, patch)
                      }}
                      onUpdateAgentSettings={(patch) => {
                        if (workflow.selectedNodeId) workflow.updateAgentSettings(workflow.selectedNodeId, patch)
                      }}
                      onDeleteNode={() => {
                        if (workflow.selectedNodeId) workflow.deleteNode(workflow.selectedNodeId)
                      }}
                      onUpdateOrchestratorConfig={(patch) => {
                        if (workflow.selectedNodeId) workflow.updateOrchestratorConfig(workflow.selectedNodeId, patch)
                      }}
                      onUpdateRouterModel={(value) => {
                        if (workflow.selectedNodeId) workflow.updateRouterModel(workflow.selectedNodeId, value)
                      }}
                      onUpdateRouterBranch={(edgeId, patch) => workflow.updateRouterBranchCondition(edgeId, patch)}
                      onAddRouterRule={(edgeId) => workflow.addEdgeCondition(edgeId)}
                      onUpdateRouterRule={(edgeId, index, value) => workflow.updateEdgeCondition(edgeId, index, value)}
                      onDeleteRouterRule={(edgeId, index) => workflow.removeEdgeCondition(edgeId, index)}
                      onChangeEdgeLabel={(label) => {
                        if (workflow.selectedEdgeId) workflow.updateEdgeLabel(workflow.selectedEdgeId, label)
                      }}
                      onChangeEdgeConnectionType={(value) => {
                        if (workflow.selectedEdgeId) workflow.updateEdgeConnectionType(workflow.selectedEdgeId, value)
                      }}
                      onAddEdgeCondition={() => {
                        if (workflow.selectedEdgeId) workflow.addEdgeCondition(workflow.selectedEdgeId)
                      }}
                      onUpdateEdgeCondition={(index, value) => {
                        if (workflow.selectedEdgeId) workflow.updateEdgeCondition(workflow.selectedEdgeId, index, value)
                      }}
                      onDeleteEdgeCondition={(index) => {
                        if (workflow.selectedEdgeId) workflow.removeEdgeCondition(workflow.selectedEdgeId, index)
                      }}
                      onUpdateLoopConfig={(patch) => {
                        if (workflow.selectedNodeId) workflow.updateLoopConfig(workflow.selectedNodeId, patch)
                      }}
                      onUpdateSubflowConfig={(patch) => {
                        if (workflow.selectedNodeId) workflow.updateSubflowConfig(workflow.selectedNodeId, patch)
                      }}
                      onClosePanel={workflow.closeLeftPanel}
                    />
                  </div>
                ) : null}

                <main className="workflow-canvas-column">
                  <WorkflowCanvas
                    nodes={workflow.nodes}
                    edges={workflow.edges}
                    nodeRuntimeStatuses={canvasRunTimeline.nodeStatuses}
                    edgeRuntimeStatuses={canvasRunTimeline.edgeStatuses}
                    selectedNodeId={workflow.selectedNodeId}
                    selectedEdgeId={workflow.selectedEdgeId}
                    isNewStepPanelOpen={workflow.isNewStepPanelOpen}
                    onSelectNode={workflow.selectNode}
                    onSelectEdge={workflow.selectEdge}
                    onPaneClick={workflow.clearSelection}
                    onNodeDragStop={workflow.updateNodePosition}
                    onConnectNodes={workflow.connectNodes}
                    onAttachToolToAgent={workflow.attachToolToAgent}
                    onCreateAgentNodeFromLibraryItem={workflow.createAgentNodeFromLibraryItem}
                    onCloseNewStepPanel={() => workflow.setIsNewStepPanelOpen(false)}
                    onPickNewStep={workflow.addNode}
                  />
                </main>

                <aside className="onboarding-workflow-right-dock" aria-label="工具1入口区域">
                  {isToolPanelOpen ? (
                    <WorkflowToolLibraryPanel onClose={() => setIsToolPanelOpen(false)} />
                  ) : (
                    <button
                      className="workflow-tool-trigger"
                      type="button"
                      onClick={() => setIsToolPanelOpen(true)}
                      aria-label="打开工具1面板"
                      title="打开工具1面板"
                    >
                      <span className="workflow-tool-trigger-art" aria-hidden="true">
                        <svg viewBox="0 0 24 24" focusable="false">
                          <path
                            d="M19.2 7.1a4 4 0 0 1-5.4 3.7l-5.9 5.9a1.8 1.8 0 1 1-2.6-2.6l5.9-5.9a4 4 0 0 1 3.7-5.4l-2.4 2.4 2.3 2.3 2.4-2.4Z"
                            fill="none"
                            stroke="#1f232b"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  )}
                </aside>
              </>
            )}
          </div>
        </div>
      </div>
      {isRunModalOpen ? (
        <OnboardingWorkflowRunModal
          managerName={managerName}
          nodes={workflow.nodes}
          behavior={runBehavior}
          parameterFields={runParameterFields}
          onParameterChange={handleRunParameterChange}
          onClose={() => setIsRunModalOpen(false)}
          onRun={() => {
            setIsRunModalOpen(false)
            setWorkflowView('build')
            startCanvasRunSequence()
          }}
        />
      ) : null}
    </section>
  )
}
