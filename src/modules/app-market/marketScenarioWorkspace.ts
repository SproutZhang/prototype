import type { AppLocale } from '../../i18n/homeStrings'
import type { AppMarketScenarioWorkflowStep } from './shared/types'

const WORKSPACE_EDGE_ONBOARDING_PREFIX = '__ob:'
const ONBOARDING_WORKFLOW_LAYER_GAP_Y = 40
const WORKFLOW_NODE_WIDTH = 400
const WORKFLOW_BRANCH_MAIN_CARD_H = 72
const WORKFLOW_BRANCH_SUB_ROW_GAP = 24
const WORKFLOW_BRANCH_SUB_CARD_H = 72
const WORKFLOW_NODE_HEIGHT = {
  trigger: 103,
  collect: 72,
  branch: WORKFLOW_BRANCH_MAIN_CARD_H + WORKFLOW_BRANCH_SUB_ROW_GAP + WORKFLOW_BRANCH_SUB_CARD_H,
  master: 72,
  account: 72,
  training: 72,
  office: 72,
} as const

const DEFAULT_ONBOARDING_NODE_POS = (() => {
  const spineX = 1850
  let y = 0
  const order = ['trigger', 'collect', 'branch', 'account', 'training', 'office', 'master'] as const
  const out: Partial<Record<(typeof order)[number], { x: number; y: number }>> = {}
  for (let i = 0; i < order.length; i++) {
    const key = order[i]
    out[key] = { x: spineX, y }
    const gapAfter = i < order.length - 1 ? ONBOARDING_WORKFLOW_LAYER_GAP_Y : 0
    y += WORKFLOW_NODE_HEIGHT[key] + gapAfter
  }
  return out as Record<(typeof order)[number], { x: number; y: number }>
})()

export type MarketScenarioWorkspaceSeed = {
  canvasTitles: Partial<Record<'trigger' | 'collect' | 'branch' | 'master' | 'account' | 'training' | 'office', string>>
  removedOnboardingKeys: Array<'trigger' | 'collect' | 'branch' | 'master' | 'account' | 'training' | 'office'>
  extraNodes: Array<{
    id: string
    kind: 'agent' | 'manual'
    x: number
    y: number
    title: string
  }>
  extraEdges: Array<{ id: string; from: string; to: string }>
  disconnectedSpineEdgeKeys: string[]
}

function onboardingWorkspaceEdgeEndpoint(key: string) {
  return `${WORKSPACE_EDGE_ONBOARDING_PREFIX}${key}`
}

function onboardingWorkflowSpineEdgeKey(from: string, to: string) {
  return `${from}->${to}`
}

function getStepTitle(step: AppMarketScenarioWorkflowStep, locale: AppLocale) {
  return locale === 'zh' ? step.titleZh : step.titleEn
}

export function buildMarketScenarioWorkspaceSeed(
  steps: readonly AppMarketScenarioWorkflowStep[],
  locale: AppLocale,
  fallbackTitle?: string,
): MarketScenarioWorkspaceSeed {
  const resolvedSteps =
    steps.length > 0
      ? steps
      : [
          {
            id: 'fallback-trigger',
            titleZh: fallbackTitle?.trim() || '流程触发',
            titleEn: fallbackTitle?.trim() || 'Workflow trigger',
            pluginToolsZh: [],
            pluginToolsEn: [],
          },
        ]

  const canvasTitles: MarketScenarioWorkspaceSeed['canvasTitles'] = {}
  const coreKeys = ['trigger', 'collect', 'branch'] as const
  resolvedSteps.slice(0, 3).forEach((step, index) => {
    canvasTitles[coreKeys[index]] = getStepTitle(step, locale)
  })

  const removedOnboardingKeys: MarketScenarioWorkspaceSeed['removedOnboardingKeys'] = [
    'master',
    'office',
    'account',
    'training',
  ]
  if (resolvedSteps.length < 2) removedOnboardingKeys.push('collect', 'branch')
  if (resolvedSteps.length < 3) removedOnboardingKeys.push('branch')

  const extraSteps = resolvedSteps.slice(3)
  const branchPos = DEFAULT_ONBOARDING_NODE_POS.branch
  const baseY = branchPos.y + WORKFLOW_NODE_HEIGHT.branch + ONBOARDING_WORKFLOW_LAYER_GAP_Y
  const extraNodes = extraSteps.map((step, index) => ({
    id: `ws-market-${step.id}-${index}`,
    kind: (index % 2 === 0 ? 'agent' : 'manual') as 'agent' | 'manual',
    title: getStepTitle(step, locale),
    x: branchPos.x,
    y: baseY + index * (WORKFLOW_NODE_HEIGHT.collect + ONBOARDING_WORKFLOW_LAYER_GAP_Y),
  }))

  const extraEdges: MarketScenarioWorkspaceSeed['extraEdges'] = []
  if (extraNodes.length > 0) {
    const anchorFrom = resolvedSteps.length >= 3 ? 'branch' : resolvedSteps.length === 2 ? 'collect' : 'trigger'
    extraEdges.push({
      id: `ws-market-edge-${anchorFrom}-${extraNodes[0].id}`,
      from: onboardingWorkspaceEdgeEndpoint(anchorFrom),
      to: extraNodes[0].id,
    })
    for (let index = 0; index < extraNodes.length - 1; index += 1) {
      extraEdges.push({
        id: `ws-market-edge-${index}`,
        from: extraNodes[index].id,
        to: extraNodes[index + 1].id,
      })
    }
  }

  const disconnectedSpineEdgeKeys = [
    onboardingWorkflowSpineEdgeKey('branch', 'account'),
    onboardingWorkflowSpineEdgeKey('account', 'training'),
    onboardingWorkflowSpineEdgeKey('training', 'office'),
    onboardingWorkflowSpineEdgeKey('office', 'master'),
  ]

  return {
    canvasTitles,
    removedOnboardingKeys,
    extraNodes,
    extraEdges,
    disconnectedSpineEdgeKeys,
  }
}

export const MARKET_SCENARIO_DEFAULT_CANVAS_TITLES: Record<
  'trigger' | 'collect' | 'branch' | 'master' | 'account' | 'training' | 'office',
  string
> = {
  trigger: '新人发起对话',
  collect: '收集新人入职表单、证件信息和补充资料。',
  branch: '判断用户所填写的内容的完整情况。',
  master: '入职总控Agent',
  account: '为新人配置入职后所需的个人账号、权限和访问凭证。',
  training: '为新人定制化指定入职的培训课程并实时跟踪新人的学习情况。',
  office: '办公配置 Agent',
}
