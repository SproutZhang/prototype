import { buildInitialPublishedAgentNameSet } from '../../../i18n/agentLibraryStrings'

const DEMO_AGENT_NAMES = [
  '入职流程编排Agent',
  'onboarding',
  'Leave Approval Workflow Agent',
  'Orientation Scheduler Agent',
  'Onboarding Support Agent',
  'Training Coordinator Agent',
  'Account Setup Agent',
  'Document Collection Agent',
  'HR Onboarding Agent',
  'Chief Technology Editor',
  'Technology Writer',
  'Technology Researcher',
]

const publishedKeys = new Set<string>()
const frozenKeys = new Set<string>()
const dirtyKeys = new Set<string>()
const spaceByKey: Record<string, string> = {}
const listeners = new Set<() => void>()

let initialized = false

function notify() {
  listeners.forEach((listener) => listener())
}

function ensureInitialized() {
  if (initialized) return
  initialized = true
  for (const name of buildInitialPublishedAgentNameSet(DEMO_AGENT_NAMES)) {
    publishedKeys.add(name)
  }
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const key of a) {
    if (!b.has(key)) return false
  }
  return true
}

export function recordsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  return aKeys.every((key) => a[key] === b[key])
}

export function subscribeContentLifecycle(listener: () => void): () => void {
  ensureInitialized()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function syncContentLifecycleFromSnapshot(snapshot: {
  publishedKeys?: Iterable<string>
  frozenKeys?: Iterable<string>
  dirtyKeys?: Iterable<string>
  spaceByKey?: Record<string, string>
}): void {
  ensureInitialized()
  let changed = false

  if (snapshot.publishedKeys) {
    const next = new Set(snapshot.publishedKeys)
    if (next.size !== publishedKeys.size || [...next].some((key) => !publishedKeys.has(key))) {
      publishedKeys.clear()
      next.forEach((key) => publishedKeys.add(key))
      changed = true
    }
  }

  if (snapshot.frozenKeys) {
    const next = new Set(snapshot.frozenKeys)
    if (next.size !== frozenKeys.size || [...next].some((key) => !frozenKeys.has(key))) {
      frozenKeys.clear()
      next.forEach((key) => frozenKeys.add(key))
      changed = true
    }
  }

  if (snapshot.dirtyKeys) {
    const next = new Set(snapshot.dirtyKeys)
    if (next.size !== dirtyKeys.size || [...next].some((key) => !dirtyKeys.has(key))) {
      dirtyKeys.clear()
      next.forEach((key) => dirtyKeys.add(key))
      changed = true
    }
  }

  if (snapshot.spaceByKey) {
    for (const [key, spaceId] of Object.entries(snapshot.spaceByKey)) {
      if (spaceByKey[key] !== spaceId) {
        spaceByKey[key] = spaceId
        changed = true
      }
    }
  }

  if (changed) notify()
}

export function markContentPublished(contentKey: string, spaceId: string): void {
  ensureInitialized()
  publishedKeys.add(contentKey)
  dirtyKeys.delete(contentKey)
  frozenKeys.delete(contentKey)
  spaceByKey[contentKey] = spaceId
  notify()
}

export function markContentFrozen(contentKey: string): void {
  ensureInitialized()
  frozenKeys.add(contentKey)
  notify()
}

export function markContentActivated(contentKey: string): void {
  ensureInitialized()
  frozenKeys.delete(contentKey)
  notify()
}

export function markContentDirty(contentKey: string): void {
  ensureInitialized()
  dirtyKeys.add(contentKey)
  notify()
}

export function removeContentLifecycle(contentKey: string): void {
  ensureInitialized()
  publishedKeys.delete(contentKey)
  frozenKeys.delete(contentKey)
  dirtyKeys.delete(contentKey)
  delete spaceByKey[contentKey]
  notify()
}

export function canPublishContent(contentKey: string): boolean {
  ensureInitialized()
  return !publishedKeys.has(contentKey) || dirtyKeys.has(contentKey)
}

export function isContentFrozen(contentKey: string): boolean {
  ensureInitialized()
  return frozenKeys.has(contentKey)
}

export function isContentPublished(contentKey: string): boolean {
  ensureInitialized()
  return publishedKeys.has(contentKey) && !dirtyKeys.has(contentKey)
}

export function hasUnpublishedChanges(contentKey: string): boolean {
  ensureInitialized()
  return dirtyKeys.has(contentKey) && publishedKeys.has(contentKey)
}

export function getContentLifecycleSnapshot() {
  ensureInitialized()
  return {
    publishedAgentNames: new Set(publishedKeys),
    frozenAgentNames: new Set(frozenKeys),
    agentPublishDirtyNames: new Set(dirtyKeys),
    publishedScenarioSourceNames: new Set(publishedKeys),
    frozenScenarioSourceNames: new Set(frozenKeys),
    agentPublishedSpaceByName: { ...spaceByKey },
  }
}

export const USER_CONTENT_DELETED_EVENT = 'user-content-deleted'

export type UserContentDeletedDetail = { contentKey: string }
