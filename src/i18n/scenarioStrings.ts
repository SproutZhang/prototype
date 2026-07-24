import type { AppLocale } from './homeStrings'
import type { Agent, ScenarioRow } from '../types/agent'
import { formatAgentCardMeta } from '../utils/formatAgentCardMeta'
import { getAgentCreatorDisplay } from '../utils/agentCardAttribution'

export const ONBOARDING_SCENARIO_SOURCE_NAME = '入职流程编排Agent'

function scenarioDraftBadgeSeed(sourceName: string): number {
  let hash = 0
  for (let i = 0; i < sourceName.length; i++) {
    hash = (hash * 31 + sourceName.charCodeAt(i)) >>> 0
  }
  return hash
}

const STRINGS = {
  zh: {
    pageTitle: '场景配置',
    createScenario: '+ 创建场景',
    tabAll: '全部',
    tabMedical: '医疗',
    tabFinance: '金融',
    tabTech: '科技',
    tabAccounting: '财务',
    scenarioDraftBadge: '草稿',
    scenarioPublishedBadge: '已发布',
    scenarioFrozenBadge: '已冻结',
    scenarioFrozenMustActivate: '工作流已冻结，请先激活后再操作',
    scenarioActivateRun: '激活',
    backToList: '返回场景列表',
    backToCanvas: '返回工作流画布',
    back: '返回',
    close: '关闭',
    editPlaceholder: '在此修改场景名称、描述与分类等信息。（演示占位，接入后端后可保存。）',
    currentPage: '当前页面',
    workspaceAria: '工作区',
    workspaceSectionAria: '工作区版块',
    runTestTopbar: '运行测试顶部栏',
    runTest: '运行测试',
    nodeConfig: '节点配置',
    selectAgent: '选择代理人',
    branchAgent: '条件判断',
    branchAgentConfig: '条件判断配置',
    newScenario: '新场景',
    createScenarioSuccessTitle: '创建成功',
    createScenarioSuccessSub: '场景已创建，可继续配置工作流与发布。',
    publishAppTitle: '启动代理作为应用程序',
    publishReadyQuestion: '准备好发布您的代理了吗？',
    publishReadyLead:
      '在继续操作之前，请确保您对代理的运行状态感到满意。您之后对该代理所做的任何更改都将自动反映在已启动的应用程序中。应用程序启动后，将根据您的可见性设置显示。',
    publishSelectSpace: '选择空间',
    publishCreateSpace: '创建新的空间',
    publishConfirm: '是的，我准备好了。',
    publishSuccessTitle: '发布成功',
    publishSuccessSub: '您的代理已作为应用程序发布（演示）。',
    publishSuccessFollowUp: '是否立即前往空间查看，还是继续创建新的？',
    publishSuccessViewSpace: '立即前往查看',
    publishSuccessContinueCreate: '继续创建',
    publishVersionHistoryBtn: '版本记录',
    publishVersionDrawerTitle: '版本记录',
    publishVersionCurrentBadge: '当前版本',
    publishVersionEmpty: '暂无发布记录',
    publishVersionPublishedAction: '发布了版本 {version}',
    publishVersionDateJun8: '6月8日，星期一',
    publishVersionDateMay28: '5月28日，星期四',
    publishVersionDateToday: '今天',
    publishVersionRestore: '恢复',
    publishVersionRestoreHint: '可恢复到之前的版块',
    publishVersionEntryActions: '版本操作',
    saveSuccessTitle: '保存成功',
    saveSuccessSub: '工作区已保存（演示）。',
    blankPageBack: '返回',
    blankPageContentAria: '详情内容区',
    onboardingOrchestratorShort: '入职流程编排',
    triggerDesc: '满足触发条件时启动本场景工作流。',
    collectDesc: '收集入职表单、证件及补充材料',
    branchDesc: '根据条件做路径分流',
    accountDesc: '配置系统账户、权限与访问凭证。',
    trainingDesc: '分配培训课程并跟踪学习进度。',
    officeDesc: '开通工位、设备、门禁及协作工具。',
    cancel: '取消',
    save: '保存',
    manualConfig: '人工处理',
    accountSetup: '账户配置',
    startApproval: '发起审批',
    dataSettings: '数据设置',
    backToDataSettings: '返回数据设置',
    backToManualConfig: '返回人工处理',
    runBootLoading: '正在装配 Orchestrator、SubAgent 与运行上下文，请稍候…',
    workspaceMoreActions: '更多操作',
    workspaceTitleEdit: '编辑场景名称',
    workspaceMoreDuplicate: '复制',
    workspaceMoreRename: '重命名',
    workspaceMoreEditHistory: '查看编辑历史',
    workspaceMoreActivityLog: '查看活动日志',
    workspaceMoreFreezeRun: '冻结运行',
    workspaceMoreDelete: '删除',
    workspaceMoreDeleteConfirm: '确定要删除该场景吗？此操作不可撤销。',
    renameModalTitle: '重命名场景',
    renameModalLabel: '场景名称',
    renameModalPlaceholder: '输入场景名称',
    deleteModalTitle: '删除场景',
    deleteModalMessage: '确定要删除「{name}」吗？此操作不可撤销。',
    deleteModalConfirm: '删除',
    activityLogModalTitle: '活动日志',
    activityLogColTime: '时间',
    activityLogColActivity: '活动',
    activityLogColRun: '运行',
    activityLogColStep: '步骤',
    activityLogColDetails: '详情',
    activityLogDateMay25: '5月25日 星期一',
    activityLogDateMay19: '5月19日 星期二',
    activityLogAutomationError: '自动化错误',
    activityLogAutomationCompleted: '自动化已完成',
    activityLogHumanStepCompleted: '人工步骤已完成',
    activityLogWaitCompleted: '等待已完成',
    activityLogAiStepCompleted: 'AI 步骤已完成',
    activityLogPathSelected: '规则选择路径',
    activityLogNotification: '通知',
    activityLogRunUpgraded: '运行已升级',
    activityLogAutomationVerifyFailed: '系统在验证此自动化的输入数据时遇到问题。',
    activityLogIssuesTitle: '问题',
    activityLogExpandAutomationCompleted: '自动化步骤已成功执行，输出已写入下游节点。',
    activityLogExpandHumanStepCompleted: '审批人已完成该人工步骤，流程将继续执行。',
    activityLogExpandWaitCompleted: '等待条件已满足，工作流已恢复运行。',
    activityLogExpandAiStepCompleted: 'AI 步骤已处理完成并返回结构化结果。',
    activityLogExpandPathSelected: '已根据规则引擎选择后续执行路径。',
    activityLogExpandNotification: '通知已发送给相关参与者。',
    activityLogExpandRunUpgraded: '本次运行已升级至最新工作流版本，后续步骤将使用新版本逻辑。',
    activityLogFieldOnboardingDateMissing: "字段「入职日期」在「正文」中的引用已不可用",
    activityLogFieldEmployeeNameMissing: "字段「员工姓名」在「正文」中的引用已不可用",
    activityLogRunUpgradedDetail: '运行已升级至最新工作流版本。',
    activityLogDetailNotifyAdminOffice: '向行政团队发送通知，安排工位、设备及办公用品配置。',
    activityLogDetailCreateTrainingCalendar: '自动创建入职培训日历会议并邀请相关人员参会。',
    activityLogDetailApproveOfficeChecklist: '由负责人审批办公物品配置清单，确认采购与发放事项。',
    activityLogDetailAiLookupHolidays: '调用 AI 查询入职日期附近的法定节假日，用于排期计算。',
    activityLogDetailWaitForTraining: '按规则等待指定天数后，再触发入职培训相关后续步骤。',
    activityLogDetailNotifyHrCollectMaterials: '根据分支规则选择路径，并通知 HR 收集员工入职材料。',
    activityLogDetailConfigureBuddy: '为新员工自动配置入职导师或试用期辅导关系。',
    activityLogDetailNotifyConfirmMaterials: '向各相关角色发送通知，请求确认入职所需材料。',
    activityLogDetailHrConfirmMaterials: '由 HR 核对并确认员工提交的入职材料与基本信息。',
    activityLogDetailFilterCollaborators: '按预设规则筛选需协作的角色成员与对应邮件组。',
    activityLogDetailRunUpgraded: '将当前运行实例升级至最新工作流版本，以使用最新流程逻辑。',
    activityLogDetailCreateEmployeeAccount: '为新员工在各业务系统中自动创建账号与基础权限。',
    activityLogPathMatchSummary: '已选择路径「A • 审批通过」，因为其规则已匹配',
    activityLogPathMatchPathLine: '路径 1：A • 审批通过',
    activityLogPathMatchBlock: '区块 1',
    activityLogPathMatchBadgeMatched: '已匹配',
    activityLogPathMatchCheckingValue: '正在检查以下项的值',
    activityLogPathMatchApprovalLabel: '审批',
    activityLogPathMatchApproveValue: '通过',
    activityLogPathMatchIs: '为',
    freezeRunModalTitle: '冻结运行',
    freezeRunModalMessage: '确定要冻结「{name}」的所有运行实例吗？冻结后新触发将暂停，进行中的运行将被挂起。',
    freezeRunModalConfirm: '冻结',
    freezeRunSuccessTitle: '运行已冻结',
    freezeRunSuccessSub: '该工作流的新触发与进行中运行已暂停（演示）。',
    activateRunSuccessTitle: '已激活',
    activateRunSuccessSub: '该工作流已恢复运行（演示）。',
    editHistoryDrawerTitle: '编辑历史',
    editHistoryRevertSnapshot: '还原到快照',
    editHistoryDateJun8: '6月8日，星期一',
    editHistoryDateMay28: '5月28日，星期四',
    editHistoryChangedEmoji: '更改了工作流图标',
    editHistoryEditedTitle: '编辑了工作流标题',
    editHistoryUpdatedTrigger: '更新了工作流触发器',
    editHistoryEditedSchema: '编辑了步骤 {step} 的架构',
    editHistoryEditedStep: '编辑了步骤 {step}',
    editHistoryRemovedStep: '删除了一个步骤',
    editHistoryAddedStep: '添加了步骤 {step}',
    editHistoryPublishedWorkflow: '发布了工作流',
    editHistoryCreatedWorkflow: '创建了工作流',
    revertSnapshotModalTitle: '恢复到旧版本',
    revertSnapshotModalMessage: '确定恢复到该版本吗？',
    revertSnapshotModalConfirm: '是，恢复到此版本',
  },
  en: {
    pageTitle: 'Scenarios',
    createScenario: '+ Create scenario',
    tabAll: 'All',
    tabMedical: 'Healthcare',
    tabFinance: 'Finance',
    tabTech: 'Technology',
    tabAccounting: 'Accounting',
    scenarioDraftBadge: 'Draft',
    scenarioPublishedBadge: 'Published',
    scenarioFrozenBadge: 'Frozen',
    scenarioFrozenMustActivate: 'This workflow is frozen. Activate it to continue.',
    scenarioActivateRun: 'Activate',
    backToList: 'Back to scenario list',
    backToCanvas: 'Back to workflow canvas',
    back: 'Back',
    close: 'Close',
    editPlaceholder: 'Edit scenario name, description, category, and more. (Demo placeholder — persists when backend is connected.)',
    currentPage: 'Current page',
    workspaceAria: 'Workspace',
    workspaceSectionAria: 'Workspace sections',
    runTestTopbar: 'Run test top bar',
    runTest: 'Run test',
    nodeConfig: 'Node configuration',
    selectAgent: 'Select agent',
    branchAgent: 'Conditional decision',
    branchAgentConfig: 'Conditional decision configuration',
    newScenario: 'New scenario',
    createScenarioSuccessTitle: 'Created successfully',
    createScenarioSuccessSub: 'Scenario created. You can configure the workflow and publish next.',
    publishAppTitle: 'Launch agent as an application',
    publishReadyQuestion: 'Ready to publish your agent?',
    publishReadyLead:
      'Before continuing, make sure you are satisfied with how the agent runs. Any changes you make later will automatically appear in the launched application, which will be visible according to your visibility settings.',
    publishSelectSpace: 'Select space',
    publishCreateSpace: 'Create new space',
    publishConfirm: 'Yes, I am ready.',
    publishSuccessTitle: 'Published',
    publishSuccessSub: 'Your agent has been published as an application (demo).',
    publishSuccessFollowUp: 'Go to the space now, or continue creating?',
    publishSuccessViewSpace: 'View in space',
    publishSuccessContinueCreate: 'Continue creating',
    publishVersionHistoryBtn: 'Version history',
    publishVersionDrawerTitle: 'Version history',
    publishVersionCurrentBadge: 'Current',
    publishVersionEmpty: 'No published versions yet',
    publishVersionPublishedAction: 'Published version {version}',
    publishVersionDateJun8: 'Monday, June 8',
    publishVersionDateMay28: 'Thursday, May 28',
    publishVersionDateToday: 'Today',
    publishVersionRestore: 'Restore',
    publishVersionRestoreHint: 'Restore to a previous version',
    publishVersionEntryActions: 'Version actions',
    saveSuccessTitle: 'Saved',
    saveSuccessSub: 'Workspace saved (demo).',
    blankPageBack: 'Back',
    blankPageContentAria: 'Detail content',
    onboardingOrchestratorShort: 'Onboarding orchestration',
    triggerDesc: 'Start this scenario workflow when trigger conditions are met.',
    collectDesc: 'Collect onboarding forms, IDs, and supplemental materials',
    branchDesc: 'Route to different paths based on conditions',
    accountDesc: 'Configure system accounts, permissions, and access credentials.',
    trainingDesc: 'Assign training courses and track learning progress.',
    officeDesc: 'Provision desk, devices, access, and collaboration tools.',
    cancel: 'Cancel',
    save: 'Save',
    manualConfig: 'Manual step',
    accountSetup: 'Account setup',
    startApproval: 'Start approval',
    dataSettings: 'Data settings',
    backToDataSettings: 'Back to data settings',
    backToManualConfig: 'Back to manual configuration',
    runBootLoading: 'Setting up orchestrator, sub-agents, and run context…',
    workspaceMoreActions: 'More actions',
    workspaceTitleEdit: 'Edit scenario name',
    workspaceMoreDuplicate: 'Duplicate',
    workspaceMoreRename: 'Rename',
    workspaceMoreEditHistory: 'View edit history',
    workspaceMoreActivityLog: 'View activity log',
    workspaceMoreFreezeRun: 'Freeze run',
    workspaceMoreDelete: 'Delete',
    workspaceMoreDeleteConfirm: 'Delete this scenario? This cannot be undone.',
    renameModalTitle: 'Rename scenario',
    renameModalLabel: 'Scenario name',
    renameModalPlaceholder: 'Enter scenario name',
    deleteModalTitle: 'Delete scenario',
    deleteModalMessage: 'Delete "{name}"? This cannot be undone.',
    deleteModalConfirm: 'Delete',
    activityLogModalTitle: 'Activity log',
    activityLogColTime: 'Time',
    activityLogColActivity: 'Activity',
    activityLogColRun: 'Run',
    activityLogColStep: 'Step',
    activityLogColDetails: 'Details',
    activityLogDateMay25: 'Monday, May 25',
    activityLogDateMay19: 'Tuesday, May 19',
    activityLogAutomationError: 'Automation error',
    activityLogAutomationCompleted: 'Automation completed',
    activityLogHumanStepCompleted: 'Human step completed',
    activityLogWaitCompleted: 'Wait completed',
    activityLogAiStepCompleted: 'AI step completed',
    activityLogPathSelected: 'Path selected by rules',
    activityLogNotification: 'Notification',
    activityLogRunUpgraded: 'Run upgraded',
    activityLogAutomationVerifyFailed:
      'Relay.app encountered issues when verifying the input data for this automation.',
    activityLogIssuesTitle: 'Issues',
    activityLogExpandAutomationCompleted: 'The automation step completed successfully and outputs were passed downstream.',
    activityLogExpandHumanStepCompleted: 'The approver completed this human step and the workflow will continue.',
    activityLogExpandWaitCompleted: 'The wait condition was met and the workflow resumed.',
    activityLogExpandAiStepCompleted: 'The AI step finished and returned structured results.',
    activityLogExpandPathSelected: 'The rules engine selected the next execution path.',
    activityLogExpandNotification: 'A notification was sent to the relevant participants.',
    activityLogExpandRunUpgraded: 'This run was upgraded to the latest workflow version for subsequent steps.',
    activityLogFieldOnboardingDateMissing: "Field 'Onboarding date' referenced in 'Body' is no longer available",
    activityLogFieldEmployeeNameMissing: "Field 'Employee name' referenced in 'Body' is no longer available",
    activityLogRunUpgradedDetail: 'Run upgraded to the latest workflow version.',
    activityLogDetailNotifyAdminOffice:
      'Notify the admin team to provision desk, devices, and office supplies.',
    activityLogDetailCreateTrainingCalendar:
      'Automatically create an onboarding training calendar event and invite attendees.',
    activityLogDetailApproveOfficeChecklist:
      'Manager approves the office supplies checklist and confirms procurement items.',
    activityLogDetailAiLookupHolidays:
      'Use AI to look up public holidays near the onboarding date for scheduling.',
    activityLogDetailWaitForTraining:
      'Wait the configured number of days before triggering onboarding training steps.',
    activityLogDetailNotifyHrCollectMaterials:
      'Select the branch path by rules and notify HR to collect employee onboarding materials.',
    activityLogDetailConfigureBuddy:
      'Automatically configure an onboarding buddy or probation mentorship for the employee.',
    activityLogDetailNotifyConfirmMaterials:
      'Notify relevant stakeholders to confirm required onboarding materials.',
    activityLogDetailHrConfirmMaterials:
      'HR reviews and confirms submitted onboarding materials and basic employee information.',
    activityLogDetailFilterCollaborators:
      'Filter collaborator roles and mailing lists according to preset rules.',
    activityLogDetailRunUpgraded:
      'Upgrade the current run to the latest workflow version to use the newest logic.',
    activityLogDetailCreateEmployeeAccount:
      'Automatically create accounts and baseline permissions across business systems.',
    activityLogPathMatchSummary: 'Path "A • Approved" was selected because its rules matched',
    activityLogPathMatchPathLine: 'Path 1: A • Approved',
    activityLogPathMatchBlock: 'Block 1',
    activityLogPathMatchBadgeMatched: 'Matched',
    activityLogPathMatchCheckingValue: 'Checking whether the value of',
    activityLogPathMatchApprovalLabel: 'Approval',
    activityLogPathMatchApproveValue: 'Approve',
    activityLogPathMatchIs: 'is',
    freezeRunModalTitle: 'Freeze run',
    freezeRunModalMessage:
      'Freeze all run instances for "{name}"? New triggers will pause and in-progress runs will be suspended.',
    freezeRunModalConfirm: 'Freeze',
    freezeRunSuccessTitle: 'Runs frozen',
    freezeRunSuccessSub: 'New triggers and in-progress runs for this workflow are paused (demo).',
    activateRunSuccessTitle: 'Activated',
    activateRunSuccessSub: 'This workflow is running again (demo).',
    editHistoryDrawerTitle: 'Edit history',
    editHistoryRevertSnapshot: 'Revert to snapshot',
    editHistoryDateJun8: 'Monday, June 8',
    editHistoryDateMay28: 'Thursday, May 28',
    editHistoryChangedEmoji: 'changed the workflow emoji',
    editHistoryEditedTitle: 'edited the workflow title',
    editHistoryUpdatedTrigger: 'updated the workflow trigger',
    editHistoryEditedSchema: 'edited the schema for {step}',
    editHistoryEditedStep: 'edited step {step}',
    editHistoryRemovedStep: 'removed a step',
    editHistoryAddedStep: 'added step {step}',
    editHistoryPublishedWorkflow: 'published the workflow',
    editHistoryCreatedWorkflow: 'created the workflow',
    revertSnapshotModalTitle: 'Revert to old revision',
    revertSnapshotModalMessage: 'Do you want to revert your workflow to the revision from {time}?',
    revertSnapshotModalConfirm: 'Yes, revert to this revision',
  },
} as const

