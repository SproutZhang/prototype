import type { KnowledgeBaseIntegrationProvider } from '../types'

export type KnowledgeBaseIntegrationFolderFile = {
  id: string
  nameZh: string
  nameEn: string
  sizeLabel: string
  disabled?: boolean
}

export type KnowledgeBaseIntegrationFolder = {
  id: string
  nameZh: string
  nameEn: string
  itemCount: number
  sizeLabel: string
  disabled?: boolean
  files: KnowledgeBaseIntegrationFolderFile[]
}

export const INTEGRATION_FOLDERS: Record<KnowledgeBaseIntegrationProvider, KnowledgeBaseIntegrationFolder[]> = {
  feishu: [
    {
      id: 'feishu-hr-docs',
      nameZh: 'HR 文档库',
      nameEn: 'HR Document Library',
      itemCount: 24,
      sizeLabel: '2.4 MB',
      files: [
        { id: 'feishu-hr-docs-1', nameZh: '2026 年度福利政策说明.docx', nameEn: '2026 Benefits Policy.docx', sizeLabel: '680 KB' },
        { id: 'feishu-hr-docs-2', nameZh: '劳动合同模板.pdf', nameEn: 'Employment Contract Template.pdf', sizeLabel: '420 KB' },
        { id: 'feishu-hr-docs-3', nameZh: '试用期考核流程.md', nameEn: 'Probation Review Process.md', sizeLabel: '128 KB' },
      ],
    },
    {
      id: 'feishu-hr-training',
      nameZh: '人事培训空间',
      nameEn: 'HR Training Space',
      itemCount: 12,
      sizeLabel: '856 KB',
      files: [
        { id: 'feishu-hr-training-1', nameZh: '新员工入职培训录播.mp4', nameEn: 'Onboarding Training.mp4', sizeLabel: '128.6 MB' },
        { id: 'feishu-hr-training-2', nameZh: '企业文化宣讲.pptx', nameEn: 'Culture Orientation.pptx', sizeLabel: '3.2 MB' },
      ],
    },
    {
      id: 'feishu-hr-sheets',
      nameZh: 'HR 数据表格',
      nameEn: 'HR Data Sheets',
      itemCount: 8,
      sizeLabel: '248 KB',
      files: [
        { id: 'feishu-hr-sheets-1', nameZh: '员工考勤统计表.xlsx', nameEn: 'Attendance Stats.xlsx', sizeLabel: '96 KB' },
        { id: 'feishu-hr-sheets-2', nameZh: '假期余额汇总.xlsx', nameEn: 'Leave Balance.xlsx', sizeLabel: '72 KB' },
      ],
    },
    {
      id: 'feishu-wiki',
      nameZh: '企业百科',
      nameEn: 'Company Wiki',
      itemCount: 16,
      sizeLabel: '1.1 MB',
      files: [
        { id: 'feishu-wiki-1', nameZh: '入职 FAQ', nameEn: 'Onboarding FAQ', sizeLabel: '64 KB' },
        { id: 'feishu-wiki-2', nameZh: '各部门对接人', nameEn: 'Department Contacts', sizeLabel: '48 KB' },
      ],
    },
    {
      id: 'feishu-onboarding',
      nameZh: '入职专区',
      nameEn: 'Onboarding Zone',
      itemCount: 6,
      sizeLabel: '128 KB',
      disabled: true,
      files: [
        { id: 'feishu-onboarding-1', nameZh: '首周任务清单.xlsx', nameEn: 'Week-One Tasks.xlsx', sizeLabel: '48 KB', disabled: true },
      ],
    },
  ],
  notion: [
    {
      id: 'notion-hr-ops',
      nameZh: 'HR 运营中心',
      nameEn: 'HR Operations Hub',
      itemCount: 18,
      sizeLabel: '1.8 MB',
      files: [
        { id: 'notion-hr-ops-1', nameZh: 'Offer 发放流程', nameEn: 'Offer Process', sizeLabel: '220 KB' },
        { id: 'notion-hr-ops-2', nameZh: '首周 checklist', nameEn: 'Week-One Checklist', sizeLabel: '96 KB' },
      ],
    },
    {
      id: 'notion-training',
      nameZh: '培训资源库',
      nameEn: 'Training Resources',
      itemCount: 10,
      sizeLabel: '620 KB',
      files: [
        { id: 'notion-training-1', nameZh: 'HR 系统操作演示.mp4', nameEn: 'HR System Walkthrough.mp4', sizeLabel: '86.4 MB' },
      ],
    },
    {
      id: 'notion-registry',
      nameZh: '人事台账',
      nameEn: 'HR Registry',
      itemCount: 7,
      sizeLabel: '156 KB',
      files: [
        { id: 'notion-registry-1', nameZh: '新员工信息采集表.xlsx', nameEn: 'New Hire Info Form.xlsx', sizeLabel: '156 KB' },
      ],
    },
    {
      id: 'notion-org-kb',
      nameZh: '组织知识库',
      nameEn: 'Org Knowledge Base',
      itemCount: 14,
      sizeLabel: '920 KB',
      files: [
        { id: 'notion-org-kb-1', nameZh: '部门对接人索引', nameEn: 'Contact Directory', sizeLabel: '88 KB' },
      ],
    },
  ],
  confluence: [
    {
      id: 'confluence-hr-policy',
      nameZh: 'HR 政策空间',
      nameEn: 'HR Policy Space',
      itemCount: 22,
      sizeLabel: '3.2 MB',
      files: [
        { id: 'confluence-hr-policy-1', nameZh: '全球入职合规要求汇总.pdf', nameEn: 'Global Compliance Summary.pdf', sizeLabel: '1.2 MB' },
        { id: 'confluence-hr-policy-2', nameZh: '远程入职设备寄送 SOP', nameEn: 'Remote Device Shipping SOP', sizeLabel: '480 KB' },
      ],
    },
    {
      id: 'confluence-compliance',
      nameZh: '合规培训',
      nameEn: 'Compliance Training',
      itemCount: 9,
      sizeLabel: '480 KB',
      files: [
        { id: 'confluence-compliance-1', nameZh: '信息安全培训录像.mp4', nameEn: 'InfoSec Training.mp4', sizeLabel: '64.2 MB' },
      ],
    },
    {
      id: 'confluence-policy-registry',
      nameZh: '政策台账',
      nameEn: 'Policy Registry',
      itemCount: 5,
      sizeLabel: '96 KB',
      files: [
        { id: 'confluence-policy-registry-1', nameZh: '各区域假期政策对照表.xlsx', nameEn: 'Regional Leave Policy.xlsx', sizeLabel: '96 KB' },
      ],
    },
    {
      id: 'confluence-help',
      nameZh: 'HR 帮助中心',
      nameEn: 'HR Help Center',
      itemCount: 11,
      sizeLabel: '740 KB',
      files: [
        { id: 'confluence-help-1', nameZh: '入职常见问题与解答', nameEn: 'Onboarding FAQ', sizeLabel: '128 KB' },
      ],
    },
  ],
}

export function getIntegrationFolders(provider: KnowledgeBaseIntegrationProvider): KnowledgeBaseIntegrationFolder[] {
  return INTEGRATION_FOLDERS[provider]
}

export function getFolderSelectableIds(folder: KnowledgeBaseIntegrationFolder): string[] {
  if (folder.disabled) return []
  const fileIds = folder.files.filter((file) => !file.disabled).map((file) => file.id)
  return [folder.id, ...fileIds]
}

export function getAllSelectableIds(folders: KnowledgeBaseIntegrationFolder[]): string[] {
  return folders.flatMap((folder) => getFolderSelectableIds(folder))
}
