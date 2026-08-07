import { useMemo } from 'react'

import { PlanBlueprintToolIcon } from '../../../components/shared/WfBlueprintStepsBlock'
import { AgentCardsGrid } from '../../../components/shared/AgentCardsGrid'
import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketT } from '../i18n/strings'
import type { AppMarketItem, AppMarketProductLine } from './types'
import { mapAppMarketItemsToCards, type AppMarketCardRow } from './mapToCardItem'

const BRAND_ICON_LABEL = {
  notion: 'Notion',
  gmail: 'Gmail',
  teams: 'Teams',
  googleSheets: 'Google Sheets',
} as const

function renderBrandIcon(card: AppMarketCardRow) {
  if (!card.brandIcon) return null
  return (
    <span className="app-market-brand-icon" aria-hidden="true">
      <PlanBlueprintToolIcon label={BRAND_ICON_LABEL[card.brandIcon]} />
    </span>
  )
}

type AppMarketSectionProps = {
  locale: AppLocale
  productLine: AppMarketProductLine
  title: string
  description: string
  items: AppMarketItem[]
  totalCount: number
  showViewMore: boolean
  isSearchActive?: boolean
  viewMode?: 'cards' | 'list'
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onViewMore: () => void
}

export function AppMarketSection({
  locale,
  productLine,
  title,
  description,
  items,
  showViewMore,
  isSearchActive = false,
  viewMode = 'cards',
  isInstalled,
  onSelectItem,
  onViewMore,
}: AppMarketSectionProps) {
  const cards = useMemo(
    () => mapAppMarketItemsToCards(items, locale, isInstalled),
    [items, locale, isInstalled],
  )

  const idByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      const name = locale === 'zh' ? item.nameZh : item.nameEn
      map.set(name, item.id)
    }
    return map
  }, [items, locale])

  const handleCardClick = (card: AppMarketCardRow) => {
    const id = idByName.get(card.name)
    if (id) onSelectItem(id)
  }

  return (
    <section className="app-market-section" aria-labelledby={`app-market-section-${productLine}`}>
      <header className="agents-header app-market-section-header">
        <div>
          <div
            className="agents-title app-market-section-title"
            id={`app-market-section-${productLine}`}
          >
            {title}
          </div>
          <div className="agents-subtitle">{description}</div>
        </div>
        {showViewMore ? (
          <div className="agents-header-actions">
            <button
              type="button"
              className="app-market-view-more-link"
              onClick={onViewMore}
              aria-label={appMarketT(locale, 'viewMoreAria')}
            >
              {appMarketT(locale, 'viewMore')}
            </button>
          </div>
        ) : null}
      </header>
      {items.length === 0 ? (
        <div className="app-market-section-empty" role="status">
          <p className="app-market-section-empty-title">{appMarketT(locale, 'emptyTitle')}</p>
          <p className="app-market-section-empty-hint">{appMarketT(locale, 'emptyHint')}</p>
        </div>
      ) : (
        <AgentCardsGrid
          title=""
          primaryActionLabel=""
          showHeader={false}
          showTabs={false}
          showToolbar={false}
          showPrimaryAction={false}
          showCardMenu={false}
          tabs={[{ key: 'all', label: 'All', count: items.length }]}
          activeTab="all"
          onTabChange={() => {}}
          items={cards}
          tagLabel={(card) => card.tag}
          isCardClickable={() => true}
          getCardAriaLabel={(card) =>
            locale === 'zh' ? `查看应用：${card.name}` : `View app: ${card.name}`
          }
          getItemIconStyle={(card) => card.iconStyle}
          getItemIconContent={productLine === 'tools' ? renderBrandIcon : undefined}
          viewMode={viewMode === 'list' ? 'list' : 'grid'}
          onCardClick={handleCardClick}
          onDuplicateItem={() => {}}
          onDeleteItem={() => {}}
        />
      )}
      {isSearchActive && items.length > 0 ? (
        <p className="app-market-section-foot" aria-hidden="true">
          {locale === 'zh' ? `找到 ${items.length} 个匹配产品` : `${items.length} matching products`}
        </p>
      ) : null}
    </section>
  )
}