export type ScenarioStringKey = keyof (typeof STRINGS)['zh']

export function scenarioT(locale: AppLocale, key: ScenarioStringKey): string {
  return STRINGS[locale][key]
}

/** 场景复制名后缀：入职流程编排Agent 副本 / 入职流程编排Agent 副本 2 */
const SCENARIO_COPY_SUFFIX_RE = /^(.+?) 副本( (\d+))?$/

export function getScenarioDuplicateRoot(sourceName: string): string {
  const zhCopy = sourceName.match(SCENARIO_COPY_SUFFIX_RE)
  if (zhCopy) return zhCopy[1]
  const enCopy = sourceName.match(/^(.+?) Copy( (\d+))?$/)
  if (enCopy) return enCopy[1]
  return sourceName
}

export function isOnboardingScenarioSourceName(sourceName: string | null | undefined): boolean {
  if (!sourceName) return false
  return getScenarioDuplicateRoot(sourceName) === ONBOARDING_SCENARIO_SOURCE_NAME
}

export function isMarketScenarioSourceName(
  sourceName: string | null | undefined,
  agents: readonly Agent[],
): boolean {
  if (!sourceName) return false
  const agent = agents.find((entry) => entry.name === sourceName)
  return agent?.provenance === 'app-market-template'
}

export function hasScenarioWorkflowWorkspace(
  sourceName: string | null | undefined,
  agents: readonly Agent[],
): boolean {
  return isOnboardingScenarioSourceName(sourceName) || isMarketScenarioSourceName(sourceName, agents)
}

