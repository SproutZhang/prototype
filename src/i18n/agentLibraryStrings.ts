import type { AppLocale } from './homeStrings'

/** Create-agent modal */
export const CREATE_AGENT_STRINGS = {
  zh: {
    modalTitle: '新建 Agent',
    close: '关闭',
    createModeAria: '创建方式',
    fromScratch: '从头开始',
    createCustom: '创建自定义 Agent',
    useTemplate: '使用模板',
    createCustomTitle: '创建自定义 Agent',
    question: '您希望这个 Agent 做什么？',
    placeholder: '描述 Agent 的目标、能力边界与典型使用场景…',
    submit: '创建 Agent',
    templateDraft: (t: string) => `使用模板：「${t}」\n请在此补充具体任务、工具与输出要求。`,
    templates: [
      '新员工入职模板包',
      '销售经理入职模板',
      'IT 开通协调 Agent 模板',
      '客户支持 Agent',
      '文档摘要 Agent',
      '会议纪要用 Agent',
    ] as const,
  },
  en: {
    modalTitle: 'New Agent',
    close: 'Close',
    createModeAria: 'Creation method',
    fromScratch: 'From scratch',
    createCustom: 'Create custom agent',
    useTemplate: 'Use a template',
    createCustomTitle: 'Create custom agent',
    question: 'What should this agent do?',
    placeholder: 'Describe goals, capabilities, and typical use cases…',
    submit: 'Create agent',
    templateDraft: (t: string) => `Using template: "${t}"\nAdd specific tasks, tools, and output requirements here.`,
    templates: [
      'Onboarding Starter Pack',
      'Sales Manager Onboarding Template',
      'IT Provisioning Coordinator Agent',
      'Customer Support Agent',
      'Document Summary Agent',
      'Meeting Notes Agent',
    ] as const,
  },
} as const

export function createAgentT(locale: AppLocale) {
  return CREATE_AGENT_STRINGS[locale]
}

/** Agent 发布确认弹窗 */
export const AGENT_PUBLISH_STRINGS = {
  zh: {
    modalTitle: '发布 Agent',
    close: '关闭',
    question: '准备好发布您的 Agent 了吗？',
    lead:
      '在继续操作之前，请确认当前 Agent 配置已满足预期。发布后将部署至所选空间；后续配置变更需重新发布才会生效。',
    publishSuccessTitle: '发布成功',
    publishSuccessSub: '您的 Agent 已发布至所选空间（演示）。',
    publishSuccessFollowUp: '是否立即前往空间查看，还是继续创建新的？',
    publishSuccessViewSpace: '立即前往查看',
    publishSuccessContinueCreate: '继续创建',
  },
  en: {
    modalTitle: 'Publish Agent',
    close: 'Close',
    question: 'Ready to publish this agent?',
    lead:
      'Before you continue, make sure the current agent configuration meets your expectations. It will be deployed to the selected space; configuration changes require republishing to take effect.',
    publishSuccessTitle: 'Published',
    publishSuccessSub: 'Your agent has been published to the selected space (demo).',
    publishSuccessFollowUp: 'Go to the space now, or continue creating?',
    publishSuccessViewSpace: 'View in space',
    publishSuccessContinueCreate: 'Continue creating',
  },
} as const

export function agentPublishT(locale: AppLocale) {
  return AGENT_PUBLISH_STRINGS[locale]
}

export function formatAgentPublishedToastSub(locale: AppLocale, spaceLabel: string): string {
  return locale === 'zh'
    ? `Agent 已发布至「${spaceLabel}」。`
    : `Agent published to "${spaceLabel}".`
}

function isAgentPublishedDemo(seed: string): boolean {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 47 + seed.charCodeAt(i)) >>> 0
  return h % 3 === 0
}

export function buildInitialPublishedAgentNameSet(agentNames: string[]): Set<string> {
  return new Set(agentNames.filter(isAgentPublishedDemo))
}

export function getAgentPublishedStatusBadge(locale: AppLocale): { label: string; variant: 'published' } {
  return { label: locale === 'zh' ? '已发布' : 'Published', variant: 'published' }
}

export function getAgentFrozenStatusBadge(locale: AppLocale): { label: string; variant: 'frozen' } {
  return { label: locale === 'zh' ? '已冻结' : 'Frozen', variant: 'frozen' }
}

/** Agent 冻结确认弹窗与提示 */
export const AGENT_FREEZE_STRINGS = {
  zh: {
    modalTitle: '冻结 Agent',
    modalMessage: '确定要冻结「{name}」吗？冻结后将暂停使用该 Agent。',
    modalConfirm: '冻结',
    close: '关闭',
    cancel: '取消',
    successTitle: 'Agent 已冻结',
    successSub: '该 Agent 已暂停使用（演示）。',
    activateSuccessTitle: 'Agent 已激活',
    activateSuccessSub: '该 Agent 已恢复使用（演示）。',
  },
  en: {
    modalTitle: 'Freeze agent',
    modalMessage: 'Freeze "{name}"? The agent will be paused and unavailable for use.',
    modalConfirm: 'Freeze',
    close: 'Close',
    cancel: 'Cancel',
    successTitle: 'Agent frozen',
    successSub: 'This agent has been paused (demo).',
    activateSuccessTitle: 'Agent activated',
    activateSuccessSub: 'This agent is available again (demo).',
  },
} as const

export function agentFreezeT(locale: AppLocale) {
  return AGENT_FREEZE_STRINGS[locale]
}

export function getAgentLibraryCardStatusBadges(
  agentName: string,
  locale: AppLocale,
): Array<{ label: string; variant: 'published' }> {
  if (!isAgentPublishedDemo(agentName)) return []
  return [{ label: locale === 'zh' ? '已发布' : 'Published', variant: 'published' }]
}
