import { useEffect, useState, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeProjectGroupName, tcsT } from '../i18n/strings'
import type { ProjectGroup, ProjectSpaceNavTab } from '../types'
import { filterGroupsForTaskApproval } from '../utils/projectGroups'

type ProjectSpaceSidebarProps = {
  locale: AppLocale
  groups: ProjectGroup[]
  activeGroupId: string
  activeNavTab: ProjectSpaceNavTab
  projectSpaceViewMode?: 'mine' | 'group'
  groupCounts: Record<string, number>
  pendingTaskCount?: number
  tasksGroupPendingCounts?: Record<string, number>
  tasksGroupFilterId?: string | null
  /** Admin 可见：项目空间模块级角色管理 */
  showRolesNav?: boolean
  /** Admin / Manager 可见：迭代记录 */
  showChangelogNav?: boolean
  /** 具备「审批待办」权限时显示待办审批导航 */
  showTasksNav?: boolean
  /** 具备「项目管理」权限时显示我的项目导航 */
  showMineNav?: boolean
  onNavTabChange: (tab: ProjectSpaceNavTab) => void
  onGroupSelect: (groupId: string) => void
  onTasksGroupFilter?: (groupId: string) => void
  onEditGroup?: (group: ProjectGroup) => void
  onDeleteGroup?: (group: ProjectGroup) => void
  onCreateGroup?: () => void
  getGroupCapabilities?: (group: ProjectGroup) => {
    canEdit: boolean
    canDelete: boolean
    editMenuLabelKey?: 'cardMenuEdit' | 'projectSpaceGroupMenuAccess'
  }
}

function SidebarNavIcon({ kind }: { kind: ProjectSpaceNavTab }) {
  if (kind === 'changelog') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path
          d="M7 4h10a2 2 0 0 1 2 2v14l-4-3-4 3-4-3-4 3V6a2 2 0 0 1 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 9h6M9 13h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (kind === 'roles') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path
          d="M12 3l7 4v5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V7l7-4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12.2 11 13.7 14.8 9.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (kind === 'tasks') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 12l2.5 2.5L16 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 20v-1.2A4.8 4.8 0 0 1 10.8 14h2.4A4.8 4.8 0 0 1 18 18.8V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

type ProjectSpaceGroupRowProps = {
  locale: AppLocale
  group: ProjectGroup
  count: number
  countVariant?: 'default' | 'pending'
  isActive: boolean
  onSelect: () => void
  onEdit?: (group: ProjectGroup) => void
  onDelete?: (group: ProjectGroup) => void
  canEdit?: boolean
  canDelete?: boolean
  editMenuLabelKey?: 'cardMenuEdit' | 'projectSpaceGroupMenuAccess'
}

function ProjectSpaceGroupRow({
  locale,
  group,
  count,
  countVariant = 'default',
  isActive,
  onSelect,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  editMenuLabelKey = 'cardMenuEdit',
}: ProjectSpaceGroupRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const groupName = localizeProjectGroupName(group, locale)

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const showActionsMenu = (canEdit && onEdit) || (canDelete && onDelete)

  return (
    <li
      className={`tcs-project-sidebar-group-row${isActive ? ' is-active' : ''}${menuOpen ? ' tcs-project-sidebar-group-row--menu-open' : ''}`}
    >
      <button
        type="button"
        className={`tcs-project-sidebar-group-item${isActive ? ' is-active' : ''}`}
        onClick={onSelect}
      >
        <span className="tcs-project-sidebar-group-dot" aria-hidden="true" />
        <span className="tcs-project-sidebar-group-name">{groupName}</span>
        {countVariant === 'pending' && count > 0 ? (
          <span
            className="tcs-project-sidebar-group-pending-badge"
            aria-label={tcsT(locale, 'projectSpaceTasksBadgeAria').replace('{count}', String(count))}
          >
            {count}
          </span>
        ) : countVariant === 'default' ? (
          <span className="tcs-project-sidebar-group-count">{count}</span>
        ) : null}
      </button>
      {showActionsMenu ? (
      <div
        className="agent-card-more-wrap kb-list-card-more-wrap tcs-project-sidebar-group-more-wrap"
        onClick={stopMenuEvent}
        onMouseDown={stopMenuEvent}
      >
        <button
          type="button"
          className="agent-card-more tcs-project-sidebar-group-more"
          aria-label={tcsT(locale, 'projectSpaceGroupMenuAria').replace('{name}', groupName)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => {
            stopMenuEvent(event)
            setMenuOpen((open) => !open)
          }}
        >
          <span className="tcs-project-sidebar-group-more-icon" aria-hidden="true">
            ⋯
          </span>
        </button>
        <div
          className={
            menuOpen ? 'agent-card-menu kb-list-card-menu is-open' : 'agent-card-menu kb-list-card-menu'
          }
          role="menu"
          aria-label={tcsT(locale, 'projectSpaceGroupMenuAria').replace('{name}', groupName)}
          onMouseDown={stopMenuEvent}
        >
          {canEdit && onEdit ? (
          <button
            type="button"
            className="agent-card-menu-item"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              setMenuOpen(false)
              onEdit(group)
            }}
          >
            {tcsT(locale, editMenuLabelKey)}
          </button>
          ) : null}
          {canDelete && onDelete ? (
          <button
            type="button"
            className="agent-card-menu-item is-danger"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              setMenuOpen(false)
              onDelete(group)
            }}
          >
            {tcsT(locale, 'cardMenuDelete')}
          </button>
          ) : null}
        </div>
      </div>
      ) : null}
    </li>
  )
}

