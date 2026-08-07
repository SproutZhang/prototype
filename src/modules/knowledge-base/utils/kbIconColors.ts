import type { KnowledgeBaseItem } from '../types'

export const KB_ICON_DEFAULT_FROM = '#94a3b8'
export const KB_ICON_DEFAULT_TO = '#64748b'

const ICON_PALETTE: ReadonlyArray<{ from: string; to: string }> = [
  { from: '#7f7cff', to: '#ff9a62' },
  { from: '#38bdf8', to: '#6366f1' },
  { from: '#34d399', to: '#059669' },
  { from: '#f472b6', to: '#a855f7' },
  { from: '#fbbf24', to: '#f59e0b' },
  { from: '#fb7185', to: '#e11d48' },
  { from: '#2dd4bf', to: '#0d9488' },
  { from: '#a78bfa', to: '#7c3aed' },
  { from: '#60a5fa', to: '#2563eb' },
  { from: '#4ade80', to: '#16a34a' },
  { from: '#f97316', to: '#c2410c' },
  { from: '#e879f9', to: '#9333ea' },
]

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function pairKey(from: string, to: string): string {
  return `${from}|${to}`
}

export function isDefaultKnowledgeBaseIcon(item: Pick<KnowledgeBaseItem, 'iconFrom' | 'iconTo'>): boolean {
  return item.iconFrom === KB_ICON_DEFAULT_FROM && item.iconTo === KB_ICON_DEFAULT_TO
}

/** 按 id 稳定映射到调色板中的一组渐变（不同 id 通常不同色） */
export function getKnowledgeBaseIconColors(id: string): { iconFrom: string; iconTo: string } {
  const index = hashId(id) % ICON_PALETTE.length
  const pair = ICON_PALETTE[index]
  return { iconFrom: pair.from, iconTo: pair.to }
}

/** 新建知识库：优先选用当前列表尚未使用的配色 */
export function pickKnowledgeBaseIconColorsForNewItem(
  id: string,
  existingItems: KnowledgeBaseItem[],
): { iconFrom: string; iconTo: string } {
  const used = new Set(
    existingItems.map((item) => {
      const colors = resolveKnowledgeBaseIconColors(item)
      return pairKey(colors.iconFrom, colors.iconTo)
    }),
  )

  const start = hashId(id) % ICON_PALETTE.length
  for (let offset = 0; offset < ICON_PALETTE.length; offset += 1) {
    const pair = ICON_PALETTE[(start + offset) % ICON_PALETTE.length]
    const key = pairKey(pair.from, pair.to)
    if (!used.has(key)) {
      return { iconFrom: pair.from, iconTo: pair.to }
    }
  }

  return getKnowledgeBaseIconColors(id)
}

export function resolveKnowledgeBaseIconColors(
  item: Pick<KnowledgeBaseItem, 'id' | 'iconFrom' | 'iconTo'>,
): { iconFrom: string; iconTo: string } {
  if (isDefaultKnowledgeBaseIcon(item)) {
    return getKnowledgeBaseIconColors(item.id)
  }
  return { iconFrom: item.iconFrom, iconTo: item.iconTo }
}