export function makeScenarioDuplicateName(baseName: string, usedNames: Set<string>): string {
  const root = getScenarioDuplicateRoot(baseName)
  const first = `${root} 副本`
  if (!usedNames.has(first)) return first
  let i = 2
  while (usedNames.has(`${root} 副本 ${i}`)) i++
  return `${root} 副本 ${i}`
}

/** 演示用：按场景源名称稳定「随机」约三分之一卡片展示已发布标签 */
export function isScenarioPublishedDemo(sourceName: string): boolean {
  if (isOnboardingScenarioSourceName(sourceName)) return false
  let hash = 0
  for (let i = 0; i < sourceName.length; i++) {
    hash = (hash * 47 + sourceName.charCodeAt(i)) >>> 0
  }
  return hash % 3 === 0
}

export function buildInitialPublishedScenarioSourceSet(sourceNames: string[]): Set<string> {
  return new Set(sourceNames.filter(isScenarioPublishedDemo))
}

/** 演示用：按场景源名称稳定「随机」约一半卡片展示草稿标签 */
export function getScenarioDraftBadge(sourceName: string, locale: AppLocale): string | null {
  if (isOnboardingScenarioSourceName(sourceName)) return null
  if (isScenarioPublishedDemo(sourceName)) return null
  if (scenarioDraftBadgeSeed(sourceName) % 2 !== 0) return null
  return scenarioT(locale, 'scenarioDraftBadge')
}

