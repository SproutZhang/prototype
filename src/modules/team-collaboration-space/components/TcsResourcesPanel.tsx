import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  ONBOARDING_SCENARIO_SOURCE_NAME,
} from '../../../i18n/scenarioStrings'
import { formatAgentCardMeta } from '../../../utils/formatAgentCardMeta'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { tcsT } from '../i18n/strings'
import type { TcsResourceCatalogItem } from '../types'
import { resolveResourceCardTagLabel } from '../utils/resourceCardTag'
import { resolveResourceCreatorDisplay } from '../utils/resourceCreator'
import { requestMineContentEdit } from '../utils/mineContentNavigation'
import { resolveResourceCatalogCategory, resolveScopeResources, localizeImportResourceDesc, localizeImportResourceName } from '../utils/spaceResources'
import { TcsAgentLibraryResourcesGrid } from './TcsAgentLibraryResourcesSection'
import { TcsContentEmptyState } from './TcsContentEmptyState'
import { TcsMoveResourceModal, TcsRemoveResourceModal } from './TcsResourceManageModals'
import { TcsResourceIterationDrawer } from './TcsResourceIterationDrawer'

type TcsResourcesPanelProps = {
  locale: AppLocale
  scopeKey: string
  resourceCount: number
  resourceIds?: string[]
  spaceId?: string
  /** 空态时展示的操作区（如「引入资源」按钮） */
  emptyAction?: ReactNode
  /** 为 false 时不展示资源来源筛选 Tab，直接显示全部资源 */
  showResourceFilters?: boolean
  /** 为 false 时不展示卡片右下角 Agent / 工作流类型标签 */
  showResourceKindTag?: boolean
  /** 仅渲染卡片项，供外层统一 grid 容器包裹 */
  embedInParentGrid?: boolean
  /** 为 true 时卡片展示 ⋮ 菜单：移出 / 移动 */
  canManageResources?: boolean
  /** 父项目已失效时灰化卡片并禁用资源管理菜单 */
  showExpiredBadge?: boolean
  moveTargetSpaces?: Array<{ id: string; name: string }>
  onRemoveResource?: (resourceId: string) => void
  onMoveResource?: (resourceId: string, targetSpaceId: string) => void
  /** 由页面级 shell 渲染全高抽屉时使用 */
  externalIterationDrawer?: boolean
  iterationItem?: TcsResourceCatalogItem | null
  onIterationItemChange?: (item: TcsResourceCatalogItem | null) => void
}

type ResourceFilterTab = 'all' | 'agent' | 'scenario' | 'skills' | 'tools'

const HR_ONBOARDING_SPACE_ID = 'tcs-hr-onboarding'
const HR_PINNED_RESOURCE_IDS = new Set<string>([ONBOARDING_SCENARIO_SOURCE_NAME])

const ICON_PALETTES = [
  { from: '#7f7cff', via: '#8b5cf6', to: '#ff9a62', shadow: 'rgba(124, 92, 255, 0.28)' },
  { from: '#5ea8ff', via: '#5b7cff', to: '#7b61ff', shadow: 'rgba(91, 124, 255, 0.24)' },
  { from: '#19c7c7', via: '#2d9bf0', to: '#6d6bff', shadow: 'rgba(45, 155, 240, 0.24)' },
  { from: '#ffd36a', via: '#ffab5b', to: '#ff7b72', shadow: 'rgba(255, 171, 91, 0.26)' },
  { from: '#62d6a5', via: '#33c0b8', to: '#3f8cff', shadow: 'rgba(51, 192, 184, 0.24)' },
  { from: '#ff8cb7', via: '#ff7d95', to: '#9a6bff', shadow: 'rgba(255, 125, 149, 0.25)' },
  { from: '#7ad7ff', via: '#4ca9ff', to: '#7c73ff', shadow: 'rgba(76, 169, 255, 0.24)' },
  { from: '#ffb86c', via: '#ff8f70', to: '#ff6ea8', shadow: 'rgba(255, 143, 112, 0.24)' },
] as const

function pickIconPalette(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 37 + seed.charCodeAt(i)) >>> 0
  return ICON_PALETTES[hash % ICON_PALETTES.length]
}

