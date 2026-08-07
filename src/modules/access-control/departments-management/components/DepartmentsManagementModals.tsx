import type { AppLocale } from '../../../../i18n/homeStrings'
import { localizeDepartmentName, type OrgDepartmentRow } from '../data/departmentsSeed'
import {
  AddDepartmentMemberModal,
  type AddDepartmentMemberPayload,
  type AddDepartmentMembersByStructurePayload,
} from '../../members-management/components/AddDepartmentMemberModal'
import { InviteDepartmentMembersModal } from '../../members-management/components/InviteDepartmentMembersModal'
import { BatchImportMembersModal } from '../../members-management/components/BatchImportMembersModal'
import type { WorkspaceRoleRow } from '../../data/workspaceRoles'
import type { OrgMember } from '../../types'
import type { RoleDisplayOverride } from '../../utils/roleDisplay'
import { AddChildDepartmentModal } from './AddChildDepartmentModal'
import { BatchCreateDepartmentsModal } from './BatchCreateDepartmentsModal'
import { BulkEditDepartmentsModal } from './BulkEditDepartmentsModal'
import { AddDepartmentModal } from './AddDepartmentModal'
import { EditDepartmentModal } from './EditDepartmentModal'
import { RemoveDepartmentConfirmModal } from './RemoveDepartmentConfirmModal'
import { ThirdPartyImportDepartmentsModal } from './ThirdPartyImportDepartmentsModal'
import type {
  DepartmentBulkEditPayload,
  DepartmentEditSavePayload,
  DepartmentFormSavePayload,
} from '../hooks/useDepartmentsSectionController'

type DepartmentsManagementModalsProps = {
  locale: AppLocale
  departments: OrgDepartmentRow[]
  memberCountById: Map<string, number>
  addOpen: boolean
  addChildParent: OrgDepartmentRow | null
  batchCreateOpen: boolean
  thirdPartyImportOpen: boolean
  editDepartment: OrgDepartmentRow | null
  bulkEditIds: string[] | null
  pendingRemove: OrgDepartmentRow | null
  pendingBulkRemoveIds: string[] | null
  pendingRemoveMemberCount: number
  onCloseAdd: () => void
  onCloseAddChild: () => void
  onCloseBatchCreate: () => void
  onCloseThirdPartyImport: () => void
  onCloseEdit: () => void
  onCloseBulkEdit: () => void
  onClosePendingRemove: () => void
  onClosePendingBulkRemove: () => void
  onAddDepartment: (payload: DepartmentFormSavePayload) => void
  onBatchCreateDepartments: (payloads: DepartmentFormSavePayload[]) => void
  onSaveDepartment: (departmentId: string, payload: DepartmentEditSavePayload) => void
  onBulkEditSave: (departmentIds: string[], payload: DepartmentBulkEditPayload) => void
  onDeleteDepartmentsFromBulkEdit: (departmentIds: string[]) => void
  onConfirmRemove: () => void
  onConfirmBulkRemove: () => void
  orgMembers?: OrgMember[]
  roles?: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  addDepartmentMemberOpen?: boolean
  addDepartmentMemberTarget?: OrgDepartmentRow | null
  onCloseAddDepartmentMember?: () => void
  onSaveDepartmentMember?: (payload: AddDepartmentMemberPayload) => void
  onAddMembersByStructure?: (payload: AddDepartmentMembersByStructurePayload) => void
  onInviteFromAddDepartmentMember?: () => void
  onBatchImportFromAddDepartmentMember?: () => void
  inviteDepartmentMembersOpen?: boolean
  onCloseInviteDepartmentMembers?: () => void
  batchImportMembersOpen?: boolean
  onCloseBatchImportMembers?: () => void
}