export type ScenarioCardStatusBadge = {
  label: string
  variant: 'draft' | 'frozen' | 'published'
}

export function getScenarioCardStatusBadges(
  sourceName: string,
  locale: AppLocale,
  frozenSourceNames: ReadonlySet<string>,
  publishedSourceNames: ReadonlySet<string>,
): ScenarioCardStatusBadge[] {
  if (frozenSourceNames.has(sourceName)) {
    return [{ label: scenarioT(locale, 'scenarioFrozenBadge'), variant: 'frozen' }]
  }
  if (publishedSourceNames.has(sourceName)) {
    return [{ label: scenarioT(locale, 'scenarioPublishedBadge'), variant: 'published' }]
  }
  const draftBadge = getScenarioDraftBadge(sourceName, locale)
  if (draftBadge) {
    return [{ label: draftBadge, variant: 'draft' }]
  }
  return []
}

export function getOnboardingDisplayName(locale: AppLocale): string {
  return locale === 'zh' ? '新员工入职' : 'New employee onboarding'
}

export function resolveOnboardingSourceName(raw: string, locale: AppLocale): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed === ONBOARDING_SCENARIO_SOURCE_NAME) return ONBOARDING_SCENARIO_SOURCE_NAME
  if (isOnboardingScenarioSourceName(trimmed)) return trimmed
  if (trimmed === '新员工入职' || trimmed === 'New employee onboarding') return ONBOARDING_SCENARIO_SOURCE_NAME
  const copySuffix = locale === 'zh' ? '副本' : ' Copy'
  if (trimmed === `${getOnboardingDisplayName(locale)}${copySuffix}`) return `${ONBOARDING_SCENARIO_SOURCE_NAME} 副本`
  return trimmed
}

