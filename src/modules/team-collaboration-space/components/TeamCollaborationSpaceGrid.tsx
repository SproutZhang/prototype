import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import type { TeamCollaborationSpaceItem, TcsListViewMode } from '../types'
import { TeamCollaborationSpaceCard } from './TeamCollaborationSpaceCard'
import { TeamCollaborationSpaceEmptyState } from './TeamCollaborationSpaceEmptyState'

type TeamCollaborationSpaceGridProps = {
  locale: AppLocale
  spaces: TeamCollaborationSpaceItem[]
  allSpaces: TeamCollaborationSpaceItem[]
  viewMode: TcsListViewMode
  emptyVariant?: 'team' | 'personal'
  localizeName: (item: TeamCollaborationSpaceItem) => string
  localizeDescription: (item: TeamCollaborationSpaceItem) => string
  memberCountLabel: (count: number) => string
  resourceCountLabel: (count: number) => string
  onOpen: (item: TeamCollaborationSpaceItem) => void
  onEdit: (item: TeamCollaborationSpaceItem) => void
  onRequestDelete: (item: TeamCollaborationSpaceItem) => void
}

export function TeamCollaborationSpaceGrid({
  locale,
  spaces,
  allSpaces,
  viewMode,
  emptyVariant = 'team',
  localizeName,
  localizeDescription,
  memberCountLabel,
  resourceCountLabel,
  onOpen,
  onEdit,
  onRequestDelete,
}: TeamCollaborationSpaceGridProps) {
  if (spaces.length === 0) {
    return <TeamCollaborationSpaceEmptyState locale={locale} variant={emptyVariant} />
  }

  return (
    <section
      className={
        viewMode === 'list'
          ? 'agents-grid agents-grid--list skills-cards-grid tcs-grid'
          : 'agents-grid skills-cards-grid tcs-grid'
      }
      aria-label={tcsT(locale, 'gridAriaLabel')}
    >
      {spaces.map((item) => (
        <TeamCollaborationSpaceCard
          key={item.id}
          locale={locale}
          item={item}
          allSpaces={allSpaces}
          viewMode={viewMode}
          name={localizeName(item)}
          description={localizeDescription(item)}
          memberCountLabel={memberCountLabel(item.members.length)}
          resourceCountLabel={
            item.resourceCount != null ? resourceCountLabel(item.resourceCount) : ''
          }
          onOpen={() => onOpen(item)}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </section>
  )
}
