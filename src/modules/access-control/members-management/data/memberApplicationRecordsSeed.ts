export type MemberApplicationStatus = 'approved' | 'pending' | 'rejected'

export type MemberApplicationRecord = {
  id: string
  applicantName: string
  phone: string
  customQuestionLabel: string
  customQuestionAnswer: string
  departmentName: string
  sharerName: string
  sharerId: string
  attachmentName?: string
  status: MemberApplicationStatus
}

export const memberApplicationRecordsSeed: MemberApplicationRecord[] = [
  {
    id: 'apply-1',
    applicantName: '周雨珊',
    phone: '+86 13870363738',
    customQuestionLabel: '申请理由',
    customQuestionAnswer: '申请加入',
    departmentName: 'X-studio科技有限公司',
    sharerName: 'jinny',
    sharerId: 'sharer-jinny',
    status: 'approved',
  },
  {
    id: 'apply-2',
    applicantName: '李明',
    phone: '+86 13912345678',
    customQuestionLabel: '申请理由',
    customQuestionAnswer: '希望加入产品团队',
    departmentName: '产品部',
    sharerName: 'jinny',
    sharerId: 'sharer-jinny',
    status: 'pending',
  },
  {
    id: 'apply-3',
    applicantName: '王芳',
    phone: '+86 13698765432',
    customQuestionLabel: '申请理由',
    customQuestionAnswer: '实习申请',
    departmentName: '研发部',
    sharerName: 'Alex',
    sharerId: 'sharer-alex',
    attachmentName: 'resume.pdf',
    status: 'rejected',
  },
]