function getScenarioCopyDisplayName(rootSourceName: string, copyNum: string | undefined, locale: AppLocale): string {
  const baseDisplay =
    rootSourceName === ONBOARDING_SCENARIO_SOURCE_NAME
      ? getOnboardingDisplayName(locale)
      : localizeScenarioSeedName(rootSourceName, locale)
  const suffix = locale === 'zh' ? '副本' : ' Copy'
  return copyNum ? `${baseDisplay}${suffix} ${copyNum}` : `${baseDisplay}${suffix}`
}

export function getScenarioDisplayName(agentName: string, locale: AppLocale): string {
  const zhCopy = agentName.match(SCENARIO_COPY_SUFFIX_RE)
  if (zhCopy) return getScenarioCopyDisplayName(zhCopy[1], zhCopy[3], locale)
  const enCopy = agentName.match(/^(.+?) Copy( (\d+))?$/)
  if (enCopy) return getScenarioCopyDisplayName(enCopy[1], enCopy[3], locale)
  if (agentName === ONBOARDING_SCENARIO_SOURCE_NAME) return getOnboardingDisplayName(locale)
  return localizeScenarioSeedName(agentName, locale)
}

const COLLECT_AGENT_LABELS_ZH: Record<string, string> = {
  collect: '信息收集 Agent',
  account: '账户设置 Agent',
  training: '培训协调 Agent',
  office: '办公配置 Agent',
  master: '入职总控 Agent',
  lnd: '学习与发展协调',
  'hr-onboarding-coord': '培训协调 Agent',
  orientation: '迎新与日程协调',
  hr: '人力资源入职经理',
  'employee-support': '信息整理 Agent',
  compliance: '文档与合规专员',
  'it-provisioning': '账户设置 Agent',
  'info-supplement': '信息补充 Agent',
  'info-organize': '信息整理 Agent',
}

