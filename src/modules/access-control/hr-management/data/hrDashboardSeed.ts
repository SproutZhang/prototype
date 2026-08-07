export type HrFunnelStep = {
  labelKey: 'hrRecruitStepResume' | 'hrRecruitStepInterview1' | 'hrRecruitStepInterview2' | 'hrRecruitStepOffer'
  value: number
}

export type HrMetricPair = {
  labelKey: string
  value: string
}

export type HrDonutSegment = {
  labelKey: string
  value: number
  color: string
}

export type HrOkrRing = {
  labelKey: string
  percent: number
  color: string
}

export type HrOkrRankItem = {
  nameZh: string
  nameEn: string
  growth: string
  accent: string
}

export type HrQuickEntryItem = {
  id: string
  labelKey: string
  icon: 'roster' | 'onboarding' | 'offboarding' | 'transfer' | 'contract' | 'attendance' | 'payroll' | 'report' | 'settings'
}

export const HR_RECRUITMENT_FUNNEL: HrFunnelStep[] = [
  { labelKey: 'hrRecruitStepResume', value: 1280 },
  { labelKey: 'hrRecruitStepInterview1', value: 640 },
  { labelKey: 'hrRecruitStepInterview2', value: 320 },
  { labelKey: 'hrRecruitStepOffer', value: 96 },
]

export const HR_COMPENSATION_METRICS: HrMetricPair[] = [
  { labelKey: 'hrPayMetricHeadcount', value: '10,000' },
  { labelKey: 'hrPayMetricGross', value: '¥8,520万' },
  { labelKey: 'hrPayMetricNet', value: '¥6,840万' },
  { labelKey: 'hrPayMetricAvg', value: '¥8,520' },
]

export const HR_PERFORMANCE_DONUT: HrDonutSegment[] = [
  { labelKey: 'hrPerfStatusDone', value: 42, color: '#22c55e' },
  { labelKey: 'hrPerfStatusProgress', value: 28, color: '#3b82f6' },
  { labelKey: 'hrPerfStatusPending', value: 18, color: '#f59e0b' },
  { labelKey: 'hrPerfStatusOverdue', value: 12, color: '#ef4444' },
]

export const HR_TRAINING_DONUT: HrDonutSegment[] = [
  { labelKey: 'hrTrainStatusDone', value: 56, color: '#22c55e' },
  { labelKey: 'hrTrainStatusLearning', value: 24, color: '#3b82f6' },
  { labelKey: 'hrTrainStatusNotStarted', value: 14, color: '#f59e0b' },
  { labelKey: 'hrTrainStatusExpired', value: 6, color: '#ef4444' },
]

export const HR_OKR_RINGS: HrOkrRing[] = [
  { labelKey: 'hrOkrCompany', percent: 66, color: '#3b82f6' },
  { labelKey: 'hrOkrTeam', percent: 48, color: '#8b5cf6' },
  { labelKey: 'hrOkrPersonal', percent: 52, color: '#14b8a6' },
]

export const HR_OKR_RANKING: HrOkrRankItem[] = [
  { nameZh: '张敏', nameEn: 'Zhang Min', growth: '+18%', accent: '#6366f1' },
  { nameZh: '李工', nameEn: 'Li Gong', growth: '+15%', accent: '#0ea5e9' },
  { nameZh: '王经理', nameEn: 'Manager Wang', growth: '+12%', accent: '#8b5cf6' },
  { nameZh: '陈运营', nameEn: 'Chen Ops', growth: '+9%', accent: '#f59e0b' },
]

export const HR_QUICK_ENTRIES: HrQuickEntryItem[] = [
  { id: 'roster', labelKey: 'hrQuickRoster', icon: 'roster' },
  { id: 'onboarding', labelKey: 'hrQuickOnboarding', icon: 'onboarding' },
  { id: 'offboarding', labelKey: 'hrQuickOffboarding', icon: 'offboarding' },
  { id: 'transfer', labelKey: 'hrQuickTransfer', icon: 'transfer' },
  { id: 'contract', labelKey: 'hrQuickContract', icon: 'contract' },
  { id: 'attendance', labelKey: 'hrQuickAttendance', icon: 'attendance' },
  { id: 'payroll', labelKey: 'hrQuickPayroll', icon: 'payroll' },
  { id: 'report', labelKey: 'hrQuickReport', icon: 'report' },
  { id: 'settings', labelKey: 'hrQuickSettings', icon: 'settings' },
]

export type HrTodoItem = {
  id: string
  labelKey: string
  count: number
  tone?: 'default' | 'urgent'
}

export const HR_TODO_ITEMS: HrTodoItem[] = [
  { id: 'onboarding-approval', labelKey: 'hrTodoOnboardingApproval', count: 5, tone: 'urgent' },
  { id: 'probation-review', labelKey: 'hrTodoProbationReview', count: 3 },
  { id: 'offboarding', labelKey: 'hrTodoOffboarding', count: 2 },
  { id: 'contract-renewal', labelKey: 'hrTodoContractRenewal', count: 4 },
  { id: 'attendance-exception', labelKey: 'hrTodoAttendanceException', count: 7 },
]

/** 演示折线图点位（归一化 0–100） */
export const HR_COMPENSATION_LINE_A = [42, 48, 45, 52, 58, 55, 62, 68, 64, 72, 78, 82]
export const HR_COMPENSATION_LINE_B = [38, 40, 44, 46, 50, 53, 56, 60, 58, 65, 70, 74]
export const HR_PERFORMANCE_LINE_A = [35, 42, 40, 48, 52, 50, 58, 62, 60, 66, 70, 75]
export const HR_PERFORMANCE_LINE_B = [30, 32, 36, 38, 42, 45, 48, 52, 50, 55, 58, 62]
