import type { AppLocale } from '../../../i18n/homeStrings'
import type { AppMarketTemplateCategory } from './types'

/** 应用市场左侧「按类别浏览」筛选项（Agents 模板库 / Tools 共用） */
export const APP_MARKET_BROWSE_CATEGORIES: AppMarketTemplateCategory[] = [
  'marketing',
  'business-dev',
  'customer-support',
  'it-engineering',
  'operations',
  'hr-recruitment',
  'productivity',
]

const CATEGORY_LABELS: Record<AppMarketTemplateCategory, { zh: string; en: string }> = {
  marketing: { zh: '营销', en: 'Marketing' },
  'business-dev': { zh: '业务拓展', en: 'Business Development' },
  'customer-support': { zh: '客户支持', en: 'Customer Support' },
  'it-engineering': { zh: '信息技术与工程', en: 'IT & Engineering' },
  operations: { zh: '运营与物流', en: 'Operations & Logistics' },
  'hr-recruitment': { zh: '人力资源与招聘', en: 'HR & Recruitment' },
  productivity: { zh: '生产力和工作空间', en: 'Productivity & Workspace' },
}

export function appMarketBrowseCategoryLabel(
  locale: AppLocale,
  category: AppMarketTemplateCategory,
): string {
  return CATEGORY_LABELS[category][locale]
}
