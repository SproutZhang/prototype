import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const ENGINE_STATUS_MESSAGES = [
  '正在分析您的需求…',
  '正在初始化智能体架构…',
  '正在连接工具集 /gmail_sender、/sheets_reader…',
  '正在优化提示词与记忆模块…',
  '正在激活智能体，即将就绪…',
]

const STATUS_FIELD_LABELS = ['需求解析', '架构初始化', '工具链路', '上下文优化', '激活检查']

const STATUS_STEP_MS = 170
/** 仅保留状态字段段；最后一条出现后略作停顿再通知父级 */
const TRACE_COMPLETE_MS =
  (ENGINE_STATUS_MESSAGES.length - 1) * STATUS_STEP_MS + 480

type TraceRow = {
  id: string
  label: string
  value: string
  tone?: 'neutral' | 'ok' | 'warn'
}

export type PlanAgentCreationSequenceProps = {
  active: boolean
  onComplete: () => void
}

export function PlanAgentCreationSequence({ active, onComplete }: PlanAgentCreationSequenceProps) {
  const [rows, setRows] = useState<TraceRow[]>([])
  const completedRef = useRef(false)
  const timersRef = useRef<Array<ReturnType<typeof window.setTimeout>>>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  useEffect(() => {
    if (!active) {
      clearTimers()
      setRows([])
      completedRef.current = false
      return
    }

    completedRef.current = false
    setRows([])
    clearTimers()

    const push = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms))
    }

    for (let i = 0; i < ENGINE_STATUS_MESSAGES.length; i++) {
      const label = STATUS_FIELD_LABELS[i] ?? '状态'
      const value = ENGINE_STATUS_MESSAGES[i]
      const id = `st-${i}`
      push(() => setRows((p) => [...p, { id, label, value, tone: 'neutral' }]), i * STATUS_STEP_MS)
    }

    push(() => {
      if (completedRef.current) return
      completedRef.current = true
      onComplete()
    }, TRACE_COMPLETE_MS)

    return () => clearTimers()
  }, [active, onComplete])

  useLayoutEffect(() => {
    if (!active) return
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [active, rows.length])

  if (!active) return null

  return (
    <div ref={rootRef} className="plan-agent-creation-trace" aria-live="polite">
      <div ref={scrollRef} className="plan-agent-creation-field-scroll">
        <div className="plan-agent-creation-field-list" role="list">
          {rows.map((r) => (
            <div key={r.id} className={`plan-agent-creation-field${r.tone ? ` is-${r.tone}` : ''}`} role="listitem">
              <span className="plan-agent-creation-field-label">{r.label}</span>
              <span className="plan-agent-creation-field-value">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
