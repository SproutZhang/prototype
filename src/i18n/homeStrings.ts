export type AppLocale = 'zh' | 'en'

export const LOCALE_STORAGE_KEY = 'agentdemo-locale'

const HOME_TRANSLATIONS = {
  zh: {
    accountMenu: '账户菜单',
    admin: '管理员',
    darkMode: '深色模式',
    darkModeUnavailable: '暂不可用',
    language: '语言',
    export: '导出',
    import: '导入',
    navAccessControl: '访问控制',
    navAccessControlWorkspace: '工作区',
    navAccessControlUsers: '用户',
    navAccessControlRoles: '角色',
    versionInfo: '版本信息',
    accountSettings: '账户设置',
    workLog: '工作日志',
    signOut: '退出登录',
    openUserInfo: '打开用户信息',
    userInfo: '用户信息',
    navigation: '导航',
    features: '功能',
    collapseSidebar: '折叠侧边栏',
    expandSidebar: '展开侧边栏',
    navHome: '首页',
    navAgentLibrary: 'Agent库',
    navScenarios: '场景配置',
    navExperience: '体验',
    navAppMarket: '应用市场',
    navKnowledgeBase: '知识库',
    navTeamCollaborationSpace: '团队协作空间',
    navAnalytics: '分析',
    navTools: '工具',
    navSkills: '技能库',
    managersPortal: "Manager's Portal",
    historyRecords: '历史记录',
    toggleHistoryRecords: '折叠/展开历史记录',
    filterHistory: '筛选历史记录',
    goHome: '前往首页',
    filterHistoryByType: '按类型筛选历史',
    historyRecordTypes: '历史记录类型',
    filterHistoryPlaceholder: '输入关键字筛选…',
    noMatchingRecords: '无匹配记录',
    noRecordsInType: '该类型下暂无记录',
    noRecords: '暂无记录',
    historyRecordList: '历史记录列表',
    homeTitle: '今天你想自动化什么?',
    homeSubtitle: 'What can I do for you?',
    enterTask: '输入任务',
    composerPlaceholder: '我可以为你搭建或执行任何任务',
    userChatInput: '对话输入',
    userChatPlaceholder: '请输入你的问题…',
    userChatDemoReply: '（演示）已收到你的消息。',
    userRecruitContextTag: '招聘高级前端',
    userRecruitContextPrompt: '招 1 名高级前端，3 年+ React',
    homePendingApprovalIconAria: '查看我的待办',
    planModeInput: 'Plan Mode 输入',
    buildModeInput: 'Build Mode 输入',
    modeQuickSwitch: '模式快捷切换',
    send: '发送',
    voiceInput: '语音输入',
    stopVoiceInput: '停止语音输入',
    voiceInputStartTitle: '点击开始语音输入（再次点击结束）',
    voiceInputStopTitle: '点击结束识别',
    content: '内容',
    sectionExperience: '体验',
    sectionKnowledgeBase: '知识库',
    sectionTeamCollaborationSpace: '团队协作空间',
    sectionAnalytics: '分析',
    sectionTools: '工具',
    sectionSkills: '技能',
    sectionAgents: 'Agents',
    sectionScenarios: '场景配置',
    runKindChat: '对话',
    runKindAgent: 'Agent',
    runKindScenario: '场景',
    filterAll: '全部',
    filterChatRecords: '对话记录',
    filterAgent: 'Agent',
    filterScenario: '场景',
    sidebarUserName: 'Manager',
    onboardShortcutsAriaLabel: '入职场景快捷入口',
    onboardShortcutAgent: '辅助新员工入职智能体',
    onboardShortcutWorkflow: '新员工入职工作流',
    planWorkflowEntryTrigger: '入职工作流',
  },
  en: {
    accountMenu: 'Account menu',
    admin: 'Administrator',
    darkMode: 'Dark mode',
    darkModeUnavailable: 'Unavailable',
    language: 'Language',
    export: 'Export',
    import: 'Import',
    navAccessControl: 'Access control',
    navAccessControlWorkspace: 'Workspace',
    navAccessControlUsers: 'Users',
    navAccessControlRoles: 'Roles',
    versionInfo: 'Version info',
    accountSettings: 'Account settings',
    workLog: 'Work log',
    signOut: 'Sign out',
    openUserInfo: 'Open user profile',
    userInfo: 'User profile',
    navigation: 'Navigation',
    features: 'Features',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    navHome: 'Home',
    navAgentLibrary: 'Agents',
    navScenarios: 'Scenarios',
    navExperience: 'Experience',
    navAppMarket: 'App Marketplace',
    navKnowledgeBase: 'Knowledge Base',
    navTeamCollaborationSpace: 'Team Collaboration Space',
    navAnalytics: 'Analytics',
    navTools: 'Tools',
    navSkills: 'Skills',
    managersPortal: "Manager's Portal",
    historyRecords: 'History',
    toggleHistoryRecords: 'Expand or collapse history',
    filterHistory: 'Filter history',
    goHome: 'Go to home',
    filterHistoryByType: 'Filter history by type',
    historyRecordTypes: 'History record types',
    filterHistoryPlaceholder: 'Filter by keyword…',
    noMatchingRecords: 'No matching records',
    noRecordsInType: 'No records for this type',
    noRecords: 'No records yet',
    historyRecordList: 'History list',
    homeTitle: 'What would you like to automate today?',
    homeSubtitle: 'What can I do for you?',
    enterTask: 'Enter a task',
    composerPlaceholder: 'I can help you build or run any task',
    userChatInput: 'Chat input',
    userChatPlaceholder: 'Ask anything…',
    userChatDemoReply: '(Demo) Got your message.',
    userRecruitContextTag: 'Senior Frontend Hiring',
    userRecruitContextPrompt: 'Hire 1 senior frontend engineer, 3+ years React',
    homePendingApprovalIconAria: 'View my inbox',
    planModeInput: 'Plan Mode input',
    buildModeInput: 'Build Mode input',
    modeQuickSwitch: 'Mode quick switch',
    send: 'Send',
    voiceInput: 'Voice input',
    stopVoiceInput: 'Stop voice input',
    voiceInputStartTitle: 'Click to start voice input (click again to stop)',
    voiceInputStopTitle: 'Click to stop recognition',
    content: 'Content',
    sectionExperience: 'Experience',
    sectionKnowledgeBase: 'Knowledge Base',
    sectionTeamCollaborationSpace: 'Team Collaboration Space',
    sectionAnalytics: 'Analytics',
    sectionTools: 'Tools',
    sectionSkills: 'Skills',
    sectionAgents: 'Agents',
    sectionScenarios: 'Scenarios',
    runKindChat: 'Chat',
    runKindAgent: 'Agent',
    runKindScenario: 'Scenario',
    filterAll: 'All',
    filterChatRecords: 'Chats',
    filterAgent: 'Agents',
    filterScenario: 'Scenarios',
    sidebarUserName: 'Manager',
    onboardShortcutsAriaLabel: 'Onboarding quick shortcuts',
    onboardShortcutAgent: 'New employee onboarding assistant',
    onboardShortcutWorkflow: 'New employee onboarding workflow',
    planWorkflowEntryTrigger: 'Onboarding workflow',
  },
} as const

