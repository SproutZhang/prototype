import { useMemo, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { TeamCollaborationSpaceFormModal } from '../components/TeamCollaborationSpaceFormModal'
import { TcsDetailHeader, tcsBackToListLabel } from '../components/TcsDetailHeader'
import { TcsResourcesPanel } from '../components/TcsResourcesPanel'
import { TcsSpaceDeleteModal } from '../components/TcsSpaceDeleteModal'
import { TcsTabBar } from '../components/TcsTabBar'
import { TcsMembersPanel } from '../components/TcsMembersPanel'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { accessModeBadgeLabel, localizeSpaceUpdatedAt, tcsT } from '../i18n/strings'
import type { SpaceDetailTab } from '../types'
import { resolveSpaceAccessBadgeMode } from '../utils/accessBadge'
import { resolveResourceMoveTargetSpaces } from '../utils/resourceMoveTargets'

import { SHARED_SPACE_ID } from '../data/sharedSpace'

type SharedSpaceDetailPageProps = {
  spaceId?: string
}

export function SharedSpaceDetailPage({ spaceId = SHARED_SPACE_ID }: SharedSpaceDetailPageProps) {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const { canConfigureAccess, canManageSharedSpace } = useTeamCollaborationCapabilities()
  const [tab, setTab] = useState<SpaceDetailTab>('overview')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const space = tcs.getSpace(spaceId) ?? (spaceId === SHARED_SPACE_ID ? tcs.sharedSpace : null)
  const resolvedSpaceId = space?.id ?? spaceId

  const moveTargetSpaces = useMemo(
    () => resolveResourceMoveTargetSpaces(resolvedSpaceId, tcs.spaces, locale),
    [locale, resolvedSpaceId, tcs.spaces],
  )

  if (!space || space.kind !== 'shared') {
    return <div className="skills-empty tcs-page-main">{tcsT(locale, 'notFoundSpace')}</div>
  }

  const tabs: Array<{ id: SpaceDetailTab; label: string }> = [
    { id: 'overview', label: tcsT(locale, 'tabOverview') },
    { id: 'members', label: tcsT(locale, 'tabMembers') },
    { id: 'resources', label: tcsT(locale, 'tabResources') },
  ]

  const badgeMode = resolveSpaceAccessBadgeMode(space, tcs.spaces)

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcs.localizeName(space)}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <TcsDetailHeader
          title={tcs.localizeName(space)}
          subtitle={accessModeBadgeLabel(locale, badgeMode)}
          backLabel={tcsBackToListLabel(locale)}
          onBack={() => tcs.navigate({ view: 'list' })}
          onEdit={canManageSharedSpace ? () => tcs.openEditForm(space) : undefined}
          editLabel={tcsT(locale, 'editSpaceInfo')}
          actions={
            canManageSharedSpace ? (
              <button
                type="button"
                className="agents-btn tcs-btn--danger"
                onClick={() => setDeleteOpen(true)}
              >
                {tcsT(locale, 'cardMenuDelete')}
              </button>
            ) : undefined
          }
        />
        {canConfigureAccess ? (
          <TcsTabBar tabs={tabs} active={tab} onChange={setTab} ariaLabel={tcs.localizeName(space)} />
        ) : null}
        <div className="tcs-detail-panel">
          {canConfigureAccess && tab === 'overview' ? (
            <div className="tcs-overview">
              <p>{tcs.localizeDescription(space)}</p>
              <p className="tcs-overview-meta">
                {tcsT(locale, 'memberCount').replace('{count}', String(space.members.length))}
                {' · '}
                {tcsT(locale, 'resourceCount').replace('{count}', String(space.resourceCount))}
                {' · '}
                {localizeSpaceUpdatedAt(space, locale)}
              </p>
              {!canManageSharedSpace ? (
                <p className="tcs-readonly-hint">{tcsT(locale, 'sharedReadonlyHint')}</p>
              ) : null}
            </div>
          ) : null}
          {canConfigureAccess && tab === 'members' ? (
            <TcsMembersPanel
              locale={locale}
              members={space.members}
              orgMembers={tcs.orgMembers}
              readOnly
              localizeMember={tcs.localizeMember}
              localizeMemberDept={tcs.localizeMemberDept}
            />
          ) : null}
          {!canConfigureAccess || tab === 'resources' ? (
            <TcsResourcesPanel
              locale={locale}
              scopeKey={`space:${space.id}`}
              resourceCount={space.resourceCount}
              resourceIds={space.resourceIds}
              spaceId={space.id}
              showResourceFilters={canConfigureAccess}
              canManageResources={canManageSharedSpace}
              moveTargetSpaces={moveTargetSpaces}
              onRemoveResource={(resourceId) => tcs.removeSpaceResource(space.id, resourceId)}
              onMoveResource={(resourceId, targetSpaceId) =>
                tcs.moveSpaceResource(space.id, resourceId, targetSpaceId)
              }
            />
          ) : null}
        </div>
      </div>

      <TeamCollaborationSpaceFormModal
        locale={locale}
        open={tcs.formOpen}
        editingSpace={tcs.editingSpace}
        formSpaceKind={tcs.formSpaceKind}
        copySourceOptions={tcs.copySourceOptions}
        orgMembers={tcs.orgMembers}
        showAccessSettings={canManageSharedSpace}
        onClose={tcs.closeForm}
        onSubmit={(draft) => {
          tcs.submitForm(draft)
        }}
        showDeadlineField
      />

      <TcsSpaceDeleteModal
        locale={locale}
        open={deleteOpen}
        space={space}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          tcs.deleteTeamSpace(space.id)
          setDeleteOpen(false)
          tcs.navigate({ view: 'list' })
        }}
      />
    </section>
  )
}
