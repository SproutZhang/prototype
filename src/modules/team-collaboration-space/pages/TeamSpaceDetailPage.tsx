import { useMemo, useRef, useState } from 'react'

import { resolveSpaceMemberPresetPermissions } from '../utils/projectSpaceCustomRolesSync'

import { useLocale } from '../../../i18n/LocaleContext'
import { TeamCollaborationSpaceFormModal } from '../components/TeamCollaborationSpaceFormModal'
import { ProjectActivateModal } from '../components/ProjectActivateModal'
import { TcsDetailHeader, tcsBackToListLabel } from '../components/TcsDetailHeader'
import { TcsImportScenarioResourcesModal } from '../components/TcsImportScenarioResourcesModal'
import {
  TcsAddMemberModal,
  TcsEditMemberPermissionsModal,
} from '../components/TcsMembersPanel'
import { TcsMembersManageModal } from '../components/TcsMembersManageModal'
import {
  TcsResourcesPanel,
} from '../components/TcsResourcesPanel'
import { TcsResourceIterationDrawer } from '../components/TcsResourceIterationDrawer'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import type { TcsResourceCatalogItem } from '../types'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import {
  accessModeBadgeLabel,
  localizeSpaceUpdatedAt,
  tcsT,
} from '../i18n/strings'
import type { TcsMemberAssignment } from '../types'
import { resolveSpaceAccessBadgeMode } from '../utils/accessBadge'
import { getImportableResources, resolveSpaceResourceIds } from '../utils/spaceResources'
import { resolveResourceMoveTargetSpaces } from '../utils/resourceMoveTargets'
import { resolveCurrentMemberId } from '../utils/currentMember'
import {
  canMemberViewSpaceContent,
  resolveMemberSpaceAssignment,
} from '../utils/memberSpaceAccess'
import {
  isCustomRoleSelectValue,
  parseCustomRoleSelectValue,
} from '../utils/spaceRoles'

type TeamSpaceDetailPageProps = {
  spaceId: string
}

