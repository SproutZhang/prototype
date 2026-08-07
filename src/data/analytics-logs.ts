/**
 * 分析页 mock 日志数据。
 *
 * - 数据在模块加载时一次性生成，使用确定性伪随机数（seeded LCG），刷新页面后内容保持稳定，
 *   便于演示与筛选交互的可复现性。
 * - 数据时间跨度覆盖最近 13 个月，按月为每个场景 × Agent 生成稳定大批量运行记录，
 *   模拟大型企业用量（每月数千次运行、百万级 Token），各月图表不会出现空柱或极低值。
 */

export type AnalyticsRunStatus = 'success' | 'error' | 'warning'

export type AnalyticsRunType = 'chat' | 'workflow' | 'agent' | 'tool'

/** 演示用：与场景中「已创建工作流」对应的标识，供分析页按流程筛选 */
const WORKFLOW_DEFS: { id: string; name: string }[] = [
  { id: 'wf-onboarding', name: '员工入职引导' },
  { id: 'wf-contract', name: '合同审批流' },
  { id: 'wf-support', name: '客服工单' },
  { id: 'wf-data-sync', name: '数据同步巡检' },
  { id: 'wf-release', name: '研发发布检查单' },
]

export const ANALYTICS_WORKFLOWS: readonly { id: string; name: string }[] = WORKFLOW_DEFS

const WORKFLOW_IDS = WORKFLOW_DEFS.map((w) => w.id)

/** 演示用场景，供分析页「按场景」筛选 */
const SCENARIO_DEFS: { id: string; name: string }[] = [
  { id: 'sc-onboard', name: '新员工入职场景' },
  { id: 'sc-sales', name: '销售线索跟进' },
  { id: 'sc-support', name: '客户支持工单' },
  { id: 'sc-compliance', name: '合规审查' },
  { id: 'sc-ops', name: '运营活动编排' },
]

export const ANALYTICS_SCENARIOS: readonly { id: string; name: string }[] = SCENARIO_DEFS

const SCENARIO_IDS = SCENARIO_DEFS.map((s) => s.id)

/** 演示用 Agent，供分析页「按 Agent」筛选 */
const AGENT_DEFS: { id: string; name: string }[] = [
  { id: 'ag-coach', name: '培训协调 Agent' },
  { id: 'ag-audit', name: '审核与确认 Agent' },
  { id: 'ag-data', name: '数据汇总 Agent' },
  { id: 'ag-research', name: '调研分析 Agent' },
  { id: 'ag-write', name: '文案生成 Agent' },
  { id: 'ag-sched', name: '日程编排 Agent' },
]

export const ANALYTICS_AGENTS: readonly { id: string; name: string }[] = AGENT_DEFS

/** 总代理 → 子代理编排关系（演示用） */
export const ANALYTICS_AGENT_SUB_AGENTS: Record<string, readonly string[]> = {
  'ag-coach': ['ag-audit', 'ag-data', 'ag-sched'],
  'ag-research': ['ag-write'],
}

export function getAnalyticsSubAgentIds(parentId: string): readonly string[] {
  return ANALYTICS_AGENT_SUB_AGENTS[parentId] ?? []
}

export function getAnalyticsParentAgentId(agentId: string): string | null {
  for (const [parentId, subs] of Object.entries(ANALYTICS_AGENT_SUB_AGENTS)) {
    if (subs.includes(agentId)) return parentId
  }
  return null
}

/** 选定总代理时，分析范围包含其下所有子代理 */
export function resolveAnalyticsAgentScopeIds(scopeAgentId: string): readonly string[] {
  if (scopeAgentId === 'all') return []
  const subs = getAnalyticsSubAgentIds(scopeAgentId)
  return subs.length > 0 ? [scopeAgentId, ...subs] : [scopeAgentId]
}

