import { getResourceCatalog } from '../data/resourceCatalog'
import type { TcsResourceCatalogItem } from '../types'

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = hashString(`${seed}:${index}`) % (index + 1)
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }
  return result
}

function takeUnique(items: TcsResourceCatalogItem[], used: Set<string>, limit: number): TcsResourceCatalogItem[] {
  const picked: TcsResourceCatalogItem[] = []
  for (const item of items) {
    if (picked.length >= limit) break
    if (used.has(item.id)) continue
    used.add(item.id)
    picked.push(item)
  }
  return picked
}

export function assignResourcesForScope(scopeKey: string, count: number): TcsResourceCatalogItem[] {
  if (count <= 0) return []

  const catalog = getResourceCatalog()
  const agents = catalog.filter((item) => item.kind === 'agent')
  const workflows = catalog.filter((item) => item.kind === 'workflow')
  const used = new Set<string>()
  const picked: TcsResourceCatalogItem[] = []

  const shuffledAgents = deterministicShuffle(agents, `${scopeKey}:agent`)
  const shuffledWorkflows = deterministicShuffle(workflows, `${scopeKey}:workflow`)

  if (count === 1) {
    const [first] = deterministicShuffle(catalog, scopeKey)
    return first ? [first] : []
  }

  const workflowQuota = Math.min(shuffledWorkflows.length, Math.max(1, Math.ceil(count / 3)))
  const agentQuota = Math.min(shuffledAgents.length, count - Math.min(workflowQuota, count))

  picked.push(...takeUnique(shuffledWorkflows, used, workflowQuota))
  picked.push(...takeUnique(shuffledAgents, used, agentQuota))

  if (picked.length < count) {
    const remainder = deterministicShuffle(catalog, `${scopeKey}:fill`)
    picked.push(...takeUnique(remainder, used, count - picked.length))
  }

  return deterministicShuffle(picked, `${scopeKey}:order`).slice(0, count)
}
