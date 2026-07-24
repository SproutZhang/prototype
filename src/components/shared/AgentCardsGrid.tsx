import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { useLocale } from '../../i18n/LocaleContext'
import { scenarioT } from '../../i18n/scenarioStrings'
import { formatAgentCardMeta } from '../../utils/formatAgentCardMeta'

type CardItem = {
  name: string
  desc: string
  meta: string
  tag: string
  /** 卡片展示标题，未设置时使用 name */
  label?: string
  creatorLabel?: string
  creatorVariant?: 'default' | 'template'
}

export type AgentCardStatusBadge = {
  label: string
  variant?: 'draft' | 'frozen' | 'published'
}

interface AgentCardsGridProps<T extends CardItem> {
  title: string
  primaryActionLabel: string
  onPrimaryActionClick?: () => void
  showPrimaryAction?: boolean
  /** 为 false 时不渲染顶栏（标题 / tagline / 主按钮） */
  showHeader?: boolean
  /** 为 false 时不渲染分类 Tab */
  showTabs?: boolean
  /** 为 false 时不渲染搜索工具栏 */
  showToolbar?: boolean
  /** 自定义副标题；未传时使用 AgentsPageSectionTagline */
  subtitle?: ReactNode
  tabs: { key: string; label: string; count: number }[]
  activeTab: string
  onTabChange: (key: string) => void
  items: T[]
  tagLabel: (item: T) => string
  /** 为 false 时不展示卡片右下角类型标签 */
  showItemTag?: boolean
  getCardBadge?: (item: T) => string | null | undefined
  getCardStatusBadges?: (item: T) => AgentCardStatusBadge[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onCardClick?: (item: T) => void
  isCardClickable?: (item: T) => boolean
  getCardAriaLabel?: (item: T) => string | undefined
  getItemIconStyle?: (item: T, palette: (typeof ICON_PALETTES)[number]) => CSSProperties
  getItemIconContent?: (item: T) => ReactNode
  showCardMenu?: boolean
  onEditItem?: (item: T) => void
  onDuplicateItem?: (item: T) => void
  onPublishItem?: (item: T) => void
  isPublishItemDisabled?: (item: T) => boolean
  onDeleteItem?: (item: T) => void
  /** 为 true 时不使用 window.confirm，由外层弹窗二次确认 */
  skipNativeDeleteConfirm?: boolean
  /** 为 true 时冻结状态下仍可删除（由外层弹窗确认） */
  allowDeleteWhenFrozen?: boolean
  isItemFrozen?: (item: T) => boolean
  onActivateItem?: (item: T) => void
  onFreezeItem?: (item: T) => void
  onOpenSingleAgent?: (item: T) => void
  onOpenManagerialAgent?: (item: T) => void
  viewMode?: 'grid' | 'list'
  showViewToggle?: boolean
  onViewModeChange?: (mode: 'grid' | 'list') => void
  /** 仅渲染卡片项，供外层统一 grid 容器包裹 */
  embedInParentGrid?: boolean
}

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
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 37 + seed.charCodeAt(i)) >>> 0
  return ICON_PALETTES[h % ICON_PALETTES.length]
}

/** 与「场景配置」列表顶栏一致，供分析等同级版块复用 */
export function AgentsPageSectionTagline() {
  const { locale } = useLocale()

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={locale === 'zh' ? '场景·Agent·流程·动作' : 'Scenario · Agent · Flow · Actions'}
    >
      <span className="agents-subtitle-part">{locale === 'zh' ? '场景' : 'Scenario'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">Agent</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '流程' : 'Flow'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '动作' : 'Actions'}</span>
    </div>
  )
}

