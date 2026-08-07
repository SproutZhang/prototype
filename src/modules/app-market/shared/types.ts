export type AppMarketProductLine = 'agent-templates' | 'scenario-templates' | 'tools' | 'skills'

export type AppMarketView = 'home' | AppMarketProductLine

/** 应用市场首页工具栏品类筛选 */
export type AppMarketHomeProductFilter = 'all' | AppMarketProductLine

export type AppMarketBadge = 'featured' | 'new'
export type AppMarketBrandIcon = 'gmail' | 'notion' | 'teams' | 'googleSheets'

/** Agents 模板库 / Tools 左侧筛选类别 */
export type AppMarketTemplateCategory =
  | 'marketing'
  | 'business-dev'
  | 'customer-support'
  | 'it-engineering'
  | 'operations'
  | 'hr-recruitment'
  | 'productivity'

export type AppMarketToolAction = {
  id: string
  description: string
}

/** 场景模板详情弹窗中的工作流程步骤 */
export type AppMarketScenarioWorkflowStep = {
  id: string
  titleZh: string
  titleEn: string
  pluginToolsZh?: string[]
  pluginToolsEn?: string[]
}

/** Agents 模板详情弹窗中的子代理（可展开查看提示词） */
export type AppMarketTemplateSubAgent = {
  id: string
  nameZh: string
  nameEn: string
  promptZh: string
  promptEn: string
  /** 子代理依赖的插件工具（中英文） */
  pluginToolsZh?: string[]
  pluginToolsEn?: string[]
}

export type AppMarketItem = {
  id: string
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
  /** 详情弹窗专用长描述（未设置时回退 descriptionZh / descriptionEn） */
  modalDescriptionZh?: string
  modalDescriptionEn?: string
  productLine: AppMarketProductLine
  publisher: string
  installs: string
  rating: number
  badge?: AppMarketBadge
  iconFrom: string
  iconTo: string
  brandIcon?: AppMarketBrandIcon
  /** Agents 模板库 / Tools 左侧筛选类别 */
  templateCategory?: AppMarketTemplateCategory
  /** Agents 模板：协同子代理（含提示词，详情弹窗展示） */
  subAgents?: AppMarketTemplateSubAgent[]
  /** Agents 模板：依赖的插件工具（中英文） */
  pluginToolsZh?: string[]
  pluginToolsEn?: string[]
  /** Tools：动作能力说明（中英文） */
  toolActionsZh?: AppMarketToolAction[]
  toolActionsEn?: AppMarketToolAction[]
  /** 场景模板：详情弹窗标签（中英文） */
  tagsZh?: string[]
  tagsEn?: string[]
  /** 场景模板：工作流程步骤 */
  workflowSteps?: AppMarketScenarioWorkflowStep[]
}
