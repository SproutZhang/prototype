import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT } from '../i18n/scenarioStrings'
import {
  addCustomPublishSpace,
  DEFAULT_PUBLISH_PROJECT_GROUP_ID,
} from '../data/scenarioPublishSpaces'
import { TCS_ORG_MEMBERS_SEED } from '../modules/team-collaboration-space/data/orgMembersSeed'
import { TEAM_COLLABORATION_SPACES_SEED } from '../modules/team-collaboration-space/data/spacesSeed'
import { TeamCollaborationSpaceFormModal } from '../modules/team-collaboration-space/components/TeamCollaborationSpaceFormModal'
import { subscribeProjectGroups } from '../modules/team-collaboration-space/utils/projectGroupsSync'
import { subscribeProjectSpaceItems } from '../modules/team-collaboration-space/utils/projectSpaceItemsSync'
import {
  getPublishTargetGroups,
  resolvePublishTargetLabel,
} from '../modules/team-collaboration-space/utils/publishProjectGroupTargets'
import { subscribePublishSpaceSync } from '../modules/team-collaboration-space/utils/publishSpaceSync'
import '../modules/access-control/access-control.css'
import '../modules/team-collaboration-space/team-collaboration-space.css'

type PublishSpaceSelectFieldProps = {
  locale: AppLocale
  selectId: string
  value: string
  onChange: (value: string) => void
  className?: string
  ariaLabel?: string
  /** 嵌套「创建空间」弹窗打开/关闭时通知外层，便于保持发布弹窗不中断 */
  onNestedModalOpenChange?: (open: boolean) => void
  /** 项目空间侧栏当前分组（保留供外层扩展，创建新空间时不用于归属） */
  preferredCreateGroupId?: string
}

type MenuLayout = {
  top: number
  left: number
  width: number
}

function layoutPublishSpaceMenu(trigger: HTMLElement, menu: HTMLElement | null): MenuLayout {
  const rect = trigger.getBoundingClientRect()
  const gap = 4
  const pad = 8
  const width = rect.width
  const left = rect.left
  const menuHeight = menu?.offsetHeight ?? 280
  let top = rect.bottom + gap

  if (top + menuHeight > window.innerHeight - pad) {
    top = Math.max(pad, rect.top - menuHeight - gap)
  }

  return { top, left, width }
}

function layoutPublishSpaceSubmenu(
  row: HTMLElement,
  submenu: HTMLElement | null,
): { top: number; left: number; minWidth: number } {
  const rect = row.getBoundingClientRect()
  const gap = 4
  const pad = 8
  const minWidth = 220
  const submenuWidth = submenu?.offsetWidth ?? minWidth
  let left = rect.right + gap
  let top = rect.top

  if (left + submenuWidth > window.innerWidth - pad) {
    left = Math.max(pad, rect.left - submenuWidth - gap)
  }

  const submenuHeight = submenu?.offsetHeight ?? 240
  if (top + submenuHeight > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - pad - submenuHeight)
  }

  return { top, left, minWidth }
}

