import { useMemo, useState } from 'react'

import { PlanBlueprintToolIcon } from '../../../components/shared/WfBlueprintStepsBlock'
import { AgentCardsGrid } from '../../../components/shared/AgentCardsGrid'
import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketProductLineTitle, appMarketResultCountLabel, appMarketT } from '../i18n/strings'
import { filterAppMarketItems } from './filter'
import { AppMarketCategorySidebar } from './AppMarketCategorySidebar'
import { AppMarketSearchBar } from './AppMarketSearchBar'
import { mapAppMarketItemsToCards, type AppMarketCardRow } from './mapToCardItem'
import type { AppMarketItem, AppMarketProductLine, AppMarketTemplateCategory } from './types'

const BRAND_ICON_LABEL = {
  notion: 'Notion',
  gmail: 'Gmail',
  teams: 'Teams',
  googleSheets: 'Google Sheets',
} as const

function renderBrandIcon(card: AppMarketCardRow) {
  if (!card.brandIcon) return null
  const label = BRAND_ICON_LABEL[card.brandIcon]
  return (
    <span className="app-market-brand-icon" aria-hidden="true">
      <PlanBlueprintToolIcon label={label} />
    </span>
  )
}

type AppMarketProductLinePageProps = {
  locale: AppLocale
  productLine: AppMarketProductLine
  items: AppMarketItem[]
  onBack: () => void
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onCreateTemplate?: () => void
}

export function AppMarketProductLinePage({
  locale,
  productLine,
  items,
  onBack,
  isInstalled,
  onSelectItem,
  onCreateTemplate,
}: AppMarketProductLinePageProps) {
  const [searchValue, setSearchValue] = useState('')
  const [templateCategoryFilter, setTemplateCategoryFilter] =
    useState<AppMarketTemplateCategory | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  const filteredItems = useMemo(() => {
    const categoryItems = templateCategoryFilter
      ? items.filter((item) => item.templateCategory === templateCategoryFilter)
      : items
    return filterAppMarketItems(categoryItems, searchValue, locale)
  }, [items, locale, searchValue, templateCategoryFilter])

  const cards = useMemo(
    () => mapAppMarketItemsToCards(filteredItems, locale, isInstalled),
    [filteredItems, locale, isInstalled],
  )

  const idByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      const name = locale === 'zh' ? item.nameZh : item.nameEn
      map.set(name, item.id)
    }
    return map
  }, [items, locale])

  const emptyState = (
    <div className="app-market-section-empty" role="status">
      <p className="app-market-section-empty-title">{appMarketT(locale, 'emptyTitle')}</p>
      <p className="app-market-section-empty-hint">{appMarketT(locale, 'emptyHint')}</p>
    </div>
  )
  const showViewToggle = productLine === 'skills'
  const viewToggleLabel = locale === 'zh' ? '切换技能展示方式' : 'Switch skill view'
  const listViewLabel = locale === 'zh' ? '列表视图' : 'List view'
  const cardViewLabel = locale === 'zh' ? '卡片视图' : 'Card view'

  return (
    <>
      <header className="agents-header agents-header--with-back app-market-category-header">
        <div className="agents-header-with-back-stack">
          <div className="agents-back-panel agents-back-panel--with-title">
            <button
              type="button"
              className="agents-back-btn"
              onClick={onBack}
              aria-label={appMarketT(locale, 'backToMarket')}
            >
              ←
            </button>
            <h1 className="agents-back-panel-title">{appMarketProductLineTitle(locale, productLine)}</h1>
          </div>
        </div>
        {onCreateTemplate ? (
          <div className="agents-header-actions">
            <button type="button" className="agents-btn agents-btn-primary" onClick={onCreateTemplate}>
              + {appMarketT(locale, 'createTemplate')}
            </button>
          </div>
        ) : null}
      </header>
      <div className="app-market-category-layout">
        <AppMarketCategorySidebar
          locale={locale}
          activeCategory={templateCategoryFilter}
          onSelectCategory={setTemplateCategoryFilter}
        />
        <div className="app-market-category-main">
          <AppMarketSearchBar locale={locale} value={searchValue} onChange={setSearchValue} />
          <div
            className={
              showViewToggle
                ? 'app-market-category-meta app-market-category-meta--with-actions'
                : 'app-market-category-meta'
            }
          >
            <span className="app-market-category-result-count">
              {appMarketResultCountLabel(locale, filteredItems.length)}
            </span>
            {showViewToggle ? (
              <div className="tools-directory-view-toggle" role="tablist" aria-label={viewToggleLabel}>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  title={listViewLabel}
                >
                  ☰
                </button>
                <button
                  type="button"
                  className={viewMode === 'cards' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
                  role="tab"
                  aria-selected={viewMode === 'cards'}
                  onClick={() => setViewMode('cards')}
                  title={cardViewLabel}
                >
                  ⊞
                </button>
              </div>
            ) : null}
          </div>
          {filteredItems.length === 0 ? (
            emptyState
          ) : (
            <AgentCardsGrid
              title={appMarketProductLineTitle(locale, productLine)}
              primaryActionLabel=""
              showHeader={false}
              showPrimaryAction={false}
              showCardMenu={false}
              tabs={[{ key: 'all', label: 'All', count: items.length }]}
              activeTab="all"
              onTabChange={() => {}}
              showTabs={false}
              showToolbar={false}
              items={cards}
              viewMode={showViewToggle && viewMode === 'list' ? 'list' : 'grid'}
              tagLabel={(card) => card.tag}
              isCardClickable={() => true}
              getCardAriaLabel={(card) =>
                locale === 'zh' ? `查看应用：${card.name}` : `View app: ${card.name}`
              }
              getItemIconStyle={(card) => card.iconStyle}
              getItemIconContent={renderBrandIcon}
              onCardClick={(card) => {
                const id = idByName.get(card.name)
                if (id) onSelectItem(id)
              }}
              onDuplicateItem={() => {}}
              onDeleteItem={() => {}}
            />
          )}
        </div>
      </div>
    </>
  )
}
