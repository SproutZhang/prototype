import type { AccessMode } from '../types'

export type AccessBadgeSource = {
  id: string
  accessMode?: AccessMode
  copyFromId?: string | null
}

/** 复制模式下展示源对象的权限标签（而非「复制访问控制」） */
export function resolveAccessBadgeMode<T extends AccessBadgeSource>(
  item: T,
  sources: T[],
  visited = new Set<string>(),
): AccessMode {
  if (item.accessMode !== 'copy' || !item.copyFromId) {
    return item.accessMode ?? 'default'
  }
  if (visited.has(item.copyFromId)) return 'default'
  visited.add(item.copyFromId)

  const source = sources.find((entry) => entry.id === item.copyFromId)
  if (!source) return 'default'

  if (source.accessMode === 'copy') {
    return resolveAccessBadgeMode(source, sources, visited)
  }

  return source.accessMode ?? 'default'
}
