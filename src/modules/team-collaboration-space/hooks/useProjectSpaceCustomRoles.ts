import { useSyncExternalStore } from 'react'

import type { SpaceCustomRole } from '../types'
import {
  getProjectSpaceCustomRolesSnapshot,
  subscribeProjectSpaceCustomRoles,
} from '../utils/projectSpaceCustomRolesSync'

export function useProjectSpaceCustomRoles(): readonly SpaceCustomRole[] {
  return useSyncExternalStore(
    subscribeProjectSpaceCustomRoles,
    getProjectSpaceCustomRolesSnapshot,
    getProjectSpaceCustomRolesSnapshot,
  )
}
