import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useId,
  useState,
  type RefObject,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { PlanAgentCreationSequence } from '../components/PlanAgentCreationSequence'
import { HomeSessionExecutionFeed, type SessionExecutionVariant } from '../components/HomeSessionExecutionFeed'
import {
  PlanBlueprintToolIcon,
  WfBlueprintStepsBlock,
  wfAssignedAgentOriginTag,
} from '../components/shared/WfBlueprintStepsBlock'
import type { JoyceChatMessage } from '../components/shared/JoyceAiPanel'
import { useLocale } from '../i18n/LocaleContext'
import {
  PLAN_WORKFLOW_COLLAB_CHOICE_LINES,
  PLAN_WORKFLOW_QUIZ_COLLAB_ROWS,
  PLAN_WORKFLOW_QUIZ_SCOPE_ROWS,
  PLAN_WORKFLOW_SCOPE_CHOICE_LINES,
} from '../data/plan-workflow-quiz-options'

function joyceMsgLogoGradId(messageId: string) {
  return `joyce-msg-${messageId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

/** 与 Home.tsx `PLAN_DETAIL_QUIZ_ACK_PREFIX` 保持一致 */
const PLAN_DETAIL_QUIZ_ACK_PREFIX = '【入职方案采集】'

type PlanDetailQuizOpt = { id: string; title: string; subtitle: string }

const PLAN_DETAIL_ROLE_OPTS: PlanDetailQuizOpt[] = [
  { id: 'role-hr', title: 'HR团队', subtitle: '人力资源管理员员工入职流程' },
  { id: 'role-new', title: '新员工', subtitle: '新入职员工自助完成入职步骤' },
  { id: 'role-mentor', title: '培训师/导师', subtitle: '负责培训和指导新员工' },
  { id: 'role-mgr', title: '部门经理', subtitle: '审批和监督入职进度' },
]

/** 历史消息里第二步选项曾用旧标题，归档勾选需仍能解析到 id */
const PLAN_DETAIL_LEGACY_STEP_TITLE_TO_ID: Record<string, string> = {
  文档收集和审核: 'step-docs',
  系统账号创建: 'step-acct',
  培训课程分配: 'step-course',
  培训进度追踪: 'step-track',
}

const PLAN_DETAIL_STEP_TRACK_LEGACY_TITLE = '培训进度追踪'
const PLAN_DETAIL_STEP_TRACK_LEGACY_SUB = '监控新员工完成培训的情况'

const PLAN_DETAIL_STEP_OPTS: PlanDetailQuizOpt[] = [
  { id: 'step-docs', title: 'mail + Slack + Notion（通用）', subtitle: '邮件、即时消息与文档/wiki 等典型协作工具' },
  { id: 'step-acct', title: 'Outlook + Teams + SharePoint（企业版）', subtitle: '企业邮箱、Teams 与 SharePoint 等 Microsoft 365 集成能力' },
  { id: 'step-course', title: '其他/通用（我会描述它们）', subtitle: '不在上述典型组合内时，可在后续对话中补充说明' },
]

type PlanDetailQuizParsedAck = { kind: 'confirm'; roleTitles: string[]; stepTitles: string[] } | { kind: 'skip' }

function parsePlanDetailQuizUserLine(text: string): PlanDetailQuizParsedAck | null {
  const t = text.trim()
  if (!t.startsWith(PLAN_DETAIL_QUIZ_ACK_PREFIX)) return null
  if (t.includes('已跳过')) return { kind: 'skip' }
  const rest = t.slice(PLAN_DETAIL_QUIZ_ACK_PREFIX.length)
  const m = rest.match(/^服务角色：(.+?)；关键环节：(.+)$/)
  if (!m) return null
  const roleTitles = m[1].split('、').map((s) => s.trim()).filter(Boolean)
  const stepTitles = m[2].split('、').map((s) => s.trim()).filter(Boolean)
  return { kind: 'confirm', roleTitles, stepTitles }
}

/** 将已提交的「工具」片段拆成：当前多选项 id、历史第四项复选、自由文本 */
function resolvePlanDetailStepArchive(stepTitles: string[]): {
  checkboxIds: Set<string>
  legacyStepTrackRow: boolean
  customLine: string
} {
  const checkboxIds = new Set<string>()
  const customParts: string[] = []
  let legacyStepTrackRow = false
  for (const raw of stepTitles) {
    const t = raw.trim()
    if (!t) continue
    const legacyId = PLAN_DETAIL_LEGACY_STEP_TITLE_TO_ID[t]
    if (legacyId) {
      if (legacyId === 'step-track') legacyStepTrackRow = true
      else if (PLAN_DETAIL_STEP_OPTS.some((o) => o.id === legacyId)) checkboxIds.add(legacyId)
      continue
    }
    const opt = PLAN_DETAIL_STEP_OPTS.find((o) => o.title === t)
    if (opt) {
      checkboxIds.add(opt.id)
      continue
    }
    customParts.push(t)
  }
  return {
    checkboxIds,
    legacyStepTrackRow,
    customLine: customParts.join('；'),
  }
}

function PlanOnboardingDetailQuizArchiveSection({
  title,
  opts,
  selectedIds,
  skipMode,
  bodyFooter,
}: {
  title: string
  opts: PlanDetailQuizOpt[]
  selectedIds: Set<string>
  skipMode: boolean
  bodyFooter?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`manus-plan-detail-quiz-section manus-plan-detail-quiz-section--archive${expanded ? ' is-expanded' : ' is-collapsed'}`}>
      <button
        type="button"
        className="manus-plan-detail-quiz-archive-head"
        aria-expanded={expanded}
        title={expanded ? '收起' : '展开查看选项'}
        onClick={() => setExpanded((v) => !v)}
      >
        <h4 className="manus-plan-detail-quiz-section-title manus-plan-detail-quiz-archive-head-title">{title}</h4>
        <span className="manus-plan-detail-quiz-archive-chev" aria-hidden="true" />
      </button>
      {expanded ? (
        <div className="manus-plan-detail-quiz-archive-body">
          <div className="manus-plan-detail-quiz-cards">
            {opts.map((o) => {
              const checked = skipMode ? false : selectedIds.has(o.id)
              return (
                <label key={o.id} className="manus-plan-detail-quiz-card">
                  <input type="checkbox" className="manus-plan-detail-quiz-checkbox" checked={checked} disabled />
                  <span className="manus-plan-detail-quiz-card-text">
                    <span className="manus-plan-detail-quiz-card-title">{o.title}</span>
                    <span className="manus-plan-detail-quiz-card-sub">{o.subtitle}</span>
                  </span>
                </label>
              )
            })}
          </div>
          {bodyFooter}
        </div>
      ) : null}
    </div>
  )
}

function PlanOnboardingDetailQuizArchive({ ack }: { ack: PlanDetailQuizParsedAck }) {
  const stepCustomArchiveFieldId = useId().replace(/:/g, '')
  const skipMode = ack.kind === 'skip'
  const roleIds = useMemo(() => {
    if (ack.kind === 'skip') return new Set<string>()
    return new Set(
      ack.roleTitles
        .map((t) => PLAN_DETAIL_ROLE_OPTS.find((o) => o.title === t)?.id)
        .filter((id): id is string => Boolean(id)),
    )
  }, [ack])
  const stepArchive = useMemo(() => {
    if (ack.kind === 'skip') {
      return { checkboxIds: new Set<string>(), legacyStepTrackRow: false, customLine: '' }
    }
    return resolvePlanDetailStepArchive(ack.stepTitles)
  }, [ack])

  return (
    <div className="manus-plan-detail-quiz manus-plan-detail-quiz--archive" role="group" aria-label="已提交的入职方案关键信息">
      {skipMode ? (
        <p className="manus-plan-detail-quiz-archive-skip-note">已跳过问卷，使用默认推荐。下方仍可展开查看选项说明。</p>
      ) : null}
      <PlanOnboardingDetailQuizArchiveSection
        title="这个系统主要服务于哪些角色?"
        opts={PLAN_DETAIL_ROLE_OPTS}
        selectedIds={roleIds}
        skipMode={skipMode}
      />
      <PlanOnboardingDetailQuizArchiveSection
        title="您在入职流程中主要使用哪些工具？"
        opts={PLAN_DETAIL_STEP_OPTS}
        selectedIds={stepArchive.checkboxIds}
        skipMode={skipMode}
        bodyFooter={
          skipMode ? null : (
            <>
              {stepArchive.legacyStepTrackRow ? (
                <label className="manus-plan-detail-quiz-card">
                  <input type="checkbox" className="manus-plan-detail-quiz-checkbox" checked readOnly disabled />
                  <span className="manus-plan-detail-quiz-card-text">
                    <span className="manus-plan-detail-quiz-card-title">{PLAN_DETAIL_STEP_TRACK_LEGACY_TITLE}</span>
                    <span className="manus-plan-detail-quiz-card-sub">{PLAN_DETAIL_STEP_TRACK_LEGACY_SUB}</span>
                  </span>
                </label>
              ) : null}
              {stepArchive.customLine ? (
                <div className="manus-plan-detail-quiz-custom-field manus-plan-detail-quiz-custom-field--readonly">
                  <label htmlFor={stepCustomArchiveFieldId} className="manus-plan-detail-quiz-custom-label">
                    自行填写的工具说明
                  </label>
                  <input
                    id={stepCustomArchiveFieldId}
                    type="text"
                    className="manus-plan-detail-quiz-custom-input"
                    readOnly
                    value={stepArchive.customLine}
                    aria-readonly="true"
                  />
                </div>
              ) : null}
            </>
          )
        }
      />
    </div>
  )
}

function PlanOnboardingDetailQuizPanel({
  disabled,
  onConfirm,
  onSkip,
}: {
  disabled: boolean
  onConfirm: (userLine: string) => void
  onSkip: () => void
}) {
  const [phase, setPhase] = useState<'roles' | 'steps'>('roles')
  const [roles, setRoles] = useState<Set<string>>(() => new Set())
  const [steps, setSteps] = useState<Set<string>>(() => new Set())
  const [stepCustomInput, setStepCustomInput] = useState('')
  const [error, setError] = useState('')

  const toggleRole = (id: string) => {
    setError('')
    setRoles((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleStep = (id: string) => {
    setError('')
    setSteps((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const goToSteps = () => {
    if (roles.size === 0) {
      setError('请至少选择一项服务角色。')
      return
    }
    setError('')
    setPhase('steps')
  }

  const handleConfirm = () => {
    const customTrim = stepCustomInput.trim()
    if (steps.size === 0 && !customTrim) {
      setError('请至少选择一类工具，或在下方填写说明。')
      return
    }
    const roleTitles = PLAN_DETAIL_ROLE_OPTS.filter((o) => roles.has(o.id)).map((o) => o.title)
    const stepTitles = PLAN_DETAIL_STEP_OPTS.filter((o) => steps.has(o.id)).map((o) => o.title)
    if (customTrim) stepTitles.push(customTrim)
    onConfirm(`${PLAN_DETAIL_QUIZ_ACK_PREFIX}服务角色：${roleTitles.join('、')}；关键环节：${stepTitles.join('、')}`)
  }

  const canNext = roles.size > 0
  const canConfirm = steps.size > 0 || stepCustomInput.trim().length > 0

  return (
    <div className="manus-plan-detail-quiz" role="group" aria-label="入职方案关键信息">
      {phase === 'roles' ? (
        <div className="manus-plan-detail-quiz-section">
          <h4 className="manus-plan-detail-quiz-section-title">这个系统主要服务于哪些角色?</h4>
          <div className="manus-plan-detail-quiz-cards">
            {PLAN_DETAIL_ROLE_OPTS.map((o) => (
              <label key={o.id} className="manus-plan-detail-quiz-card">
                <input
                  type="checkbox"
                  className="manus-plan-detail-quiz-checkbox"
                  checked={roles.has(o.id)}
                  disabled={disabled}
                  onChange={() => toggleRole(o.id)}
                />
                <span className="manus-plan-detail-quiz-card-text">
                  <span className="manus-plan-detail-quiz-card-title">{o.title}</span>
                  <span className="manus-plan-detail-quiz-card-sub">{o.subtitle}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="manus-plan-detail-quiz-section">
          <p className="manus-plan-detail-quiz-phase-lead">很好，第一步已完成。下面是第二步：</p>
          <h4 className="manus-plan-detail-quiz-section-title">您在入职流程中主要使用哪些工具？</h4>
          <div className="manus-plan-detail-quiz-cards">
            {PLAN_DETAIL_STEP_OPTS.map((o) => (
              <label key={o.id} className="manus-plan-detail-quiz-card">
                <input
                  type="checkbox"
                  className="manus-plan-detail-quiz-checkbox"
                  checked={steps.has(o.id)}
                  disabled={disabled}
                  onChange={() => toggleStep(o.id)}
                />
                <span className="manus-plan-detail-quiz-card-text">
                  <span className="manus-plan-detail-quiz-card-title">{o.title}</span>
                  <span className="manus-plan-detail-quiz-card-sub">{o.subtitle}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="manus-plan-detail-quiz-custom-field">
            <input
              type="text"
              className="manus-plan-detail-quiz-custom-input"
              placeholder="若不在上方选项中，请在此输入您常用的工具或说明"
              value={stepCustomInput}
              disabled={disabled}
              aria-label="若不在上方选项中，请在此输入您常用的工具或说明"
              onChange={(e) => {
                setError('')
                setStepCustomInput(e.target.value)
              }}
              autoComplete="off"
            />
          </div>
        </div>
      )}
      <div className="manus-plan-detail-quiz-footer">
        {error ? <p className="manus-plan-detail-quiz-error">{error}</p> : null}
        <div className="manus-plan-detail-quiz-actions">
          {phase === 'roles' ? (
            <>
              <button type="button" className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--ghost" disabled={disabled} onClick={onSkip}>
                跳过
              </button>
              <button
                type="button"
                className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--primary"
                disabled={disabled || !canNext}
                title={!canNext && !disabled ? '请至少选择一项服务角色' : undefined}
                onClick={goToSteps}
              >
                确认
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--ghost"
                disabled={disabled}
                onClick={() => {
                  setError('')
                  setPhase('roles')
                }}
              >
                上一步
              </button>
              <button type="button" className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--ghost" disabled={disabled} onClick={onSkip}>
                跳过
              </button>
              <button
                type="button"
                className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--primary"
                disabled={disabled || !canConfirm}
                title={!canConfirm && !disabled ? '请勾选上方选项，或在下方输入框填写' : undefined}
                onClick={handleConfirm}
              >
                确定
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Plan「入职工作流」：与智能体首轮相同的卡片式问卷样式（单选 + 确定 / 跳过） */
function PlanWorkflowQuizPanel({
  kind,
  disabled,
  onPick,
}: {
  kind: 'scope' | 'collaboration'
  disabled: boolean
  onPick: (line: string) => void
}) {
  const uid = useId().replace(/:/g, '')
  const rows = kind === 'scope' ? PLAN_WORKFLOW_QUIZ_SCOPE_ROWS : PLAN_WORKFLOW_QUIZ_COLLAB_ROWS
  const sectionTitle =
    kind === 'scope' ? '流程要覆盖的范围' : '流程中的发起方与协作方式'
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [error, setError] = useState('')
  const radioName = kind === 'scope' ? `wf-quiz-scope-${uid}` : `wf-quiz-collab-${uid}`
  const defaultLine = rows[0]?.line ?? ''

  const handleConfirm = () => {
    if (!selectedLine) {
      setError('请先选择一项。')
      return
    }
    onPick(selectedLine)
  }

  return (
    <div className="manus-plan-detail-quiz" role="group" aria-label={sectionTitle}>
      <div className="manus-plan-detail-quiz-section">
        <h4 className="manus-plan-detail-quiz-section-title">{sectionTitle}</h4>
        <div className="manus-plan-detail-quiz-cards">
          {rows.map((o) => (
            <label key={o.id} className="manus-plan-detail-quiz-card">
              <input
                type="radio"
                className="manus-plan-detail-quiz-checkbox"
                name={radioName}
                checked={selectedLine === o.line}
                disabled={disabled}
                onChange={() => {
                  setError('')
                  setSelectedLine(o.line)
                }}
              />
              <span className="manus-plan-detail-quiz-card-text">
                <span className="manus-plan-detail-quiz-card-title">{o.line}</span>
                <span className="manus-plan-detail-quiz-card-sub">{o.subtitle}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="manus-plan-detail-quiz-footer">
        {error ? <p className="manus-plan-detail-quiz-error">{error}</p> : null}
        <div className="manus-plan-detail-quiz-actions">
          <button
            type="button"
            className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--primary"
            disabled={disabled || !selectedLine}
            title={!selectedLine && !disabled ? '请先选择一项' : undefined}
            onClick={handleConfirm}
          >
            确定
          </button>
          <button
            type="button"
            className="manus-plan-detail-quiz-btn manus-plan-detail-quiz-btn--ghost"
            disabled={disabled}
            onClick={() => onPick(defaultLine)}
          >
            跳过，使用推荐
          </button>
        </div>
      </div>
    </div>
  )
}

const WF_CREATED_AGENT_ROWS = [
  {
    k: 'ag1',
    title: 'HR Onboarding Coordinator (HR入职协调员)',
    body: '负责整体协调和项目管理',
  },
  {
    k: 'ag2',
    title: 'IT Support Specialist (IT支持专员)',
    body: '负责技术设备和账户配置',
  },
  {
    k: 'ag3',
    title: 'Training Coordinator (培训协调员)',
    body: '负责培训计划和执行',
  },
  {
    k: 'ag4',
    title: 'Onboarding Auditor (入职检查员)',
    body: '负责流程监督和质量控制',
  },
] as const

const WF_CREATED_TASK_ROWS = [
  { k: 'tk1', title: 'Create Onboarding Project', body: '创建入职项目和计划' },
  { k: 'tk2', title: 'Setup IT Infrastructure', body: '配置IT设备和账户' },
  { k: 'tk3', title: 'Develop Training Plan', body: '制定个性化培训计划' },
  {
    k: 'tk4',
    title: 'Monitor and Validate Onboarding Process',
    body: '监督验证整个流程',
  },
] as const

const WF_CREATED_INT_ROWS = [
  { k: 'in1', label: '项目管理：', body: 'Asana集成用于任务和项目管理' },
  { k: 'in2', label: '文件处理：', body: '可以读取培训材料和政策文档' },
  { k: 'in3', label: '网站抓取：', body: '可以获取公司网站相关信息' },
  {
    k: 'in4',
    label: '变量支持：',
    body: (
      <>
        支持 <code className="manus-wf-created-card__code">{'{employee_name}'}</code> 参数个性化处理
      </>
    ),
  },
] as const

const WF_CREATED_TRAIT_ROWS = [
  { k: 'tr1', label: '顺序执行：', body: '确保任务按正确顺序完成' },
  { k: 'tr2', label: '任务依赖：', body: '后续任务会基于前置任务的结果执行' },
  { k: 'tr3', label: '质量保证：', body: '最后的审核环节确保入职质量' },
  { k: 'tr4', label: '全面覆盖：', body: '从IT设备到培训再到验收的完整流程' },
] as const

const WF_CREATED_REVEAL_MS = 420
/** 0:标题 →1:导语 →2–5:智能体逐条 →6–9:任务逐条 →10–13:集成逐条 →14–17:特点逐条 →18:注意 →19:CTA */
const WF_CREATED_MAX_REVEAL_STEP = 19

const BUILD_ONBOARD_FLOW_PLAN_ROWS = [
  {
    step: 1,
    fn: '收集员工信息',
    tech: 'Google Forms 触发器（姓名、部门、职位、入职日期等）',
  },
  {
    step: 2,
    fn: '验证 & 规范化数据',
    tech: 'AI 节点（格式校验、数据清洗）',
  },
  {
    step: 3,
    fn: '保存信息至 HR 表格',
    tech: 'Google Sheets（写入新员工记录，状态标记 "进行中"）',
  },
  {
    step: 4,
    fn: 'IT账户申请',
    tech: 'Gmail（自动通知 IT 部门开通账户）',
  },
  {
    step: 5,
    fn: '生成个性化欢迎邮件',
    tech: 'AI 节点（生成包含培训资料和入职指引的欢迎邮件）',
  },
  {
    step: 6,
    fn: '发送欢迎邮件给员工',
    tech: 'Gmail（发送入职指引至新员工邮箱）',
  },
  {
    step: 7,
    fn: 'Slack 通知 HR',
    tech: 'Slack（通知 HR 负责人流程已启动并完成）',
  },
] as const

/** 1:标题 →2:表头与表壳 →3–9:七行逐条 →10:整体流程 */
const BUILD_FLOW_PLAN_REVEAL_MS = 420
const BUILD_FLOW_PLAN_MAX_REVEAL_STEP = 10

/** 工作流首轮：英文规划轨迹 — durationMs 内打满，视窗最多约 3 行（滚动跟随末尾），结束后父级接中文 Q1 */
function WorkflowPlannerTraceTyping({
  text,
  messageId,
  durationMs,
  onVanish,
}: {
  text: string
  messageId: string
  durationMs: number
  onVanish: (id: string) => void
}) {
  const [visibleLen, setVisibleLen] = useState(0)
  const finishedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finishedRef.current = false
    const len = text.length
    if (len === 0) {
      queueMicrotask(() => {
        if (!finishedRef.current) {
          finishedRef.current = true
          onVanish(messageId)
        }
      })
      return
    }
    let cancelled = false
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      if (cancelled || finishedRef.current) return
      const elapsed = now - t0
      if (elapsed >= durationMs) {
        finishedRef.current = true
        setVisibleLen(len)
        onVanish(messageId)
        return
      }
      const next = Math.min(len, Math.max(1, Math.ceil((elapsed / durationMs) * len)))
      setVisibleLen((prev) => (next > prev ? next : prev))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [text, messageId, durationMs, onVanish])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [visibleLen])

  return (
    <div ref={scrollRef} className="manus-home-session-workflow-planner-trace-scroll">
      <p className="manus-home-session-workflow-planner-trace">{text.slice(0, visibleLen)}</p>
    </div>
  )
}

/** Build：英文 plan_creator 轨迹 — durationMs 内逐字打满；视窗最多 3 行（跟随末尾），结束后由父级移除本条并接中文 */
function BuildIntroTraceTyping({
  text,
  messageId,
  durationMs,
  onVanish,
}: {
  text: string
  messageId: string
  durationMs: number
  onVanish: (id: string) => void
}) {
  const [visibleLen, setVisibleLen] = useState(0)
  const finishedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finishedRef.current = false
    const len = text.length
    if (len === 0) {
      queueMicrotask(() => {
        if (!finishedRef.current) {
          finishedRef.current = true
          onVanish(messageId)
        }
      })
      return
    }
    let cancelled = false
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      if (cancelled || finishedRef.current) return
      const elapsed = now - t0
      if (elapsed >= durationMs) {
        finishedRef.current = true
        setVisibleLen(len)
        onVanish(messageId)
        return
      }
      const next = Math.min(len, Math.max(1, Math.ceil((elapsed / durationMs) * len)))
      setVisibleLen((prev) => (next > prev ? next : prev))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [text, messageId, durationMs, onVanish])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [visibleLen])

  return (
    <div ref={scrollRef} className="manus-home-session-build-intro-trace-scroll">
      <p className="manus-home-session-build-intro-trace" aria-live="polite">
        {text.slice(0, visibleLen)}
      </p>
    </div>
  )
}

const BUILD_ONBOARD_COMPLETE_ROWS = [
  {
    step: 1,
    node: '新员工信息输入',
    fn: 'HR 录入 信息字段（姓名、部门、职位、入职日期、邮箱）',
  },
  {
    step: 2,
    node: '验证并规范员工数据',
    fn: 'AI 自动校验邮箱格式、统一日期格式 (YYYY-MM-DD)',
  },
  {
    step: 3,
    node: 'Google Sheets',
    fn: '将员工信息写入 HR 入职追踪表，状态标记为 "In Progress"',
  },
  {
    step: 4,
    node: 'IT账户申请',
    fn: '自动通知 IT 部门开通企业邮箱、VPN、软件权限等',
  },
  {
    step: 5,
    node: '生成入职欢迎邮件',
    fn: '个性化生成包含第一周日程、培训资料、IT 设置的欢迎邮件',
  },
  {
    step: 6,
    node: '发送新员工欢迎邮件',
    fn: '将欢迎邮件发送至新员工个人邮箱',
  },
  {
    step: 7,
    node: '通知 HR 团队',
    fn: '发送完整入职流程完成通知给 HR Slack 频道',
  },
] as const

/** 1:标题 →2:导语 →3:表头+第1行 →4–9:第2–7行 */
const BUILD_COMPLETE_REVEAL_MS = 420
const BUILD_COMPLETE_MAX_REVEAL_STEP = 9

/** Build：构建完成汇总表（与产品稿一致；按步显现） */
function BuildOnboardingBuildCompleteCard() {
  const [revealStep, setRevealStep] = useState(1)

  useEffect(() => {
    if (revealStep >= BUILD_COMPLETE_MAX_REVEAL_STEP) return
    const id = window.setTimeout(() => setRevealStep((s) => s + 1), BUILD_COMPLETE_REVEAL_MS)
    return () => window.clearTimeout(id)
  }, [revealStep])

  const titleVisible = revealStep >= 1
  const leadVisible = revealStep >= 2
  const tableVisible = revealStep >= 3
  const rowCount = tableVisible ? Math.min(BUILD_ONBOARD_COMPLETE_ROWS.length, Math.max(0, revealStep - 2)) : 0

  return (
    <div
      className="manus-build-complete-card"
      role="region"
      aria-label="新员工入职智能助手构建完成总结"
      aria-busy={revealStep < BUILD_COMPLETE_MAX_REVEAL_STEP}
    >
      {titleVisible ? (
        <h3 className="manus-build-complete-card__title manus-build-complete-card__reveal-step">
          <span className="manus-build-complete-card__check" aria-hidden="true">
            ✓
          </span>
          新员工入职智能助手 — 构建完成!
        </h3>
      ) : null}
      {leadVisible ? (
        <p className="manus-build-complete-card__lead manus-build-complete-card__reveal-step">
          以下是整个流程的完整总结:
        </p>
      ) : null}
      {tableVisible ? (
        <div className="manus-build-complete-card__table-wrap manus-build-complete-card__reveal-step">
          <table className="manus-build-complete-card__table">
            <thead>
              <tr>
                <th scope="col">步骤</th>
                <th scope="col">节点</th>
                <th scope="col">功能</th>
              </tr>
            </thead>
            <tbody>
              {BUILD_ONBOARD_COMPLETE_ROWS.slice(0, rowCount).map((row) => (
                <tr key={row.step} className="manus-build-complete-card__reveal-step">
                  <td className="manus-build-complete-card__td-step">
                    <span className="manus-build-complete-card__step-badge" aria-hidden="true">
                      {row.step}
                    </span>
                  </td>
                  <td className="manus-build-complete-card__td-node">{row.node}</td>
                  <td>{row.fn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

/** Build Mode：新员工入职智能体 — 流程规划表（与参考稿排版一致；内容按步逐条显现） */
function BuildOnboardingFlowPlanCard() {
  const [revealStep, setRevealStep] = useState(1)

  useEffect(() => {
    if (revealStep >= BUILD_FLOW_PLAN_MAX_REVEAL_STEP) return
    const id = window.setTimeout(() => setRevealStep((s) => s + 1), BUILD_FLOW_PLAN_REVEAL_MS)
    return () => window.clearTimeout(id)
  }, [revealStep])

  const titleVisible = revealStep >= 1
  const tableVisible = revealStep >= 2
  const rowCount = tableVisible ? Math.min(BUILD_ONBOARD_FLOW_PLAN_ROWS.length, Math.max(0, revealStep - 2)) : 0
  const summaryVisible = revealStep >= 10

  return (
    <div
      className="manus-build-flow-plan-card"
      role="region"
      aria-label="新员工入职智能助手流程规划"
      aria-busy={revealStep < BUILD_FLOW_PLAN_MAX_REVEAL_STEP}
    >
      {titleVisible ? (
        <h3 className="manus-build-flow-plan-card__title manus-build-flow-plan-card__reveal-step">
          <span aria-hidden="true">🎉 </span>
          新员工入职智能助手 — 流程规划
        </h3>
      ) : null}
      {tableVisible ? (
        <div className="manus-build-flow-plan-card__table-wrap manus-build-flow-plan-card__reveal-step">
          <table className="manus-build-flow-plan-card__table">
            <thead>
              <tr>
                <th scope="col">步骤</th>
                <th scope="col">功能</th>
                <th scope="col">技术实现</th>
              </tr>
            </thead>
            <tbody>
              {BUILD_ONBOARD_FLOW_PLAN_ROWS.slice(0, rowCount).map((row) => (
                <tr key={row.step} className="manus-build-flow-plan-card__reveal-step">
                  <td className="manus-build-flow-plan-card__td-step">
                    <span className="manus-build-flow-plan-card__step-badge" aria-hidden="true">
                      {row.step}
                    </span>
                  </td>
                  <td>{row.fn}</td>
                  <td>{row.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {summaryVisible ? (
        <p className="manus-build-flow-plan-card__summary manus-build-flow-plan-card__reveal-step">
          <strong>整体流程：</strong>
          新员工提交 Google Form → AI 验证数据 → 保存到 HR 表格 → 自动通知 IT 开通账户 → AI 生成欢迎邮件并发送 → Slack
          通知 HR 完成 ✅
        </p>
      ) : null}
    </div>
  )
}

/** Plan 工作流采集完成：结构化完成说明（与产品视觉稿对齐；内容按步逐条显现） */
function WorkflowCreatedAssistantCard() {
  const [revealStep, setRevealStep] = useState(0)

  useEffect(() => {
    if (revealStep >= WF_CREATED_MAX_REVEAL_STEP) return
    const id = window.setTimeout(() => setRevealStep((s) => s + 1), WF_CREATED_REVEAL_MS)
    return () => window.clearTimeout(id)
  }, [revealStep])

  const agentsVisible = revealStep < 2 ? 0 : Math.min(WF_CREATED_AGENT_ROWS.length, revealStep - 1)
  const tasksVisible = revealStep < 6 ? 0 : Math.min(WF_CREATED_TASK_ROWS.length, revealStep - 5)
  const intVisible = revealStep < 10 ? 0 : Math.min(WF_CREATED_INT_ROWS.length, revealStep - 9)
  const traitsVisible = revealStep < 14 ? 0 : Math.min(WF_CREATED_TRAIT_ROWS.length, revealStep - 13)

  return (
    <div
      className="manus-wf-created-card manus-wf-created-card--revealing"
      role="region"
      aria-busy={revealStep < WF_CREATED_MAX_REVEAL_STEP}
      aria-label="新员工入职自动化工作流已创建完成，包含智能体团队、工作流程任务、集成功能与流程特点。"
    >
      <p className="manus-wf-created-card__title manus-wf-created-card__reveal-step">
        <span aria-hidden="true">🥳 </span>
        <strong>新员工入职自动化工作流已创建完成!</strong>
      </p>
      {revealStep >= 1 ? (
        <p className="manus-wf-created-card__lead manus-wf-created-card__reveal-step">
          我已经为您成功创建了一个完整的新员工入职自动化工作流，包含以下核心组件：
        </p>
      ) : null}

      {agentsVisible > 0 ? (
        <section className="manus-wf-created-card__section" aria-labelledby="manus-wf-created-agents-heading">
          <h3 className="manus-wf-created-card__h" id="manus-wf-created-agents-heading">
            <span aria-hidden="true">👥</span>
            <strong>智能体团队</strong>
          </h3>
          <ol className="manus-wf-created-card__ol">
            {WF_CREATED_AGENT_ROWS.slice(0, agentsVisible).map((row) => (
              <li key={row.k} className="manus-wf-created-card__reveal-step">
                <strong>{row.title}</strong>
                <span className="manus-wf-created-card__sep"> — </span>
                {row.body}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {tasksVisible > 0 ? (
        <section className="manus-wf-created-card__section" aria-labelledby="manus-wf-created-tasks-heading">
          <h3 className="manus-wf-created-card__h" id="manus-wf-created-tasks-heading">
            <span aria-hidden="true">📋</span>
            <strong>工作流程任务</strong>
          </h3>
          <ol className="manus-wf-created-card__ol">
            {WF_CREATED_TASK_ROWS.slice(0, tasksVisible).map((row) => (
              <li key={row.k} className="manus-wf-created-card__reveal-step">
                <strong>{row.title}</strong>
                <span className="manus-wf-created-card__sep"> — </span>
                {row.body}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {intVisible > 0 ? (
        <section className="manus-wf-created-card__section" aria-labelledby="manus-wf-created-int-heading">
          <h3 className="manus-wf-created-card__h" id="manus-wf-created-int-heading">
            <span aria-hidden="true">🔧</span>
            <strong>集成功能</strong>
          </h3>
          <ul className="manus-wf-created-card__ul manus-wf-created-card__ul--integration">
            {WF_CREATED_INT_ROWS.slice(0, intVisible).map((row) => (
              <li key={row.k} className="manus-wf-created-card__reveal-step">
                <strong>{row.label}</strong>
                {row.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {traitsVisible > 0 ? (
        <section className="manus-wf-created-card__section" aria-labelledby="manus-wf-created-traits-heading">
          <h3 className="manus-wf-created-card__h" id="manus-wf-created-traits-heading">
            <span aria-hidden="true">⚡</span>
            <strong>工作流程特点</strong>
          </h3>
          <ul className="manus-wf-created-card__ul manus-wf-created-card__ul--traits">
            {WF_CREATED_TRAIT_ROWS.slice(0, traitsVisible).map((row) => (
              <li key={row.k} className="manus-wf-created-card__reveal-step">
                <strong>{row.label}</strong>
                {row.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {revealStep >= 18 ? (
        <p className="manus-wf-created-card__note manus-wf-created-card__reveal-step">
          <strong>注意：</strong>
          Asana集成需要您先连接账户才能使用项目管理功能。您可以在运行自动化时被提醒进行连接。
        </p>
      ) : null}
      {revealStep >= 19 ? (
        <p className="manus-wf-created-card__cta manus-wf-created-card__reveal-step">
          现在您可以点击运行按钮来测试这个入职自动化流程！
        </p>
      ) : null}
    </div>
  )
}

const PLAN_MULTI_AGENT_TIMELINE_ITEMS = [
  {
    k: 't1',
    title: '入职前（约 1-2 周）：',
    body: '收集资料、创建账号并安排首日行程。',
  },
  {
    k: 't2',
    title: '首日与首周：',
    body: '执行首日计划、启动培训并支持答疑。',
  },
  {
    k: 't3',
    title: '第 2-4 周：',
    body: '监控培训进度、核验材料并阶段性检查。',
  },
  {
    k: 't4',
    title: '第 30-90 天：',
    body: '里程碑评估、确认培训完成并收集反馈。',
  },
] as const

const PLAN_MULTI_AGENT_FEATURE_LINES = [
  '全流程自动编排与代理协调。',
  '每个子代理具备对应领域的专业能力。',
  '记忆能力：结合上下文持续跟进个案。',
  '可扩展：支持多名员工并行入职。',
  '高可靠性：关键步骤有校验与回执。',
] as const

const PLAN_MULTI_AGENT_REVEAL_MS = 420
/** 0:hero →1:统筹 →2–6:子代理逐条 →7–10:原理逐条 →11–15:功能逐条 →16:下一步首段 →17:次段 →18:页脚 */
const PLAN_MULTI_AGENT_MAX_REVEAL_STEP = 18

/** Plan 智能体创建完成：多代理系统说明（与产品稿排版一致；内容按步逐条显现） */
function PlanMultiAgentCreatedAssistantCard() {
  const subAgents = [
    {
      name: '文件收集代理',
      desc: '处理文档需求、核验材料与收集进度的跟踪。',
    },
    {
      name: '账户设置代理',
      desc: '创建邮箱、业务软件等系统账号并安全管理凭据。',
    },
    {
      name: '培训协调代理',
      desc: '分配培训课程、跟踪学习进度并发送提醒。',
    },
    {
      name: '入职流程总控代理',
      desc: '协调后勤、会议安排与里程碑节点检查。',
    },
    {
      name: '入职支持专员',
      desc: '全天候解答新员工在入职过程中的各类问题。',
    },
  ] as const

  const [revealStep, setRevealStep] = useState(0)

  useEffect(() => {
    if (revealStep >= PLAN_MULTI_AGENT_MAX_REVEAL_STEP) return
    const id = window.setTimeout(() => setRevealStep((s) => s + 1), PLAN_MULTI_AGENT_REVEAL_MS)
    return () => window.clearTimeout(id)
  }, [revealStep])

  const subVisible = revealStep < 2 ? 0 : revealStep <= 6 ? revealStep - 1 : subAgents.length
  const timelineVisible =
    revealStep < 7 ? 0 : Math.min(PLAN_MULTI_AGENT_TIMELINE_ITEMS.length, revealStep - 6)
  const featuresVisible = Math.min(
    PLAN_MULTI_AGENT_FEATURE_LINES.length,
    Math.max(0, revealStep < 11 ? 0 : revealStep - 10),
  )

  return (
    <div
      className="manus-plan-multi-agent-card manus-plan-multi-agent-card--revealing"
      role="region"
      aria-busy={revealStep < PLAN_MULTI_AGENT_MAX_REVEAL_STEP}
      aria-label="新员工入职培训多代理系统已创建完成，包含统筹代理、子代理、工作原理与后续步骤说明。"
    >
      <p className="manus-plan-multi-agent-card__hero manus-plan-multi-agent-card__reveal-step">
        太棒了！我已经铺设好了完整的新员工入职培训多代理系统！<span aria-hidden="true"> 🎉</span>
      </p>

      {revealStep >= 1 ? (
        <>
          <div className="manus-plan-multi-agent-card__divider" aria-hidden="true" />
          <section className="manus-plan-multi-agent-card__section manus-plan-multi-agent-card__reveal-step" aria-labelledby="plan-multi-built-heading">
            <p className="manus-plan-multi-agent-card__kicker" id="plan-multi-built-heading">
              我为你打造的
            </p>
            <p className="manus-plan-multi-agent-card__subh">
              <span aria-hidden="true">🎯 </span>统筹代理（协调者）
            </p>
            <div className="manus-plan-multi-agent-card__agent-row">
              <div className="manus-plan-multi-agent-card__agent-main">
                <div className="manus-plan-multi-agent-card__name-line">
                  <strong className="manus-plan-multi-agent-card__name">人力资源入职经理</strong>
                </div>
                <p className="manus-plan-multi-agent-card__desc">
                  协助每位员工的入职流程，分配任务并牵头整体进度与质量。
                </p>
              </div>
              <span className="manus-plan-multi-agent-card__check" aria-hidden="true">
                ✓
              </span>
            </div>
          </section>
        </>
      ) : null}

      {revealStep >= 2 ? (
        <>
          <div className="manus-plan-multi-agent-card__divider" aria-hidden="true" />
          <section className="manus-plan-multi-agent-card__section" aria-labelledby="plan-multi-subs-heading">
            <h3 className="manus-plan-multi-agent-card__h" id="plan-multi-subs-heading">
              <span aria-hidden="true">🪄 </span>5 个专业子代理
            </h3>
            <ol className="manus-plan-multi-agent-card__sub-list">
              {subAgents.slice(0, subVisible).map((a, idx) => (
                <li key={a.name} className="manus-plan-multi-agent-card__sub-item manus-plan-multi-agent-card__reveal-step">
                  <span className="manus-plan-multi-agent-card__sub-num">{idx + 1}.</span>
                  <div className="manus-plan-multi-agent-card__sub-body">
                    <div className="manus-plan-multi-agent-card__name-line">
                      <strong className="manus-plan-multi-agent-card__name">{a.name}</strong>
                    </div>
                    <p className="manus-plan-multi-agent-card__desc">{a.desc}</p>
                  </div>
                  <span className="manus-plan-multi-agent-card__check" aria-hidden="true">
                    ✓
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}

      {revealStep >= 7 ? (
        <>
          <div className="manus-plan-multi-agent-card__divider" aria-hidden="true" />
          <section className="manus-plan-multi-agent-card__section" aria-labelledby="plan-multi-how-heading">
            <h3 className="manus-plan-multi-agent-card__h" id="plan-multi-how-heading">
              <span aria-hidden="true">📋 </span>系统工作原理
            </h3>
            <ul className="manus-plan-multi-agent-card__timeline">
              {PLAN_MULTI_AGENT_TIMELINE_ITEMS.slice(0, timelineVisible).map((row) => (
                <li key={row.k} className="manus-plan-multi-agent-card__reveal-step">
                  <strong>{row.title}</strong>
                  {row.body}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {revealStep >= 11 ? (
        <>
          <div className="manus-plan-multi-agent-card__divider" aria-hidden="true" />
          <section className="manus-plan-multi-agent-card__section" aria-labelledby="plan-multi-features-heading">
            <h3 className="manus-plan-multi-agent-card__h" id="plan-multi-features-heading">
              <span aria-hidden="true">🎯 </span>主要功能
            </h3>
            <ul className="manus-plan-multi-agent-card__features">
              {PLAN_MULTI_AGENT_FEATURE_LINES.slice(0, featuresVisible).map((line, i) => (
                <li key={i} className="manus-plan-multi-agent-card__reveal-step">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {revealStep >= 16 ? (
        <>
          <div className="manus-plan-multi-agent-card__divider" aria-hidden="true" />
          <section className="manus-plan-multi-agent-card__section" aria-labelledby="plan-multi-next-heading">
            <h3 className="manus-plan-multi-agent-card__h" id="plan-multi-next-heading">
              <span aria-hidden="true">🪄 </span>下一步
            </h3>
            <p className="manus-plan-multi-agent-card__next-p manus-plan-multi-agent-card__reveal-step">
              <strong>管理员：</strong>
              与「人力资源入职经理」对话，提供员工信息（姓名、岗位、到岗日期等），即可自动编排后续任务。
            </p>
            {revealStep >= 17 ? (
              <p className="manus-plan-multi-agent-card__next-p manus-plan-multi-agent-card__reveal-step">
                <strong>新员工：</strong>
                可向「入职支持专员」提问，并会收到各子代理的自动通知与提醒。
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      {revealStep >= 18 ? (
        <p className="manus-plan-multi-agent-card__footer manus-plan-multi-agent-card__reveal-step">
          是否需要我带你接入 Slack、谷歌日历 或 邮件自动化，让系统更强大？
        </p>
      ) : null}
    </div>
  )
}

/** 草案侧栏/工作区 与 AI 对话区之间的拖动分隔条占位宽度 */
const SESSION_SPLIT_RESIZER_PX = 8
/** AI 对话区（主列）最小宽度 */
const SESSION_SPLIT_MAIN_MIN_PX = 320
/** Plan：左侧入职管家/草案栏与右侧 Joyce 对话区分栏；默认宽度比 3:4（草案占可用宽度的 3/7） */
const PLAN_BLUEPRINT_SPLIT_MIN_PX = 260
const PLAN_BLUEPRINT_RATIO_NUM = 3
const PLAN_BLUEPRINT_RATIO_DEN = 7

function initialPlanBlueprintWidthEstimatePx(): number {
  if (typeof window === 'undefined') return PLAN_BLUEPRINT_SPLIT_MIN_PX
  const estGrid = Math.max(480, window.innerWidth - 280)
  const inner = Math.max(0, estGrid - SESSION_SPLIT_RESIZER_PX)
  return Math.max(PLAN_BLUEPRINT_SPLIT_MIN_PX, Math.round((inner * PLAN_BLUEPRINT_RATIO_NUM) / PLAN_BLUEPRINT_RATIO_DEN))
}

/** 「+ 添加」浮层内可选工具（演示，5 项） */
type PlanFlowTurn = null | 'awaitR1' | 'awaitR1Type' | 'awaitR2' | 'awaitR2Type' | 'awaitR3' | 'awaitR3Type' | 'done'

type PlanAgentBlueprint = {
  name: string
  role: string
  rolePrompt: string
  subAgents?: readonly { name: string; description: string }[]
  /** 对话主模型展示（如 OpenAI / gpt-4.1） */
  chatModel: string
  chatModelOptions?: string[]
  tools: string[]
}

/** 侧栏未带 subAgents 时的默认四类专业子 Agent（与入职管家编排一致） */
const PLAN_AGENT_BLUEPRINT_FALLBACK_SUB_AGENTS: readonly { name: string; description: string }[] = [
  {
    name: '信息收集子 Agent',
    description: '收集入职材料、字段校验与缺失提醒，可与表单/HRIS 对接并回写完成度。',
  },
  {
    name: 'IT 开通子 Agent',
    description: '按岗位模板开通邮箱、VPN、协作套件与业务权限，跟踪工单状态并输出使用指引。',
  },
  {
    name: '培训与文化子 Agent',
    description: '映射必修/选修课程、融入节奏与导师/经理待办，避免培训与报到日程冲突。',
  },
  {
    name: '行政与资产子 Agent',
    description: '协调工位、设备、门禁与办公物品申领签收，汇总异常并提醒行政闭环。',
  },
]

export type PlanWorkflowStep = {
  id: string
  title: string
}

/** Plan「入职工作流」采集完成后左侧版块（参考工作流编辑器草稿布局） */
export type PlanWorkflowBlueprint = {
  /** 顶栏主标题，如「新员工入职自动化工作流」 */
  name: string
  goal: string
  stages: string
  handoffs: string
  integrations: string
  steps: PlanWorkflowStep[]
}


/** 侧栏入职场景会话主区：Agent 执行轨迹（s1 全完成 / s6·s7 含警告态 / s3·s4·s5 含故障态） */
const SESSION_WORKFLOW_SCENARIOS: Record<string, { title: string; executionVariant: SessionExecutionVariant }> = {
  s1: { title: '新员工入职工作流', executionVariant: 'complete' },
  s6: { title: '销售经理入职工作流', executionVariant: 'partial' },
  s7: { title: '初级运维入职工作流', executionVariant: 'partial' },
  s3: { title: '高级研发入职工作流', executionVariant: 'fault' },
  s4: { title: '运营经理入职工作流', executionVariant: 'fault' },
  s5: { title: '身份验证', executionVariant: 'fault' },
}

export type HomeSessionViewProps = {
  mode: 'plan' | 'build'
  messages: JoyceChatMessage[]
  buildAiInput: string
  setBuildAiInput: (v: string) => void
  onSend: () => void
  onBack: () => void
  sessionComposerInputRef: RefObject<HTMLTextAreaElement | null>
  planFlowTurn: PlanFlowTurn
  onQuickReply?: (text: string) => void
  inputPlaceholder?: string
  composerVoiceListening: boolean
  onComposerVoiceClick: () => void
  planAgentBlueprint: PlanAgentBlueprint | null
  /** Plan「入职工作流」侧栏草案（与智能体草案二选一展示） */
  planWorkflowBlueprint?: PlanWorkflowBlueprint | null
  /** 侧栏「名称」编辑 */
  onPlanBlueprintNameChange?: (name: string) => void
  /** 侧栏「角色」编辑 */
  onPlanBlueprintRoleChange?: (role: string) => void
  /** 侧栏「角色提示词」弹窗保存时回传全文 */
  onPlanBlueprintRolePromptChange?: (rolePrompt: string) => void
  /** 侧栏草案底部「创建」：例如进入 Build 模式 */
  onPlanBlueprintCreate?: () => void
  /** Plan 第三条助理后：自动展示创建动画（无快捷按钮） */
  showPlanAgentCreationSequence?: boolean
  onPlanAgentCreationComplete?: () => void
  /** 创建动画播放期间锁定底部输入 */
  sessionComposerLocked?: boolean
  /** Build 演示：英文轨迹逐字播完后的回调（由 Home 移除该气泡并接中文） */
  onBuildIntroTraceVanish?: (messageId: string) => void
  /** 英文轨迹逐字出现总时长（毫秒） */
  buildIntroTraceTypingMs?: number
  /** 工作流首轮英文规划轨迹播完后替换为中文 Q1 */
  onWorkflowPlannerTraceVanish?: (messageId: string) => void
  /** 工作流英文轨迹总时长（毫秒），默认 2000 */
  workflowPlannerTraceTypingMs?: number
  /** 侧栏选中的历史 id；为 s1 / s6 / s3 / s5 等在主会话区展示工作流步骤版块（替代气泡列表） */
  selectedRunHistoryId?: string | null
  /** User 端：无 Plan/Build 区分，仅普通对话输入 */
  chatOnly?: boolean
  /** User 端：点击「招聘高级前端」标签填入预设招聘需求 */
  onUserRecruitContextClick?: () => void
}

export function HomeSessionView({
  mode,
  messages,
  buildAiInput,
  setBuildAiInput,
  onSend,
  onBack,
  sessionComposerInputRef,
  planFlowTurn,
  onQuickReply,
  inputPlaceholder,
  composerVoiceListening,
  onComposerVoiceClick,
  planAgentBlueprint,
  planWorkflowBlueprint = null,
  onPlanBlueprintNameChange,
  onPlanBlueprintRoleChange,
  onPlanBlueprintRolePromptChange,
  onPlanBlueprintCreate,
  showPlanAgentCreationSequence = false,
  onPlanAgentCreationComplete,
  sessionComposerLocked = false,
  onBuildIntroTraceVanish,
  buildIntroTraceTypingMs = 1000,
  onWorkflowPlannerTraceVanish,
  workflowPlannerTraceTypingMs = 2000,
  selectedRunHistoryId = null,
  chatOnly = false,
  onUserRecruitContextClick,
}: HomeSessionViewProps) {
  const { t } = useLocale()
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  /** 自动滚到底时忽略 scroll，避免误显滚动条 */
  const messagesScrollProgrammaticRef = useRef(false)
  const [planBlueprintCollapsed, setPlanBlueprintCollapsed] = useState(false)
  const [planBlueprintWidthPx, setPlanBlueprintWidthPx] = useState(initialPlanBlueprintWidthEstimatePx)
  const [planGridResizing, setPlanGridResizing] = useState(false)
  const planSplitGridRef = useRef<HTMLDivElement>(null)
  /** 首次展示分栏时用 3:4 算默认宽；草案消失后复位，下次再进入可重新按视口算默认 */
  const planBlueprintSplitRatioAppliedRef = useRef(false)
  const [blueprintToolList, setBlueprintToolList] = useState<string[]>([])
  const [rolePromptModalOpen, setRolePromptModalOpen] = useState(false)
  const [rolePromptDraft, setRolePromptDraft] = useState('')
  const [rolePromptBaseline, setRolePromptBaseline] = useState('')
  const rolePromptModalTitleId = useId()
  const rolePromptModalTextareaRef = useRef<HTMLTextAreaElement>(null)
  const showQuickReplies = Boolean(
    (mode === 'plan' && planFlowTurn && planFlowTurn !== 'done' && onQuickReply) ||
      (chatOnly && onQuickReply),
  )
  /** 助理处于「思考中」占位时：禁用发送（Plan 每条回复前的 2s 等） */
  const isAwaitingAssistantThink = useMemo(() => {
    const last = messages[messages.length - 1]
    return Boolean(
      last && last.role === 'assistant' && (last.isThinking || last.workflowPlannerTrace),
    )
  }, [messages])

  /** 父级链路上有 overflow:hidden 时 scrollIntoView 常滚不动本区；对实际 overflow 容器设 scrollTop */
  useLayoutEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    messagesScrollProgrammaticRef.current = true
    const pin = () => {
      el.scrollTop = el.scrollHeight
    }
    pin()
    requestAnimationFrame(pin)
    requestAnimationFrame(() => {
      messagesScrollProgrammaticRef.current = false
    })
  }, [messages, showPlanAgentCreationSequence])

  useEffect(() => {
    if (planAgentBlueprint) {
      setBlueprintToolList([...planAgentBlueprint.tools])
    }
  }, [planAgentBlueprint])

  useEffect(() => {
    if (!rolePromptModalOpen || !planAgentBlueprint) return
    const t = planAgentBlueprint.rolePrompt
    setRolePromptDraft(t)
    setRolePromptBaseline(t)
  }, [rolePromptModalOpen, planAgentBlueprint])

  useLayoutEffect(() => {
    if (!rolePromptModalOpen) return
    rolePromptModalTextareaRef.current?.focus()
  }, [rolePromptModalOpen])

  const rolePromptModalDirty = rolePromptDraft !== rolePromptBaseline

  /** 底部按钮移除后：关闭时若有改动则写入草案（等同原「保存」） */
  const finishRolePromptModal = useCallback(() => {
    if (rolePromptModalDirty && onPlanBlueprintRolePromptChange) {
      onPlanBlueprintRolePromptChange(rolePromptDraft)
    }
    setRolePromptModalOpen(false)
  }, [rolePromptModalDirty, onPlanBlueprintRolePromptChange, rolePromptDraft])

  useEffect(() => {
    if (!rolePromptModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishRolePromptModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rolePromptModalOpen, finishRolePromptModal])

  const clampPlanBlueprintWidth = useCallback((raw: number) => {
    const grid = planSplitGridRef.current
    if (!grid) {
      return Math.max(PLAN_BLUEPRINT_SPLIT_MIN_PX, raw)
    }
    const rect = grid.getBoundingClientRect()
    const maxW = rect.width - SESSION_SPLIT_RESIZER_PX - SESSION_SPLIT_MAIN_MIN_PX
    return Math.max(PLAN_BLUEPRINT_SPLIT_MIN_PX, Math.min(raw, Math.max(PLAN_BLUEPRINT_SPLIT_MIN_PX, maxW)))
  }, [])

  const hasBlueprintSplitLive =
    (mode === 'plan' || mode === 'build') && Boolean(planAgentBlueprint || planWorkflowBlueprint)

  useLayoutEffect(() => {
    if (!hasBlueprintSplitLive) {
      planBlueprintSplitRatioAppliedRef.current = false
      return
    }
    if (planBlueprintCollapsed) return
    const grid = planSplitGridRef.current
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    if (rect.width <= 0) return

    if (!planBlueprintSplitRatioAppliedRef.current) {
      const inner = rect.width - SESSION_SPLIT_RESIZER_PX
      const defaultW = Math.round((inner * PLAN_BLUEPRINT_RATIO_NUM) / PLAN_BLUEPRINT_RATIO_DEN)
      setPlanBlueprintWidthPx(clampPlanBlueprintWidth(defaultW))
      planBlueprintSplitRatioAppliedRef.current = true
      return
    }
    setPlanBlueprintWidthPx((prev) => clampPlanBlueprintWidth(prev))
  }, [hasBlueprintSplitLive, planBlueprintCollapsed, clampPlanBlueprintWidth])

  useEffect(() => {
    if (!hasBlueprintSplitLive || planBlueprintCollapsed) return
    const onResize = () => {
      setPlanBlueprintWidthPx((prev) => clampPlanBlueprintWidth(prev))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [hasBlueprintSplitLive, planBlueprintCollapsed, clampPlanBlueprintWidth])

  const handlePlanGridResizeMove = useCallback((clientX: number, startX: number, startW: number) => {
    const grid = planSplitGridRef.current
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    const maxW = rect.width - SESSION_SPLIT_RESIZER_PX - SESSION_SPLIT_MAIN_MIN_PX
    const next = Math.max(PLAN_BLUEPRINT_SPLIT_MIN_PX, Math.min(startW + (clientX - startX), maxW))
    setPlanBlueprintWidthPx(next)
  }, [])

  const handlePlanGridResizerMouseDown = (ev: React.MouseEvent) => {
    if (planBlueprintCollapsed) return
    ev.preventDefault()
    const startX = ev.clientX
    const startW = planBlueprintWidthPx
    setPlanGridResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (e: MouseEvent) => handlePlanGridResizeMove(e.clientX, startX, startW)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setPlanGridResizing(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handlePlanGridResizerTouchStart = (ev: React.TouchEvent) => {
    if (planBlueprintCollapsed) return
    if (ev.touches.length !== 1) return
    ev.preventDefault()
    const startX = ev.touches[0].clientX
    const startW = planBlueprintWidthPx
    setPlanGridResizing(true)
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      handlePlanGridResizeMove(e.touches[0].clientX, startX, startW)
    }
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
      setPlanGridResizing(false)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
  }

  const activeSessionWorkflow =
    selectedRunHistoryId != null ? SESSION_WORKFLOW_SCENARIOS[selectedRunHistoryId] : undefined
  const showScenarioSessionWorkflow = activeSessionWorkflow != null

  const messageList = showScenarioSessionWorkflow ? (
    <div className="manus-home-session-messages-inner manus-home-session-messages-inner--wf-steps">
      <HomeSessionExecutionFeed
        variant={activeSessionWorkflow.executionVariant}
        showScheduledKickoffPanel={
          selectedRunHistoryId !== 's1' &&
          selectedRunHistoryId !== 's6' &&
          selectedRunHistoryId !== 's7' &&
          selectedRunHistoryId !== 's3' &&
          selectedRunHistoryId !== 's4' &&
          selectedRunHistoryId !== 's5'
        }
        triggerSummaryKind={
          selectedRunHistoryId === 's1'
            ? 'chat'
            : selectedRunHistoryId === 's3' ||
                selectedRunHistoryId === 's4' ||
                selectedRunHistoryId === 's5' ||
                selectedRunHistoryId === 's7'
              ? 'form'
              : 'scheduled'
        }
        workflowTitle={activeSessionWorkflow.title}
        scenarioRunId={selectedRunHistoryId}
      />
      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  ) : (
    <div className="manus-home-session-messages-inner">
      {messages.map((m, i) => {
        const isLast = i === messages.length - 1
        const showChoiceChips =
          m.role === 'assistant' &&
          !m.isThinking &&
          isLast &&
          Boolean(m.choices?.length) &&
          showQuickReplies
        const gid = joyceMsgLogoGradId(m.id)
        const showPlanDetailQuiz = Boolean(
          m.planOnboardingDetailQuiz &&
            isLast &&
            mode === 'plan' &&
            planFlowTurn === 'awaitR1' &&
            onQuickReply &&
            !m.isThinking,
        )
        const planQuizUserAck =
          m.planOnboardingDetailQuiz && !showPlanDetailQuiz && messages[i + 1]?.role === 'user'
            ? parsePlanDetailQuizUserLine(messages[i + 1]!.text)
            : null
        const showWorkflowScopeQuiz = Boolean(
          m.planWorkflowQuiz === 'scope' &&
            isLast &&
            (mode === 'plan' || mode === 'build') &&
            planFlowTurn === 'awaitR1' &&
            onQuickReply &&
            !m.isThinking,
        )
        const showWorkflowCollabQuiz = Boolean(
          m.planWorkflowQuiz === 'collaboration' &&
            isLast &&
            (mode === 'plan' || mode === 'build') &&
            planFlowTurn === 'awaitR2' &&
            onQuickReply &&
            !m.isThinking,
        )
        const workflowQuizNextUser = messages[i + 1]
        const workflowQuizNextLine =
          m.planWorkflowQuiz && workflowQuizNextUser?.role === 'user' ? workflowQuizNextUser.text.trim() : ''
        const workflowQuizChoiceOk =
          Boolean(m.planWorkflowQuiz) &&
          workflowQuizNextLine.length > 0 &&
          (m.planWorkflowQuiz === 'scope'
            ? PLAN_WORKFLOW_SCOPE_CHOICE_LINES.includes(workflowQuizNextLine)
            : PLAN_WORKFLOW_COLLAB_CHOICE_LINES.includes(workflowQuizNextLine))
        const showWorkflowQuizArchive = Boolean(
          m.planWorkflowQuiz && !showWorkflowScopeQuiz && !showWorkflowCollabQuiz && workflowQuizChoiceOk,
        )
        const showPlanQuizArchive = Boolean(m.planOnboardingDetailQuiz && !showPlanDetailQuiz && planQuizUserAck)
        const bubblePlanQuizLayout =
          showPlanDetailQuiz ||
          showPlanQuizArchive ||
          showWorkflowScopeQuiz ||
          showWorkflowCollabQuiz ||
          showWorkflowQuizArchive
        if (m.role === 'user') {
          return (
            <div key={m.id} className="agents-ai-message-turn is-user">
              <div className="agents-ai-bubble is-user">{m.text}</div>
            </div>
          )
        }
        return (
          <div key={m.id} className="agents-ai-message-turn is-assistant manus-home-session-ai-turn" role="article">
            <div className="manus-home-session-ai-msg-sender">
              <span className="manus-home-session-ai-msg-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                  <defs>
                    <linearGradient id={gid} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#7ec8ff" />
                      <stop offset="100%" stopColor="#1e4fd8" />
                    </linearGradient>
                  </defs>
                  <rect x="1.5" y="1.5" width="21" height="21" rx="7" ry="7" fill={`url(#${gid})`} />
                  <polygon points="12,7.2 16.8,12 12,16.8 7.2,12" fill="#ffffff" />
                </svg>
              </span>
              <span className="manus-home-session-ai-msg-name">Joyce AI</span>
            </div>
            <div
              className={`agents-ai-bubble is-assistant${m.isThinking ? ' manus-home-session-ai-thinking' : ''}${
                !m.isThinking &&
                (m.richBubble === 'onboarding-workflow-created' ||
                  m.richBubble === 'plan-multi-agent-system-created' ||
                  m.richBubble === 'build-onboarding-flow-plan' ||
                  m.richBubble === 'build-onboarding-build-complete')
                  ? ` manus-home-session-assistant-bubble--rich${m.richBubble === 'plan-multi-agent-system-created' ? ' manus-home-session-assistant-bubble--plan-multi-agent' : ''}${m.richBubble === 'build-onboarding-flow-plan' ? ' manus-home-session-assistant-bubble--build-flow-plan' : ''}${m.richBubble === 'build-onboarding-build-complete' ? ' manus-home-session-assistant-bubble--build-complete' : ''}`
                  : ''
              }${m.buildIntroTrace ? ' manus-home-session-assistant-bubble--build-intro-trace' : ''}${
                m.workflowPlannerTrace ? ' manus-home-session-assistant-bubble--workflow-planner-trace' : ''
              }${bubblePlanQuizLayout ? ' manus-home-session-bubble--with-plan-quiz' : ''}`}
              role={m.isThinking ? 'status' : undefined}
              aria-label={m.isThinking ? 'Joyce 正在思考' : undefined}
            >
              {m.isThinking ? (
                <span className="manus-home-session-ai-thinking-line">
                  <span className="manus-home-session-ai-thinking-label">思考中</span>
                  <span className="manus-home-session-ai-thinking-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              ) : m.richBubble === 'onboarding-workflow-created' ? (
                <WorkflowCreatedAssistantCard />
              ) : m.richBubble === 'plan-multi-agent-system-created' ? (
                <PlanMultiAgentCreatedAssistantCard />
              ) : m.richBubble === 'build-onboarding-flow-plan' ? (
                <BuildOnboardingFlowPlanCard />
              ) : m.richBubble === 'build-onboarding-build-complete' ? (
                <BuildOnboardingBuildCompleteCard />
              ) : m.workflowPlannerTrace ? (
                onWorkflowPlannerTraceVanish ? (
                  <WorkflowPlannerTraceTyping
                    text={m.text}
                    messageId={m.id}
                    durationMs={workflowPlannerTraceTypingMs}
                    onVanish={onWorkflowPlannerTraceVanish}
                  />
                ) : (
                  <div className="manus-home-session-workflow-planner-trace-scroll">
                    <p className="manus-home-session-workflow-planner-trace">{m.text}</p>
                  </div>
                )
              ) : showWorkflowScopeQuiz ? (
                <>
                  <span className="manus-plan-detail-quiz-lead">{m.text}</span>
                  <PlanWorkflowQuizPanel
                    key={`wf-quiz-${m.id}`}
                    kind="scope"
                    disabled={Boolean(isAwaitingAssistantThink || sessionComposerLocked)}
                    onPick={(line) => onQuickReply?.(line)}
                  />
                </>
              ) : showWorkflowCollabQuiz ? (
                <>
                  <span className="manus-plan-detail-quiz-lead">{m.text}</span>
                  <PlanWorkflowQuizPanel
                    key={`wf-quiz-${m.id}`}
                    kind="collaboration"
                    disabled={Boolean(isAwaitingAssistantThink || sessionComposerLocked)}
                    onPick={(line) => onQuickReply?.(line)}
                  />
                </>
              ) : showWorkflowQuizArchive && workflowQuizNextLine ? (
                <>
                  <span className="manus-plan-detail-quiz-lead">{m.text}</span>
                  <div className="manus-plan-detail-quiz manus-plan-detail-quiz--archive" role="status">
                    <p className="manus-plan-detail-quiz-archive-skip-note">
                      <strong>{m.planWorkflowQuiz === 'scope' ? '已选范围' : '已选协作方式'}：</strong>
                      {workflowQuizNextLine}
                    </p>
                  </div>
                </>
              ) : showPlanDetailQuiz ? (
                <>
                  <span className="manus-plan-detail-quiz-lead">{m.text}</span>
                  <PlanOnboardingDetailQuizPanel
                    key={`quiz-${m.id}`}
                    disabled={Boolean(isAwaitingAssistantThink || sessionComposerLocked)}
                    onSkip={() => onQuickReply?.(`${PLAN_DETAIL_QUIZ_ACK_PREFIX}已跳过，使用默认推荐。`)}
                    onConfirm={(line) => onQuickReply?.(line)}
                  />
                </>
              ) : showPlanQuizArchive && planQuizUserAck ? (
                <>
                  <span className="manus-plan-detail-quiz-lead">{m.text}</span>
                  <PlanOnboardingDetailQuizArchive ack={planQuizUserAck} />
                </>
              ) : m.planOnboardingDetailQuiz ? (
                <span className="manus-plan-detail-quiz-lead">{m.text}</span>
              ) : m.planWorkflowQuiz ? (
                <span className="manus-plan-detail-quiz-lead">{m.text}</span>
              ) : m.buildIntroTrace ? (
                onBuildIntroTraceVanish ? (
                  <BuildIntroTraceTyping
                    text={m.text}
                    messageId={m.id}
                    durationMs={buildIntroTraceTypingMs}
                    onVanish={onBuildIntroTraceVanish}
                  />
                ) : (
                  <p className="manus-home-session-build-intro-trace">{m.text}</p>
                )
              ) : m.blueprintCreateButton && onPlanBlueprintCreate ? (
                <>
                  <p className="manus-home-session-assistant-hint-paragraph">{m.text}</p>
                  <div className="manus-home-session-blueprint-create-inline">
                    <button
                      type="button"
                      className="manus-plan-agent-blueprint-create-btn"
                      aria-label={m.blueprintCreateButton.ariaLabel ?? m.blueprintCreateButton.label}
                      title={m.blueprintCreateButton.label}
                      onClick={() => onPlanBlueprintCreate()}
                    >
                      {m.blueprintCreateButton.label}
                    </button>
                  </div>
                </>
              ) : (
                m.text
              )}
            </div>
            {showChoiceChips ? (
              <div className="agents-ai-choice-chips" role="group" aria-label="可选方案">
                {m.choices!.map((label) => (
                  <button key={label} type="button" className="agents-ai-choice-chip" onClick={() => onQuickReply!(label)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
      {showPlanAgentCreationSequence && onPlanAgentCreationComplete ? (
        <PlanAgentCreationSequence active={showPlanAgentCreationSequence} onComplete={onPlanAgentCreationComplete} />
      ) : null}
      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  )

  const messagesOnly = (
    <div className="manus-home-session-chat">
      <div className="manus-home-session-messages-wrap">
        <div ref={messagesScrollRef} className="manus-home-session-messages" role="log" aria-live="polite">
          <div className="manus-home-session-messages-dialog">{messageList}</div>
        </div>
      </div>
    </div>
  )

  const composerBlock = (
    <div className="manus-home-session-composer-outer composer composer--home-session">
      <div className="composer-surface composer-surface--home-session">
        <label className="sr-only" htmlFor="home-session-composer-input">
          继续对话
        </label>
        <div className="composer-input-wrap">
          <textarea
            ref={sessionComposerInputRef}
            id="home-session-composer-input"
            className="composer-input composer-input--home-session"
            rows={1}
            placeholder={inputPlaceholder ?? '您可以提问任何问题，输入 @ 可以提及并使用任何资源'}
            value={buildAiInput}
            disabled={isAwaitingAssistantThink || sessionComposerLocked}
            onChange={(e) => setBuildAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!isAwaitingAssistantThink && !sessionComposerLocked && buildAiInput.trim()) onSend()
              }
            }}
            aria-label={chatOnly ? '对话输入' : mode === 'plan' ? 'Plan Mode 对话输入' : 'Build Mode 对话输入'}
          />
          <button
            className="composer-send"
            type="button"
            aria-label="发送"
            title="发送"
            disabled={!buildAiInput.trim() || isAwaitingAssistantThink || sessionComposerLocked}
            onClick={() => {
              if (buildAiInput.trim() && !isAwaitingAssistantThink && !sessionComposerLocked) onSend()
            }}
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
            className={`composer-voice${composerVoiceListening ? ' composer-voice--listening' : ''}`}
            type="button"
            aria-label={composerVoiceListening ? '停止语音输入' : '语音输入'}
            aria-pressed={composerVoiceListening}
            disabled={isAwaitingAssistantThink || sessionComposerLocked}
            title={composerVoiceListening ? '点击结束识别' : '点击开始语音输入（再次点击结束）'}
            onClick={onComposerVoiceClick}
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
  )

  const hasPlanBlueprintSide = Boolean(planAgentBlueprint || planWorkflowBlueprint)

  const blueprintPanelTitle =
    (planWorkflowBlueprint?.name ?? planAgentBlueprint?.name ?? '').trim() ||
    (planWorkflowBlueprint ? '新员工入职自动化工作流' : '新员工入职专家')

  const composerBand = (
    <div className="manus-home-session-composer-band">
      {composerBlock}
      {chatOnly && onUserRecruitContextClick ? (
        <div className="manus-home-session-onboard-actions home-user-context-actions">
          <button
            type="button"
            className="manus-home-session-onboard-pill home-user-context-tag"
            onClick={onUserRecruitContextClick}
          >
            {t('userRecruitContextTag')}
          </button>
        </div>
      ) : null}
    </div>
  )

  /** s1 工作流主区页：不展示底部输入条 */
  const sessionFooterComposer = showScenarioSessionWorkflow ? null : composerBand

  /**
   * Plan / Build：草案就绪后左侧均为同一套「入职管家草案」侧栏，分割条与折叠、创建及工作流步骤行为一致。
   */
  const body =
    (mode === 'plan' || mode === 'build') && hasPlanBlueprintSide ? (
      <div className="manus-home-session-split">
        <div
          ref={planSplitGridRef}
          className={`manus-home-session-grid${planBlueprintCollapsed ? ' manus-home-session-grid--blueprint-collapsed' : ''}${planGridResizing ? ' manus-home-session-grid--session-split-resizing' : ''}`}
          style={
            planBlueprintCollapsed
              ? undefined
              : {
                  gridTemplateColumns: `${planBlueprintWidthPx}px ${SESSION_SPLIT_RESIZER_PX}px minmax(0, 1fr)`,
                }
          }
        >
          <aside className="manus-home-session-side" aria-label={blueprintPanelTitle}>
            <div className="manus-plan-agent-blueprint" aria-label={blueprintPanelTitle}>
              <div className="manus-plan-agent-blueprint-inner">
                <div className="manus-plan-agent-blueprint-inner-scroll">
                  <div
                    className={`manus-plan-agent-blueprint-header${planWorkflowBlueprint ? ' manus-plan-agent-blueprint-header--workflow' : ''}`}
                  >
                    {planWorkflowBlueprint ? (
                      <>
                        <div className="manus-wf-blueprint-header-titles">
                          <h2 className="manus-plan-agent-blueprint-title" id="manus-plan-agent-blueprint-heading">
                            {blueprintPanelTitle}
                          </h2>
                        </div>
                        <button
                          type="button"
                          className="manus-plan-agent-blueprint-fold-btn"
                          aria-expanded={!planBlueprintCollapsed}
                          aria-controls="manus-plan-agent-blueprint-panel"
                          aria-label={
                            planBlueprintCollapsed ? `展开${blueprintPanelTitle}` : `折叠${blueprintPanelTitle}`
                          }
                          title={
                            planBlueprintCollapsed ? `展开${blueprintPanelTitle}` : `折叠${blueprintPanelTitle}`
                          }
                          onClick={() => setPlanBlueprintCollapsed((c) => !c)}
                        >
                          <svg
                            className="manus-plan-agent-blueprint-fold-icon"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            aria-hidden="true"
                            focusable="false"
                          >
                            {planBlueprintCollapsed ? (
                              <path
                                d="M11 7l4 5-4 5M5 7l4 5-4 5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : (
                              <path
                                d="M13 7l-4 5 4 5M19 7l-4 5 4 5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="manus-plan-agent-blueprint-title" id="manus-plan-agent-blueprint-heading">
                          {blueprintPanelTitle}
                        </h2>
                        <button
                          type="button"
                          className="manus-plan-agent-blueprint-fold-btn"
                          aria-expanded={!planBlueprintCollapsed}
                          aria-controls="manus-plan-agent-blueprint-panel"
                          aria-label={
                            planBlueprintCollapsed ? `展开${blueprintPanelTitle}` : `向左折叠${blueprintPanelTitle}`
                          }
                          title={
                            planBlueprintCollapsed ? `展开${blueprintPanelTitle}` : `向左折叠${blueprintPanelTitle}`
                          }
                          onClick={() => setPlanBlueprintCollapsed((c) => !c)}
                        >
                          <svg
                            className="manus-plan-agent-blueprint-fold-icon"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            aria-hidden="true"
                            focusable="false"
                          >
                            {planBlueprintCollapsed ? (
                              <path
                                d="M11 7l4 5-4 5M5 7l4 5-4 5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : (
                              <path
                                d="M13 7l-4 5 4 5M19 7l-4 5 4 5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <div
                    id="manus-plan-agent-blueprint-panel"
                    className="manus-plan-agent-blueprint-panel"
                    hidden={planBlueprintCollapsed}
                  >
                  <div className="manus-plan-agent-blueprint-panel-layout">
                    {planWorkflowBlueprint ? (
                      <WfBlueprintStepsBlock
                        steps={planWorkflowBlueprint.steps}
                        hideTaskStatusIcons
                        showTaskBulletMarkers
                      />
                    ) : null}
                    {planAgentBlueprint ? (
                    <>
                    <dl className="manus-plan-agent-blueprint-dl manus-plan-agent-blueprint-dl--upper">
                      <dt>名称</dt>
                      <dd>
                        {onPlanBlueprintNameChange ? (
                          <input
                            type="text"
                            className="manus-plan-agent-blueprint-field-input"
                            aria-label="智能体名称"
                            value={planAgentBlueprint.name}
                            onChange={(e) => onPlanBlueprintNameChange(e.target.value)}
                          />
                        ) : (
                          planAgentBlueprint.name
                        )}
                      </dd>
                      <dt>角色</dt>
                      <dd>
                        {onPlanBlueprintRoleChange ? (
                          <textarea
                            className="manus-plan-agent-blueprint-field-input manus-plan-agent-blueprint-field-input--textarea"
                            aria-label="角色描述"
                            rows={2}
                            value={planAgentBlueprint.role}
                            onChange={(e) => onPlanBlueprintRoleChange(e.target.value)}
                          />
                        ) : (
                          planAgentBlueprint.role
                        )}
                      </dd>
                      <dt>角色提示词</dt>
                      <dd className="manus-plan-agent-blueprint-prompt-dd">
                        <div className="manus-plan-agent-blueprint-prompt-wrap">
                          {onPlanBlueprintRolePromptChange ? (
                            <button
                              type="button"
                              className="manus-plan-agent-blueprint-prompt-expand-btn"
                              aria-label="展开查看完整角色提示词"
                              title="展开查看全文"
                              onClick={() => setRolePromptModalOpen(true)}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                <path
                                  d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          ) : null}
                          <pre className="manus-plan-agent-blueprint-prompt">{planAgentBlueprint.rolePrompt}</pre>
                        </div>
                        {rolePromptModalOpen && planAgentBlueprint && onPlanBlueprintRolePromptChange
                          ? createPortal(
                              <div className="manus-plan-prompt-modal-root">
                                <button
                                  type="button"
                                  className="manus-plan-prompt-modal-backdrop"
                                  aria-label="关闭"
                                  onClick={finishRolePromptModal}
                                />
                                <div
                                  className="manus-plan-prompt-modal-panel"
                                  role="dialog"
                                  aria-modal="true"
                                  aria-labelledby={rolePromptModalTitleId}
                                >
                                  <div className="manus-plan-prompt-modal-head">
                                    <h2 id={rolePromptModalTitleId} className="manus-plan-prompt-modal-title">
                                      角色提示词
                                    </h2>
                                    <button
                                      type="button"
                                      className="manus-plan-prompt-modal-close"
                                      aria-label="关闭"
                                      onClick={finishRolePromptModal}
                                    >
                                      <span aria-hidden="true">×</span>
                                    </button>
                                  </div>
                                  <div className="manus-plan-prompt-modal-body">
                                    <textarea
                                      ref={rolePromptModalTextareaRef}
                                      className="manus-plan-prompt-modal-textarea"
                                      value={rolePromptDraft}
                                      onChange={(e) => setRolePromptDraft(e.target.value)}
                                      aria-label="角色提示词正文"
                                      spellCheck={false}
                                      rows={22}
                                    />
                                  </div>
                                </div>
                              </div>,
                              document.body,
                            )
                          : null}
                      </dd>
                    </dl>
                    <div className="manus-plan-agent-blueprint-scroll">
                      <dl className="manus-plan-agent-blueprint-dl manus-plan-agent-blueprint-dl--lower">
                        <dt
                          className="manus-plan-agent-blueprint-subagents-dt"
                          aria-label={`子 Agent，共 ${(planAgentBlueprint.subAgents ?? PLAN_AGENT_BLUEPRINT_FALLBACK_SUB_AGENTS).length} 个子代理`}
                        >
                          <span className="manus-plan-agent-blueprint-subagents-dt-label">子 Agent</span>
                          <span className="manus-plan-agent-blueprint-subagents-dt-count">
                            {(planAgentBlueprint.subAgents ?? PLAN_AGENT_BLUEPRINT_FALLBACK_SUB_AGENTS).length}{' '}
                            个子代理
                          </span>
                        </dt>
                        <dd className="manus-plan-agent-blueprint-subagents-dd">
                          <ul
                            className="manus-plan-agent-blueprint-subagent-list"
                            aria-label="编排内子 Agent 与职责"
                          >
                            {(planAgentBlueprint.subAgents ?? PLAN_AGENT_BLUEPRINT_FALLBACK_SUB_AGENTS).map(
                              (a) => {
                                const agentOrigin = wfAssignedAgentOriginTag(a.name)
                                const agentOriginLabel = agentOrigin === 'new' ? 'new' : '原有'
                                const agentOriginHint =
                                  agentOrigin === 'new'
                                    ? '该 Agent 为本流程中新创建的（演示）'
                                    : '该 Agent 引用已存在的配置（演示）'
                                return (
                                  <li key={a.name} className="manus-plan-agent-blueprint-subagent-item">
                                    <div className="manus-plan-agent-blueprint-subagent-name-row">
                                      <span className="manus-plan-agent-blueprint-subagent-name">{a.name}</span>
                                      <span
                                        className={`manus-wf-assign-card-origin manus-wf-assign-card-origin--${agentOrigin}`}
                                        title={agentOriginHint}
                                        aria-label={agentOriginHint}
                                      >
                                        {agentOriginLabel}
                                      </span>
                                    </div>
                                    <span className="manus-plan-agent-blueprint-subagent-desc">{a.description}</span>
                                  </li>
                                )
                              },
                            )}
                          </ul>
                        </dd>
                        <dt className="manus-plan-agent-blueprint-tools-dt">
                          <span className="manus-plan-agent-blueprint-tools-dt-label">使用的工具</span>
                        </dt>
                        <dd className="manus-plan-agent-blueprint-tools-dd">
                          <ul className="manus-plan-agent-blueprint-tags manus-plan-agent-blueprint-tags--tools">
                            {blueprintToolList.map((t) => (
                              <li key={t}>
                                <span className="manus-plan-agent-blueprint-tool-icon">
                                  <PlanBlueprintToolIcon label={t} />
                                </span>
                                <span className="manus-plan-agent-blueprint-tool-label">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </dl>
                    </div>
                  </>
                  ) : null}
                  </div>
                </div>
                </div>
                <div className="manus-plan-agent-blueprint-footer">
                  <div className="manus-plan-agent-blueprint-footer-actions">
                    {planWorkflowBlueprint ? (
                      <button
                        type="button"
                        className="manus-plan-agent-blueprint-create-btn"
                        aria-label="创建"
                        title="创建"
                        onClick={() => onPlanBlueprintCreate?.()}
                      >
                        创建
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="manus-plan-agent-blueprint-create-btn"
                        aria-label="创建"
                        title="创建"
                        onClick={() => onPlanBlueprintCreate?.()}
                      >
                        创建
                      </button>
                    )}
                  </div>
                </div>
            </div>
            </div>
          </aside>
          {planBlueprintCollapsed ? null : (
            <div
              className="manus-home-session-grid-resizer"
              role="separator"
              aria-orientation="vertical"
              aria-label="拖动调整入职管家草案与 AI 对话区宽度"
              title="拖动调整草案与对话区宽度"
              onMouseDown={handlePlanGridResizerMouseDown}
              onTouchStart={handlePlanGridResizerTouchStart}
            />
          )}
          <div className="manus-home-session-main-column">
            {messagesOnly}
            {sessionFooterComposer}
          </div>
        </div>
      </div>
    ) : (
      <div className="manus-home-session-solo">
        {messagesOnly}
        {sessionFooterComposer}
      </div>
    )

  return (
    <section className="manus-home-session" aria-label="对话">
      {activeSessionWorkflow ? (
        <header className="manus-home-session-head">
          <button type="button" className="agents-joyce-main-chat-back" aria-label="返回首页" title="返回首页" onClick={onBack}>
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
          <h1 className="manus-home-session-head__title">{activeSessionWorkflow.title}</h1>
        </header>
      ) : null}
      <div className="manus-home-session-body">{body}</div>
    </section>
  )
}
