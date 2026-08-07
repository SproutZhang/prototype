import type { AppLocale } from '../../../i18n/homeStrings'
import {
  getScenarioDisplayName,
  localizeScenarioMeta,
  localizeScenarioSeedDesc,
} from '../../../i18n/scenarioStrings'
import { getResourceCatalog } from '../data/resourceCatalog'
import type { TcsResourceCatalogItem } from '../types'
import type { UserContentItem } from '../types/userContent'
import { assignResourcesForScope } from './resourceAssignment'
import { listAllUserContent } from './userContentSync'

export type ResourceCatalogCategory = 'agent' | 'scenario' | 'skills' | 'tools'

function isScenarioCatalogItem(item: TcsResourceCatalogItem): boolean {
  return item.sourceModule === 'scenario-config' || item.kind === 'workflow'
}

function userContentToCatalogItem(entry: UserContentItem): TcsResourceCatalogItem | null {
  const isSkill =
    entry.scopes.includes('skills') &&
    !entry.scopes.includes('agent-library') &&
    !entry.scopes.includes('scenario-config')
  const isTool =
    entry.scopes.includes('tools') &&
    !entry.scopes.includes('agent-library') &&
    !entry.scopes.includes('scenario-config')

  if (isSkill || isTool) {
    return {
      id: entry.contentKey,
      kind: 'agent',
      sourceModule: 'agent-library',
      desc: entry.desc,
      meta: entry.meta,
    }
  }

  if (entry.scopes.includes('scenario-config')) {
    return {
      id: entry.contentKey,
      kind: 'workflow',
      sourceModule: 'scenario-config',
      desc: entry.desc,
      meta: entry.meta,
    }
  }

  if (entry.scopes.includes('agent-library')) {
    return {
      id: entry.contentKey,
      kind: 'agent',
      sourceModule: 'agent-library',
      desc: entry.desc,
      meta: entry.meta,
    }
  }

  return null
}

function resolveCatalogItem(resourceId: string): TcsResourceCatalogItem | undefined {
  const catalogItem = getResourceCatalog().find((item) => item.id === resourceId)
  if (catalogItem) return catalogItem

  const entry = listAllUserContent().find((item) => item.contentKey === resourceId)
  if (!entry) return undefined
  return userContentToCatalogItem(entry) ?? undefined
}

export function resolveResourceCatalogCategory(item: TcsResourceCatalogItem): ResourceCatalogCategory {
  const entry = listAllUserContent().find((content) => content.contentKey === item.id)
  if (entry) {
    if (
      entry.scopes.includes('skills') &&
      !entry.scopes.includes('agent-library') &&
      !entry.scopes.includes('scenario-config')
    ) {
      return 'skills'
    }
    if (
      entry.scopes.includes('tools') &&
      !entry.scopes.includes('agent-library') &&
      !entry.scopes.includes('scenario-config')
    ) {
      return 'tools'
    }
    if (entry.scopes.includes('scenario-config')) return 'scenario'
    if (entry.scopes.includes('agent-library')) return 'agent'
  }
  if (isScenarioCatalogItem(item)) return 'scenario'
  return 'agent'
}

export function localizeImportResourceName(item: TcsResourceCatalogItem, locale: AppLocale): string {
  const entry = listAllUserContent().find((content) => content.contentKey === item.id)
  if (entry) return entry.displayName
  return getScenarioDisplayName(item.id, locale)
}

export function localizeImportResourceDesc(item: TcsResourceCatalogItem, locale: AppLocale): string {
  const entry = listAllUserContent().find((content) => content.contentKey === item.id)
  if (entry) return entry.desc
  return localizeScenarioSeedDesc(item.id, item.desc, locale)
}

export function localizeImportResourceMeta(item: TcsResourceCatalogItem, locale: AppLocale): string {
  const entry = listAllUserContent().find((content) => content.contentKey === item.id)
  if (entry) return localizeScenarioMeta(entry.meta, locale)
  return localizeScenarioMeta(item.meta, locale)
}

/** @deprecated 仅场景配置；请使用 getImportableResources */
export function getScenarioConfigResources(): TcsResourceCatalogItem[] {
  return getResourceCatalog().filter((item) => item.sourceModule === 'scenario-config')
}

export function getImportableResources(): TcsResourceCatalogItem[] {
  const byId = new Map<string, TcsResourceCatalogItem>()

  for (const item of getResourceCatalog()) {
    byId.set(item.id, item)
  }

  for (const entry of listAllUserContent()) {
    if (entry.lifecycleStatus === 'draft') continue
    const catalogItem = userContentToCatalogItem(entry)
    if (catalogItem && !byId.has(catalogItem.id)) {
      byId.set(catalogItem.id, catalogItem)
    }
  }

  return [...byId.values()]
}

export function resolveScopeResources(
  scopeKey: string,
  resourceCount: number,
  resourceIds?: string[],
): TcsResourceCatalogItem[] {
  if (resourceIds !== undefined) {
    return resourceIds
      .map((id) => resolveCatalogItem(id))
      .filter((item): item is TcsResourceCatalogItem => item != null)
  }
  return assignResourcesForScope(scopeKey, resourceCount)
}

export function resolveSpaceResourceIds(
  space: { id: string; resourceCount: number; resourceIds?: string[] },
): string[] {
  if (space.resourceIds !== undefined) return space.resourceIds
  if (space.resourceCount <= 0) return []
  return assignResourcesForScope(`space:${space.id}`, space.resourceCount).map((item) => item.id)
}
