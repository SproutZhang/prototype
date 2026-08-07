import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import {
  applyPermissionGrantToggle,
  applyPermissionSectionGrantToggle,
  sanitizeRolePermissionGrantIds,
} from '../data/rolePermissionsCatalog'
import { RolePermissionsChecklist } from './RolePermissionsChecklist'

type RolePermissionsDrawerProps = {
  locale: AppLocale
  role: WorkspaceRoleRow
  grantedIds: string[]
  onClose: () => void
  onSave: (grantedIds: string[]) => void
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function RolePermissionsDrawer({
  locale,
  role,
  grantedIds,
  onClose,
  onSave,
}: RolePermissionsDrawerProps) {
  const headingId = useId()
  const [draftGrantedIds, setDraftGrantedIds] = useState(() => new Set(grantedIds))

  useEffect(() => {
    setDraftGrantedIds(sanitizeRolePermissionGrantIds(grantedIds))
  }, [role.id, grantedIds])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleItem = (itemId: string) => {
    setDraftGrantedIds((prev) => applyPermissionGrantToggle(prev, itemId))
  }

  const toggleSection = (sectionId: string, itemIds: string[]) => {
    setDraftGrantedIds((prev) => applyPermissionSectionGrantToggle(prev, sectionId, itemIds))
  }

  const handleSave = () => {
    onSave([...sanitizeRolePermissionGrantIds(draftGrantedIds)])
    onClose()
  }

  return (
    <aside className="scenario-collect-drawer ac-permissions-drawer" aria-labelledby={headingId}>
      <div className="scenario-collect-drawer-header">
        <h2 id={headingId} className="scenario-collect-drawer-title">
          {acT(locale, 'rolePermissionsDrawerTitle')}
        </h2>
        <button
          type="button"
          className="scenario-collect-drawer-close"
          aria-label={acT(locale, 'rolePermissionsDrawerClose')}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <RolePermissionsChecklist
        locale={locale}
        grantedIds={draftGrantedIds}
        onToggle={toggleItem}
        onToggleSection={toggleSection}
        className="scenario-collect-drawer-body ac-permissions-drawer-body"
      />

      <div className="scenario-collect-drawer-footer ac-permissions-drawer-footer">
        <button
          type="button"
          className="scenario-collect-drawer-btn scenario-collect-drawer-btn--ghost"
          onClick={onClose}
        >
          {acT(locale, 'formCancel')}
        </button>
        <button
          type="button"
          className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary"
          onClick={handleSave}
        >
          {acT(locale, 'formSave')}
        </button>
      </div>
    </aside>
  )
}
