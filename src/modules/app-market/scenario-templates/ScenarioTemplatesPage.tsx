import type { AppLocale } from '../../../i18n/homeStrings'
import { AppMarketProductLinePage } from '../shared/AppMarketProductLinePage'
import type { AppMarketItem } from '../shared/types'
import { SCENARIO_TEMPLATE_CATALOG } from './data'

type ScenarioTemplatesPageProps = {
  locale: AppLocale
  items?: AppMarketItem[]
  onBack: () => void
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onCreateTemplate?: () => void
}

export function ScenarioTemplatesPage({
  locale,
  items = SCENARIO_TEMPLATE_CATALOG,
  onBack,
  isInstalled,
  onSelectItem,
  onCreateTemplate,
}: ScenarioTemplatesPageProps) {
  return (
    <AppMarketProductLinePage
      locale={locale}
      productLine="scenario-templates"
      items={items}
      onBack={onBack}
      isInstalled={isInstalled}
      onSelectItem={onSelectItem}
      onCreateTemplate={onCreateTemplate}
    />
  )
}
