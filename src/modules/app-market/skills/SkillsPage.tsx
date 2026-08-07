import type { AppLocale } from '../../../i18n/homeStrings'
import { AppMarketProductLinePage } from '../shared/AppMarketProductLinePage'
import type { AppMarketItem } from '../shared/types'
import { SKILLS_CATALOG } from './data'

type SkillsPageProps = {
  locale: AppLocale
  items?: AppMarketItem[]
  onBack: () => void
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onCreateTemplate?: () => void
}

export function SkillsPage({
  locale,
  items = SKILLS_CATALOG,
  onBack,
  isInstalled,
  onSelectItem,
  onCreateTemplate,
}: SkillsPageProps) {
  return (
    <AppMarketProductLinePage
      locale={locale}
      productLine="skills"
      items={items}
      onBack={onBack}
      isInstalled={isInstalled}
      onSelectItem={onSelectItem}
      onCreateTemplate={onCreateTemplate}
    />
  )
}
