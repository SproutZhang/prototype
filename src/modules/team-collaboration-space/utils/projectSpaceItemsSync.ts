import { PROJECT_SPACE_ITEMS_SEED } from '../data/projectSpaceSeed'
import type { ProjectSpaceItem } from '../types'
import { withDemoExpiredFlags } from './projectItems'
import { getPublishCreatedProjectItems, subscribePublishSpaceSync } from './publishSpaceSync'

const listeners = new Set<() => void>()
const itemOverrides = new Map<string, ProjectSpaceItem>()
const removedItemIds = new Set<string>()

let snapshotCache: ProjectSpaceItem[] | null = null
let snapshotVersion = 0
let cachedSnapshotVersion = -1

function invalidateSnapshotCache() {
  snapshotVersion += 1
  snapshotCache = null
}

function notifyProjectSpaceItems() {
  invalidateSnapshotCache()
  listeners.forEach((listener) => listener())
}

let publishStoreSubscribed = false

function ensurePublishStoreSubscription() {
  if (publishStoreSubscribed) return
  publishStoreSubscribed = true
  subscribePublishSpaceSync(notifyProjectSpaceItems)
}

ensurePublishStoreSubscription()

export function subscribeProjectSpaceItems(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSeedItems(): ProjectSpaceItem[] {
  return withDemoExpiredFlags(PROJECT_SPACE_ITEMS_SEED.filter((item) => !item.isCreateCard))
}

function buildProjectSpaceItemsSnapshot(): ProjectSpaceItem[] {
  const merged = new Map<string, ProjectSpaceItem>()

  for (const item of getSeedItems()) {
    if (!removedItemIds.has(item.id)) merged.set(item.id, item)
  }
  for (const item of getPublishCreatedProjectItems()) {
    if (!removedItemIds.has(item.id)) merged.set(item.id, item)
  }
  for (const [id, item] of itemOverrides) {
    if (!removedItemIds.has(id)) merged.set(id, item)
  }

  return [...merged.values()]
}

export function getProjectSpaceItemsSnapshot(): ProjectSpaceItem[] {
  if (snapshotCache && cachedSnapshotVersion === snapshotVersion) {
    return snapshotCache
  }
  snapshotCache = buildProjectSpaceItemsSnapshot()
  cachedSnapshotVersion = snapshotVersion
  return snapshotCache
}

export function addProjectSpaceItem(item: ProjectSpaceItem): void {
  itemOverrides.set(item.id, item)
  notifyProjectSpaceItems()
}

export function patchProjectSpaceItem(
  predicate: (item: ProjectSpaceItem) => boolean,
  patch: Partial<ProjectSpaceItem>,
): void {
  const item = getProjectSpaceItemsSnapshot().find(predicate)
  if (!item) return
  itemOverrides.set(item.id, { ...item, ...patch })
  notifyProjectSpaceItems()
}

export function removeProjectSpaceItems(predicate: (item: ProjectSpaceItem) => boolean): void {
  let changed = false
  for (const item of getProjectSpaceItemsSnapshot()) {
    if (predicate(item)) {
      removedItemIds.add(item.id)
      changed = true
    }
  }
  if (changed) notifyProjectSpaceItems()
}
