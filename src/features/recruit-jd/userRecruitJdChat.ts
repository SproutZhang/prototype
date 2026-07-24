import type { AppLocale } from '../../i18n/homeStrings'
import type { UserInitiatedRequest } from '../../modules/team-collaboration-space/data/userInitiatedRequestsSeed'

export type UserRecruitJdTurn = 'idle' | 'awaitConfirm' | 'done'

export type RecruitRequirements = {
  title: string
  count: string
  level: string
  skills: string[]
  experience: string
  location: string
  salary: string
  timeline: string
  rawNotes: string[]
}

const RECRUIT_ENTRY_PATTERN =
  /招聘|招(?:聘)?|岗位|JD|job\s*description|hire|recruiting|opening|headcount|工程师|经理|设计师|分析师|专员/i

const SKILL_KEYWORDS = [
  'React',
  'Vue',
  'Angular',
  'TypeScript',
  'JavaScript',
  'Node',
  'Python',
  'Java',
  'Go',
  'Rust',
  'SQL',
  'Figma',
  'Product',
  'HR',
  'Sales',
]

function emptyRequirements(): RecruitRequirements {
  return {
    title: '',
    count: '',
    level: '',
    skills: [],
    experience: '',
    location: '',
    salary: '',
    timeline: '',
    rawNotes: [],
  }
}

export function createRecruitRequirements(): RecruitRequirements {
  return emptyRequirements()
}

export function isRecruitJdEntry(text: string): boolean {
  return RECRUIT_ENTRY_PATTERN.test(text.trim())
}

function extractTitle(text: string, locale: AppLocale): string {
  const hireMatch = text.match(/(?:招聘|招(?:聘)?)\s*(?:一名|一位|1?\s*名)?\s*([^，,。.\n]{2,24})/i)
  if (hireMatch?.[1]) {
    return hireMatch[1]
      .replace(/(?:高级|资深|初级|中级|专家)/g, (m) => m)
      .replace(/\d+\s*年.*$/g, '')
      .trim()
  }

  const roleMatch = text.match(
    /((?:高级|资深|初级|中级|专家)?\s*(?:前端|后端|全栈|产品|设计|运营|销售|人力|财务|测试|运维|数据|算法|AI|Java|React)[^\s，,。.\n]{0,12})/i,
  )
  if (roleMatch?.[1]) return roleMatch[1].trim()

  return locale === 'zh' ? '' : ''
}

function extractCount(text: string): string {
  const m = text.match(/(\d+)\s*(?:名|人|位|个(?:人|岗位)?)/)
  if (m) return m[1]
  if (/一名|一位|一个岗位|one\s+(?:person|role|position)/i.test(text)) return '1'
  return ''
}

function extractLevel(text: string): string {
  if (/资深|专家|senior|staff|principal/i.test(text)) return 'Senior'
  if (/高级|advanced/i.test(text)) return 'Senior'
  if (/中级|mid/i.test(text)) return 'Mid'
  if (/初级|junior|entry/i.test(text)) return 'Junior'
  return ''
}

function extractExperience(text: string): string {
  const m = text.match(/(\d+)\s*(?:年|years?)\s*(?:\+|以上|及以上|experience)?/i)
  return m ? `${m[1]}+` : ''
}

function extractSkills(text: string, prev: string[]): string[] {
  const found = new Set(prev)
  for (const skill of SKILL_KEYWORDS) {
    if (new RegExp(skill, 'i').test(text)) found.add(skill)
  }
  const plusMatch = text.match(/(?:熟悉|精通|掌握|要求|skills?)[:：]?\s*([^，,。.\n]+)/i)
  if (plusMatch?.[1]) {
    plusMatch[1]
      .split(/[、,/+\s]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2)
      .forEach((part) => found.add(part))
  }
  return [...found]
}

function extractLocation(text: string): string {
  if (/远程|remote|hybrid|混合办公/i.test(text)) return 'Remote / Hybrid'
  const city = text.match(/(北京|上海|深圳|广州|杭州|成都|Singapore|Shanghai|Beijing)/i)
  if (city) return city[1]
  return ''
}

function extractSalary(text: string): string {
  const m = text.match(/(\d+)\s*[-–~到至]\s*(\d+)\s*([kK万]?)/)
  if (m) return `${m[1]}-${m[2]}${m[3] || 'K'}`
  const single = text.match(/(?:预算|薪资|salary)[:：]?\s*(\d+\s*[kK万]?)/i)
  if (single?.[1]) return single[1]
  return ''
}

function extractTimeline(text: string): string {
  const q = text.match(/Q[1-4]/i)
  if (q) return q[0].toUpperCase()
  const month = text.match(/(\d+)\s*月(?:内|前|到岗)?/)
  if (month) return localeTimelineMonth(month[1])
  if (/尽快|asap|immediately/i.test(text)) return 'ASAP'
  return ''
}

function localeTimelineMonth(month: string): string {
  return `${month} 个月内到岗`
}

