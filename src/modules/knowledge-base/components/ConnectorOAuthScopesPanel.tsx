import { useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  getConnectorOAuthActions,
  getConnectorOAuthScopes,
  oauthActionLabel,
  oauthScopeLabel,
} from '../data/connectorOAuthScopes'
import { kbT } from '../i18n/strings'

function OAuthSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={`kb-configure-connector-scope-row${disabled ? ' is-disabled' : ''}`}>
      <span className="kb-configure-connector-scope-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className={`kb-configure-connector-switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="kb-configure-connector-switch-thumb" />
      </button>
    </label>
  )
}

type ConnectorOAuthScopesPanelProps = {
  locale: AppLocale
  connectionId: string
  resetKey?: string | number
}

export function ConnectorOAuthScopesPanel({ locale, connectionId, resetKey }: ConnectorOAuthScopesPanelProps) {
  const [scopeEnabled, setScopeEnabled] = useState<Record<string, boolean>>({})

  const scopes = useMemo(() => getConnectorOAuthScopes(connectionId), [connectionId])
  const actions = useMemo(() => getConnectorOAuthActions(connectionId), [connectionId])

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    for (const scope of getConnectorOAuthScopes(connectionId)) {
      initial[scope.id] = scope.defaultEnabled ?? false
    }
    setScopeEnabled(initial)
  }, [connectionId, resetKey])

  return (
    <section className="kb-configure-connector-section kb-configure-connector-section--embedded">
      <h3 className="kb-configure-connector-section-title">
        {kbT(locale, 'configureConnectorOAuthScopes')}
      </h3>
      <div className="kb-configure-connector-oauth">
        <div className="kb-configure-connector-oauth-scopes">
          {scopes.map((scope) => (
            <OAuthSwitch
              key={scope.id}
              label={oauthScopeLabel(scope, locale)}
              checked={scopeEnabled[scope.id] ?? false}
              disabled={scope.switchDisabled}
              onChange={(checked) => setScopeEnabled((prev) => ({ ...prev, [scope.id]: checked }))}
            />
          ))}
        </div>
        <ul className="kb-configure-connector-oauth-actions">
          {actions.map((action) => (
            <li key={action.id} className="kb-configure-connector-oauth-action">
              <span className="kb-configure-connector-oauth-action-icon" aria-hidden="true">
                −
              </span>
              {oauthActionLabel(action, locale)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
