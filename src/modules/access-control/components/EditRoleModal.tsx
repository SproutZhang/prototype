import { useEffect, useId, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'
import { resolveRoleDescription, resolveRoleLabel, type RoleDisplayOverride } from '../utils/roleDisplay'
import {
  applyPermissionGrantToggle,
  applyPermissionSectionGrantToggle,
  buildDefaultNewRoleCatalogGrants,
  buildInitialCatalogGrantsForRole,
  getAllCatalogGrantIds,
  sanitizeRolePermissionGrantIds,
  shouldRoleHaveFullCatalogGrants,
  shouldRoleUseManagerBuiltinCatalogDefaults,
} from '../data/rolePermissionsCatalog'
import { RolePermissionsChecklist } from './RolePermissionsChecklist'

const EMPTY_GRANTED_IDS: readonly string[] = []

export type RoleFormSavePayload = {
  label: string
  description: string
  grantedIds: string[]
}

/** @deprecated 使用 RoleFormSavePayload */
export type EditRoleSavePayload = RoleFormSavePayload

type RoleFormModalProps = {
  locale: AppLocale
  open: boolean
  mode: 'add' | 'edit'
  role?: WorkspaceRoleRow | null
  roleOverride?: RoleDisplayOverride
  grantedIds?: string[]
  onClose: () => void
  onSave: (payload: RoleFormSavePayload) => void
}

export function RoleFormModal({
  locale,
  open,
  mode,
  role = null,
  roleOverride,
  grantedIds = EMPTY_GRANTED_IDS,
  onClose,
  onSave,
}: RoleFormModalProps) {
  const titleId = useId()
  const [draftLabel, setDraftLabel] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftGrantedIds, setDraftGrantedIds] = useState<Set<string>>(buildDefaultNewRoleCatalogGrants)

  useEffect(() => {
    if (!open) return
    if (mode === 'add') {
      setDraftLabel('')
      setDraftDescription('')
      setDraftGrantedIds(buildDefaultNewRoleCatalogGrants())
      return
    }
    if (!role) return
    setDraftLabel(resolveRoleLabel(role, roleOverride))
    setDraftDescription(resolveRoleDescription(locale, role, roleOverride))
    const resolvedGrantedIds = shouldRoleHaveFullCatalogGrants(role)
      ? getAllCatalogGrantIds()
      : shouldRoleUseManagerBuiltinCatalogDefaults(role)
        ? buildInitialCatalogGrantsForRole(role)
        : grantedIds
    setDraftGrantedIds(sanitizeRolePermissionGrantIds(resolvedGrantedIds))
    // 仅在弹窗打开或编辑目标角色变化时初始化，避免父组件重渲染时重置用户输入
  }, [open, mode, role?.id])

  if (!open) return null
  if (mode === 'edit' && !role) return null

  const toggleItem = (itemId: string) => {
    setDraftGrantedIds((prev) => applyPermissionGrantToggle(prev, itemId))
  }

  const toggleSection = (sectionId: string, itemIds: string[]) => {
    setDraftGrantedIds((prev) => applyPermissionSectionGrantToggle(prev, sectionId, itemIds))
  }

  const handleSave = () => {
    const fallbackLabel = mode === 'add' ? acT(locale, 'roleDefaultName') : role!.label
    onSave({
      label: draftLabel.trim() || fallbackLabel,
      description: draftDescription.trim(),
      grantedIds: [...sanitizeRolePermissionGrantIds(draftGrantedIds)],
    })
    onClose()
  }

  const modalTitle = mode === 'add' ? acT(locale, 'roleAddTitle') : acT(locale, 'roleEditTitle')

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--role-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ac-modal-title">
          {modalTitle}
        </h2>
        <div className="ac-modal-form ac-modal-form--role-edit">
          <label className="ac-field">
            <span>{acT(locale, 'roleFieldName')}</span>
            <input
              type="text"
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder={mode === 'add' ? acT(locale, 'roleDefaultName') : undefined}
            />
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'roleFieldDescription')}</span>
            <textarea
              value={draftDescription}
              rows={3}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
          </label>
          <div className="ac-role-edit-permissions-block">
            <div className="ac-role-edit-permissions-label">{acT(locale, 'roleColumnPermissions')}</div>
            <RolePermissionsChecklist
              locale={locale}
              grantedIds={draftGrantedIds}
              onToggle={toggleItem}
              onToggleSection={toggleSection}
              className="ac-permissions-drawer-body ac-role-edit-permissions-body"
            />
          </div>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={handleSave}>
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** 编辑已有角色 */
export function EditRoleModal({
  locale,
  open,
  role,
  roleOverride,
  grantedIds,
  onClose,
  onSave,
}: {
  locale: AppLocale
  open: boolean
  role: WorkspaceRoleRow | null
  roleOverride?: RoleDisplayOverride
  grantedIds: string[]
  onClose: () => void
  onSave: (payload: RoleFormSavePayload) => void
}) {
  return (
    <RoleFormModal
      locale={locale}
      open={open}
      mode="edit"
      role={role}
      roleOverride={roleOverride}
      grantedIds={grantedIds}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

/** 添加新角色 */
export function AddRoleModal({
  locale,
  open,
  onClose,
  onSave,
}: {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onSave: (payload: RoleFormSavePayload) => void
}) {
  return (
    <RoleFormModal locale={locale} open={open} mode="add" onClose={onClose} onSave={onSave} />
  )
}
