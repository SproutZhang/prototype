import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** 与侧栏「工作流程步骤」五个节点标题一致（演示） */
const CREATE_STEPS = [
  '创建入职项目与计划',
  '准备并发送欢迎邮件',
  '配置IT设备和账户',
  '制定个性化培训计划',
  '监督验证整个流程',
] as const

const PROGRESS_MS = 3200

export type PlanAgentCreateModalProps = {
  open: boolean
  /** 弹窗主标题（如当前侧栏草案名称）；缺省为「新员工入职管家」 */
  entityTitle?: string
  /** 立即前往查看：由父级关闭弹窗；工作流创建完成跳转场景页，智能体创建完成跳转 Agent 库 */
  onViewNow: () => void
  /** 关闭（×、遮罩、Esc）：仅关弹窗 */
  onDismiss: () => void
  /** 继续创建：跳转首页（关闭会话与草案） */
  onContinueCreate: () => void
}

export function PlanAgentCreateModal({
  open,
  entityTitle,
  onViewNow,
  onDismiss,
  onContinueCreate,
}: PlanAgentCreateModalProps) {
  const reactId = useId()
  const titleId = `${reactId}-pacm-title`
  const gradId = `pacm-grad-${reactId.replace(/:/g, '')}`
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'creating' | 'done'>('creating')
  const progressRafRef = useRef<number | null>(null)

  const clearProgressRaf = () => {
    if (progressRafRef.current != null) {
      cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = null
    }
  }

  useLayoutEffect(() => {
    clearProgressRaf()
    if (open) {
      setPhase('creating')
      setProgress(0)
    } else {
      setProgress(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const run = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / PROGRESS_MS)
        setProgress(t * 100)
        if (t < 1) {
          progressRafRef.current = requestAnimationFrame(tick)
        } else {
          progressRafRef.current = null
          setPhase('done')
        }
      }
      progressRafRef.current = requestAnimationFrame(() => {
        progressRafRef.current = requestAnimationFrame(tick)
      })
    }

    run()
    return () => {
      clearProgressRaf()
      setProgress(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onDismiss])

  if (!open) return null

  const titleText = entityTitle?.trim() || '新员工入职管家'

  const stepCount = CREATE_STEPS.length
  const activeStepIndex =
    phase === 'done' ? -1 : Math.min(stepCount - 1, Math.floor((progress / 100) * stepCount))

  return createPortal(
    <div className="plan-agent-create-modal-root" role="presentation">
      <div className="plan-agent-create-modal-backdrop" aria-hidden="true" onClick={onDismiss} />
      <div
        className="plan-agent-create-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="plan-agent-create-modal-close"
          aria-label="关闭"
          title="关闭"
          onClick={onDismiss}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="plan-agent-create-modal-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="72" height="72">
            <defs>
              <linearGradient id={gradId} x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="55%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill={`url(#${gradId})`} />
            <rect x="16" y="17" width="16" height="14" rx="4" fill="#ffffff" opacity="0.95" />
            <circle cx="20" cy="24" r="1.6" fill="#312e81" />
            <circle cx="28" cy="24" r="1.6" fill="#312e81" />
            <path d="M20 29h8" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <h2 id={titleId} className="plan-agent-create-modal-title">
          {titleText}
        </h2>
        {phase === 'creating' ? (
          <p className="plan-agent-create-modal-status" aria-live="polite">
            <span>正在分析您的需求</span>
            <span className="plan-agent-create-modal-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
        ) : (
          <p className="plan-agent-create-modal-status plan-agent-create-modal-status--done" aria-live="polite">
            创建已完成
          </p>
        )}

        <div
          className="plan-agent-create-modal-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-valuetext={
            phase === 'done'
              ? '创建进度 100%'
              : `创建进度 ${Math.round(progress)}%，当前步骤：${CREATE_STEPS[Math.max(0, activeStepIndex)] ?? ''}`
          }
        >
          <div className="plan-agent-create-modal-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <ol className="plan-agent-create-modal-steps">
          {CREATE_STEPS.map((label, i) => {
            const doneAll = phase === 'done'
            const past = phase === 'creating' && activeStepIndex >= 0 && i < activeStepIndex
            const current = phase === 'creating' && i === activeStepIndex
            const stepCls = [
              'plan-agent-create-modal-step',
              doneAll || past ? 'is-complete' : '',
              current ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <li key={label} className={stepCls}>
                <span className="plan-agent-create-modal-step-num">{i + 1}</span>
                <span className="plan-agent-create-modal-step-label">{label}</span>
              </li>
            )
          })}
        </ol>

        {phase === 'done' ? (
          <div className="plan-agent-create-modal-foot">
            <div className="plan-agent-create-modal-actions">
              <button type="button" className="plan-agent-create-modal-btn plan-agent-create-modal-btn--ghost" onClick={onContinueCreate}>
                继续创建
              </button>
              <button type="button" className="plan-agent-create-modal-btn plan-agent-create-modal-btn--primary" onClick={onViewNow}>
                立即前往查看
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