export function PublishSpaceSelectField({
  locale,
  selectId,
  value,
  onChange,
  className = 'agents-publish-app-modal__select',
  ariaLabel,
  onNestedModalOpenChange,
  preferredCreateGroupId,
}: PublishSpaceSelectFieldProps) {
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [menuLayout, setMenuLayout] = useState<MenuLayout>({ top: 0, left: 0, width: 0 })
  const [submenuLayout, setSubmenuLayout] = useState<{
    top: number
    left: number
    minWidth: number
  } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)
  const groupRowRefs = useRef(new Map<string, HTMLButtonElement>())
  const hoverClearTimerRef = useRef<number | null>(null)

  useEffect(() => {
    onNestedModalOpenChange?.(createSpaceOpen)
  }, [createSpaceOpen, onNestedModalOpenChange])

  useEffect(() => {
    const bumpRevision = () => setCatalogRevision((revision) => revision + 1)
    const unsubGroups = subscribeProjectGroups(bumpRevision)
    const unsubItems = subscribeProjectSpaceItems(bumpRevision)
    const unsubPublish = subscribePublishSpaceSync(bumpRevision)
    return () => {
      unsubGroups()
      unsubItems()
      unsubPublish()
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      if (submenuRef.current?.contains(target)) return
      setMenuOpen(false)
      setHoveredGroupId(null)
      setExpandedGroupId(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  const cancelHoverClear = () => {
    if (hoverClearTimerRef.current != null) {
      window.clearTimeout(hoverClearTimerRef.current)
      hoverClearTimerRef.current = null
    }
  }

  const scheduleHoverClear = () => {
    cancelHoverClear()
    hoverClearTimerRef.current = window.setTimeout(() => {
      setHoveredGroupId(null)
      hoverClearTimerRef.current = null
    }, 120)
  }

  const activeSubmenuGroupId = hoveredGroupId ?? expandedGroupId

  const updateMenuLayout = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    setMenuLayout(layoutPublishSpaceMenu(trigger, menuRef.current))
  }

  useLayoutEffect(() => {
    if (!menuOpen) return
    updateMenuLayout()
    const frameId = requestAnimationFrame(updateMenuLayout)
    return () => cancelAnimationFrame(frameId)
  }, [menuOpen, catalogRevision, locale])

  useEffect(() => {
    if (!menuOpen) return
    const onViewportChange = () => updateMenuLayout()
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [menuOpen, catalogRevision, locale])

  const copySourceOptions = useMemo(
    () => TEAM_COLLABORATION_SPACES_SEED.filter((space) => space.kind === 'team'),
    [],
  )

  const effectiveValue = value || DEFAULT_PUBLISH_PROJECT_GROUP_ID

  const targetGroups = useMemo(
    () => getPublishTargetGroups(locale),
    [locale, catalogRevision],
  )

  const selectedLabel = useMemo(
    () => resolvePublishTargetLabel(effectiveValue, locale),
    [effectiveValue, locale, catalogRevision],
  )

  const selectTarget = (targetId: string) => {
    onChange(targetId)
    setMenuOpen(false)
    setHoveredGroupId(null)
    setExpandedGroupId(null)
  }

  const handleCreateSpace = () => {
    setMenuOpen(false)
    setHoveredGroupId(null)
    setExpandedGroupId(null)
    setCreateSpaceOpen(true)
  }

  const activeSubmenuGroup = activeSubmenuGroupId
    ? targetGroups.find((group) => group.id === activeSubmenuGroupId)
    : null

  const updateSubmenuLayout = () => {
    if (!activeSubmenuGroupId) {
      setSubmenuLayout(null)
      return
    }
    const group = targetGroups.find((entry) => entry.id === activeSubmenuGroupId)
    if (!group?.children.length) {
      setSubmenuLayout(null)
      return
    }
    const row = groupRowRefs.current.get(activeSubmenuGroupId)
    if (!row) return
    setSubmenuLayout(layoutPublishSpaceSubmenu(row, submenuRef.current))
  }

  useLayoutEffect(() => {
    if (!menuOpen || !activeSubmenuGroupId) {
      setSubmenuLayout(null)
      return
    }
    updateSubmenuLayout()
    const frameId = requestAnimationFrame(updateSubmenuLayout)
    return () => cancelAnimationFrame(frameId)
  }, [menuOpen, activeSubmenuGroupId, menuLayout, catalogRevision, locale, targetGroups])

  useEffect(() => {
    if (!menuOpen || !activeSubmenuGroupId) return
    const onViewportChange = () => updateSubmenuLayout()
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [menuOpen, activeSubmenuGroupId, menuLayout, catalogRevision, locale, targetGroups])

  return (
    <>
      <div
        ref={rootRef}
        className={['agents-publish-space-select', menuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          className={[className, 'agents-publish-space-select__trigger'].filter(Boolean).join(' ')}
          aria-label={ariaLabel ?? scenarioT(locale, 'publishSelectSpace')}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((open) => !open)
            if (menuOpen) {
              setHoveredGroupId(null)
              setExpandedGroupId(null)
            }
          }}
        >
          <span className="agents-publish-space-select__value">{selectedLabel}</span>
        </button>

        {menuOpen
          ? createPortal(
              <div
                ref={menuRef}
                className="agents-publish-space-select__menu agents-publish-space-select__menu--portal"
                role="listbox"
                aria-label={ariaLabel ?? scenarioT(locale, 'publishSelectSpace')}
                style={{
                  position: 'fixed',
                  top: menuLayout.top,
                  left: menuLayout.left,
                  width: menuLayout.width,
                  zIndex: 460,
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="agents-publish-space-select__menu-scroll">
                  {targetGroups.map((group) => {
                    const hasChildren = group.children.length > 0
                    const isGroupActive = activeSubmenuGroupId === group.id
                    const isGroupSelected =
                      effectiveValue === group.id ||
                      group.children.some((child) => child.id === effectiveValue)

                    return (
                      <div
                        key={group.id}
                        className={[
                          'agents-publish-space-select__group',
                          isGroupActive ? 'is-hovered' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onMouseEnter={() => {
                          cancelHoverClear()
                          setHoveredGroupId(group.id)
                        }}
                        onMouseLeave={() => {
                          if (!hasChildren) return
                          scheduleHoverClear()
                        }}
                      >
                        <button
                          ref={(node) => {
                            if (node) groupRowRefs.current.set(group.id, node)
                            else groupRowRefs.current.delete(group.id)
                          }}
                          type="button"
                          role="option"
                          aria-selected={isGroupSelected}
                          aria-expanded={hasChildren ? isGroupActive : undefined}
                          className={[
                            'agents-publish-space-select__group-row',
                            isGroupSelected ? 'is-selected' : '',
                            isGroupActive ? 'is-active' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => {
                            if (!hasChildren) {
                              selectTarget(group.id)
                              return
                            }
                            cancelHoverClear()
                            setExpandedGroupId((current) => (current === group.id ? null : group.id))
                            setHoveredGroupId(group.id)
                          }}
                        >
                          <span className="agents-publish-space-select__group-label">{group.label}</span>
                          {hasChildren ? (
                            <span className="agents-publish-space-select__group-chevron" aria-hidden="true">
                              ›
                            </span>
                          ) : null}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="agents-publish-space-select__create"
                  onClick={handleCreateSpace}
                >
                  + {scenarioT(locale, 'publishCreateSpace')}
                </button>
              </div>,
              document.body,
            )
          : null}

        {menuOpen && activeSubmenuGroup?.children.length
          ? createPortal(
              <div
                ref={submenuRef}
                className="agents-publish-space-select__submenu agents-publish-space-select__submenu--portal"
                role="group"
                aria-label={activeSubmenuGroup.label}
                style={{
                  position: 'fixed',
                  top: submenuLayout?.top ?? -9999,
                  left: submenuLayout?.left ?? -9999,
                  minWidth: submenuLayout?.minWidth ?? 220,
                  visibility: submenuLayout ? 'visible' : 'hidden',
                  zIndex: 461,
                }}
                onMouseEnter={() => {
                  cancelHoverClear()
                  setHoveredGroupId(activeSubmenuGroup.id)
                }}
                onMouseLeave={scheduleHoverClear}
                onPointerDown={(event) => event.stopPropagation()}
              >
                {activeSubmenuGroup.children.map((child) => {
                  const isChildSelected = effectiveValue === child.id
                  return (
                    <button
                      key={child.id}
                      type="button"
                      role="option"
                      aria-selected={isChildSelected}
                      className={[
                        'agents-publish-space-select__submenu-item',
                        isChildSelected ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => selectTarget(child.id)}
                    >
                      {child.label}
                    </button>
                  )
                })}
              </div>,
              document.body,
            )
          : null}
      </div>

      {createSpaceOpen
        ? createPortal(
            <TeamCollaborationSpaceFormModal
              locale={locale}
              open
              editingSpace={null}
              formSpaceKind="team"
              createTitleKey="modalCreateTitle"
              copySourceOptions={copySourceOptions}
              orgMembers={TCS_ORG_MEMBERS_SEED}
              showAccessSettings
              showDeadlineField
              onClose={() => setCreateSpaceOpen(false)}
              onSubmit={(draft) => {
                const spaceId = addCustomPublishSpace(draft)
                setCatalogRevision((revision) => revision + 1)
                flushSync(() => {
                  onChange(spaceId)
                })
                setCreateSpaceOpen(false)
                setMenuOpen(false)
                setHoveredGroupId(null)
                setExpandedGroupId(null)
              }}
            />,
            document.body,
          )
        : null}
    </>
  )
}
