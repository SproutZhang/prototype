import { useMemo } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { APP_MARKET_HOME_PREVIEW_LIMIT } from '../constants'
import { filterAppMarketItems } from '../shared/filter'
import type { AppMarketHomeProductFilter } from '../shared/types'
import { AGENT_TEMPLATE_CATALOG } from './data'

export function useAgentTemplatesMarket(
  locale: AppLocale,
  searchValue: string,
  homeProductLineFilter: AppMarketHomeProductFilter,
) {
  const isHomeSearchActive = searchValue.trim().length > 0
  const showSection = homeProductLineFilter === 'all' || homeProductLineFilter === 'agent-templates'

  const filteredHomeItems = useMemo(
    () => filterAppMarketItems(AGENT_TEMPLATE_CATALOG, searchValue, locale),
    [searchValue, locale],
  )

  const homeItems = useMemo(() => {
    if (isHomeSearchActive) return filteredHomeItems
    return AGENT_TEMPLATE_CATALOG.slice(0, APP_MARKET_HOME_PREVIEW_LIMIT)
  }, [filteredHomeItems, isHomeSearchActive])

  return {
    catalog: AGENT_TEMPLATE_CATALOG,
    filteredHomeItems,
    homeItems,
    showSection,
    showViewMore: !isHomeSearchActive && AGENT_TEMPLATE_CATALOG.length > APP_MARKET_HOME_PREVIEW_LIMIT,
    total: AGENT_TEMPLATE_CATALOG.length,
  }
}
