import type { AppLocale } from './homeStrings'
import type { AnalyticsLogRow, AnalyticsRunStatus, AnalyticsRunType } from '../data/analytics-logs'

export type AnalyticsPresetKey = 'wtd' | 'mtd' | 'qtd' | 'ytd' | 'all'

export type MetricId = 'runs' | 'agents' | 'tokens' | 'errors' | 'avgLatency'

export type AgentScopedMetricId = 'taskVolume' | 'activeAgents' | 'tokens' | 'successRate' | 'errorRate'

export type DisplayMetricId = MetricId | AgentScopedMetricId

type BucketGranularity = 'hour' | 'day' | 'month'

const STRINGS = {
  zh: {
    pageTitle: '分析',
    taglineAria: '运行指标、调用日志、Token 用量、运营洞察',
    taglineRuns: '运行指标',
    taglineLogs: '调用日志',
    taglineTokens: 'Token 用量',
    taglineInsights: '运营洞察',
    scopeScenario: '场景',
    scopeAgent: 'Agent',
    allScenarios: '全部场景',
    allAgents: '全部 Agent',
    selectScenario: '选择场景',
    selectAgent: '选择 Agent',
    scopeBarDesc:
      '可单独筛选场景或 Agent，也可组合筛选（取交集）。仅选场景查看该场景下全部 Agent；仅选 Agent 查看其在全部场景中的跨场景运行。',
    scopeBarAria: '分析范围：{summary}',
    scopeSummaryAll: '全部场景 · 全部 Agent',
    scopeSummaryScenarioOnly: '{scenario}（该场景下全部 Agent）',
    scopeSummaryAgentOnly: '{agent}（跨全部场景）',
    scopeSummaryBoth: '{scenario} · {agent}',
    scopeHintAll: '当前范围：全部场景与全部 Agent。下方时间、指标与日志均基于此汇总。',
    scopeHintScenario: '当前范围：{scenario} 场景下的全部 Agent。',
    scopeHintAgent: '当前范围：{agent} 在全部场景中的跨场景运行。',
    scopeHintBoth: '当前范围：{scenario} 场景中的 {agent}。',
    scopeHint: '下方时间、指标与日志均基于：{summary}。',
    toolbarAria: '分析操作（{summary}）',
    rangePresetAria: '快捷预设：{label}',
    rangeMenuAria: '时间范围',
    rangePresetsListAria: '快捷预设',
    dateRangeGroupAria: '起止日期',
    startDate: '开始日期',
    endDate: '结束日期',
    customRangeLabel: '自定义',
    customRangeAria: '自定义日期范围，点击展开起止日期',
    exportCsvTitle: '导出当前列表为 CSV（{summary}，{start}～{end}）',
    csvFilenamePrefix: '分析日志',
    toolbarDownload: '下载',
    toolbarDownloadAria: '下载当前分析数据',
    toolbarEdit: '编辑',
    toolbarEditAria: '编辑分析视图',
    toolbarSave: '保存',
    toolbarSaveAria: '保存当前分析配置',
    toolbarReport: '报告',
    toolbarReportAria: '查看分析报告',
    toolbarUpdatedAt: '更新时间',
    toolbarComponentCount: '组件数',
    toolbarExecutionCount: '执行次数',
    toolbarMetaAria: '分析数据摘要',
    metricsOverviewAria: '指标概览',
    metricInfoAria: '{label}：查看指标说明',
    peakTitle: '{time} 达峰值 {value}{unit}',
    peakLabel: '峰值 {time} · {value}{unit}',
    noActivity: '无活动',
    sparkEmpty: '暂无数据',
    logsHeading: '运行日志',
    logsTotal: '共 {count} 条',
    filtersActive: '{count} 个筛选生效',
    filterBtn: '筛选',
    columnsBtn: '列',
    columnsMenuAria: '切换列显示',
    keepOneColumn: '至少保留 1 列',
    hideColumn: '点击隐藏该列',
    showColumn: '点击显示该列',
    filterMenuAria: '日志筛选',
    filterTitle: '筛选条件',
    clearAllFilters: '全部清除',
    filterStatus: '状态',
    filterRunType: '运行类型',
    filterLlm: 'AI 模型',
    searchPopoverAria: '列搜索',
    searchPlaceholder: '搜索 {column}',
    searchClear: '清除',
    searchDone: '完成',
    searchColumnAria: '搜索 {column}',
    statusAllHeader: '全部状态',
    statusHeaderNarrowed: '已按状态收窄；可在「筛选」中恢复为全部',
    statusHeaderDefault: '默认展示成功、警告、错误等全部状态；可在「筛选」中收窄',
    logsEmpty: '无结果。请尝试放宽时间范围或清除筛选。',
    logsShowingZero: '显示 0 条',
    logsShowingAll: '已显示全部 {count} 条',
    logsShowingPartial: '显示 {visible} / {total} 条',
    loadMore: '加载更多（还有 {count} 条）',
    collapse: '收起',
    tokensTooltip: '输入 {input} / 输出 {output}',
    defaultRangeFallback: '本周',
    presetWtd: '本周',
    presetMtd: '本月',
    presetQtd: '本季度',
    presetYtd: '本年',
    presetAll: '全部',
    statusSuccess: '成功',
    statusWarning: '警告',
    statusError: '错误',
    runTypeChat: '对话',
    runTypeWorkflow: '工作流',
    runTypeAgent: 'Agent',
    runTypeTool: '工具',
    colRunId: '运行 ID',
    colConversationId: '会话 ID',
    colCreated: '创建时间',
    colStatus: '状态',
    colRunType: '运行类型',
    colInput: '输入',
    colOutput: '输出',
    colLlm: 'AI 模型',
    colLatency: '延迟',
    colTokens: 'Token',
    colUser: '用户',
    colRanBy: '执行者',
    colParentRun: '父级运行',
    colError: '错误',
    metricRunsTitle: '总运行次数',
    metricRunsUnit: '次',
    metricRunsSubtitle: '{summary}',
    metricRunsDesc:
      '当前时间范围内，场景或 Agent 被触发执行的总次数（含成功、失败与进行中的尝试），用于观察整体活跃程度。',
    metricAgentsTitle: '代理数',
    metricAgentsUnit: '个',
    metricAgentsSubtitle: '全部代理',
    metricAgentsDesc: '在选定时间范围内至少参与过一次运行的独立 Agent 数量（去重），用于衡量实际调用的智能体规模。',
    metricErrorsTitle: '总错误数',
    metricErrorsUnit: '次',
    metricErrorsSubtitle: '错误率 {rate}%',
    metricErrorsDesc: '运行进入失败态或产生错误回执的次数，可与运行次数对比，用于快速判断稳定性与异常趋势。',
    metricTokensTitle: '消耗 Tokens',
    metricTokensSubtitle: '{range}',
    metricTokensDesc: '大模型调用消耗的 Token 总和（输入 + 输出），用于粗略估算用量、费用与模型负载。',
    metricAvgLatencyTitle: '平均运行耗时',
    metricAvgLatencySubtitle: '基于 {count} 次运行',
    metricAvgLatencyDesc: '当前筛选范围内每次运行的平均延迟（毫秒级），用于评估响应速度与性能表现。',
    metricTaskVolumeTitle: '任务量',
    metricTaskVolumeUnit: '次',
    metricTaskVolumeSubtitle: '{range}',
    metricTaskVolumeDesc: '当前 Agent 在选定时间范围内的执行次数。',
    metricActiveAgentsTitle: '活跃代理',
    metricActiveAgentsUnit: '个',
    metricActiveAgentsSubtitle: '{agent}',
    metricActiveAgentsDesc: '当前筛选范围内有运行记录的 Agent 数量。',
    metricSuccessRateTitle: '成功率',
    metricSuccessRateSubtitle: '基于 {count} 次运行',
    metricSuccessRateDesc: '成功运行次数占全部运行次数的比例。',
    metricErrorRateTitle: '错误率',
    metricErrorRateSubtitle: '{errors} 次错误 / {count} 次运行',
    metricErrorRateDesc: '运行进入失败态的次数占全部运行次数的比例。',
    metricsAgentOverviewAria: 'Agent 指标概览',
    chartsSectionAria: '分析图表',
    chartEmpty: '暂无数据',
    chartInputTokensTitle: '输入 Token',
    chartInputTokensAria: '输入 Token 趋势',
    chartOutputTokensTitle: '输出 Token',
    chartOutputTokensAria: '输出 Token 趋势',
    chartErrorRateTitle: '错误率',
    chartErrorRateAria: '错误率趋势',
    chartRunsTrendTitle: '执行趋势图',
    chartRunsTrendCount: '{count} 次执行',
    chartRunsTrendSeriesLabel: '执行次数',
    chartRunsTrendAria: '一段时间内 Agent 执行次数趋势',
    chartLatencyDistTitle: '运行耗时分布',
    chartLatencyDistAria: '按月份的运行耗时堆叠分布',
    chartAgentUsageTitle: '使用率',
    chartAgentUsageAria: 'Agent 每日任务量趋势',
    chartAgentToolCallsTitle: '动作调用量',
    chartAgentToolCallsAria: 'Agent 每日工具调用次数趋势',
    chartAgentTokensTitle: 'Token 消耗量',
    chartAgentTokensAria: 'Agent Token 消耗趋势',
    chartAxisTime: '时间',
    chartAxisTasks: '任务量',
    chartAxisToolCalls: '调用量',
    chartAxisTokens: 'Token',
    chartAxisInputTokens: 'Token',
    chartAxisOutputTokens: 'Token',
    chartAxisErrorRate: '错误率',
    chartAxisExecutions: '执行次数',
    chartAxisLatency: '耗时',
    chartAxisCount: '次数',
    chartsAgentSectionAria: 'Agent 分析图表',
    bucketMonthSuffix: '月',
    sparkTrendAria: '{title}趋势',
    efficiencySectionAria: '代理效率与成本',
    efficiencyTitle: '代理效率与成本',
    efficiencyMeta:
      'kpi.agents_active · kpi.tasks · kpi.success_rate_pct · kpi.time_saved · Select agent filter.',
    efficiencyMetaHierarchy: '总代理统筹子代理协同执行',
    efficiencyMetaStandalone: '独立代理自主执行',
    efficiencyMetaMixed: '含主代理编排与单代理执行',
    efficiencyKpiParentAgents: '代理总数',
    efficiencyKpiSubAgents: '子代理',
    efficiencyKpiAgents: '工作代理',
    efficiencyKpiTasks: '执行任务',
    efficiencyKpiSuccessRate: '成功率',
    efficiencyKpiTimeSaved: '节省时间',
    efficiencyColAgent: 'Agent',
    efficiencyColDescription: '描述',
    efficiencyColTier: '类型',
    efficiencyColTasks: '任务',
    efficiencyColSuccessRate: '成功率',
    efficiencyEmpty: '当前筛选范围内暂无代理运行数据。',
    efficiencyExpandDetails: '展开代理明细',
    efficiencyCollapseDetails: '收起代理明细',
    efficiencyTierParent: '总代理',
    efficiencyTierSub: '子代理',
    efficiencyTierStandalone: '独立代理',
    efficiencyTierMain: '主代理',
    efficiencyTierSingle: '单代理',
    insightsSectionAria: '摘要与洞察',
    insightsBadge: '摘要与洞察',
    insightsHeadline: '{count} 个 AI 代理协同覆盖全部场景',
    insightsHeadlineScenario: '{count} 个 AI 代理协同支撑{scenario}',
    insightsDescription:
      'AI 自动处理入职引导、工单分派、合规审查与运营编排等重复性工作，减少人工跟进与跨部门协调，让团队聚焦真正需要人类判断的高价值事项。',
    insightsDescriptionOnboard:
      '每次有新员工加入，AI 自动完成 IT 开通、日程安排与身份核验，无需 HR 反复跟进，让团队专注真正需要人工判断的事项。',
    insightsDescriptionSales:
      'AI 自动推进线索培育、跟进提醒与意向分级，销售团队可将精力集中在高意向客户洽谈与成交转化上。',
    insightsDescriptionSupport:
      'AI 自动分派工单、检索知识库并生成初步回复，缩短首次响应时间，提升客户满意度与处理效率。',
    insightsDescriptionCompliance:
      'AI 自动执行合规检查、材料审核与风险标记，减少人工逐条核对，加速审查流程并降低遗漏风险。',
    insightsDescriptionOps:
      'AI 自动编排活动节点、协调资源与进度跟踪，降低运营跨团队协作成本，保障活动按时上线。',
    insightsHeadlineAgent: '{agent} 在{scenario}的运行成效',
    insightsDescriptionAgent:
      '基于当前筛选范围，汇总该 Agent 节省的时间、成本与任务完成情况，帮助评估自动化投入产出。',
    insightsHoursSaved: '节省时间',
    insightsHoursSavedYtd: '节省时间（年初至今）',
    insightsCostSavings: '节省成本',
    insightsCompletionRate: '平均完成率',
    insightsTotalExecutions: '总运行次数',
  },
  en: {
    pageTitle: 'Analytics',
    taglineAria: 'Run metrics, invocation logs, token usage, operational insights',
    taglineRuns: 'Run metrics',
    taglineLogs: 'Invocation logs',
    taglineTokens: 'Token usage',
    taglineInsights: 'Operational insights',
    scopeScenario: 'Scenario',
    scopeAgent: 'Agent',
    allScenarios: 'All scenarios',
    allAgents: 'All agents',
    selectScenario: 'Select scenario',
    selectAgent: 'Select agent',
    scopeBarDesc:
      'Filter by scenario, agent, or both (intersection). Scenario only: all agents in that scenario. Agent only: that agent across all scenarios.',
    scopeBarAria: 'Analytics scope: {summary}',
    scopeSummaryAll: 'All scenarios · All agents',
    scopeSummaryScenarioOnly: '{scenario} (all agents in scenario)',
    scopeSummaryAgentOnly: '{agent} (across all scenarios)',
    scopeSummaryBoth: '{scenario} · {agent}',
    scopeHintAll: 'Scope: all scenarios and all agents. Metrics and logs below use this scope.',
    scopeHintScenario: 'Scope: all agents in {scenario}.',
    scopeHintAgent: 'Scope: {agent} across all scenarios.',
    scopeHintBoth: 'Scope: {agent} in {scenario}.',
    scopeHint: 'Time range, metrics, and logs below are scoped to: {summary}.',
    toolbarAria: 'Analytics actions ({summary})',
    rangePresetAria: 'Quick preset: {label}',
    rangeMenuAria: 'Time range',
    rangePresetsListAria: 'Quick presets',
    dateRangeGroupAria: 'Start and end dates',
    startDate: 'Start date',
    endDate: 'End date',
    customRangeLabel: 'Custom',
    customRangeAria: 'Custom date range, click to show start and end dates',
    exportCsvTitle: 'Export current list as CSV ({summary}, {start}–{end})',
    csvFilenamePrefix: 'analytics-logs',
    toolbarDownload: 'Download',
    toolbarDownloadAria: 'Download current analytics data',
    toolbarEdit: 'Edit',
    toolbarEditAria: 'Edit analytics view',
    toolbarSave: 'Save',
    toolbarSaveAria: 'Save current analytics configuration',
    toolbarReport: 'Reports',
    toolbarReportAria: 'View analysis reports',
    toolbarUpdatedAt: 'Updated',
    toolbarComponentCount: 'Components',
    toolbarExecutionCount: 'Executions',
    toolbarMetaAria: 'Analytics data summary',
    metricsOverviewAria: 'Metrics overview',
    metricInfoAria: '{label}: view metric description',
    peakTitle: 'Peak {value}{unit} at {time}',
    peakLabel: 'Peak {time} · {value}{unit}',
    noActivity: 'No activity',
    sparkEmpty: 'No data',
    logsHeading: 'Run logs',
    logsTotal: '{count} total',
    filtersActive: '{count} filters active',
    filterBtn: 'Filter',
    columnsBtn: 'Columns',
    columnsMenuAria: 'Toggle column visibility',
    keepOneColumn: 'Keep at least one column',
    hideColumn: 'Click to hide this column',
    showColumn: 'Click to show this column',
    filterMenuAria: 'Log filters',
    filterTitle: 'Filter criteria',
    clearAllFilters: 'Clear all',
    filterStatus: 'Status',
    filterRunType: 'Run type',
    filterLlm: 'AI model',
    searchPopoverAria: 'Column search',
    searchPlaceholder: 'Search {column}',
    searchClear: 'Clear',
    searchDone: 'Done',
    searchColumnAria: 'Search {column}',
    statusAllHeader: 'All statuses',
    statusHeaderNarrowed: 'Filtered by status; restore all in Filters',
    statusHeaderDefault: 'Shows success, warning, error, and more; narrow in Filters',
    logsEmpty: 'No results. Try widening the time range or clearing filters.',
    logsShowingZero: 'Showing 0 rows',
    logsShowingAll: 'Showing all {count} rows',
    logsShowingPartial: 'Showing {visible} / {total} rows',
    loadMore: 'Load more ({count} remaining)',
    collapse: 'Collapse',
    tokensTooltip: 'Input {input} / Output {output}',
    defaultRangeFallback: 'This week',
    presetWtd: 'This week',
    presetMtd: 'This month',
    presetQtd: 'This quarter',
    presetYtd: 'This year',
    presetAll: 'All',
    statusSuccess: 'Success',
    statusWarning: 'Warning',
    statusError: 'Error',
    runTypeChat: 'Chat',
    runTypeWorkflow: 'Workflow',
    runTypeAgent: 'Agent',
    runTypeTool: 'Tool',
    colRunId: 'Run ID',
    colConversationId: 'Conversation ID',
    colCreated: 'Created',
    colStatus: 'Status',
    colRunType: 'Run type',
    colInput: 'Input',
    colOutput: 'Output',
    colLlm: 'AI model',
    colLatency: 'Latency',
    colTokens: 'Tokens',
    colUser: 'User',
    colRanBy: 'Ran by',
    colParentRun: 'Parent run',
    colError: 'Error',
    metricRunsTitle: 'Total runs',
    metricRunsUnit: '',
    metricRunsSubtitle: '{summary}',
    metricRunsDesc:
      'Total executions triggered for the selected scenario or agent in the time range (success, failure, and in-progress), indicating overall activity.',
    metricAgentsTitle: 'Agents',
    metricAgentsUnit: '',
    metricAgentsSubtitle: 'All agents',
    metricAgentsDesc:
      'Distinct agents that participated in at least one run in the selected time range, measuring active agent coverage.',
    metricErrorsTitle: 'Total errors',
    metricErrorsUnit: '',
    metricErrorsSubtitle: '{rate}% error rate',
    metricErrorsDesc:
      'Runs that failed or returned an error, compared with total runs to gauge stability and anomalies.',
    metricTokensTitle: 'Tokens consumed',
    metricTokensSubtitle: '{range}',
    metricTokensDesc: 'Sum of input and output tokens from model calls, for usage and cost estimates.',
    metricAvgLatencyTitle: 'Avg run duration',
    metricAvgLatencySubtitle: 'Across {count} runs',
    metricAvgLatencyDesc:
      'Mean latency per run in the current filter, for assessing response speed and performance.',
    metricTaskVolumeTitle: 'Task volume',
    metricTaskVolumeUnit: '',
    metricTaskVolumeSubtitle: '{range}',
    metricTaskVolumeDesc: 'Execution count for the selected agent in the time range.',
    metricActiveAgentsTitle: 'Active agents',
    metricActiveAgentsUnit: '',
    metricActiveAgentsSubtitle: '{agent}',
    metricActiveAgentsDesc: 'Number of agents with runs in the current filter.',
    metricSuccessRateTitle: 'Success rate',
    metricSuccessRateSubtitle: 'Across {count} runs',
    metricSuccessRateDesc: 'Share of runs that completed successfully.',
    metricErrorRateTitle: 'Error rate',
    metricErrorRateSubtitle: '{errors} errors / {count} runs',
    metricErrorRateDesc: 'Share of runs that ended in an error state.',
    metricsAgentOverviewAria: 'Agent metrics overview',
    chartsSectionAria: 'Analytics charts',
    chartEmpty: 'No data',
    chartInputTokensTitle: 'Input tokens',
    chartInputTokensAria: 'Input token trend',
    chartOutputTokensTitle: 'Output tokens',
    chartOutputTokensAria: 'Output token trend',
    chartErrorRateTitle: 'Error rate',
    chartErrorRateAria: 'Error rate trend',
    chartRunsTrendTitle: 'Execution trend',
    chartRunsTrendCount: '{count} runs',
    chartRunsTrendSeriesLabel: 'Executions',
    chartRunsTrendAria: 'Agent execution count over time',
    chartLatencyDistTitle: 'Run duration distribution',
    chartLatencyDistAria: 'Stacked run duration by month',
    chartAgentUsageTitle: 'Usage rate',
    chartAgentUsageAria: 'Daily task volume for the agent',
    chartAgentToolCallsTitle: 'Daily action invocations',
    chartAgentToolCallsAria: 'Daily tool invocation count for the agent',
    chartAgentTokensTitle: 'Token consumption',
    chartAgentTokensAria: 'Token consumption trend for the agent',
    chartAxisTime: 'Time',
    chartAxisTasks: 'Tasks',
    chartAxisToolCalls: 'Invocations',
    chartAxisTokens: 'Tokens',
    chartAxisInputTokens: 'Tokens',
    chartAxisOutputTokens: 'Tokens',
    chartAxisErrorRate: 'Error rate',
    chartAxisExecutions: 'Executions',
    chartAxisLatency: 'Latency',
    chartAxisCount: 'Count',
    chartsAgentSectionAria: 'Agent analytics charts',
    bucketMonthSuffix: '',
    sparkTrendAria: '{title} trend',
    efficiencySectionAria: 'Agent efficiency and cost',
    efficiencyTitle: 'Agent efficiency and cost',
    efficiencyMeta:
      'kpi.agents_active · kpi.tasks · kpi.success_rate_pct · kpi.time_saved · Select agent filter.',
    efficiencyMetaHierarchy: 'Parent agents orchestrate sub-agent execution',
    efficiencyMetaStandalone: 'Standalone agents execute independently',
    efficiencyMetaMixed: 'Parent orchestration and single-agent execution',
    efficiencyKpiParentAgents: 'Parent agents',
    efficiencyKpiSubAgents: 'Sub-agents',
    efficiencyKpiAgents: 'Active agents',
    efficiencyKpiTasks: 'Tasks executed',
    efficiencyKpiSuccessRate: 'Success rate',
    efficiencyKpiTimeSaved: 'Time saved',
    efficiencyColAgent: 'Agent',
    efficiencyColDescription: 'Description',
    efficiencyColTier: 'Type',
    efficiencyColTasks: 'Tasks',
    efficiencyColSuccessRate: 'Success rate',
    efficiencyEmpty: 'No agent activity in the current filter range.',
    efficiencyExpandDetails: 'Expand agent details',
    efficiencyCollapseDetails: 'Collapse agent details',
    efficiencyTierParent: 'Parent',
    efficiencyTierSub: 'Sub-agent',
    efficiencyTierStandalone: 'Standalone',
    efficiencyTierMain: 'Main agent',
    efficiencyTierSingle: 'Single agent',
    insightsSectionAria: 'Summary and insights',
    insightsBadge: 'Summary & Insights',
    insightsHeadline: '{count} AI Agents collaborating across all scenarios',
    insightsHeadlineScenario: '{count} AI Agents powering {scenario}',
    insightsDescription:
      'AI automatically handles onboarding, ticket routing, compliance checks, and ops orchestration—cutting manual follow-ups so your team can focus on work that truly needs a human.',
    insightsDescriptionOnboard:
      'Whenever a new hire joins, AI handles IT setup, scheduling, and identity verification—no manual HR follow-up, so your team can focus on high-judgment work.',
    insightsDescriptionSales:
      'AI nurtures leads, sends follow-up reminders, and scores intent—so sales can focus on high-intent conversations and closing deals.',
    insightsDescriptionSupport:
      'AI routes tickets, searches the knowledge base, and drafts first responses—faster time-to-first-reply and higher customer satisfaction.',
    insightsDescriptionCompliance:
      'AI runs compliance checks, reviews materials, and flags risk—reducing manual line-by-line review and speeding audits.',
    insightsDescriptionOps:
      'AI orchestrates campaign milestones, coordinates resources, and tracks progress—lowering cross-team ops overhead.',
    insightsHeadlineAgent: '{agent} in {scenario}',
    insightsDescriptionAgent:
      'Summarizes time saved, cost impact, and completion for this agent in the current filter—so you can judge automation ROI.',
    insightsHoursSaved: 'Hours saved',
    insightsHoursSavedYtd: 'Hours saved (YTD)',
    insightsCostSavings: 'Cost savings',
    insightsCompletionRate: 'Avg completion rate',
    insightsTotalExecutions: 'Total executions',
  },
} as const

