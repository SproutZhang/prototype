import { getIntegrationFolders } from '../data/integrationFolders'
import type {
  KnowledgeBaseIntegrationItem,
  KnowledgeBaseIntegrationKind,
  KnowledgeBaseIntegrationProvider,
} from '../types'

function inferKindFromFileName(name: string): KnowledgeBaseIntegrationKind {
  const lower = name.toLowerCase()
  if (/\.(mp4|mov|webm|avi|mkv)$/.test(lower)) return 'video'
  if (/\.(ppt|pptx)$/.test(lower) && /training|培训|录|walkthrough|演示/.test(lower)) return 'video'
  if (/\.(xlsx|xls|csv)$/.test(lower)) return 'sheet'
  if (/wiki|faq|百科|帮助|help/.test(lower)) return 'wiki'
  return 'document'
}

function inferKindFromFolderName(name: string): KnowledgeBaseIntegrationKind {
  const lower = name.toLowerCase()
  if (/wiki|百科|help|帮助|faq/.test(lower)) return 'wiki'
  if (/sheet|表格|registry|台账|stats|data sheet/.test(lower)) return 'sheet'
  if (/training|video|培训|录|compliance training/.test(lower)) return 'video'
  return 'document'
}

export function buildIntegrationItemsFromSelection(
  provider: KnowledgeBaseIntegrationProvider,
  selectedIds: string[],
): KnowledgeBaseIntegrationItem[] {
  const folders = getIntegrationFolders(provider)
  const selected = new Set(selectedIds)
  const today = new Date().toISOString().slice(0, 10)
  const result: KnowledgeBaseIntegrationItem[] = []
  const added = new Set<string>()

  for (const folder of folders) {
    if (folder.disabled) continue

    const selectedFiles = folder.files.filter((file) => !file.disabled && selected.has(file.id))

    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        if (added.has(file.id)) continue
        added.add(file.id)
        result.push({
          id: file.id,
          provider,
          kind: inferKindFromFileName(file.nameEn),
          nameZh: file.nameZh,
          nameEn: file.nameEn,
          sizeLabel: file.sizeLabel,
          updatedAt: today,
          status: 'indexing',
        })
      }
      continue
    }

    if (selected.has(folder.id)) {
      if (added.has(folder.id)) continue
      added.add(folder.id)
      result.push({
        id: folder.id,
        provider,
        kind: inferKindFromFolderName(folder.nameEn),
        nameZh: folder.nameZh,
        nameEn: folder.nameEn,
        sizeLabel: folder.sizeLabel,
        updatedAt: today,
        status: 'indexing',
      })
    }
  }

  return result
}

export function simulateIntegrationIndexDelayMs(sourceId: string): number {
  let hash = 0
  for (const char of sourceId) {
    hash = (hash + char.charCodeAt(0)) % 1000
  }
  return 2000 + hash
}

export function simulateIntegrationIndexOutcome(sourceId: string): 'ready' | 'failed' {
  let hash = 0
  for (const char of sourceId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10
  }
  return hash < 2 ? 'failed' : 'ready'
}