function resourceIconStyle(item: TcsResourceCatalogItem): CSSProperties {
  const palette = pickIconPalette(item.id)
  return {
    '--agent-icon-from': palette.from,
    '--agent-icon-via': palette.via,
    '--agent-icon-to': palette.to,
    '--agent-icon-shadow': palette.shadow,
  } as CSSProperties
}

function localizeResource(item: TcsResourceCatalogItem, locale: AppLocale) {
  return {
    name: localizeImportResourceName(item, locale),
    desc: localizeImportResourceDesc(item, locale),
  }
}


function resolveResourceFilterCategory(
  item: TcsResourceCatalogItem,
): Exclude<ResourceFilterTab, 'all'> {
  return resolveResourceCatalogCategory(item)
}

function filterResourcesByTab(
  resources: TcsResourceCatalogItem[],
  tab: ResourceFilterTab,
): TcsResourceCatalogItem[] {
  if (tab === 'all') return resources
  return resources.filter((item) => resolveResourceFilterCategory(item) === tab)
}

function TcsResourceTypeTabs({
  locale,
  resources,
  activeTab,
  onChange,
}: {
  locale: AppLocale
  resources: TcsResourceCatalogItem[]
  activeTab: ResourceFilterTab
  onChange: (tab: ResourceFilterTab) => void
}) {
  const counts = useMemo(() => {
    const agent = resources.filter((item) => resolveResourceFilterCategory(item) === 'agent').length
    const scenario = resources.filter((item) => resolveResourceFilterCategory(item) === 'scenario').length
    const skills = resources.filter((item) => resolveResourceFilterCategory(item) === 'skills').length
    const tools = resources.filter((item) => resolveResourceFilterCategory(item) === 'tools').length
    return {
      all: agent + scenario + skills + tools,
      agent,
      scenario,
      skills,
      tools,
    }
  }, [resources])

  const typeTabs: Array<{
    key: ResourceFilterTab
    labelKey:
      | 'projectSpaceMineTabAll'
      | 'projectSpaceMineTabAgent'
      | 'projectSpaceMineTabScenario'
      | 'projectSpaceMineTabSkills'
      | 'projectSpaceMineTabTools'
    count: number
  }> = [
    { key: 'all', labelKey: 'projectSpaceMineTabAll', count: counts.all },
    { key: 'agent', labelKey: 'projectSpaceMineTabAgent', count: counts.agent },
    { key: 'scenario', labelKey: 'projectSpaceMineTabScenario', count: counts.scenario },
    { key: 'skills', labelKey: 'projectSpaceMineTabSkills', count: counts.skills },
    { key: 'tools', labelKey: 'projectSpaceMineTabTools', count: counts.tools },
  ]

  return (
    <div className="tcs-mine-content-tab-filters">
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
            aria-selected={activeTab === tab.key}
            className={`tcs-tasks-panel-tab${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="tcs-tasks-panel-tab-label">
              {tcsT(locale, tab.labelKey)} · {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}


function TcsResourceCardItem({
  locale,
  scopeKey,
  item,
  spaceId,
  showResourceKindTag = true,
  canManageResources = false,
  showExpiredBadge = false,
  onRequestEdit,
  onRequestMove,
  onRequestRemove,
  onRequestIteration,
  canViewIterationHistory = false,
}: {
  locale: AppLocale
  scopeKey: string
  item: TcsResourceCatalogItem
  spaceId?: string
  showResourceKindTag?: boolean
  canManageResources?: boolean
  showExpiredBadge?: boolean
  onRequestEdit?: (item: TcsResourceCatalogItem) => void
  onRequestMove?: (item: TcsResourceCatalogItem) => void
  onRequestRemove?: (item: TcsResourceCatalogItem) => void
  onRequestIteration?: (item: TcsResourceCatalogItem) => void
  canViewIterationHistory?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const localized = localizeResource(item, locale)
  const creator = resolveResourceCreatorDisplay(item.id, locale, spaceId)
  const showManageMenu = canManageResources && !showExpiredBadge

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const cardClassName = [
    'agent-card',
    'tcs-resource-card',
    showManageMenu ? 'tcs-resource-card--manageable' : 'agent-card--clickable is-clickable',
    showExpiredBadge ? 'tcs-list-card--expired' : '',
    menuOpen ? 'tcs-resource-card--menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article key={`${scopeKey}:${item.id}`} className={cardClassName}>
      {showManageMenu ? (
        <div className="agent-card-more-wrap" onClick={stopMenuEvent} onMouseDown={stopMenuEvent}>
          <button
            type="button"
            className="agent-card-more"
            aria-label={tcsT(locale, 'resourceCardMenuAria')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(event) => {
              stopMenuEvent(event)
              setMenuOpen((open) => !open)
            }}
          >
            ⋮
          </button>
          <div
            className={menuOpen ? 'agent-card-menu is-open' : 'agent-card-menu'}
            role="menu"
            aria-label={tcsT(locale, 'resourceCardMenuAria')}
            onClick={stopMenuEvent}
            onMouseDown={stopMenuEvent}
          >
            <button
              type="button"
              className="agent-card-menu-item"
              role="menuitem"
              onClick={(event) => {
                stopMenuEvent(event)
                setMenuOpen(false)
                onRequestEdit?.(item)
              }}
            >
              {tcsT(locale, 'cardMenuEdit')}
            </button>
            {canViewIterationHistory ? (
              <button
                type="button"
                className="agent-card-menu-item"
                role="menuitem"
                onClick={(event) => {
                  stopMenuEvent(event)
                  setMenuOpen(false)
                  onRequestIteration?.(item)
                }}
              >
                {tcsT(locale, 'resourceIterationHistory')}
              </button>
            ) : null}
            <button
              type="button"
              className="agent-card-menu-item"
              role="menuitem"
              onClick={(event) => {
                stopMenuEvent(event)
                setMenuOpen(false)
                onRequestMove?.(item)
              }}
            >
              {tcsT(locale, 'resourceMoveToSpace')}
            </button>
            <button
              type="button"
              className="agent-card-menu-item is-danger"
              role="menuitem"
              onClick={(event) => {
                stopMenuEvent(event)
                setMenuOpen(false)
                onRequestRemove?.(item)
              }}
            >
              {tcsT(locale, 'resourceRemoveFromSpace')}
            </button>
          </div>
        </div>
      ) : null}
      <div
        className="agent-card-icon agent-card-icon-grad"
        style={resourceIconStyle(item)}
        aria-hidden="true"
      />
      <div className="agent-card-name-row">
        <div className="agent-card-name">{localized.name}</div>
        {showExpiredBadge ? (
          <span className="tcs-space-status-badge tcs-space-status-badge--expired">
            {tcsT(locale, 'projectSpaceExpiredBadge')}
          </span>
        ) : null}
      </div>
      <div className="agent-card-desc">{localized.desc}</div>
      {creator ? (
        <p
          className={
            creator.variant === 'template'
              ? 'agent-card-creator agent-card-creator--template'
              : 'agent-card-creator'
          }
        >
          {creator.label}
        </p>
      ) : null}
      <div className="agent-card-footer">
        <p className="agent-card-meta">{formatAgentCardMeta(item.meta, locale)}</p>
        {showResourceKindTag ? (
          <div className="agent-card-tag">{resolveResourceCardTagLabel(item, locale)}</div>
        ) : null}
      </div>
    </article>
  )
}

function TcsResourceCardItems({
  locale,
  scopeKey,
  items,
  spaceId,
  showResourceKindTag = true,
  canManageResources = false,
  showExpiredBadge = false,
  onRequestEdit,
  onRequestMove,
  onRequestRemove,
  onRequestIteration,
  canViewIterationHistory = false,
}: {
  locale: AppLocale
  scopeKey: string
  items: TcsResourceCatalogItem[]
  spaceId?: string
  showResourceKindTag?: boolean
  canManageResources?: boolean
  showExpiredBadge?: boolean
  onRequestEdit?: (item: TcsResourceCatalogItem) => void
  onRequestMove?: (item: TcsResourceCatalogItem) => void
  onRequestRemove?: (item: TcsResourceCatalogItem) => void
  onRequestIteration?: (item: TcsResourceCatalogItem) => void
  canViewIterationHistory?: boolean
}) {
  return (
    <>
      {items.map((item) => (
        <TcsResourceCardItem
          key={`${scopeKey}:${item.id}`}
          locale={locale}
          scopeKey={scopeKey}
          item={item}
          spaceId={spaceId}
          showResourceKindTag={showResourceKindTag}
          canManageResources={canManageResources}
          showExpiredBadge={showExpiredBadge}
          onRequestEdit={onRequestEdit}
          onRequestMove={onRequestMove}
          onRequestRemove={onRequestRemove}
          onRequestIteration={onRequestIteration}
          canViewIterationHistory={canViewIterationHistory}
        />
      ))}
    </>
  )
}

function TcsResourceCardsGrid({
  locale,
  scopeKey,
  items,
  spaceId,
  showResourceKindTag = true,
  canManageResources = false,
  showExpiredBadge = false,
  onRequestEdit,
  onRequestMove,
  onRequestRemove,
  onRequestIteration,
  canViewIterationHistory = false,
}: {
  locale: AppLocale
  scopeKey: string
  items: TcsResourceCatalogItem[]
  spaceId?: string
  showResourceKindTag?: boolean
  canManageResources?: boolean
  showExpiredBadge?: boolean
  onRequestEdit?: (item: TcsResourceCatalogItem) => void
  onRequestMove?: (item: TcsResourceCatalogItem) => void
  onRequestRemove?: (item: TcsResourceCatalogItem) => void
  onRequestIteration?: (item: TcsResourceCatalogItem) => void
  canViewIterationHistory?: boolean
}) {
  if (items.length === 0) return null

  return (
    <div
      className="agents-grid agent-cards-grid tcs-resources-grid"
      aria-label={tcsT(locale, 'resourcesPanelAria')}
    >
      <TcsResourceCardItems
        locale={locale}
        scopeKey={scopeKey}
        items={items}
        spaceId={spaceId}
        showResourceKindTag={showResourceKindTag}
        canManageResources={canManageResources}
        showExpiredBadge={showExpiredBadge}
        onRequestEdit={onRequestEdit}
        onRequestMove={onRequestMove}
        onRequestRemove={onRequestRemove}
        onRequestIteration={onRequestIteration}
        canViewIterationHistory={canViewIterationHistory}
      />
    </div>
  )
}

function TcsResourcesEmptyState({
  locale,
  emptyAction,
}: {
  locale: AppLocale
  emptyAction?: ReactNode
}) {
  return (
    <TcsContentEmptyState locale={locale} messageKey="resourcesEmpty">
      {emptyAction ? <div className="tcs-resources-empty-action">{emptyAction}</div> : null}
    </TcsContentEmptyState>
  )
}

function TcsHrResourcesPanel({
  locale,
  scopeKey,
  resourceCount,
  resourceIds,
  spaceId,
  showResourceFilters = true,
  showResourceKindTag = true,
  embedInParentGrid = false,
  emptyAction,
  canManageResources = false,
  showExpiredBadge = false,
  onRequestEdit,
  onRequestMove,
  onRequestRemove,
  onRequestIteration,
  canViewIterationHistory = false,
}: {
  locale: AppLocale
  scopeKey: string
  resourceCount: number
  resourceIds?: string[]
  spaceId?: string
  showResourceFilters?: boolean
  showResourceKindTag?: boolean
  embedInParentGrid?: boolean
  emptyAction?: ReactNode
  canManageResources?: boolean
  showExpiredBadge?: boolean
  onRequestEdit?: (item: TcsResourceCatalogItem) => void
  onRequestMove?: (item: TcsResourceCatalogItem) => void
  onRequestRemove?: (item: TcsResourceCatalogItem) => void
  onRequestIteration?: (item: TcsResourceCatalogItem) => void
  canViewIterationHistory?: boolean
}) {
  const [filterTab, setFilterTab] = useState<ResourceFilterTab>('all')

  const catalogResources = useMemo(() => {
    const assigned = resolveScopeResources(scopeKey, resourceCount, resourceIds)
    return assigned.filter((item) => !HR_PINNED_RESOURCE_IDS.has(item.id))
  }, [scopeKey, resourceCount, resourceIds])

  const agentCatalogItems = useMemo(
    () => catalogResources.filter((item) => resolveResourceCatalogCategory(item) === 'agent'),
    [catalogResources],
  )
  const scenarioCatalogItems = useMemo(
    () => catalogResources.filter((item) => resolveResourceCatalogCategory(item) === 'scenario'),
    [catalogResources],
  )
  const skillsCatalogItems = useMemo(
    () => catalogResources.filter((item) => resolveResourceFilterCategory(item) === 'skills'),
    [catalogResources],
  )
  const toolsCatalogItems = useMemo(
    () => catalogResources.filter((item) => resolveResourceFilterCategory(item) === 'tools'),
    [catalogResources],
  )

  const effectiveFilterTab = showResourceFilters ? filterTab : 'all'

  const showAgentLibraryGrid =
    effectiveFilterTab === 'all' || effectiveFilterTab === 'agent'
  const showAgentCatalog =
    (effectiveFilterTab === 'all' || effectiveFilterTab === 'agent') && agentCatalogItems.length > 0
  const showScenarioCatalog =
    (effectiveFilterTab === 'all' || effectiveFilterTab === 'scenario') &&
    scenarioCatalogItems.length > 0
  const showSkillsCatalog =
    (effectiveFilterTab === 'all' || effectiveFilterTab === 'skills') && skillsCatalogItems.length > 0
  const showToolsCatalog =
    (effectiveFilterTab === 'all' || effectiveFilterTab === 'tools') && toolsCatalogItems.length > 0

  const hasAgentContent = showAgentLibraryGrid || showAgentCatalog
  const hasScenarioContent = showScenarioCatalog
  const hasSkillsContent = showSkillsCatalog
  const hasToolsContent = showToolsCatalog
  const hasFilteredContent =
    effectiveFilterTab === 'all'
      ? hasAgentContent || hasScenarioContent || hasSkillsContent || hasToolsContent
      : effectiveFilterTab === 'agent'
        ? hasAgentContent
        : effectiveFilterTab === 'scenario'
          ? hasScenarioContent
          : effectiveFilterTab === 'skills'
            ? hasSkillsContent
            : hasToolsContent

  const isEmpty = !hasFilteredContent

  const resourceCards = (
    <>
      {showAgentLibraryGrid ? (
        <TcsAgentLibraryResourcesGrid
          locale={locale}
          embedInParentGrid
          showItemTag={showResourceKindTag}
        />
      ) : null}
      {showAgentCatalog ? (
        <TcsResourceCardItems
          locale={locale}
          scopeKey={scopeKey}
          items={agentCatalogItems}
          spaceId={spaceId}
          showResourceKindTag={showResourceKindTag}
          canManageResources={canManageResources}
          showExpiredBadge={showExpiredBadge}
          onRequestEdit={onRequestEdit}
          onRequestMove={onRequestMove}
          onRequestRemove={onRequestRemove}
          onRequestIteration={onRequestIteration}
          canViewIterationHistory={canViewIterationHistory}
        />
      ) : null}
      {showScenarioCatalog ? (
        <TcsResourceCardItems
          locale={locale}
          scopeKey={scopeKey}
          items={scenarioCatalogItems}
          spaceId={spaceId}
          showResourceKindTag={showResourceKindTag}
          canManageResources={canManageResources}
          showExpiredBadge={showExpiredBadge}
          onRequestEdit={onRequestEdit}
          onRequestMove={onRequestMove}
          onRequestRemove={onRequestRemove}
          onRequestIteration={onRequestIteration}
          canViewIterationHistory={canViewIterationHistory}
        />
      ) : null}
      {showSkillsCatalog ? (
        <TcsResourceCardItems
          locale={locale}
          scopeKey={scopeKey}
          items={skillsCatalogItems}
          spaceId={spaceId}
          showResourceKindTag={showResourceKindTag}
          canManageResources={canManageResources}
          showExpiredBadge={showExpiredBadge}
          onRequestEdit={onRequestEdit}
          onRequestMove={onRequestMove}
          onRequestRemove={onRequestRemove}
          onRequestIteration={onRequestIteration}
          canViewIterationHistory={canViewIterationHistory}
        />
      ) : null}
      {showToolsCatalog ? (
        <TcsResourceCardItems
          locale={locale}
          scopeKey={scopeKey}
          items={toolsCatalogItems}
          spaceId={spaceId}
          showResourceKindTag={showResourceKindTag}
          canManageResources={canManageResources}
          showExpiredBadge={showExpiredBadge}
          onRequestEdit={onRequestEdit}
          onRequestMove={onRequestMove}
          onRequestRemove={onRequestRemove}
          onRequestIteration={onRequestIteration}
          canViewIterationHistory={canViewIterationHistory}
        />
      ) : null}
    </>
  )

  if (embedInParentGrid) {
    if (isEmpty) return null
    return resourceCards
  }

  return (
    <div className="tcs-resources-panel tcs-resources-panel--hr">
      {showResourceFilters ? (
        <TcsResourceTypeTabs
          locale={locale}
          resources={catalogResources}
          activeTab={filterTab}
          onChange={setFilterTab}
        />
      ) : null}

      {isEmpty ? (
        catalogResources.length === 0 ? (
          <TcsResourcesEmptyState locale={locale} emptyAction={emptyAction} />
        ) : (
          <div className="skills-empty tcs-project-space-empty">{tcsT(locale, 'resourcesFilterEmpty')}</div>
        )
      ) : (
        <div
          className="agents-grid agent-cards-grid tcs-resources-grid tcs-resources-unified"
          aria-label={tcsT(locale, 'resourcesPanelAria')}
        >
          {resourceCards}
        </div>
      )}
    </div>
  )
}

export function TcsResourcesPanel({
  locale,
  scopeKey,
  resourceCount,
  resourceIds,
  spaceId,
  showResourceFilters = true,
  showResourceKindTag = true,
  embedInParentGrid = false,
  emptyAction,
  canManageResources = false,
  showExpiredBadge = false,
  moveTargetSpaces = [],
  onRemoveResource,
  onMoveResource,
  externalIterationDrawer = false,
  iterationItem: controlledIterationItem,
  onIterationItemChange,
}: TcsResourcesPanelProps) {
  const { canProjectSpaceViewChangelog } = useTeamCollaborationCapabilities()
  const [filterTab, setFilterTab] = useState<ResourceFilterTab>('all')
  const [moveItem, setMoveItem] = useState<TcsResourceCatalogItem | null>(null)
  const [removeItem, setRemoveItem] = useState<TcsResourceCatalogItem | null>(null)
  const [internalIterationItem, setInternalIterationItem] = useState<TcsResourceCatalogItem | null>(null)
  const [iterationToast, setIterationToast] = useState<{ title: string; sub?: string } | null>(null)
  const iterationToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const iterationItem = controlledIterationItem !== undefined ? controlledIterationItem : internalIterationItem
  const setIterationItem = onIterationItemChange ?? setInternalIterationItem
  const useExternalDrawer = externalIterationDrawer

  const showResourceManageMenu = canManageResources && !showExpiredBadge
  const manageEnabled =
    showResourceManageMenu && Boolean(onRemoveResource && onMoveResource)
  const canViewIterationHistory = canProjectSpaceViewChangelog && showResourceManageMenu
  const onRequestEdit = manageEnabled
    ? (item: TcsResourceCatalogItem) => requestMineContentEdit(item.id, item.sourceModule)
    : undefined
  const onRequestMove = manageEnabled ? setMoveItem : undefined
  const onRequestRemove = manageEnabled ? setRemoveItem : undefined
  const onRequestIteration = canViewIterationHistory ? setIterationItem : undefined

  const showIterationToast = (title: string, sub?: string) => {
    setIterationToast({ title, sub: sub?.trim() || undefined })
    if (iterationToastTimerRef.current) window.clearTimeout(iterationToastTimerRef.current)
    iterationToastTimerRef.current = window.setTimeout(() => {
      iterationToastTimerRef.current = undefined
      setIterationToast(null)
    }, 3200)
  }

  const moveResourceName = moveItem ? localizeImportResourceName(moveItem, locale) : ''
  const removeResourceName = removeItem ? localizeImportResourceName(removeItem, locale) : ''

  const isHrSpace = spaceId === HR_ONBOARDING_SPACE_ID
  const resources = useMemo(
    () => resolveScopeResources(scopeKey, resourceCount, resourceIds),
    [scopeKey, resourceCount, resourceIds],
  )

  const filteredResources = useMemo(
    () => (showResourceFilters ? filterResourcesByTab(resources, filterTab) : resources),
    [filterTab, resources, showResourceFilters],
  )

  const resourceCardProps = {
    canManageResources: manageEnabled,
    showExpiredBadge,
    onRequestEdit,
    onRequestMove,
    onRequestRemove,
    onRequestIteration,
    canViewIterationHistory,
  }

  const resourceManageModals = manageEnabled ? (
    <>
      <TcsMoveResourceModal
        locale={locale}
        open={moveItem != null}
        resourceName={moveResourceName}
        targets={moveTargetSpaces}
        onClose={() => setMoveItem(null)}
        onConfirm={(targetSpaceId) => {
          if (!moveItem) return
          onMoveResource?.(moveItem.id, targetSpaceId)
        }}
      />
      <TcsRemoveResourceModal
        locale={locale}
        open={removeItem != null}
        resourceName={removeResourceName}
        onClose={() => setRemoveItem(null)}
        onConfirm={() => {
          if (!removeItem) return
          onRemoveResource?.(removeItem.id)
        }}
      />
    </>
  ) : null

  const iterationDrawer =
    iterationItem && !useExternalDrawer ? (
    <TcsResourceIterationDrawer
      open={iterationItem != null}
      locale={locale}
      item={iterationItem}
      onClose={() => setIterationItem(null)}
      onRollbackSuccess={(record) => {
        showIterationToast(
          tcsT(locale, 'resourceIterationRollbackSuccessTitle'),
          tcsT(locale, 'resourceIterationRollbackSuccessSub').replace('{version}', record.versionLabel),
        )
      }}
    />
  ) : null

  const wrapWithIterationWorkspace = (content: ReactNode) => {
    if (!iterationItem || embedInParentGrid || useExternalDrawer) return content
    return (
      <div className="scenario-workspace-build tcs-resource-iteration-workspace">
        {iterationDrawer}
        <div className="scenario-workspace-build-main tcs-resource-iteration-workspace-main">
          {content}
        </div>
      </div>
    )
  }

  const iterationToastNode = iterationToast ? (
    <div className="agents-publish-success-toast tcs-success-toast" role="status" aria-live="polite">
      <span className="agents-publish-success-toast__icon" aria-hidden="true">
        ✓
      </span>
      <div className="agents-publish-success-toast__text">
        <strong className="agents-publish-success-toast__title">{iterationToast.title}</strong>
        {iterationToast.sub ? (
          <span className="agents-publish-success-toast__sub">{iterationToast.sub}</span>
        ) : null}
      </div>
    </div>
  ) : null

  const resourceOverlays = (
    <>
      {resourceManageModals}
      {embedInParentGrid || useExternalDrawer ? iterationDrawer : null}
      {iterationToastNode}
    </>
  )

  if (isHrSpace) {
    return (
      <>
        {wrapWithIterationWorkspace(
          <TcsHrResourcesPanel
            locale={locale}
            scopeKey={scopeKey}
            resourceCount={resourceCount}
            resourceIds={resourceIds}
            spaceId={spaceId}
            showResourceFilters={showResourceFilters}
            showResourceKindTag={showResourceKindTag}
            embedInParentGrid={embedInParentGrid}
            emptyAction={emptyAction}
            {...resourceCardProps}
          />,
        )}
        {resourceOverlays}
      </>
    )
  }

  if (embedInParentGrid) {
    if (filteredResources.length === 0) return null
    return (
      <>
        <TcsResourceCardItems
          locale={locale}
          scopeKey={scopeKey}
          items={filteredResources}
          spaceId={spaceId}
          showResourceKindTag={showResourceKindTag}
          {...resourceCardProps}
        />
        {resourceOverlays}
      </>
    )
  }

  if (resources.length === 0) {
    return (
      <>
        {wrapWithIterationWorkspace(<TcsResourcesEmptyState locale={locale} emptyAction={emptyAction} />)}
        {resourceOverlays}
      </>
    )
  }

  return (
    <>
      {wrapWithIterationWorkspace(
        <div className="tcs-resources-panel">
          {showResourceFilters ? (
            <TcsResourceTypeTabs
              locale={locale}
              resources={resources}
              activeTab={filterTab}
              onChange={setFilterTab}
            />
          ) : null}
          {filteredResources.length === 0 ? (
            <div className="skills-empty tcs-project-space-empty">{tcsT(locale, 'resourcesFilterEmpty')}</div>
          ) : (
            <TcsResourceCardsGrid
              locale={locale}
              scopeKey={scopeKey}
              items={filteredResources}
              spaceId={spaceId}
              showResourceKindTag={showResourceKindTag}
              {...resourceCardProps}
            />
          )}
        </div>,
      )}
      {resourceOverlays}
    </>
  )
}
