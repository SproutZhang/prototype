import { useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeWorkspaceOption, WORKSPACE_OPTIONS } from '../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'
import { resolveRoleLabel, type RoleDisplayOverride } from '../utils/roleDisplay'

export type CreateNewUserPayload = {
  name: string
  email: string
  workspaceId: string
  roleId: string
}

type CreateNewUserModalProps = {
  locale: AppLocale
  open: boolean
  roles: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  onClose: () => void
  onConfirm: (payload: CreateNewUserPayload) => void
}

type FormErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword' | 'workspaceId' | 'roleId', string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ModalCloseIcon() {
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

export function CreateNewUserModal({
  locale,
  open,
  roles,
  roleOverridesById,
  onClose,
  onConfirm,
}: CreateNewUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [workspaceId, setWorkspaceId] = useState(WORKSPACE_OPTIONS[0]?.id ?? '')
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const [errors, setErrors] = useState<FormErrors>({})

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        label: resolveRoleLabel(role, roleOverridesById?.[role.id]),
      })),
    [roles, roleOverridesById],
  )

  useEffect(() => {
    if (!open) return
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setWorkspaceId(WORKSPACE_OPTIONS[0]?.id ?? '')
    setRoleId(roles[0]?.id ?? '')
    setErrors({})
  }, [open, roles])

  if (!open) return null

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!name.trim()) next.name = acT(locale, 'createNewUserRequired')
    if (!email.trim()) next.email = acT(locale, 'createNewUserRequired')
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = acT(locale, 'createNewUserEmailInvalid')
    if (!password) next.password = acT(locale, 'createNewUserRequired')
    else if (password.length < 6) next.password = acT(locale, 'createNewUserPasswordMin')
    if (!confirmPassword) next.confirmPassword = acT(locale, 'createNewUserRequired')
    else if (password !== confirmPassword) next.confirmPassword = acT(locale, 'createNewUserPasswordMismatch')
    if (!workspaceId) next.workspaceId = acT(locale, 'createNewUserRequired')
    if (!roleId) next.roleId = acT(locale, 'createNewUserRequired')
    return next
  }

  const handleSubmit = () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onConfirm({
      name: name.trim(),
      email: email.trim(),
      workspaceId,
      roleId,
    })
    onClose()
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--create-user"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-create-user-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row">
          <h2 id="ac-create-user-title" className="ac-modal-title">
            {acT(locale, 'createNewUserTitle')}
          </h2>
          <button
            type="button"
            className="ac-modal-close"
            aria-label={acT(locale, 'modalClose')}
            onClick={onClose}
          >
            <ModalCloseIcon />
          </button>
        </div>
        <div className="ac-modal-form ac-modal-form--create-user">
          <label className="ac-field">
            <span>{acT(locale, 'createNewUserName')}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
            {errors.name ? <span className="ac-field-error">{errors.name}</span> : null}
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'createNewUserEmail')}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
            />
            {errors.email ? <span className="ac-field-error">{errors.email}</span> : null}
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'createNewUserPassword')}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            {errors.password ? <span className="ac-field-error">{errors.password}</span> : null}
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'createNewUserConfirmPassword')}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
            {errors.confirmPassword ? (
              <span className="ac-field-error">{errors.confirmPassword}</span>
            ) : null}
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'createNewUserWorkspace')}</span>
            <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
              {WORKSPACE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {localizeWorkspaceOption(option, locale)}
                </option>
              ))}
            </select>
            {errors.workspaceId ? <span className="ac-field-error">{errors.workspaceId}</span> : null}
          </label>
          <label className="ac-field">
            <span>{acT(locale, 'createNewUserRole')}</span>
            <select value={roleId} onChange={(event) => setRoleId(event.target.value)}>
              {roleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.roleId ? <span className="ac-field-error">{errors.roleId}</span> : null}
          </label>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn agents-btn-primary" onClick={handleSubmit}>
            {acT(locale, 'createNewUserSubmit')}
          </button>
        </div>
      </div>
    </div>
  )
}
