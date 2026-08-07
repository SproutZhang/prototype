import { useSyncExternalStore } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  getPublicSpaceSharedSnapshot,
  listPublicSpaceSharedContent,
  subscribePublicSpaceSharedStores,
  type PublicSpaceSharedItem,
  type PublicSpaceSharedScope,
  type PublicSpaceSharedSnapshot,
} from '../utils/publicSpaceSharedSync'

export function usePublicSpaceSharedSnapshot(
  locale: AppLocale,
  viewerMemberId: string,
): PublicSpaceSharedSnapshot {
  return useSyncExternalStore(
    subscribePublicSpaceSharedStores,
    () => getPublicSpaceSharedSnapshot(locale, viewerMemberId),
    () => getPublicSpaceSharedSnapshot(locale, viewerMemberId),
  )
}

export function usePublicSpaceSharedContent(
  locale: AppLocale,
  viewerMemberId: string,
  scope: PublicSpaceSharedScope,
): PublicSpaceSharedItem[] {
  return useSyncExternalStore(
    subscribePublicSpaceSharedStores,
    () => listPublicSpaceSharedContent({ locale, viewerMemberId, scope }),
    () => listPublicSpaceSharedContent({ locale, viewerMemberId, scope }),
  )
}

export function filterPublicSpaceSharedItems(
  items: PublicSpaceSharedItem[],
  searchQuery: string,
): PublicSpaceSharedItem[] {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return items
  return items.filter((item) =>
    [item.displayName, item.contentKey, item.desc, item.publisherLabel, item.spaceLabel]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
}
