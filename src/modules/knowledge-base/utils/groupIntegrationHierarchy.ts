import type {
  KnowledgeBaseIntegrationItem,
  KnowledgeBaseIntegrationKind,
  KnowledgeBaseIntegrationProvider,
} from '../types'

const PROVIDER_ORDER: KnowledgeBaseIntegrationProvider[] = ['feishu', 'notion', 'confluence']

const KIND_ORDER: KnowledgeBaseIntegrationKind[] = ['document', 'video', 'sheet', 'wiki']

export type KnowledgeBaseIntegrationCategory = {
  kind: KnowledgeBaseIntegrationKind
  items: KnowledgeBaseIntegrationItem[]
}

export type KnowledgeBaseIntegrationProviderGroup = {
  provider: KnowledgeBaseIntegrationProvider
  categories: KnowledgeBaseIntegrationCategory[]
  itemCount: number
}

export type KnowledgeBaseIntegrationSelection = {
  provider: KnowledgeBaseIntegrationProvider
  kind: KnowledgeBaseIntegrationKind
}

export function groupIntegrationHierarchy(
  items: KnowledgeBaseIntegrationItem[],
): KnowledgeBaseIntegrationProviderGroup[] {
  const byProvider = new Map<KnowledgeBaseIntegrationProvider, KnowledgeBaseIntegrationItem[]>()

  for (const item of items) {
    const list = byProvider.get(item.provider) ?? []
    list.push(item)
    byProvider.set(item.provider, list)
  }

  return PROVIDER_ORDER.filter((provider) => byProvider.has(provider)).map((provider) => {
    const providerItems = byProvider.get(provider)!
    const byKind = new Map<KnowledgeBaseIntegrationKind, KnowledgeBaseIntegrationItem[]>()

    for (const item of providerItems) {
      const list = byKind.get(item.kind) ?? []
      list.push(item)
      byKind.set(item.kind, list)
    }

    const categories = KIND_ORDER.filter((kind) => byKind.has(kind)).map((kind) => ({
      kind,
      items: byKind.get(kind)!,
    }))

    return {
      provider,
      categories,
      itemCount: providerItems.length,
    }
  })
}

export function getIntegrationCategoryItems(
  items: KnowledgeBaseIntegrationItem[],
  selection: KnowledgeBaseIntegrationSelection,
): KnowledgeBaseIntegrationItem[] {
  return items.filter((item) => item.provider === selection.provider && item.kind === selection.kind)
}
