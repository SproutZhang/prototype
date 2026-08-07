import { useSyncExternalStore } from 'react'

import {
  getProjectSpaceRolesStoreSnapshot,
  subscribeProjectSpaceCustomRoles,
  type ProjectSpaceRolesStoreSnapshot,
} from '../utils/projectSpaceCustomRolesSync'

export function useProjectSpaceRolesStore(): ProjectSpaceRolesStoreSnapshot {
  return useSyncExternalStore(
    subscribeProjectSpaceCustomRoles,
    getProjectSpaceRolesStoreSnapshot,
    getProjectSpaceRolesStoreSnapshot,
  )
}