const COLLECT_AGENT_LABELS_EN: Record<string, string> = {
  collect: 'Intake agent',
  account: 'Account setup agent',
  training: 'Training coordinator agent',
  office: 'Office provisioning agent',
  master: 'Onboarding orchestrator agent',
  lnd: 'Learning & development coordinator',
  'hr-onboarding-coord': 'Training coordinator agent',
  orientation: 'Orientation & scheduling coordinator',
  hr: 'HR onboarding manager',
  'employee-support': 'Information organization agent',
  compliance: 'Documents & compliance specialist',
  'it-provisioning': 'Account setup agent',
  'info-supplement': 'Information supplement agent',
  'info-organize': 'Information organization agent',
}

export function getCollectAgentLabel(id: string, locale: AppLocale): string {
  const map = locale === 'zh' ? COLLECT_AGENT_LABELS_ZH : COLLECT_AGENT_LABELS_EN
  return map[id] ?? COLLECT_AGENT_LABELS_ZH[id] ?? id
}

/** Canonical Chinese labels — used for internal title matching in saved state */
export const COLLECT_AGENT_LABELS = COLLECT_AGENT_LABELS_ZH

export function getCategoryLabel(category: ScenarioRow['category'], locale: AppLocale): string {
  const map: Record<NonNullable<ScenarioRow['category']>, { zh: string; en: string }> = {
    medical: { zh: '医疗', en: 'Healthcare' },
    finance: { zh: '金融', en: 'Finance' },
    tech: { zh: '科技', en: 'Technology' },
    accounting: { zh: '财务', en: 'Accounting' },
  }
  if (!category) return ''
  return map[category][locale]
}