function resolveEffectiveAgentId(parentSlot: string, rowIndex: number): string {
  const subs = ANALYTICS_AGENT_SUB_AGENTS[parentSlot]
  if (!subs?.length) return parentSlot
  /** 约 1/5 由总代理直接执行，其余分派给子代理 */
  if (rowIndex % 5 === 0) return parentSlot
  return subs[(rowIndex + Math.floor(rowIndex / 6)) % subs.length]
}

const AGENT_IDS = AGENT_DEFS.map((a) => a.id)

export interface AnalyticsLogRow {
  id: string
  runId: string
  conversationId: string
  /** 所属场景（演示数据按行轮询分配，便于按场景筛选总有样本） */
  scenarioId: string
  /** 关联 Agent（演示数据按行轮询分配，便于按 Agent 筛选总有样本） */
  agentId: string
  /** 所属工作流（演示数据按行轮询分配） */
  workflowId: string
  /** ISO 字符串，含时区信息（本地时区） */
  createdAt: string
  status: AnalyticsRunStatus
  runType: AnalyticsRunType
  input: string
  output: string
  feedback: '' | '👍' | '👎' | string
  llm: string
  /** 延迟，单位毫秒 */
  latencyMs: number
  inputTokens: number
  outputTokens: number
  user: string
  ranBy: string
  parentRun: string
  error: string
}

/** 大型企业演示：错误率约 2%（≤3%），警告约 4% */
function sampleEnterpriseStatus(rnd: () => number): AnalyticsRunStatus {
  const roll = rnd()
  if (roll < 0.02) return 'error'
  if (roll < 0.06) return 'warning'
  return 'success'
}

const RUN_TYPES: AnalyticsRunType[] = ['chat', 'workflow', 'agent', 'tool']
const LLMS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3.5-sonnet',
  'claude-3-opus',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'qwen-max',
  'deepseek-v3',
]
const USERS = [
  'liujing@infosysaai.com',
  'wangmin@infosysaai.com',
  'zhaolei@infosysaai.com',
  'chenxi@infosysaai.com',
  'sunyu@infosysaai.com',
  'lihua@infosysaai.com',
  'zhouyang@infosysaai.com',
  'huangkai@infosysaai.com',
]
const RAN_BY = ['UI', 'API', 'Schedule', 'Webhook']

const INPUT_SAMPLES = [
  '帮我总结一下昨天的会议纪要',
  '把这段销售数据按地区分组并给出洞察',
  '生成一封感谢客户的邮件，语气专业一些',
  '从 PDF 中抽取所有合同关键条款',
  '把以下英文翻译成中文，保留专业术语',
  '分析这条订单的退款原因，并给出建议',
  '查询用户 ID 是 9182 的最近 30 天活跃情况',
  '画一个用户旅程图，覆盖注册到下单',
  '校对这段代码并指出潜在 bug',
  '基于历史数据预测下个月的库存需求',
  '把这份产品规格拆解成 PRD 大纲',
  '总结竞品最近 3 个月的功能更新',
]

const OUTPUT_SAMPLES = [
  '已生成会议纪要摘要，共 5 点关键结论。',
  '按地区聚合后输出销售对比表，华东增长 12%。',
  '邮件已起草，主题：感谢您的持续支持。',
  '已抽取 9 条核心条款，其中 3 条涉及违约责任。',
  '翻译完成，已保留 7 个专业术语原文。',
  '识别为发货延迟导致，建议给予部分补偿。',
  '用户活跃 22 天，平均会话时长 6.2 分钟。',
  '已绘制 5 阶段用户旅程图，关键流失点在支付环节。',
  '发现 2 个潜在空指针风险，已给出修复建议。',
  '预测下个月库存需求约 1.4 万件，建议补货 3000 件。',
  '已生成 PRD 大纲，包含目标、用户故事、验收标准。',
  '竞品共上线 11 个新功能，集中在协作能力。',
]

const ERROR_SAMPLES = [
  'RateLimitError: model is over capacity, retry later',
  'ToolTimeout: HTTP request exceeded 30s',
  'ValidationError: required field "user_id" missing',
  'AuthError: provider api key expired',
  'ParseError: cannot parse JSON from agent output',
  'NetworkError: failed to connect to upstream',
]

