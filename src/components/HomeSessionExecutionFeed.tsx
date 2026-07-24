import { useId, useState } from 'react'

/** `fault`：部分 Agent 执行故障 / 子任务失败（如高级研发入职流程异常） */
export type SessionExecutionVariant = 'complete' | 'partial' | 'fault'

export type SessionExecTriggerSummaryKind = 'scheduled' | 'chat' | 'form'

/** 会话工作流主区：定时触发演示默认值（与产品稿一致） */
const SESSION_EXEC_DEFAULT_SCHEDULED_LOCAL = '2026-05-16T14:00'

function formatSessionExecScheduleZh(localValue: string): string {
  const d = new Date(localValue)
  if (Number.isNaN(d.getTime())) return localValue || '（未设置）'
  return d.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
}

type ItemStatus = 'complete' | 'warning' | 'error'

/** 与 `ScenarioConfigPage` 中 `RunsAgentKind` / `RunsAgentAvatar` 对齐（会话轨迹不含 joyce）。 */
type SessionExecAgentKind = 'start' | 'collect' | 'account' | 'training' | 'master'

type ReviewStage = {
  id: string
  agentKind: SessionExecAgentKind
  agentName: string
  reviewerName: string
  status: ItemStatus
  tasks: readonly { text: string; status: ItemStatus }[]
}

/** s7 初级运维入职 · IT 资产与权限预采集任务 */
const S7_OPS_COLLECT_TASKS: ReviewStage['tasks'] = [
  { text: '录入工号、部门与到岗日期并关联入职工单', status: 'complete' },
  { text: '确认终端设备型号与办公资产领用清单', status: 'warning' },
  { text: '登记堡垒机、VPN 与监控平台访问申请', status: 'warning' },
  { text: '同步 on-call 值班日历与应急联系人', status: 'complete' },
]

/** s4 跨部门立项 · 欢迎助手 Agent 审阅任务（与产品稿一致） */
const S4_WELCOME_ASSISTANT_TASKS: ReviewStage['tasks'] = [
  { text: '识别新入职员工：接入 HRIS / 入职工单并标记待发欢迎邮件的候选人', status: 'complete' },
  { text: '自动发送欢迎邮件：入职确认后按已审批模板投递至员工个人邮箱', status: 'warning' },
  { text: '邮件内容管理：确保模板变量、合规声明与首日议程链接完整可用', status: 'warning' },
  { text: '流程跟踪与反馈：记录送达、打开与退信状态并回写入职追踪表', status: 'complete' },
]

type AccountTask = {
  readonly label: string
  readonly detail?: string
  readonly status?: ItemStatus
}

/** 与 `ScenarioConfigPage` 中 `RunsAccountSubAgentTask` / `buildRunsAccountSubAgentMatrix` 一致；`partial` 时可含未完成子任务。 */
type AccountGroup = {
  readonly id: string
  readonly title: string
  readonly subAgent: { readonly name: string; readonly tag: string }
  readonly groupStatus: ItemStatus
  readonly tasks: readonly AccountTask[]
}

/** 表单触发：触发摘要下方员工信息展示（禁用演示） */
function SessionExecFormTriggerEmployeeFields({
  name = 'YS',
  empNo = '1204105215',
  jobTitle = '高级研发工程师',
}: {
  name?: string
  empNo?: string
  jobTitle?: string
} = {}) {
  const uid = useId()
  const nameId = `${uid}-form-name`
  const empNoId = `${uid}-form-emp-no`
  const jobTitleId = `${uid}-form-job-title`
  return (
    <section className="manus-session-exec-form-kickoff-fields" aria-label="表单关联员工信息">
      <div className="manus-session-exec-form-kickoff-fields-inner">
        <div className="manus-session-exec-form-kickoff-row manus-session-exec-form-kickoff-row--split">
          <div className="manus-session-exec-form-kickoff-field">
            <label htmlFor={nameId}>姓名</label>
            <input
              id={nameId}
              type="text"
              disabled
              className="manus-session-exec-form-kickoff-input"
              defaultValue={name}
            />
          </div>
          <div className="manus-session-exec-form-kickoff-field">
            <label htmlFor={empNoId}>工号</label>
            <input
              id={empNoId}
              type="text"
              disabled
              className="manus-session-exec-form-kickoff-input"
              defaultValue={empNo}
            />
          </div>
        </div>
        <div className="manus-session-exec-form-kickoff-field manus-session-exec-form-kickoff-field--full">
          <label htmlFor={jobTitleId}>职位</label>
          <input
            id={jobTitleId}
            type="text"
            disabled
            className="manus-session-exec-form-kickoff-input"
            defaultValue={jobTitle}
          />
        </div>
      </div>
    </section>
  )
}

/** s5 身份验证 · 信息收集 Agent：人工输入超时后的补填表单（中文） */
function SessionExecIdentityCollectInputPanel() {
  const uid = useId()
  const idPhotoId = `${uid}-id-photo`
  const bankId = `${uid}-bank`
  return (
    <div className="manus-session-exec-collect-input-panel">
      <div className="manus-session-exec-collect-input-alert" role="alert">
        <span className="manus-session-exec-collect-input-alert-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
            <path
              d="M12 3 4 6v6c0 4.2 2.8 7.6 8 9 5.2-1.4 8-4.8 8-9V6l-8-3Z"
              fill="currentColor"
              opacity="0.22"
            />
            <path
              d="M12 7.5v5M12 15.2h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div className="manus-session-exec-collect-input-alert-text">
          <strong className="manus-session-exec-collect-input-alert-title">输入步骤失败</strong>
          <p className="manus-session-exec-collect-input-alert-desc">人工输入超时 - 2天内未收到响应</p>
        </div>
      </div>

      <div className="manus-session-exec-collect-input-fields">
        <div className="manus-session-exec-collect-input-field manus-session-exec-collect-input-field--disabled">
          <label htmlFor={idPhotoId}>
            身份证照片 <span className="manus-session-exec-collect-input-required">*</span>
          </label>
          <div
            id={idPhotoId}
            className="manus-session-exec-collect-input-upload manus-session-exec-collect-input-upload--disabled"
            role="group"
            aria-label="上传身份证照片"
            aria-disabled="true"
          >
            <span className="manus-session-exec-collect-input-upload-hint">点击或拖拽文件到此处上传</span>
          </div>
        </div>

        <div className="manus-session-exec-collect-input-field manus-session-exec-collect-input-field--disabled">
          <label htmlFor={bankId}>
            银行账户详情 <span className="manus-session-exec-collect-input-required">*</span>
          </label>
          <input
            id={bankId}
            type="text"
            className="manus-session-exec-collect-input-text"
            placeholder="在此输入内容..."
            autoComplete="off"
            disabled
          />
        </div>
      </div>

      <button type="button" className="manus-session-exec-collect-input-continue" disabled aria-disabled="true">
        继续
        <span className="manus-session-exec-collect-input-continue-arrow" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  )
}

