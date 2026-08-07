import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketT } from '../i18n/strings'
import {
  APP_MARKET_BROWSE_CATEGORIES,
  appMarketBrowseCategoryLabel,
} from './categories'
import type { AppMarketTemplateCategory } from './types'

type AppMarketCategorySidebarProps = {
  locale: AppLocale
  activeCategory: AppMarketTemplateCategory | null
  onSelectCategory: (category: AppMarketTemplateCategory | null) => void
}

export function AppMarketCategorySidebar({
  locale,
  activeCategory,
  onSelectCategory,
}: AppMarketCategorySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={
        isCollapsed
          ? 'app-market-category-sidebar is-collapsed'
          : 'app-market-category-sidebar'
      }
      aria-label={appMarketT(locale, 'browseByCategory')}
    >
      {isCollapsed ? (
        <button
          type="button"
          className="app-market-category-sidebar-expand"
          aria-label={appMarketT(locale, 'expandCategoryFilter')}
          title={appMarketT(locale, 'expandCategoryFilter')}
          onClick={() => setIsCollapsed(false)}
        >
          <span className="app-market-category-sidebar-expand-icon" aria-hidden="true">
            ›
          </span>
          <span className="app-market-category-sidebar-expand-label">
            {appMarketT(locale, 'browseByCategory')}
          </span>
        </button>
      ) : (
        <>
          <div className="app-market-category-sidebar-head">
            <h2 className="app-market-category-sidebar-title">{appMarketT(locale, 'browseByCategory')}</h2>
            <button
              type="button"
              className="app-market-category-sidebar-collapse"
              aria-label={appMarketT(locale, 'collapseCategoryFilter')}
              title={appMarketT(locale, 'collapseCategoryFilter')}
              onClick={() => setIsCollapsed(true)}
            >
              ‹
            </button>
          </div>
          <nav className="app-market-category-nav">
            <ul className="app-market-category-list">
              <li>
                <button
                  type="button"
                  className={
                    activeCategory === null
                      ? 'app-market-category-item is-active'
                      : 'app-market-category-item'
                  }
                  aria-current={activeCategory === null ? 'true' : undefined}
                  onClick={() => onSelectCategory(null)}
                >
                  <span className="app-market-category-item-label">
                    {appMarketT(locale, 'categoryAll')}
                  </span>
                  <span className="app-market-category-item-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
              {APP_MARKET_BROWSE_CATEGORIES.map((category) => {
                const isActive = activeCategory === category
                return (
                  <li key={category}>
                    <button
                      type="button"
                      className={
                        isActive
                          ? 'app-market-category-item is-active'
                          : 'app-market-category-item'
                      }
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => onSelectCategory(category)}
                    >
                      <span className="app-market-category-item-label">
                        {appMarketBrowseCategoryLabel(locale, category)}
                      </span>
                      <span className="app-market-category-item-chevron" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </>
      )}
    </aside>
  )
}
