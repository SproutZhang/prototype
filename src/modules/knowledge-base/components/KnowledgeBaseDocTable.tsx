import { useEffect, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'
import { computeDocTableStats } from '../utils/docTableStats'
import {
  DEFAULT_UPDATED_SORT,
  sortDocumentsByUpdatedAt,
  type UpdatedSortDir,
} from '../utils/sortDocumentsByUpdatedAt'
import { KnowledgeBaseDocRow } from './KnowledgeBaseDocRow'
import { KnowledgeBaseReindexFailedModal } from './KnowledgeBaseReindexFailedModal'
import {
  KnowledgeBaseDocToolbar,
  type KnowledgeBaseDocStatusFilter,
} from './KnowledgeBaseDocToolbar'

type KnowledgeBaseDocTableProps = {
  locale: AppLocale
  documents: KnowledgeBaseDocument[]
  docLabel: (doc: KnowledgeBaseDocument) => string
  onPreviewProcess: (doc: KnowledgeBaseDocument) => void
  onViewEditChunks: (doc: KnowledgeBaseDocument) => void
  onInsertBlock: (doc: KnowledgeBaseDocument) => void
  onViewApi: (doc: KnowledgeBaseDocument) => void
  onDownloadDocument: (documentId: string) => void
  onRetryDocument: (documentId: string) => void
  onRequestDeleteDocument: (documentId: string) => void
  onDeleteDocuments: (documentIds: string[]) => void
  canDeleteDocuments?: boolean
  canUseFullDocActions?: boolean
}

function KnowledgeBaseDocUpdatedSortIcon({ direction }: { direction: UpdatedSortDir }) {
  const upActive = direction === 'asc'
  const downActive = direction === 'desc'

  return (
    <svg viewBox="0 0 16 16" width="14" height="14" focusable="false" aria-hidden="true">
      <path
        d="M8 3.5 5.5 6h5L8 3.5Z"
        fill={upActive ? 'currentColor' : '#c8c8c8'}
      />
      <path
        d="M8 12.5 10.5 10h-5L8 12.5Z"
        fill={downActive ? 'currentColor' : '#c8c8c8'}
      />
    </svg>
  )
}

export function KnowledgeBaseDocTable({
  locale,
  documents,
  docLabel,
  onPreviewProcess,
  onViewEditChunks,
  onInsertBlock,
  onViewApi,
  onDownloadDocument,
  onRetryDocument,
  onRequestDeleteDocument,
  onDeleteDocuments,
  canDeleteDocuments = true,
  canUseFullDocActions = true,
}: KnowledgeBaseDocTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [statusFilter, setStatusFilter] = useState<KnowledgeBaseDocStatusFilter>('all')
  const [search, setSearch] = useState('')
  const [updatedSort, setUpdatedSort] = useState<UpdatedSortDir>(DEFAULT_UPDATED_SORT)
  const [reindexModalOpen, setReindexModalOpen] = useState(false)
  const selectAllRef = useRef<HTMLInputElement>(null)

  const filteredDocuments = useMemo(() => {
    let list =
      statusFilter === 'all' ? documents : documents.filter((doc) => doc.status === statusFilter)
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((doc) => {
        const haystack = [docLabel(doc), doc.nameZh, doc.nameEn, doc.format].join(' ').toLowerCase()
        return haystack.includes(query)
      })
    }
    return sortDocumentsByUpdatedAt(list, updatedSort)
  }, [documents, statusFilter, search, docLabel, updatedSort])

  const stats = useMemo(() => computeDocTableStats(filteredDocuments), [filteredDocuments])
  const selectedDocs = useMemo(
    () => filteredDocuments.filter((doc) => selectedIds.has(doc.id)),
    [filteredDocuments, selectedIds],
  )

  const allSelected =
    filteredDocuments.length > 0 && filteredDocuments.every((doc) => selectedIds.has(doc.id))
  const someSelected =
    filteredDocuments.some((doc) => selectedIds.has(doc.id)) && !allSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  useEffect(() => {
    const visibleIds = new Set(filteredDocuments.map((doc) => doc.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filteredDocuments])

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(filteredDocuments.map((doc) => doc.id)))
  }

  const toggleOne = (documentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(documentId)) {
        next.delete(documentId)
      } else {
        next.add(documentId)
      }
      return next
    })
  }

  const handleStatusFilterChange = (filter: KnowledgeBaseDocStatusFilter) => {
    setStatusFilter(filter)
  }

  const handleConfirmReindexFailed = () => {
    for (const doc of documents) {
      if (doc.status === 'failed') {
        onRetryDocument(doc.id)
      }
    }
    setReindexModalOpen(false)
  }

  const handleBulkDownload = () => {
    for (const doc of selectedDocs) {
      onDownloadDocument(doc.id)
    }
  }

  const handleBulkRetry = () => {
    for (const doc of selectedDocs) {
      if (doc.status === 'indexing' || doc.status === 'failed') {
        onRetryDocument(doc.id)
      }
    }
  }

  const handleBulkDelete = () => {
    if (selectedDocs.length === 0) return
    if (selectedDocs.length === 1) {
      onRequestDeleteDocument(selectedDocs[0].id)
      return
    }
    const confirmed = window.confirm(
      kbT(locale, 'deleteDocBulkMessage').replace('{count}', String(selectedDocs.length)),
    )
    if (!confirmed) return
    onDeleteDocuments(selectedDocs.map((doc) => doc.id))
    setSelectedIds(new Set())
  }

  return (
    <div className="kb-doc-table-wrap">
      <KnowledgeBaseDocToolbar
        locale={locale}
        statusFilter={statusFilter}
        search={search}
        hasSelection={selectedDocs.length > 0}
        onStatusFilterChange={handleStatusFilterChange}
        onSearchChange={setSearch}
        onOpenReindexFailed={() => setReindexModalOpen(true)}
        onBulkDownload={handleBulkDownload}
        onBulkRetry={handleBulkRetry}
        onBulkDelete={handleBulkDelete}
        showBulkDelete={canDeleteDocuments}
        showBulkDownload={canUseFullDocActions}
        showBulkRetry={canUseFullDocActions}
        showReindexFailed={canUseFullDocActions}
      />

      <KnowledgeBaseReindexFailedModal
        locale={locale}
        open={reindexModalOpen}
        onClose={() => setReindexModalOpen(false)}
        onConfirm={handleConfirmReindexFailed}
      />

      <div className="kb-doc-table">
        <div className="kb-doc-table-head" role="row">
          <label className="kb-doc-table-check">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label={kbT(locale, 'docListSelectAll')}
              disabled={filteredDocuments.length === 0}
            />
          </label>
          <span className="kb-doc-table-col kb-doc-table-col--name">{kbT(locale, 'docListColName')}</span>
          <span className="kb-doc-table-col kb-doc-table-col--size">{kbT(locale, 'docListColSize')}</span>
          <span className="kb-doc-table-col kb-doc-table-col--updated kb-doc-table-col--sortable">
            <span>{kbT(locale, 'docListColUpdated')}</span>
            <button
              type="button"
              className={`kb-doc-table-sort is-active is-${updatedSort}`}
              onClick={() => setUpdatedSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              aria-label={kbT(locale, updatedSort === 'desc' ? 'docListSortUpdatedDesc' : 'docListSortUpdatedAsc')}
            >
              <KnowledgeBaseDocUpdatedSortIcon direction={updatedSort} />
            </button>
          </span>
          <span className="kb-doc-table-col kb-doc-table-col--status">{kbT(locale, 'docListColStatus')}</span>
        </div>

        {filteredDocuments.length > 0 ? (
          <ul className="kb-doc-table-body">
            {filteredDocuments.map((doc) => (
              <KnowledgeBaseDocRow
                key={doc.id}
                locale={locale}
                doc={doc}
                label={docLabel(doc)}
                selected={selectedIds.has(doc.id)}
                onSelectedChange={() => toggleOne(doc.id)}
                onPreviewProcess={() => onPreviewProcess(doc)}
                onViewEditChunks={() => onViewEditChunks(doc)}
                onInsertBlock={() => onInsertBlock(doc)}
                onViewApi={() => onViewApi(doc)}
                onRequestDelete={() => onRequestDeleteDocument(doc.id)}
                onRetry={() => onRetryDocument(doc.id)}
                canDelete={canDeleteDocuments}
                canUseFullDocActions={canUseFullDocActions}
              />
            ))}
          </ul>
        ) : (
          <p className="kb-doc-table-empty">
            {kbT(locale, documents.length === 0 ? 'detailDocsEmpty' : 'docListFilterEmpty')}
          </p>
        )}

        <div className="kb-doc-table-foot">
          <span>
            {kbT(locale, 'docListFooterSize')}: {stats.totalSizeLabel}
          </span>
          <div className="kb-doc-table-foot-stats">
            <span>
              {kbT(locale, 'docListFooterFiles')}: {stats.fileCount}
            </span>
            <span>
              {kbT(locale, 'docListFooterIndexed')}: {stats.indexedCount}
            </span>
            <span>
              {kbT(locale, 'docListFooterErrors')}: {stats.errorCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