export type HomeTranslationKey = keyof (typeof HOME_TRANSLATIONS)['zh']

export function getHomeTranslation(locale: AppLocale, key: HomeTranslationKey): string {
  return HOME_TRANSLATIONS[locale][key]
}

export function getOnboardShortcutAgentTitle(locale: AppLocale): string {
  return getHomeTranslation(locale, 'onboardShortcutAgent')
}

export function getOnboardShortcutWorkflowTitle(locale: AppLocale): string {
  return getHomeTranslation(locale, 'onboardShortcutWorkflow')
}

export function getPlanWorkflowEntryTrigger(locale: AppLocale): string {
  return getHomeTranslation(locale, 'planWorkflowEntryTrigger')
}

export function matchesOnboardShortcutAgent(text: string): boolean {
  const s = text.trim()
  return (['zh', 'en'] as const).some((locale) => s === getOnboardShortcutAgentTitle(locale))
}

export function matchesOnboardShortcutWorkflow(text: string): boolean {
  const s = text.trim()
  return (['zh', 'en'] as const).some((locale) => s === getOnboardShortcutWorkflowTitle(locale))
}

export function matchesPlanWorkflowEntry(text: string): boolean {
  const s = text.trim()
  if (!s) return false
  if (matchesOnboardShortcutWorkflow(s)) return true
  const zhTrigger = HOME_TRANSLATIONS.zh.planWorkflowEntryTrigger
  const enTrigger = HOME_TRANSLATIONS.en.planWorkflowEntryTrigger
  if (s === zhTrigger || s === enTrigger) return true
  const lower = s.toLowerCase()
  return s.includes(zhTrigger) || lower.includes(enTrigger.toLowerCase())
}

export function readStoredLocale(): AppLocale {
  if (typeof localStorage === 'undefined') return 'zh'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored === 'en' ? 'en' : 'zh'
}

export function applyDocumentLocale(locale: AppLocale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
}