export function DepartmentsManagementModals({
  locale,
  departments,
  memberCountById,
  addOpen,
  addChildParent,
  batchCreateOpen,
  thirdPartyImportOpen,
  editDepartment,
  bulkEditIds,
  pendingRemove,
  pendingBulkRemoveIds,
  pendingRemoveMemberCount,
  onCloseAdd,
  onCloseAddChild,
  onCloseBatchCreate,
  onCloseThirdPartyImport,
  onCloseEdit,
  onCloseBulkEdit,
  onClosePendingRemove,
  onClosePendingBulkRemove,
  onAddDepartment,
  onBatchCreateDepartments,
  onSaveDepartment,
  onBulkEditSave,
  onDeleteDepartmentsFromBulkEdit,
  onConfirmRemove,
  onConfirmBulkRemove,
  orgMembers = [],
  roles = [],
  roleOverridesById,
  addDepartmentMemberOpen = false,
  addDepartmentMemberTarget = null,
  onCloseAddDepartmentMember,
  onSaveDepartmentMember,
  onAddMembersByStructure,
  onInviteFromAddDepartmentMember,
  onBatchImportFromAddDepartmentMember,
  inviteDepartmentMembersOpen = false,
  onCloseInviteDepartmentMembers,
  batchImportMembersOpen = false,
  onCloseBatchImportMembers,
}: DepartmentsManagementModalsProps) {
  return (
    <>
      <ThirdPartyImportDepartmentsModal
        locale={locale}
        open={thirdPartyImportOpen}
        onClose={onCloseThirdPartyImport}
      />
      <BatchCreateDepartmentsModal
        locale={locale}
        open={batchCreateOpen}
        onClose={onCloseBatchCreate}
        onCreate={onBatchCreateDepartments}
      />
      <AddChildDepartmentModal
        locale={locale}
        open={addChildParent != null}
        parentDepartment={addChildParent}
        onClose={onCloseAddChild}
        onSave={onAddDepartment}
      />
      <AddDepartmentModal
        locale={locale}
        open={addOpen}
        onClose={onCloseAdd}
        onSave={onAddDepartment}
      />
      <BulkEditDepartmentsModal
        locale={locale}
        open={bulkEditIds != null && bulkEditIds.length > 0}
        departments={departments}
        memberCountById={memberCountById}
        selectedIds={bulkEditIds ?? []}
        onClose={onCloseBulkEdit}
        onSave={onBulkEditSave}
        onDelete={onDeleteDepartmentsFromBulkEdit}
      />
      <EditDepartmentModal
        locale={locale}
        open={editDepartment != null}
        department={editDepartment}
        departments={departments}
        onClose={onCloseEdit}
        onSave={(payload) => {
          if (!editDepartment) return
          onSaveDepartment(editDepartment.id, payload)
        }}
      />
      <RemoveDepartmentConfirmModal
        locale={locale}
        open={pendingRemove != null}
        departmentLabel={
          pendingRemove ? localizeDepartmentName(pendingRemove, locale) : ''
        }
        memberCount={pendingRemoveMemberCount}
        onClose={onClosePendingRemove}
        onConfirm={onConfirmRemove}
      />
      <RemoveDepartmentConfirmModal
        locale={locale}
        open={pendingBulkRemoveIds != null && pendingBulkRemoveIds.length > 0}
        bulkCount={pendingBulkRemoveIds?.length ?? 0}
        onClose={onClosePendingBulkRemove}
        onConfirm={onConfirmBulkRemove}
      />
      {onCloseAddDepartmentMember && onSaveDepartmentMember ? (
        <AddDepartmentMemberModal
          locale={locale}
          open={addDepartmentMemberOpen}
          department={addDepartmentMemberTarget}
          departments={departments}
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
          department={addDepartmentMemberTarget}
          onClose={onCloseInviteDepartmentMembers}
        />
      ) : null}
      {onCloseBatchImportMembers ? (
        <BatchImportMembersModal
          locale={locale}
          open={batchImportMembersOpen}
          onClose={onCloseBatchImportMembers}
        />
      ) : null}
    </>
  )
}
