import { useEffect, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  kbIntegrationKindLabel,
  kbIntegrationProviderLabel,
  kbT,
} from '../i18n/strings'
import type {
  KnowledgeBaseIntegrationItem,
  KnowledgeBaseIntegrationKind,
  KnowledgeBaseIntegrationProvider,
} from '../types'
import {
  computeIntegrationTableStats,
  integrationCategoryKey,
} from '../utils/integrationTableStats'
import { aggregateIntegrationItemStatus } from '../utils/aggregateIntegrationItemStatus'
import { groupIntegrationHierarchy } from '../utils/groupIntegrationHierarchy'
import { KnowledgeBaseDocStatusIcon } from './KnowledgeBaseDocStatusIcon'
import { KnowledgeBaseIntegrationItemRow } from './KnowledgeBaseIntegrationItemRow'
import {
  KnowledgeBaseDocToolbar,
  type KnowledgeBaseDocStatusFilter,
} from './KnowledgeBaseDocToolbar'
import { KnowledgeBaseReindexFailedModal } from './KnowledgeBaseReindexFailedModal'

type KnowledgeBaseIntegrationPanelProps = {
  locale: AppLocale
  items: KnowledgeBaseIntegrationItem[]
  itemLabel: (item: KnowledgeBaseIntegrationItem) => string
  onDownloadItem: (itemId: string) => void
  onRetryItem: (itemId: string) => void
  onRequestDeleteItem: (itemId: string) => void
  canDeleteItems?: boolean
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={expanded ? 'kb-int-toggle-icon is-expanded' : 'kb-int-toggle-icon'}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FolderIcon() {
  return (
    <span className="kb-int-folder-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
        <path
          d="M2.5 4.5h4.2l1.3 1.5h5.5v7.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M2.5 6h11.5" stroke="#f59e0b" strokeWidth="0.8" />
      </svg>
    </span>
  )
}

export function KnowledgeBaseIntegrationPanel({
  locale,
  items,
  itemLabel,
  onDownloadItem,
  onRetryItem,
  onRequestDeleteItem,
  canDeleteItems = true,
}: KnowledgeBaseIntegrationPanelProps) {
  const [statusFilter, setStatusFilter] = useState<KnowledgeBaseDocStatusFilter>('all')
  const [search, setSearch] = useState('')
  const [reindexModalOpen, setReindexModalOpen] = useState(false)

  const filteredItems = useMemo(() => {
    let list = statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter)
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter((item) => {
      const haystack = [
        itemLabel(item),
        item.nameZh,
        item.nameEn,
        item.sizeLabel,
        kbIntegrationProviderLabel(locale, item.provider),
        kbIntegrationKindLabel(locale, item.kind),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [items, statusFilter, search, itemLabel, locale])

  const groups = useMemo(() => groupIntegrationHierarchy(filteredItems), [filteredItems])
  const stats = useMemo(() => computeIntegrationTableStats(filteredItems), [filteredItems])
  const selectAllRef = useRef<HTMLInputElement>(null)

  const [expandedProviders, setExpandedProviders] = useState<Set<KnowledgeBaseIntegrationProvider>>(
    () => new Set(),
  )
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const allSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id))
  const someSelected =
    filteredItems.some((item) => selectedIds.has(item.id)) && !allSelected
  const selectedItems = useMemo(
    () => filteredItems.filter((item) => selectedIds.has(item.id)),
    [filteredItems, selectedIds],
  )

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  useEffect(() => {
    const visibleIds = new Set(filteredItems.map((item) => item.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filteredItems])

  const toggleProvider = (provider: KnowledgeBaseIntegrationProvider) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev)
      if (next.has(provider)) {
        next.delete(provider)
      } else {
        next.add(provider)
      }
      return next
    })
  }

  const toggleCategory = (provider: KnowledgeBaseIntegrationProvider, kind: KnowledgeBaseIntegrationKind) => {
    const key = integrationCategoryKey(provider, kind)
    setExpandedProviders((prev) => new Set(prev).add(provider))
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(filteredItems.map((item) => item.id)))
  }

  const toggleOne = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const toggleProviderSelection = (provider: KnowledgeBaseIntegrationProvider, checked: boolean) => {
    const providerItemIds = filteredItems
      .filter((item) => item.provider === provider)
      .map((item) => item.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of providerItemIds) {
        if (checked) {
          next.add(id)
        } else {
          next.delete(id)
        }
      }
      return next
    })
  }

  const toggleCategorySelection = (
    _provider: KnowledgeBaseIntegrationProvider,
    _kind: KnowledgeBaseIntegrationKind,
    categoryItems: KnowledgeBaseIntegrationItem[],
    checked: boolean,
  ) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const item of categoryItems) {
        if (checked) {
          next.add(item.id)
        } else {
          next.delete(item.id)
        }
      }
      return next
    })
  }

  const isProviderSelected = (provider: KnowledgeBaseIntegrationProvider) => {
    const providerItems = filteredItems.filter((item) => item.provider === provider)
    return providerItems.length > 0 && providerItems.every((item) => selectedIds.has(item.id))
  }

  const isProviderIndeterminate = (provider: KnowledgeBaseIntegrationProvider) => {
    const providerItems = filteredItems.filter((item) => item.provider === provider)
    const selectedCount = providerItems.filter((item) => selectedIds.has(item.id)).length
    return selectedCount > 0 && selectedCount < providerItems.length
  }

  const isCategorySelected = (categoryItems: KnowledgeBaseIntegrationItem[]) =>
    categoryItems.length > 0 && categoryItems.every((item) => selectedIds.has(item.id))

  const isCategoryIndeterminate = (categoryItems: KnowledgeBaseIntegrationItem[]) => {
    const selectedCount = categoryItems.filter((item) => selectedIds.has(item.id)).length
    return selectedCount > 0 && selectedCount < categoryItems.length
  }

  return (
    <div className="kb-doc-table-wrap kb-int-table-wrap">
      <KnowledgeBaseDocToolbar
        locale={locale}
        statusFilter={statusFilter}
        search={search}
        hasSelection={selectedItems.length > 0}
        searchPlaceholderKey="integrationListSearchPlaceholder"
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        onOpenReindexFailed={() => setReindexModalOpen(true)}
        onBulkDownload={() => undefined}
        onBulkRetry={() => undefined}
        onBulkDelete={() => undefined}
        showBulkDelete={canDeleteItems}
      />

      <KnowledgeBaseReindexFailedModal
        locale={locale}
        open={reindexModalOpen}
        onClose={() => setReindexModalOpen(false)}
        onConfirm={() => setReindexModalOpen(false)}
      />

      <div className="kb-doc-table kb-int-table">
        <div className="kb-doc-table-head" role="row">
          <label className="kb-doc-table-check">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label={kbT(locale, 'integrationListSelectAll')}
              disabled={filteredItems.length === 0}
            />
          </label>
          <span className="kb-doc-table-col kb-doc-table-col--name">{kbT(locale, 'integrationListColName')}</span>
          <span className="kb-doc-table-col kb-doc-table-col--size">{kbT(locale, 'docListColSize')}</span>
          <span className="kb-doc-table-col kb-doc-table-col--updated">{kbT(locale, 'integrationListColUpdated')}</span>
          <span className="kb-doc-table-col kb-doc-table-col--status">{kbT(locale, 'integrationListColStatus')}</span>
        </div>

        {items.length === 0 ? (
          <p className="kb-doc-table-empty">{kbT(locale, 'detailIntegrationsEmpty')}</p>
        ) : filteredItems.length > 0 ? (
          <ul className="kb-doc-table-body">
            {groups.map((group) => {
              const providerExpanded = expandedProviders.has(group.provider)
              const providerChecked = isProviderSelected(group.provider)
              const providerIndeterminate = isProviderIndeterminate(group.provider)
              const providerItems = items.filter((item) => item.provider === group.provider)
              const providerStatus = aggregateIntegrationItemStatus(providerItems)

              return (
                <li key={group.provider} className="kb-int-table-group">
                  <div className="kb-doc-table-row kb-int-table-row kb-int-table-row--provider">
                    <label className="kb-doc-table-check">
                      <input
                        type="checkbox"
                        checked={providerChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = providerIndeterminate
                        }}
                        onChange={(e) => toggleProviderSelection(group.provider, e.target.checked)}
                        aria-label={kbIntegrationProviderLabel(locale, group.provider)}
                      />
                    </label>
                    <div className="kb-doc-table-col kb-doc-table-col--name">
                      <button
                        type="button"
                        className="kb-int-toggle"
                        aria-expanded={providerExpanded}
                        aria-label={kbIntegrationProviderLabel(locale, group.provider)}
                        onClick={() => toggleProvider(group.provider)}
                      >
                        <ChevronIcon expanded={providerExpanded} />
                      </button>
                      <FolderIcon />
                      <span className="kb-doc-table-name">
                        {kbIntegrationProviderLabel(locale, group.provider)}
                      </span>
                    </div>
                    <span className="kb-doc-table-col kb-doc-table-col--size" />
                    <span className="kb-doc-table-col kb-doc-table-col--updated" />
                    <div className="kb-doc-table-col kb-doc-table-col--status">
                      {providerStatus ? (
                        <KnowledgeBaseDocStatusIcon locale={locale} status={providerStatus} />
                      ) : null}
                    </div>
                  </div>

                  {providerExpanded
                    ? group.categories.map((category) => {
                        const categoryKey = integrationCategoryKey(group.provider, category.kind)
                        const categoryExpanded = expandedCategories.has(categoryKey)
                        const categoryChecked = isCategorySelected(category.items)
                        const categoryIndeterminate = isCategoryIndeterminate(category.items)
                        const categoryItems = items.filter(
                          (item) => item.provider === group.provider && item.kind === category.kind,
                        )
                        const categoryStatus = aggregateIntegrationItemStatus(categoryItems)

                        return (
                          <div key={categoryKey} className="kb-int-table-subgroup">
                            <div className="kb-doc-table-row kb-int-table-row kb-int-table-row--category">
                              <label className="kb-doc-table-check">
                                <input
                                  type="checkbox"
                                  checked={categoryChecked}
                                  ref={(el) => {
                                    if (el) el.indeterminate = categoryIndeterminate
                                  }}
                                  onChange={(e) =>
                                    toggleCategorySelection(
                                      group.provider,
                                      category.kind,
                                      category.items,
                                      e.target.checked,
                                    )
                                  }
                                  aria-label={kbIntegrationKindLabel(locale, category.kind)}
                                />
                              </label>
                              <div className="kb-doc-table-col kb-doc-table-col--name">
                                <button
                                  type="button"
                                  className="kb-int-toggle"
                                  aria-expanded={categoryExpanded}
                                  aria-label={kbIntegrationKindLabel(locale, category.kind)}
                                  onClick={() => toggleCategory(group.provider, category.kind)}
                                >
                                  <ChevronIcon expanded={categoryExpanded} />
                                </button>
                                <FolderIcon />
                                <span className="kb-doc-table-name">
                                  {kbIntegrationKindLabel(locale, category.kind)}
                                </span>
                              </div>
                              <span className="kb-doc-table-col kb-doc-table-col--size" />
                              <span className="kb-doc-table-col kb-doc-table-col--updated" />
                              <div className="kb-doc-table-col kb-doc-table-col--status">
                                {categoryStatus ? (
                                  <KnowledgeBaseDocStatusIcon locale={locale} status={categoryStatus} />
                                ) : null}
                              </div>
                            </div>

                            {categoryExpanded
                              ? category.items.map((item) => (
                                  <KnowledgeBaseIntegrationItemRow
                                    key={item.id}
                                    locale={locale}
                                    item={item}
                                    label={itemLabel(item)}
                                    selected={selectedIds.has(item.id)}
                                    onSelectedChange={() => toggleOne(item.id)}
                                    onDownload={() => onDownloadItem(item.id)}
                                    onRetry={() => onRetryItem(item.id)}
                                    onRequestDelete={() => onRequestDeleteItem(item.id)}
                                    canDelete={canDeleteItems}
                                  />
                                ))
                              : null}
                          </div>
                        )
                      })
                    : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="kb-doc-table-empty">{kbT(locale, 'integrationListFilterEmpty')}</p>
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
            <span className={stats.errorCount > 0 ? 'is-error' : undefined}>
              {kbT(locale, 'docListFooterErrors')}: {stats.errorCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
