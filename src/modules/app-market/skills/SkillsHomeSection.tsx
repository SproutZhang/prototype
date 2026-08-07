import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketProductLineDesc, appMarketProductLineTitle } from '../i18n/strings'
import { AppMarketSection } from '../shared/AppMarketSection'
import type { AppMarketItem } from '../shared/types'

type SkillsHomeSectionProps = {
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

export function SkillsHomeSection({
  locale,
  items,
  total,
  showViewMore,
  isSearchActive,
  viewMode = 'cards',
  isInstalled,
  onSelectItem,
  onViewMore,
}: SkillsHomeSectionProps) {
  return (
    <AppMarketSection
      locale={locale}
      productLine="skills"
      title={appMarketProductLineTitle(locale, 'skills')}
      description={appMarketProductLineDesc(locale, 'skills')}
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
