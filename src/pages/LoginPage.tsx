import { useCallback, useState } from 'react'
import studioXLogo from '../assets/studio-x-logo.png'
import {
  getLoginRolePreset,
  LOGIN_ROLE_PRESETS,
  validateLoginCredentials,
} from '../auth/loginPresets'
import type { LoginRole } from '../auth/types'
import { LoginPageBackground } from '../components/login/LoginPageBackground'

type LoginPageProps = {
  onContinue: (role: LoginRole, email: string) => void
}

export function LoginPage({ onContinue }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<LoginRole>('manager')
  const defaultPreset = getLoginRolePreset('manager')
  const [email, setEmail] = useState(defaultPreset.email)
  const [code, setCode] = useState(defaultPreset.password)
  const [codeHidden, setCodeHidden] = useState(true)
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectRole = useCallback((role: LoginRole) => {
    const preset = getLoginRolePreset(role)
    setSelectedRole(role)
    setEmail(preset.email)
    setCode(preset.password)
    setError(null)
  }, [])

  const attemptLogin = useCallback(
    (role: LoginRole, nextEmail: string, nextPassword: string) => {
      if (!validateLoginCredentials(role, nextEmail, nextPassword)) {
        setError('账户或密码与所选角色不匹配')
        return false
      }
      setError(null)
      onContinue(role, nextEmail.trim())
      return true
    },
    [onContinue],
  )

  return (
    <div className="login-page" lang="zh-CN">
      <LoginPageBackground />
      <div className="login-page-shell">
        <section className="login-page-card" aria-label="登录">
          <header className="login-page-header">
            <span className="login-page-header-icon" aria-hidden="true">
              <img className="login-page-header-logo" src={studioXLogo} alt="" width={44} height={44} />
            </span>
            <h1 className="login-page-title">Welcome to Studio X</h1>
            <p className="login-page-subtitle">Reliable automation. Agents that evolve with you</p>
          </header>
          <form
            className="login-page-form"
            onSubmit={(e) => {
              e.preventDefault()
              attemptLogin(selectedRole, email, code)
            }}
          >
            <div className="login-page-field">
              <label className="login-page-label" htmlFor="login-page-email">
                账户
              </label>
              <input
                id="login-page-email"
                className="login-page-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
              />
            </div>

            <div className="login-page-field">
              <label className="login-page-label" htmlFor="login-page-code">
                密码
              </label>
              <div className="login-page-password-control">
                <input
                  id="login-page-code"
                  className="login-page-input login-page-password-input"
                  type={codeHidden ? 'password' : 'text'}
                  autoComplete="current-password"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setError(null)
                  }}
                />
                <button
                  type="button"
                  className="login-page-password-toggle"
                  aria-label={codeHidden ? '显示密码' : '隐藏密码'}
                  aria-pressed={codeHidden}
                  onClick={() => setCodeHidden((hidden) => !hidden)}
                >
                  {codeHidden ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M3.5 3.5l17 17M10.6 10.8A2 2 0 0 0 12 14a2 2 0 0 0 1.2-.4M9.5 5.3A8.8 8.8 0 0 1 12 5c4.7 0 8 4 9.2 5.7a2.1 2.1 0 0 1 0 2.6 16.2 16.2 0 0 1-2.3 2.6M6.6 6.9a16 16 0 0 0-3.8 3.8 2.1 2.1 0 0 0 0 2.6C4 15 7.3 19 12 19a8.9 8.9 0 0 0 4.1-1"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M2.8 10.7C4 9 7.3 5 12 5s8 4 9.2 5.7a2.1 2.1 0 0 1 0 2.6C20 15 16.7 19 12 19s-8-4-9.2-5.7a2.1 2.1 0 0 1 0-2.6Z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="login-page-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="login-page-primary" aria-label="Continue">
              Continue <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="login-page-or" aria-hidden="true">
            <span className="login-page-or-line" />
            <span className="login-page-or-text">OR</span>
            <span className="login-page-or-line" />
          </div>

          <button type="button" className="login-page-google" onClick={() => setGoogleDialogOpen(true)}>
            <span className="login-page-google-g" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </span>
            Sign in with Google
          </button>

          <p className="login-page-signup">
            Don&apos;t have an account?{' '}
            <a href="#" className="login-page-link" onClick={(e) => e.preventDefault()}>
              Sign up
            </a>
          </p>
        </section>

        <div className="login-page-role-tags" role="group" aria-label="角色标签">
          {LOGIN_ROLE_PRESETS.map((preset) => (
            <button
              key={preset.role}
              type="button"
              className={
                selectedRole === preset.role
                  ? 'login-page-role-tag is-active'
                  : 'login-page-role-tag'
              }
              aria-pressed={selectedRole === preset.role}
              onClick={() => selectRole(preset.role)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {googleDialogOpen && (
        <div
          className="login-google-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-google-modal-title"
          onClick={() => setGoogleDialogOpen(false)}
        >
          <div className="login-google-panel" onClick={(e) => e.stopPropagation()}>
            <div className="login-google-panel-header">
              <span className="login-google-wordmark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </span>
              <span>使用 Google 帐户登入</span>
            </div>

            <div className="login-google-panel-body">
              <div className="login-google-intro">
                <h2 id="login-google-modal-title">选择帐户</h2>
                <p>
                  继续使用「<strong>Studio X</strong>」
                </p>
              </div>

              <div className="login-google-accounts">
                <button
                  type="button"
                  className="login-google-account"
                  onClick={() => {
                    selectRole('user')
                    onContinue('user', getLoginRolePreset('user').email)
                  }}
                >
                  <span className="login-google-avatar login-google-avatar-blue">l</span>
                  <span className="login-google-account-meta">
                    <span className="login-google-account-name">liu liu</span>
                    <span className="login-google-account-email">liul85703@gmail.com</span>
                  </span>
                </button>

                <button
                  type="button"
                  className="login-google-account"
                  onClick={() => {
                    selectRole('manager')
                    onContinue('manager', getLoginRolePreset('manager').email)
                  }}
                >
                  <span className="login-google-avatar login-google-avatar-green">L</span>
                  <span className="login-google-account-meta">
                    <span className="login-google-account-name">Luis</span>
                    <span className="login-google-account-email">testelitesai@gmail.com</span>
                  </span>
                </button>

                <button type="button" className="login-google-account login-google-other-account">
                  <span className="login-google-other-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path
                        d="M5.5 19c1.1-3.05 3.18-4.58 6.5-4.58S17.4 15.95 18.5 19"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                  <span>使用其他帐户</span>
                </button>

                <p className="login-google-terms">
                  使用前，请先详阅「Studio X」的
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    隐私权政策
                  </a>
                  及
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    服务条款
                  </a>
                  。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
