import { useEffect, useState } from 'react'

import { ApiKeysView } from '../../api-keys'
import { useApiKeysSectionController } from '../../api-keys/hooks/useApiKeysSectionController'
import { AccessControlHeader } from '../../components/AccessControlHeader'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { navigateAccessControlSection } from '../../utils/routing'

/** 访问控制 · API 密钥（Admin / Manager） */
export function AccessControlApiKeysPage() {
  const controller = useApiKeysSectionController()
  const { canViewApiKeys } = useAccessControlCapabilities()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!canViewApiKeys) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewApiKeys])

  if (!canViewApiKeys) return null

  return (
    <AccessControlSectionShell section="api-keys" locale={controller.locale} sideDrawerOpen={false}>
      <AccessControlHeader
        locale={controller.locale}
        section="api-keys"
        searchQuery={controller.searchQuery}
        onSearchQueryChange={controller.setSearchQuery}
        onAddMember={() => setCreateOpen(true)}
      />
      <ApiKeysView
        locale={controller.locale}
        searchQuery={controller.searchQuery}
        apiKeys={controller.apiKeys}
        onCreateApiKey={controller.handleCreateApiKey}
        onUpdateApiKey={controller.handleUpdateApiKey}
        onToggleApiKeyStatus={controller.handleToggleApiKeyStatus}
        onDeleteApiKey={controller.handleDeleteApiKey}
        createOpen={createOpen}
        onCloseCreate={() => setCreateOpen(false)}
      />
    </AccessControlSectionShell>
  )
}