const FEEDBACK_OPTIONS: AnalyticsLogRow['feedback'][] = ['', '', '', '', '👍', '👍', '👎']

/** 简单可重复的伪随机数生成器，避免每次刷新数据跳动 */
function createPrng(seed: number) {
  let state = seed >>> 0
  return function next(): number {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function pick<T>(arr: T[], rnd: number): T {
  return arr[Math.floor(rnd * arr.length) % arr.length]
}

function shortId(rnd: number, len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(rnd * 1_000_000 + i * 17) % chars.length]
  }
  return out
}

/** 演示用：短耗时居多（<0.5s / 0.5–1s / 1–2s 约占 90%） */
function sampleDemoLatencyMs(rnd: () => number): number {
  const roll = rnd()
  if (roll < 0.4) return 120 + Math.floor(rnd() * 380)
  if (roll < 0.7) return 500 + Math.floor(rnd() * 500)
  if (roll < 0.9) return 1000 + Math.floor(rnd() * 1000)
  if (roll < 0.97) return 2000 + Math.floor(rnd() * 3000)
  return 5000 + Math.floor(rnd() * 4500)
}

function createLogRow(
  index: number,
  scenarioId: string,
  agentId: string,
  workflowId: string,
  created: Date,
  rnd: () => number,
  overrides?: Partial<Pick<AnalyticsLogRow, 'status' | 'runType'>>,
): AnalyticsLogRow {
  const status = overrides?.status ?? sampleEnterpriseStatus(rnd)
  const runType = overrides?.runType ?? pick(RUN_TYPES, rnd())
  const llm = pick(LLMS, rnd())
  const user = pick(USERS, rnd())
  const inputTokens = 1200 + Math.floor(rnd() * 15000)
  const outputTokens = 600 + Math.floor(rnd() * 9000)
  const latencyMs = sampleDemoLatencyMs(rnd)
  const isError = status === 'error'

  return {
    id: `r-${index + 1}`,
    runId: `run_${shortId(rnd(), 10)}`,
    conversationId: `conv_${shortId(rnd(), 8)}`,
    scenarioId,
    agentId,
    workflowId,
    createdAt: created.toISOString(),
    status,
    runType,
    input: pick(INPUT_SAMPLES, rnd()),
    output: isError ? '' : pick(OUTPUT_SAMPLES, rnd()),
    feedback: pick(FEEDBACK_OPTIONS, rnd()),
    llm,
    latencyMs,
    inputTokens,
    outputTokens,
    user,
    ranBy: pick(RAN_BY, rnd()),
    parentRun: rnd() > 0.75 ? `run_${shortId(rnd(), 10)}` : '',
    error: isError ? pick(ERROR_SAMPLES, rnd()) : '',
  }
}

function getWeekRange(now: Date): { weekStart: Date; fromMonday: number } {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = todayStart.getDay()
  const fromMonday = dow === 0 ? 6 : dow - 1
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - fromMonday)
  return { weekStart, fromMonday }
}

function isInCurrentWeek(iso: string, weekStart: Date, now: Date): boolean {
  const d = new Date(iso)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return d >= weekStart && d <= end
}