/** Gmail 官方四色徽标（与 ScenarioConfig 画布节点一致） */
function SessionExecGmailLogoIcon() {
  return (
    <svg viewBox="52 42 88 66" width="20" height="16" aria-hidden="true" focusable="false">
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  )
}

/** s4 跨部门立项 · 欢迎邮件 Agent：工具区（邮件插件配置异常） */
function SessionExecS4WelcomeEmailToolsBlock() {
  return (
    <section className="manus-session-exec-tool-section" aria-label="工具">
      <h4 className="manus-session-exec-tool-section-title">工具</h4>
      <div className="manus-session-exec-tool-section-body">
        <div className="manus-session-exec-collect-input-alert" role="alert">
          <span className="manus-session-exec-collect-input-alert-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
              <path
                d="M12 3 4 6v6c0 4.2 2.8 7.6 8 9 5.2-1.4 8-4.8 8-9V6l-8-3Z"
                fill="currentColor"
                opacity="0.22"
              />
              <path
                d="M12 7.5v5M12 15.2h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="manus-session-exec-collect-input-alert-text">
            <strong className="manus-session-exec-collect-input-alert-title">邮件配置错误</strong>
            <p className="manus-session-exec-collect-input-alert-desc">
              发件域名未完成验证，或 Gmail 发信凭据已失效。请在场景工作区重新连接邮件插件后再重试自动发送。
            </p>
          </div>
        </div>
        <div className="manus-session-exec-tool-plugin manus-session-exec-tool-plugin--error" role="status">
          <span className="manus-session-exec-tool-plugin-ic manus-session-exec-tool-plugin-ic--gmail" aria-hidden="true">
            <SessionExecGmailLogoIcon />
          </span>
          <div className="manus-session-exec-tool-plugin-text">
            <span className="manus-session-exec-tool-plugin-name">Gmail</span>
            <span className="manus-session-exec-tool-plugin-sub">Send Email · 配置异常</span>
          </div>
          <span className="manus-session-exec-tool-plugin-badge">需处理</span>
        </div>
      </div>
    </section>
  )
}

function SessionExecFormTriggerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <rect
        x="5"
        y="3.5"
        width="10.5"
        height="13.5"
        rx="1.75"
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.35"
      />
      <path
        d="M7.25 8.25h6.2M7.25 11h4.2M7.25 13.75h5.2"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <path
        d="M13.2 15.1 18.2 10.1"
        fill="none"
        stroke="#dc2626"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="m17.6 9.5 1.35 1.35-1.1 1.1-1.35-1.35z"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="0.35"
      />
      <path d="M12.4 16.1 14 14.5" fill="none" stroke="#fecaca" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function SessionExecRobotIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
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
      <rect x="5" y="7" width="14" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="12" r="1.25" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1.25" fill="currentColor" />
      <path d="M10 16h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function SessionExecStatusPill({ status }: { status: ItemStatus }) {
  if (status === 'complete') {
    return (
      <span className="runs-agent-post-exec-review-head-status runs-agent-post-exec-review-head-status--done">
        <span className="runs-agent-post-exec-review-head-status-icon-check" aria-hidden="true">
          ✓
        </span>
        已完成
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="manus-session-exec-status-pill manus-session-exec-status-pill--error">
        <span className="manus-session-exec-status-pill-icon manus-session-exec-status-pill-icon--error" aria-hidden="true">
          ×
        </span>
        故障
      </span>
    )
  }
  return (
    <span className="manus-session-exec-status-pill manus-session-exec-status-pill--warning">
      <span className="manus-session-exec-status-pill-icon" aria-hidden="true">
        !
      </span>
      未完成
    </span>
  )
}

function SessionExecTaskIcon({ status }: { status: ItemStatus }) {
  if (status === 'complete') {
    return <span className="runs-agent-post-exec-review-icon-check">✓</span>
  }
  if (status === 'error') {
    return <span className="manus-session-exec-task-icon manus-session-exec-task-icon--error">×</span>
  }
  return <span className="manus-session-exec-task-icon manus-session-exec-task-icon--warning">!</span>
}

