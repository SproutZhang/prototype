import type { KnowledgeBaseDocument } from '../types'

const FORMAT_BY_EXT: Record<string, KnowledgeBaseDocument['format']> = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'docx',
  ppt: 'ppt',
  pptx: 'pptx',
  xlsx: 'xlsx',
  md: 'md',
  markdown: 'md',
  csv: 'csv',
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  txt: 'txt',
  msg: 'msg',
  json: 'json',
}

export const LOCAL_UPLOAD_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.md,.markdown,.csv,.png,.jpg,.jpeg,.txt,.msg,.json'

export function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes >= 10240 ? 0 : 1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function inferDocumentFormat(fileName: string): KnowledgeBaseDocument['format'] | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return FORMAT_BY_EXT[ext] ?? null
}

export function createDocumentFromFile(file: File): KnowledgeBaseDocument | null {
  const format = inferDocumentFormat(file.name)
  if (!format) return null

  return {
    id: `doc-upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nameZh: file.name,
    nameEn: file.name,
    format,
    sizeLabel: formatFileSizeLabel(file.size),
    updatedAt: new Date().toISOString().slice(0, 10),
    status: 'indexing',
  }
}
