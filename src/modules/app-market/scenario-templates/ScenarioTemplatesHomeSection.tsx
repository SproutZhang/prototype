import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketProductLineDesc, appMarketProductLineTitle } from '../i18n/strings'
import { AppMarketSection } from '../shared/AppMarketSection'
import type { AppMarketItem } from '../shared/types'

type ScenarioTemplatesHomeSectionProps = {
  locale: AppLocale
  items: AppMarketItem[]
  total: number
  showViewMore: boolean
  isSearchActive: boolean
  viewMode?: 'cards' | 'list'
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onViewMore: () => void
}

export function ScenarioTemplatesHomeSection({
  locale,
  items,
  total,
  showViewMore,
  isSearchActive,
  viewMode = 'cards',
  isInstalled,
  onSelectItem,
  onViewMore,
}: ScenarioTemplatesHomeSectionProps) {
  return (
    <AppMarketSection
      locale={locale}
      productLine="scenario-templates"
      title={appMarketProductLineTitle(locale, 'scenario-templates')}
      description={appMarketProductLineDesc(locale, 'scenario-templates')}
      items={items}
      totalCount={total}
      showViewMore={showViewMore}
      isSearchActive={isSearchActive}
      viewMode={viewMode}
      isInstalled={isInstalled}
      onSelectItem={onSelectItem}
      onViewMore={onViewMore}
    />
  )
}
