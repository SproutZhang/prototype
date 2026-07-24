import { Component, lazy, Suspense, type ReactNode } from 'react'
import './login-external-effect.css'

/** 设为 false 时关闭全部外部登录背景动效 */
export const LOGIN_EXTERNAL_EFFECT_ENABLED = true

const MagicRings = lazy(() => import('./MagicRings'))

class LoginFxErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function LoginExternalEffect() {
  if (!LOGIN_EXTERNAL_EFFECT_ENABLED) {
    return null
  }

  return (
    <div className="login-external-effect" aria-hidden="true">
      <LoginFxErrorBoundary>
        <Suspense fallback={null}>
          <MagicRings
            color="#f8f1ff"
            colorTwo="#fafbff"
            ringCount={6}
            speed={1}
            attenuation={12}
            lineThickness={1.5}
            baseRadius={0.35}
            radiusStep={0.1}
            scaleRate={0.1}
            opacity={0.28}
            blur={0}
            noiseAmount={0.06}
            rotation={0}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            mouseInfluence={0.2}
            hoverScale={1.2}
            parallax={0.05}
            clickBurst={false}
          />
        </Suspense>
      </LoginFxErrorBoundary>
    </div>
  )
}
