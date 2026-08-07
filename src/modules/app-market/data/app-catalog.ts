import { AGENT_TEMPLATE_CATALOG } from '../agent-templates'
import { SCENARIO_TEMPLATE_CATALOG } from '../scenario-templates'
import { SKILLS_CATALOG } from '../skills'
import { TOOLS_CATALOG } from '../tools'
import type { AppMarketItem, AppMarketProductLine } from '../shared/types'

export { AGENT_TEMPLATE_CATALOG, SCENARIO_TEMPLATE_CATALOG, TOOLS_CATALOG, SKILLS_CATALOG }

const CATALOG_BY_LINE: Record<AppMarketProductLine, AppMarketItem[]> = {
  'agent-templates': AGENT_TEMPLATE_CATALOG,
  'scenario-templates': SCENARIO_TEMPLATE_CATALOG,
  tools: TOOLS_CATALOG,
  skills: SKILLS_CATALOG,
}

export function getCatalogByProductLine(line: AppMarketProductLine): AppMarketItem[] {
  return CATALOG_BY_LINE[line]
}

export function findAppMarketItem(id: string): AppMarketItem | undefined {
  return [
    ...AGENT_TEMPLATE_CATALOG,
    ...SCENARIO_TEMPLATE_CATALOG,
    ...TOOLS_CATALOG,
    ...SKILLS_CATALOG,
  ].find((item) => item.id === id)
}
