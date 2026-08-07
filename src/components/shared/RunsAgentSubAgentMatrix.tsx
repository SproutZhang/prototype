import { useEffect, useRef, useState, type ReactNode } from 'react'

export function buildRunsAccountSubAgentMatrix(): readonly RunsAccountSubAgentTask[] {
  return [
    {
      id: 'account-creation',
      title: '系统账户创建',
      subAgent: { name: '系统账户 Agent', tag: 'account-creator' },
      tasks: [
        { label: '创建公司内部系统账户（如 OA、HR 系统、邮箱、协作工具账号）' },
        { label: '设置初始密码' },
        { label: '发送登录信息及使用说明给员工' },
      ],
    },
    {
      id: 'permission-config',
      title: '权限配置',
      subAgent: { name: '权限分配 Agent', tag: 'permission-allocator' },
      tasks: [
        { label: '根据岗位和部门分配系统权限' },
        { label: '配置项目、文件夹、数据库等访问权限' },
        { label: '校验权限是否匹配岗位要求，避免权限过高或不足' },
      ],
    },
    {
      id: 'access-credential',
      title: '访问凭证管理',
      subAgent: { name: '访问凭证 Agent', tag: 'credential-manager' },
      tasks: [
        { label: '配置门禁卡或数字令牌' },
        { label: '测试员工是否可以正常访问办公区域和关键系统' },
        { label: '更新凭证分配记录' },
      ],
    },
    {
      id: 'review-confirm',
      title: '审核与确认',
      subAgent: { name: '审核与确认 Agent', tag: 'audit-confirm' },
      tasks: [
        { label: '核对所有账户及权限设置是否完整、准确' },
        { label: '与部门或 HR 确认特殊权限需求' },
        { label: '标记账户设置完成状态，触发下一个流程（培训协调 Agent）' },
      ],
    },
  ] as const
}

export type RunsAccountSubAgentTask = {
  readonly id: string
  readonly title: string
  readonly subAgent: { readonly name: string; readonly tag: string }
  readonly tasks: readonly { readonly label: string; readonly detail?: string }[]
}

export type RunsAccountSubAgentGroupPhase = 'pending' | 'running' | 'done'
type RunsAccountSubAgentMatrixShellPhase = 'running' | 'done'

const DEFAULT_MATRIX_RUNNING_MS = 3000

