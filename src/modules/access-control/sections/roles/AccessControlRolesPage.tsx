import { AccessControlHeader } from '../../components/AccessControlHeader'
import { BatchSelectUsersModal } from '../../components/BatchSelectUsersModal'
import { AddRoleModal, EditRoleModal } from '../../components/EditRoleModal'
import { RemoveRoleConfirmModal } from '../../components/RemoveRoleConfirmModal'
import { RoleAssignedUsersDrawer } from '../../components/RoleAssignedUsersDrawer'
import { RolePermissionsDrawer } from '../../components/RolePermissionsDrawer'
import { RolesPanel } from '../../components/RolesPanel'
import { WORKSPACE_OPTIONS } from '../../data/orgMembersCatalog'
import { canActorMutateWorkspaceRole } from '../../data/workspaceRoles'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { resolveRoleLabel } from '../../utils/roleDisplay'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlDemo } from '../../context/AccessControlDemoProvider'

/** 访问控制 · 角色模块 */
export function AccessControlRolesPage() {
  const {
    locale,
    searchQuery,
    setSearchQuery,
    addRoleOpen,
    setAddRoleOpen,
    editRole,
    setEditRole,
    rolePendingRemove,
    setRolePendingRemove,
    roles,
    rolesDrawer,
    setRolesDrawer,
    roleAssignedUsersAddUserOpen,
    setRoleAssignedUsersAddUserOpen,
    catalogGrantsByRoleId,
    roleOverridesById,
    assignedUsersRole,
    roleAssignedAddCandidates,
    handleSaveCatalogGrants,
    handleSaveRole,
    handleAddRole,
    handleRequestRemoveRole,
    handleConfirmRemoveRole,
    handleAddUser,
    handleRemoveUserFromRole,
  } = useAccessControlDemo()

  const {
    role: actorRole,
    canCreateRole,
    canEditRole,
    canDeleteRole,
    canEditBuiltinRole,
    canAddMemberInRoleManagement,
    canRemoveMemberInRoleManagement,
  } = useAccessControlCapabilities()

  const canMutateRoleRow = (role: { id: string }) =>
    canActorMutateWorkspaceRole(actorRole, role.id, canEditBuiltinRole)

  const permissionsDrawerOpen = rolesDrawer?.type === 'permissions'
  const assignedUsersDrawerOpen = rolesDrawer?.type === 'assigned-users'
  const sideDrawerOpen = permissionsDrawerOpen || assignedUsersDrawerOpen

  return (
    <AccessControlSectionShell
      section="roles"
      locale={locale}
      sideDrawerOpen={sideDrawerOpen}
      sideDrawer={
        <>
          {permissionsDrawerOpen && rolesDrawer ? (
            <RolePermissionsDrawer
              locale={locale}
              role={rolesDrawer.role}
              grantedIds={catalogGrantsByRoleId[rolesDrawer.role.id] ?? []}
              onClose={() => setRolesDrawer(null)}
              onSave={(grantedIds) => handleSaveCatalogGrants(rolesDrawer.role.id, grantedIds)}
            />
          ) : null}
          {assignedUsersDrawerOpen && assignedUsersRole ? (
            <RoleAssignedUsersDrawer
              locale={locale}
              role={assignedUsersRole}
              onClose={() => {
                setRoleAssignedUsersAddUserOpen(false)
                setRolesDrawer(null)
              }}
              onAddUser={
                canAddMemberInRoleManagement ? () => setRoleAssignedUsersAddUserOpen(true) : undefined
              }
              onRemoveUser={
                canRemoveMemberInRoleManagement
                  ? (memberId) => handleRemoveUserFromRole(assignedUsersRole.id, memberId)
                  : undefined
              }
            />
          ) : null}
        </>
      }
    >
      <AccessControlHeader
        locale={locale}
        section="roles"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onAddMember={canCreateRole ? () => setAddRoleOpen(true) : undefined}
      />

      <section className="ac-section ac-members-section">
        <RolesPanel
          locale={locale}
          roles={roles}
          searchQuery={searchQuery}
          catalogGrantsByRoleId={catalogGrantsByRoleId}
          roleOverridesById={roleOverridesById}
          allowBuiltinRoleMutation={canEditBuiltinRole}
          canMutateRole={canMutateRoleRow}
          onEdit={
            canEditRole
              ? (role) => {
                  if (!canMutateRoleRow(role)) return
                  setEditRole(role)
                }
              : undefined
          }
          onRemove={canDeleteRole ? handleRequestRemoveRole : undefined}
          onOpenPermissions={
            canEditRole
              ? (role) => {
                  if (!canMutateRoleRow(role)) return
                  setRolesDrawer({ type: 'permissions', role })
                }
              : undefined
          }
          onOpenAssignedUsers={
            canAddMemberInRoleManagement
              ? (role) => {
                  if (!canMutateRoleRow(role)) return
                  setRolesDrawer({ type: 'assigned-users', role })
                }
              : undefined
          }
          onAddUser={
            canAddMemberInRoleManagement
              ? (role) => {
                  if (!canMutateRoleRow(role)) return
                  setRolesDrawer({ type: 'assigned-users', role })
                  setRoleAssignedUsersAddUserOpen(true)
                }
              : undefined
          }
        />
      </section>

      <AddRoleModal
        locale={locale}
        open={addRoleOpen}
        onClose={() => setAddRoleOpen(false)}
        onSave={handleAddRole}
      />
      <EditRoleModal
        locale={locale}
        open={editRole != null}
        role={editRole}
        roleOverride={editRole ? roleOverridesById[editRole.id] : undefined}
        grantedIds={editRole ? (catalogGrantsByRoleId[editRole.id] ?? []) : []}
        onClose={() => setEditRole(null)}
        onSave={(payload) => {
          if (!editRole) return
          handleSaveRole(editRole.id, payload)
        }}
      />
      <RemoveRoleConfirmModal
        locale={locale}
        open={rolePendingRemove != null}
        roleLabel={
          rolePendingRemove
            ? resolveRoleLabel(rolePendingRemove, roleOverridesById[rolePendingRemove.id])
            : ''
        }
        onClose={() => setRolePendingRemove(null)}
        onConfirm={handleConfirmRemoveRole}
      />
      <BatchSelectUsersModal
        locale={locale}
        open={roleAssignedUsersAddUserOpen}
        candidates={roleAssignedAddCandidates}
        onClose={() => setRoleAssignedUsersAddUserOpen(false)}
        onSave={(memberIds) => {
          if (!assignedUsersRole || memberIds.length === 0) return
          handleAddUser({
            memberIds,
            roleId: assignedUsersRole.id,
            workspaceId: WORKSPACE_OPTIONS[0]?.id ?? '',
          })
          setRoleAssignedUsersAddUserOpen(false)
        }}
      />
    </AccessControlSectionShell>
  )
}
