import { useEffect, useState } from 'react'

import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { AccessControlHeader } from '../../components/AccessControlHeader'
import { MembersPanel } from '../../components/MembersPanel'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  localizeOrgRootLabel,
  ORG_ROOT_PARENT_ID,
} from '../../departments-management/data/departmentsSeed'
import { navigateMemberAddApplyRecords } from '../../utils/routing'
import { useMembersSectionController } from '../hooks/useMembersSectionController'
import { DepartmentMembersPanelHeader } from './DepartmentMembersPanelHeader'
import { MembersManagementModals } from './MembersManagementModals'
import { OrgDepartmentsSidebar } from './OrgDepartmentsSidebar'

/** 成员管理主视图：左侧组织架构、右侧成员列表与弹窗 */
export function MembersManagementView() {
  const controller = useMembersSectionController()
  const {
    canCreateChildDepartment,
    canDeleteInMembersManagement,
    canEditDepartmentInMembers,
    canEditDepartmentInMembersSidebar,
  } = useAccessControlCapabilities()
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [batchImportOpen, setBatchImportOpen] = useState(false)
  const [batchExportOpen, setBatchExportOpen] = useState(false)
  const [batchDisableConfirmOpen, setBatchDisableConfirmOpen] = useState(false)
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false)
  const [batchAdjustDepartmentOpen, setBatchAdjustDepartmentOpen] = useState(false)
  const [externalBatchHint, setExternalBatchHint] = useState<{
    message: string
    variant: 'warning' | 'success'
  } | null>(null)

  useEffect(() => {
    if (!externalBatchHint) return
    const timer = window.setTimeout(() => setExternalBatchHint(null), 3000)
    return () => window.clearTimeout(timer)
  }, [externalBatchHint])

  useEffect(() => {
    const hint = controller.departmentManagerTransferHint
    if (!hint) return
    setExternalBatchHint({
      message: acT(controller.locale, 'transferDepartmentManagerSuccess').replace('{name}', hint),
      variant: 'success',
    })
    controller.setDepartmentManagerTransferHint(null)
  }, [controller.departmentManagerTransferHint, controller.locale, controller.setDepartmentManagerTransferHint])

  const handleConfirmBatchDisable = () => {
    const disabledCount = controller.handleBatchDisableMembers(selectedMemberIds)
    setBatchDisableConfirmOpen(false)
    if (disabledCount > 0) {
      setExternalBatchHint({
        message: acT(controller.locale, 'memberBatchDisableSuccess').replace(
          '{count}',
          String(disabledCount),
        ),
        variant: 'success',
      })
    } else {
      setExternalBatchHint({
        message: acT(controller.locale, 'memberBatchDisableNone'),
        variant: 'warning',
      })
    }
  }

  const handleConfirmBatchDelete = () => {
    const deletedCount = controller.handleBatchRemoveMembers(selectedMemberIds)
    setBatchDeleteConfirmOpen(false)
    setSelectedMemberIds([])
    if (deletedCount > 0) {
      setExternalBatchHint({
        message: acT(controller.locale, 'memberBatchDeleteDirectSuccess').replace(
          '{count}',
          String(deletedCount),
        ),
        variant: 'success',
      })
    }
  }

  const handleConfirmBatchAdjustDepartment = (targetDepartmentId: string) => {
    const transferredCount = controller.handleBatchAdjustMemberDepartments(
      selectedMemberIds,
      targetDepartmentId,
    )
    setBatchAdjustDepartmentOpen(false)
    if (transferredCount > 0) {
      const department = controller.orgDepartments.find((item) => item.id === targetDepartmentId)
      const departmentName = department
        ? localizeDepartmentName(department, controller.locale)
        : ''
      setExternalBatchHint({
        message: acT(controller.locale, 'memberBatchAdjustDepartmentSuccess')
          .replace('{count}', String(transferredCount))
          .replace('{department}', departmentName),
        variant: 'success',
      })
    }
  }

  const showOrgCompanyMembers = controller.isOrgRootSelected
  const showDepartmentMembers =
    controller.selectedDepartment != null &&
    !controller.isOrgRootSelected &&
    controller.orgDepartmentRoots.length > 0
  const orgRootLabel = localizeOrgRootLabel(controller.locale)

  return (
    <>
      <AccessControlHeader
        locale={controller.locale}
        section="members"
        searchQuery={controller.membersSearchQuery}
        onSearchQueryChange={controller.setMembersSearchQuery}
      />

      <section className="ac-section ac-members-section">
        <div className="ac-members-split-layout ac-members-org-panel">
          <OrgDepartmentsSidebar
            locale={controller.locale}
            departments={controller.orgDepartments}
            rootDepartments={controller.orgDepartmentRoots}
            selectedDepartmentId={controller.selectedDepartmentId}
            selectedDepartment={controller.selectedDepartment}
            orgRootLabel={orgRootLabel}
            totalMemberCount={controller.totalOrgMemberCount}
            isOrgRootSelected={controller.isOrgRootSelected}
            onSelectOrgRoot={() => controller.handleSelectDepartment(ORG_ROOT_PARENT_ID)}
            memberCountByDepartmentId={controller.departmentDisplayMemberCountById}
            memberIdsByDepartmentId={controller.departmentMemberIdsByDepartmentId}
            searchQuery={controller.membersSearchQuery}
            orgMembers={controller.orgMembers}
            localizeMember={controller.localizeMember}
            localizeMemberDept={controller.localizeMemberDept}
            onSelectDepartment={controller.handleSelectDepartment}
            onEditDepartment={
              canEditDepartmentInMembersSidebar ? controller.handleEditDepartment : undefined
            }
            onAddDepartment={
              canCreateChildDepartment ? controller.handleOpenAddDepartment : undefined
            }
            onThirdPartyImport={
              canCreateChildDepartment
                ? () => controller.setThirdPartyImportOpen(true)
                : undefined
            }
            onBatchCreateDepartments={
              canCreateChildDepartment
                ? () => controller.setBatchCreateDepartmentsOpen(true)
                : undefined
            }
            onAddChildDepartment={
              canCreateChildDepartment ? controller.handleAddChildDepartment : undefined
            }
            onRemoveDepartment={
              canDeleteInMembersManagement ? controller.handleRequestRemoveDepartment : undefined
            }
            expandDepartmentIds={controller.expandDepartmentIds}
            onExpandDepartmentIdsApplied={controller.handleClearExpandDepartmentIds}
          />

          <div className="ac-members-split-main">
            {showOrgCompanyMembers ? (
              <div className="ac-department-members-main">
                <DepartmentMembersPanelHeader
                  locale={controller.locale}
                  orgRootLabel={orgRootLabel}
                  totalMemberCount={controller.totalOrgMemberCount}
                  departmentCount={controller.orgDepartments.length}
                  onAddMember={() => controller.setCreateNewUserOpen(true)}
                  onThirdPartyImport={() => controller.setThirdPartyImportOpen(true)}
                  onViewAddApplyRecords={navigateMemberAddApplyRecords}
                  selectedMemberCount={selectedMemberIds.length}
                  onBatchImport={() => setBatchImportOpen(true)}
                  onBatchExport={() => setBatchExportOpen(true)}
                  onBatchEnable={() => controller.handleBatchEnableMembers(selectedMemberIds)}
                  onBatchAdjustDepartment={() => setBatchAdjustDepartmentOpen(true)}
                  onBatchDisable={() => setBatchDisableConfirmOpen(true)}
                  onBatchDeleteDirect={
                    canDeleteInMembersManagement
                      ? () => setBatchDeleteConfirmOpen(true)
                      : undefined
                  }
                  externalBatchHint={externalBatchHint}
                />
                <MembersPanel
                  locale={controller.locale}
                  members={controller.membersForSelectedScope}
                  orgMembers={controller.orgMembers}
                  workspaceRoles={controller.roles}
                  roleOverridesById={controller.roleOverridesById}
                  searchQuery={controller.membersSearchQuery}
                  memberStatusOverrides={controller.memberStatusOverrides}
                  emptyMessageKey="noProjectMembers"
                  tableLayout="tree"
                  selectionClearSignal={controller.selectedDepartmentId}
                  showAddButton={false}
                  localizeMember={controller.localizeMember}
                  localizeMemberDept={controller.localizeMemberDept}
                  onAdd={() => controller.setCreateNewUserOpen(true)}
                  onEdit={controller.setEditMember}
                  onRemove={controller.handleRequestRemoveMember}
                  onMemberStatusChange={controller.handleSaveMemberStatus}
                  onSelectionChange={setSelectedMemberIds}
                  onTransferDepartmentManager={controller.handleOpenTransferDepartmentManager}
                />
              </div>
            ) : showDepartmentMembers && controller.selectedDepartment ? (
              <div className="ac-department-members-main">
                <DepartmentMembersPanelHeader
                  locale={controller.locale}
                  department={controller.selectedDepartment}
                  onEditDepartment={
              canEditDepartmentInMembers ? controller.handleEditDepartment : undefined
            }
                  onAddMember={controller.handleOpenAddDepartmentMember}
                  onThirdPartyImport={() => controller.setThirdPartyImportOpen(true)}
                  onViewAddApplyRecords={navigateMemberAddApplyRecords}
                  selectedMemberCount={selectedMemberIds.length}
                  onBatchImport={() => setBatchImportOpen(true)}
                  onBatchExport={() => setBatchExportOpen(true)}
                  onBatchEnable={() => controller.handleBatchEnableMembers(selectedMemberIds)}
                  onBatchAdjustDepartment={() => setBatchAdjustDepartmentOpen(true)}
                  onBatchDisable={() => setBatchDisableConfirmOpen(true)}
                  onBatchDeleteDirect={
                    canDeleteInMembersManagement
                      ? () => setBatchDeleteConfirmOpen(true)
                      : undefined
                  }
                  externalBatchHint={externalBatchHint}
                />
                <MembersPanel
                  locale={controller.locale}
                  members={controller.membersForSelectedScope}
                  orgMembers={controller.orgMembers}
                  workspaceRoles={controller.roles}
                  roleOverridesById={controller.roleOverridesById}
                  searchQuery={controller.membersSearchQuery}
                  memberStatusOverrides={controller.memberStatusOverrides}
                  emptyMessageKey="noProjectMembers"
                  tableLayout="tree"
                  selectionClearSignal={controller.selectedDepartmentId}
                  showAddButton={false}
                  localizeMember={controller.localizeMember}
                  localizeMemberDept={controller.localizeMemberDept}
                  onAdd={() => controller.setCreateNewUserOpen(true)}
                  onEdit={controller.setEditMember}
                  onRemove={controller.handleRequestRemoveMember}
                  onMemberStatusChange={controller.handleSaveMemberStatus}
                  onSelectionChange={setSelectedMemberIds}
                  departmentManagerMemberId={controller.departmentManagerMemberId}
                  onTransferDepartmentManager={controller.handleOpenTransferDepartmentManager}
                />
              </div>
            ) : (
              <div className="ac-members-panel">
                <div className="skills-empty">{acT(controller.locale, 'noDepartments')}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <MembersManagementModals
        locale={controller.locale}
        roles={controller.roles}
        roleOverridesById={controller.roleOverridesById}
        createNewUserOpen={controller.createNewUserOpen}
        editMember={controller.editMember}
        memberPendingRemove={controller.memberPendingRemove}
        editingMemberOrg={controller.editingMemberOrg}
        editingMemberRoleLabel={controller.editingMemberRoleLabel}
        editingMemberStatus={controller.editingMemberStatus}
        pendingRemoveMemberOrg={controller.pendingRemoveMemberOrg}
        localizeMember={controller.localizeMember}
        resolveMemberWorkspaceLabelForMember={controller.resolveMemberWorkspaceLabelForMember}
        onCloseCreateNewUser={() => controller.setCreateNewUserOpen(false)}
        onCloseEditMember={() => controller.setEditMember(null)}
        onClosePendingRemove={() => controller.setMemberPendingRemove(null)}
        onCreateNewUser={controller.handleCreateNewUser}
        onSaveMemberStatus={controller.handleSaveMemberStatus}
        onConfirmRemoveMember={controller.handleConfirmRemoveMember}
        editDepartment={controller.editDepartment}
        addChildParent={controller.addChildParent}
        addDepartmentOpen={controller.addDepartmentOpen}
        orgDepartments={controller.orgDepartments}
        onCloseEditDepartment={() => controller.setEditDepartment(null)}
        onSaveDepartment={controller.handleSaveDepartment}
        onCloseAddChildDepartment={() => controller.setAddChildParent(null)}
        onSaveAddChildDepartment={controller.handleSaveAddChildDepartment}
        onCloseAddDepartment={() => controller.setAddDepartmentOpen(false)}
        onSaveAddDepartment={controller.handleSaveAddDepartment}
        pendingRemoveDepartment={controller.pendingRemoveDepartment}
        pendingRemoveDepartmentMemberCount={controller.pendingRemoveDepartmentMemberCount}
        onClosePendingRemoveDepartment={() => controller.setPendingRemoveDepartment(null)}
        onConfirmRemoveDepartment={controller.handleConfirmRemoveDepartment}
        addDepartmentMemberOpen={controller.addDepartmentMemberOpen}
        addDepartmentMemberDepartment={controller.selectedDepartment}
        orgMembers={controller.orgMembers}
        onCloseAddDepartmentMember={() => controller.setAddDepartmentMemberOpen(false)}
        onSaveDepartmentMember={controller.handleSaveDepartmentMember}
        onAddMembersByStructure={controller.handleAddMembersByStructure}
        onInviteFromAddDepartmentMember={() => {
          controller.setAddDepartmentMemberOpen(false)
          controller.setInviteDepartmentMembersOpen(true)
        }}
        onBatchImportFromAddDepartmentMember={() => {
          controller.setAddDepartmentMemberOpen(false)
          setBatchImportOpen(true)
        }}
        inviteDepartmentMembersOpen={controller.inviteDepartmentMembersOpen}
        inviteDepartmentMemberDepartment={controller.selectedDepartment}
        onCloseInviteDepartmentMembers={() => controller.setInviteDepartmentMembersOpen(false)}
        thirdPartyImportOpen={controller.thirdPartyImportOpen}
        onCloseThirdPartyImport={() => controller.setThirdPartyImportOpen(false)}
        batchCreateDepartmentsOpen={controller.batchCreateDepartmentsOpen}
        onCloseBatchCreateDepartments={() => controller.setBatchCreateDepartmentsOpen(false)}
        onBatchCreateDepartments={controller.handleBatchCreateDepartments}
        batchImportOpen={batchImportOpen}
        onCloseBatchImport={() => setBatchImportOpen(false)}
        batchExportOpen={batchExportOpen}
        onCloseBatchExport={() => setBatchExportOpen(false)}
        batchDisableConfirmOpen={batchDisableConfirmOpen}
        batchDisableMemberCount={selectedMemberIds.length}
        onCloseBatchDisableConfirm={() => setBatchDisableConfirmOpen(false)}
        onConfirmBatchDisable={handleConfirmBatchDisable}
        batchDeleteConfirmOpen={batchDeleteConfirmOpen}
        batchDeleteMemberCount={selectedMemberIds.length}
        onCloseBatchDeleteConfirm={() => setBatchDeleteConfirmOpen(false)}
        onConfirmBatchDelete={handleConfirmBatchDelete}
        batchAdjustDepartmentOpen={batchAdjustDepartmentOpen}
        batchAdjustMemberCount={selectedMemberIds.length}
        onCloseBatchAdjustDepartment={() => setBatchAdjustDepartmentOpen(false)}
        onConfirmBatchAdjustDepartment={handleConfirmBatchAdjustDepartment}
        transferDepartmentManagerOpen={controller.transferDepartmentManagerOpen}
        transferDepartmentManagerCandidates={controller.transferDepartmentManagerCandidates}
        onCloseTransferDepartmentManager={() => controller.setTransferDepartmentManagerOpen(false)}
        onConfirmTransferDepartmentManager={(memberId) =>
          controller.handleConfirmTransferDepartmentManager(memberId)
        }
      />
    </>
  )
}