export function AgentCardsGrid<T extends CardItem>({
  title,
  primaryActionLabel,
  onPrimaryActionClick,
  showPrimaryAction = true,
  showHeader = true,
  showTabs = true,
  showToolbar = true,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  items,
  tagLabel,
  showItemTag = true,
  getCardBadge,
  getCardStatusBadges,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onCardClick,
  isCardClickable,
  getCardAriaLabel,
  getItemIconStyle,
  getItemIconContent,
  showCardMenu = true,
  onEditItem,
  onDuplicateItem,
  onPublishItem,
  isPublishItemDisabled,
  onDeleteItem,
  skipNativeDeleteConfirm = false,
  allowDeleteWhenFrozen = false,
  isItemFrozen,
  onActivateItem,
  onFreezeItem,
  onOpenSingleAgent,
  onOpenManagerialAgent,
  viewMode = 'grid',
  showViewToggle = false,
  onViewModeChange,
  embedInParentGrid = false,
}: AgentCardsGridProps<T>) {
  const { locale } = useLocale()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const defaultSearchPlaceholder =
    locale === 'zh' ? '搜索名称或描述…' : 'Search names or descriptions…'
  const filterLabel = locale === 'zh' ? '筛选' : 'Filter'
  const listLabel = locale === 'zh' ? '列表' : 'List'
  const moreActionsLabel = locale === 'zh' ? '更多操作' : 'More actions'
  const menuLabel = locale === 'zh' ? '操作菜单' : 'Actions menu'
  const editLabel = locale === 'zh' ? '编辑' : 'Edit'
  const duplicateLabel = locale === 'zh' ? '复制' : 'Duplicate'
  const publishLabel = locale === 'zh' ? '发布' : 'Publish'
  const deleteLabel = locale === 'zh' ? '删除' : 'Delete'
  const activateLabel = locale === 'zh' ? '激活' : 'Activate'
  const freezeLabel = locale === 'zh' ? '冻结' : 'Freeze'
  const viewToggleLabel = locale === 'zh' ? '切换列表展示方式' : 'Switch list view'
  const listViewLabel = locale === 'zh' ? '列表视图' : 'List view'
  const cardsViewLabel = locale === 'zh' ? '卡片视图' : 'Card view'
  const deleteConfirmText =
    locale === 'zh' ? '确认删除该卡片吗？此操作不可撤销。' : 'Delete this card? This action cannot be undone.'
  const publishDisabledTitle =
    locale === 'zh' ? '已发布，修改配置后可再次发布' : 'Published — edit configuration to publish again'

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.agent-card-more-wrap')) return
      setOpenMenu(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const cardNodes = items.map((a) => {
    const palette = pickIconPalette(a.name)
    const isSingle = a.tag === 'Single Agent'
    const isManagerial = a.tag === 'Managerial Agent'
    const useNavClick = !onCardClick && (isSingle || isManagerial)
    const cardClickable = isCardClickable ? isCardClickable(a) : Boolean(onCardClick || useNavClick)
    const cardAriaLabel = getCardAriaLabel
      ? getCardAriaLabel(a)
      : onCardClick
        ? locale === 'zh'
          ? `查看卡片：${a.name}`
          : `Open card: ${a.name}`
        : undefined
    const iconStyle =
      getItemIconStyle?.(a, palette) ??
      ({
        '--agent-icon-from': palette.from,
        '--agent-icon-via': palette.via,
        '--agent-icon-to': palette.to,
        '--agent-icon-shadow': palette.shadow,
      } as CSSProperties)
    const cardBadge = getCardBadge?.(a) ?? null
    const cardStatusBadges =
      getCardStatusBadges?.(a) ?? (cardBadge ? [{ label: cardBadge, variant: 'draft' as const }] : [])
    const itemFrozen = isItemFrozen?.(a) ?? false
    const publishDisabled = isPublishItemDisabled?.(a) ?? false
    const iconContent = getItemIconContent?.(a)

    return (
      <article
        key={a.name}
        className={
          cardClickable
            ? viewMode === 'list'
              ? 'agent-card agent-card--list agent-card--clickable is-clickable'
              : 'agent-card agent-card--clickable is-clickable'
            : viewMode === 'list'
              ? 'agent-card agent-card--list'
              : 'agent-card'
        }
        aria-label={cardAriaLabel}
        role={cardClickable ? 'button' : undefined}
        tabIndex={cardClickable ? 0 : undefined}
        onClick={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('.agent-card-more-wrap')) return
          if (!cardClickable) return
          if (onCardClick) {
            onCardClick(a)
            return
          }
          if (isSingle) onOpenSingleAgent?.(a)
          if (isManagerial) onOpenManagerialAgent?.(a)
        }}
        onKeyDown={(event) => {
          if (!cardClickable) return
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          if (onCardClick) {
            onCardClick(a)
            return
          }
          if (isSingle) onOpenSingleAgent?.(a)
          if (isManagerial) onOpenManagerialAgent?.(a)
        }}
      >
        {showCardMenu ? (
          <div className="agent-card-more-wrap">
            <button
              className="agent-card-more"
              type="button"
              aria-label={moreActionsLabel}
              aria-haspopup="menu"
              aria-expanded={openMenu === a.name}
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenu((v) => (v === a.name ? null : a.name))
              }}
            >
              ⋮
            </button>
            <div
              className={openMenu === a.name ? 'agent-card-menu is-open' : 'agent-card-menu'}
              role="menu"
              aria-label={menuLabel}
              onClick={(e) => e.stopPropagation()}
            >
              {itemFrozen && onActivateItem ? (
                <button
                  className="agent-card-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onActivateItem(a)
                    setOpenMenu(null)
                  }}
                >
                  <span className="agent-card-menu-icon" aria-hidden="true">
                    ▶
                  </span>
                  {activateLabel}
                </button>
              ) : null}
              {onEditItem ? (
                <button
                  className="agent-card-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEditItem(a)
                    setOpenMenu(null)
                  }}
                >
                  <span className="agent-card-menu-icon" aria-hidden="true">
                    ✎
                  </span>
                  {editLabel}
                </button>
              ) : null}
              {onDuplicateItem ? (
                <button
                  className="agent-card-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDuplicateItem(a)
                    setOpenMenu(null)
                  }}
                >
                  <span className="agent-card-menu-icon" aria-hidden="true">
                    ⧉
                  </span>
                  {duplicateLabel}
                </button>
              ) : null}
              {onFreezeItem && !onPublishItem ? (
                <button
                  className={
                    itemFrozen ? 'agent-card-menu-item is-disabled' : 'agent-card-menu-item'
                  }
                  type="button"
                  role="menuitem"
                  disabled={itemFrozen}
                  title={itemFrozen ? scenarioT(locale, 'scenarioFrozenMustActivate') : undefined}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (itemFrozen) return
                    onFreezeItem(a)
                    setOpenMenu(null)
                  }}
                >
                  <span className="agent-card-menu-icon" aria-hidden="true">
                    ⏸
                  </span>
                  {freezeLabel}
                </button>
              ) : null}
              {onPublishItem && !itemFrozen ? (
                publishDisabled && onFreezeItem ? (
                  <button
                    className="agent-card-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={(event) => {
                      event.stopPropagation()
                      onFreezeItem(a)
                      setOpenMenu(null)
                    }}
                  >
                    <span className="agent-card-menu-icon" aria-hidden="true">
                      ⏸
                    </span>
                    {freezeLabel}
                  </button>
                ) : !publishDisabled ? (
                  <button
                    className="agent-card-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPublishItem(a)
                      setOpenMenu(null)
                    }}
                  >
                    <span className="agent-card-menu-icon" aria-hidden="true">
                      ↗
                    </span>
                    {publishLabel}
                  </button>
                ) : (
                  <button
                    className="agent-card-menu-item is-disabled"
                    type="button"
                    role="menuitem"
                    disabled
                    title={publishDisabledTitle}
                  >
                    <span className="agent-card-menu-icon" aria-hidden="true">
                      ↗
                    </span>
                    {publishLabel}
                  </button>
                )
              ) : null}
              {onDeleteItem ? (
                <button
                  className={
                    itemFrozen && !allowDeleteWhenFrozen
                      ? 'agent-card-menu-item is-danger is-disabled'
                      : 'agent-card-menu-item is-danger'
                  }
                  type="button"
                  role="menuitem"
                  disabled={itemFrozen && !allowDeleteWhenFrozen}
                  title={
                    itemFrozen && !allowDeleteWhenFrozen
                      ? scenarioT(locale, 'scenarioFrozenMustActivate')
                      : undefined
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    if (itemFrozen && !allowDeleteWhenFrozen) return
                    if (!skipNativeDeleteConfirm) {
                      const ok = window.confirm(deleteConfirmText)
                      if (!ok) return
                    }
                    onDeleteItem(a)
                    setOpenMenu(null)
                  }}
                >
                  <span className="agent-card-menu-icon" aria-hidden="true">
                    🗑
                  </span>
                  {deleteLabel}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className={
            iconContent
              ? 'agent-card-icon agent-card-icon-grad has-custom-content'
              : 'agent-card-icon agent-card-icon-grad'
          }
          style={iconStyle}
          aria-hidden="true"
        >
          {iconContent}
        </div>
        <div className="agent-card-name-row">
          <div className="agent-card-name">{a.label ?? a.name}</div>
          {cardStatusBadges.map((badge) => (
            <span
              key={`${badge.variant ?? 'draft'}-${badge.label}`}
              className={`agent-card-status-badge agent-card-status-badge--${badge.variant ?? 'draft'}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
        <div className="agent-card-desc">{a.desc}</div>
        {a.creatorLabel ? (
          <p
            className={
              a.creatorVariant === 'template'
                ? 'agent-card-creator agent-card-creator--template'
                : 'agent-card-creator'
            }
          >
            {a.creatorLabel}
          </p>
        ) : null}
        <div className="agent-card-footer">
          <p className="agent-card-meta">{formatAgentCardMeta(a.meta, locale)}</p>
          {showItemTag ? <div className="agent-card-tag">{tagLabel(a)}</div> : null}
        </div>
      </article>
    )
  })

  const grid = (
    <div
      className={
        viewMode === 'list'
          ? 'agents-grid agents-grid--list agent-cards-grid'
          : 'agents-grid agent-cards-grid'
      }
      aria-label={listLabel}
      ref={gridRef}
    >
      {cardNodes}
    </div>
  )

  if (embedInParentGrid) {
    return <>{cardNodes}</>
  }

  return (
    <>
      {showHeader ? (
        <header className="agents-header">
          <div className="agents-header-lead">
            <div className="agents-title">{title}</div>
            {subtitle ?? <AgentsPageSectionTagline />}
          </div>
          {showPrimaryAction ? (
            <div className="agents-header-actions">
              <button className="agents-btn agents-btn-primary" type="button" onClick={onPrimaryActionClick}>
                {primaryActionLabel}
              </button>
            </div>
          ) : null}
        </header>
      ) : null}

      {showTabs ? (
        <div className="agents-tabs" role="tablist" aria-label={filterLabel}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={t.key === activeTab ? 'agents-tab is-active' : 'agents-tab'}
              type="button"
              role="tab"
              aria-selected={t.key === activeTab}
              onClick={() => onTabChange(t.key)}
            >
              {t.label} <span className="agents-tab-count">{t.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {showToolbar ? (
        <div
          className={
            showViewToggle && onViewModeChange
              ? 'agents-toolbar agents-toolbar--with-view-toggle'
              : 'agents-toolbar'
          }
        >
          <label className="agents-search">
            <span className="agents-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              className="agents-search-input"
              placeholder={searchPlaceholder ?? defaultSearchPlaceholder}
              aria-label={searchPlaceholder ?? defaultSearchPlaceholder}
              value={searchValue ?? ''}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </label>
          {showViewToggle && onViewModeChange ? (
            <div className="agents-toolbar-actions">
              <div className="tools-directory-view-toggle" role="tablist" aria-label={viewToggleLabel}>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  onClick={() => onViewModeChange('list')}
                  title={listViewLabel}
                >
                  ☰
                </button>
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
                  role="tab"
                  aria-selected={viewMode === 'grid'}
                  onClick={() => onViewModeChange('grid')}
                  title={cardsViewLabel}
                >
                  ⊞
                </button>
              </div>
            </div>
          ) : (
            <div className="agents-toolbar-right">
              <div className="agents-view-actions" />
            </div>
          )}
        </div>
      ) : null}

      {grid}
    </>
  )
}