const SEED_SCENARIOS: Record<
  string,
  { name: { zh: string; en: string }; desc: { zh: string; en: string } }
> = {
  [ONBOARDING_SCENARIO_SOURCE_NAME]: {
    name: { zh: '新员工入职', en: 'New employee onboarding' },
    desc: {
      zh: '总控协调器，统筹员工入职全流程并将任务委派给各子智能体…',
      en: 'Master coordinator managing the entire employee onboarding workflow by delegating tasks to sub-agents…',
    },
  },
  onboarding: {
    name: { zh: '入职助手', en: 'Onboarding Assistant' },
    desc: {
      zh: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',
      en: 'Helps you build a multi-agent project for employee onboarding, training, and related workflows…',
    },
  },
  'Game Sprint Pipeline': {
    name: { zh: '迭代冲刺工作流', en: 'Game Sprint Pipeline' },
    desc: {
      zh: '协调游戏版本冲刺的计划、任务分配与发布检查点。',
      en: 'Coordinates sprint planning, task assignment, and release checkpoints for game iterations.',
    },
  },
  'Art Asset Collaborator': {
    name: { zh: '美术资源协作', en: 'Art Asset Collaborator' },
    desc: {
      zh: '管理角色、场景与 UI 资源在美术管线中的评审与协作。',
      en: 'Manages character, scene, and UI asset reviews across the game art pipeline.',
    },
  },
  'Game Bug Triage Agent': {
    name: { zh: '缺陷分诊 Agent', en: 'Game Bug Triage Agent' },
    desc: {
      zh: '对游戏版本缺陷进行优先级排序、分派修复并跟踪验收。',
      en: 'Prioritizes defects, routes fixes, and tracks acceptance for game builds.',
    },
  },
}

function localizeScenarioSeedName(name: string, locale: AppLocale): string {
  return SEED_SCENARIOS[name]?.name[locale] ?? name
}

export function localizeScenarioSeedDesc(name: string, desc: string, locale: AppLocale): string {
  const root = getScenarioDuplicateRoot(name)
  return SEED_SCENARIOS[root]?.desc[locale] ?? SEED_SCENARIOS[name]?.desc[locale] ?? desc
}

export function localizeScenarioMeta(meta: string, locale: AppLocale): string {
  return formatAgentCardMeta(meta, locale)
}

export type ScenarioRouteRow = ScenarioRow & {
  sourceName: string
  creatorLabel?: string
  creatorVariant?: 'default' | 'template'
}

export function localizeScenarioForDisplay(
  row: ScenarioRouteRow,
  locale: AppLocale,
): ScenarioRouteRow {
  return {
    ...row,
    name: getScenarioDisplayName(row.sourceName, locale),
    desc: localizeScenarioSeedDesc(row.sourceName, row.desc, locale),
    meta: localizeScenarioMeta(row.meta, locale),
  }
}

export function localizeAgentsForScenarioList(agents: Agent[], locale: AppLocale): ScenarioRouteRow[] {
  return agents.map((a) => {
    const displayName = a.label?.trim() || getScenarioDisplayName(a.name, locale)
    const creator = getAgentCreatorDisplay(a, locale)
    return {
      sourceName: a.name,
      name: displayName,
      desc: localizeScenarioSeedDesc(a.name, a.desc, locale),
      meta: localizeScenarioMeta(a.meta, locale),
      tag: '',
      category: pickScenarioCategory(displayName),
      creatorLabel: creator.label,
      creatorVariant: creator.variant,
    }
  })
}

