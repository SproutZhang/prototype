import { useMemo, useSyncExternalStore } from 'react'

import type { UserContentItem, UserContentLifecycleStatus, UserContentSourceModule } from '../types/userContent'
import { listUserContentByMember, subscribeUserContentSync } from '../utils/userContentSync'

export type UserContentFilters = {
  scope?: UserContentSourceModule | 'all'
  lifecycleStatus?: UserContentLifecycleStatus | 'all'
  query?: string
}

function subscribe(onStoreChange: () => void) {
  return subscribeUserContentSync(onStoreChange)
}

export function useUserContentRegistry(memberId: string, filters: UserContentFilters = {}): UserContentItem[] {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => listUserContentByMember(memberId),
    () => listUserContentByMember(memberId),
  )

  return useMemo(() => {
    const query = filters.query?.trim().toLowerCase() ?? ''
    return snapshot.filter((item) => {
      if (filters.scope && filters.scope !== 'all' && !item.scopes.includes(filters.scope)) {
        return false
      }
      if (
        filters.lifecycleStatus &&
        filters.lifecycleStatus !== 'all' &&
        item.lifecycleStatus !== filters.lifecycleStatus
      ) {
        return false
      }
      if (!query) return true
      return [item.displayName, item.contentKey, item.desc, item.tag, item.creatorLabel ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [snapshot, filters.lifecycleStatus, filters.query, filters.scope])
}
