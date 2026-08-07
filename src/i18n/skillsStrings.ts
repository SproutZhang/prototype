import type { AppLocale } from './homeStrings'

type LocalizableSkill = {
  id: string
  description: string
  trigger: string
}

const STRINGS = {
  zh: {
    title: '技能',
    filterLabel: '筛选',
    tabAll: '全部',
    tabReferenced: '引用',
    tabMine: '我的',
    searchPlaceholder: '搜索技能...',
    browseLibrary: '浏览技能库',
    createSkill: '创建技能',
    menuTitle: '技能创建',
    createModalSubtitle: '选择一种方式开始创建技能。',
    createWithAi: '使用 AI 创建',
    createWithAiDesc: '让 AI 帮你生成技能草稿。',
    uploadFiles: '上传文件',
    uploadFilesDesc: '仅支持上传 .zip 或 .md 文件。',
    writeInstructions: '增加技能说明',
    writeInstructionsDesc: '填写技能名称、描述和使用说明。',
    columnName: '名称',
    columnDescription: '描述',
    columnCreator: '创建者',
    paginationLabel: '技能列表分页',
    viewToggle: '切换技能列表展示方式',
    tableView: '列表视图',
    cardsView: '卡片视图',
    tableLabel: '技能记录列表',
    cardsLabel: '技能卡片列表',
    skillTag: '技能',
    referencedTag: '引用',
    previousPage: '上一页',
    nextPage: '下一页',
    pageSummary: '第 {current} / {total} 页',
    aiPageTitle: '智能创建',
    aiTag: '技能创建',
    inputPlaceholder: '你可以继续描述技能需求，输入 @ 也可以提及文件或系统',
    send: '发送',
    back: '返回技能列表',
    backToSkills: '返回技能页面',
    creatorSaved: '已创建技能',
    creatorSavedSub: '技能已添加到列表。',
    uploadSuccess: '已创建技能',
    uploadSuccessSub: '技能已添加到列表。',
    uploadInvalidType: '上传失败',
    uploadInvalidTypeSub: '仅支持上传 .zip 或 .md 格式的文件。',
    editSkill: '编辑',
    deleteSkill: '删除',
    openSkillActions: '打开技能操作菜单',
    skillDeleted: '已删除技能',
    skillDeletedSub: '技能已从列表中移除。',
    manualTitle: '增加技能',
    manualSubtitle: '填写技能名称、描述和使用说明。',
    manualName: '技能名称',
    manualDescription: '技能描述',
    manualInstructions: '技能说明',
    manualNamePlaceholder: '请输入技能名称...',
    manualDescriptionPlaceholder: '请输入技能描述...',
    manualInstructionsPlaceholder: '请输入技能说明...',
    cancel: '取消',
    save: '创建',
    assistantName: 'Joyce AI',
    thinking: '思考中',
    skillsNav: 'Skills',
    searchSkillsConfig: '搜索技能',
    skillFilesTitle: '技能文件',
    initialVersion: '最初版本',
    editChanges: '编辑修改',
    emptyVersionHistory: '保存后会在这里生成版本记录。',
    saveEdits: '保存',
    skillConfigTitle: '技能配置',
    addedBy: '添加者',
    trigger: '触发方式',
    descriptionLabel: '描述',
    previewSectionTitle: '技能内容预览',
    previewEye: '预览',
    previewCode: '代码视图',
    filterSkills: '筛选技能',
    sortMenuLabel: '技能排序方式',
    sortRecent: '最近更新',
    sortNameAsc: 'a-z',
    sortNameDesc: 'z-a',
    empty: '未找到匹配的技能。',
    filesPaneLabel: '该技能文件列表',
    previewFile: '预览',
    editFile: '编辑',
    downloadFile: '下载文件',
    skillProcessingTitle: 'AI 处理过程',
    expandProcessing: '展开处理过程',
    collapseProcessing: '收起处理过程',
    saveSkillCardAction: '添加技能',
    saveSkillCardType: '技能',
    saveSkillCardDownload: '下载技能文件',
    saveSkillCardInstalling: '安装中...',
    saveSkillCardInstalled: '安装成功',
    saveSkillCardInstalledSub: '技能已添加到你的工作区。',
    taglineAria: '任务·流程·能力·场景·编排',
    taglineTask: '任务',
    taglineFlow: '流程',
    taglineCapability: '能力',
    taglineScenario: '场景',
    taglineOrchestration: '编排',
    triggerMarketplaceInstall: '应用市场安装',
    triggerAiCreate: 'AI 创建 + 自动',
    triggerFileUpload: '文件上传 + 自动',
    triggerManualAdd: '手动添加',
  },
  en: {
    title: 'Skills',
    filterLabel: 'Filter',
    tabAll: 'All',
    tabReferenced: 'Referenced',
    tabMine: 'Mine',
    searchPlaceholder: 'Search skills...',
    browseLibrary: 'Browse Library',
    createSkill: 'Create Skill',
    menuTitle: 'Create Skill',
    createModalSubtitle: 'Choose how you want to start creating the skill.',
    createWithAi: 'Create With AI',
    createWithAiDesc: 'Let AI generate a skill for you.',
    uploadFiles: 'Upload Files',
    uploadFilesDesc: 'Only .zip or .md files are supported.',
    writeInstructions: 'Add Skill Instructions',
    writeInstructionsDesc: 'Write the skill name, description, and instructions.',
    columnName: 'Name',
    columnDescription: 'Description',
    columnCreator: 'Creator',
    paginationLabel: 'Skills list pagination',
    viewToggle: 'Switch skill list view',
    tableView: 'List view',
    cardsView: 'Card view',
    tableLabel: 'Skill records list',
    cardsLabel: 'Skill cards list',
    skillTag: 'Skill',
    referencedTag: 'Referenced',
    previousPage: 'Previous',
    nextPage: 'Next',
    pageSummary: 'Page {current} / {total}',
    aiPageTitle: 'Create Skill With AI',
    aiTag: 'Skill creation',
    inputPlaceholder: 'Describe the skill you want to create...',
    send: 'Send',
    back: 'Back to skills',
    backToSkills: 'Back to skills page',
    creatorSaved: 'Skill created',
    creatorSavedSub: 'The skill has been added to your list.',
    uploadSuccess: 'Skill created',
    uploadSuccessSub: 'The skill has been added to your list.',
    uploadInvalidType: 'Upload failed',
    uploadInvalidTypeSub: 'Only .zip or .md files are supported.',
    editSkill: 'Edit',
    deleteSkill: 'Delete',
    openSkillActions: 'Open skill actions menu',
    skillDeleted: 'Skill deleted',
    skillDeletedSub: 'The skill has been removed from your list.',
    manualTitle: 'Add a Skill',
    manualSubtitle: 'Write a name, description, and instructions for the skill.',
    manualName: 'Skill Name',
    manualDescription: 'Skill Description',
    manualInstructions: 'Instructions',
    manualNamePlaceholder: 'Enter a name for the skill...',
    manualDescriptionPlaceholder: 'Enter a description for the skill...',
    manualInstructionsPlaceholder: 'Enter instructions for the skill...',
    cancel: 'Cancel',
    save: 'Create',
    assistantName: 'Joyce AI',
    thinking: 'Thinking',
    skillsNav: 'Skills',
    searchSkillsConfig: 'Search skills',
    skillFilesTitle: 'Skill files',
    initialVersion: 'Initial version',
    editChanges: 'Edit changes',
    emptyVersionHistory: 'Saved edits will appear here.',
    saveEdits: 'Save',
    skillConfigTitle: 'Skill configuration',
    addedBy: 'Added by',
    trigger: 'Trigger',
    descriptionLabel: 'Description',
    previewSectionTitle: 'Skill preview',
    previewEye: 'Preview',
    previewCode: 'Code view',
    filterSkills: 'Filter skills',
    sortMenuLabel: 'Skills sort options',
    sortRecent: 'Recently updated',
    sortNameAsc: 'A-Z',
    sortNameDesc: 'Z-A',
    empty: 'No matching skills found.',
    filesPaneLabel: 'Skill file list',
    previewFile: 'Preview',
    editFile: 'Edit',
    downloadFile: 'Download file',
    skillProcessingTitle: 'AI processing',
    expandProcessing: 'Expand processing',
    collapseProcessing: 'Collapse processing',
    saveSkillCardAction: 'Add Skill',
    saveSkillCardType: 'Skill',
    saveSkillCardDownload: 'Download skill file',
    saveSkillCardInstalling: 'Installing...',
    saveSkillCardInstalled: 'Installed',
    saveSkillCardInstalledSub: 'The skill has been added to your workspace.',
    taglineAria: 'Task · Flow · Capability · Scenario · Orchestration',
    taglineTask: 'Task',
    taglineFlow: 'Flow',
    taglineCapability: 'Capability',
    taglineScenario: 'Scenario',
    taglineOrchestration: 'Orchestration',
    triggerMarketplaceInstall: 'Marketplace install',
    triggerAiCreate: 'AI creation + Auto',
    triggerFileUpload: 'File upload + Auto',
    triggerManualAdd: 'Manual add',
  },
} as const

