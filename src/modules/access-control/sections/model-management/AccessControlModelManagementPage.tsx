import { useEffect, useState } from 'react'

import { ModelsView } from '../../model-management'
import { useModelsSectionController } from '../../model-management/hooks/useModelsSectionController'
import { AccessControlHeader } from '../../components/AccessControlHeader'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { navigateAccessControlSection } from '../../utils/routing'

/** 访问控制 · 模型管理（Admin / Manager） */
export function AccessControlModelManagementPage() {
  const controller = useModelsSectionController()
  const { canViewModelManagement } = useAccessControlCapabilities()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!canViewModelManagement) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewModelManagement])

  if (!canViewModelManagement) return null

  return (
    <AccessControlSectionShell section="model-management" locale={controller.locale} sideDrawerOpen={false}>
      <AccessControlHeader
        locale={controller.locale}
        section="model-management"
        searchQuery={controller.searchQuery}
        onSearchQueryChange={controller.setSearchQuery}
        onAddMember={() => setCreateOpen(true)}
      />
      <ModelsView
        locale={controller.locale}
        searchQuery={controller.searchQuery}
        models={controller.models}
        onCreateModel={controller.handleCreateModel}
        onUpdateModel={controller.handleUpdateModel}
        onToggleModelStatus={controller.handleToggleModelStatus}
        onDeleteModel={controller.handleDeleteModel}
        createOpen={createOpen}
        onCloseCreate={() => setCreateOpen(false)}
      />
    </AccessControlSectionShell>
  )
}
