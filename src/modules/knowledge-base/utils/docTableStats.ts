import type { KnowledgeBaseDocument } from '../types'

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

export type KnowledgeBaseDocTableStats = {
  totalSizeLabel: string
  fileCount: number
  indexedCount: number
  errorCount: number
}

export function computeDocTableStats(documents: KnowledgeBaseDocument[]): KnowledgeBaseDocTableStats {
  const totalBytes = documents.reduce((sum, doc) => sum + parseSizeToBytes(doc.sizeLabel), 0)
  return {
    totalSizeLabel: formatTotalSize(totalBytes),
    fileCount: documents.length,
    indexedCount: documents.filter((doc) => doc.status === 'ready').length,
    errorCount: documents.filter((doc) => doc.status === 'failed').length,
  }
}
