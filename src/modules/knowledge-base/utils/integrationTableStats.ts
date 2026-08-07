import type { KnowledgeBaseIntegrationItem } from '../types'

function parseSizeToBytes(label: string): number {
  const trimmed = label.trim()
  if (!trimmed || trimmed === '—') return 0
  const match = trimmed.match(/^([\d.]+)\s*(KB|MB|GB)?$/i)
  if (!match) return 0
  const value = Number.parseFloat(match[1])
  if (Number.isNaN(value)) return 0
  const unit = (match[2] ?? 'B').toUpperCase()
  if (unit === 'GB') return value * 1024 * 1024 * 1024
  if (unit === 'MB') return value * 1024 * 1024
  if (unit === 'KB') return value * 1024
  return value
}

function formatTotalSize(bytes: number): string {
  if (bytes <= 0) return '—'
  const mb = bytes / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${Math.max(1, Math.round(kb))} KB`
}

export type KnowledgeBaseIntegrationTableStats = {
  totalSizeLabel: string
  fileCount: number
  indexedCount: number
  errorCount: number
}

export function computeIntegrationTableStats(
  items: KnowledgeBaseIntegrationItem[],
): KnowledgeBaseIntegrationTableStats {
  const totalBytes = items.reduce((sum, item) => sum + parseSizeToBytes(item.sizeLabel), 0)
  return {
    totalSizeLabel: formatTotalSize(totalBytes),
    fileCount: items.length,
    indexedCount: items.filter((item) => item.status === 'ready').length,
    errorCount: items.filter((item) => item.status === 'failed').length,
  }
}

export function integrationCategoryKey(
  provider: KnowledgeBaseIntegrationItem['provider'],
  kind: KnowledgeBaseIntegrationItem['kind'],
): string {
  return `${provider}:${kind}`
}
