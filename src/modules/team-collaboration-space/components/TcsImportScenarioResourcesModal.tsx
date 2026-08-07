import { useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { importResourceCategoryLabel, tcsT } from '../i18n/strings'
import type { TcsResourceCatalogItem } from '../types'
import {
  localizeImportResourceDesc,
  localizeImportResourceMeta,
  localizeImportResourceName,
  resolveResourceCatalogCategory,
  type ResourceCatalogCategory,
} from '../utils/spaceResources'

type ImportResourceFilterTab = 'all' | ResourceCatalogCategory

type TcsImportScenarioResourcesModalProps = {
  locale: AppLocale
  open: boolean
  candidates: TcsResourceCatalogItem[]
  onClose: () => void
  onConfirm: (resourceIds: string[]) => void
}

export function TcsImportScenarioResourcesModal({
  locale,
  open,
  candidates,
  onClose,
  onConfirm,
}: TcsImportScenarioResourcesModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<ImportResourceFilterTab>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setSearchQuery('')
    setFilterTab('all')
    setSelectedIds([])
  }, [open])

  const searchFilteredCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return candidates
    return candidates.filter((item) => {
      const name = localizeImportResourceName(item, locale).toLowerCase()
      const desc = localizeImportResourceDesc(item, locale).toLowerCase()
      const category = importResourceCategoryLabel(locale, resolveResourceCatalogCategory(item)).toLowerCase()
      return name.includes(query) || desc.includes(query) || category.includes(query)
    })
  }, [candidates, locale, searchQuery])

  const tabCounts = useMemo(() => {
    const countByCategory = (category: ResourceCatalogCategory) =>
      searchFilteredCandidates.filter((item) => resolveResourceCatalogCategory(item) === category).length

    return {
      all: searchFilteredCandidates.length,
      scenario: countByCategory('scenario'),
      agent: countByCategory('agent'),
      skills: countByCategory('skills'),
      tools: countByCategory('tools'),
    }
  }, [searchFilteredCandidates])

  const filteredCandidates = useMemo(() => {
    if (filterTab === 'all') return searchFilteredCandidates
    return searchFilteredCandidates.filter((item) => resolveResourceCatalogCategory(item) === filterTab)
  }, [filterTab, searchFilteredCandidates])

  const typeTabs: Array<{
    key: ImportResourceFilterTab
    labelKey:
      | 'projectSpaceMineTabAll'
      | 'projectSpaceMineTabScenario'
      | 'projectSpaceMineTabAgent'
      | 'projectSpaceMineTabSkills'
      | 'projectSpaceMineTabTools'
    count: number
  }> = [
    { key: 'all', labelKey: 'projectSpaceMineTabAll', count: tabCounts.all },
    { key: 'scenario', labelKey: 'projectSpaceMineTabScenario', count: tabCounts.scenario },
    { key: 'agent', labelKey: 'projectSpaceMineTabAgent', count: tabCounts.agent },
    { key: 'skills', labelKey: 'projectSpaceMineTabSkills', count: tabCounts.skills },
    { key: 'tools', labelKey: 'projectSpaceMineTabTools', count: tabCounts.tools },
  ]

  if (!open) return null

  const toggleSelected = (resourceId: string) => {
    setSelectedIds((current) =>
      current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId],
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (selectedIds.length === 0) return
    onConfirm(selectedIds)
    onClose()
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tcs-modal tcs-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tcs-import-resources-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tcs-import-resources-title" className="tcs-modal-title">
          {tcsT(locale, 'importResourcesTitle')}
        </h2>
        <p className="tcs-modal-hint">{tcsT(locale, 'importResourcesHint')}</p>
        <form className="tcs-modal-form" onSubmit={handleSubmit}>
          <label className="tcs-field">
            <span>{tcsT(locale, 'importResourcesSearch')}</span>
            <input
              type="search"
              value={searchQuery}
              placeholder={tcsT(locale, 'searchPlaceholder')}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <section className="tcs-form-section">
            <h3 className="tcs-form-section-title">{tcsT(locale, 'importResourcesListTitle')}</h3>
            <div className="tcs-import-resources-tab-filters">
              <div
                className="tcs-tasks-panel-tabs tcs-mine-content-type-tabs"
                role="tablist"
                aria-label={tcsT(locale, 'resourcesFilterAria')}
              >
                {typeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={filterTab === tab.key}
                    className={`tcs-tasks-panel-tab${filterTab === tab.key ? ' is-active' : ''}`}
                    onClick={() => setFilterTab(tab.key)}
                  >
                    <span className="tcs-tasks-panel-tab-label">
                      {tcsT(locale, tab.labelKey)} · {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {filteredCandidates.length === 0 ? (
              <p className="tcs-modal-hint">
                {searchFilteredCandidates.length === 0
                  ? tcsT(locale, 'importResourcesEmpty')
                  : tcsT(locale, 'resourcesFilterEmpty')}
              </p>
            ) : (
              <ul className="tcs-import-resources-list">
                {filteredCandidates.map((item) => {
                  const checked = selectedIds.includes(item.id)
                  const name = localizeImportResourceName(item, locale)
                  const desc = localizeImportResourceDesc(item, locale)
                  const meta = localizeImportResourceMeta(item, locale)
                  const category = resolveResourceCatalogCategory(item)
                  return (
                    <li key={item.id}>
                      <label className={`tcs-import-resources-pick-item${checked ? ' is-selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelected(item.id)}
                        />
                        <span className="tcs-import-resources-pick-body">
                          <span className="tcs-import-resources-pick-head">
                            <span className="tcs-import-resources-pick-name">{name}</span>
                            <span className="tcs-import-resources-pick-tag">
                              {importResourceCategoryLabel(locale, category)}
                            </span>
                          </span>
                          <span className="tcs-import-resources-pick-desc">{desc}</span>
                          <span className="tcs-import-resources-pick-meta">{meta}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <div className="tcs-modal-actions">
            <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>
              {tcsT(locale, 'formCancel')}
            </button>
            <button type="submit" className="agents-btn agents-btn-primary" disabled={selectedIds.length === 0}>
              {selectedIds.length > 0
                ? tcsT(locale, 'importResourcesConfirm').replace('{count}', String(selectedIds.length))
                : tcsT(locale, 'importResources')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
