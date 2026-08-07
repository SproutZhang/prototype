import { useSyncExternalStore } from 'react'

import type { ProjectGroup } from '../types'
import { getProjectGroupsSnapshot, subscribeProjectGroups } from '../utils/projectGroupsSync'

export function useProjectGroups(): ProjectGroup[] {
  return useSyncExternalStore(
    subscribeProjectGroups,
    getProjectGroupsSnapshot,
    getProjectGroupsSnapshot,
  )
}
