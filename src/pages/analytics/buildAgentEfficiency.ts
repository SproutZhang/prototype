import {
  ANALYTICS_AGENT_SUB_AGENTS,
  getAnalyticsSubAgentIds,
  type AnalyticsLogRow,
} from '../../data/analytics-logs'

/** 假设人工处理单次任务约 10 分钟，用于估算节省时间 */
const MANUAL_BASELINE_MS = 10 * 60 * 1000

export type AgentEfficiencyTier = 'parent' | 'sub' | 'standalone'

export interface AgentEfficiencyRow {
  agentId: string
  tasks: number
  successCount: number
  successRate: number
  timeSavedMs: number
  tier: AgentEfficiencyTier
  parentAgentId?: string
}

export interface AgentEfficiencySummary {
  totalParents: number
  totalSubs: number
  totalTasks: number
  successRate: number
  timeSavedMs: number
  rows: AgentEfficiencyRow[]
  /** 当前视图是否在明细中展示子代理层级（仅筛选主代理时） */
  showSubAgents: boolean
  /** 代理总数（不含子代理行；全部范围时为各 Agent 一行） */
  topLevelAgentCount: number
  /** 是否在类型列区分主代理 / 单代理 */
  showAgentTier: boolean
}

function timeSavedForRow(row: AnalyticsLogRow): number {
  if (row.status !== 'success') return 0
  return Math.max(0, MANUAL_BASELINE_MS - row.latencyMs)
}

function statsForAgent(rows: AnalyticsLogRow[], agentId: string) {
  const agentRows = rows.filter((r) => r.agentId === agentId)
  const tasks = agentRows.length
  const successCount = agentRows.filter((r) => r.status === 'success').length
  return {
    tasks,
    successCount,
    successRate: tasks > 0 ? (successCount / tasks) * 100 : 0,
    timeSavedMs: agentRows.reduce((sum, r) => sum + timeSavedForRow(r), 0),
  }
}

function makeRow(
  agentId: string,
  tier: AgentEfficiencyTier,
  rows: AnalyticsLogRow[],
  parentAgentId?: string,
): AgentEfficiencyRow | null {
  const stats = statsForAgent(rows, agentId)
  if (stats.tasks <= 0) return null
  return { agentId, tier, parentAgentId, ...stats }
}

export function buildAgentEfficiencyHierarchy(
  rows: AnalyticsLogRow[],
  scopeAgentId: string = 'all',
): AgentEfficiencySummary {
  const hierarchicalRows: AgentEfficiencyRow[] = []
  const activeParentIds = new Set<string>()
  const activeSubIds = new Set<string>()

  const appendParentGroup = (parentId: string) => {
    const parentRow = makeRow(parentId, 'parent', rows)
    const subIds = getAnalyticsSubAgentIds(parentId)
    const subRows = subIds
      .map((subId) => makeRow(subId, 'sub', rows, parentId))
      .filter((r): r is AgentEfficiencyRow => r !== null)

    if (!parentRow && subRows.length === 0) return

    if (parentRow) {
      hierarchicalRows.push(parentRow)
      activeParentIds.add(parentId)
    } else if (subRows.length > 0) {
      activeParentIds.add(parentId)
    }

    for (const subRow of subRows) {
      hierarchicalRows.push(subRow)
      activeSubIds.add(subRow.agentId)
    }
  }

  if (scopeAgentId !== 'all') {
    const subs = getAnalyticsSubAgentIds(scopeAgentId)
    if (subs.length > 0) {
      appendParentGroup(scopeAgentId)
    } else {
      const single = makeRow(scopeAgentId, 'standalone', rows)
      if (single) {
        hierarchicalRows.push(single)
        activeParentIds.add(scopeAgentId)
      }
    }
  } else {
    const agentIds = [...new Set(rows.map((r) => r.agentId))]
    for (const agentId of agentIds) {
      const isParent = getAnalyticsSubAgentIds(agentId).length > 0
      const row = makeRow(agentId, isParent ? 'parent' : 'standalone', rows)
      if (!row) continue
      hierarchicalRows.push(row)
      activeParentIds.add(agentId)
    }
  }

  const totalTasks = rows.length
  const successTotal = rows.filter((r) => r.status === 'success').length
  const timeSavedMs = rows.reduce((sum, r) => sum + timeSavedForRow(r), 0)

  const showSubAgents =
    scopeAgentId !== 'all' && getAnalyticsSubAgentIds(scopeAgentId).length > 0

  const topLevelAgentCount = hierarchicalRows.filter((row) => row.tier !== 'sub').length

  const showAgentTier = hierarchicalRows.some((row) => row.tier === 'parent')

  return {
    totalParents: activeParentIds.size,
    totalSubs: activeSubIds.size,
    totalTasks,
    successRate: totalTasks > 0 ? (successTotal / totalTasks) * 100 : 0,
    timeSavedMs,
    rows: hierarchicalRows,
    showSubAgents,
    topLevelAgentCount,
    showAgentTier,
  }
}

/** @deprecated 使用 buildAgentEfficiencyHierarchy */
export function buildAgentEfficiency(rows: AnalyticsLogRow[]): AgentEfficiencySummary {
  return buildAgentEfficiencyHierarchy(rows, 'all')
}

export function formatTimeSaved(locale: 'zh' | 'en', ms: number): string {
  if (ms <= 0) return locale === 'zh' ? '0 分钟' : '0 min'
  if (ms >= 3_600_000) {
    const h = ms / 3_600_000
    return locale === 'zh' ? `${h.toFixed(1)} 小时` : `${h.toFixed(1)} h`
  }
  const m = Math.max(1, Math.round(ms / 60_000))
  return locale === 'zh' ? `${m} 分钟` : `${m} min`
}

export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}

export const AGENT_EFFICIENCY_DOT_COLORS = [
  '#3b82f6',
  '#f97316',
  '#22c55e',
  '#8b5cf6',
  '#06b6d4',
  '#eab308',
] as const