/** 保证每个场景 × 每个 Agent 在本周至少有运行记录，避免筛选后页面空白 */
function ensureScenarioAgentCoverage(rows: AnalyticsLogRow[], now: Date, rnd: () => number): void {
  const { weekStart, fromMonday } = getWeekRange(now)
  let synthIndex = rows.length

  for (let si = 0; si < SCENARIO_IDS.length; si += 1) {
    for (let ai = 0; ai < AGENT_IDS.length; ai += 1) {
      const scenarioId = SCENARIO_IDS[si]
      const agentId = AGENT_IDS[ai]
      const workflowId = WORKFLOW_IDS[(si + ai) % WORKFLOW_IDS.length]

      const weekRows = rows.filter(
        (r) =>
          r.scenarioId === scenarioId &&
          r.agentId === agentId &&
          isInCurrentWeek(r.createdAt, weekStart, now),
      )

      const targets = Math.max(0, 2 - weekRows.length)
      for (let t = 0; t < targets; t += 1) {
        const dayOffset = (si + ai + t) % (fromMonday + 1)
        const created = new Date(weekStart)
        created.setDate(weekStart.getDate() + dayOffset)
        created.setHours(9 + ((ai + t) % 5), (si * 11 + t * 17) % 60, 0, 0)
        rows.push(
          createLogRow(synthIndex, scenarioId, agentId, workflowId, created, rnd, {
            status: 'success',
            runType: t === 0 || ai % 2 === 0 ? 'tool' : 'agent',
          }),
        )
        synthIndex += 1
      }
    }
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function buildLogs(): AnalyticsLogRow[] {
  const rnd = createPrng(20260512)
  const rows: AnalyticsLogRow[] = []
  const now = new Date()

  /** 大型企业演示：覆盖最近 13 个自然月，每月各场景 × 各 Agent 均有稳定运行量 */
  const MONTHS_BACK = 13
  /** 每个场景 × Agent 组合在每月的最少 / 最多运行次数 */
  const MIN_RUNS_PER_CELL = 14
  const MAX_RUNS_EXTRA_PER_CELL = 16
  /** 越近的月份略高，体现业务增长 */
  const RECENT_MONTH_BOOST = 0.22

  let index = 0

  for (let monthOffset = MONTHS_BACK - 1; monthOffset >= 0; monthOffset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const dim = daysInMonth(year, month)
    const recency = (MONTHS_BACK - 1 - monthOffset) / Math.max(1, MONTHS_BACK - 1)
    const volumeScale = 1 + recency * RECENT_MONTH_BOOST

    for (let si = 0; si < SCENARIO_IDS.length; si += 1) {
      for (let ai = 0; ai < AGENT_IDS.length; ai += 1) {
        const scenarioId = SCENARIO_IDS[si]
        const agentId = resolveEffectiveAgentId(AGENT_IDS[ai], index)
        const workflowId = WORKFLOW_IDS[(si + ai) % WORKFLOW_IDS.length]
        const cellRuns = Math.max(
          MIN_RUNS_PER_CELL,
          Math.floor((MIN_RUNS_PER_CELL + Math.floor(rnd() * MAX_RUNS_EXTRA_PER_CELL)) * volumeScale),
        )

        for (let j = 0; j < cellRuns; j += 1) {
          const day = 1 + Math.floor(rnd() * dim)
          const created = new Date(year, month, day)
          created.setHours(
            7 + Math.floor(rnd() * 14),
            Math.floor(rnd() * 60),
            Math.floor(rnd() * 60),
            0,
          )
          if (monthOffset === 0 && created > now) {
            created.setTime(now.getTime() - Math.floor(rnd() * 36e5))
          }

          rows.push(createLogRow(index, scenarioId, agentId, workflowId, created, rnd))
          index += 1
        }
      }
    }
  }

  ensureScenarioAgentCoverage(rows, now, rnd)

  /** 按时间倒序，最近的在前 */
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return rows
}

export const ANALYTICS_LOG_ROWS: AnalyticsLogRow[] = buildLogs()

export const ANALYTICS_STATUS_OPTIONS: { value: AnalyticsRunStatus; label: string }[] = [
  { value: 'success', label: '成功' },
  { value: 'warning', label: '警告' },
  { value: 'error', label: '错误' },
]

export const ANALYTICS_RUN_TYPE_OPTIONS: { value: AnalyticsRunType; label: string }[] = [
  { value: 'chat', label: 'Chat' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'agent', label: 'Agent' },
  { value: 'tool', label: 'Tool' },
]

export const ANALYTICS_LLM_OPTIONS: { value: string; label: string }[] = LLMS.map((m) => ({
  value: m,
  label: m,
}))
