import type { AppLocale } from '../../../i18n/homeStrings'
import { AppMarketProductLinePage } from '../shared/AppMarketProductLinePage'
import type { AppMarketItem } from '../shared/types'
import { AGENT_TEMPLATE_CATALOG } from './data'

type AgentTemplatesPageProps = {
  locale: AppLocale
  items?: AppMarketItem[]
  onBack: () => void
  isInstalled: (id: string) => boolean
  onSelectItem: (id: string) => void
  onCreateTemplate?: () => void
}

export function AgentTemplatesPage({
  locale,
  items = AGENT_TEMPLATE_CATALOG,
  onBack,
  isInstalled,
  onSelectItem,
  onCreateTemplate,
}: AgentTemplatesPageProps) {
  return (
    <AppMarketProductLinePage
      locale={locale}
      productLine="agent-templates"
      items={items}
      onBack={onBack}
      isInstalled={isInstalled}
      onSelectItem={onSelectItem}
      onCreateTemplate={onCreateTemplate}
    />
  )
}
