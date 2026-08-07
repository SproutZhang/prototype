import { useCallback, useState } from 'react'
import { clearLoginSession, ensureDemoSession, persistLoginSession, readAuthenticated } from './auth/session'
import type { LoginRole } from './auth/types'
import { PageLayout } from './components'
import { LocaleProvider } from './i18n/LocaleContext'
import { Home } from './pages/Home'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function App() {
  const [authenticated, setAuthenticated] = useState(() => {
    if (!readAuthenticated()) return false
    ensureDemoSession()
    return true
  })
  /** 每次成功登录递增，强制 Home 重新挂载，确保按角色路由落地 */
  const [homeMountEpoch, setHomeMountEpoch] = useState(0)

  const handleLogin = useCallback((role: LoginRole, email: string) => {
    persistLoginSession(role, email)
    setHomeMountEpoch((n) => n + 1)
    setAuthenticated(true)
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })
  }, [])

  const handleLogout = useCallback(() => {
    clearLoginSession()
    setAuthenticated(false)
  }, [])

  if (!authenticated) {
    return <LoginPage onContinue={handleLogin} />
  }

  return (
    <LocaleProvider>
      <PageLayout>
        <Home key={homeMountEpoch} onLogout={handleLogout} />
      </PageLayout>
    </LocaleProvider>
  )
}

export default App
