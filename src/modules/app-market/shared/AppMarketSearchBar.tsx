import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketT } from '../i18n/strings'
import type { AppMarketHomeProductFilter } from './types'
import { AppMarketViewToggle, type AppMarketListViewMode } from './AppMarketViewToggle'

type AppMarketSearchBarProps = {
  locale: AppLocale
  value: string
  onChange: (value: string) => void
  /** 首页品类筛选（全部 / Agents / Tools） */
  showProductLineFilter?: boolean
  productLineFilter?: AppMarketHomeProductFilter
  onProductLineFilterChange?: (value: AppMarketHomeProductFilter) => void
  showViewToggle?: boolean
  viewMode?: AppMarketListViewMode
  onViewModeChange?: (mode: AppMarketListViewMode) => void
}

/** 与体验页 AgentCardsGrid 搜索栏同系（agents-toolbar / agents-search） */
export function AppMarketSearchBar({
  locale,
  value,
  onChange,
  showProductLineFilter = false,
  productLineFilter = 'all',
  onProductLineFilterChange,
  showViewToggle = false,
  viewMode = 'cards',
  onViewModeChange,
}: AppMarketSearchBarProps) {
  return (
    <div className="agents-toolbar app-market-toolbar">
      <div className="agents-toolbar-left">
        {showProductLineFilter ? (
          <div className="agents-toolbar-filter-wrap">
            <label className="sr-only" htmlFor="app-market-product-line-filter">
              {appMarketT(locale, 'homeFilterLabel')}
            </label>
            <select
              id="app-market-product-line-filter"
              className="agents-toolbar-filter"
              value={productLineFilter}
              aria-label={appMarketT(locale, 'homeFilterLabel')}
              onChange={(e) =>
                onProductLineFilterChange?.(e.target.value as AppMarketHomeProductFilter)
              }
            >
              <option value="all">{appMarketT(locale, 'homeFilterAll')}</option>
              <option value="agent-templates">{appMarketT(locale, 'homeFilterAgents')}</option>
              <option value="scenario-templates">{appMarketT(locale, 'homeFilterScenarios')}</option>
              <option value="tools">{appMarketT(locale, 'homeFilterTools')}</option>
              <option value="skills">{appMarketT(locale, 'homeFilterSkills')}</option>
            </select>
          </div>
        ) : null}
        <label className="agents-search">
          <span className="agents-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="agents-search-input"
            type="search"
            value={value}
            placeholder={appMarketT(locale, 'searchPlaceholder')}
            aria-label={appMarketT(locale, 'searchPlaceholder')}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
      {showViewToggle && onViewModeChange ? (
        <div className="app-market-toolbar-actions">
          <AppMarketViewToggle locale={locale} viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      ) : (
        <div className="agents-toolbar-right">
          <div className="agents-view-actions" />
        </div>
      )}
    </div>
  )
}
