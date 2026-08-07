import type { KnowledgeBaseDocument } from '../types'

export type UpdatedSortDir = 'asc' | 'desc'

export const DEFAULT_UPDATED_SORT: UpdatedSortDir = 'desc'

export function sortDocumentsByUpdatedAt(
  documents: KnowledgeBaseDocument[],
  direction: UpdatedSortDir = DEFAULT_UPDATED_SORT,
): KnowledgeBaseDocument[] {
  return [...documents].sort((a, b) => {
    const cmp = a.updatedAt.localeCompare(b.updatedAt)
    if (cmp !== 0) return direction === 'asc' ? cmp : -cmp
    return a.id.localeCompare(b.id)
  })
}
