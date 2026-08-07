import type { AppLocale } from '../../../i18n/homeStrings'
import type { OrgMember } from '../types'
import { ORG_MEMBERS_SEED } from './orgMembersSeed'

const GENERATED_MEMBER_COUNT = 392

const SURNAME_ZH = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高']
const GIVEN_ZH = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '建华', '建国', '志强']
const DEPT_ZH = ['产品部', '研发部', '人力资源部', '信息技术部', '运营部', '销售部', '法务部', '市场部', '财务部', '客服部']
const DEPT_EN = ['Product', 'R&D', 'Human Resources', 'IT', 'Operations', 'Sales', 'Legal', 'Marketing', 'Finance', 'Customer Support']

function generateOrgMembers(): OrgMember[] {
  return Array.from({ length: GENERATED_MEMBER_COUNT }, (_, index) => {
    const num = index + 1
    const surname = SURNAME_ZH[index % SURNAME_ZH.length]
    const given = GIVEN_ZH[(index * 3 + 7) % GIVEN_ZH.length]
    const deptIdx = index % DEPT_ZH.length
    const nameZh = `${surname}${given}${num}`
    const nameEn = `Employee ${num}`
    return {
      id: `member-gen-${String(num).padStart(3, '0')}`,
      nameZh,
      nameEn,
      email: `employee${num}@company.com`,
      departmentZh: DEPT_ZH[deptIdx]!,
      departmentEn: DEPT_EN[deptIdx]!,
    }
  })
}

/** 约 400 人的组织成员目录（含种子成员 + 生成成员） */
export const ORG_MEMBERS_CATALOG: OrgMember[] = [...ORG_MEMBERS_SEED, ...generateOrgMembers()]

export const ORG_MEMBER_IDS: string[] = ORG_MEMBERS_CATALOG.map((member) => member.id)

export function getOrgMemberById(id: string): OrgMember | undefined {
  return ORG_MEMBERS_CATALOG.find((member) => member.id === id)
}

export function localizeOrgMemberName(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.nameZh : member.nameEn
}

export function resolveOrgMemberName(id: string, locale: AppLocale): string | null {
  const member = getOrgMemberById(id)
  if (!member) return null
  return localizeOrgMemberName(member, locale)
}

export function resolveOrgMemberDisplay(id: string, locale: AppLocale): string | null {
  const member = getOrgMemberById(id)
  if (!member) return null
  return member.email || localizeOrgMemberName(member, locale)
}

const MEMBER_WORKSPACE_BY_DEPT_ZH: Record<string, { zh: string; en: string }> = {
  产品部: { zh: '产品工作区', en: 'Product workspace' },
  研发部: { zh: '研发工作区', en: 'Engineering workspace' },
  人力资源部: { zh: '人力资源工作区', en: 'HR workspace' },
  信息技术部: { zh: '信息技术工作区', en: 'IT workspace' },
  运营部: { zh: '运营工作区', en: 'Operations workspace' },
  销售部: { zh: '销售工作区', en: 'Sales workspace' },
  法务部: { zh: '法务工作区', en: 'Legal workspace' },
  市场部: { zh: '市场工作区', en: 'Marketing workspace' },
  财务部: { zh: '财务工作区', en: 'Finance workspace' },
  客服部: { zh: '客服工作区', en: 'Support workspace' },
}

const FALLBACK_WORKSPACE = { zh: '公共空间', en: 'Public Space' }

export type WorkspaceOption = {
  id: string
  departmentZh: string
  departmentEn: string
  labelZh: string
  labelEn: string
}

/** 创建工作区时可选择的工作区列表 */
export const WORKSPACE_OPTIONS: WorkspaceOption[] = [
  {
    id: 'default',
    departmentZh: '默认',
    departmentEn: 'Default',
    labelZh: FALLBACK_WORKSPACE.zh,
    labelEn: FALLBACK_WORKSPACE.en,
  },
  ...Object.entries(MEMBER_WORKSPACE_BY_DEPT_ZH).map(([departmentZh, labels], index) => ({
    id: `workspace-${index}`,
    departmentZh,
    departmentEn: DEPT_EN[DEPT_ZH.indexOf(departmentZh)] ?? departmentZh,
    labelZh: labels.zh,
    labelEn: labels.en,
  })),
]

export function getWorkspaceOptionById(id: string): WorkspaceOption | undefined {
  return WORKSPACE_OPTIONS.find((option) => option.id === id)
}

export function localizeWorkspaceOption(option: WorkspaceOption, locale: AppLocale): string {
  return locale === 'zh' ? option.labelZh : option.labelEn
}

export function resolveMemberWorkspaceLabel(memberId: string, locale: AppLocale): string {
  const member = getOrgMemberById(memberId)
  if (!member) return locale === 'zh' ? FALLBACK_WORKSPACE.zh : FALLBACK_WORKSPACE.en
  const labels = MEMBER_WORKSPACE_BY_DEPT_ZH[member.departmentZh] ?? FALLBACK_WORKSPACE
  return locale === 'zh' ? labels.zh : labels.en
}
