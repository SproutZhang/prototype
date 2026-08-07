import { useMemo } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { APP_MARKET_HOME_PREVIEW_LIMIT } from '../constants'
import { filterAppMarketItems } from '../shared/filter'
import type { AppMarketHomeProductFilter } from '../shared/types'
import { TOOLS_CATALOG } from './data'

export function useToolsMarket(
  locale: AppLocale,
  searchValue: string,
  homeProductLineFilter: AppMarketHomeProductFilter,
) {
  const isHomeSearchActive = searchValue.trim().length > 0
  const showSection = homeProductLineFilter === 'all' || homeProductLineFilter === 'tools'

  const filteredHomeItems = useMemo(
    () => filterAppMarketItems(TOOLS_CATALOG, searchValue, locale),
    [searchValue, locale],
  )

  const homeItems = useMemo(() => {
    if (isHomeSearchActive) return filteredHomeItems
    return TOOLS_CATALOG.slice(0, APP_MARKET_HOME_PREVIEW_LIMIT)
  }, [filteredHomeItems, isHomeSearchActive])

  return {
    catalog: TOOLS_CATALOG,
    filteredHomeItems,
    homeItems,
    showSection,
    showViewMore: !isHomeSearchActive && TOOLS_CATALOG.length > APP_MARKET_HOME_PREVIEW_LIMIT,
    total: TOOLS_CATALOG.length,
  }
}