export type SkillsStringKey = keyof (typeof STRINGS)['zh']

export function skillsT(locale: AppLocale, key: SkillsStringKey, vars?: Record<string, string | number>): string {
  let text: string = STRINGS[locale][key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}

export function getSkillsPageText(locale: AppLocale) {
  return STRINGS[locale]
}

const TRIGGER_LOCALE_MAP: Record<string, SkillsStringKey> = {
  '应用市场安装': 'triggerMarketplaceInstall',
  'Marketplace install': 'triggerMarketplaceInstall',
  'AI 创建 + 自动': 'triggerAiCreate',
  'AI creation + Auto': 'triggerAiCreate',
  '文件上传 + 自动': 'triggerFileUpload',
  'File upload + Auto': 'triggerFileUpload',
  '手动添加': 'triggerManualAdd',
  'Manual add': 'triggerManualAdd',
}

const SEED_SKILL_TRIGGERS: Record<string, { zh: string; en: string }> = {
  'skill-marketing-psychology': { zh: 'Slash command + 自动', en: 'Slash command + Auto' },
  'skill-account-briefing': { zh: '会议准备 + 自动', en: 'Meeting prep + Auto' },
  'skill-doc-coauthoring': { zh: '文档写作 + 自动', en: 'Doc writing + Auto' },
  'skill-canvas-design': { zh: '画布设计 + 手动', en: 'Canvas design + Manual' },
  'skill-skill-creator': { zh: '技能创建 + 自动', en: 'Skill creation + Auto' },
  'skill-web-artifacts-builder': { zh: 'Web 产物 + 自动', en: 'Web artifact + Auto' },
  'skill-onboarding-playbook': { zh: '入职流程 + 自动', en: 'Onboarding + Auto' },
  'skill-meeting-prep': { zh: '会议准备 + Slash', en: 'Meeting prep + Slash' },
}

const SEED_SKILL_DESCRIPTIONS: Record<string, { zh: string; en: string }> = {
  'skill-marketing-psychology': {
    zh: '应用心理学原则、心智模型与行为科学，帮助梳理营销策略与转化路径。',
    en: 'Apply psychology, mental models, and behavioral science to shape marketing strategy and conversion paths.',
  },
  'skill-account-briefing': {
    zh: '当用户需要会前准备、快速了解客户背景或会议对象时启用。',
    en: 'Use when users need meeting prep or a quick account briefing before a conversation.',
  },
  'skill-doc-coauthoring': {
    zh: '通过协作式流程帮助用户完成方案、技术文档、提案与规范撰写。',
    en: 'Guide users through co-authoring plans, technical docs, proposals, and specifications.',
  },
  'skill-canvas-design': {
    zh: '帮助用户将抽象需求转化为结构化画布或页面原型设计。',
    en: 'Turn abstract requirements into structured canvas or page prototype designs.',
  },
  'skill-skill-creator': {
    zh: '引导用户定义技能的目标、触发条件、边界与输出形式。',
    en: 'Help users define a skill goal, triggers, boundaries, and output format.',
  },
  'skill-web-artifacts-builder': {
    zh: '帮助用户生成网页内容、组件草稿和可交付的前端文案资产。',
    en: 'Generate web content, component drafts, and deliverable front-end copy assets.',
  },
  'skill-onboarding-playbook': {
    zh: '围绕入职场景生成流程、清单、材料模板与协作说明。',
    en: 'Produce onboarding playbooks, checklists, templates, and collaboration notes.',
  },
  'skill-meeting-prep': {
    zh: '将会议主题转成一页式准备摘要、风险提醒和提问提纲。',
    en: 'Turn a meeting topic into a one-page prep brief, risks, and question prompts.',
  },
}

export function localizeSkillTrigger(trigger: string, locale: AppLocale): string {
  const key = TRIGGER_LOCALE_MAP[trigger]
  if (key) return skillsT(locale, key)
  const seed = Object.values(SEED_SKILL_TRIGGERS).find((entry) => entry.zh === trigger || entry.en === trigger)
  if (seed) return seed[locale]
  return trigger
}

export function isMarketplaceSkill(skill: { id: string }): boolean {
  return skill.id.startsWith('market-skill-')
}

export function getSkillCardTag(skill: { id: string }, locale: AppLocale): string {
  return isMarketplaceSkill(skill) ? skillsT(locale, 'referencedTag') : skillsT(locale, 'skillTag')
}

export function localizeSkillForDisplay<T extends LocalizableSkill>(skill: T, locale: AppLocale): T {
  if (locale === 'zh') return skill
  const seedDesc = SEED_SKILL_DESCRIPTIONS[skill.id]
  const seedTrigger = SEED_SKILL_TRIGGERS[skill.id]
  return {
    ...skill,
    description: seedDesc?.en ?? skill.description,
    trigger: seedTrigger?.en ?? localizeSkillTrigger(skill.trigger, locale),
  }
}
