import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

type WorkflowCanvasToolbarProps = {
  hostRef: RefObject<HTMLDivElement | null>
  onNewClick: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
}

const EDGE_MARGIN = 6
const LONG_PRESS_MS = 380
const LONG_PRESS_MOVE_CANCEL_PX = 10

function clampToolbarPosition(
  left: number,
  top: number,
  hostW: number,
  hostH: number,
  barW: number,
  barH: number,
) {
  const maxL = Math.max(EDGE_MARGIN, hostW - barW - EDGE_MARGIN)
  const maxT = Math.max(EDGE_MARGIN, hostH - barH - EDGE_MARGIN)
  return {
    left: Math.min(Math.max(EDGE_MARGIN, left), maxL),
    top: Math.min(Math.max(EDGE_MARGIN, top), maxT),
  }
}

export function WorkflowCanvasToolbar({
  hostRef,
  onNewClick,
  onZoomIn,
  onZoomOut,
  onFitView,
}: WorkflowCanvasToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragSessionRef = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    originLeft: number
    originTop: number
  } | null>(null)
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null)
  const toolbarPosRef = useRef<{ left: number; top: number } | null>(null)
  const [toolbarPos, setToolbarPos] = useState<{ left: number; top: number } | null>(null)
  const [isDragMoving, setIsDragMoving] = useState(false)

  useEffect(() => {
    toolbarPosRef.current = toolbarPos
  }, [toolbarPos])

  const syncPositionToHost = useCallback(() => {
    const host = hostRef.current
    const bar = toolbarRef.current
    if (!host || !bar) return

    const hostW = host.clientWidth
    const hostH = host.clientHeight
    const barW = bar.offsetWidth
    const barH = bar.offsetHeight

    setToolbarPos((prev) => {
      if (prev === null) {
        const left = (hostW - barW) / 2
        const top = hostH - barH - 10
        return clampToolbarPosition(left, top, hostW, hostH, barW, barH)
      }

      return clampToolbarPosition(prev.left, prev.top, hostW, hostH, barW, barH)
    })
  }, [hostRef])

  useLayoutEffect(() => {
    syncPositionToHost()
  }, [syncPositionToHost])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const ro = new ResizeObserver(() => {
      syncPositionToHost()
    })
    ro.observe(host)
    return () => ro.disconnect()
  }, [hostRef, syncPositionToHost])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(() => clearLongPressTimer, [clearLongPressTimer])

  const handleGripPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const host = hostRef.current
    const gripEl = event.currentTarget
    if (!host || !toolbarRef.current) return

    const pointerId = event.pointerId
    const startClientX = event.clientX
    const startClientY = event.clientY

    longPressStartRef.current = { x: startClientX, y: startClientY }
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      const pos = toolbarPosRef.current
      if (!pos) return
      setIsDragMoving(true)
      dragSessionRef.current = {
        pointerId,
        startClientX,
        startClientY,
        originLeft: pos.left,
        originTop: pos.top,
      }
      gripEl.setPointerCapture(pointerId)
    }, LONG_PRESS_MS)
  }

  const handleGripPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = longPressStartRef.current
    if (start && longPressTimerRef.current) {
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (dx * dx + dy * dy > LONG_PRESS_MOVE_CANCEL_PX * LONG_PRESS_MOVE_CANCEL_PX) {
        clearLongPressTimer()
        longPressStartRef.current = null
      }
    }

    const session = dragSessionRef.current
    if (!session || event.pointerId !== session.pointerId) return

    const host = hostRef.current
    const bar = toolbarRef.current
    if (!host || !bar) return

    const hostW = host.clientWidth
    const hostH = host.clientHeight
    const barW = bar.offsetWidth
    const barH = bar.offsetHeight
    const nextLeft = session.originLeft + (event.clientX - session.startClientX)
    const nextTop = session.originTop + (event.clientY - session.startClientY)
    setToolbarPos(clampToolbarPosition(nextLeft, nextTop, hostW, hostH, barW, barH))
  }

  const handleGripPointerUpOrCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    clearLongPressTimer()
    longPressStartRef.current = null
    const session = dragSessionRef.current
    if (session && event.pointerId === session.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // noop
      }
    }
    dragSessionRef.current = null
    setIsDragMoving(false)
  }

  return (
    <div
      ref={toolbarRef}
      className="workflow-toolbar"
      aria-label="画布工具条"
      style={
        toolbarPos
          ? { left: toolbarPos.left, top: toolbarPos.top }
          : { left: '50%', bottom: 10, transform: 'translateX(-50%)' }
      }
    >
      <button
        className={isDragMoving ? 'workflow-toolbar-grip is-dragging' : 'workflow-toolbar-grip'}
        type="button"
        title="长按后拖动画布工具条"
        aria-label="长按后拖动画布工具条"
        onPointerDown={handleGripPointerDown}
        onPointerMove={handleGripPointerMove}
        onPointerUp={handleGripPointerUpOrCancel}
        onPointerCancel={handleGripPointerUpOrCancel}
      >
        <span className="workflow-toolbar-grip-dots" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} />
          ))}
        </span>
      </button>
      <button className="workflow-toolbar-primary" type="button" onClick={onNewClick}>
        + New
      </button>
      <div className="workflow-toolbar-divider" aria-hidden="true" />
      <button className="workflow-toolbar-btn" type="button" onClick={onZoomIn} title="放大">
        ＋
      </button>
      <button className="workflow-toolbar-btn" type="button" onClick={onZoomOut} title="缩小">
        －
      </button>
      <button className="workflow-toolbar-btn" type="button" onClick={onFitView} title="重置视图">
        ⌂
      </button>
    </div>
  )
}