export function parseRecruitRequirements(text: string, prev?: RecruitRequirements, locale: AppLocale = 'zh'): RecruitRequirements {
  const base = prev ? { ...prev, skills: [...prev.skills], rawNotes: [...prev.rawNotes] } : emptyRequirements()
  const trimmed = text.trim()
  if (!trimmed) return base

  base.rawNotes.push(trimmed)

  const title = extractTitle(trimmed, locale)
  if (title) base.title = title

  const count = extractCount(trimmed)
  if (count) base.count = count

  const level = extractLevel(trimmed)
  if (level) base.level = level

  const experience = extractExperience(trimmed)
  if (experience) base.experience = experience

  base.skills = extractSkills(trimmed, base.skills)

  const location = extractLocation(trimmed)
  if (location) base.location = location

  const salary = extractSalary(trimmed)
  if (salary) base.salary = salary

  const timeline = extractTimeline(trimmed)
  if (timeline) base.timeline = timeline

  return base
}

export type RecruitFieldKey = 'title' | 'count' | 'skills'

export function getMissingRecruitFields(req: RecruitRequirements): RecruitFieldKey[] {
  const missing: RecruitFieldKey[] = []
  if (!req.title.trim()) missing.push('title')
  if (!req.count.trim()) missing.push('count')
  if (req.skills.length === 0 && !req.experience) missing.push('skills')
  return missing
}

export function recruitJdEntryHint(locale: AppLocale): string {
  return locale === 'zh'
    ? '你好，我是招聘助手。请用一句话描述你的招聘需求，例如：「招 1 名高级前端，3 年+ React，远程可谈，预算 25–35K，Q3 到岗」。'
    : 'Hi, I can draft a job description for you. Describe the role in one message, e.g. “Hire 1 senior frontend engineer, 3+ years React, remote OK, budget 25–35K, start in Q3.”'
}

export function buildRecruitFollowUpQuestion(locale: AppLocale, missing: RecruitFieldKey[]): string {
  const labels =
    locale === 'zh'
      ? { title: '岗位名称', count: '招聘人数', skills: '核心技能或经验要求' }
      : { title: 'job title', count: 'headcount', skills: 'core skills or experience' }
  const parts = missing.map((key) => labels[key])
  return locale === 'zh'
    ? `为了生成 JD，还需要补充：${parts.join('、')}。请继续说明。`
    : `To draft the JD, I still need: ${parts.join(', ')}. Please add those details.`
}

function displayTitle(req: RecruitRequirements, locale: AppLocale): string {
  if (req.title) {
    const prefix = req.level && !req.title.includes(req.level) ? `${req.level} ` : ''
    return `${prefix}${req.title}`.trim()
  }
  return locale === 'zh' ? '待定岗位' : 'Role TBD'
}

export function buildRecruitJdDocument(locale: AppLocale, req: RecruitRequirements): string {
  const title = displayTitle(req, locale)
  const count = req.count || '1'
  const location = req.location || (locale === 'zh' ? '待定' : 'TBD')
  const salary = req.salary || (locale === 'zh' ? '面议' : 'Negotiable')
  const timeline = req.timeline || (locale === 'zh' ? '尽快' : 'ASAP')
  const skills =
    req.skills.length > 0
      ? req.skills.join(locale === 'zh' ? '、' : ', ')
      : locale === 'zh'
        ? '见任职要求'
        : 'See requirements'
  const experience = req.experience || (locale === 'zh' ? '3 年及以上相关经验' : '3+ years relevant experience')

  if (locale === 'zh') {
    return [
      `【${title}】招聘 JD（草案）`,
      '',
      `· 招聘人数：${count} 名`,
      `· 工作地点：${location}`,
      `· 薪资范围：${salary}`,
      `· 期望到岗：${timeline}`,
      '',
      '岗位职责',
      `1. 负责 ${title} 相关的核心交付与跨团队协作`,
      '2. 参与需求评审、方案设计与质量把控',
      '3. 持续优化流程效率与用户体验',
      '',
      '任职要求',
      `1. ${experience}`,
      `2. 熟练掌握 ${skills}`,
      '3. 具备良好的沟通协作与问题解决能力',
      '',
      '加分项',
      '1. 有同类岗位或行业背景者优先',
      '2. 具备英文读写能力者优先',
    ].join('\n')
  }

  return [
    `[${title}] Job Description (Draft)`,
    '',
    `· Headcount: ${count}`,
    `· Location: ${location}`,
    `· Compensation: ${salary}`,
    `· Target start: ${timeline}`,
    '',
    'Responsibilities',
    `1. Own core deliverables as ${title}`,
    '2. Collaborate with product, design, and engineering partners',
    '3. Improve quality, efficiency, and user outcomes',
    '',
    'Requirements',
    `1. ${experience}`,
    `2. Strong skills in ${skills}`,
    '3. Clear communication and problem-solving ability',
    '',
    'Nice to have',
    '1. Prior experience in a similar role or domain',
    '2. Professional English communication',
  ].join('\n')
}