function pickScenarioCategory(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0
  const v = h % 4
  return v === 0 ? 'medical' : v === 1 ? 'finance' : v === 2 ? 'tech' : 'accounting'
}

export function getOnboardingWorkflowSteps(locale: AppLocale) {
  return [
    { key: 'trigger' as const, title: 'Trigger', desc: scenarioT(locale, 'triggerDesc') },
    {
      key: 'collect' as const,
      title: getCollectAgentLabel('collect', locale),
      desc: scenarioT(locale, 'collectDesc'),
    },
    {
      key: 'branch' as const,
      title: scenarioT(locale, 'branchAgent'),
      desc: scenarioT(locale, 'branchDesc'),
    },
  ]
}

export function getOnboardingParallelSteps(locale: AppLocale) {
  return [
    {
      key: 'account' as const,
      title: getCollectAgentLabel('account', locale),
      desc: scenarioT(locale, 'accountDesc'),
    },
    {
      key: 'training' as const,
      title: getCollectAgentLabel('training', locale),
      desc: scenarioT(locale, 'trainingDesc'),
    },
    {
      key: 'office' as const,
      title: getCollectAgentLabel('office', locale),
      desc: scenarioT(locale, 'officeDesc'),
    },
  ]
}

/** Create-scenario modal */
export const CREATE_SCENARIO_STRINGS = {
  zh: {
    modalTitle: '新建场景',
    close: '关闭',
    createModeAria: '创建方式',
    fromScratch: '从头开始',
    createCustom: '创建自定义场景',
    useTemplate: '使用模板',
    createCustomTitle: '创建自定义场景',
    question: '您希望这个场景做什么？',
    placeholder: '描述场景目标、参与系统与关键步骤…',
    submit: '创建场景',
    templateDraft: (t: string) => `使用模板：「${t}」\n请在此补充具体任务与集成需求。`,
    templates: [
      'Google 商家自动化助手',
      'Slack 一对一谈话要点生成器',
      '客户投诉分析助手',
      '爆款内容创作代理',
      'Notion 知识同步助手',
      'Zendesk 工单摘要代理',
    ] as const,
  },
  en: {
    modalTitle: 'New scenario',
    close: 'Close',
    createModeAria: 'Creation method',
    fromScratch: 'From scratch',
    createCustom: 'Create custom scenario',
    useTemplate: 'Use a template',
    createCustomTitle: 'Create custom scenario',
    question: 'What should this scenario do?',
    placeholder: 'Describe goals, systems involved, and key steps…',
    submit: 'Create scenario',
    templateDraft: (t: string) => `Using template: "${t}"\nAdd specific tasks and integration needs here.`,
    templates: [
      'Google Business automation assistant',
      'Slack 1:1 talking points generator',
      'Customer complaint analysis assistant',
      'Viral content creation agent',
      'Notion knowledge sync assistant',
      'Zendesk ticket summary agent',
    ] as const,
  },
} as const

export function createScenarioT(locale: AppLocale) {
  return CREATE_SCENARIO_STRINGS[locale]
}

/** 场景冻结确认弹窗与提示（与 Agent 库冻结交互一致） */
export const SCENARIO_FREEZE_STRINGS = {
  zh: {
    modalTitle: '冻结场景',
    modalMessage: '确定要冻结「{name}」吗？冻结后将暂停使用该场景。',
    modalConfirm: '冻结',
    close: '关闭',
    cancel: '取消',
    successTitle: '场景已冻结',
    successSub: '该场景已暂停使用（演示）。',
    successActivate: '激活',
    activateSuccessTitle: '场景已激活',
    activateSuccessSub: '该场景已恢复使用（演示）。',
  },
  en: {
    modalTitle: 'Freeze scenario',
    modalMessage: 'Freeze "{name}"? The scenario will be paused and unavailable for use.',
    modalConfirm: 'Freeze',
    close: 'Close',
    cancel: 'Cancel',
    successTitle: 'Scenario frozen',
    successSub: 'This scenario has been paused (demo).',
    successActivate: 'Activate',
    activateSuccessTitle: 'Scenario activated',
    activateSuccessSub: 'This scenario is available again (demo).',
  },
} as const

export function scenarioFreezeT(locale: AppLocale) {
  return SCENARIO_FREEZE_STRINGS[locale]
}
