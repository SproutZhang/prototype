import { useMemo, useState } from 'react'

import { clampToParentPermissions } from '../../access-control/data/permissions'
import { resolveSpaceMemberPresetPermissions } from '../utils/projectSpaceCustomRolesSync'

import { useLocale } from '../../../i18n/LocaleContext'
import { ProjectActivateModal } from '../components/ProjectActivateModal'
import { TcsDetailHeader, tcsBackToSpaceLabel } from '../components/TcsDetailHeader'
import {
  TcsAddMemberModal,
  TcsEditMemberPermissionsModal,
} from '../components/TcsMembersPanel'
import { TcsMembersManageModal } from '../components/TcsMembersManageModal'
import { TcsResourcesPanel } from '../components/TcsResourcesPanel'
import { TcsTabBar } from '../components/TcsTabBar'
import { TcsZoneFormModal } from '../components/TcsZoneFormModal'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import {
  accessModeBadgeLabel,
  localizeZoneDescription,
  localizeZoneUpdatedAt,
  tcsT,
} from '../i18n/strings'
import type { TcsMemberAssignment, ZoneDetailTab } from '../types'
import { resolveZoneAccessBadgeMode } from '../utils/accessBadge'
import {
  isCustomRoleSelectValue,
  parseCustomRoleSelectValue,
} from '../utils/spaceRoles'
import { resolveCurrentMemberId } from '../utils/currentMember'
import {
  canMemberViewSpaceContent,
  resolveEffectiveMemberAssignment,
} from '../utils/memberSpaceAccess'

type CollaborationZoneDetailPageProps = {
  spaceId: string
  zoneId: string
}