export type AnalyticsStringKey = keyof typeof STRINGS.zh

export function analyticsT(
  locale: AppLocale,
  key: AnalyticsStringKey,
  vars?: Record<string, string | number>,
): string {
  let text: string = STRINGS[locale][key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}

const INSIGHTS_SCENARIO_DESCRIPTION_KEYS: Record<string, AnalyticsStringKey> = {
  'sc-onboard': 'insightsDescriptionOnboard',
  'sc-sales': 'insightsDescriptionSales',
  'sc-support': 'insightsDescriptionSupport',
  'sc-compliance': 'insightsDescriptionCompliance',
  'sc-ops': 'insightsDescriptionOps',
}

export type AnalyticsScopeMode = 'all' | 'scenario' | 'agent' | 'both'

export function getAnalyticsScopeMode(scenarioId: string, agentId: string): AnalyticsScopeMode {
  if (scenarioId === 'all' && agentId === 'all') return 'all'
  if (scenarioId !== 'all' && agentId === 'all') return 'scenario'
  if (scenarioId === 'all' && agentId !== 'all') return 'agent'
  return 'both'
}

export function getAnalyticsScopeSummary(
  locale: AppLocale,
  scopeScenarioId: string,
  scopeAgentId: string,
  scenarioName: string,
  agentName: string,
): string {
  const mode = getAnalyticsScopeMode(scopeScenarioId, scopeAgentId)
  if (mode === 'all') return analyticsT(locale, 'scopeSummaryAll')
  if (mode === 'scenario') return analyticsT(locale, 'scopeSummaryScenarioOnly', { scenario: scenarioName })
  if (mode === 'agent') return analyticsT(locale, 'scopeSummaryAgentOnly', { agent: agentName })
  return analyticsT(locale, 'scopeSummaryBoth', { scenario: scenarioName, agent: agentName })
}

export function getAnalyticsScopeHint(
  locale: AppLocale,
  scopeScenarioId: string,
  scopeAgentId: string,
  scenarioName: string,
  agentName: string,
): string {
  const mode = getAnalyticsScopeMode(scopeScenarioId, scopeAgentId)
  if (mode === 'all') return analyticsT(locale, 'scopeHintAll')
  if (mode === 'scenario') return analyticsT(locale, 'scopeHintScenario', { scenario: scenarioName })
  if (mode === 'agent') return analyticsT(locale, 'scopeHintAgent', { agent: agentName })
  return analyticsT(locale, 'scopeHintBoth', { scenario: scenarioName, agent: agentName })
}

export function getAnalyticsInsightsCopy(
  locale: AppLocale,
  scopeScenarioId: string,
  scenarioName: string,
  agentCount: number,
  scopeAgentId: string = 'all',
  agentName?: string,
): { headline: string; description: string } {
  const count = Math.max(0, agentCount)

  if (scopeAgentId !== 'all' && agentName) {
    const scenarioLabel =
      scopeScenarioId === 'all' ? analyticsT(locale, 'allScenarios') : scenarioName
    return {
      headline: analyticsT(locale, 'insightsHeadlineAgent', { agent: agentName, scenario: scenarioLabel }),
      description: analyticsT(locale, 'insightsDescriptionAgent', { agent: agentName, scenario: scenarioLabel }),
    }
  }

  if (scopeScenarioId === 'all') {
    return {
      headline: analyticsT(locale, 'insightsHeadline', { count }),
      description: analyticsT(locale, 'insightsDescription'),
    }
  }
  const descriptionKey = INSIGHTS_SCENARIO_DESCRIPTION_KEYS[scopeScenarioId] ?? 'insightsDescription'
  return {
    headline: analyticsT(locale, 'insightsHeadlineScenario', { count, scenario: scenarioName }),
    description: analyticsT(locale, descriptionKey),
  }
}

const PRESET_KEYS: AnalyticsPresetKey[] = ['wtd', 'mtd', 'qtd', 'ytd', 'all']

const PRESET_LABEL_KEYS: Record<AnalyticsPresetKey, AnalyticsStringKey> = {
  wtd: 'presetWtd',
  mtd: 'presetMtd',
  qtd: 'presetQtd',
  ytd: 'presetYtd',
  all: 'presetAll',
}

export function getAnalyticsPresetOptions(locale: AppLocale): { key: AnalyticsPresetKey; label: string }[] {
  return PRESET_KEYS.map((key) => ({ key, label: analyticsT(locale, PRESET_LABEL_KEYS[key]) }))
}

export function getAnalyticsMetricCards(locale: AppLocale): {
  id: MetricId
  title: string
  color: string
  unit?: string
  description: string
}[] {
  return [
    {
      id: 'runs',
      title: analyticsT(locale, 'metricRunsTitle'),
      color: '#2563eb',
      unit: analyticsT(locale, 'metricRunsUnit') || undefined,
      description: analyticsT(locale, 'metricRunsDesc'),
    },
    {
      id: 'agents',
      title: analyticsT(locale, 'metricAgentsTitle'),
      color: '#7c3aed',
      unit: analyticsT(locale, 'metricAgentsUnit') || undefined,
      description: analyticsT(locale, 'metricAgentsDesc'),
    },
    {
      id: 'tokens',
      title: analyticsT(locale, 'metricTokensTitle'),
      color: '#b45309',
      description: analyticsT(locale, 'metricTokensDesc'),
    },
    {
      id: 'errors',
      title: analyticsT(locale, 'metricErrorsTitle'),
      color: '#dc2626',
      unit: analyticsT(locale, 'metricErrorsUnit') || undefined,
      description: analyticsT(locale, 'metricErrorsDesc'),
    },
    {
      id: 'avgLatency',
      title: analyticsT(locale, 'metricAvgLatencyTitle'),
      color: '#059669',
      description: analyticsT(locale, 'metricAvgLatencyDesc'),
    },
  ]
}

export function getAnalyticsAgentScopedMetricCards(locale: AppLocale): {
  id: AgentScopedMetricId
  title: string
  color: string
  unit?: string
  description: string
}[] {
  return [
    {
      id: 'taskVolume',
      title: analyticsT(locale, 'metricTaskVolumeTitle'),
      color: '#2563eb',
      unit: analyticsT(locale, 'metricTaskVolumeUnit') || undefined,
      description: analyticsT(locale, 'metricTaskVolumeDesc'),
    },
    {
      id: 'activeAgents',
      title: analyticsT(locale, 'metricActiveAgentsTitle'),
      color: '#7c3aed',
      unit: analyticsT(locale, 'metricActiveAgentsUnit') || undefined,
      description: analyticsT(locale, 'metricActiveAgentsDesc'),
    },
    {
      id: 'tokens',
      title: analyticsT(locale, 'metricTokensTitle'),
      color: '#b45309',
      description: analyticsT(locale, 'metricTokensDesc'),
    },
    {
      id: 'successRate',
      title: analyticsT(locale, 'metricSuccessRateTitle'),
      color: '#059669',
      description: analyticsT(locale, 'metricSuccessRateDesc'),
    },
    {
      id: 'errorRate',
      title: analyticsT(locale, 'metricErrorRateTitle'),
      color: '#dc2626',
      description: analyticsT(locale, 'metricErrorRateDesc'),
    },
  ]
}

type LogColumnThKind = 'sort' | 'search'

export type AnalyticsLogColumnDef = {
  id: string
  label: string
  visible: boolean
  thKind?: LogColumnThKind
}

const LOG_COLUMN_SPECS: Omit<AnalyticsLogColumnDef, 'label'>[] = [
  { id: 'runId', visible: true },
  { id: 'conversationId', visible: true },
  { id: 'created', visible: true, thKind: 'sort' },
  { id: 'status', visible: true, thKind: 'sort' },
  { id: 'runType', visible: false },
  { id: 'input', visible: true, thKind: 'search' },
  { id: 'output', visible: true, thKind: 'search' },
  { id: 'llm', visible: true },
  { id: 'latency', visible: true, thKind: 'sort' },
  { id: 'tokens', visible: true, thKind: 'sort' },
  { id: 'user', visible: false },
  { id: 'ranBy', visible: false },
  { id: 'parentRun', visible: false },
  { id: 'error', visible: true, thKind: 'search' },
]

const LOG_COLUMN_LABEL_KEYS: Record<string, AnalyticsStringKey> = {
  runId: 'colRunId',
  conversationId: 'colConversationId',
  created: 'colCreated',
  status: 'colStatus',
  runType: 'colRunType',
  input: 'colInput',
  output: 'colOutput',
  llm: 'colLlm',
  latency: 'colLatency',
  tokens: 'colTokens',
  user: 'colUser',
  ranBy: 'colRanBy',
  parentRun: 'colParentRun',
  error: 'colError',
}

export const DEFAULT_VISIBLE_LOG_COLUMN_IDS = LOG_COLUMN_SPECS.filter((c) => c.visible).map((c) => c.id)

export function getAnalyticsLogColumns(locale: AppLocale): AnalyticsLogColumnDef[] {
  return LOG_COLUMN_SPECS.map((col) => ({
    ...col,
    label: analyticsT(locale, LOG_COLUMN_LABEL_KEYS[col.id]),
  }))
}

export function getAnalyticsStatusLabels(locale: AppLocale): Record<AnalyticsRunStatus, string> {
  return {
    success: analyticsT(locale, 'statusSuccess'),
    warning: analyticsT(locale, 'statusWarning'),
    error: analyticsT(locale, 'statusError'),
  }
}

export function getAnalyticsStatusOptions(locale: AppLocale): { value: AnalyticsRunStatus; label: string }[] {
  const labels = getAnalyticsStatusLabels(locale)
  return (['success', 'warning', 'error'] as const).map((value) => ({ value, label: labels[value] }))
}

export function getAnalyticsRunTypeLabel(locale: AppLocale, runType: AnalyticsRunType): string {
  const keyMap: Record<AnalyticsRunType, AnalyticsStringKey> = {
    chat: 'runTypeChat',
    workflow: 'runTypeWorkflow',
    agent: 'runTypeAgent',
    tool: 'runTypeTool',
  }
  return analyticsT(locale, keyMap[runType])
}

export function getAnalyticsRunTypeOptions(locale: AppLocale): { value: AnalyticsRunType; label: string }[] {
  return (['chat', 'workflow', 'agent', 'tool'] as const).map((value) => ({
    value,
    label: getAnalyticsRunTypeLabel(locale, value),
  }))
}

const ENTITY_NAMES = {
  scenarios: {
    'sc-onboard': { zh: '新员工入职场景', en: 'New employee onboarding' },
    'sc-sales': { zh: '销售线索跟进', en: 'Sales lead follow-up' },
    'sc-support': { zh: '客户支持工单', en: 'Customer support tickets' },
    'sc-compliance': { zh: '合规审查', en: 'Compliance review' },
    'sc-ops': { zh: '运营活动编排', en: 'Campaign orchestration' },
  },
  agents: {
    'ag-coach': { zh: '培训协调 Agent', en: 'Training coordinator agent' },
    'ag-audit': { zh: '审核与确认 Agent', en: 'Review & approval agent' },
    'ag-data': { zh: '数据汇总 Agent', en: 'Data aggregation agent' },
    'ag-research': { zh: '调研分析 Agent', en: 'Research & analysis agent' },
    'ag-write': { zh: '文案生成 Agent', en: 'Copywriting agent' },
    'ag-sched': { zh: '日程编排 Agent', en: 'Scheduling agent' },
  },
  agentRoles: {
    'ag-coach': { zh: '协调', en: 'Coordination' },
    'ag-audit': { zh: '确认', en: 'Confirmation' },
    'ag-data': { zh: '汇总', en: 'Aggregation' },
    'ag-research': { zh: '分析', en: 'Analysis' },
    'ag-write': { zh: '内容', en: 'Content' },
    'ag-sched': { zh: '调度', en: 'Scheduling' },
  },
  agentDescriptions: {
    'ag-coach': {
      zh: '统筹培训流程，协调子代理完成入职引导与任务分派',
      en: 'Orchestrates training workflows and delegates onboarding tasks to sub-agents',
    },
    'ag-audit': {
      zh: '审核材料与确认节点，保障流程合规与信息准确',
      en: 'Reviews materials and confirmation steps for compliance and accuracy',
    },
    'ag-data': {
      zh: '汇总多源数据并生成结构化报表与洞察',
      en: 'Aggregates multi-source data into structured reports and insights',
    },
    'ag-research': {
      zh: '开展调研分析并编排下游内容生成任务',
      en: 'Conducts research and orchestrates downstream content generation',
    },
    'ag-write': {
      zh: '基于调研结果生成文案、邮件与对外内容',
      en: 'Generates copy, emails, and external content from research outputs',
    },
    'ag-sched': {
      zh: '安排会议、提醒与日程冲突检测',
      en: 'Schedules meetings, reminders, and detects calendar conflicts',
    },
  },
  workflows: {
    'wf-onboarding': { zh: '员工入职引导', en: 'Employee onboarding guide' },
    'wf-contract': { zh: '合同审批流', en: 'Contract approval flow' },
    'wf-support': { zh: '客服工单', en: 'Support ticket flow' },
    'wf-data-sync': { zh: '数据同步巡检', en: 'Data sync inspection' },
    'wf-release': { zh: '研发发布检查单', en: 'Release checklist' },
  },
} as const

export function getAnalyticsScenarioName(locale: AppLocale, id: string, fallback?: string): string {
  const entry = ENTITY_NAMES.scenarios[id as keyof typeof ENTITY_NAMES.scenarios]
  return entry?.[locale] ?? fallback ?? id
}

export function getAnalyticsAgentName(locale: AppLocale, id: string, fallback?: string): string {
  const entry = ENTITY_NAMES.agents[id as keyof typeof ENTITY_NAMES.agents]
  return entry?.[locale] ?? fallback ?? id
}

export function getAnalyticsAgentRole(locale: AppLocale, id: string): string {
  const entry = ENTITY_NAMES.agentRoles[id as keyof typeof ENTITY_NAMES.agentRoles]
  return entry?.[locale] ?? '—'
}

export function getAnalyticsAgentDescription(locale: AppLocale, id: string): string {
  const entry = ENTITY_NAMES.agentDescriptions[id as keyof typeof ENTITY_NAMES.agentDescriptions]
  return entry?.[locale] ?? '—'
}

export function getAnalyticsWorkflowName(locale: AppLocale, id: string, fallback?: string): string {
  const entry = ENTITY_NAMES.workflows[id as keyof typeof ENTITY_NAMES.workflows]
  return entry?.[locale] ?? fallback ?? id
}

const INPUT_SAMPLES_EN = [
  'Summarize yesterday\'s meeting notes',
  'Group this sales data by region and provide insights',
  'Draft a thank-you email to the customer in a professional tone',
  'Extract all key contract clauses from the PDF',
  'Translate the following English to Chinese, keeping technical terms',
  'Analyze the refund reason for this order and suggest next steps',
  'Look up activity for user ID 9182 over the last 30 days',
  'Draw a user journey from signup to checkout',
  'Review this code and flag potential bugs',
  'Forecast next month\'s inventory needs from historical data',
  'Break this product spec into a PRD outline',
  'Summarize competitor feature updates from the last 3 months',
]

const OUTPUT_SAMPLES_EN = [
  'Meeting summary generated with 5 key takeaways.',
  'Regional sales comparison table: East China up 12%.',
  'Email drafted with subject: Thank you for your continued support.',
  '9 key clauses extracted; 3 relate to breach of contract.',
  'Translation complete; 7 technical terms kept in the original language.',
  'Identified shipping delay as root cause; partial compensation suggested.',
  'User active 22 days; average session 6.2 minutes.',
  '5-stage journey map created; main drop-off at payment.',
  '2 potential null-pointer risks found with fix suggestions.',
  'Next month demand ~14k units; suggest replenishing 3,000.',
  'PRD outline generated with goals, user stories, and acceptance criteria.',
  'Competitors shipped 11 new features, mostly collaboration-related.',
]

function rowSampleIndex(row: AnalyticsLogRow): number {
  const m = /^r-(\d+)$/.exec(row.id)
  if (!m) return 0
  return (Number(m[1]) - 1) % INPUT_SAMPLES_EN.length
}

export function getLocalizedLogInput(locale: AppLocale, row: AnalyticsLogRow): string {
  if (locale === 'zh') return row.input
  return INPUT_SAMPLES_EN[rowSampleIndex(row)] ?? row.input
}

export function getLocalizedLogOutput(locale: AppLocale, row: AnalyticsLogRow): string {
  if (locale === 'zh') return row.output
  if (!row.output) return row.output
  return OUTPUT_SAMPLES_EN[rowSampleIndex(row)] ?? row.output
}

export function analyticsBucketShortLabel(d: Date, gran: BucketGranularity, locale: AppLocale): string {
  if (gran === 'hour') return `${String(d.getHours()).padStart(2, '0')}:00`
  if (gran === 'day') return `${d.getMonth() + 1}/${d.getDate()}`
  const suffix = analyticsT(locale, 'bucketMonthSuffix')
  return suffix ? `${d.getMonth() + 1}${suffix}` : d.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' })
}