export function TeamSpaceDetailPage({ spaceId }: TeamSpaceDetailPageProps) {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const { canConfigureAccess, showOrganizationSpaces } = useTeamCollaborationCapabilities()
  const space = tcs.getSpace(spaceId)
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [importResourcesOpen, setImportResourcesOpen] = useState(false)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [editMember, setEditMember] = useState<TcsMemberAssignment | null>(null)
  const [iterationItem, setIterationItem] = useState<TcsResourceCatalogItem | null>(null)
  const [iterationToast, setIterationToast] = useState<{ title: string; sub?: string } | null>(null)
  const iterationToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const spaceCustomRoles = useMemo(
    () =>
      tcs.projectSpaceCustomRoles.map((role) => ({
        id: role.id,
        labelZh: role.nameZh,
        labelEn: role.nameEn,
      })),
    [tcs.projectSpaceCustomRoles],
  )

  const memberCandidates = useMemo(() => {
    if (!space) return []
    const existing = new Set(space.members.map((m) => m.memberId))
    return tcs.orgMembers.filter((m) => !existing.has(m.id))
  }, [space, tcs.orgMembers])

  const spaceAccessible =
    space != null && space.kind !== 'shared' && space.kind === 'team' && showOrganizationSpaces

  const assignedResourceIds = useMemo(() => {
    if (!space) return []
    return resolveSpaceResourceIds(space)
  }, [space])

  const importResourceCandidates = useMemo(() => {
    const assigned = new Set(assignedResourceIds)
    return getImportableResources().filter((item) => !assigned.has(item.id))
  }, [assignedResourceIds])

  const moveTargetSpaces = useMemo(
    () => resolveResourceMoveTargetSpaces(spaceId, tcs.spaces, locale),
    [locale, spaceId, tcs.spaces],
  )

  if (!spaceAccessible || !space) {
    return <div className="skills-empty tcs-page-main">{tcsT(locale, 'notFoundSpace')}</div>
  }

  const badgeMode = resolveSpaceAccessBadgeMode(space, tcs.spaces)
  const memberCountLabel = tcsT(locale, 'memberCount').replace('{count}', String(space.members.length))
  const editingMemberOrg = editMember
    ? tcs.orgMembers.find((m) => m.id === editMember.memberId)
    : null

  const isTeamSpace = space.kind === 'team'
  const isExpired = tcs.isProjectSpaceExpired(spaceId)
  const memberCanViewContent =
    canConfigureAccess ||
    canMemberViewSpaceContent(resolveMemberSpaceAssignment(space.members, resolveCurrentMemberId()))

  const handleMemberRoleSelect = (assignment: TcsMemberAssignment, value: string) => {
    if (isCustomRoleSelectValue(value)) {
      const roleId = parseCustomRoleSelectValue(value)
      const role = tcs.projectSpaceCustomRoles.find((item) => item.id === roleId)
      if (!role) return
      tcs.updateSpaceMember(spaceId, assignment.memberId, 'custom', role.permissions, role.id)
      return
    }
    const preset = value as Exclude<TcsMemberAssignment['rolePreset'], 'custom'>
    tcs.updateSpaceMember(
      spaceId,
      assignment.memberId,
      preset,
      resolveSpaceMemberPresetPermissions(preset),
    )
  }

  const importResourcesButton = canConfigureAccess ? (
    <button
      type="button"
      className="agents-btn agents-btn-primary"
      disabled={isExpired}
      title={isExpired ? tcsT(locale, 'projectSpaceExpiredImportHint') : undefined}
      onClick={() => setImportResourcesOpen(true)}
    >
      {tcsT(locale, 'importResources')}
    </button>
  ) : null

  const resourcesPanel = (
    <TcsResourcesPanel
      locale={locale}
      scopeKey={`space:${spaceId}`}
      resourceCount={space.resourceCount}
      resourceIds={space.resourceIds}
      spaceId={spaceId}
      showResourceFilters
      emptyAction={importResourcesButton}
      canManageResources={canConfigureAccess}
      showExpiredBadge={isExpired}
      moveTargetSpaces={moveTargetSpaces}
      externalIterationDrawer
      iterationItem={iterationItem}
      onIterationItemChange={setIterationItem}
      onRemoveResource={(resourceId) => tcs.removeSpaceResource(spaceId, resourceId)}
      onMoveResource={(resourceId, targetSpaceId) =>
        tcs.moveSpaceResource(spaceId, resourceId, targetSpaceId)
      }
    />
  )

  const showIterationToast = (title: string, sub?: string) => {
    setIterationToast({ title, sub: sub?.trim() || undefined })
    if (iterationToastTimerRef.current) window.clearTimeout(iterationToastTimerRef.current)
    iterationToastTimerRef.current = window.setTimeout(() => {
      iterationToastTimerRef.current = undefined
      setIterationToast(null)
    }, 3200)
  }

  const detailHeader = (
    <TcsDetailHeader
      title={tcs.localizeName(space)}
      subtitle={
        <div className="tcs-detail-overview">
          <p className="tcs-detail-description">{tcs.localizeDescription(space)}</p>
          {isTeamSpace ? (
            <div className="tcs-detail-meta">
              {isExpired ? (
                <span className="tcs-space-status-badge tcs-space-status-badge--expired">
                  {tcsT(locale, 'projectSpaceExpiredBadge')}
                </span>
              ) : space.accessMode ? (
                <>
                  <span className={`tcs-space-access-badge tcs-space-access-badge--${badgeMode}`}>
                    {accessModeBadgeLabel(locale, badgeMode)}
                  </span>
                  <span className="tcs-space-card-meta-dot" aria-hidden="true">
                    ·
                  </span>
                </>
              ) : null}
              <button
                type="button"
                className="tcs-detail-meta-badge tcs-detail-meta-badge--members"
                aria-label={tcsT(locale, 'membersManageBadgeAria').replace(
                  '{count}',
                  String(space.members.length),
                )}
                onClick={() => setMembersModalOpen(true)}
              >
                {memberCountLabel}
              </button>
              <span className="tcs-space-card-meta-dot" aria-hidden="true">
                ·
              </span>
              {tcsT(locale, 'resourceCount').replace('{count}', String(assignedResourceIds.length))}
              <span className="tcs-space-card-meta-dot" aria-hidden="true">
                ·
              </span>
              {localizeSpaceUpdatedAt(space, locale)}
            </div>
          ) : null}
        </div>
      }
      backLabel={tcsBackToListLabel(locale)}
      onBack={() => tcs.navigate({ view: 'list' })}
      onEdit={() => tcs.openEditForm(space)}
      editLabel={tcsT(locale, 'editSpaceInfo')}
      editDisabled={isExpired}
      editDisabledMessage={tcsT(locale, 'projectSpaceExpiredEditHint')}
      actions={importResourcesButton}
    />
  )

  const expiredBanner =
    isTeamSpace && isExpired ? (
      <div className="tcs-project-expired-banner" role="status">
        <p className="tcs-project-expired-banner-text">{tcsT(locale, 'projectSpaceExpiredBanner')}</p>
        {canConfigureAccess ? (
          <button
            type="button"
            className="agents-btn agents-btn-primary tcs-project-expired-banner-action"
            onClick={() => setActivateModalOpen(true)}
          >
            {tcsT(locale, 'projectSpaceActivate')}
          </button>
        ) : null}
      </div>
    ) : null

  const detailBody = (
    <>
      {detailHeader}
      {expiredBanner}
      {isTeamSpace ? (
        <div className="tcs-detail-panel">
          {memberCanViewContent ? (
            resourcesPanel
          ) : (
            <div className="skills-empty">{tcsT(locale, 'spaceMemberNoAccess')}</div>
          )}
        </div>
      ) : null}
    </>
  )

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcs.localizeName(space)}>
      <div
        className={`agents-page-main experience-entry-page-main skills-page-main tcs-page-main${iterationItem ? ' tcs-page-main--iteration-drawer' : ''}`}
      >
        {iterationItem ? (
          <div className="tcs-iteration-page-shell">
            <TcsResourceIterationDrawer
              open
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
            <div className="tcs-iteration-page-shell-main">{detailBody}</div>
          </div>
        ) : (
          detailBody
        )}

        {iterationToast ? (
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
        ) : null}
      </div>

      <TeamCollaborationSpaceFormModal
        locale={locale}
        open={tcs.formOpen}
        editingSpace={tcs.editingSpace}
        formSpaceKind={tcs.formSpaceKind}
        copySourceOptions={tcs.copySourceOptions}
        orgMembers={tcs.orgMembers}
        showAccessSettings={canConfigureAccess}
        onClose={tcs.closeForm}
        onSubmit={(draft) => {
          tcs.submitForm(draft)
        }}
        showDeadlineField
      />

      <TcsImportScenarioResourcesModal
        locale={locale}
        open={importResourcesOpen}
        candidates={importResourceCandidates}
        onClose={() => setImportResourcesOpen(false)}
        onConfirm={(resourceIds) => tcs.addSpaceResources(spaceId, resourceIds)}
      />

      <ProjectActivateModal
        locale={locale}
        open={activateModalOpen}
        space={space}
        onClose={() => setActivateModalOpen(false)}
        onConfirm={(draft) => {
          tcs.activateProjectSpace(spaceId, draft)
          setActivateModalOpen(false)
        }}
      />

      {isTeamSpace ? (
        <>
          <TcsMembersManageModal
            locale={locale}
            open={membersModalOpen}
            members={space.members}
            orgMembers={tcs.orgMembers}
            localizeMember={tcs.localizeMember}
            localizeMemberDept={tcs.localizeMemberDept}
            manageLocked={isExpired}
            manageLockedMessage={tcsT(locale, 'projectSpaceExpiredMembersHint')}
            onClose={() => setMembersModalOpen(false)}
            onAdd={() => setAddMemberOpen(true)}
            onEdit={setEditMember}
            onRemove={(memberId) => tcs.removeSpaceMember(spaceId, memberId)}
            spaceCustomRoles={spaceCustomRoles}
            onRoleSelectChange={handleMemberRoleSelect}
            onRoleChange={(assignment, preset) => {
              tcs.updateSpaceMember(
                spaceId,
                assignment.memberId,
                preset,
                resolveSpaceMemberPresetPermissions(preset),
              )
            }}
          />
          <TcsAddMemberModal
            locale={locale}
            open={addMemberOpen}
            candidates={memberCandidates}
            onClose={() => setAddMemberOpen(false)}
            onConfirm={(memberIds, preset) => tcs.addSpaceMembers(spaceId, memberIds, preset)}
          />
          <TcsEditMemberPermissionsModal
            locale={locale}
            open={editMember != null}
            assignment={editMember}
            memberName={editingMemberOrg ? tcs.localizeMember(editingMemberOrg) : ''}
            onClose={() => setEditMember(null)}
            onSave={(preset, permissions) => {
              if (!editMember) return
              tcs.updateSpaceMember(spaceId, editMember.memberId, preset, permissions)
            }}
          />
        </>
      ) : null}
    </section>
  )
}
