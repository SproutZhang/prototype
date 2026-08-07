import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { ThirdPartyImportDepartmentsModal } from '../../departments-management/components/ThirdPartyImportDepartmentsModal'
import { BatchCreateDepartmentsModal } from '../../departments-management/components/BatchCreateDepartmentsModal'
import { AddChildDepartmentModal } from '../../departments-management/components/AddChildDepartmentModal'
import { AddDepartmentModal } from '../../departments-management/components/AddDepartmentModal'
import { EditDepartmentModal } from '../../departments-management/components/EditDepartmentModal'
import { RemoveDepartmentConfirmModal } from '../../departments-management/components/RemoveDepartmentConfirmModal'
import {
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../../departments-management/data/departmentsSeed'
import type {
  DepartmentEditSavePayload,
  DepartmentFormSavePayload,
} from '../../departments-management/hooks/useDepartmentsSectionController'
import { CreateNewUserModal } from '../../components/CreateNewUserModal'
import { EditMemberStatusModal } from '../../components/EditMemberStatusModal'
import { RemoveMemberConfirmModal } from '../../components/RemoveMemberConfirmModal'
import type { WorkspaceRoleRow } from '../../data/workspaceRoles'
import type { RoleDisplayOverride } from '../../utils/roleDisplay'
import type { MockMemberStatus } from '../../utils/memberTableDisplay'
import type { MemberAssignment, OrgMember } from '../../types'
import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { CreateNewUserPayload } from '../../components/CreateNewUserModal'
import {
  AddDepartmentMemberModal,
  type AddDepartmentMemberPayload,
  type AddDepartmentMembersByStructurePayload,
} from './AddDepartmentMemberModal'
import { InviteDepartmentMembersModal } from './InviteDepartmentMembersModal'
import { BatchImportMembersModal } from './BatchImportMembersModal'
import { BatchExportMembersModal } from './BatchExportMembersModal'
import { BatchDisableMembersConfirmModal } from './BatchDisableMembersConfirmModal'
import { BatchDeleteMembersConfirmModal } from './BatchDeleteMembersConfirmModal'
import { SelectParentDepartmentModal } from '../../departments-management/components/SelectParentDepartmentModal'
import { BatchSelectUsersModal } from '../../components/BatchSelectUsersModal'

type MembersManagementModalsProps = {
  locale: AppLocale
  roles: WorkspaceRoleRow[]
  roleOverridesById: Record<string, RoleDisplayOverride>
  createNewUserOpen: boolean
  editMember: MemberAssignment | null
  memberPendingRemove: string | null
  editingMemberOrg: OrgMember | null | undefined
  editingMemberRoleLabel: string
  editingMemberStatus: MockMemberStatus
  pendingRemoveMemberOrg: OrgMember | null | undefined
  localizeMember: (member: OrgMember) => string
  resolveMemberWorkspaceLabelForMember: (memberId: string) => string
  onCloseCreateNewUser: () => void
  onCloseEditMember: () => void
  onClosePendingRemove: () => void
  onCreateNewUser: (payload: CreateNewUserPayload) => void
  onSaveMemberStatus: (memberId: string, status: MockMemberStatus) => void
  onConfirmRemoveMember: () => void
  editDepartment?: OrgDepartmentRow | null
  addChildParent?: OrgDepartmentRow | null
  addDepartmentOpen?: boolean
  orgDepartments?: OrgDepartmentRow[]
  onCloseEditDepartment?: () => void
  onSaveDepartment?: (departmentId: string, payload: DepartmentEditSavePayload) => void
  onCloseAddChildDepartment?: () => void
  onSaveAddChildDepartment?: (payload: DepartmentFormSavePayload) => void
  onCloseAddDepartment?: () => void
  onSaveAddDepartment?: (payload: DepartmentFormSavePayload) => void
  pendingRemoveDepartment?: OrgDepartmentRow | null
  pendingRemoveDepartmentMemberCount?: number
  onClosePendingRemoveDepartment?: () => void
  onConfirmRemoveDepartment?: () => void
  addDepartmentMemberOpen?: boolean
  addDepartmentMemberDepartment?: OrgDepartmentRow | null
  orgMembers?: OrgMember[]
  onCloseAddDepartmentMember?: () => void
  onSaveDepartmentMember?: (payload: AddDepartmentMemberPayload) => void
  onAddMembersByStructure?: (payload: AddDepartmentMembersByStructurePayload) => void
  onInviteFromAddDepartmentMember?: () => void
  onBatchImportFromAddDepartmentMember?: () => void
  inviteDepartmentMembersOpen?: boolean
  inviteDepartmentMemberDepartment?: OrgDepartmentRow | null
  onCloseInviteDepartmentMembers?: () => void
  thirdPartyImportOpen?: boolean
  onCloseThirdPartyImport?: () => void
  batchCreateDepartmentsOpen?: boolean
  onCloseBatchCreateDepartments?: () => void
  onBatchCreateDepartments?: (payloads: DepartmentFormSavePayload[]) => void
  batchImportOpen?: boolean
  onCloseBatchImport?: () => void
  batchExportOpen?: boolean
  onCloseBatchExport?: () => void
  batchDisableConfirmOpen?: boolean
  batchDisableMemberCount?: number
  onCloseBatchDisableConfirm?: () => void
  onConfirmBatchDisable?: () => void
  batchDeleteConfirmOpen?: boolean
  batchDeleteMemberCount?: number
  onCloseBatchDeleteConfirm?: () => void
  onConfirmBatchDelete?: () => void
  batchAdjustDepartmentOpen?: boolean
  batchAdjustMemberCount?: number
  onCloseBatchAdjustDepartment?: () => void
  onConfirmBatchAdjustDepartment?: (departmentId: string) => void
  transferDepartmentManagerOpen?: boolean
  transferDepartmentManagerCandidates?: OrgMember[]
  onCloseTransferDepartmentManager?: () => void
  onConfirmTransferDepartmentManager?: (memberId: string) => void
}

export function MembersManagementModals({
  locale,
  roles,
  roleOverridesById,
  createNewUserOpen,
  editMember,
  memberPendingRemove,
  editingMemberOrg,
  editingMemberRoleLabel,
  editingMemberStatus,
  pendingRemoveMemberOrg,
  localizeMember,
  resolveMemberWorkspaceLabelForMember,
  onCloseCreateNewUser,
  onCloseEditMember,
  onClosePendingRemove,
  onCreateNewUser,
  onSaveMemberStatus,
  onConfirmRemoveMember,
  editDepartment = null,
  addChildParent = null,
  addDepartmentOpen = false,
  orgDepartments = [],
  onCloseEditDepartment,
  onSaveDepartment,
  onCloseAddChildDepartment,
  onSaveAddChildDepartment,
  onCloseAddDepartment,
  onSaveAddDepartment,
  pendingRemoveDepartment = null,
  pendingRemoveDepartmentMemberCount = 0,
  onClosePendingRemoveDepartment,
  onConfirmRemoveDepartment,
  addDepartmentMemberOpen = false,
  addDepartmentMemberDepartment = null,
  orgMembers = [],
  onCloseAddDepartmentMember,
  onSaveDepartmentMember,
  onAddMembersByStructure,
  onInviteFromAddDepartmentMember,
  onBatchImportFromAddDepartmentMember,
  inviteDepartmentMembersOpen = false,
  inviteDepartmentMemberDepartment = null,
  onCloseInviteDepartmentMembers,
  thirdPartyImportOpen = false,
  onCloseThirdPartyImport,
  batchCreateDepartmentsOpen = false,
  onCloseBatchCreateDepartments,
  onBatchCreateDepartments,
  batchImportOpen = false,
  onCloseBatchImport,
  batchExportOpen = false,
  onCloseBatchExport,
  batchDisableConfirmOpen = false,
  batchDisableMemberCount = 0,
  onCloseBatchDisableConfirm,
  onConfirmBatchDisable,
  batchDeleteConfirmOpen = false,
  batchDeleteMemberCount = 0,
  onCloseBatchDeleteConfirm,
  onConfirmBatchDelete,
  batchAdjustDepartmentOpen = false,
  batchAdjustMemberCount = 0,
  onCloseBatchAdjustDepartment,
  onConfirmBatchAdjustDepartment,
  transferDepartmentManagerOpen = false,
  transferDepartmentManagerCandidates = [],
  onCloseTransferDepartmentManager,
  onConfirmTransferDepartmentManager,
}: MembersManagementModalsProps) {
  const { canEditDepartmentInMembers } = useAccessControlCapabilities()

  const handleSaveDepartment = (payload: DepartmentEditSavePayload) => {
    if (!editDepartment || !onSaveDepartment) {
      onCloseEditDepartment?.()
      return
    }
    onSaveDepartment(editDepartment.id, payload)
  }

  const handleAddChildDepartment = (payload: DepartmentFormSavePayload) => {
    if (!addChildParent || !onSaveAddChildDepartment) {
      onCloseAddChildDepartment?.()
      return
    }
    onSaveAddChildDepartment(payload)
  }

  return (
    <>
      <CreateNewUserModal
        locale={locale}
        open={createNewUserOpen}
        roles={roles}
        roleOverridesById={roleOverridesById}
        onClose={onCloseCreateNewUser}
        onConfirm={onCreateNewUser}
      />
      <EditMemberStatusModal
        locale={locale}
        open={editMember != null}
        assignment={editMember}
        memberName={editingMemberOrg ? localizeMember(editingMemberOrg) : ''}
        memberEmail={editingMemberOrg?.email ?? ''}
        roleLabel={editingMemberRoleLabel}
        workspaceLabel={editMember ? resolveMemberWorkspaceLabelForMember(editMember.memberId) : ''}
        initialStatus={editingMemberStatus}
        onClose={onCloseEditMember}
        onSave={({ memberId, status }) => onSaveMemberStatus(memberId, status)}
      />
      <RemoveMemberConfirmModal
        locale={locale}
        open={memberPendingRemove != null}
        memberName={
          pendingRemoveMemberOrg ? localizeMember(pendingRemoveMemberOrg) : memberPendingRemove ?? ''
        }
        onClose={onClosePendingRemove}
        onConfirm={onConfirmRemoveMember}
      />
      {onCloseEditDepartment ? (
        <EditDepartmentModal
          locale={locale}
          open={editDepartment != null}
          department={editDepartment}
          departments={orgDepartments}
          limitedEdit={!canEditDepartmentInMembers}
          onClose={onCloseEditDepartment}
          onSave={handleSaveDepartment}
        />
      ) : null}
      {onCloseAddChildDepartment ? (
        <AddChildDepartmentModal
          locale={locale}
          open={addChildParent != null}
          parentDepartment={addChildParent}
          variant="minimal"
          onClose={onCloseAddChildDepartment}
          onSave={handleAddChildDepartment}
        />
      ) : null}
      {onCloseAddDepartment ? (
        <AddDepartmentModal
          locale={locale}
          open={addDepartmentOpen}
          onClose={onCloseAddDepartment}
          onSave={(payload) => onSaveAddDepartment?.(payload)}
        />
      ) : null}
      {onClosePendingRemoveDepartment && onConfirmRemoveDepartment ? (
        <RemoveDepartmentConfirmModal
          locale={locale}
          open={pendingRemoveDepartment != null}
          departmentLabel={
            pendingRemoveDepartment
              ? localizeDepartmentName(pendingRemoveDepartment, locale)
              : ''
          }
          memberCount={pendingRemoveDepartmentMemberCount}
          onClose={onClosePendingRemoveDepartment}
          onConfirm={onConfirmRemoveDepartment}
        />
      ) : null}
      {onCloseAddDepartmentMember && onSaveDepartmentMember ? (
        <AddDepartmentMemberModal
          locale={locale}
          open={addDepartmentMemberOpen}
          department={addDepartmentMemberDepartment}
          departments={orgDepartments}
          orgMembers={orgMembers}
          roles={roles}
          roleOverridesById={roleOverridesById}
          onClose={onCloseAddDepartmentMember}
          onSave={onSaveDepartmentMember}
          onAddByStructure={onAddMembersByStructure}
          onInviteMembers={onInviteFromAddDepartmentMember}
          onBatchImport={onBatchImportFromAddDepartmentMember}
        />
      ) : null}
      {onCloseInviteDepartmentMembers ? (
        <InviteDepartmentMembersModal
          locale={locale}
          open={inviteDepartmentMembersOpen}
          department={inviteDepartmentMemberDepartment}
          onClose={onCloseInviteDepartmentMembers}
        />
      ) : null}
      {onCloseThirdPartyImport ? (
        <ThirdPartyImportDepartmentsModal
          locale={locale}
          open={thirdPartyImportOpen}
          onClose={onCloseThirdPartyImport}
        />
      ) : null}
      {onCloseBatchCreateDepartments && onBatchCreateDepartments ? (
        <BatchCreateDepartmentsModal
          locale={locale}
          open={batchCreateDepartmentsOpen}
          onClose={onCloseBatchCreateDepartments}
          onCreate={onBatchCreateDepartments}
        />
      ) : null}
      {onCloseBatchImport ? (
        <BatchImportMembersModal
          locale={locale}
          open={batchImportOpen}
          onClose={onCloseBatchImport}
        />
      ) : null}
      {onCloseBatchExport ? (
        <BatchExportMembersModal
          locale={locale}
          open={batchExportOpen}
          onClose={onCloseBatchExport}
        />
      ) : null}
      {onCloseBatchDisableConfirm && onConfirmBatchDisable ? (
        <BatchDisableMembersConfirmModal
          locale={locale}
          open={batchDisableConfirmOpen}
          count={batchDisableMemberCount}
          onClose={onCloseBatchDisableConfirm}
          onConfirm={onConfirmBatchDisable}
        />
      ) : null}
      {onCloseBatchDeleteConfirm && onConfirmBatchDelete ? (
        <BatchDeleteMembersConfirmModal
          locale={locale}
          open={batchDeleteConfirmOpen}
          count={batchDeleteMemberCount}
          onClose={onCloseBatchDeleteConfirm}
          onConfirm={onConfirmBatchDelete}
        />
      ) : null}
      {onCloseBatchAdjustDepartment && onConfirmBatchAdjustDepartment ? (
        <SelectParentDepartmentModal
          locale={locale}
          open={batchAdjustDepartmentOpen}
          departments={orgDepartments}
          excludeIds={[]}
          value=""
          titleKey="memberBatchAdjustDepartmentTitle"
          confirmKey="memberBatchAdjustDepartmentConfirm"
          hintMessage={acT(locale, 'memberBatchAdjustDepartmentHint').replace(
            '{count}',
            String(batchAdjustMemberCount),
          )}
          onClose={onCloseBatchAdjustDepartment}
          onConfirm={onConfirmBatchAdjustDepartment}
        />
      ) : null}
      {onCloseTransferDepartmentManager && onConfirmTransferDepartmentManager ? (
        <BatchSelectUsersModal
          locale={locale}
          open={transferDepartmentManagerOpen}
          candidates={transferDepartmentManagerCandidates}
          singleSelect
          membersOnly
          titleKey="transferDepartmentManagerTitle"
          onClose={onCloseTransferDepartmentManager}
          onSave={(memberIds) => {
            const nextManagerId = memberIds[0]
            if (!nextManagerId) return
            onConfirmTransferDepartmentManager(nextManagerId)
          }}
        />
      ) : null}
    </>
  )
}
