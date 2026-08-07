import type { ProjectGroup } from '../types'
import { createInitialProjectGroups } from './projectGroups'

const listeners = new Set<() => void>()
const groupOverrides = new Map<string, ProjectGroup>()
const addedGroups: ProjectGroup[] = []
const removedGroupIds = new Set<string>()

let snapshotCache: ProjectGroup[] | null = null
let snapshotVersion = 0
let cachedSnapshotVersion = -1

function invalidateSnapshotCache() {
  snapshotVersion += 1
  snapshotCache = null
}

function notifyProjectGroups() {
  invalidateSnapshotCache()
  listeners.forEach((listener) => listener())
}

export function subscribeProjectGroups(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function buildProjectGroupsSnapshot(): ProjectGroup[] {
  const merged = new Map<string, ProjectGroup>()

  for (const group of createInitialProjectGroups()) {
    if (!removedGroupIds.has(group.id)) merged.set(group.id, group)
  }
  for (const group of addedGroups) {
    if (!removedGroupIds.has(group.id)) merged.set(group.id, group)
  }
  for (const [id, group] of groupOverrides) {
    if (!removedGroupIds.has(id)) merged.set(id, group)
  }

  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getProjectGroupsSnapshot(): ProjectGroup[] {
  if (snapshotCache && cachedSnapshotVersion === snapshotVersion) {
    return snapshotCache
  }
  snapshotCache = buildProjectGroupsSnapshot()
  cachedSnapshotVersion = snapshotVersion
  return snapshotCache
}

export function addProjectGroup(group: ProjectGroup): void {
  if (!addedGroups.some((entry) => entry.id === group.id)) {
    addedGroups.push(group)
  }
  groupOverrides.set(group.id, group)
  notifyProjectGroups()
}

export function updateProjectGroup(groupId: string, nextGroup: ProjectGroup): void {
  groupOverrides.set(groupId, nextGroup)
  notifyProjectGroups()
}

export function removeProjectGroup(groupId: string): void {
  if (!removedGroupIds.has(groupId)) {
    removedGroupIds.add(groupId)
    notifyProjectGroups()
  }
}
