import { useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { TeamCollaborationSpaceFormModal } from '../components/TeamCollaborationSpaceFormModal'
import { TeamCollaborationSpaceGrid } from '../components/TeamCollaborationSpaceGrid'
import { TeamCollaborationSpaceHeader } from '../components/TeamCollaborationSpaceHeader'
import { TeamCollaborationSpaceSharedCard } from '../components/TeamCollaborationSpaceSharedCard'
import { TcsSectionHintIcon } from '../components/TcsSectionHintIcon'
import { TcsSpaceDeleteModal } from '../components/TcsSpaceDeleteModal'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { tcsT } from '../i18n/strings'
import type { TeamCollaborationSpaceItem, TcsListViewMode } from '../types'

export function TeamCollaborationSpaceListPage() {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const { canCreateSpace, canConfigureAccess, canManageSharedSpace, showOrganizationSpaces } =
    useTeamCollaborationCapabilities()
  const [deletingSpace, setDeletingSpace] = useState<TeamCollaborationSpaceItem | null>(null)
  const [viewMode, setViewMode] = useState<TcsListViewMode>('cards')

  const handleCreateSubmit = (draft: Parameters<typeof tcs.submitForm>[0]) => {
    tcs.submitForm(draft)
  }

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcsT(locale, 'pageTitle')}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <TeamCollaborationSpaceHeader
          locale={locale}
          searchQuery={tcs.searchQuery}
          onSearchQueryChange={tcs.setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreate={
            showOrganizationSpaces && canCreateSpace
              ? () => tcs.openCreateForm('team')
              : undefined
          }
        />

        {tcs.sharedSpaces.length > 0 ? (
          <section className="tcs-section" aria-labelledby="tcs-shared-section-title">
            <div className="tcs-section-head">
              <div className="tcs-section-title-row">
                <h2 id="tcs-shared-section-title" className="tcs-section-title">
                  {tcsT(locale, 'sectionSharedTitle')}
                </h2>
                <TcsSectionHintIcon
                  hintId="tcs-shared-section-hint"
                  hint={tcsT(locale, 'sectionSharedHint')}
                  ariaLabel={tcsT(locale, 'sectionSharedHintAria')}
                />
              </div>
            </div>
            <div className="tcs-shared-wrap">
              {tcs.sharedSpaces.map((item) => (
                <TeamCollaborationSpaceSharedCard
                  key={item.id}
                  locale={locale}
                  item={item}
                  name={tcs.localizeName(item)}
                  description={tcs.localizeDescription(item)}
                  memberCountLabel={tcsT(locale, 'memberCount').replace('{count}', String(item.members.length))}
                  resourceCountLabel={tcsT(locale, 'resourceCount').replace('{count}', String(item.resourceCount))}
                  onOpen={() => tcs.navigate({ view: 'space', spaceId: item.id })}
                  onEdit={canManageSharedSpace ? tcs.openEditForm : undefined}
                  onRequestDelete={canManageSharedSpace ? setDeletingSpace : undefined}
                />
              ))}
            </div>
          </section>
        ) : null}

        {showOrganizationSpaces ? (
          <section className="tcs-section" aria-labelledby="tcs-team-section-title">
            <div className="tcs-section-head">
              <div className="tcs-section-title-row">
                <h2 id="tcs-team-section-title" className="tcs-section-title">
                  {tcsT(locale, 'sectionTeamTitle')}
                </h2>
                <TcsSectionHintIcon
                  hintId="tcs-team-section-hint"
                  hint={tcsT(locale, 'sectionTeamHint')}
                  ariaLabel={tcsT(locale, 'sectionTeamHintAria')}
                />
              </div>
            </div>
            <TeamCollaborationSpaceGrid
              locale={locale}
              spaces={tcs.teamSpaces}
              allSpaces={tcs.spaces}
              viewMode={viewMode}
              localizeName={tcs.localizeName}
              localizeDescription={tcs.localizeDescription}
              memberCountLabel={(count) => tcsT(locale, 'memberCount').replace('{count}', String(count))}
              resourceCountLabel={(count) => tcsT(locale, 'resourceCount').replace('{count}', String(count))}
              onOpen={(item) => tcs.navigate({ view: 'space', spaceId: item.id })}
              onEdit={tcs.openEditForm}
              onRequestDelete={setDeletingSpace}
            />
          </section>
        ) : null}
      </div>

      <TeamCollaborationSpaceFormModal
        locale={locale}
        open={tcs.formOpen}
        editingSpace={tcs.editingSpace}
        formSpaceKind={tcs.formSpaceKind}
        copySourceOptions={tcs.copySourceOptions}
        orgMembers={tcs.orgMembers}
        showAccessSettings={
          (canConfigureAccess &&
            tcs.formSpaceKind !== 'shared' &&
            tcs.editingSpace?.kind !== 'shared') ||
          (canManageSharedSpace &&
            (tcs.formSpaceKind === 'shared' || tcs.editingSpace?.kind === 'shared'))
        }
        onClose={tcs.closeForm}
        onSubmit={handleCreateSubmit}
        showDeadlineField
      />
      <TcsSpaceDeleteModal
        locale={locale}
        open={deletingSpace != null}
        space={deletingSpace}
        onClose={() => setDeletingSpace(null)}
        onConfirm={() => {
          if (!deletingSpace) return
          const wasShared = deletingSpace.kind === 'shared'
          tcs.deleteTeamSpace(deletingSpace.id)
          setDeletingSpace(null)
          if (wasShared) {
            tcs.navigate({ view: 'list' })
          }
        }}
      />
    </section>
  )
}
