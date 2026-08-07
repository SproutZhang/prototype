import type { MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT, type KnowledgeBaseStringKey } from '../i18n/strings'

type DocMenuIconType = 'preview' | 'chunks' | 'insert' | 'api' | 'delete' | 'search' | 'refresh'

type DocActionMenuItemKey =
  | 'docPreviewProcess'
  | 'docViewEditChunks'
  | 'docInsertBlock'
  | 'docViewApi'
  | 'docDelete'

export type { DocActionMenuItemKey }

const DOC_ACTION_MENU_ITEMS: {
  key: DocActionMenuItemKey
  icon: DocMenuIconType
  danger?: boolean
  separated?: boolean
}[] = [
  { key: 'docPreviewProcess', icon: 'preview' },
  { key: 'docViewEditChunks', icon: 'chunks' },
  { key: 'docInsertBlock', icon: 'insert' },
  { key: 'docViewApi', icon: 'api' },
  { key: 'docDelete', icon: 'delete', danger: true, separated: true },
]

export type DocActionAdditionalMenuItem = {
  key: string
  labelKey: KnowledgeBaseStringKey
  icon: 'search' | 'refresh'
  insertAfter: DocActionMenuItemKey
  onClick: () => void
  disabled?: boolean
}

export type DocActionLeadingMenuItem = {
  key: string
  labelKey: KnowledgeBaseStringKey
  icon: 'search' | 'refresh'
  onClick: () => void
  disabled?: boolean
}

type KnowledgeBaseDocActionMenuProps = {
  open: boolean
  locale: AppLocale
  hiddenKeys?: DocActionMenuItemKey[]
  leadingItems?: DocActionLeadingMenuItem[]
  additionalItems?: DocActionAdditionalMenuItem[]
  onMouseDown?: (event: MouseEvent) => void
  onPreviewProcess?: () => void
  onViewEditChunks?: () => void
  onInsertBlock?: () => void
  onViewApi?: () => void
  onRequestDelete: () => void
  onItemClick?: (event: MouseEvent) => void
  showRetry?: boolean
  onRetry?: () => void
}

function DocMenuIcon({ type }: { type: DocMenuIconType }) {
  if (type === 'preview') {
    return (
      <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M10.2 2.5 13.5 5.8 5.8 13.5 2.5 10.2 10.2 2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M9 4 12 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'chunks') {
    return (
      <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <rect x="2.5" y="2.5" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <rect x="9.5" y="2.5" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <rect x="2.5" y="9.5" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M11.2 10.2 13.8 12.8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M13.8 10.2 11.2 12.8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'insert') {
    return (
      <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M5 2.5h4.5L13 6v7.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d="M9 2.5V6h3.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M8 8.5v3M6.5 10h3" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'api') {
    return (
      <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M5.5 4.5 3 8l2.5 3.5M10.5 4.5 13 8l-2.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === 'search') {
    return (
      <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10 10l3 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'refresh') {
    return (
      <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M12.5 3.5A5.5 5.5 0 0 0 4.8 4.8L3.5 3.5M3.5 12.5A5.5 5.5 0 0 0 11.2 11.2L12.5 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 3.5v2.5h2.5M12.5 12.5v-2.5h-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg className="kb-doc-menu-item-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M3.5 4.5h2l.7-1.2c.2-.4.6-.8 1.3-.8h1c.7 0 1.1.4 1.3.8L10.5 4.5H13a1 1 0 0 1 1 1v1.2a1 1 0 0 1-.8 1l-.9.2-.9 5.6a1 1 0 0 1-1 .8H6.6a1 1 0 0 1-1-.8L4.7 7.7l-.9-.2A1 1 0 0 1 3 6.5V5.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M6.5 7.2v4.8M9.5 7.2v4.8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function KnowledgeBaseDocActionMenu({
  open,
  locale,
  hiddenKeys,
  leadingItems,
  additionalItems,
  onMouseDown,
  onPreviewProcess,
  onViewEditChunks,
  onInsertBlock,
  onViewApi,
  onRequestDelete,
  onItemClick,
  showRetry = false,
  onRetry,
}: KnowledgeBaseDocActionMenuProps) {
  const actions: Record<DocActionMenuItemKey, () => void> = {
    docPreviewProcess: onPreviewProcess ?? (() => {}),
    docViewEditChunks: onViewEditChunks ?? (() => {}),
    docInsertBlock: onInsertBlock ?? (() => {}),
    docViewApi: onViewApi ?? (() => {}),
    docDelete: onRequestDelete,
  }

  const hiddenKeySet = new Set(hiddenKeys ?? [])
  const menuItems = DOC_ACTION_MENU_ITEMS.filter((item) => !hiddenKeySet.has(item.key))
  const extrasByAnchor = new Map<DocActionMenuItemKey, DocActionAdditionalMenuItem[]>()
  for (const extra of additionalItems ?? []) {
    const list = extrasByAnchor.get(extra.insertAfter) ?? []
    list.push(extra)
    extrasByAnchor.set(extra.insertAfter, list)
  }

  const renderMenuButton = (
    key: string,
    className: string,
    label: string,
    icon: DocMenuIconType,
    onClick: (event: MouseEvent) => void,
    disabled = false,
  ) => (
    <button
      key={key}
      type="button"
      className={className}
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
    >
      <DocMenuIcon type={icon} />
      {label}
    </button>
  )

  return (
    <div
      className={open ? 'kb-doc-menu is-open' : 'kb-doc-menu'}
      role="menu"
      aria-label={kbT(locale, 'docMenu')}
      onMouseDown={onMouseDown}
    >
      {showRetry && onRetry
        ? renderMenuButton(
            'doc-retry',
            'kb-doc-menu-item',
            kbT(locale, 'docRetry'),
            'refresh',
            (event) => {
              onItemClick?.(event)
              onRetry()
            },
          )
        : null}
      {(leadingItems ?? []).map((item) =>
        renderMenuButton(
          item.key,
          'kb-doc-menu-item',
          kbT(locale, item.labelKey),
          item.icon,
          (event) => {
            onItemClick?.(event)
            item.onClick()
          },
          item.disabled,
        ),
      )}
      {menuItems.flatMap((item) => {
        const buttons = [
          renderMenuButton(
            item.key,
            `kb-doc-menu-item${item.danger ? ' kb-doc-menu-item--danger' : ''}${item.separated ? ' kb-doc-menu-item--separated' : ''}`,
            kbT(locale, item.key),
            item.icon,
            (event) => {
              onItemClick?.(event)
              actions[item.key]()
            },
          ),
        ]

        for (const extra of extrasByAnchor.get(item.key) ?? []) {
          buttons.push(
            renderMenuButton(
              extra.key,
              'kb-doc-menu-item',
              kbT(locale, extra.labelKey),
              extra.icon,
              (event) => {
                onItemClick?.(event)
                extra.onClick()
              },
              extra.disabled,
            ),
          )
        }

        return buttons
      })}
    </div>
  )
}
