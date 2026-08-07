import { useEffect, useState, type ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  permissionGroupLabel,
  permissionLabel,
  rolePresetLabel,
} from '../../access-control/i18n/strings'
import {
  PERMISSION_GROUP_ORDER,
  PERMISSIONS_BY_GROUP,
} from '../../access-control/utils/permissionGroups'
import type { SpaceCustomRole, SpaceCustomRoleDraft, TcsPermission } from '../types'
import { DeleteIcon } from '../../access-control/components/RowActionIcons'
import type { ProjectSpaceBuiltinPreset } from '../utils/projectSpaceCustomRolesSync'
import { resolveProjectSpacePresetPermissions } from '../utils/projectSpaceCustomRolesSync'
import { tcsT } from '../i18n/strings'

const BUILTIN_PRESETS: ProjectSpaceBuiltinPreset[] = ['space_admin', 'collaborator', 'observer']

function permissionsEqual(a: readonly TcsPermission[], b: readonly TcsPermission[]): boolean {
  if (a.length !== b.length) return false
  const granted = new Set(a)
  return b.every((perm) => granted.has(perm))
}

type RolePermissionsEditorProps = {
  locale: AppLocale
  permissions: readonly TcsPermission[]
  onChange: (permissions: TcsPermission[]) => void
  readOnly?: boolean
}

