import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react'

import { AgentFreezeModal } from '../../../components/AgentFreezeModal'
import { PublishAgentAppModal } from '../../../components/PublishAgentAppModal'
import { AgentCardsGrid, type AgentCardStatusBadge } from '../../../components/shared/AgentCardsGrid'
import { TOOL_DIRECTORY_ITEMS, type ToolDirectoryItem } from '../../../data/tools-directory'
import type { AppLocale } from '../../../i18n/homeStrings'
import { formatAgentCardMeta } from '../../../utils/formatAgentCardMeta'
import {
  getToolDirectoryBrandLabel,
  getToolDirectoryCardIconStyle,
  renderToolDirectoryCardIconContent,
} from '../../../utils/toolDirectoryCardIcon'
import { useUserContentRegistry } from '../hooks/useUserContentRegistry'
import { tcsT } from '../i18n/strings'
import type { UserContentItem, UserContentSourceModule } from '../types/userContent'
import {
  activateMineContentItem,
  deleteMineContentItem,
  freezeMineContentItem,
  publishMineContentItem,
} from '../utils/mineContentActions'
import {
  requestMineContentDuplicate,
  requestMineContentEdit,
} from '../utils/mineContentNavigation'
import {
  canActivateMineContent,
  canFreezeMineContent,
  canPublishMineContent,
} from '../utils/mineContentLifecycle'
import { MineContentDeleteModal } from './MineContentDeleteModal'
import { MineContentToolDetailDrawer } from './MineContentToolDetailDrawer'

type MineContentPanelProps = {
  locale: AppLocale
  memberId: string
  searchQuery: string
  activeProjectGroupId?: string
  canManage?: boolean
  /** 具备「发布内容」子权限时可发布 */
  canPublishContent?: boolean
}

type MineContentCardItem = {
  name: string
  desc: string
  meta: string
  tag: string
  label?: string
  creatorLabel?: string
  creatorVariant?: 'default' | 'template'
  contentKey: string
  primaryModule: UserContentSourceModule
  lifecycleStatus: UserContentItem['lifecycleStatus']
  hasUnpublishedChanges?: boolean
}

function getAgentCardTagLabel(tag: string, locale: AppLocale): string {
  if (locale === 'zh') return tag === 'Managerial Agent' ? '管理 Agent' : '单 Agent'
  return tag === 'Managerial Agent' ? 'Manager Agent' : 'Agent'
}

function getCategoryLabel(category: UserContentItem['category'], locale: AppLocale): string {
  if (locale === 'zh') {
    if (category === 'medical') return '医疗'
    if (category === 'finance') return '金融'
    if (category === 'tech') return '科技'
    if (category === 'accounting') return '会计'
    return '场景'
  }
  if (category === 'medical') return 'Medical'
  if (category === 'finance') return 'Finance'
  if (category === 'tech') return 'Tech'
  if (category === 'accounting') return 'Accounting'
  return 'Scenario'
}

function getUserContentStatusBadges(item: MineContentCardItem, locale: AppLocale): AgentCardStatusBadge[] {
  if (item.lifecycleStatus === 'frozen') {
    return [{ label: locale === 'zh' ? '已冻结' : 'Frozen', variant: 'frozen' }]
  }
  if (item.lifecycleStatus === 'published') {
    const badges: AgentCardStatusBadge[] = [
      { label: locale === 'zh' ? '已发布' : 'Published', variant: 'published' },
    ]
    if (item.hasUnpublishedChanges) {
      badges.push({ label: locale === 'zh' ? '有未发布变更' : 'Unpublished changes', variant: 'draft' })
    }
    return badges
  }
  return [{ label: locale === 'zh' ? '未发布' : 'Draft', variant: 'draft' }]
}

type MineContentTypeTab = 'all' | 'agent' | 'scenario' | 'skills' | 'tools'