export function CollaborationZoneDetailPage({ spaceId, zoneId }: CollaborationZoneDetailPageProps) {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const { canManageSubSpaces, canConfigureAccess } = useTeamCollaborationCapabilities()
  const space = tcs.getSpace(spaceId)
  const zone = tcs.getZone(spaceId, zoneId)
  const [tab, setTab] = useState<ZoneDetailTab>('resources')
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [editMember, setEditMember] = useState<TcsMemberAssignment | null>(null)

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
    if (!space || !zone) return []
    const inZone = new Set(zone.members.map((m) => m.memberId))
    return space.members
      .filter((m) => !inZone.has(m.memberId))
      .map((m) => tcs.orgMembers.find((o) => o.id === m.memberId))
      .filter((m): m is NonNullable<typeof m> => m != null)
  }, [space, zone, tcs.orgMembers])

  if (!space || !zone) {
    return <div className="skills-empty tcs-page-main">{tcsT(locale, 'notFoundZone')}</div>
  }

  const isExpired = tcs.isProjectSpaceExpired(spaceId)
  const memberCanViewContent =
    canConfigureAccess ||
    canManageSubSpaces ||
    canMemberViewSpaceContent(
      resolveEffectiveMemberAssignment(space.members, zone.members, resolveCurrentMemberId()),
    )

  const tabs: Array<{ id: ZoneDetailTab; label: string }> = [
    { id: 'resources', label: tcsT(locale, 'tabResources') },
  ]

  const badgeMode = resolveZoneAccessBadgeMode(zone, space.zones)
  const memberCountLabel = tcsT(locale, 'memberCount').replace('{count}', String(zone.members.length))

  const openAddMember = () => {
    setAddMemberOpen(true)
  }

  const editingMemberOrg = editMember
    ? tcs.orgMembers.find((m) => m.id === editMember.memberId)
    : null
  const spaceMemberCeiling = editMember
    ? space.members.find((m) => m.memberId === editMember.memberId)?.permissions
    : undefined

  const handleZoneMemberRoleSelect = (assignment: TcsMemberAssignment, value: string) => {
    const ceiling = space.members.find((member) => member.memberId === assignment.memberId)?.permissions
    if (isCustomRoleSelectValue(value)) {
      const roleId = parseCustomRoleSelectValue(value)
      const role = tcs.projectSpaceCustomRoles.find((item) => item.id === roleId)
      if (!role) return
      let permissions = [...role.permissions]
      if (ceiling) permissions = clampToParentPermissions(ceiling, permissions)
      tcs.updateZoneMember(spaceId, zoneId, assignment.memberId, 'custom', permissions, role.id)
      return
    }
    const preset = value as Exclude<TcsMemberAssignment['rolePreset'], 'custom'>
    let permissions = resolveSpaceMemberPresetPermissions(preset)
    if (ceiling) permissions = clampToParentPermissions(ceiling, permissions)
    tcs.updateZoneMember(spaceId, zoneId, assignment.memberId, preset, permissions)
  }

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcs.localizeZoneTitle(zone)}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <TcsDetailHeader
          title={tcs.localizeZoneTitle(zone)}
          subtitle={
            <div className="tcs-detail-overview">
              <p className="tcs-detail-description">{localizeZoneDescription(zone, locale)}</p>
              <div className="tcs-detail-meta">
                {isExpired ? (
                  <span className="tcs-space-status-badge tcs-space-status-badge--expired">
                    {tcsT(locale, 'projectSpaceExpiredBadge')}
                  </span>
                ) : zone.accessMode ? (
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
                  aria-label={tcsT(locale, 'membersManageBadgeAria').replace('{count}', String(zone.members.length))}
                  onClick={() => setMembersModalOpen(true)}
                >
                  {memberCountLabel}
                </button>
                <span className="tcs-space-card-meta-dot" aria-hidden="true">
                  ·
                </span>
                {tcsT(locale, 'resourceCount').replace('{count}', String(zone.resourceCount))}
                <span className="tcs-space-card-meta-dot" aria-hidden="true">
                  ·
                </span>
                {localizeZoneUpdatedAt(zone, locale)}
              </div>
            </div>
          }
          backLabel={tcsBackToSpaceLabel(locale)}
          onBack={() => tcs.navigate({ view: 'space', spaceId })}
          onEdit={canManageSubSpaces ? () => tcs.openEditZoneForm(spaceId, zone) : undefined}
          editLabel={tcsT(locale, 'editZone')}
          editDisabled={isExpired}
          editDisabledMessage={tcsT(locale, 'projectSpaceExpiredEditHint')}
        />
        {isExpired ? (
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
        ) : null}
        <TcsTabBar tabs={tabs} active={tab} onChange={setTab} ariaLabel={tcs.localizeZoneTitle(zone)} />
        <div className="tcs-detail-panel">
          {tab === 'resources' ? (
            memberCanViewContent ? (
              <TcsResourcesPanel
                locale={locale}
                scopeKey={`zone:${spaceId}:${zoneId}`}
                resourceCount={zone.resourceCount}
                spaceId={spaceId}
                showExpiredBadge={isExpired}
              />
            ) : (
              <div className="skills-empty">{tcsT(locale, 'spaceMemberNoAccess')}</div>
            )
          ) : null}
        </div>
      </div>

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

      <TcsMembersManageModal
        locale={locale}
        open={membersModalOpen}
        members={zone.members}
        orgMembers={tcs.orgMembers}
        localizeMember={tcs.localizeMember}
        localizeMemberDept={tcs.localizeMemberDept}
        manageLocked={isExpired}
        manageLockedMessage={tcsT(locale, 'projectSpaceExpiredMembersHint')}
        onClose={() => setMembersModalOpen(false)}
        onAdd={openAddMember}
        onEdit={setEditMember}
        onRemove={(memberId) => tcs.removeZoneMember(spaceId, zoneId, memberId)}
        spaceCustomRoles={spaceCustomRoles}
        onRoleSelectChange={handleZoneMemberRoleSelect}
        onRoleChange={(assignment, preset) => {
          let permissions = resolveSpaceMemberPresetPermissions(preset)
          const ceiling = space.members.find((member) => member.memberId === assignment.memberId)?.permissions
          if (ceiling) {
            permissions = clampToParentPermissions(ceiling, permissions)
          }
          tcs.updateZoneMember(spaceId, zoneId, assignment.memberId, preset, permissions)
        }}
      />
      <TcsAddMemberModal
        locale={locale}
        open={addMemberOpen}
        candidates={memberCandidates}
        onClose={() => setAddMemberOpen(false)}
        onConfirm={(memberIds, preset) => tcs.addZoneMembers(spaceId, zoneId, memberIds, preset)}
      />
      <TcsEditMemberPermissionsModal
        locale={locale}
        open={editMember != null}
        assignment={editMember}
        memberName={editingMemberOrg ? tcs.localizeMember(editingMemberOrg) : ''}
        permissionCeiling={spaceMemberCeiling}
        onClose={() => setEditMember(null)}
        onSave={(preset, permissions) => {
          if (!editMember) return
          tcs.updateZoneMember(spaceId, zoneId, editMember.memberId, preset, permissions)
        }}
      />
      {canManageSubSpaces ? (
      <TcsZoneFormModal
        locale={locale}
        open={tcs.zoneFormOpen}
        spaceId={spaceId}
        parentSpace={space}
        editingZone={tcs.editingZone}
        siblingZones={space.zones}
        onClose={tcs.closeZoneForm}
        onSubmit={(sid, draft) => {
          tcs.submitZoneForm(sid, draft)
        }}
      />
      ) : null}
    </section>
  )
}
