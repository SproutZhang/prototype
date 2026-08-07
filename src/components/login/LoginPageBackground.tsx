import { LoginExternalEffect } from './LoginExternalEffect'

export function LoginPageBackground() {
  return (
    <div className="login-page-bg" aria-hidden="true">
      <LoginExternalEffect />
      <div className="login-page-bg-silk">
        <div className="login-page-bg-silk-wave login-page-bg-silk-wave-a" />
        <div className="login-page-bg-silk-wave login-page-bg-silk-wave-b" />
      </div>
      <div className="login-page-bg-glow" />
      <div className="login-page-bg-dots" />
    </div>
  )
}
