import { useSyncExternalStore } from 'react'

import type { ProjectSpaceItem } from '../types'
import { getProjectSpaceItemsSnapshot, subscribeProjectSpaceItems } from '../utils/projectSpaceItemsSync'

export function useProjectSpaceItems(): ProjectSpaceItem[] {
  return useSyncExternalStore(
    subscribeProjectSpaceItems,
    getProjectSpaceItemsSnapshot,
    getProjectSpaceItemsSnapshot,
  )
}