function SessionExecReviewBlock({ stage }: { stage: ReviewStage }) {
  return (
    <div className="runs-agent-post-exec-review runs-agent-post-exec-review--done" aria-label={stage.reviewerName}>
      <div className="runs-agent-post-exec-review-head">
        <span className="runs-agent-post-exec-review-head-avatar" aria-hidden="true">
          <SessionExecRobotIcon size={18} />
        </span>
        <span className="runs-agent-post-exec-review-head-name">{stage.reviewerName}</span>
        <SessionExecStatusPill status={stage.status} />
      </div>
      <div className="runs-agent-post-exec-review-list">
        {stage.tasks.map((task) => (
          <div key={task.text} className="runs-agent-post-exec-review-row">
            <span className="runs-agent-post-exec-review-icon" aria-hidden="true">
              <SessionExecTaskIcon status={task.status} />
            </span>
            <span className="runs-agent-post-exec-review-text">{task.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 与 `RunsAccountTeamIcon`（ScenarioConfigPage）同形，供账户步骤头像使用。 */
function SessionExecAccountTeamIcon({
  className,
  width = 22,
  height = 22,
}: {
  className?: string
  width?: number
  height?: number
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 19c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13 18.6c.5-2 2.5-3.4 5-3.4s4.5 1.4 5 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** DOM / class 与 `RunsAgentAvatar` 一致；`size="sm"` 用于执行卡标题行。 */
function SessionExecRunsAgentAvatar({ kind, size = 'md' }: { kind: SessionExecAgentKind; size?: 'sm' | 'md' }) {
  const sm = size === 'sm' ? ' scenario-workspace-runs-agent-avatar--sm' : ''
  const svgSize = size === 'sm' ? 18 : 22
  return (
    <span
      className={`scenario-workspace-runs-agent-avatar scenario-workspace-runs-agent-avatar--${kind}${sm} scenario-workspace-runs-agent-avatar--workspace`}
      aria-hidden="true"
    >
      {kind === 'account' ? (
        <SessionExecAccountTeamIcon className="scenario-workflow-card-icon-svg" width={svgSize} height={svgSize} />
      ) : (
        <SessionExecRobotIcon className="scenario-workflow-card-icon-svg" size={svgSize} />
      )}
    </span>
  )
}

function SessionExecStepFoldChevron() {
  return (
    <span className="manus-session-exec-step-fold-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
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
  )
}

function SessionExecStepHeader({
  agentKind,
  agentName,
  status,
}: {
  agentKind: SessionExecAgentKind
  agentName: string
  status: ItemStatus
}) {
  return (
    <summary
      className="scenario-workspace-runs-run-step-summary manus-session-exec-step-summary"
      aria-label={`${agentName}，点击折叠或展开`}
    >
      <span className="scenario-workspace-runs-run-step-avatar">
        <SessionExecRunsAgentAvatar kind={agentKind} />
        {status === 'complete' ? (
          <span className="scenario-workspace-runs-run-step-check" aria-hidden="true">
            ✓
          </span>
        ) : status === 'error' ? (
          <span className="manus-session-exec-step-check manus-session-exec-step-check--error" aria-hidden="true">
            ×
          </span>
        ) : (
          <span className="manus-session-exec-step-check manus-session-exec-step-check--warning" aria-hidden="true">
            !
          </span>
        )}
      </span>
      <span className="scenario-workspace-runs-run-step-meta">
        <span className="scenario-workspace-runs-run-step-name">{agentName}</span>
        <span className="manus-session-exec-step-meta-trailing">
          <SessionExecStepFoldChevron />
        </span>
      </span>
    </summary>
  )
}

function SessionExecAccountMatrixShell({
  accountGroups,
  variant,
}: {
  accountGroups: readonly AccountGroup[]
  variant: SessionExecutionVariant
}) {
  /** 与 Runs 矩阵卡一致：默认展开正文 */
  const [expanded, setExpanded] = useState(true)
  const partial = variant === 'partial'
  const fault = variant === 'fault'
  return (
    <div
      className={`scenario-workspace-runs-run-card scenario-workspace-runs-run-card--collapsible${
        expanded ? '' : ' scenario-workspace-runs-run-card--collapsed'
      }`}
    >
      <button
        type="button"
        className="scenario-workspace-runs-run-card-cap scenario-workspace-runs-run-card-cap--button"
        aria-expanded={expanded}
        aria-label={expanded ? '折叠子代理协同矩阵' : '展开子代理协同矩阵'}
        onClick={() => setExpanded((e) => !e)}
      >
        <SessionExecRunsAgentAvatar kind="account" size="sm" />
        <div className="scenario-workspace-runs-run-card-cap-text">
          <strong>账户设置 Agent</strong>
          <span className="scenario-workspace-runs-run-card-cap-muted"> 子代理协同矩阵 · 4 大任务</span>
        </div>
        <span
          className={`scenario-workspace-runs-run-card-cap-chev${
            expanded ? '' : ' scenario-workspace-runs-run-card-cap-chev--collapsed'
          }`}
          aria-hidden="true"
        />
      </button>
      {expanded ? (
        <div className="scenario-workspace-runs-run-card-body">
          <div
            className={`runs-account-subagent-matrix runs-account-subagent-matrix--done${
              fault ? ' runs-account-subagent-matrix--session-fault' : partial ? ' runs-account-subagent-matrix--session-partial' : ''
            }`}
          >
            <p className="runs-account-subagent-matrix-lead">
              {fault ? (
                <>
                  当前 <strong>4 个子代理</strong>中部分执行<strong>故障</strong>（接口超时、权限工单被拒等），请优先处理标红分组后再重试下游步骤。
                </>
              ) : partial ? (
                <>
                  当前 <strong>4 个子代理</strong>中部分仍有未完成子任务（权限、凭证等），展开对应分组可查看告警项。
                </>
              ) : (
                <>
                  本棒 <strong>4 个子代理</strong>已并行完成所有子任务，点开任一标题可查看明细。
                </>
              )}
            </p>
            <ul className="runs-account-subagent-matrix-list">
              {accountGroups.map((group, index) => (
                <SessionExecAccountGroup key={group.id} group={group} index={index} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SessionExecAccountGroup({ group, index }: { group: AccountGroup; index: number }) {
  const [open, setOpen] = useState(group.groupStatus !== 'complete')
  const taskCount = group.tasks.length
  const groupDone = group.groupStatus === 'complete'
  const groupErr = group.groupStatus === 'error'
  const groupWarn = group.groupStatus === 'warning'
  const groupIssueClass = groupDone
    ? ''
    : groupErr
      ? ' runs-account-subagent-matrix-group--session-error'
      : groupWarn
        ? ' runs-account-subagent-matrix-group--session-warn'
        : ''
  return (
    <li
      className={`runs-account-subagent-matrix-group${
        open ? ' runs-account-subagent-matrix-group--open' : ' runs-account-subagent-matrix-group--collapsed'
      } runs-account-subagent-matrix-group--done${groupIssueClass}`}
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
          className={`runs-account-subagent-matrix-group-agent runs-account-subagent-matrix-group-agent--done${
            groupDone ? '' : groupErr ? ' runs-account-subagent-matrix-group-agent--session-error' : ' runs-account-subagent-matrix-group-agent--session-warn'
          }`}
        >
          <span className="runs-account-subagent-matrix-group-agent-icon" aria-hidden="true">
            ◇
          </span>
          <span className="runs-account-subagent-matrix-group-agent-name">{group.subAgent.name}</span>
          {groupDone ? (
            <span className="runs-account-subagent-matrix-group-agent-status runs-account-subagent-matrix-group-agent-status--done">
              <span className="runs-agent-post-exec-review-head-status-icon-check" aria-hidden="true">
                ✓
              </span>
              已完成
            </span>
          ) : (
            <span
              className={`runs-account-subagent-matrix-group-agent-status${
                groupErr
                  ? ' runs-account-subagent-matrix-group-agent-status--session-error'
                  : ' runs-account-subagent-matrix-group-agent-status--session-warn'
              }`}
            >
              <SessionExecStatusPill status={groupErr ? 'error' : 'warning'} />
            </span>
          )}
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
          {group.tasks.map((t) => {
            const ts: ItemStatus = t.status ?? 'complete'
            const taskOk = ts === 'complete'
            const taskErr = ts === 'error'
            const taskIssueClass = taskOk ? '' : taskErr ? ' runs-account-subagent-matrix-task--session-error' : ' runs-account-subagent-matrix-task--session-warn'
            return (
              <li
                key={t.label}
                className={`runs-account-subagent-matrix-task runs-account-subagent-matrix-task--done${taskIssueClass}`}
              >
                <span className="runs-account-subagent-matrix-task-icon" aria-hidden="true">
                  {taskOk ? '✓' : taskErr ? '×' : '!'}
                </span>
                <span className="runs-account-subagent-matrix-task-body">
                  <span className="runs-account-subagent-matrix-task-label">{t.label}</span>
                  {t.detail ? (
                    <span className="runs-account-subagent-matrix-task-detail">{t.detail}</span>
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

function SessionExecApprovalCapFold() {
  return (
    <span className="manus-session-exec-approval-cap-fold-ic" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
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
  )
}

function SessionExecApprovalCard({ approved }: { approved: boolean }) {
  /** 已通过默认展开；待审批默认收起，可展开查看申请摘要与队列说明 */
  const [detailOpen, setDetailOpen] = useState(approved)

  if (!approved) {
    return (
      <div
        className={`runs-user-config-approval-card runs-user-config-approval-card--pending${
          detailOpen ? '' : ' manus-session-exec-approval-card--collapsed'
        }`}
      >
        <div className="runs-user-config-approval-cap">
          <span className="runs-user-config-approval-cap-icon" aria-hidden="true">
            ⌛
          </span>
          <div className="runs-user-config-approval-cap-text">
            <strong>账户配置 · 等待上级审批</strong>
            <span className="runs-user-config-approval-cap-muted"> 来自 账户设置 Agent · 需上级审批</span>
          </div>
          <span className="runs-user-config-approval-badge runs-user-config-approval-badge--pending">待审批</span>
          <button
            type="button"
            className={`manus-session-exec-approval-cap-fold${detailOpen ? '' : ' manus-session-exec-approval-cap-fold--collapsed'}`}
            aria-expanded={detailOpen}
            aria-label={detailOpen ? '折叠待审批详情' : '展开待审批详情'}
            onClick={() => setDetailOpen((o) => !o)}
          >
            <SessionExecApprovalCapFold />
          </button>
        </div>
        {detailOpen ? (
          <div className="runs-user-config-approval-body">
            <div className="runs-user-config-approval-meta">
              <div className="runs-user-config-approval-meta-row">
                <span className="runs-user-config-approval-meta-k">审批人</span>
                <span className="runs-user-config-approval-meta-v">
                  林经理 · <code>lin.manager@company.com</code>（未答复）
                </span>
              </div>
              <div className="runs-user-config-approval-meta-row">
                <span className="runs-user-config-approval-meta-k">邮件主题</span>
                <span className="runs-user-config-approval-meta-v">【审批】新员工账户与设备配置申请 — 待入职员工</span>
              </div>
              <div className="runs-user-config-approval-meta-row">
                <span className="runs-user-config-approval-meta-k">申请时间</span>
                <span className="runs-user-config-approval-meta-v">2026/5/10 10:02:18</span>
              </div>
              <div className="runs-user-config-approval-meta-row">
                <span className="runs-user-config-approval-meta-k">审批时间</span>
                <span className="runs-user-config-approval-meta-v">—</span>
              </div>
            </div>
            <p className="runs-user-config-approval-section-title">申请内容（账号配置摘要）</p>
            <ul className="runs-user-config-approval-summary">
              <li>
                <span className="runs-user-config-approval-summary-k">业务账号</span>
                <span className="runs-user-config-approval-summary-v">企业邮箱 / VPN / 协作套件</span>
              </li>
              <li>
                <span className="runs-user-config-approval-summary-k">权限组</span>
                <span className="runs-user-config-approval-summary-v">设计团队 · Figma Editor</span>
              </li>
              <li>
                <span className="runs-user-config-approval-summary-k">硬件</span>
                <span className="runs-user-config-approval-summary-v">MacBook Pro 14&quot; · 显示器</span>
              </li>
              <li>
                <span className="runs-user-config-approval-summary-k">协作工具</span>
                <span className="runs-user-config-approval-summary-v">Slack · Notion · VPN 工单 NET-7782</span>
              </li>
            </ul>
            <div className="runs-user-config-approval-status runs-user-config-approval-status--pending" aria-live="polite">
              <span className="runs-user-config-approval-spinner" aria-hidden="true" />
              <span>
                审批邮件已投递；在收到上级批复前，<strong>账户开通</strong>与<strong>培训排期</strong>将保持在队列中，不会写入已完成状态。
              </span>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`runs-user-config-approval-card runs-user-config-approval-card--approved${
        detailOpen ? '' : ' manus-session-exec-approval-card--collapsed'
      }`}
    >
      <div className="runs-user-config-approval-cap">
        <span className="runs-user-config-approval-cap-icon" aria-hidden="true">
          ✓
        </span>
        <div className="runs-user-config-approval-cap-text">
          <strong>账户配置 · 审批已通过</strong>
          <span className="runs-user-config-approval-cap-muted"> 来自 账户设置 Agent · 需上级审批</span>
        </div>
        <span className="runs-user-config-approval-badge runs-user-config-approval-badge--approved">已通过</span>
        <button
          type="button"
          className={`manus-session-exec-approval-cap-fold${detailOpen ? '' : ' manus-session-exec-approval-cap-fold--collapsed'}`}
          aria-expanded={detailOpen}
          aria-label={detailOpen ? '折叠审批详情' : '展开审批详情'}
          onClick={() => setDetailOpen((o) => !o)}
        >
          <SessionExecApprovalCapFold />
        </button>
      </div>
      {detailOpen ? (
      <div className="runs-user-config-approval-body">
        <div className="runs-user-config-approval-meta">
          <div className="runs-user-config-approval-meta-row">
            <span className="runs-user-config-approval-meta-k">审批人</span>
            <span className="runs-user-config-approval-meta-v">
              林经理 · <code>lin.manager@company.com</code>
            </span>
          </div>
          <div className="runs-user-config-approval-meta-row">
            <span className="runs-user-config-approval-meta-k">邮件主题</span>
            <span className="runs-user-config-approval-meta-v">【审批】新员工账户与设备配置申请 — Jinny</span>
          </div>
          <div className="runs-user-config-approval-meta-row">
            <span className="runs-user-config-approval-meta-k">申请时间</span>
            <span className="runs-user-config-approval-meta-v">2026/5/10 10:02:18</span>
          </div>
          <div className="runs-user-config-approval-meta-row">
            <span className="runs-user-config-approval-meta-k">审批时间</span>
            <span className="runs-user-config-approval-meta-v">2026/5/10 10:18:44</span>
          </div>
        </div>
        <p className="runs-user-config-approval-section-title">申请内容（账号配置摘要）</p>
        <ul className="runs-user-config-approval-summary">
          <li>
            <span className="runs-user-config-approval-summary-k">业务账号</span>
            <span className="runs-user-config-approval-summary-v">企业邮箱 / VPN / 协作套件</span>
          </li>
          <li>
            <span className="runs-user-config-approval-summary-k">权限组</span>
            <span className="runs-user-config-approval-summary-v">设计团队 · Figma Editor</span>
          </li>
          <li>
            <span className="runs-user-config-approval-summary-k">硬件</span>
            <span className="runs-user-config-approval-summary-v">MacBook Pro 14&quot; · 显示器</span>
          </li>
          <li>
            <span className="runs-user-config-approval-summary-k">协作工具</span>
            <span className="runs-user-config-approval-summary-v">Slack · Notion · VPN 工单 NET-7782</span>
          </li>
        </ul>
        <div className="runs-user-config-approval-status runs-user-config-approval-status--approved" aria-live="polite">
          <span className="runs-user-config-approval-check" aria-hidden="true">
            ✓
          </span>
          <span>
            上级已批准本次配置；正在交接给 <strong>培训协调 Agent</strong> 继续推进。
          </span>
        </div>
      </div>
      ) : null}
    </div>
  )
}

function buildStages(variant: SessionExecutionVariant): ReviewStage[] {
  if (variant === 'fault') {
    return [
      {
        id: 'start',
        agentKind: 'start',
        agentName: '入职启动 Agent',
        reviewerName: '入职流程监控 Agent',
        status: 'complete',
        tasks: [
          { text: '校验入职工单创建状态', status: 'complete' },
          { text: '复核候选人主数据来源与版本', status: 'complete' },
          { text: '确认 collect → account → training → master 处理链已绑定', status: 'complete' },
          { text: '检查协作方通知投递记录', status: 'complete' },
        ],
      },
      {
        id: 'collect',
        agentKind: 'collect',
        agentName: '信息收集 Agent',
        reviewerName: '入职材料核验 Agent',
        status: 'error',
        tasks: [
          { text: '核验员工上传各基础信息字段', status: 'complete' },
          {
            text: '对照高级研发入职材料 Schema 做完整性检查',
            status: 'error',
          },
          {
            text: 'OCR 证明材料与签字页落档',
            status: 'error',
          },
          { text: '生成评估材料包并通知 HRBP', status: 'complete' },
        ],
      },
      {
        id: 'manual',
        agentKind: 'master',
        agentName: '人工核验 Agent',
        reviewerName: '合规复核 Agent',
        status: 'warning',
        tasks: [
          { text: '人工抽检证件与合同签署件', status: 'warning' },
          { text: '核对岗位职级与权限模板匹配', status: 'complete' },
          { text: '记录例外项并回写工单备注', status: 'complete' },
        ],
      },
      {
        id: 'training',
        agentKind: 'training',
        agentName: '培训教育 Agent',
        reviewerName: '培训排期 Agent',
        status: 'error',
        tasks: [
          {
            text: '按岗位映射必修与试用期辅导课',
            status: 'error',
          },
          { text: '为导师与直线经理生成待办', status: 'complete' },
          { text: '与会议工具联动排期并避免冲突', status: 'warning' },
        ],
      },
      {
        id: 'master',
        agentKind: 'master',
        agentName: '入职监控 Agent',
        reviewerName: '流程收尾 Agent',
        status: 'error',
        tasks: [
          {
            text: '汇总各阶段完成度与异常工单',
            status: 'error',
          },
          { text: '向干系人发送闭环通知', status: 'warning' },
          { text: '更新工单状态为已完成并归档摘要', status: 'error' },
        ],
      },
    ]
  }

  const partial = variant === 'partial'
  return [
    {
      id: 'start',
      agentKind: 'start',
      agentName: '入职启动 Agent',
      reviewerName: '入职流程监控 Agent',
      status: 'complete',
      tasks: [
        { text: '校验入职工单创建状态', status: 'complete' },
        { text: '复核候选人主数据来源与版本', status: 'complete' },
        { text: '确认 collect → account → training → master 处理链已绑定', status: 'complete' },
        { text: '检查协作方通知投递记录', status: 'complete' },
      ],
    },
    {
      id: 'collect',
      agentKind: 'collect',
      agentName: '信息收集 Agent',
      reviewerName: '入职材料核验 Agent',
      status: 'complete',
      tasks: [
        { text: '核验员工上传各基础信息字段', status: 'complete' },
        { text: '对照档案 Schema 做完整性检查与差异分析', status: 'complete' },
        { text: 'OCR 证件影像与边角完整性', status: 'complete' },
        { text: '生成结构化档案草稿并通知 HR Ops', status: 'complete' },
      ],
    },
    {
      id: 'manual',
      agentKind: 'master',
      agentName: '人工核验 Agent',
      reviewerName: '合规复核 Agent',
      status: partial ? 'warning' : 'complete',
      tasks: [
        { text: '人工抽检证件与合同签署件', status: partial ? 'warning' : 'complete' },
        { text: '核对岗位职级与权限模板匹配', status: 'complete' },
        { text: '记录例外项并回写工单备注', status: 'complete' },
      ],
    },
    {
      id: 'training',
      agentKind: 'training',
      agentName: '培训教育 Agent',
      reviewerName: '培训排期 Agent',
      status: partial ? 'warning' : 'complete',
      tasks: [
        { text: '按岗位映射必修与选修课程', status: 'complete' },
        { text: '为导师与直线经理生成待办', status: partial ? 'warning' : 'complete' },
        { text: '与会议工具联动排期并避免冲突', status: 'complete' },
      ],
    },
    {
      id: 'master',
      agentKind: 'master',
      agentName: '入职监控 Agent',
      reviewerName: '流程收尾 Agent',
      status: partial ? 'warning' : 'complete',
      tasks: [
        { text: '汇总各阶段完成度与异常工单', status: partial ? 'warning' : 'complete' },
        { text: '向干系人发送闭环通知', status: 'complete' },
        { text: '更新工单状态为已完成并归档摘要', status: 'complete' },
      ],
    },
  ]
}

function buildAccountGroups(
  variant: SessionExecutionVariant,
  scenarioRunId?: string | null,
): readonly AccountGroup[] {
  const base = [
    {
      id: 'account-creation',
      title: '系统账户创建',
      subAgent: { name: '系统账户 Agent', tag: 'account-creator' },
      groupStatus: 'complete' as ItemStatus,
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
      groupStatus: 'complete' as ItemStatus,
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
      groupStatus: 'complete' as ItemStatus,
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
      groupStatus: 'complete' as ItemStatus,
      tasks: [
        { label: '核对所有账户及权限设置是否完整、准确' },
        { label: '与部门或 HR 确认特殊权限需求' },
        { label: '标记账户设置完成状态，触发下一个流程（培训协调 Agent）' },
      ],
    },
  ] satisfies readonly AccountGroup[]

  if (variant === 'complete') {
    return base
  }

  if (variant === 'fault') {
    return [
      { ...base[0] },
      {
        ...base[1],
        groupStatus: 'error' as const,
        tasks: [
          { label: '根据岗位和部门分配系统权限', status: 'complete' as const },
          {
            label: '配置项目、文件夹、数据库等访问权限',
            status: 'error' as const,
            detail: 'ITSM 工单 PT-1103 被审批人驳回：缺少部门负责人签字',
          },
          { label: '校验权限是否匹配岗位要求，避免权限过高或不足', status: 'warning' as const },
        ],
      },
      {
        ...base[2],
        groupStatus: 'error' as const,
        tasks: [
          { label: '配置门禁卡或数字令牌', status: 'error' as const, detail: '门禁系统接口超时（>30s），写入失败' },
          { label: '测试员工是否可以正常访问办公区域和关键系统', status: 'error' as const, detail: 'SSO 回调 500，VPN 与邮箱无法联调' },
          { label: '更新凭证分配记录', status: 'complete' as const },
        ],
      },
      {
        ...base[3],
        groupStatus: 'warning' as const,
        tasks: [
          { label: '核对所有账户及权限设置是否完整、准确', status: 'warning' as const },
          { label: '与部门或 HR 确认特殊权限需求', status: 'complete' as const },
          {
            label: '标记账户设置完成状态，触发下一个流程（培训协调 Agent）',
            status: 'error' as const,
            detail: '上游存在故障子任务，阻断「账户设置已完成」状态写入',
          },
        ],
      },
    ]
  }

  if (scenarioRunId === 's7') {
    return [
      { ...base[0] },
      {
        ...base[1],
        groupStatus: 'warning' as const,
        tasks: [
          {
            label: '按运维岗位模板开通 Linux / 跳板机只读权限',
            status: 'warning' as const,
            detail: '模板变更待部门负责人审批',
          },
          { label: '配置日志、监控与告警平台值班或只读角色', status: 'complete' as const },
          { label: '校验权限是否匹配岗位要求，避免权限过高或不足', status: 'complete' as const },
        ],
      },
      {
        ...base[2],
        groupStatus: 'warning' as const,
        tasks: [
          {
            label: '发放 VPN 客户端凭据并完成 MFA 绑定',
            status: 'warning' as const,
            detail: 'MFA 设备序列号待员工扫码确认',
          },
          { label: '测试员工是否可以正常访问办公区域和关键系统', status: 'complete' as const },
          { label: '更新凭证分配记录', status: 'complete' as const },
        ],
      },
      {
        ...base[3],
        groupStatus: 'warning' as const,
        tasks: [
          { label: '核对所有账户及权限设置是否完整、准确', status: 'warning' as const },
          { label: '与部门或 HR 确认特殊权限需求', status: 'complete' as const },
          {
            label: '标记账户设置完成状态，触发下一个流程（培训协调 Agent）',
            status: 'warning' as const,
            detail: '堡垒机与 VPN 子任务未闭环，暂不写入「账户设置已完成」',
          },
        ],
      },
    ]
  }

  /** s6：前 3 个子代理分组已完成，第 4 组「审核与确认」保持警告态 */
  return [
    { ...base[0] },
    { ...base[1] },
    { ...base[2] },
    {
      ...base[3],
      groupStatus: 'warning' as const,
      tasks: [
        { label: '核对所有账户及权限设置是否完整、准确', status: 'complete' as const },
        { label: '与部门或 HR 确认特殊权限需求', status: 'complete' as const },
        {
          label: '标记账户设置完成状态，触发下一个流程（培训协调 Agent）',
          status: 'warning' as const,
          detail: '存在未闭环子任务，暂不写入「账户设置已完成」',
        },
      ],
    },
  ]
}

function isAccountMatrixFullyComplete(groups: readonly AccountGroup[]): boolean {
  return groups.every((g) => g.groupStatus === 'complete')
}

export function HomeSessionExecutionFeed({
  variant,
  showScheduledKickoffPanel = true,
  triggerSummaryKind = 'scheduled',
  workflowTitle,
  scenarioRunId,
}: {
  variant: SessionExecutionVariant
  /** 为 false 时不渲染定时计划配置卡（如 s1 新员工入职页仅保留摘要条与步骤） */
  showScheduledKickoffPanel?: boolean
  /** s1：聊天触发稿图；s3 / s5：表单触发稿图；其它：定时触发摘要 */
  triggerSummaryKind?: SessionExecTriggerSummaryKind
  /** 侧栏场景名称，用于 fault 轨迹 aria（如「身份验证」「高级研发入职工作流」） */
  workflowTitle?: string
  /** 侧栏 run id（如 s5 身份验证），用于场景专属展示规则 */
  scenarioRunId?: string | null
}) {
  const [scheduledLocal, setScheduledLocal] = useState(SESSION_EXEC_DEFAULT_SCHEDULED_LOCAL)
  const stages = buildStages(variant)
  const accountGroups = buildAccountGroups(variant, scenarioRunId)
  const startStage = stages[0]
  const collectStage =
    scenarioRunId === 's4'
      ? {
          ...stages[1],
          agentName: '欢迎邮件Agent',
          reviewerName: '欢迎助手Agent',
          status: 'warning',
          tasks: S4_WELCOME_ASSISTANT_TASKS,
        }
      : scenarioRunId === 's7'
        ? {
            ...stages[1],
            agentName: 'IT 资产与权限预采集 Agent',
            reviewerName: '运维入职协调 Agent',
            status: 'warning',
            tasks: S7_OPS_COLLECT_TASKS,
          }
        : stages[1]
  const manualStage = stages[2]
  const trainingStage = stages[3]
  const masterStage = stages[4]
  const chatTriggerSummary = triggerSummaryKind === 'chat'
  const formTriggerSummary = triggerSummaryKind === 'form'
  const accountFullyComplete =
    variant === 'complete' || isAccountMatrixFullyComplete(accountGroups)
  /** s6：账户 4 组未全完成前隐藏待审批卡与人工核验 / 培训 / 监控步骤 */
  const hideDownstreamStepsUntilAccountComplete = variant === 'partial' && !accountFullyComplete
  /** s3 / s4：隐藏待审批卡与人工核验 / 培训 / 监控（s3 仍展示账户矩阵；s4 另见 hideAccountAgent） */
  const hideAccountApprovalAndDownstreamAgents =
    scenarioRunId === 's3' || scenarioRunId === 's4'
  const showAccountApprovalCard =
    !hideDownstreamStepsUntilAccountComplete && !hideAccountApprovalAndDownstreamAgents
  const accountHeaderStatus: ItemStatus =
    variant === 'complete'
      ? 'complete'
      : variant === 'fault'
        ? 'error'
        : accountFullyComplete
          ? 'complete'
          : 'warning'
  /** s5 身份验证：展示人工输入补填面板，不展示默认审阅块与用户气泡；步骤头为警告色 */
  const showS5CollectInputPanel = scenarioRunId === 's5'
  /** s5：不展示账户设置及之后各 Agent 步骤 */
  const hideAccountAndDownstreamAgents = scenarioRunId === 's5'
  /** s4 跨部门立项：不展示账户设置 Agent（下游步骤仍按 s3/s4 规则隐藏） */
  const hideAccountAgent = scenarioRunId === 's4' || hideAccountAndDownstreamAgents
  /** s1 新员工入职：账户步骤默认折叠，审批卡置于账户步骤正文内（子级） */
  const isS1OnboardingCompleteWorkflow = scenarioRunId === 's1'
  /** s4 / s5 / s7：收集类步骤头为警告色 */
  const collectHeaderStatus: ItemStatus =
    scenarioRunId === 's5' || scenarioRunId === 's4' || scenarioRunId === 's7'
      ? 'warning'
      : collectStage.status
  const execFeedAria =
    variant === 'fault' || workflowTitle
      ? `${workflowTitle ?? '高级研发入职工作流'}执行轨迹`
      : '入职执行轨迹'

  return (
    <div className="manus-session-exec-feed" aria-label={execFeedAria}>
      <div
        className={`scenario-workspace-runs-trigger-summary${
          chatTriggerSummary ? ' manus-session-exec-trigger-summary--s1-chat' : ''
        }${formTriggerSummary ? ' manus-session-exec-trigger-summary--form' : ''}`}
        role="status"
        aria-live="polite"
        aria-label={formTriggerSummary ? '当前触发方式：表单触发' : '当前触发方式'}
      >
        <span className="scenario-workspace-runs-trigger-summary-label">当前触发</span>
        {formTriggerSummary ? (
          <div
            className="scenario-workspace-runs-trigger-summary-item scenario-workspace-runs-trigger-summary-item--active manus-session-exec-trigger-form-chip"
            role="presentation"
          >
            <span className="manus-session-exec-trigger-form-chip-ic" aria-hidden="true">
              <SessionExecFormTriggerIcon />
            </span>
            <span className="scenario-workspace-runs-trigger-summary-text">
              <span className="scenario-workspace-runs-trigger-summary-title">表单触发</span>
            </span>
          </div>
        ) : (
          <div className="scenario-workspace-runs-trigger-summary-item scenario-workspace-runs-trigger-summary-item--active">
            <span className="scenario-workspace-runs-trigger-summary-ic" aria-hidden="true">
              {chatTriggerSummary ? '💬' : '⏱'}
            </span>
            <span className="scenario-workspace-runs-trigger-summary-text">
              <span className="scenario-workspace-runs-trigger-summary-title">
                {chatTriggerSummary ? '聊天触发' : '定时触发'}
              </span>
            </span>
          </div>
        )}
      </div>

      {formTriggerSummary ? (
        <SessionExecFormTriggerEmployeeFields
          jobTitle={scenarioRunId === 's7' ? '初级运维工程师' : undefined}
        />
      ) : null}

      {showScheduledKickoffPanel ? (
        <section
          className="manus-session-exec-scheduled-trigger-panel scenario-workspace-runs-kickoff-aside"
          role="region"
          aria-label="定时触发计划"
        >
          <div className="scenario-workspace-runs-kickoff-stack scenario-workspace-runs-kickoff-aside-body">
            <p className="scenario-workspace-runs-kickoff-aside-hint">
              提示：可微调计划时间后确认，或点「立即触发」跳过等待（定时触发）。
            </p>
            <p className="scenario-workspace-runs-kickoff-aside-meta">
              当前计划：<strong>{formatSessionExecScheduleZh(scheduledLocal)}</strong>
            </p>
            <div className="scenario-workspace-runs-kickoff-field">
              <label htmlFor="home-session-exec-kickoff-scheduled">计划触发时间</label>
              <input
                id="home-session-exec-kickoff-scheduled"
                type="datetime-local"
                className="scenario-workspace-runs-input"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
              />
            </div>
            <div className="scenario-workspace-runs-kickoff-actions scenario-workspace-runs-kickoff-actions--row">
              <button type="button" className="scenario-workspace-runs-kickoff-aside-btn">
                按当前时间触发
              </button>
              <button type="button" className="scenario-workspace-runs-kickoff-aside-btn-secondary">
                立即触发
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <details className="scenario-workspace-runs-run-step manus-session-exec-step">
        <SessionExecStepHeader {...startStage} />
        <div className="manus-session-exec-step-body">
          <SessionExecReviewBlock stage={startStage} />
        </div>
      </details>

      {showS5CollectInputPanel ? (
        <details
          className="scenario-workspace-runs-run-step manus-session-exec-step manus-session-exec-step--collect-s5"
          open
        >
          <SessionExecStepHeader {...collectStage} status={collectHeaderStatus} />
          <div className="manus-session-exec-step-body">
            <SessionExecIdentityCollectInputPanel />
          </div>
        </details>
      ) : (
        <details
          className={[
            'scenario-workspace-runs-run-step',
            'manus-session-exec-step',
            scenarioRunId === 's4'
              ? 'manus-session-exec-step--s4-welcome'
              : scenarioRunId === 's7'
                ? 'manus-session-exec-step--s7-ops'
                : '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...(scenarioRunId === 's4' || scenarioRunId === 's7' ? { open: true } : {})}
        >
          <SessionExecStepHeader {...collectStage} status={collectHeaderStatus} />
          <div className="manus-session-exec-step-body">
            <SessionExecReviewBlock stage={collectStage} />
            {scenarioRunId === 's4' ? <SessionExecS4WelcomeEmailToolsBlock /> : null}
            {variant === 'fault' && scenarioRunId !== 's4' ? (
            <div className="manus-session-exec-user-bubble-wrap">
              <div className="scenario-workspace-runs-bubble scenario-workspace-runs-bubble--user">
                <p className="scenario-workspace-runs-bubble-text">
                  评估材料接口返回错误，部分子任务未落档；请按右侧「故障」项处理后重试。
                </p>
              </div>
            </div>
            ) : null}
          </div>
        </details>
      )}

      {hideAccountAgent ? null : (
        <div
          className={`manus-session-exec-account-step-group${
            isS1OnboardingCompleteWorkflow ? ' manus-session-exec-account-step-group--s1' : ''
          }`}
          role="group"
          aria-label="账户设置 Agent"
        >
          <details
            className="scenario-workspace-runs-run-step manus-session-exec-step manus-session-exec-step--account"
            {...(isS1OnboardingCompleteWorkflow ? {} : { open: true })}
          >
            <SessionExecStepHeader
              agentKind="account"
              agentName="账户设置 Agent"
              status={accountHeaderStatus}
            />
            <div className="manus-session-exec-step-body">
              <SessionExecAccountMatrixShell accountGroups={accountGroups} variant={variant} />
              {showAccountApprovalCard && isS1OnboardingCompleteWorkflow ? (
                <div className="manus-session-exec-account-approval-nested">
                  <SessionExecApprovalCard key={variant} approved={variant === 'complete'} />
                </div>
              ) : null}
            </div>
          </details>
          {showAccountApprovalCard && !isS1OnboardingCompleteWorkflow ? (
            <SessionExecApprovalCard key={variant} approved={variant === 'complete'} />
          ) : null}
        </div>
      )}

      {hideDownstreamStepsUntilAccountComplete ||
      hideAccountAndDownstreamAgents ||
      hideAccountApprovalAndDownstreamAgents ? null : (
        <>
          <details className="scenario-workspace-runs-run-step manus-session-exec-step">
            <SessionExecStepHeader {...manualStage} />
            <div className="manus-session-exec-step-body">
              <SessionExecReviewBlock stage={manualStage} />
            </div>
          </details>

          <details className="scenario-workspace-runs-run-step manus-session-exec-step">
            <SessionExecStepHeader {...trainingStage} />
            <div className="manus-session-exec-step-body">
              <SessionExecReviewBlock stage={trainingStage} />
            </div>
          </details>

          <details className="scenario-workspace-runs-run-step manus-session-exec-step">
            <SessionExecStepHeader {...masterStage} />
            <div className="manus-session-exec-step-body">
              <SessionExecReviewBlock stage={masterStage} />
            </div>
          </details>
        </>
      )}
    </div>
  )
}
