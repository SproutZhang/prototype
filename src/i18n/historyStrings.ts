import type { AppLocale } from './homeStrings'

export type RunHistoryKind = 'chat' | 'agent' | 'scenario'
export type RunRecordStatus = 'success' | 'warning' | 'error'

export type RunHistoryItem = {
  id: string
  kind: RunHistoryKind
  name: string
  status?: RunRecordStatus
  linkedAgentId?: string
}

/** 侧栏历史种子条目 id（路由与快照绑定，不随语言变化） */
export const HISTORY_IDS = {
  onboardingAssistantChat: 'h1',
  onboardingScenario: 's1',
  onboardingWorkflowGroup: 's2',
  salesManagerOnboarding: 's6',
  seniorRdOnboarding: 's3',
  identityVerification: 's5',
  opsManagerOnboarding: 's4',
  juniorOpsOnboarding: 's7',
  onboardingAssistantAgent: 'a1',
} as const

const SEED_NAMES: Record<string, { zh: string; en: string }> = {
  h1: { zh: '全自动化新员工入职助手', en: 'Fully automated new-hire onboarding assistant' },
  h2: { zh: '帮我总结本周待办', en: 'Summarize my to-dos this week' },
  h3: { zh: '会议室预订规则是什么？', en: 'What are the meeting room booking rules?' },
  h4: { zh: '把这段政策要点改成邮件草稿', en: 'Turn these policy points into an email draft' },
  s2: { zh: '新员工入职工作流', en: 'New employee onboarding workflow' },
  s1: { zh: '新员工入职', en: 'New employee onboarding' },
  s6: { zh: '销售经理入职工作流', en: 'Sales manager onboarding workflow' },
  s3: { zh: '高级研发入职工作流', en: 'Senior R&D onboarding workflow' },
  s5: { zh: '身份验证', en: 'Identity verification' },
  s4: { zh: '运营经理入职工作流', en: 'Operations manager onboarding workflow' },
  s7: { zh: '初级运维入职工作流', en: 'Junior ops onboarding workflow' },
  a1: { zh: 'Onboarding 助手', en: 'Onboarding assistant' },
  a2: { zh: '绩效反馈 Bot', en: 'Performance feedback bot' },
}

const STRINGS = {
  zh: {
    statusSuccess: '成功',
    statusWarning: '警告',
    statusError: '错误',
    statusGeneric: '状态',
    openOnboardingWorkflow: '打开「新员工入职工作流」，在右侧查看工作流步骤',
    openSalesManagerWorkflow: '打开「销售经理入职工作流」，在右侧查看工作流步骤（含未完成项）',
    openSeniorRdWorkflow: '打开「高级研发入职工作流」，在右侧查看工作流步骤（含 Agent 故障与未完成任务）',
    openIdentityVerification: '打开「身份验证」，在右侧查看工作流步骤（含未完成项）',
    openOpsManagerWorkflow: '打开「运营经理入职工作流」，在右侧查看工作流步骤（含未完成项）',
    openJuniorOpsWorkflow: '打开「初级运维入职工作流」，在右侧查看工作流步骤（含未完成项）',
    nestedSubflow: '子流程「{name}」，隶属于{parent}',
    chatUnderAgent: '对话「{name}」，隶属于 {agent}',
    openOnboardingAssistantChat: '打开对话「全自动化新员工入职助手」，在右侧继续会话',
    openChatContinue: '打开对话「{name}」，在右侧继续会话',
    agentFallback: 'Agent',
  },
  en: {
    statusSuccess: 'Success',
    statusWarning: 'Warning',
    statusError: 'Error',
    statusGeneric: 'Status',
    openOnboardingWorkflow: 'Open "New employee onboarding workflow" to view workflow steps on the right',
    openSalesManagerWorkflow: 'Open "Sales manager onboarding workflow" to view workflow steps (with incomplete items)',
    openSeniorRdWorkflow: 'Open "Senior R&D onboarding workflow" to view workflow steps (agent faults and incomplete tasks)',
    openIdentityVerification: 'Open "Identity verification" to view workflow steps (with incomplete items)',
    openOpsManagerWorkflow: 'Open "Operations manager onboarding workflow" to view workflow steps (with incomplete items)',
    openJuniorOpsWorkflow: 'Open "Junior ops onboarding workflow" to view workflow steps (with incomplete items)',
    nestedSubflow: 'Subflow "{name}" under {parent}',
    chatUnderAgent: 'Chat "{name}" under {agent}',
    openOnboardingAssistantChat: 'Open chat "Fully automated new-hire onboarding assistant" to continue on the right',
    openChatContinue: 'Open chat "{name}" to continue on the right',
    agentFallback: 'Agent',
  },
} as const