export function ProjectSpaceSidebar({
  locale,
  groups,
  activeGroupId,
  activeNavTab,
  groupCounts,
  pendingTaskCount = 0,
  tasksGroupPendingCounts,
  tasksGroupFilterId = null,
  onNavTabChange,
  onGroupSelect,
  onTasksGroupFilter,
  onEditGroup,
  onDeleteGroup,
  onCreateGroup,
  getGroupCapabilities,
  projectSpaceViewMode = 'group',
  showRolesNav = false,
  showChangelogNav = false,
  showTasksNav = true,
  showMineNav = true,
}: ProjectSpaceSidebarProps) {
  const navItems: Array<{
    id: ProjectSpaceNavTab
    labelKey:
      | 'projectSpaceNavMine'
      | 'projectSpaceNavTasks'
      | 'projectSpaceNavRoles'
      | 'projectSpaceNavChangelog'
  }> = [
    ...(showMineNav ? [{ id: 'mine' as const, labelKey: 'projectSpaceNavMine' as const }] : []),
    ...(showTasksNav ? [{ id: 'tasks' as const, labelKey: 'projectSpaceNavTasks' as const }] : []),
    ...(showRolesNav ? [{ id: 'roles' as const, labelKey: 'projectSpaceNavRoles' as const }] : []),
    ...(showChangelogNav ? [{ id: 'changelog' as const, labelKey: 'projectSpaceNavChangelog' as const }] : []),
  ]

  const isTasksTab = activeNavTab === 'tasks'
  const isRolesTab = activeNavTab === 'roles'
  const isChangelogTab = activeNavTab === 'changelog'
  const sidebarGroups = isTasksTab ? filterGroupsForTaskApproval(groups) : groups
  const showProjectGroups = !isRolesTab && !isChangelogTab && (isTasksTab || showMineNav)

  return (
    <aside className="tcs-project-sidebar" aria-label={tcsT(locale, 'projectSpaceSidebarAria')}>
      <nav className="tcs-project-sidebar-nav" aria-label={tcsT(locale, 'projectSpaceNavAria')}>
        {navItems.map((item) => {
          const isNavActive =
            activeNavTab === item.id &&
            (item.id === 'tasks' || item.id === 'roles' || item.id === 'changelog' || projectSpaceViewMode === 'mine')
          return (
          <button
            key={item.id}
            type="button"
            className={`tcs-project-sidebar-nav-item${isNavActive ? ' is-active' : ''}`}
            onClick={() => onNavTabChange(item.id)}
          >
            <SidebarNavIcon kind={item.id} />
            <span className="tcs-project-sidebar-nav-label">{tcsT(locale, item.labelKey)}</span>
            {item.id === 'tasks' && pendingTaskCount > 0 ? (
              <span className="tcs-project-sidebar-nav-badge" aria-label={tcsT(locale, 'projectSpaceTasksBadgeAria').replace('{count}', String(pendingTaskCount))}>
                {pendingTaskCount}
              </span>
            ) : null}
          </button>
          )
        })}
      </nav>

      {!isRolesTab && showProjectGroups ? (
      <div className={`tcs-project-sidebar-groups${isTasksTab ? ' tcs-project-sidebar-groups--tasks-filter' : ''}`}>
        <div className="tcs-project-sidebar-groups-head">
          <span className="tcs-project-sidebar-groups-title">
            {isTasksTab ? tcsT(locale, 'projectSpaceTasksFilterTitle') : tcsT(locale, 'projectSpaceGroupsTitle')}
          </span>
          {!isTasksTab && onCreateGroup ? (
          <div className="tcs-project-sidebar-groups-actions">
            <button
              type="button"
              className="tcs-project-sidebar-groups-action"
              aria-label={tcsT(locale, 'projectSpaceCreateGroupAria')}
              onClick={onCreateGroup}
            >
              +
            </button>
          </div>
          ) : null}
        </div>
        <ul className="tcs-project-sidebar-group-list" role="list">
          {sidebarGroups.map((group) => {
            const count = isTasksTab
              ? (tasksGroupPendingCounts?.[group.id] ?? 0)
              : (groupCounts[group.id] ?? 0)
            const countVariant = isTasksTab ? 'pending' : 'default'
            const isActive = isTasksTab
              ? tasksGroupFilterId === group.id
              : projectSpaceViewMode === 'group' && activeGroupId === group.id
            const capabilities = getGroupCapabilities?.(group) ?? {
              canEdit: true,
              canDelete: true,
              editMenuLabelKey: 'cardMenuEdit' as const,
            }
            return (
              <ProjectSpaceGroupRow
                key={group.id}
                locale={locale}
                group={group}
                count={count}
                countVariant={countVariant}
                isActive={isActive}
                onSelect={() => {
                  if (isTasksTab) {
                    onTasksGroupFilter?.(group.id)
                    return
                  }
                  onGroupSelect(group.id)
                }}
                onEdit={isTasksTab ? undefined : onEditGroup}
                onDelete={isTasksTab ? undefined : onDeleteGroup}
                canEdit={isTasksTab ? false : capabilities.canEdit}
                canDelete={isTasksTab ? false : capabilities.canDelete}
                editMenuLabelKey={capabilities.editMenuLabelKey}
              />
            )
          })}
        </ul>
      </div>
      ) : null}
    </aside>
  )
}