export function buildRecruitJdReadyReply(locale: AppLocale, jd: string): string {
  const lead =
    locale === 'zh'
      ? '已根据你的需求生成岗位 JD 草案，请确认是否提交 HR 审核：'
      : 'Here is the draft JD based on your requirements. Confirm to submit to HR for review:'
  return `${lead}\n\n${jd}`
}

export function recruitJdConfirmChoices(locale: AppLocale): string[] {
  return locale === 'zh' ? ['确认并提交 HR', '继续修改'] : ['Confirm & submit to HR', 'Continue editing']
}

export function recruitJdAskWhatToEdit(locale: AppLocale): string {
  return locale === 'zh'
    ? '好的，请直接说明需要修改的内容，例如：「把经验改成 5 年」「增加 TypeScript 要求」。'
    : 'Sure — tell me what to change, e.g. “Change experience to 5 years” or “Add TypeScript requirement”.'
}

export function isRecruitJdConfirmIntent(text: string, locale: AppLocale): boolean {
  const normalized = text.trim().toLowerCase()
  const choices = recruitJdConfirmChoices(locale).map((c) => c.toLowerCase())
  if (choices.some((c) => c === normalized)) return true
  return /确认并提交|确认提交|提交\s*hr|submit to hr|confirm (&|and) submit/i.test(text)
}

export function isRecruitJdContinueEditIntent(text: string, locale: AppLocale): boolean {
  const normalized = text.trim().toLowerCase()
  const editChoice = recruitJdConfirmChoices(locale)[1]?.toLowerCase()
  if (editChoice && normalized === editChoice) return true
  return /^(继续修改|再改|修改一下|continue editing|revise)$/i.test(text.trim())
}

export function buildHrTicketId(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `JD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${suffix}`
}

export function buildRecruitHrSubmitReply(locale: AppLocale, req: RecruitRequirements, ticketId: string): string {
  const title = displayTitle(req, locale)
  if (locale === 'zh') {
    return [
      `已提交 HR 审核（单号 ${ticketId}）。`,
      '',
      `· 岗位：${title}`,
      '· 当前状态：等待 HR 审核 JD',
      '· 预计反馈：2 个工作日内',
      '',
      'HR 审核通过后将进入「批准发布」环节；你可在本对话或项目空间「我发起的」中查看进度。',
    ].join('\n')
  }
  return [
    `Submitted to HR for review (ticket ${ticketId}).`,
    '',
    `· Role: ${title}`,
    '· Status: Pending HR JD review',
    '· Expected response: within 2 business days',
    '',
    'After HR approval, the posting will move to publish review. Track progress here or in Project Space → Initiated by me.',
  ].join('\n')
}

function formatRecruitRoleTitle(req: RecruitRequirements, locale: AppLocale): string {
  let title = displayTitle(req, locale)
  if (locale === 'zh') {
    title = title.replace(/^Senior\s+/i, '').replace(/^Mid\s+/i, '中级').replace(/^Junior\s+/i, '初级')
    if (!/工程师|经理|设计师|专员|分析师/.test(title) && /前端|后端|全栈|测试|运维|产品/.test(title)) {
      title = `${title}工程师`
    }
  }
  return title
}

export function buildUserInitiatedRecruitRequest(
  locale: AppLocale,
  req: RecruitRequirements,
  ticketId: string,
  memberId: string,
): UserInitiatedRequest {
  const count = req.count || '1'
  const experience = req.experience || (locale === 'zh' ? '3 年+' : '3+ yrs')
  const skills =
    req.skills.length > 0
      ? req.skills.join(locale === 'zh' ? '、' : ', ')
      : locale === 'zh'
        ? 'React'
        : 'React'
  const timeline = req.timeline || (locale === 'zh' ? 'Q3 到岗' : 'start Q3')
  const now = new Date()
  const submittedAt = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return {
    id: `uir-recruit-${ticketId}`,
    initiatorMemberId: memberId,
    kind: 'recruit',
    titleZh: `${formatRecruitRoleTitle(req, 'zh')} · 招聘 JD`,
    titleEn: `${formatRecruitRoleTitle(req, 'en')} · Job Description`,
    summaryZh: `招聘需求 · ${count} 名 · ${experience} ${skills} · ${timeline}`,
    summaryEn: `Hiring request · ${count} headcount · ${experience} ${skills} · ${timeline}`,
    progressZh: '当前节点：等待 HR 审核 JD',
    progressEn: 'Current step: Pending HR JD review',
    status: 'pending',
    submittedAt,
    ticketId,
  }
}

export function recruitJdDoneHint(locale: AppLocale): string {
  return locale === 'zh'
    ? '该招聘 JD 已提交 HR 处理中。如需新建岗位，请直接描述新的招聘需求。'
    : 'This JD is already with HR. To start a new role, describe a new hiring request.'
}
