import { AccessControlHeader } from '../../components/AccessControlHeader'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { useDepartmentsSectionController } from '../hooks/useDepartmentsSectionController'
import { DepartmentsPanel } from './DepartmentsPanel'
import { DepartmentsManagementModals } from './DepartmentsManagementModals'

/** 部门管理主视图：头部、部门列表与弹窗，不依赖其他访问控制子页面组件 */
export function DepartmentsManagementView() {
  const controller = useDepartmentsSectionController()
  const {
    canManageDepartmentStructure,
    canDeleteDepartmentInManagement,
    canEditDepartmentInManagement,
    canBulkEditDepartmentInManagement,
    canSelectDepartmentsInManagement,
    canAddMemberInDepartmentManagement,
  } = useAccessControlCapabilities()

  return (
    <>
      <AccessControlHeader
        locale={controller.locale}
        section="departments"
        searchQuery={controller.searchQuery}
        onSearchQueryChange={controller.setSearchQuery}
        onBatchCreate={
          canManageDepartmentStructure ? () => controller.setBatchCreateOpen(true) : undefined
        }
        onThirdPartyImport={
          canManageDepartmentStructure ? () => controller.setThirdPartyImportOpen(true) : undefined
        }
        selectedDepartmentCount={
          canSelectDepartmentsInManagement ? controller.selectedDepartmentIds.length : 0
        }
        onEditSelectedDepartments={
          canBulkEditDepartmentInManagement ? controller.handleEditSelectedDepartments : undefined
        }
        onAddMember={
          canManageDepartmentStructure ? () => controller.setAddOpen(true) : undefined
        }
        onAddDepartmentMember={
          canAddMemberInDepartmentManagement
            ? controller.handleOpenAddDepartmentMemberFromHeader
            : undefined
        }
      />

      <section className="ac-section ac-members-section">
        <DepartmentsPanel
          locale={controller.locale}
          departments={controller.departments}
          memberCountById={controller.displayMemberCountById}
          searchQuery={controller.searchQuery}
          selectionClearSignal={controller.selectionClearSignal}
          resolveParentLabel={controller.resolveParentLabel}
          onEdit={
            canEditDepartmentInManagement ? controller.setEditDepartment : undefined
          }
          onAddChild={
            canManageDepartmentStructure ? controller.setAddChildParent : undefined
          }
          onBulkEdit={
            canBulkEditDepartmentInManagement ? controller.setBulkEditIds : undefined
          }
          onSelectionChange={
            canSelectDepartmentsInManagement
              ? controller.handleDepartmentSelectionChange
              : undefined
          }
          enableMultiSelect={canSelectDepartmentsInManagement}
          onRemove={
            canDeleteDepartmentInManagement ? controller.handleRequestRemove : undefined
          }
          onBulkRemove={
            canDeleteDepartmentInManagement ? controller.handleRequestBulkRemove : undefined
          }
          onAddMembers={
            canAddMemberInDepartmentManagement
              ? controller.handleOpenAddDepartmentMember
              : undefined
          }
        />
      </section>

      <DepartmentsManagementModals
        locale={controller.locale}
        departments={controller.departments}
        memberCountById={controller.memberCountById}
        addOpen={controller.addOpen}
        addChildParent={controller.addChildParent}
        batchCreateOpen={controller.batchCreateOpen}
        thirdPartyImportOpen={controller.thirdPartyImportOpen}
        editDepartment={controller.editDepartment}
        bulkEditIds={controller.bulkEditIds}
        pendingRemove={controller.pendingRemove}
        pendingBulkRemoveIds={controller.pendingBulkRemoveIds}
        pendingRemoveMemberCount={controller.pendingRemoveMemberCount}
        onCloseAdd={() => controller.setAddOpen(false)}
        onCloseAddChild={() => controller.setAddChildParent(null)}
        onCloseBatchCreate={() => controller.setBatchCreateOpen(false)}
        onCloseThirdPartyImport={() => controller.setThirdPartyImportOpen(false)}
        onCloseEdit={() => controller.setEditDepartment(null)}
        onCloseBulkEdit={() => controller.setBulkEditIds(null)}
        onClosePendingRemove={() => controller.setPendingRemove(null)}
        onClosePendingBulkRemove={() => controller.setPendingBulkRemoveIds(null)}
        onAddDepartment={controller.handleAddDepartment}
        onBatchCreateDepartments={controller.handleBatchCreateDepartments}
        onSaveDepartment={controller.handleSaveDepartment}
        onBulkEditSave={controller.handleBulkEditSave}
        onDeleteDepartmentsFromBulkEdit={controller.handleDeleteDepartmentsFromBulkEdit}
        onConfirmRemove={controller.handleConfirmRemove}
        onConfirmBulkRemove={controller.handleConfirmBulkRemove}
        orgMembers={controller.orgMembers}
        roles={controller.roles}
        roleOverridesById={controller.roleOverridesById}
        addDepartmentMemberOpen={controller.addDepartmentMemberOpen}
        addDepartmentMemberTarget={controller.addDepartmentMemberTarget}
        onCloseAddDepartmentMember={controller.handleCloseAddDepartmentMember}
        onSaveDepartmentMember={controller.handleSaveDepartmentMember}
        onAddMembersByStructure={controller.handleAddMembersByStructure}
        onInviteFromAddDepartmentMember={controller.handleSwitchToInviteFromAddMember}
        onBatchImportFromAddDepartmentMember={controller.handleSwitchToBatchImportFromAddMember}
        inviteDepartmentMembersOpen={controller.inviteDepartmentMembersOpen}
        onCloseInviteDepartmentMembers={controller.handleCloseInviteDepartmentMembers}
        batchImportMembersOpen={controller.batchImportMembersOpen}
        onCloseBatchImportMembers={controller.handleCloseBatchImportMembers}
      />
    </>
  )
}
