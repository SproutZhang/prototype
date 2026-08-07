export type HrWorkforceStatKey =
  | 'total'
  | 'fullTime'
  | 'partTime'
  | 'intern'
  | 'laborDispatch'
  | 'probation'
  | 'regularized'
  | 'pendingResignation'

export type HrWorkforceStats = Record<HrWorkforceStatKey, number>

/** 演示：组织人事概览统计（与成员目录规模大致对齐） */
export const HR_WORKFORCE_STATS: HrWorkforceStats = {
  total: 412,
  fullTime: 318,
  partTime: 24,
  intern: 38,
  laborDispatch: 12,
  probation: 19,
  regularized: 356,
  pendingResignation: 7,
}

export const HR_EMPLOYMENT_TYPE_STAT_KEYS: HrWorkforceStatKey[] = [
  'total',
  'fullTime',
  'partTime',
  'intern',
  'laborDispatch',
]

export const HR_TENURE_STAT_KEYS: HrWorkforceStatKey[] = [
  'probation',
  'regularized',
  'pendingResignation',
]