type HistoryStringKey = keyof (typeof STRINGS)['zh']

function historyT(locale: AppLocale, key: HistoryStringKey, vars?: Record<string, string>): string {
  let text: string = STRINGS[locale][key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v)
    }
  }
  return text
}

export function getHistoryItemDisplayName(id: string, fallbackName: string, locale: AppLocale): string {
  return SEED_NAMES[id]?.[locale] ?? fallbackName
}

export function localizeRunHistoryItem(item: RunHistoryItem, locale: AppLocale): RunHistoryItem {
  return {
    ...item,
    name: getHistoryItemDisplayName(item.id, item.name, locale),
  }
}

export function localizeRunHistoryItems(items: RunHistoryItem[], locale: AppLocale): RunHistoryItem[] {
  return items.map((item) => localizeRunHistoryItem(item, locale))
}

export function getOnboardingWorkflowGroupLabel(locale: AppLocale): string {
  return getHistoryItemDisplayName(HISTORY_IDS.onboardingWorkflowGroup, '新员工入职工作流', locale)
}

export function historyItemMatchesQuery(
  item: RunHistoryItem,
  query: string,
  locale: AppLocale,
  kindLabel: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const seed = SEED_NAMES[item.id]
  const names = [item.name, seed?.zh, seed?.en].filter(Boolean).map((n) => n!.toLowerCase())
  const display = getHistoryItemDisplayName(item.id, item.name, locale).toLowerCase()
  return (
    names.some((n) => n.includes(q)) ||
    display.includes(q) ||
    kindLabel.toLowerCase().includes(q) ||
    (item.kind === 'agent' && q.includes('agent'))
  )
}

export function getRunHistoryStatusAria(status: RunRecordStatus | undefined, locale: AppLocale): string {
  if (status === 'success') return historyT(locale, 'statusSuccess')
  if (status === 'warning') return historyT(locale, 'statusWarning')
  if (status === 'error') return historyT(locale, 'statusError')
  return historyT(locale, 'statusGeneric')
}

export function getRunHistoryRowAriaLabel(
  run: RunHistoryItem,
  locale: AppLocale,
  ctx: {
    nestedUnderAgentChat?: boolean
    nestedUnderOnboarding?: boolean
    parentAgentId?: string
    parentAgentFallbackName?: string
  },
): string | undefined {
  if (ctx.nestedUnderAgentChat) {
    const agentName = ctx.parentAgentId
      ? getHistoryItemDisplayName(ctx.parentAgentId, ctx.parentAgentFallbackName ?? '', locale)
      : (ctx.parentAgentFallbackName ?? historyT(locale, 'agentFallback'))
    return historyT(locale, 'chatUnderAgent', { name: run.name, agent: agentName })
  }
  if (run.id === HISTORY_IDS.onboardingScenario) return historyT(locale, 'openOnboardingWorkflow')
  if (run.id === HISTORY_IDS.salesManagerOnboarding) return historyT(locale, 'openSalesManagerWorkflow')
  if (run.id === HISTORY_IDS.seniorRdOnboarding) return historyT(locale, 'openSeniorRdWorkflow')
  if (run.id === HISTORY_IDS.identityVerification) return historyT(locale, 'openIdentityVerification')
  if (run.id === HISTORY_IDS.opsManagerOnboarding) return historyT(locale, 'openOpsManagerWorkflow')
  if (run.id === HISTORY_IDS.juniorOpsOnboarding) return historyT(locale, 'openJuniorOpsWorkflow')
  if (ctx.nestedUnderOnboarding) {
    return historyT(locale, 'nestedSubflow', {
      name: run.name,
      parent: getOnboardingWorkflowGroupLabel(locale),
    })
  }
  if (run.id === HISTORY_IDS.onboardingAssistantAgent) return historyT(locale, 'openOnboardingAssistantChat')
  if (run.kind === 'chat') {
    return historyT(locale, 'openChatContinue', { name: run.name })
  }
  return undefined
}