function getSkillCardTagLabel(locale: AppLocale): string {
  return locale === 'zh' ? '技能' : 'Skill'
}

function getToolCardTagLabel(locale: AppLocale): string {
  return locale === 'zh' ? '工具' : 'Tool'
}

function isSkillsOnlyItem(item: UserContentItem): boolean {
  return item.scopes.includes('skills') && !item.scopes.includes('agent-library') && !item.scopes.includes('scenario-config')
}

function isToolsOnlyItem(item: UserContentItem): boolean {
  return item.scopes.includes('tools') && !item.scopes.includes('agent-library') && !item.scopes.includes('scenario-config')
}

function isAuxiliaryOnlyItem(item: UserContentItem): boolean {
  return isSkillsOnlyItem(item) || isToolsOnlyItem(item)
}

function isToolCardItem(card: MineContentCardItem, activeTab: MineContentTypeTab): boolean {
  return activeTab === 'tools' || card.primaryModule === 'tools'
}

function navigateToContentModule(module: UserContentSourceModule) {
  const path =
    module === 'scenario-config'
      ? '/scenarios'
      : module === 'skills'
        ? '/skills'
        : module === 'tools'
          ? '/tools'
          : '/agents'
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function toCardItem(item: UserContentItem, locale: AppLocale): MineContentCardItem {
  const primaryModule: UserContentSourceModule = item.scopes.includes('agent-library')
    ? 'agent-library'
    : item.scopes.includes('skills')
      ? 'skills'
      : item.scopes.includes('tools')
        ? 'tools'
        : 'scenario-config'
  return {
    name: item.contentKey,
    contentKey: item.contentKey,
    label: item.displayName,
    desc: item.desc,
    meta: formatAgentCardMeta(item.meta, locale),
    tag: item.tag,
    creatorLabel: item.creatorLabel,
    creatorVariant: item.creatorVariant,
    primaryModule,
    lifecycleStatus: item.lifecycleStatus,
    hasUnpublishedChanges: item.hasUnpublishedChanges,
  }
}

export function MineContentPanel({
  locale,
  memberId,
  searchQuery,
  activeProjectGroupId,
  canManage = true,
  canPublishContent,
}: MineContentPanelProps) {
  const canPublish = canPublishContent ?? canManage
  const [activeTab, setActiveTab] = useState<MineContentTypeTab>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserContentItem['lifecycleStatus']>('all')
  const [publishTarget, setPublishTarget] = useState<UserContentItem | null>(null)
  const [freezeTarget, setFreezeTarget] = useState<UserContentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserContentItem | null>(null)
  const [toolDetailTarget, setToolDetailTarget] = useState<ToolDirectoryItem | null>(null)
  const [noticeToast, setNoticeToast] = useState<{ title: string; sub?: string } | null>(null)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const scopeFilter: UserContentSourceModule | 'all' =
    activeTab === 'agent'
      ? 'agent-library'
      : activeTab === 'scenario'
        ? 'scenario-config'
        : activeTab === 'skills'
          ? 'skills'
          : activeTab === 'tools'
            ? 'tools'
            : 'all'

  const contentFilters = useMemo(() => ({ query: searchQuery }), [searchQuery])
  const allItems = useUserContentRegistry(memberId, contentFilters)

  const items = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return allItems.filter((item) => {
      if (scopeFilter !== 'all' && !item.scopes.includes(scopeFilter)) {
        return false
      }
      if (statusFilter !== 'all' && item.lifecycleStatus !== statusFilter) {
        return false
      }
      if (!query) return true
      return [item.displayName, item.contentKey, item.desc, item.tag, item.creatorLabel ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [allItems, scopeFilter, statusFilter, searchQuery])

  const itemByKey = useMemo(() => new Map(items.map((item) => [item.contentKey, item])), [items])

  const toolDirectoryById = useMemo(
    () => new Map(TOOL_DIRECTORY_ITEMS.map((tool) => [tool.id, tool])),
    [],
  )

  const handleCardClick = useCallback(
    (card: MineContentCardItem) => {
      if (card.primaryModule === 'tools') {
        const tool = toolDirectoryById.get(card.contentKey)
        if (tool) {
          setToolDetailTarget(tool)
          return
        }
      }
      navigateToContentModule(card.primaryModule)
    },
    [toolDirectoryById],
  )

  const cardItems = useMemo(() => items.map((item) => toCardItem(item, locale)), [items, locale])

  const agentItems = useMemo(
    () => allItems.filter((item) => item.scopes.includes('agent-library')),
    [allItems],
  )
  const scenarioItems = useMemo(
    () => allItems.filter((item) => item.scopes.includes('scenario-config')),
    [allItems],
  )
  const skillItems = useMemo(
    () => allItems.filter((item) => item.scopes.includes('skills')),
    [allItems],
  )
  const toolItems = useMemo(
    () => allItems.filter((item) => item.scopes.includes('tools')),
    [allItems],
  )

  const agentCount = agentItems.length
  const scenarioCount = scenarioItems.length
  const skillCount = skillItems.length
  const toolCount = toolItems.length
  const allCount = agentCount + scenarioCount + skillCount + toolCount

  const statusCounts = useMemo(() => {
    const countByStatus = (source: UserContentItem[]) => ({
      all: source.length,
      draft: source.filter((item) => item.lifecycleStatus === 'draft').length,
      published: source.filter((item) => item.lifecycleStatus === 'published').length,
      frozen: source.filter((item) => item.lifecycleStatus === 'frozen').length,
    })

    if (activeTab === 'agent') return countByStatus(agentItems)
    if (activeTab === 'scenario') return countByStatus(scenarioItems)
    if (activeTab === 'skills') return countByStatus(skillItems)
    if (activeTab === 'tools') return countByStatus(toolItems)

    const agentTotals = countByStatus(agentItems)
    const scenarioTotals = countByStatus(scenarioItems)
    const skillTotals = countByStatus(skillItems)
    const toolTotals = countByStatus(toolItems)
    return {
      all: agentTotals.all + scenarioTotals.all + skillTotals.all + toolTotals.all,
      draft: agentTotals.draft + scenarioTotals.draft + skillTotals.draft + toolTotals.draft,
      published: agentTotals.published + scenarioTotals.published + skillTotals.published + toolTotals.published,
      frozen: agentTotals.frozen + scenarioTotals.frozen + skillTotals.frozen + toolTotals.frozen,
    }
  }, [activeTab, agentItems, scenarioItems, skillItems, toolItems])

  const handleTypeTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    setStatusFilter('all')
  }

  const typeTabs: Array<{
    key: MineContentTypeTab
    labelKey:
      | 'projectSpaceMineTabAll'
      | 'projectSpaceMineTabAgent'
      | 'projectSpaceMineTabScenario'
      | 'projectSpaceMineTabSkills'
      | 'projectSpaceMineTabTools'
    count: number
  }> = [
    { key: 'all', labelKey: 'projectSpaceMineTabAll', count: allCount },
    { key: 'agent', labelKey: 'projectSpaceMineTabAgent', count: agentCount },
    { key: 'scenario', labelKey: 'projectSpaceMineTabScenario', count: scenarioCount },
    { key: 'skills', labelKey: 'projectSpaceMineTabSkills', count: skillCount },
    { key: 'tools', labelKey: 'projectSpaceMineTabTools', count: toolCount },
  ]

  const statusTabs: Array<{
    key: typeof statusFilter
    labelKey:
      | 'projectSpaceMineStatusAll'
      | 'projectSpaceMineStatusDraft'
      | 'projectSpaceMineStatusPublished'
      | 'projectSpaceMineStatusFrozen'
  }> = [
    { key: 'all', labelKey: 'projectSpaceMineStatusAll' },
    { key: 'draft', labelKey: 'projectSpaceMineStatusDraft' },
    { key: 'published', labelKey: 'projectSpaceMineStatusPublished' },
    { key: 'frozen', labelKey: 'projectSpaceMineStatusFrozen' },
  ]

  const showNotice = useCallback((title: string, sub?: string) => {
    setNoticeToast({ title, sub: sub?.trim() || undefined })
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => {
      noticeTimerRef.current = undefined
      setNoticeToast(null)
    }, 3200)
  }, [])

  const resolveItem = useCallback(
    (card: MineContentCardItem) => itemByKey.get(card.contentKey) ?? null,
    [itemByKey],
  )

  const handlePublishConfirm = useCallback(
    (spaceId: string) => {
      if (!publishTarget) return
      publishMineContentItem(publishTarget, spaceId, locale)
    },
    [locale, publishTarget],
  )

  const handleFreezeConfirm = useCallback(() => {
    if (!freezeTarget) return
    const result = freezeMineContentItem(freezeTarget, locale)
    showNotice(result.title, result.sub)
    setFreezeTarget(null)
  }, [freezeTarget, locale, showNotice])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    const result = deleteMineContentItem(deleteTarget, locale)
    showNotice(result.title, result.sub)
    setDeleteTarget(null)
  }, [deleteTarget, locale, showNotice])

  const renderNoticeToast = () =>
    noticeToast ? (
      <div className="agents-publish-success-toast" role="status" aria-live="polite">
        <div className="agents-publish-success-toast__inner">
          <strong className="agents-publish-success-toast__title">{noticeToast.title}</strong>
          {noticeToast.sub ? (
            <span className="agents-publish-success-toast__sub">{noticeToast.sub}</span>
          ) : null}
        </div>
      </div>
    ) : null

  return (
    <div className="tcs-mine-content-panel">
      <div className="tcs-mine-content-tab-filters">
      <div
        className="tcs-tasks-panel-tabs tcs-mine-content-type-tabs"
        role="tablist"
        aria-label={locale === 'zh' ? '筛选' : 'Filter'}
      >
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tcs-tasks-panel-tab${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => handleTypeTabChange(tab.key)}
          >
            <span className="tcs-tasks-panel-tab-label">
              {tcsT(locale, tab.labelKey)} · {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div
        className="agents-tabs tcs-mine-content-status-tabs"
        role="tablist"
        aria-label={tcsT(locale, 'projectSpaceMineStatusFilter')}
      >
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab.key}
            className={statusFilter === tab.key ? 'agents-tab is-active' : 'agents-tab'}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tcsT(locale, tab.labelKey)} <span className="agents-tab-count">{statusCounts[tab.key]}</span>
          </button>
        ))}
      </div>
      </div>

      {cardItems.length === 0 ? (
        <div className="skills-empty tcs-project-space-empty">{tcsT(locale, 'projectSpaceMineEmpty')}</div>
      ) : (
        <AgentCardsGrid
          title={tcsT(locale, 'projectSpaceMineTitle')}
          subtitle={tcsT(locale, 'projectSpaceMineHint')}
          primaryActionLabel=""
          showPrimaryAction={false}
          showHeader={false}
          showTabs={false}
          showToolbar={false}
          tabs={[]}
          activeTab={activeTab}
          onTabChange={() => {}}
          items={cardItems}
          getItemIconContent={(card) => {
            if (!isToolCardItem(card, activeTab)) return undefined
            const tool = toolDirectoryById.get(card.contentKey)
            if (!tool) return undefined
            return renderToolDirectoryCardIconContent(tool)
          }}
          getItemIconStyle={(card, palette) => {
            if (!isToolCardItem(card, activeTab)) {
              return {
                '--agent-icon-from': palette.from,
                '--agent-icon-via': palette.via,
                '--agent-icon-to': palette.to,
                '--agent-icon-shadow': palette.shadow,
              } as CSSProperties
            }

            const tool = toolDirectoryById.get(card.contentKey)
            if (!tool) {
              return {
                '--agent-icon-from': palette.from,
                '--agent-icon-via': palette.via,
                '--agent-icon-to': palette.to,
                '--agent-icon-shadow': palette.shadow,
              } as CSSProperties
            }

            if (getToolDirectoryBrandLabel(tool)) {
              return {} as CSSProperties
            }

            return getToolDirectoryCardIconStyle(tool.iconTone)
          }}
          tagLabel={(item) =>
            activeTab === 'skills' || item.primaryModule === 'skills'
              ? getSkillCardTagLabel(locale)
              : activeTab === 'tools' || item.primaryModule === 'tools'
                ? getToolCardTagLabel(locale)
                : activeTab === 'scenario' || item.primaryModule === 'scenario-config'
                  ? getCategoryLabel(
                      items.find((entry) => entry.contentKey === item.contentKey)?.category,
                      locale,
                    )
                  : getAgentCardTagLabel(item.tag, locale)
          }
          getCardStatusBadges={(item) => getUserContentStatusBadges(item, locale)}
          onCardClick={handleCardClick}
          isCardClickable={() => true}
          showCardMenu={canManage}
          onEditItem={canManage ? (card) => {
            const item = resolveItem(card)
            if (!item || item.lifecycleStatus === 'frozen') return
            requestMineContentEdit(item.contentKey, card.primaryModule)
          } : undefined}
          onDuplicateItem={canManage ? (card) => {
            const item = resolveItem(card)
            if (!item) return
            requestMineContentDuplicate(item.contentKey, card.primaryModule)
          } : undefined}
          onPublishItem={canPublish ? (card) => {
            const item = resolveItem(card)
            if (!item || !canPublishMineContent(item) || isAuxiliaryOnlyItem(item)) return
            setPublishTarget(item)
          } : undefined}
          isPublishItemDisabled={(card) => {
            const item = resolveItem(card)
            if (!item) return true
            if (isAuxiliaryOnlyItem(item)) return true
            return !canPublishMineContent(item)
          }}
          onFreezeItem={canManage ? (card) => {
            const item = resolveItem(card)
            if (!item || !canFreezeMineContent(item) || isAuxiliaryOnlyItem(item)) return
            setFreezeTarget(item)
          } : undefined}
          isItemFrozen={(card) => {
            const item = resolveItem(card)
            return item != null && canActivateMineContent(item)
          }}
          onActivateItem={canManage ? (card) => {
            const item = resolveItem(card)
            if (!item || !canActivateMineContent(item)) return
            const result = activateMineContentItem(item, locale)
            showNotice(result.title, result.sub)
          } : undefined}
          onDeleteItem={canManage ? (card) => {
            const item = resolveItem(card)
            if (!item) return
            setDeleteTarget(item)
          } : undefined}
          skipNativeDeleteConfirm
          allowDeleteWhenFrozen
          embedInParentGrid={false}
        />
      )}

      <PublishAgentAppModal
        open={publishTarget != null}
        locale={locale}
        preferredCreateGroupId={activeProjectGroupId}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublishConfirm}
      />
      <AgentFreezeModal
        open={freezeTarget != null}
        locale={locale}
        agentName={freezeTarget?.displayName ?? freezeTarget?.contentKey ?? ''}
        onClose={() => setFreezeTarget(null)}
        onConfirm={handleFreezeConfirm}
      />
      <MineContentDeleteModal
        open={deleteTarget != null}
        locale={locale}
        displayName={deleteTarget?.displayName ?? deleteTarget?.contentKey ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <MineContentToolDetailDrawer
        open={toolDetailTarget != null}
        locale={locale}
        tool={toolDetailTarget}
        onClose={() => setToolDetailTarget(null)}
      />
      {renderNoticeToast()}
    </div>
  )
}
