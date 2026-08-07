import { useEffect } from 'react'

import { AccessControlHeader } from '../../components/AccessControlHeader'
import { AddUserModal, type AddUserPayload } from '../../components/AddUserModal'
import { CreateNewUserModal } from '../../components/CreateNewUserModal'
import { EditMemberStatusModal } from '../../components/EditMemberStatusModal'
import { MembersPanel } from '../../components/MembersPanel'
import { RemoveMemberConfirmModal } from '../../components/RemoveMemberConfirmModal'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlDemo } from '../../context/AccessControlDemoProvider'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { resolveRoleLabel } from '../../utils/roleDisplay'
import { navigateAccessControlSection } from '../../utils/routing'

/** 访问控制 · 用户模块（Admin） */
export function AccessControlUsersPage() {
  const {
    locale,
    members,
    searchQuery,
    setSearchQuery,
    createNewUserOpen,
    setCreateNewUserOpen,
    inviteOpen,
    setInviteOpen,
    editMember,
    setEditMember,
    memberStatusOverrides,
    memberPendingRemove,
    setMemberPendingRemove,
    roles,
    roleOverridesById,
    orgMembers,
    addCandidates,
    localizeMember,
    localizeMemberDept,
    handleAddUser,
    handleCreateNewUser,
    handleRequestRemoveMember,
    handleConfirmRemoveMember,
    handleSaveMemberStatus,
    editingMemberOrg,
    editingMemberRole,
    editingMemberStatus,
    resolveMemberWorkspaceLabelForMember,
    pendingRemoveMemberOrg,
  } = useAccessControlDemo()
  const { canViewUsersManagement } = useAccessControlCapabilities()

  useEffect(() => {
    if (!canViewUsersManagement) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewUsersManagement])

  if (!canViewUsersManagement) return null

  return (
    <AccessControlSectionShell section="users" locale={locale} sideDrawerOpen={false}>
      <AccessControlHeader
        locale={locale}
        section="users"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onAddMember={() => setCreateNewUserOpen(true)}
        onInviteUser={() => setInviteOpen(true)}
      />

      <section className="ac-section ac-members-section">
        <MembersPanel
          locale={locale}
          members={members}
          orgMembers={orgMembers}
          workspaceRoles={roles}
          roleOverridesById={roleOverridesById}
          searchQuery={searchQuery}
          memberStatusOverrides={memberStatusOverrides}
          showAddButton={false}
          localizeMember={localizeMember}
          localizeMemberDept={localizeMemberDept}
          onAdd={() => setCreateNewUserOpen(true)}
          onEdit={setEditMember}
          onRemove={handleRequestRemoveMember}
        />
      </section>

      <CreateNewUserModal
        locale={locale}
        open={createNewUserOpen}
        roles={roles}
        roleOverridesById={roleOverridesById}
        onClose={() => setCreateNewUserOpen(false)}
        onConfirm={handleCreateNewUser}
      />
      <AddUserModal
        locale={locale}
        open={inviteOpen}
        candidates={addCandidates}
        roles={roles}
        roleOverridesById={roleOverridesById}
        variant="addUser"
        titleKey="inviteUserTitle"
        submitKey="inviteUserSend"
        onClose={() => setInviteOpen(false)}
        onConfirm={(payload) => handleAddUser(payload as AddUserPayload)}
      />
      <EditMemberStatusModal
        locale={locale}
        open={editMember != null}
        assignment={editMember}
        memberName={editingMemberOrg ? localizeMember(editingMemberOrg) : ''}
        memberEmail={editingMemberOrg?.email ?? ''}
        roleLabel={
          editingMemberRole
            ? resolveRoleLabel(editingMemberRole, roleOverridesById[editingMemberRole.id])
            : ''
        }
        workspaceLabel={editMember ? resolveMemberWorkspaceLabelForMember(editMember.memberId) : ''}
        initialStatus={editingMemberStatus}
        onClose={() => setEditMember(null)}
        onSave={({ memberId, status }) => handleSaveMemberStatus(memberId, status)}
      />
      <RemoveMemberConfirmModal
        locale={locale}
        open={memberPendingRemove != null}
        memberName={
          pendingRemoveMemberOrg ? localizeMember(pendingRemoveMemberOrg) : memberPendingRemove ?? ''
        }
        onClose={() => setMemberPendingRemove(null)}
        onConfirm={handleConfirmRemoveMember}
      />
    </AccessControlSectionShell>
  )
}
