import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem } from '../types'
import { KnowledgeBaseCard } from './KnowledgeBaseCard'

type KnowledgeBaseGridProps = {
  locale: AppLocale
  items: KnowledgeBaseItem[]
  localizeName: (item: KnowledgeBaseItem) => string
  localizeDescription: (item: KnowledgeBaseItem) => string
  onOpen: (id: string) => void
  onEditItem: (item: KnowledgeBaseItem) => void
  onMoveItem: (item: KnowledgeBaseItem) => void
  onOpenPermissionsItem: (item: KnowledgeBaseItem) => void
  onRequestDeleteItem: (item: KnowledgeBaseItem) => void
  canManagePermissions?: boolean
  canEditKb?: boolean
  emptyTitle?: string
  emptyHint?: string
}

export function KnowledgeBaseGrid({
  locale,
  items,
  localizeName,
  localizeDescription,
  onOpen,
  onEditItem,
  onMoveItem,
  onOpenPermissionsItem,
  onRequestDeleteItem,
  canManagePermissions = false,
  canEditKb = false,
  emptyTitle,
  emptyHint,
}: KnowledgeBaseGridProps) {
  if (items.length === 0) {
    return (
      <div className="kb-empty" role="status">
        <p className="kb-empty-title">{emptyTitle ?? kbT(locale, 'emptyTitle')}</p>
        <p className="kb-empty-hint">{emptyHint ?? kbT(locale, 'emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="agents-grid kb-grid">
      {items.map((item) => (
        <KnowledgeBaseCard
          key={item.id}
          locale={locale}
          item={item}
          name={localizeName(item)}
          description={localizeDescription(item)}
          onOpen={() => onOpen(item.id)}
          onEdit={onEditItem}
          onMove={onMoveItem}
          onOpenPermissions={onOpenPermissionsItem}
          onRequestDelete={onRequestDeleteItem}
          canManagePermissions={canManagePermissions}
          canEditKb={canEditKb}
        />
      ))}
    </div>
  )
}
