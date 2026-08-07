import { useMemo } from 'react'

import { TeamCollaborationSpaceFormModal } from '../../../team-collaboration-space/components/TeamCollaborationSpaceFormModal'
import type { SpaceFormDraft } from '../../../team-collaboration-space/types'
import '../../../team-collaboration-space/team-collaboration-space.css'
import { AccessControlHeader } from '../../components/AccessControlHeader'
import { AddUserModal, type AddUserPayload } from '../../components/AddUserModal'
import { EditMemberRoleModal } from '../../components/EditMemberRoleModal'
import { RemoveWorkspaceConfirmModal } from '../../components/RemoveWorkspaceConfirmModal'
import { RemoveWorkspaceMembersConfirmModal } from '../../components/RemoveWorkspaceMembersConfirmModal'
import { WorkspacesPanel } from '../../components/WorkspacesPanel'
import { WorkspaceEditDrawer } from '../../components/WorkspaceEditDrawer'
import { WorkspaceMembersDrawer } from '../../components/WorkspaceMembersDrawer'
import { localizeWorkspaceRowName } from '../../data/workspacesSeed'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlDemo } from '../../context/AccessControlDemoProvider'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { workspaceRowsToCopySources } from '../../utils/createWorkspaceFromFormDraft'

/** 访问控制 · 工作区模块 */
export function AccessControlWorkspacePage() {
  const {
    locale,
    searchQuery,
    setSearchQuery,
    inviteOpen,
    setInviteOpen,
    workspaces,
    orgMembers,
    setWorkspaceEditDrawerId,
    workspaceDrawerAddUserOpen,
    setWorkspaceDrawerAddUserOpen,
    workspaceRemoveConfirmIds,
    setWorkspaceRemoveConfirmIds,
    workspacePendingRemove,
    setWorkspacePendingRemove,
    workspaceMembersDrawer,
    setWorkspaceMembersDrawer,
    activeWorkspaceMembers,
    editMemberRole,
    setEditMemberRole,
    editMemberInvite,
    setEditMemberInvite,
    setEditMember,
    memberStatusOverrides,
    roles,
    roleOverridesById,
    addCandidates,
    activeWorkspaceEdit,
    workspaceAddCandidates,
    editInviteCandidates,
    localizeMember,
    handleCreateSpace,
    handleUpdateWorkspaceAccessMode,
    handleOpenWorkspaceEditDrawer,
    handleOpenWorkspaceMembersDrawer,
    handleAddUserToWorkspace,
    handleSaveEditInvite,
    handleRemoveUsersFromWorkspace,
    handleRequestRemoveWorkspace,
    handleConfirmRemoveWorkspace,
    handleSaveMemberRole,
    editingMemberRoleOrg,
  } = useAccessControlDemo()

  const { isAdmin, isManager } = useAccessControlCapabilities()
  const canConfigureAccess = isAdmin || isManager

  const workspaceCopySourceOptions = useMemo(
    () => workspaceRowsToCopySources(workspaces, roles),
    [workspaces, roles],
  )

  const workspaceMembersDrawerOpen = workspaceMembersDrawer != null
  const workspaceEditDrawerOpen = activeWorkspaceEdit != null
  const sideDrawerOpen = workspaceMembersDrawerOpen || workspaceEditDrawerOpen

  const handleCreateWorkspaceSubmit = (draft: SpaceFormDraft) => {
    handleCreateSpace(draft, workspaceCopySourceOptions)
    setInviteOpen(false)
  }

  return (
    <AccessControlSectionShell
      section="workspace"
      locale={locale}
      sideDrawerOpen={sideDrawerOpen}
      workspaceEditDrawerOpen={workspaceEditDrawerOpen}
      sideDrawer={
        <>
          {workspaceMembersDrawerOpen && workspaceMembersDrawer ? (
            <WorkspaceMembersDrawer
              locale={locale}
              workspace={activeWorkspaceMembers ?? workspaceMembersDrawer}
              roles={roles}
              roleOverridesById={roleOverridesById}
              onClose={() => setWorkspaceMembersDrawer(null)}
              onAddUser={() => setWorkspaceDrawerAddUserOpen(true)}
            />
          ) : null}
          {workspaceEditDrawerOpen && activeWorkspaceEdit ? (
            <WorkspaceEditDrawer
              locale={locale}
              workspace={activeWorkspaceEdit}
              roles={roles}
              roleOverridesById={roleOverridesById}
              memberStatusOverrides={memberStatusOverrides}
              onClose={() => {
                setWorkspaceEditDrawerId(null)
                setWorkspaceDrawerAddUserOpen(false)
                setWorkspaceRemoveConfirmIds(null)
                setEditMemberRole(null)
                setEditMemberInvite(null)
                setEditMember(null)
              }}
              onEditMemberRole={({ assignment, roleId }) =>
                setEditMemberRole({ memberId: assignment.memberId, roleId })
              }
              onEditMemberInvite={({ assignment, roleId }) =>
                setEditMemberInvite({ memberId: assignment.memberId, roleId })
              }
              onAddUser={() => setWorkspaceDrawerAddUserOpen(true)}
              onRemoveUser={(memberIds) => setWorkspaceRemoveConfirmIds(memberIds)}
              restrictLockedAdminMembers={isManager && !isAdmin}
            />
          ) : null}
        </>
      }
    >
      <AccessControlHeader
        locale={locale}
        section="workspace"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onInviteUser={() => setInviteOpen(true)}
      />

      <section className="ac-section ac-members-section">
        <WorkspacesPanel
          locale={locale}
          workspaces={workspaces}
          searchQuery={searchQuery}
          onEdit={handleOpenWorkspaceEditDrawer}
          onRemove={handleRequestRemoveWorkspace}
          onOpenMembers={handleOpenWorkspaceMembersDrawer}
          onAccessModeChange={handleUpdateWorkspaceAccessMode}
        />
      </section>

      <TeamCollaborationSpaceFormModal
        locale={locale}
        open={inviteOpen}
        editingSpace={null}
        formSpaceKind="team"
        createTitleKey="modalCreateWorkspaceTitle"
        copySourceOptions={workspaceCopySourceOptions}
        orgMembers={orgMembers}
        showAccessSettings={canConfigureAccess}
        showDeadlineField
        onClose={() => setInviteOpen(false)}
        onSubmit={handleCreateWorkspaceSubmit}
      />

      <RemoveWorkspaceConfirmModal
        locale={locale}
        open={workspacePendingRemove != null}
        workspaceLabel={
          workspacePendingRemove
            ? localizeWorkspaceRowName(workspacePendingRemove, locale)
            : ''
        }
        onClose={() => setWorkspacePendingRemove(null)}
        onConfirm={handleConfirmRemoveWorkspace}
      />
      <RemoveWorkspaceMembersConfirmModal
        locale={locale}
        open={workspaceRemoveConfirmIds != null}
        count={workspaceRemoveConfirmIds?.length ?? 0}
        onClose={() => setWorkspaceRemoveConfirmIds(null)}
        onConfirm={() => {
          if (workspaceRemoveConfirmIds) {
            handleRemoveUsersFromWorkspace(workspaceRemoveConfirmIds)
          }
          setWorkspaceRemoveConfirmIds(null)
        }}
      />
      <AddUserModal
        locale={locale}
        open={workspaceDrawerAddUserOpen}
        candidates={workspaceAddCandidates}
        roles={roles}
        roleOverridesById={roleOverridesById}
        variant="addUser"
        titleKey="inviteUserTitle"
        submitKey="inviteUserSend"
        fixedWorkspaceId={(activeWorkspaceEdit ?? activeWorkspaceMembers)?.id}
        onClose={() => setWorkspaceDrawerAddUserOpen(false)}
        onConfirm={(payload) => {
          handleAddUserToWorkspace(payload as AddUserPayload)
          setWorkspaceDrawerAddUserOpen(false)
        }}
      />
      <AddUserModal
        locale={locale}
        open={editMemberInvite != null}
        candidates={editInviteCandidates}
        roles={roles}
        roleOverridesById={roleOverridesById}
        variant="addUser"
        titleKey="memberActionInvite"
        submitKey="inviteUserSend"
        fixedWorkspaceId={activeWorkspaceEdit?.id}
        fixedWorkspaceLabel={
          activeWorkspaceEdit ? localizeWorkspaceRowName(activeWorkspaceEdit, locale) : undefined
        }
        initialMemberIds={editMemberInvite ? [editMemberInvite.memberId] : undefined}
        initialRoleId={editMemberInvite?.roleId}
        onClose={() => setEditMemberInvite(null)}
        onConfirm={(payload) => {
          if (!editMemberInvite || !('memberIds' in payload)) return
          handleSaveEditInvite(editMemberInvite.memberId, payload)
          setEditMemberInvite(null)
        }}
      />
      <EditMemberRoleModal
        locale={locale}
        open={editMemberRole != null}
        memberId={editMemberRole?.memberId ?? null}
        initialRoleId={editMemberRole?.roleId ?? null}
        memberName={editingMemberRoleOrg ? localizeMember(editingMemberRoleOrg) : ''}
        memberEmail={editingMemberRoleOrg?.email ?? ''}
        workspaceLabel={activeWorkspaceEdit ? localizeWorkspaceRowName(activeWorkspaceEdit, locale) : ''}
        roles={roles}
        roleOverridesById={roleOverridesById}
        onClose={() => setEditMemberRole(null)}
        onSave={handleSaveMemberRole}
      />
    </AccessControlSectionShell>
  )
}
