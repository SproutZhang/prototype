export type RecruitPassedCandidate = {
  id: string
  /** 提出招聘需求的用人经理成员 ID */
  hmMemberId: string
  roleTitleZh: string
  roleTitleEn: string
  candidateNameZh: string
  candidateNameEn: string
  /** 公司确认入职时间 */
  companyConfirmedAt: string
  /** 招聘方确认时间（已确认时有值） */
  hmConfirmedAt?: string
  summaryZh: string
  summaryEn: string
  detailNotesZh?: string
  detailNotesEn?: string
  status: 'awaiting_confirm' | 'confirmed'
}

/** 公司已确认入职、待招聘方查看确认的候选人（演示） */
export const RECRUIT_PASSED_CANDIDATES_SEED: RecruitPassedCandidate[] = [
  {
    id: 'rpc-chen-xiao',
    hmMemberId: 'member-it-li',
    roleTitleZh: '高级前端工程师',
    roleTitleEn: 'Senior Frontend Engineer',
    candidateNameZh: '陈晓',
    candidateNameEn: 'Chen Xiao',
    companyConfirmedAt: '2026-06-26',
    summaryZh: '公司已确认入职 · 预计 2026-07-15 到岗',
    summaryEn: 'Company confirmed hire · Expected start 2026-07-15',
    detailNotesZh: '候选人终面通过，HR 已完成背调与薪资核定，等待招聘方确认后发放 Offer。',
    detailNotesEn: 'Final interview passed; HR completed background check and salary review. Awaiting hiring manager confirmation to issue the offer.',
    status: 'awaiting_confirm',
  },
  {
    id: 'rpc-zhou-hang',
    hmMemberId: 'member-it-li',
    roleTitleZh: '高级前端工程师',
    roleTitleEn: 'Senior Frontend Engineer',
    candidateNameZh: '周航',
    candidateNameEn: 'Zhou Hang',
    companyConfirmedAt: '2026-06-25',
    summaryZh: '公司已确认入职 · 预计 2026-07-12 到岗',
    summaryEn: 'Company confirmed hire · Expected start 2026-07-12',
    detailNotesZh: '候选人具备 4 年前端经验，技术面试与 HR 面试均已通过。',
    detailNotesEn: 'Candidate has 4 years of frontend experience and passed both technical and HR interviews.',
    status: 'awaiting_confirm',
  },
  {
    id: 'rpc-ma-siyuan',
    hmMemberId: 'member-it-li',
    roleTitleZh: '高级前端工程师',
    roleTitleEn: 'Senior Frontend Engineer',
    candidateNameZh: '马思远',
    candidateNameEn: 'Ma Siyuan',
    companyConfirmedAt: '2026-06-24',
    summaryZh: '公司已确认入职 · 预计 2026-07-10 到岗',
    summaryEn: 'Company confirmed hire · Expected start 2026-07-10',
    detailNotesZh: '候选人 React 与 TypeScript 能力突出，建议优先确认以锁定到岗时间。',
    detailNotesEn: 'Strong React and TypeScript skills; confirm soon to secure the start date.',
    status: 'awaiting_confirm',
  },
  {
    id: 'rpc-zhao-yue',
    hmMemberId: 'member-it-li',
    roleTitleZh: '高级前端工程师',
    roleTitleEn: 'Senior Frontend Engineer',
    candidateNameZh: '赵悦',
    candidateNameEn: 'Zhao Yue',
    companyConfirmedAt: '2026-06-23',
    summaryZh: '公司已确认入职 · 预计 2026-07-08 到岗',
    summaryEn: 'Company confirmed hire · Expected start 2026-07-08',
    detailNotesZh: '候选人已通过终面，HR 已完成背调，等待招聘方确认后发放 Offer。',
    detailNotesEn: 'Final interview passed; HR completed background check. Awaiting hiring manager confirmation to issue the offer.',
    status: 'awaiting_confirm',
  },
  {
    id: 'rpc-sun-lei',
    hmMemberId: 'member-it-li',
    roleTitleZh: '高级前端工程师',
    roleTitleEn: 'Senior Frontend Engineer',
    candidateNameZh: '孙磊',
    candidateNameEn: 'Sun Lei',
    companyConfirmedAt: '2026-06-22',
    summaryZh: '公司已确认入职 · 预计 2026-07-05 到岗',
    summaryEn: 'Company confirmed hire · Expected start 2026-07-05',
    detailNotesZh: '候选人沟通表达良好，与团队文化匹配度高，建议尽快确认入职。',
    detailNotesEn: 'Strong communication and culture fit; recommend confirming onboarding promptly.',
    status: 'awaiting_confirm',
  },
  {
    id: 'rpc-lin-yu',
    hmMemberId: 'member-it-li',
    roleTitleZh: '高级前端工程师',
    roleTitleEn: 'Senior Frontend Engineer',
    candidateNameZh: '林雨',
    candidateNameEn: 'Lin Yu',
    companyConfirmedAt: '2026-06-22',
    hmConfirmedAt: '2026-06-23',
    summaryZh: '公司已确认入职 · 预计 2026-07-08 到岗',
    summaryEn: 'Company confirmed hire · Expected start 2026-07-08',
    detailNotesZh: '招聘方已确认入职，Offer 已发出，等待候选人到岗。',
    detailNotesEn: 'Hiring manager confirmed; offer issued. Awaiting candidate start date.',
    status: 'confirmed',
  },
]

export function filterRecruitPassedCandidatesForHm(
  candidates: readonly RecruitPassedCandidate[],
  hmMemberId: string,
): RecruitPassedCandidate[] {
  return candidates.filter((item) => item.hmMemberId === hmMemberId)
}
