import { useMemo } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { APP_MARKET_HOME_PREVIEW_LIMIT } from '../constants'
import { filterAppMarketItems } from '../shared/filter'
import type { AppMarketHomeProductFilter } from '../shared/types'
import { SKILLS_CATALOG } from './data'

export function useSkillsMarket(
  locale: AppLocale,
  searchValue: string,
  homeProductLineFilter: AppMarketHomeProductFilter,
) {
  const isHomeSearchActive = searchValue.trim().length > 0
  const showSection = homeProductLineFilter === 'all' || homeProductLineFilter === 'skills'

  const filteredHomeItems = useMemo(
    () => filterAppMarketItems(SKILLS_CATALOG, searchValue, locale),
    [searchValue, locale],
  )

  const homeItems = useMemo(() => {
    if (isHomeSearchActive) return filteredHomeItems
    return SKILLS_CATALOG.slice(0, APP_MARKET_HOME_PREVIEW_LIMIT)
  }, [filteredHomeItems, isHomeSearchActive])

  return {
    catalog: SKILLS_CATALOG,
    filteredHomeItems,
    homeItems,
    showSection,
    showViewMore: !isHomeSearchActive && SKILLS_CATALOG.length > APP_MARKET_HOME_PREVIEW_LIMIT,
    total: SKILLS_CATALOG.length,
  }
}