function RolePermissionsEditor({ locale, permissions, onChange, readOnly = false }: RolePermissionsEditorProps) {
  const permissionSet = new Set(permissions)

  const togglePermission = (perm: TcsPermission) => {
    const next = permissionSet.has(perm)
      ? permissions.filter((item) => item !== perm)
      : [...permissions, perm]
    onChange(next)
  }

  return (
    <div className={`tcs-space-role-permissions${readOnly ? ' tcs-space-role-permissions--readonly' : ' tcs-space-role-permissions--editable'}`}>
      {PERMISSION_GROUP_ORDER.map((groupId) => {
        const groupPermissions = PERMISSIONS_BY_GROUP[groupId]
        if (groupPermissions.length === 0) return null
        return (
          <div key={groupId} className="tcs-space-role-perm-group">
            <div className="tcs-space-role-perm-group-title">{permissionGroupLabel(locale, groupId)}</div>
            <ul className="tcs-space-role-perm-checklist">
              {groupPermissions.map((perm) => (
                <li key={perm}>
                  <label className="tcs-space-role-perm-check-item">
                    <input
                      type="checkbox"
                      checked={permissionSet.has(perm)}
                      disabled={readOnly}
                      onChange={() => {
                        if (readOnly) return
                        togglePermission(perm)
                      }}
                    />
                    <span>{permissionLabel(locale, perm)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

type ProjectSpaceRolesPanelProps = {
  locale: AppLocale
  customRoles: readonly SpaceCustomRole[]
  builtinRolePermissions: Record<ProjectSpaceBuiltinPreset, readonly TcsPermission[]>
  onAddRole: (draft: SpaceCustomRoleDraft) => void
  onUpdateRole: (roleId: string, draft: SpaceCustomRoleDraft) => void
  onUpdateBuiltinRolePermissions: (preset: ProjectSpaceBuiltinPreset, permissions: TcsPermission[]) => void
  onRemoveRole: (roleId: string) => void
  /** 具备「角色管理 · 编辑」子权限 */
  canEditRole?: boolean
  addFormOpen: boolean
  onAddFormOpenChange: (open: boolean) => void
}

type SpaceCustomRoleFormModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onSave: (draft: SpaceCustomRoleDraft) => void
}

function permissionCountLabel(locale: AppLocale, count: number): string {
  return tcsT(locale, 'spaceRolePermissionCount').replace('{count}', String(count))
}

function RoleCardChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`tcs-space-role-card-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type CollapsibleRoleCardProps = {
  locale: AppLocale
  roleKey: string
  expanded: boolean
  onToggle: () => void
  isBuiltin?: boolean
  title: string
  permissionCount: number
  headerExtra?: ReactNode
  children: ReactNode
}

function CollapsibleRoleCard({
  locale,
  roleKey,
  expanded,
  onToggle,
  isBuiltin = false,
  title,
  permissionCount,
  headerExtra,
  children,
}: CollapsibleRoleCardProps) {
  const permissionsPanelId = `tcs-space-role-permissions-${roleKey}`

  return (
    <li
      className={`tcs-space-role-card tcs-space-role-card--detail${isBuiltin ? ' tcs-space-role-card--builtin' : ''}${expanded ? '' : ' tcs-space-role-card--collapsed'}`}
    >
      <div className="tcs-space-role-card-header">
        <button
          type="button"
          className="tcs-space-role-card-toggle"
          aria-expanded={expanded}
          aria-controls={permissionsPanelId}
          aria-label={
            expanded
              ? tcsT(locale, 'spaceRoleCollapsePermissions')
              : tcsT(locale, 'spaceRoleExpandPermissions')
          }
          onClick={onToggle}
        >
          <RoleCardChevron open={expanded} />
          <div className="tcs-space-role-card-main">
            <span className="tcs-space-role-card-name">{title}</span>
            <span className="tcs-space-role-card-meta">{permissionCountLabel(locale, permissionCount)}</span>
          </div>
        </button>
        {headerExtra}
      </div>
      {expanded ? <div id={permissionsPanelId}>{children}</div> : null}
    </li>
  )
}

function SpaceCustomRoleFormModal({ locale, open, onClose, onSave }: SpaceCustomRoleFormModalProps) {
  const [nameZh, setNameZh] = useState('')
  const [permissions, setPermissions] = useState<TcsPermission[]>([])

  useEffect(() => {
    if (!open) return
    setNameZh('')
    setPermissions([...resolveProjectSpacePresetPermissions('observer')])
  }, [open])

  if (!open) return null

  const togglePermission = (perm: TcsPermission) => {
    setPermissions((current) =>
      current.includes(perm) ? current.filter((item) => item !== perm) : [...current, perm],
    )
  }

  const handleSave = () => {
    const trimmedName = nameZh.trim() || tcsT(locale, 'spaceRoleDefaultName')
    onSave({
      nameZh: trimmedName,
      nameEn: trimmedName,
      permissions: [...permissions],
    })
    onClose()
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--permissions tcs-space-role-form-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="ac-modal-title">{tcsT(locale, 'spaceRoleAddTitle')}</h2>
        <div className="ac-modal-form ac-modal-form--permissions">
          <label className="ac-field">
            <span>{tcsT(locale, 'spaceRoleFieldNameZh')}</span>
            <input
              type="text"
              value={nameZh}
              placeholder={tcsT(locale, 'spaceRoleDefaultName')}
              onChange={(event) => setNameZh(event.target.value)}
            />
          </label>
          <div className="ac-permission-checklist">
              {PERMISSION_GROUP_ORDER.map((groupId) => {
                const groupPermissions = PERMISSIONS_BY_GROUP[groupId]
                if (groupPermissions.length === 0) return null
                return (
                  <div key={groupId} className="ac-permission-checklist-group">
                    <div className="ac-permission-checklist-group-title">
                      {permissionGroupLabel(locale, groupId)}
                    </div>
                    {groupPermissions.map((perm) => (
                      <label key={perm} className="ac-permission-check-item">
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                        />
                        <span>{permissionLabel(locale, perm)}</span>
                      </label>
                    ))}
                  </div>
                )
              })}
          </div>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {tcsT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={handleSave}>
            {tcsT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProjectSpaceRolesPanel({
  locale,
  customRoles,
  builtinRolePermissions,
  onAddRole,
  onUpdateRole,
  onUpdateBuiltinRolePermissions,
  onRemoveRole,
  canEditRole = false,
  addFormOpen,
  onAddFormOpenChange,
}: ProjectSpaceRolesPanelProps) {
  const [removeTarget, setRemoveTarget] = useState<SpaceCustomRole | null>(null)
  const [expandedRoleKeys, setExpandedRoleKeys] = useState<Set<string>>(() => new Set())
  const [customRoleDrafts, setCustomRoleDrafts] = useState<Record<string, TcsPermission[]>>({})

  const roleLabel = (role: SpaceCustomRole) => (locale === 'zh' ? role.nameZh : role.nameEn)

  useEffect(() => {
    const roleIds = new Set(customRoles.map((role) => role.id))
    setCustomRoleDrafts((current) => {
      const next = { ...current }
      let changed = false
      for (const roleId of Object.keys(next)) {
        if (!roleIds.has(roleId)) {
          delete next[roleId]
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [customRoles])

  const getCustomRolePermissions = (role: SpaceCustomRole) => customRoleDrafts[role.id] ?? role.permissions

  const isCustomRoleDirty = (role: SpaceCustomRole) => {
    const draft = customRoleDrafts[role.id]
    if (!draft) return false
    return !permissionsEqual(draft, role.permissions)
  }

  const toggleRoleExpanded = (roleKey: string) => {
    setExpandedRoleKeys((current) => {
      const next = new Set(current)
      if (next.has(roleKey)) next.delete(roleKey)
      else next.add(roleKey)
      return next
    })
  }

  const isRoleExpanded = (roleKey: string) => expandedRoleKeys.has(roleKey)

  const handleCustomRolePermissionsChange = (role: SpaceCustomRole, permissions: TcsPermission[]) => {
    setCustomRoleDrafts((current) => ({ ...current, [role.id]: permissions }))
  }

  const saveCustomRole = (role: SpaceCustomRole) => {
    const permissions = [...getCustomRolePermissions(role)]
    onUpdateRole(role.id, {
      nameZh: role.nameZh,
      nameEn: role.nameEn,
      permissions,
    })
    setCustomRoleDrafts((current) => {
      const next = { ...current }
      delete next[role.id]
      return next
    })
  }

  return (
    <>
      <div className="tcs-project-space-roles-panel">
        <section className="tcs-space-roles-section" aria-label={tcsT(locale, 'spaceRolesBuiltinSection')}>
          <h3 className="tcs-space-roles-section-title">{tcsT(locale, 'spaceRolesBuiltinSection')}</h3>
          <ul className="tcs-space-roles-list tcs-space-roles-list--detail">
            {BUILTIN_PRESETS.map((preset) => {
              const perms = builtinRolePermissions[preset]
              const roleKey = `builtin:${preset}`
              return (
                <CollapsibleRoleCard
                  key={preset}
                  locale={locale}
                  roleKey={roleKey}
                  expanded={isRoleExpanded(roleKey)}
                  onToggle={() => toggleRoleExpanded(roleKey)}
                  isBuiltin
                  title={rolePresetLabel(locale, preset)}
                  permissionCount={perms.length}
                  headerExtra={
                    <span className="tcs-space-role-card-badge">{tcsT(locale, 'spaceRoleBuiltinBadge')}</span>
                  }
                >
                  <RolePermissionsEditor
                    locale={locale}
                    permissions={perms}
                    readOnly={!canEditRole}
                    onChange={(permissions) => onUpdateBuiltinRolePermissions(preset, permissions)}
                  />
                </CollapsibleRoleCard>
              )
            })}
          </ul>
        </section>

        {customRoles.length > 0 ? (
          <section className="tcs-space-roles-section" aria-label={tcsT(locale, 'spaceRolesCustomSection')}>
            <h3 className="tcs-space-roles-section-title">{tcsT(locale, 'spaceRolesCustomSection')}</h3>
            <ul className="tcs-space-roles-list tcs-space-roles-list--detail">
              {customRoles.map((role) => {
                const roleKey = `custom:${role.id}`
                const draftPermissions = getCustomRolePermissions(role)
                const dirty = isCustomRoleDirty(role)
                return (
                  <CollapsibleRoleCard
                    key={role.id}
                    locale={locale}
                    roleKey={roleKey}
                    expanded={isRoleExpanded(roleKey)}
                    onToggle={() => toggleRoleExpanded(roleKey)}
                    title={roleLabel(role)}
                    permissionCount={draftPermissions.length}
                    headerExtra={
                      <div className="tcs-space-role-card-actions">
                        {dirty && canEditRole ? (
                          <button
                            type="button"
                            className="agents-btn agents-btn-primary ac-btn--sm"
                            onClick={() => saveCustomRole(role)}
                          >
                            {tcsT(locale, 'formSave')}
                          </button>
                        ) : null}
                        {canEditRole ? (
                          <button
                            type="button"
                            className="ac-row-icon-btn ac-row-icon-btn--danger"
                            aria-label={tcsT(locale, 'spaceRoleRemove')}
                            title={tcsT(locale, 'spaceRoleRemove')}
                            onClick={() => setRemoveTarget(role)}
                          >
                            <DeleteIcon />
                          </button>
                        ) : null}
                      </div>
                    }
                  >
                    <RolePermissionsEditor
                      locale={locale}
                      permissions={draftPermissions}
                      readOnly={!canEditRole}
                      onChange={(permissions) => handleCustomRolePermissionsChange(role, permissions)}
                    />
                  </CollapsibleRoleCard>
                )
              })}
            </ul>
          </section>
        ) : null}
      </div>

      {addFormOpen ? (
        <SpaceCustomRoleFormModal
          locale={locale}
          open
          onClose={() => onAddFormOpenChange(false)}
          onSave={(draft) => {
            onAddRole(draft)
          }}
        />
      ) : null}

      {removeTarget ? (
        <div className="ac-modal-overlay" role="presentation" onClick={() => setRemoveTarget(null)}>
          <div
            className="ac-modal ac-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="ac-modal-title">{tcsT(locale, 'spaceRoleRemoveTitle')}</h2>
            <p className="ac-modal-hint">
              {tcsT(locale, 'spaceRoleRemoveHint').replace('{name}', roleLabel(removeTarget))}
            </p>
            <div className="ac-modal-actions">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={() => setRemoveTarget(null)}>
                {tcsT(locale, 'formCancel')}
              </button>
              <button
                type="button"
                className="agents-btn ac-btn--danger"
                onClick={() => {
                  onRemoveRole(removeTarget.id)
                  setRemoveTarget(null)
                }}
              >
                {tcsT(locale, 'spaceRoleRemoveConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
