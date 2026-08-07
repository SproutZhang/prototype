import { useMemo } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { APP_MARKET_HOME_PREVIEW_LIMIT } from '../constants'
import { filterAppMarketItems } from '../shared/filter'
import type { AppMarketHomeProductFilter } from '../shared/types'
import { SCENARIO_TEMPLATE_CATALOG } from './data'

export function useScenarioTemplatesMarket(
  locale: AppLocale,
  searchValue: string,
  homeProductLineFilter: AppMarketHomeProductFilter,
) {
  const isHomeSearchActive = searchValue.trim().length > 0
  const showSection =
    homeProductLineFilter === 'all' || homeProductLineFilter === 'scenario-templates'

  const filteredHomeItems = useMemo(
    () => filterAppMarketItems(SCENARIO_TEMPLATE_CATALOG, searchValue, locale),
    [searchValue, locale],
  )

  const homeItems = useMemo(() => {
    if (isHomeSearchActive) return filteredHomeItems
    return SCENARIO_TEMPLATE_CATALOG.slice(0, APP_MARKET_HOME_PREVIEW_LIMIT)
  }, [filteredHomeItems, isHomeSearchActive])

  return {
    catalog: SCENARIO_TEMPLATE_CATALOG,
    filteredHomeItems,
    homeItems,
    showSection,
    showViewMore:
      !isHomeSearchActive && SCENARIO_TEMPLATE_CATALOG.length > APP_MARKET_HOME_PREVIEW_LIMIT,
    total: SCENARIO_TEMPLATE_CATALOG.length,
  }
}
