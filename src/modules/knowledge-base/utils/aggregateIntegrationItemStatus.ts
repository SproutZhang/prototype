import type { KnowledgeBaseIntegrationItem } from '../types'

export type KnowledgeBaseIntegrationGroupStatus = 'ready' | 'indexing' | 'warning'

export function aggregateIntegrationItemStatus(
  items: KnowledgeBaseIntegrationItem[],
): KnowledgeBaseIntegrationGroupStatus | null {
  if (items.length === 0) return null
  if (items.some((item) => item.status === 'indexing')) return 'indexing'
  if (items.some((item) => item.status === 'failed')) return 'warning'
  return 'ready'
}
