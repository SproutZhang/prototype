import type { AppLocale } from '../../../i18n/homeStrings'
import { AppMarketProductLinePage } from '../shared/AppMarketProductLinePage'
import type { AppMarketItem } from '../shared/types'
import { TOOLS_CATALOG } from './data'

type ToolsPageProps = {
  locale: AppLocale
  items?: AppMarketItem[]
  onBack: () => void
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onCreateTemplate?: () => void
}

export function ToolsPage({
  locale,
  items = TOOLS_CATALOG,
  onBack,
  isInstalled,
  onSelectItem,
  onCreateTemplate,
}: ToolsPageProps) {
  return (
    <AppMarketProductLinePage
      locale={locale}
      productLine="tools"
      items={items}
      onBack={onBack}
      isInstalled={isInstalled}
      onSelectItem={onSelectItem}
      onCreateTemplate={onCreateTemplate}
    />
  )
}
