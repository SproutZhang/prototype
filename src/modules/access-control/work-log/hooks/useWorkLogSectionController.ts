import { useMemo } from 'react'

import { WORK_LOG_ENTRIES } from '../data/workLogSeed'

/** 工作日志子模块控制器（Admin 全局只读视图） */
export function useWorkLogSectionController() {
  const entries = useMemo(
    () =>
      [...WORK_LOG_ENTRIES].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [],
  )

  return { entries }
}
