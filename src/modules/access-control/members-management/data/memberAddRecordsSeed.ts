import type { MockAccountType } from '../../utils/memberDirectoryDisplay'

export type MemberAddRecordStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export type MemberAddRecord = {
  id: string
  inviteeName: string
  phone: string
  departmentName: string
  accountType: MockAccountType
  inviterName: string
  inviterId: string
  status: MemberAddRecordStatus
}

export const memberAddRecordsSeed: MemberAddRecord[] = [
  {
    id: 'add-1',
    inviteeName: '陈思远',
    phone: '+86 13700001111',
    departmentName: '产品部',
    accountType: 'formal',
    inviterName: 'jinny',
    inviterId: 'sharer-jinny',
    status: 'pending',
  },
  {
    id: 'add-2',
    inviteeName: '赵晓雯',
    phone: '+86 13800002222',
    departmentName: '研发部',
    accountType: 'intern',
    inviterName: 'jinny',
    inviterId: 'sharer-jinny',
    status: 'accepted',
  },
  {
    id: 'add-3',
    inviteeName: '张伟',
    phone: '+86 13900003333',
    departmentName: '设计部',
    accountType: 'outsource',
    inviterName: 'Alex',
    inviterId: 'sharer-alex',
    status: 'expired',
  },
  {
    id: 'add-4',
    inviteeName: '刘婷',
    phone: '+86 13600004444',
    departmentName: '市场部',
    accountType: 'formal',
    inviterName: 'jinny',
    inviterId: 'sharer-jinny',
    status: 'revoked',
  },
]