function RunsAccountSubAgentMatrixGroup({
  group,
  index,
  phase,
  getTaskPhase,
}: {
  group: RunsAccountSubAgentTask
  index: number
  phase: RunsAccountSubAgentGroupPhase
  getTaskPhase?: (groupId: string, taskIndex: number) => RunsAccountSubAgentGroupPhase
}) {
  const [open, setOpen] = useState(false)
  const taskCount = group.tasks.length
  const isRunning = phase === 'running'
  const isPending = phase === 'pending'

  return (
    <li
      className={`runs-account-subagent-matrix-group${
        open ? ' runs-account-subagent-matrix-group--open' : ' runs-account-subagent-matrix-group--collapsed'
      } runs-account-subagent-matrix-group--${isPending ? 'running' : phase === 'done' ? 'done' : 'running'}`}
    >
      <button
        type="button"
        className="runs-account-subagent-matrix-group-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="runs-account-subagent-matrix-group-index">{`#${index + 1}`}</span>
        <span className="runs-account-subagent-matrix-group-title">{group.title}</span>
        <span
          className={`runs-account-subagent-matrix-group-agent runs-account-subagent-matrix-group-agent--${
            isPending ? 'running' : phase === 'done' ? 'done' : 'running'
          }`}
        >
          {isRunning || isPending ? (
            <span className="runs-account-subagent-matrix-group-agent-spinner" aria-hidden="true" />
          ) : (
            <span className="runs-account-subagent-matrix-group-agent-icon" aria-hidden="true">
              ◇
            </span>
          )}
          <span className="runs-account-subagent-matrix-group-agent-name">{group.subAgent.name}</span>
          <span
            className={`runs-account-subagent-matrix-group-agent-status runs-account-subagent-matrix-group-agent-status--${
              isPending ? 'running' : phase === 'done' ? 'done' : 'running'
            }`}
          >
            {isPending ? (
              <>等待中</>
            ) : isRunning ? (
              <>
                <span className="runs-agent-post-exec-review-head-status-spin" aria-hidden="true" />
                运行中
              </>
            ) : (
              <>
                <span className="runs-agent-post-exec-review-head-status-icon-check" aria-hidden="true">
                  ✓
                </span>
                已完成
              </>
            )}
          </span>
        </span>
        <span className="runs-account-subagent-matrix-group-count" aria-hidden="true">
          {taskCount} 个子任务
        </span>
        <span
          className={`runs-account-subagent-matrix-group-chev${open ? ' runs-account-subagent-matrix-group-chev--open' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <ol className="runs-account-subagent-matrix-tasks">
          {group.tasks.map((task, taskIndex) => {
            const taskPhase = getTaskPhase?.(group.id, taskIndex) ?? (phase === 'done' ? 'done' : phase)
            const taskRunning = taskPhase === 'running'
            const taskPending = taskPhase === 'pending'
            const shellPhase = taskPending || taskRunning ? 'running' : 'done'
            return (
              <li
                key={task.label}
                className={`runs-account-subagent-matrix-task runs-account-subagent-matrix-task--${shellPhase}`}
              >
                {taskRunning || taskPending ? (
                  <span className="runs-account-subagent-matrix-task-spinner" aria-hidden="true" />
                ) : (
                  <span className="runs-account-subagent-matrix-task-icon" aria-hidden="true">
                    ✓
                  </span>
                )}
                <span className="runs-account-subagent-matrix-task-body">
                  <span className="runs-account-subagent-matrix-task-label">{task.label}</span>
                  {task.detail ? (
                    <span className="runs-account-subagent-matrix-task-detail">
                      {taskRunning ? '运行中…' : taskPending ? '等待前序步骤…' : task.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ol>
      ) : null}
    </li>
  )
}

export function RunsAgentSubAgentMatrix({
  groups,
  mode = 'timed',
  runningMs = DEFAULT_MATRIX_RUNNING_MS,
  onAllDone,
  matrixPhase: matrixPhaseProp,
  groupPhases,
  getTaskPhase,
  leadRunning,
  leadDone,
}: {
  groups: readonly RunsAccountSubAgentTask[]
  mode?: 'timed' | 'controlled'
  runningMs?: number
  onAllDone?: () => void
  matrixPhase?: RunsAccountSubAgentMatrixShellPhase
  groupPhases?: Record<string, RunsAccountSubAgentGroupPhase>
  getTaskPhase?: (groupId: string, taskIndex: number) => RunsAccountSubAgentGroupPhase
  leadRunning?: ReactNode
  leadDone?: ReactNode
}) {
  const [timedPhase, setTimedPhase] = useState<RunsAccountSubAgentMatrixShellPhase>('running')
  const onAllDoneRef = useRef(onAllDone)
  onAllDoneRef.current = onAllDone

  useEffect(() => {
    if (mode !== 'timed') return
    if (timedPhase === 'done') return
    const timer = window.setTimeout(() => {
      setTimedPhase('done')
      onAllDoneRef.current?.()
    }, runningMs)
    return () => window.clearTimeout(timer)
  }, [mode, runningMs, timedPhase])

  const matrixPhase = mode === 'controlled' ? (matrixPhaseProp ?? 'running') : timedPhase
  const groupCount = groups.length

  const defaultLeadRunning =
    leadRunning ??
    (mode === 'timed' ? (
      <>
        本棒 <strong>{groupCount} 个子代理</strong>正在并行运行（约 {runningMs / 1000} 秒）……
      </>
    ) : (
      <>
        本棒 <strong>{groupCount} 个子代理</strong>正在并行运行……
      </>
    ))

  const defaultLeadDone =
    leadDone ?? (
      <>
        本棒 <strong>{groupCount} 个子代理</strong>已并行完成所有子任务，点开任一标题可查看明细。
      </>
    )

  return (
    <div className={`runs-account-subagent-matrix runs-account-subagent-matrix--${matrixPhase}`}>
      <p className="runs-account-subagent-matrix-lead">{matrixPhase === 'running' ? defaultLeadRunning : defaultLeadDone}</p>
      <ul className="runs-account-subagent-matrix-list">
        {groups.map((group, index) => (
          <RunsAccountSubAgentMatrixGroup
            key={group.id}
            group={group}
            index={index}
            phase={groupPhases?.[group.id] ?? (matrixPhase === 'done' ? 'done' : 'running')}
            getTaskPhase={getTaskPhase}
          />
        ))}
      </ul>
    </div>
  )
}
