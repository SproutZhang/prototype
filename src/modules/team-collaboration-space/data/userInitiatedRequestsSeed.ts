export type UserInitiatedRequestKind = 'recruit' | 'leave' | 'expense'

export type UserInitiatedRequestStatus = 'pending' | 'approved' | 'rejected'

export type UserInitiatedRequest = {
  id: string
  initiatorMemberId: string
  kind: UserInitiatedRequestKind
  titleZh: string
  titleEn: string
  summaryZh: string
  summaryEn: string
  progressZh: string
  progressEn: string
  status: UserInitiatedRequestStatus
  submittedAt: string
  ticketId?: string
  rejectReason?: string
}

/** User 自行发起的申请（招聘 / 请假 / 报销等，演示；首页对话提交的招聘 JD 会动态追加） */
export const USER_INITIATED_REQUESTS_SEED: UserInitiatedRequest[] = [
  {
    id: 'uir-recruit-fe',
    initiatorMemberId: 'member-it-li',
    kind: 'recruit',
    titleZh: '高级前端工程师 · 招聘 JD',
    titleEn: 'Senior Frontend Engineer · Job Description',
    summaryZh: '招聘需求 · 1 名 · 3 年+ React · Q3 到岗',
    summaryEn: 'Hiring request · 1 headcount · 3+ yrs React · start Q3',
    progressZh: '当前节点：等待 HR 审核 JD',
    progressEn: 'Current step: Pending HR JD review',
    status: 'pending',
    submittedAt: '2026-06-28 11:15',
    ticketId: 'HR-20260628-0042',
  },
  {
    id: 'uir-recruit-backend',
    initiatorMemberId: 'member-it-li',
    kind: 'recruit',
    titleZh: '后端开发工程师 · 招聘 JD',
    titleEn: 'Backend Engineer · Job Description',
    summaryZh: '招聘需求 · 2 名 · 3 年+ Java/Go · Q3 到岗',
    summaryEn: 'Hiring request · 2 headcount · 3+ yrs Java/Go · start Q3',
    progressZh: '当前节点：等待 HR 审核 JD',
    progressEn: 'Current step: Pending HR JD review',
    status: 'pending',
    submittedAt: '2026-06-26 15:30',
    ticketId: 'HR-20260626-0038',
  },
  {
    id: 'uir-recruit-sales',
    initiatorMemberId: 'member-it-li',
    kind: 'recruit',
    titleZh: '销售经理 · 招聘 JD',
    titleEn: 'Sales Manager · Job Description',
    summaryZh: '招聘需求 · 3 名 · 2 年+ 销售经验 · 华东区域 · Q3 到岗',
    summaryEn: 'Hiring request · 3 headcount · 2+ yrs sales · East China · start Q3',
    progressZh: '当前节点：等待 HR 审核 JD',
    progressEn: 'Current step: Pending HR JD review',
    status: 'pending',
    submittedAt: '2026-06-29 10:20',
    ticketId: 'HR-20260629-0045',
  },
  {
    id: 'uir-leave-annual',
    initiatorMemberId: 'member-it-li',
    kind: 'leave',
    titleZh: '年假申请 · 3 天',
    titleEn: 'Annual leave · 3 days',
    summaryZh: '请假申请 · 2026-07-10 至 2026-07-12',
    summaryEn: 'Leave request · Jul 10–12, 2026',
    progressZh: '当前节点：待直属上级审批',
    progressEn: 'Current step: Pending manager approval',
    status: 'pending',
    submittedAt: '2026-06-27 16:40',
    ticketId: 'LV-20260627-0031',
  },
  {
    id: 'uir-expense-trip',
    initiatorMemberId: 'member-it-li',
    kind: 'expense',
    titleZh: '出差报销 · ¥2,380',
    titleEn: 'Travel expense · ¥2,380',
    summaryZh: '报销申请 · 上海客户拜访交通与餐饮',
    summaryEn: 'Reimbursement · Shanghai client visit travel & meals',
    progressZh: '当前节点：财务审核中',
    progressEn: 'Current step: Finance review',
    status: 'pending',
    submittedAt: '2026-06-25 09:20',
    ticketId: 'EX-20260625-0188',
  },
  {
    id: 'uir-expense-supplies',
    initiatorMemberId: 'member-it-li',
    kind: 'expense',
    titleZh: '办公用品采购 · ¥560',
    titleEn: 'Office supplies · ¥560',
    summaryZh: '报销申请 · 键盘、鼠标等办公耗材',
    summaryEn: 'Reimbursement · Keyboard, mouse, and supplies',
    progressZh: '已通过 · 款项将于 3 个工作日内到账',
    progressEn: 'Approved · Payment within 3 business days',
    status: 'approved',
    submittedAt: '2026-06-18 14:05',
    ticketId: 'EX-20260618-0092',
  },
]

export function filterUserInitiatedRequestsForMember(
  requests: readonly UserInitiatedRequest[],
  memberId: string,
): UserInitiatedRequest[] {
  return requests.filter((item) => item.initiatorMemberId === memberId)
}

export function filterCompletedUserInitiatedRequests(
  requests: readonly UserInitiatedRequest[],
): UserInitiatedRequest[] {
  return requests.filter((item) => item.status !== 'pending')
}

export function filterPendingUserInitiatedRequests(
  requests: readonly UserInitiatedRequest[],
): UserInitiatedRequest[] {
  return requests.filter((item) => item.status === 'pending')
}
